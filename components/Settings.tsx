
import React from 'react';
import { VehicleProfile, HardwareChip } from '../types';
import { VEHICLE_PROFILES } from '../constants';
import { hardware } from '../services/hardwareService';

interface SettingsProps {
  currentProfile: VehicleProfile;
  setProfile: (p: VehicleProfile) => void;
  onDisconnect: () => void;
  chipType: HardwareChip;
  onChipChange: (chip: HardwareChip) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  currentProfile, 
  setProfile, 
  onDisconnect, 
  chipType, 
  onChipChange 
}) => {
  return (
    <div className="p-4 md:p-12 h-full max-w-6xl mx-auto overflow-y-auto pb-32 font-sans no-scrollbar">
      <div className="mb-12">
        <h2 className="text-4xl font-black uppercase tracking-tighter italic text-white leading-none">System Core</h2>
        <p className="text-gray-500 font-mono text-xs uppercase tracking-[0.4em] mt-3">Universal Interface v5.5 // Master Key Engaged</p>
      </div>

      {/* Connectivity Diagram */}
      <div className="glass p-8 mb-12 rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden relative group">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-500 italic">Architecture Map</h3>
          <span className="text-[10px] font-mono text-emerald-500 animate-pulse">SYSTEM_ONLINE</span>
        </div>
        <div className="flex justify-around items-center py-10 relative">
          <div className="flex flex-col items-center gap-4 z-10">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center border border-blue-500/40">
              <i className="fas fa-mobile-alt text-blue-400"></i>
            </div>
            <span className="text-[8px] font-black uppercase text-gray-600">Interface</span>
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-blue-500 to-purple-600 relative overflow-hidden mx-4">
             <div className="absolute top-0 left-0 w-2 h-full bg-white shadow-[0_0_10px_white] animate-[scanline_2s_linear_infinite]"></div>
          </div>
          <div className="flex flex-col items-center gap-4 z-10">
            <div className="w-16 h-16 rounded-2xl bg-purple-600/20 flex items-center justify-center border border-purple-500/40 shadow-[0_0_20px_rgba(147,51,234,0.1)]">
              <i className="fas fa-microchip text-purple-400 text-2xl"></i>
            </div>
            <span className="text-[8px] font-black uppercase text-purple-400 italic">UniMix {chipType}</span>
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-purple-600 to-red-600 relative overflow-hidden mx-4">
             <div className="absolute top-0 left-0 w-2 h-full bg-white shadow-[0_0_10px_white] animate-[scanline_3s_linear_infinite_reverse]"></div>
          </div>
          <div className="flex flex-col items-center gap-4 z-10">
            <div className="w-12 h-12 rounded-xl bg-red-600/20 flex items-center justify-center border border-red-500/40">
              <i className="fas fa-car text-red-400"></i>
            </div>
            <span className="text-[8px] font-black uppercase text-gray-600">Vehicle ECU</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
        <div className="space-y-8">
          <div className="glass p-8 md:p-10 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden">
            <h3 className="text-xl font-black mb-8 flex items-center gap-4 text-white uppercase italic tracking-widest">
              <i className="fas fa-microchip text-purple-600"></i>
              ECU Profile
            </h3>
            <div className="space-y-6">
              <div>
                <label className="text-[9px] font-black text-gray-700 uppercase tracking-[0.3em] mb-3 block">Target Vehicle</label>
                <select 
                  className="w-full bg-black border border-gray-900 p-5 rounded-2xl text-white font-mono text-sm outline-none shadow-inner focus:border-purple-600 transition-colors"
                  value={currentProfile.id}
                  onChange={(e) => setProfile(VEHICLE_PROFILES.find(p => p.id === e.target.value) || VEHICLE_PROFILES[0])}
                >
                  {VEHICLE_PROFILES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              
              {/* Hardware Chip Selector */}
              <div>
                <label className="text-[9px] font-black text-gray-700 uppercase tracking-[0.3em] mb-3 block italic">Hardware Chip Upgrade</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Standard', 'UniMix V2 Core', 'Quantum-CAN X1'] as HardwareChip[]).map(chip => (
                    <button
                      key={chip}
                      onClick={() => onChipChange(chip)}
                      className={`p-3 rounded-xl border font-black text-[8px] uppercase tracking-widest transition-all ${
                        chipType === chip 
                        ? 'bg-purple-600 border-purple-400 text-white shadow-lg' 
                        : 'bg-black border-gray-800 text-gray-600 hover:border-gray-700'
                      }`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="p-5 bg-black/40 rounded-2xl border border-gray-900">
                  <p className="text-[8px] text-gray-700 uppercase font-black mb-1">Architecture</p>
                  <p className="text-sm font-black text-gray-300 italic">{currentProfile.ecuType}</p>
                </div>
                <div className="p-5 bg-black/40 rounded-2xl border border-gray-900">
                  <p className="text-[8px] text-gray-700 uppercase font-black mb-1">Fueling</p>
                  <p className="text-sm font-black text-gray-300 italic">{currentProfile.fuelType}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass p-8 md:p-10 rounded-[3rem] border border-emerald-500/10 shadow-2xl">
            <h3 className="text-xl font-black mb-4 text-emerald-500 uppercase italic tracking-widest flex items-center gap-3">
              <i className="fas fa-check-shield"></i> Safety & Regulatory
            </h3>
            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest leading-relaxed mb-6">
              Warning: Calibration changes that bypass emissions controls (EGR/EVAP/CAT) are for competition use only. UniMix Pro assumes no liability for street-legal compliance.
            </p>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-4 bg-black/40 rounded-xl border border-gray-900">
                <span className="text-[9px] font-black uppercase text-gray-600">Hardware Auth</span>
                <span className={`font-mono text-[10px] font-black ${hardware.getLinkStatus() === 'PHYSICAL_LINK' ? 'text-emerald-500' : 'text-orange-500'}`}>
                  {hardware.getLinkStatus()}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-black/40 rounded-xl border border-gray-900">
                <span className="text-[9px] font-black uppercase text-gray-600">CAN Protocol</span>
                <span className="text-emerald-500 font-mono text-[10px] font-black italic">SAE J1939-21</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="glass p-8 md:p-10 rounded-[3rem] border border-red-500/10 shadow-2xl">
            <h3 className="text-xl font-black mb-8 text-red-500 flex items-center gap-4 uppercase italic tracking-widest">
              <i className="fas fa-user-shield"></i> Engineering Access
            </h3>
            <div className="space-y-4">
              <button className="w-full py-5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-2xl font-black text-[9px] uppercase tracking-[0.3em] transition-all text-gray-400 hover:text-white flex items-center justify-center gap-3">
                <i className="fas fa-file-export"></i> Dump Calibration Binary
              </button>
              <button 
                onClick={onDisconnect}
                className="w-full py-5 bg-red-600/10 text-red-500 hover:bg-red-600 border border-red-500/30 hover:text-white rounded-2xl font-black text-[9px] uppercase tracking-[0.4em] transition-all shadow-xl shadow-red-600/10"
              >
                Terminate Master Link
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-12 text-center opacity-20">
         <p className="text-[8px] font-black uppercase tracking-[0.8em] text-gray-500 italic">UniMix Pro v5.5 // Bluetooth Protected Stack</p>
      </div>
    </div>
  );
};

export default Settings;
