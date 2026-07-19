import { PidKey, buildPidRequest, parsePidResponse, parseDtcResponse, parseClearResponse, DecodedDtc } from './obd2';

interface BleProfile {
  name: string;
  service: string;
  write: string;
  notify: string;
}

/**
 * Known GATT service/characteristic UUIDs used by common ELM327-based
 * Bluetooth LE OBD-II adapters (e.g. Vgate iCar Pro BLE, generic
 * "OBDII BLE" clones using CC254x/HM-10 style serial modules).
 *
 * If your adapter isn't recognized, its GATT profile just needs to be
 * added here — the ELM327 AT command protocol underneath is identical.
 */
const KNOWN_PROFILES: BleProfile[] = [
  { name: 'Generic ELM327 BLE (FFF0)', service: '0000fff0-0000-1000-8000-00805f9b34fb', write: '0000fff2-0000-1000-8000-00805f9b34fb', notify: '0000fff1-0000-1000-8000-00805f9b34fb' },
  { name: 'HM-10 Serial (FFE0)', service: '0000ffe0-0000-1000-8000-00805f9b34fb', write: '0000ffe1-0000-1000-8000-00805f9b34fb', notify: '0000ffe1-0000-1000-8000-00805f9b34fb' },
];

type PendingResolver = { resolve: (v: string) => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout> };

export class HardwareService {
  private device: any = null;
  private server: any = null;
  private writeChar: any = null;
  private notifyChar: any = null;
  private connected = false;
  private protocolName = 'UNKNOWN';

  private rxBuffer = '';
  private pending: PendingResolver[] = [];
  private commandQueue: Promise<any> = Promise.resolve();

  async connect(): Promise<{ success: boolean; message: string }> {
    const nav = navigator as any;

    if (!nav.bluetooth) {
      return { success: false, message: 'Web Bluetooth is not available in this browser/context. Use Chrome or Edge on Android with an ELM327 Bluetooth LE OBD-II adapter.' };
    }

    try {
      this.device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: KNOWN_PROFILES.map(p => p.service),
      });

      this.server = await this.device.gatt.connect();

      let matchedProfile: BleProfile | null = null;
      for (const profile of KNOWN_PROFILES) {
        try {
          const service = await this.server.getPrimaryService(profile.service);
          this.writeChar = await service.getCharacteristic(profile.write);
          this.notifyChar = profile.notify === profile.write
            ? this.writeChar
            : await service.getCharacteristic(profile.notify);
          matchedProfile = profile;
          break;
        } catch {
          continue;
        }
      }

      if (!matchedProfile) {
        this.disconnect();
        return {
          success: false,
          message: `Connected to "${this.device.name || 'device'}" but its GATT service UUID isn't in the known ELM327 adapter list yet. Tell me the adapter model and I'll add its profile.`,
        };
      }

      await this.notifyChar.startNotifications();
      this.notifyChar.addEventListener('characteristicvaluechanged', this.handleNotification);

      await this.initElm327();
      this.connected = true;
      return { success: true, message: `Linked: ${this.device.name || matchedProfile.name}` };
    } catch (error: any) {
      if (error?.name === 'NotFoundError') {
        return { success: false, message: 'No device selected.' };
      }
      return { success: false, message: error?.message || 'Bluetooth connection failed.' };
    }
  }

  private async initElm327() {
    await this.sendCommand('ATZ', 3000).catch(() => {});
    await this.sendCommand('ATE0').catch(() => {});
    await this.sendCommand('ATL0').catch(() => {});
    await this.sendCommand('ATS0').catch(() => {});
    await this.sendCommand('ATH0').catch(() => {});
    await this.sendCommand('ATSP0').catch(() => {});
    // Force a protocol handshake, then read back which one the adapter negotiated with the vehicle.
    await this.sendCommand('0100').catch(() => {});
    try {
      const proto = await this.sendCommand('ATDP');
      this.protocolName = proto.replace(/[\r\n>]/g, '').trim() || 'UNKNOWN';
    } catch {
      this.protocolName = 'UNKNOWN';
    }
  }

  getProtocolName(): string {
    return this.protocolName;
  }

  private handleNotification = (event: Event) => {
    const value: DataView | undefined = (event.target as any)?.value;
    if (!value) return;
    const text = new TextDecoder().decode(value);
    this.rxBuffer += text;

    if (this.rxBuffer.includes('>')) {
      const [response] = this.rxBuffer.split('>');
      this.rxBuffer = '';
      this.dispatchTraffic('RX', response.trim());
      const next = this.pending.shift();
      if (next) {
        clearTimeout(next.timer);
        next.resolve(response.trim());
      }
    }
  };

  private dispatchTraffic(direction: 'TX' | 'RX', cmd: string) {
    window.dispatchEvent(new CustomEvent('can-bus-tx', {
      detail: { direction, cmd, timestamp: Date.now() },
    }));
  }

  /** Sends a raw AT/OBD command and waits for the ELM327 '>' prompt. Commands are serialized since the adapter processes one at a time. */
  sendCommand(cmd: string, timeoutMs = 2000): Promise<string> {
    const run = () => this.sendCommandNow(cmd, timeoutMs);
    const result = this.commandQueue.then(run, run);
    this.commandQueue = result.catch(() => {});
    return result;
  }

  private sendCommandNow(cmd: string, timeoutMs: number): Promise<string> {
    if (!this.writeChar) return Promise.reject(new Error('NOT_CONNECTED'));

    this.dispatchTraffic('TX', cmd);

    return new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => {
        const idx = this.pending.findIndex(p => p.resolve === resolveWrapped);
        if (idx >= 0) this.pending.splice(idx, 1);
        reject(new Error('TIMEOUT'));
      }, timeoutMs);

      const resolveWrapped = (v: string) => resolve(v);
      this.pending.push({ resolve: resolveWrapped, reject, timer });

      const encoder = new TextEncoder();
      this.writeChar.writeValue(encoder.encode(cmd + '\r')).catch((e: Error) => {
        clearTimeout(timer);
        const idx = this.pending.findIndex(p => p.resolve === resolveWrapped);
        if (idx >= 0) this.pending.splice(idx, 1);
        reject(e);
      });
    });
  }

  async queryPID(key: PidKey): Promise<number | null> {
    if (!this.connected) return null;
    try {
      const raw = await this.sendCommand(buildPidRequest(key));
      return parsePidResponse(raw, key);
    } catch {
      return null;
    }
  }

  /** Sequentially polls a set of PIDs. Real ELM327/BLE round-trip latency means this is not instantaneous — expect roughly 100-300ms per PID. */
  async pollPids(keys: PidKey[]): Promise<Partial<Record<PidKey, number | null>>> {
    const results: Partial<Record<PidKey, number | null>> = {};
    for (const key of keys) {
      results[key] = await this.queryPID(key);
    }
    return results;
  }

  async readDTCs(): Promise<DecodedDtc[]> {
    if (!this.connected) return [];
    try {
      const raw = await this.sendCommand('03');
      return parseDtcResponse(raw);
    } catch {
      return [];
    }
  }

  async clearCodes(): Promise<boolean> {
    if (!this.connected) return false;
    try {
      const raw = await this.sendCommand('04');
      return parseClearResponse(raw);
    } catch {
      return false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  getLinkStatus(): 'CONNECTED' | 'DISCONNECTED' {
    return this.connected ? 'CONNECTED' : 'DISCONNECTED';
  }

  disconnect() {
    if (this.notifyChar) {
      try {
        this.notifyChar.removeEventListener('characteristicvaluechanged', this.handleNotification);
        this.notifyChar.stopNotifications();
      } catch {
        // best-effort cleanup
      }
    }
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.device = null;
    this.server = null;
    this.writeChar = null;
    this.notifyChar = null;
    this.connected = false;
    this.protocolName = 'UNKNOWN';
    this.rxBuffer = '';
    for (const p of this.pending) {
      clearTimeout(p.timer);
      p.reject(new Error('DISCONNECTED'));
    }
    this.pending = [];
  }
}

export const hardware = new HardwareService();
