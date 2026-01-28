
import React from 'react';
import { VehicleProfile } from '../types';
import { VEHICLE_PROFILES } from '../constants';
import { hardware } from '../services/hardwareService';

interface SettingsProps {
  currentProfile: VehicleProfile;
  setProfile: (p: VehicleProfile) => void;
  onDisconnect: () => void;
}

const Settings: React.FC<SettingsProps> = ({ currentProfile, setProfile, onDisconnect }) => {
  const linkStatus = hardware.getLinkStatus();

  return (
    <div className="p-4 md:p-12 h-full max-w-6xl mx-auto overflow-y-auto pb-32 font-sans">
      <div className="mb-12">
        <h2 className="text-4xl font-black uppercase tracking-tighter italic text-white leading-none">System Core</h2>
        <p className="text-gray-500 font-mono text-xs uppercase tracking-[0.4em] mt-3">Universal Interface v3.5 // Root Calibration Access</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
        {/* Hardware Identity Section */}
        <div className="space-y-8">
          <div className="glass p-8 md:p-10 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
            
            <h3 className="text-xl font-black mb-8 flex items-center gap-4 text-white uppercase italic tracking-widest">
              <i className="fas fa-microchip text-purple-600"></i>
              ECU Identity
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="text-[9px] font-black text-gray-700 uppercase tracking-[0.3em] mb-3 block ml-1">Target Architecture</label>
                <select 
                  className="w-full bg-black border border-gray-900 p-5 rounded-2xl text-white font-mono text-sm outline-none shadow-inner focus:border-purple-600 transition-colors"
                  value={currentProfile.id}
                  onChange={(e) => setProfile(VEHICLE_PROFILES.find(p => p.id === e.target.value) || VEHICLE_PROFILES[0])}
                >
                  {VEHICLE_PROFILES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-black/40 rounded-2xl border border-gray-900 group hover:border-purple-600/30 transition-all">
                  <p className="text-[8px] text-gray-700 uppercase font-black tracking-widest mb-1">Architecture</p>
                  <p className="text-sm font-black text-gray-300 italic">{currentProfile.ecuType}</p>
                </div>
                <div className="p-5 bg-black/40 rounded-2xl border border-gray-900 group hover:border-purple-600/30 transition-all">
                  <p className="text-[8px] text-gray-700 uppercase font-black tracking-widest mb-1">Octane Logic</p>
                  <p className="text-sm font-black text-gray-300 italic">{currentProfile.fuelType}</p>
                </div>
              </div>

              <div className="p-6 bg-purple-900/5 rounded-3xl border border-purple-500/10 flex items-center justify-between">
                <div>
                  <p className="text-[8px] text-gray-600 uppercase font-black tracking-widest mb-1">Hardware ID</p>
                  <p className="text-xs font-mono font-black text-purple-400">UNX-{currentProfile.id.toUpperCase().slice(0, 4)}-{Math.random().toString(36).slice(2, 8).toUpperCase()}</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[8px] font-black uppercase text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">Verified</span>
                  <span className="text-[7px] text-gray-800 mt-1 uppercase font-bold">FIRMWARE V2.9.1</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass p-8 md:p-10 rounded-[3rem] border border-white/5 shadow-2xl">
            <h3 className="text-xl font-black mb-8 flex items-center gap-4 text-white uppercase italic tracking-widest">
              <i className="fas fa-network-wired text-blue-500"></i>
              Protocol Stack
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-4 border-b border-gray-900 group">
                <span className="text-[11px] font-black uppercase text-gray-600 tracking-widest group-hover:text-blue-400 transition-colors">Bus Status</span>
                <span className="text-emerald-400 font-mono text-xs font-black">{linkStatus}</span>
              </div>
              <div className="flex justify-between items-center py-4 border-b border-gray-900 group">
                <span className="text-[11px] font-black uppercase text-gray-600 tracking-widest group-hover:text-blue-400 transition-colors">CAN Standard</span>
                <span className="text-blue-400 font-mono text-xs font-black">ISO 15765 (11-BIT/500K)</span>
              </div>
              <div className="flex justify-between items-center py-4 group">
                <span className="text-[11px] font-black uppercase text-gray-600 tracking-widest group-hover:text-blue-400 transition-colors">Latency Offset</span>
                <span className="text-blue-400 font-mono text-xs font-black">2.4ms (ULTRA-LOW)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security and Data Actions */}
        <div className="space-y-8">
          <div className="glass p-8 md:p-10 rounded-[3rem] border border-red-500/10 shadow-2xl">
            <h3 className="text-xl font-black mb-8 text-red-500 flex items-center gap-4 uppercase italic tracking-widest">
              <i className="fas fa-user-shield"></i>
              Engineering Access
            </h3>
            <div className="space-y-4">
              <button className="w-full py-5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all text-gray-400 hover:text-white flex items-center justify-center gap-3">
                <i className="fas fa-file-export"></i> Dump Calibration Binary
              </button>
              <button className="w-full py-5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all text-gray-400 hover:text-white flex items-center justify-center gap-3">
                <i className="fas fa-history"></i> Rollback ECU Firmware
              </button>
              <div className="h-px bg-gray-900 my-4"></div>
              <button 
                onClick={() => {
                   if(confirm("DANGER: Terminating the session during high-speed data flow can cause ECU desynchronization. Proceed?")) {
                      onDisconnect();
                   }
                }}
                className="w-full py-5 bg-red-600/10 text-red-500 hover:bg-red-600 border border-red-500/30 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] transition-all shadow-xl shadow-red-600/10"
              >
                Terminate Master Link
              </button>
            </div>
          </div>

          <div className="glass p-10 rounded-[3rem] border border-white/5 bg-gradient-to-br from-purple-900/10 to-transparent">
             <h3 className="text-xl font-black mb-4 text-white uppercase italic tracking-widest">Cloud Relay</h3>
             <p className="text-[10px] text-gray-500 mb-8 italic font-mono uppercase tracking-widest leading-relaxed">Global synchronization with the UniMix-X server is active. High-fidelity logs are being tunneled.</p>
             <div className="flex items-center gap-6 p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl">
               <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping"></div>
               <div>
                 <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Relay Active</p>
                 <p className="text-xs font-mono font-black text-gray-400">SYNC_ID: {Math.random().toString(36).slice(2, 10).toUpperCase()}</p>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
