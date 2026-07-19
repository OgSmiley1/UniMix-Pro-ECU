
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
import { PidKey, estimateAfrFromLambda } from './services/obd2';

const POLL_PIDS: PidKey[] = [
  'RPM', 'SPEED', 'COOLANT_TEMP', 'IAT', 'THROTTLE', 'MAP',
  'ENGINE_LOAD', 'STFT_B1', 'LTFT_B1', 'MODULE_VOLTAGE',
  'TIMING_ADVANCE', 'BAROMETRIC', 'O2_S1_LAMBDA',
];

const BLANK_TELEMETRY: Telemetry = {
  rpm: null, boost: null, mapKpa: null, afr: null, coolantTemp: null,
  oilPressure: null, speed: null, iat: null, throttle: null, knock: null,
  stft: null, ltft: null, fuelPressure: null, injDutyCycle: null,
  moduleVoltage: null, timingAdvance: null, engineLoad: null,
  gForce: null, zeroToSixty: null, timestamp: Date.now(),
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [currentProfile, setCurrentProfile] = useState<VehicleProfile>(VEHICLE_PROFILES[0]);
  const [tune, setTune] = useState<TuneSettings>({ ...INITIAL_TUNE });
  const [isRecording, setIsRecording] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [logs, setLogs] = useState<Telemetry[]>([]);
  const [telemetry, setTelemetry] = useState<Telemetry>(BLANK_TELEMETRY);
  const [motionEnabled, setMotionEnabled] = useState(false);
  const [motionError, setMotionError] = useState<string | null>(null);

  const isRecordingRef = useRef(isRecording);
  useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);

  const zeroToSixtyStartRef = useRef<number | null>(null);
  const baroKpaRef = useRef<number | null>(null);

  // Real-time polling loop against the actual connected ECU. No fabricated
  // data: unsupported PIDs stay null and are rendered as N/A.
  useEffect(() => {
    if (!isConnected) return;
    let cancelled = false;

    const pollLoop = async () => {
      while (!cancelled) {
        const results = await hardware.pollPids(POLL_PIDS);
        if (cancelled) break;

        if (results.BAROMETRIC !== undefined && results.BAROMETRIC !== null) {
          baroKpaRef.current = results.BAROMETRIC;
        }

        setTelemetry(prev => {
          const mapKpa = results.MAP !== undefined && results.MAP !== null ? results.MAP : prev.mapKpa;
          const boost = mapKpa !== null ? TuningLogic.calculateBoostPsi(mapKpa, baroKpaRef.current) : null;
          const lambda = results.O2_S1_LAMBDA;
          const afr = (lambda !== undefined && lambda !== null) ? estimateAfrFromLambda(lambda) : prev.afr;
          const speed = results.SPEED !== undefined && results.SPEED !== null ? results.SPEED : prev.speed;

          // Real 0-100km/h timer derived from actual speed PID transitions.
          let zeroToSixty = prev.zeroToSixty;
          if (speed !== null) {
            if (speed <= 2) {
              zeroToSixtyStartRef.current = null;
              zeroToSixty = null;
            } else if (zeroToSixtyStartRef.current === null && (prev.speed === null || prev.speed <= 2)) {
              zeroToSixtyStartRef.current = Date.now();
            } else if (zeroToSixtyStartRef.current !== null && speed >= 100 && (prev.speed === null || prev.speed < 100)) {
              zeroToSixty = (Date.now() - zeroToSixtyStartRef.current) / 1000;
              zeroToSixtyStartRef.current = null;
            }
          }

          const newData: Telemetry = {
            ...prev,
            rpm: results.RPM ?? prev.rpm,
            mapKpa,
            boost,
            afr,
            coolantTemp: results.COOLANT_TEMP ?? prev.coolantTemp,
            iat: results.IAT ?? prev.iat,
            throttle: results.THROTTLE ?? prev.throttle,
            speed,
            stft: results.STFT_B1 ?? prev.stft,
            ltft: results.LTFT_B1 ?? prev.ltft,
            moduleVoltage: results.MODULE_VOLTAGE ?? prev.moduleVoltage,
            timingAdvance: results.TIMING_ADVANCE ?? prev.timingAdvance,
            engineLoad: results.ENGINE_LOAD ?? prev.engineLoad,
            zeroToSixty,
            timestamp: Date.now(),
          };

          if (isRecordingRef.current) {
            setLogs(prevLogs => [...prevLogs, newData].slice(-1000));
          }

          return newData;
        });
      }
    };

    pollLoop();
    return () => { cancelled = true; };
  }, [isConnected]);

  // Real phone accelerometer G-force. Requires an explicit user gesture on
  // iOS (DeviceMotionEvent.requestPermission); Android Chrome needs no
  // permission prompt. Reads the device's actual linear acceleration —
  // never fabricated — and stays null until the user opts in.
  const enableMotion = async () => {
    setMotionError(null);
    const DME = (window as any).DeviceMotionEvent;
    if (!DME) {
      setMotionError('DeviceMotion API not available on this device/browser.');
      return;
    }
    if (typeof DME.requestPermission === 'function') {
      try {
        const result = await DME.requestPermission();
        if (result !== 'granted') {
          setMotionError('Motion sensor permission denied.');
          return;
        }
      } catch {
        setMotionError('Motion sensor permission request failed.');
        return;
      }
    }
    setMotionEnabled(true);
  };

  useEffect(() => {
    if (!motionEnabled) return;
    const handleMotion = (e: DeviceMotionEvent) => {
      const a = e.acceleration;
      if (!a || a.x === null || a.y === null || a.z === null) return;
      const magnitudeG = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z) / 9.80665;
      setTelemetry(prev => ({ ...prev, gForce: magnitudeG }));
    };
    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [motionEnabled]);

  const handleConnect = async () => {
    setIsConnecting(true);
    setConnectError(null);
    const result = await hardware.connect();
    setIsConnecting(false);
    if (result.success) {
      setIsConnected(true);
    } else {
      setConnectError(result.message);
    }
  };

  const handleDisconnect = () => {
    hardware.disconnect();
    setIsConnected(false);
    setTelemetry(BLANK_TELEMETRY);
    zeroToSixtyStartRef.current = null;
    baroKpaRef.current = null;
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
            {isConnecting ? 'Requesting Bluetooth OBD-II adapter…' : 'Real OBD-II Interface // No Simulation'}
          </p>
          {connectError && (
            <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-left">
              <p className="text-[9px] font-mono text-red-400 leading-relaxed">{connectError}</p>
            </div>
          )}
          <div className="space-y-6 mb-10 text-left">
            <div>
              <label className="text-[8px] font-black uppercase tracking-widest text-gray-700 ml-1 mb-2 block">Vehicle Profile (for AI context only)</label>
              <select className="w-full bg-black border border-gray-800 p-4 rounded-xl text-white font-mono text-sm outline-none focus:border-purple-600" value={currentProfile.id} onChange={(e) => setCurrentProfile(VEHICLE_PROFILES.find(p => p.id === e.target.value) || VEHICLE_PROFILES[0])}>
                {VEHICLE_PROFILES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <button onClick={handleConnect} disabled={isConnecting} className="w-full py-5 bg-purple-600 hover:bg-purple-500 rounded-2xl font-black text-lg uppercase tracking-widest text-white shadow-xl transition-all active:scale-95">
            {isConnecting ? <i className="fas fa-sync fa-spin"></i> : 'Connect Bluetooth ELM327'}
          </button>
          <p className="text-[8px] text-gray-700 mt-6 font-mono uppercase tracking-widest leading-relaxed">
            Requires a real ELM327 Bluetooth LE OBD-II adapter plugged into the car and Chrome/Edge on Android.
          </p>
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
               <span className="text-[7px] font-black text-gray-700 tracking-widest uppercase">Protocol</span>
               <span className="text-[10px] font-mono font-black text-emerald-400 uppercase italic">{hardware.getProtocolName()}</span>
             </div>
           </div>
           <div className="flex items-center gap-4">
             <span className="text-[9px] font-black animate-pulse text-emerald-500">
               {hardware.getLinkStatus()}
             </span>
             <div className="w-8 h-8 rounded-lg bg-gray-900 border border-gray-800 flex items-center justify-center">
               <i className="fas fa-link text-purple-500 text-xs"></i>
             </div>
           </div>
        </header>
        <div className="flex-1 overflow-y-auto bg-grid-layout no-scrollbar">
          {activeTab === 'dashboard' && <Dashboard telemetry={telemetry} profile={currentProfile} />}
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
          {activeTab === 'maps' && <MapViewer3D currentRpm={telemetry.rpm ?? 0} currentLoad={telemetry.throttle ?? 0} profileId={currentProfile.id} />}
          {activeTab === 'files' && <FileManager tune={tune} ecuType={currentProfile.ecuType} onLoadTune={setTune} />}
          {activeTab === 'dtc' && <ECUReader />}
          {activeTab === 'settings' && (
            <Settings
              currentProfile={currentProfile}
              setProfile={setCurrentProfile}
              onDisconnect={handleDisconnect}
              chipType={tune.chipType}
              onChipChange={(chip: HardwareChip) => setTune(prev => ({...prev, chipType: chip}))}
              motionEnabled={motionEnabled}
              motionError={motionError}
              onEnableMotion={enableMotion}
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
