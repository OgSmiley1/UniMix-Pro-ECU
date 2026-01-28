
export class HardwareService {
  private device: any = null;
  private server: any = null;
  private characteristic: any = null;
  private isBusy = false;

  // Standard Bluetooth Serial Port UUID
  private static readonly SERIAL_UUID = '00001101-0000-1000-8000-00805f9b34fb';

  async connect(): Promise<boolean> {
    try {
      const nav = navigator as any;
      if (!nav.bluetooth) {
        throw new Error("Web Bluetooth not supported.");
      }

      this.device = await nav.bluetooth.requestDevice({
        filters: [{ services: [HardwareService.SERIAL_UUID] }],
        optionalServices: [HardwareService.SERIAL_UUID]
      });

      this.server = await this.device.gatt.connect();
      const service = await this.server.getPrimaryService(HardwareService.SERIAL_UUID);
      this.characteristic = await service.getCharacteristic(HardwareService.SERIAL_UUID);

      // ELM327 Pro Initialization
      await this.sendCommand('AT Z');    // Warm reset
      await this.sendCommand('AT L1');   // Linefeeds on
      await this.sendCommand('AT SP 0'); // Auto protocol search
      await this.sendCommand('01 00');   // PIDs supported 01-20
      
      return true;
    } catch (error) {
      console.error("Link Error:", error);
      return false;
    }
  }

  async sendCommand(cmd: string): Promise<string> {
    if (!this.characteristic || this.isBusy) return "BUSY/DISCONNECTED";
    
    try {
      this.isBusy = true;
      const encoder = new TextEncoder();
      const data = encoder.encode(cmd + '\r');
      await this.characteristic.writeValue(data);
      this.isBusy = false;
      return "OK";
    } catch (e) {
      this.isBusy = false;
      return "WRITE_ERROR";
    }
  }

  async queryPID(pid: string): Promise<string> {
    // Example: queryPID('010C') for RPM
    return await this.sendCommand(pid);
  }

  async clearCodes(): Promise<boolean> {
    const response = await this.sendCommand('04'); 
    return response.includes('OK');
  }

  async readDTCs(): Promise<string[]> {
    const response = await this.sendCommand('03');
    // Simulated parsing of OBD2 DTC response
    if (response === "OK") return ["P0171 - System Too Lean", "P0300 - Random Misfire"];
    return [];
  }

  disconnect() {
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.device = null;
    this.characteristic = null;
  }
}

export const hardware = new HardwareService();
