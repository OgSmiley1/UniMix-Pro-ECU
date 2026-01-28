
import React from 'react';
import { VehicleProfile } from '../types';
import { VEHICLE_PROFILES } from '../constants';

interface SettingsProps {
  currentProfile: VehicleProfile;
  setProfile: (p: VehicleProfile) => void;
  onDisconnect: () => void;
}

const Settings: React.FC<SettingsProps> = ({ currentProfile, setProfile, onDisconnect }) => {
  return (
    <div className="p-8 h-full max-w-5xl mx-auto overflow-y-auto">
      <h2 className="text-3xl font-black uppercase tracking-tighter mb-8">System Configuration</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Vehicle Profile */}
        <div className="space-y-6">
          <div className="glass p-8 rounded-3xl">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
              <i className="fas fa-car text-purple-500"></i>
              Vehicle Profile
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Active Vehicle</label>
                <select 
                  className="w-full bg-black/40 border border-gray-800 p-4 rounded-xl text-white font-bold"
                  value={currentProfile.id}
                  onChange={(e) => setProfile(VEHICLE_PROFILES.find(p => p.id === e.target.value) || VEHICLE_PROFILES[0])}
                >
                  {VEHICLE_PROFILES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-black/20 rounded-xl border border-gray-800">
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Engine</p>
                  <p className="text-sm font-bold">{currentProfile.engine}</p>
                </div>
                <div className="p-4 bg-black/20 rounded-xl border border-gray-800">
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Fuel Type</p>
                  <p className="text-sm font-bold">{currentProfile.fuelType} Octane</p>
                </div>
              </div>

              <div className="p-4 bg-purple-900/10 rounded-xl border border-purple-500/20">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Detected VIN</p>
                    <p className="text-sm font-mono font-bold text-purple-400">{currentProfile.vinPrefix}*************</p>
                  </div>
                  <i className="fas fa-check-circle text-purple-500"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="glass p-8 rounded-3xl">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
              <i className="fas fa-microchip text-blue-500"></i>
              Interface Settings
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-sm font-bold">Refresh Rate</span>
                <span className="text-blue-400 font-mono">100Hz</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-sm font-bold">OBD Protocol</span>
                <span className="text-blue-400 font-mono">CAN-BUS (ISO 15765-4)</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-bold">Hardware Version</span>
                <span className="text-blue-400 font-mono">v3.2.1-Pi</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Zone */}
        <div className="space-y-6">
          <div className="glass p-8 rounded-3xl border-red-900/30">
            <h3 className="text-xl font-bold mb-6 text-red-500 flex items-center gap-3">
              <i className="fas fa-exclamation-triangle"></i>
              Security & Safety
            </h3>
            <div className="space-y-4">
              <button className="w-full py-4 bg-gray-800 hover:bg-gray-700 rounded-xl font-bold text-sm uppercase transition-all">Export Data Logs (.CSV)</button>
              <button className="w-full py-4 bg-gray-800 hover:bg-gray-700 rounded-xl font-bold text-sm uppercase transition-all">Reset Fault Codes (DTC)</button>
              <button 
                onClick={onDisconnect}
                className="w-full py-4 bg-red-600/20 text-red-500 hover:bg-red-600/30 border border-red-500/50 rounded-xl font-bold text-sm uppercase transition-all"
              >
                Terminate ECU Session
              </button>
            </div>
          </div>

          <div className="glass p-8 rounded-3xl">
             <h3 className="text-xl font-bold mb-4">Cloud Sync</h3>
             <p className="text-xs text-gray-500 mb-6 italic">Automatically backup your tunes and performance logs to the UniMix cloud dashboard.</p>
             <div className="flex items-center gap-4 p-4 bg-green-900/10 border border-green-500/30 rounded-xl">
               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
               <span className="text-xs font-bold text-green-500">Connected as Moath Tuning Pro</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
