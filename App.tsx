
import React, { useState, useEffect, useRef } from 'react';
import { Telemetry, TuneSettings, AppTab, VehicleProfile, HardwareChip } from './types';
import { VEHICLE_PROFILES, INITIAL_TUNE } from './constants';
import Dashboard from './components/Dashboard';
import TuneEditor from './components/TuneEditor';
import DataLogger from './components/DataLogger';
import MapViewer3D from './components/MapViewer3D';
import Settings from './components/Settings';
import ECUReader from './components/ECUReader';
import LiveTerminal from './components/LiveTerminal';
import FileManager from './components/FileManager';
import { TuningLogic } from './services/tuningService';
import { hardware } from './services/hardwareService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectStep, setConnectStep] = useState('');
  const [currentProfile, setCurrentProfile] = useState<VehicleProfile>(VEHICLE_PROFILES[0]);
  const [tune, setTune] = useState<TuneSettings>({ ...INITIAL_TUNE });
  const [isRecording, setIsRecording] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [logs, setLogs] = useState<Telemetry[]>([]);

  const [telemetry, setTelemetry] = useState<Telemetry>({
    rpm: 0, boost: 0, afr: 14.7, coolantTemp: 90, 
    oilPressure: 45, speed: 0, iat: 30, throttle: 0, 
    knock: 0, mapVoltage: 0.5, stft: 0, ltft: 0,
    fuelPressure: 58, injDutyCycle: 0, gForce: 0,
    zeroToSixty: null,
    timestamp: Date.now()
  });

  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      setTelemetry(prev => {
        const targetThrottle = Math.random() > 0.94 ? 100 : (Math.random() * 20 + 5);
        const newThrottle = prev.throttle + (targetThrottle - prev.throttle) * 0.1;
        
        // Apply Global Offset to RPM curve
        const offsetMultiplier = 1 + (tune.globalOffset / 100);
        const newRpm = 850 + ((newThrottle * 80) * offsetMultiplier) + (Math.random() * 20);
        const effectiveRpm = Math.min(newRpm, tune.revLimit);
        
        const accel = (newThrottle / 100) * 18 * offsetMultiplier;
        let newSpeed = prev.speed + (newThrottle > 10 ? accel : -5);
        
        // Respect Top Speed Limit
        if (newSpeed > tune.topSpeedLimit) {
           newSpeed = tune.topSpeedLimit;
           // Simulate torque cut in log
           if (Math.random() > 0.8) {
              window.dispatchEvent(new CustomEvent('can-bus-tx', { 
                 detail: { cmd: `SPEED_LIMIT_INTERVENE: ${tune.topSpeedLimit} KM/H`, timestamp: Date.now() } 
              }));
           }
        }

        const rawVoltage = TuningLogic.psiToVoltage((newThrottle / 100) * 28.0); 
        const modifiedVoltage = TuningLogic.interceptMapSignal(rawVoltage, tune.boostLimit);
        const actualBoost = currentProfile.induction === 'N/A' ? 0 : TuningLogic.voltageToPsi(modifiedVoltage);
        
        let targetAfr = 14.7;
        let crackleActive = false;
        if (newThrottle > 80) targetAfr = tune.afrTarget;
        else if (newThrottle < 5 && effectiveRpm > 3000 && tune.crackleIntensity > 5) {
          targetAfr = 12.0 - (tune.crackleIntensity / 100);
          crackleActive = true;
          if (Math.random() > 0.8) {
            window.dispatchEvent(new CustomEvent('can-bus-tx', { 
               detail: { cmd: `POP_CRACKLE_IGN_RETARD: -18deg`, timestamp: Date.now() } 
            }));
          }
        }

        const newData: Telemetry = {
          ...prev,
          rpm: effectiveRpm,
          boost: actualBoost,
          afr: prev.afr + (targetAfr - prev.afr) * 0.1,
          throttle: newThrottle,
          speed: Math.max(0, newSpeed),
          knock: (effectiveRpm > 5000 && !crackleActive) ? Math.random() * 0.5 : 0,
          timestamp: Date.now()
        };

        if (isRecording) {
          setLogs(prevLogs => [...prevLogs, newData].slice(-1000));
        }

        return newData;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isConnected, tune, isRecording, currentProfile]);

  const handleConnect = async () => {
    setIsConnecting(true);
    setConnectStep(`INITIALIZING ${currentProfile.ecuType}...`);
    const steps = ['SCANNING BUS...', 'VERIFYING VIN...', 'PROTOCOL_HANDSHAKE...', 'LINK_SUCCESS'];
    for (const s of steps) {
      setConnectStep(s);
      await new Promise(r => setTimeout(r, 600));
    }
    const success = await hardware.connect();
    if (success) setIsConnected(true);
    setIsConnecting(false);
  };

  const NavItem: React.FC<{ tab: AppTab; icon: string; label: string }> = ({ tab, icon, label }) => (
    <button onClick={() => setActiveTab(tab)} className={`flex-1 md:flex-none flex flex-col md:flex-row items-center justify-center gap-1 md:gap-4 p-2 md:p-5 rounded-xl transition-all ${activeTab === tab ? 'bg-purple-600 text-white shadow-2xl scale-105' : 'text-gray-500 hover:text-gray-300'}`}>
      <i className={`fas ${icon} text-lg`}></i>
      <span className="font-black uppercase tracking-widest text-[7px] md:text-[9px]">{label}</span>
    </button>
  );

  if (!isConnected) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#020202] p-4 font-sans">
        <div className="glass p-10 md:p-14 rounded-[40px] text-center max-w-lg w-full shadow-2xl border border-white/5 relative">
          <div className="w-20 h-20 bg-purple-600 rounded-[1.5rem] rotate-12 flex items-center justify-center mx-auto mb-10 shadow-2xl">
            <i className="fas fa-microchip text-3xl text-white"></i>
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter mb-4 text-white italic">UniMix<span className="text-purple-600">Pro</span></h1>
          <p className="text-gray-500 mb-8 text-[9px] font-mono tracking-[0.2em] uppercase italic">
            {isConnecting ? connectStep : 'v.5.5.0 // Legendary Protocol Suite'}
          </p>
          <div className="space-y-6 mb-10 text-left">
            <div>
              <label className="text-[8px] font-black uppercase tracking-widest text-gray-700 ml-1 mb-2 block">Architecture Select</label>
              <select className="w-full bg-black border border-gray-800 p-4 rounded-xl text-white font-mono text-sm outline-none focus:border-purple-600" value={currentProfile.id} onChange={(e) => setCurrentProfile(VEHICLE_PROFILES.find(p => p.id === e.target.value) || VEHICLE_PROFILES[0])}>
                {VEHICLE_PROFILES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <button onClick={handleConnect} disabled={isConnecting} className="w-full py-5 bg-purple-600 hover:bg-purple-500 rounded-2xl font-black text-lg uppercase tracking-widest text-white shadow-xl transition-all active:scale-95">
            {isConnecting ? <i className="fas fa-sync fa-spin"></i> : 'Initialize Tuner Link'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row bg-[#050505] overflow-hidden">
      <aside className="hidden md:flex w-72 glass border-r border-gray-900/50 flex-col p-6 z-50">
        <h2 className="text-2xl font-black italic text-white text-center mb-8">UniMix<span className="text-purple-600">.</span></h2>
        <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
          <NavItem tab="dashboard" icon="fa-tachometer-alt" label="Engine" />
          <NavItem tab="tune" icon="fa-sliders-h" label="Logic" />
          <NavItem tab="maps" icon="fa-border-all" label="Maps" />
          <NavItem tab="logs" icon="fa-wave-square" label="Logs" />
          <NavItem tab="files" icon="fa-folder-open" label="Files" />
          <NavItem tab="dtc" icon="fa-stethoscope" label="Diag" />
          <NavItem tab="settings" icon="fa-cog" label="Core" />
        </nav>
        <div className="mt-8 h-40">
           <LiveTerminal />
        </div>
      </aside>
      <main className="flex-1 flex flex-col bg-[#050505] pb-20 md:pb-0">
        <header className="h-16 border-b border-gray-900/40 px-6 flex items-center justify-between glass z-40">
           <div className="flex gap-10">
             <div className="flex flex-col">
               <span className="text-[7px] font-black text-gray-700 tracking-widest uppercase">Target</span>
               <span className="text-[10px] font-mono font-black text-purple-400 uppercase italic">{currentProfile.ecuType}</span>
             </div>
             <div className="flex flex-col">
               <span className="text-[7px] font-black text-gray-700 tracking-widest uppercase">VIN_REF</span>
               <span className="text-[10px] font-mono font-black text-emerald-400 uppercase italic">{currentProfile.vinPrefix}XXXXXX</span>
             </div>
           </div>
           <div className="flex items-center gap-4">
             <span className={`text-[9px] font-black animate-pulse ${hardware.getLinkStatus() === 'SIMULATED_LINK' ? 'text-orange-500' : 'text-emerald-500'}`}>
               {hardware.getLinkStatus()}
             </span>
             <div className="w-8 h-8 rounded-lg bg-gray-900 border border-gray-800 flex items-center justify-center">
               <i className="fas fa-link text-purple-500 text-xs"></i>
             </div>
           </div>
        </header>
        <div className="flex-1 overflow-y-auto bg-grid-layout no-scrollbar">
          {activeTab === 'dashboard' && <Dashboard telemetry={telemetry} />}
          {activeTab === 'tune' && (
            <TuneEditor 
              settings={tune} 
              onUpdate={setTune} 
              onOptimize={() => {
                setIsOptimizing(true);
                setTimeout(() => {
                  setTune(prev => ({...prev, ...TuningLogic.optimizeLocally(logs, tune, currentProfile)}));
                  setIsOptimizing(false);
                }, 1000);
              }} 
              isOptimizing={isOptimizing} 
              currentProfile={currentProfile}
              logs={logs}
            />
          )}
          {activeTab === 'logs' && <DataLogger logs={logs} isRecording={isRecording} onToggleRecording={() => setIsRecording(!isRecording)} onClear={() => setLogs([])} />}
          {activeTab === 'maps' && <MapViewer3D currentRpm={telemetry.rpm} currentLoad={telemetry.throttle} profileId={currentProfile.id} />}
          {activeTab === 'files' && <FileManager />}
          {activeTab === 'dtc' && <ECUReader />}
          {activeTab === 'settings' && (
            <Settings 
              currentProfile={currentProfile} 
              setProfile={setCurrentProfile} 
              onDisconnect={() => setIsConnected(false)} 
              chipType={tune.chipType}
              onChipChange={(chip: HardwareChip) => setTune(prev => ({...prev, chipType: chip}))}
            />
          )}
        </div>
      </main>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-[#0a0a0a] border-t border-gray-900/50 flex items-center justify-around px-1 z-[100] glass">
        <NavItem tab="dashboard" icon="fa-tachometer-alt" label="Dash" />
        <NavItem tab="tune" icon="fa-sliders-h" label="Logic" />
        <NavItem tab="maps" icon="fa-border-all" label="Maps" />
        <NavItem tab="files" icon="fa-folder-open" label="Files" />
        <NavItem tab="settings" icon="fa-cog" label="Core" />
      </nav>
      <style>{`.bg-grid-layout { background-image: radial-gradient(#111 1px, transparent 1px); background-size: 30px 30px; }`}</style>
    </div>
  );
};

export default App;
