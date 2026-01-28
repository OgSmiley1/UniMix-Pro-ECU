
import React, { useState, useEffect, useRef } from 'react';
import { Telemetry, TuneSettings, AppTab, VehicleProfile } from './types';
import { VEHICLE_PROFILES, INITIAL_TUNE } from './constants';
import Dashboard from './components/Dashboard';
import TuneEditor from './components/TuneEditor';
import DataLogger from './components/DataLogger';
import MapViewer3D from './components/MapViewer3D';
import Settings from './components/Settings';
import ECUReader from './components/ECUReader';
import LiveTerminal from './components/LiveTerminal';
import { optimizeTune } from './services/geminiService';
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

  // Telemetry Simulation Ref
  const zeroToSixtyStartRef = useRef<number | null>(null);
  const [lastZeroToSixty, setLastZeroToSixty] = useState<number | null>(null);

  const [telemetry, setTelemetry] = useState<Telemetry>({
    rpm: 0, boost: 0, afr: 14.7, coolantTemp: 90, 
    oilPressure: 45, speed: 0, iat: 30, throttle: 0, 
    knock: 0, mapVoltage: 0.5, stft: 0, ltft: 0,
    fuelPressure: 58, injDutyCycle: 0, gForce: 0,
    zeroToSixty: null,
    timestamp: Date.now()
  });

  // Main Polling Loop (Simulates data coming from HardwareService)
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      setTelemetry(prev => {
        const targetThrottle = Math.random() > 0.92 ? 100 : (Math.random() * 15 + 5);
        const newThrottle = prev.throttle + (targetThrottle - prev.throttle) * 0.15;
        const newRpm = 800 + (newThrottle * 75) + (Math.random() * 30);
        const accel = (newThrottle / 100) * 18;
        const newSpeed = prev.speed + accel;
        const gForce = (accel * 8) / 9.8;

        if (prev.speed === 0 && newSpeed > 0) zeroToSixtyStartRef.current = Date.now();
        if (prev.speed < 60 && newSpeed >= 60 && zeroToSixtyStartRef.current) {
          const time = (Date.now() - zeroToSixtyStartRef.current) / 1000;
          setLastZeroToSixty(time);
          zeroToSixtyStartRef.current = null;
        }

        const rawVoltage = TuningLogic.psiToVoltage((newThrottle / 100) * 24.0); 
        const modifiedVoltage = TuningLogic.interceptMapSignal(rawVoltage, tune.boostLimit);
        const actualBoost = TuningLogic.voltageToPsi(modifiedVoltage);
        
        let targetAfr = 14.7;
        if (newThrottle > 85) targetAfr = tune.afrTarget;
        else if (newThrottle > 45) targetAfr = 13.0;

        const currentAfr = prev.afr + (targetAfr - prev.afr) * 0.15 + (Math.random() * 0.05);
        const knock = (newThrottle > 85 && currentAfr > 13.8) ? Math.random() * 6.0 : 0;
        
        const newData: Telemetry = {
          ...prev,
          rpm: Math.min(newRpm, tune.revLimit),
          boost: actualBoost,
          afr: currentAfr,
          throttle: newThrottle,
          speed: newSpeed > 260 ? 0 : newSpeed,
          coolantTemp: prev.coolantTemp + (newThrottle > 60 ? 0.08 : -0.04),
          knock,
          injDutyCycle: (newRpm / 6500) * (newThrottle / 100) * 90,
          gForce: gForce,
          fuelPressure: 58 + (actualBoost * 0.6),
          zeroToSixty: lastZeroToSixty,
          timestamp: Date.now()
        };

        if (isRecording) {
          setLogs(prevLogs => [...prevLogs, newData].slice(-2000));
        }

        return newData;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isConnected, tune, isRecording, lastZeroToSixty]);

  const handleConnect = async () => {
    setIsConnecting(true);
    setConnectStep('INTERROGATING BLUETOOTH NODE...');
    
    const success = await hardware.connect();
    
    if (success) {
      setConnectStep('ELM327 HANDSHAKE: SECURED');
      setTimeout(() => {
        setIsConnected(true);
        setIsConnecting(false);
      }, 800);
    } else {
      setConnectStep('LINK DENIED / DEVICE TIMEOUT');
      setTimeout(() => setIsConnecting(false), 2000);
    }
  };

  const NavItem: React.FC<{ tab: AppTab; icon: string; label: string }> = ({ tab, icon, label }) => (
    <button 
      onClick={() => setActiveTab(tab)}
      className={`flex-1 md:flex-none flex flex-col md:flex-row items-center justify-center gap-1 md:gap-5 p-2 md:p-5 rounded-xl md:rounded-2xl transition-all duration-300 relative overflow-hidden ${
        activeTab === tab ? 'bg-purple-600 shadow-xl text-white' : 'text-gray-500 hover:text-gray-300'
      }`}
    >
      <i className={`fas ${icon} text-lg w-6 flex justify-center`}></i>
      <span className="font-black uppercase tracking-[0.05em] md:tracking-[0.2em] text-[7px] md:text-[10px] whitespace-nowrap">{label}</span>
      {activeTab === tab && (
        <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-7 bg-white rounded-l-full"></div>
      )}
    </button>
  );

  if (!isConnected) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#020202] p-4 font-sans">
        <div className="glass p-8 md:p-14 rounded-[40px] md:rounded-[50px] text-center max-w-lg w-full shadow-2xl relative overflow-hidden border border-gray-900/50">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-600 to-transparent opacity-40"></div>
          
          <div className="w-20 h-20 md:w-24 md:h-24 bg-purple-600 rounded-[2rem] rotate-12 flex items-center justify-center mx-auto mb-8 md:mb-10 shadow-2xl shadow-purple-600/50">
            <i className="fas fa-bluetooth-b text-3xl md:text-4xl text-white"></i>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4 text-white italic">UniMix<span className="text-purple-600">Pro</span></h1>
          <p className="text-gray-500 mb-8 text-[9px] md:text-[10px] font-mono tracking-[0.3em] h-12 flex items-center justify-center uppercase leading-tight italic">
            {isConnecting ? connectStep : 'v.3.5.2 // Engineering Interface Standby'}
          </p>
          
          <div className="space-y-6 mb-10 text-left">
            <div>
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-700 ml-2 mb-2 block">Detected Node</label>
              <select 
                disabled={isConnecting}
                className="w-full bg-black border border-gray-800 p-4 rounded-2xl text-white font-mono text-sm outline-none shadow-inner"
                value={currentProfile.id}
                onChange={(e) => setCurrentProfile(VEHICLE_PROFILES.find(p => p.id === e.target.value) || VEHICLE_PROFILES[0])}
              >
                {VEHICLE_PROFILES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <button 
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full py-5 bg-purple-600 hover:bg-purple-500 rounded-3xl font-black text-lg uppercase tracking-[0.3em] transition-all shadow-2xl shadow-purple-600/30 border border-purple-400/20 text-white italic"
          >
            {isConnecting ? <i className="fas fa-sync fa-spin"></i> : 'Begin Session'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row bg-[#050505] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-80 glass border-r border-gray-900/50 flex-col p-6 z-50">
        <div className="px-6 py-8 mb-4 text-center">
          <h2 className="text-3xl font-black tracking-tighter uppercase italic text-white leading-none">UniMix<span className="text-purple-600">.</span></h2>
          <div className="mt-6 inline-flex items-center gap-3 px-6 py-3 bg-emerald-950/20 border border-emerald-500/30 rounded-full">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.6)]"></div>
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Module Online</span>
          </div>
        </div>

        <nav className="flex-1 space-y-2 mt-4">
          <NavItem tab="dashboard" icon="fa-tachometer-alt" label="Performance" />
          <NavItem tab="tune" icon="fa-sliders-h" label="Logic Studio" />
          <NavItem tab="maps" icon="fa-border-all" label="Map Editor" />
          <NavItem tab="logs" icon="fa-wave-square" label="Telemetry" />
          <NavItem tab="dtc" icon="fa-stethoscope" label="Diagnostics" />
          <NavItem tab="settings" icon="fa-cog" label="System" />
        </nav>

        <div className="mt-8 h-48">
           <LiveTerminal />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative flex flex-col bg-[#050505] pb-20 md:pb-0">
        <header className="h-16 md:h-20 border-b border-gray-900/40 px-4 md:px-10 flex items-center justify-between glass z-40">
           <div className="flex items-center gap-4 md:gap-14">
             <div className="flex flex-col">
               <span className="text-[8px] md:text-[9px] font-black uppercase text-gray-700 leading-none mb-1 md:mb-2 tracking-[0.4em]">Node Link</span>
               <span className="text-[10px] md:text-sm font-mono font-black text-emerald-400 uppercase italic">Nominal <span className="text-gray-800 ml-4">1.0 MBPS</span></span>
             </div>
             <div className="hidden md:block w-px h-10 bg-gray-900/50"></div>
             <div className="flex flex-col">
               <span className="text-[8px] md:text-[9px] font-black uppercase text-gray-700 leading-none mb-1 md:mb-2 tracking-[0.4em]">Profile</span>
               <span className="text-[10px] md:text-sm font-mono font-black text-purple-400 uppercase tracking-tighter italic leading-none truncate max-w-[80px] md:max-w-none">{currentProfile.name}</span>
             </div>
           </div>
           
           <div className="flex items-center gap-3 md:gap-6">
             <div className="hidden sm:block text-right">
               <p className="text-[8px] font-black text-gray-800 uppercase tracking-widest leading-none mb-1">Status</p>
               <p className="text-[10px] md:text-xs font-black text-emerald-500 uppercase italic tracking-widest">SECURE</p>
             </div>
             <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gray-900/40 border border-gray-800/60 flex items-center justify-center">
               <i className="fas fa-bluetooth-b text-purple-500 text-sm md:text-xl animate-pulse"></i>
             </div>
           </div>
        </header>

        {/* Viewport content */}
        <div className="flex-1 overflow-y-auto relative bg-grid-layout p-2 md:p-0 scrollbar-hide">
          {activeTab === 'dashboard' && <Dashboard telemetry={telemetry} />}
          {activeTab === 'tune' && (
            <TuneEditor 
              settings={tune} 
              onUpdate={setTune} 
              onOptimize={async () => {
                setIsOptimizing(true);
                const result = await optimizeTune(logs, tune, currentProfile.fuelType);
                if(result) setTune(prev => ({...prev, ...result}));
                setIsOptimizing(false);
              }} 
              isOptimizing={isOptimizing} 
            />
          )}
          {activeTab === 'logs' && (
            <DataLogger 
              logs={logs} 
              isRecording={isRecording} 
              onToggleRecording={() => setIsRecording(!isRecording)} 
              onClear={() => setLogs([])} 
            />
          )}
          {activeTab === 'maps' && <MapViewer3D currentRpm={telemetry.rpm} currentLoad={telemetry.throttle} />}
          {activeTab === 'dtc' && <ECUReader />}
          {activeTab === 'settings' && <Settings currentProfile={currentProfile} setProfile={setCurrentProfile} onDisconnect={() => setIsConnected(false)} />}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-[#0a0a0a] border-t border-gray-900/50 flex items-center justify-around px-1 z-[100] glass">
        <NavItem tab="dashboard" icon="fa-tachometer-alt" label="Dash" />
        <NavItem tab="tune" icon="fa-sliders-h" label="Logic" />
        <NavItem tab="maps" icon="fa-border-all" label="Maps" />
        <NavItem tab="logs" icon="fa-wave-square" label="Logs" />
        <NavItem tab="dtc" icon="fa-stethoscope" label="Diag" />
      </nav>

      <style>{`
        .bg-grid-layout {
          background-image: radial-gradient(#111 1.5px, transparent 1.5px);
          background-size: 40px 40px;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default App;
