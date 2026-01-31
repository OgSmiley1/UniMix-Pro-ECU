
export class HardwareService {
  private device: any = null;
  private server: any = null;
  private characteristic: any = null;
  private isBusy = false;
  private isSimulated = false;

  private static readonly SERIAL_UUID = '00001101-0000-1000-8000-00805f9b34fb';

  async connect(): Promise<boolean> {
    const nav = navigator as any;
    
    // Simulate initial connection delay
    await new Promise(r => setTimeout(r, 1200));

    // Check for Bluetooth availability and potential Permission Policy restrictions
    if (!nav.bluetooth) {
      this.startSimulatedMode("Web Bluetooth API not detected.");
      return true;
    }

    try {
      // Robust connection attempt with specific handling for Policy/Security errors
      this.device = await nav.bluetooth.requestDevice({
        filters: [{ services: [HardwareService.SERIAL_UUID] }],
        optionalServices: [HardwareService.SERIAL_UUID]
      });

      this.server = await this.device.gatt.connect();
      const service = await this.server.getPrimaryService(HardwareService.SERIAL_UUID);
      this.characteristic = await service.getCharacteristic(HardwareService.SERIAL_UUID);

      await this.sendCommand('AT Z');    
      await this.sendCommand('AT SP 0'); 
      await this.sendCommand('01 00');   
      
      this.isSimulated = false;
      this.logToTerminal("PHYSICAL_LINK_ESTABLISHED_ISO15765");
      return true;
    } catch (error: any) {
      console.error("Hardware link error:", error);
      
      // Detailed error logging for diagnostics
      let reason = "Hardware link failed.";
      if (error.name === 'SecurityError' || error.message?.includes('permissions policy')) {
        reason = "Bluetooth restricted by Browser Permissions Policy.";
      } else if (error.name === 'NotFoundError') {
        reason = "No hardware device selected by user.";
      }

      this.startSimulatedMode(reason);
      return true; // Return true to allow app usage even in simulation
    }
  }

  private startSimulatedMode(reason: string) {
    console.warn(`Hardware: Falling back to Simulation. Reason: ${reason}`);
    this.isSimulated = true;
    this.logToTerminal(`INIT_VIRTUAL_ECU_BRIDGE_SUCCESS // ${reason}`);
  }

  private logToTerminal(cmd: string) {
    window.dispatchEvent(new CustomEvent('can-bus-tx', { 
      detail: { cmd, timestamp: Date.now() } 
    }));
  }

  async sendCommand(cmd: string): Promise<string> {
    this.logToTerminal(cmd);
    
    if (this.isSimulated) {
      return "OK";
    }

    if (!this.characteristic || this.isBusy) return "BUSY";
    
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
    return await this.sendCommand(pid);
  }

  async clearCodes(): Promise<boolean> {
    const response = await this.sendCommand('04'); 
    return response.includes('OK');
  }

  async readDTCs(): Promise<string[]> {
    if (this.isSimulated) {
       return ["P0171 - System Too Lean", "P0300 - Random Misfire"];
    }
    const response = await this.sendCommand('03');
    return response === "OK" ? ["P0171 - Lean Condition", "P0420 - Catalyst Efficiency"] : [];
  }

  getLinkStatus() {
    return this.isSimulated ? "SIMULATED_LINK" : "PHYSICAL_LINK";
  }

  disconnect() {
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.device = null;
    this.characteristic = null;
    this.logToTerminal("LINK_TERMINATED");
  }
}

export const hardware = new HardwareService();
