
import React, { useState } from 'react';
import { TuneSettings, VehicleProfile, Telemetry } from '../types';
import { INITIAL_TUNE } from '../constants';
import { optimizeTuneWithAI, TuningAISuggestion } from '../services/geminiService';

interface TuneEditorProps {
  settings: TuneSettings;
  onUpdate: (settings: TuneSettings) => void;
  onOptimize: () => void;
  isOptimizing: boolean;
  currentProfile: VehicleProfile;
  logs: Telemetry[];
}

const TuneEditor: React.FC<TuneEditorProps> = ({ 
  settings, 
  onUpdate, 
  onOptimize, 
  isOptimizing,
  currentProfile,
  logs
}) => {
  const [isAISyncing, setIsAISyncing] = useState(false);

  const handleChange = (key: keyof TuneSettings, value: number | string) => {
    onUpdate({ ...settings, [key]: value });
  };

  const handleAISync = async () => {
    setIsAISyncing(true);
    const suggestion: TuningAISuggestion | null = await optimizeTuneWithAI(currentProfile, settings, logs);
    if (suggestion) {
      if (confirm(`AI SUGGESTION FOUND:\nBoost: ${suggestion.boostLimit} PSI\nAFR: ${suggestion.afrTarget}\n\nReason: ${suggestion.reasoning}\n\nApply these settings?`)) {
        const { reasoning, ...tuneParams } = suggestion;
        onUpdate({ ...settings, ...tuneParams });
      }
    } else {
      alert("AI failed to find a stable improvement in the internet database for this profile.");
    }
    setIsAISyncing(false);
  };

  return (
    <div className="p-8 h-full flex flex-col gap-8 max-w-5xl mx-auto overflow-y-auto pb-20 no-scrollbar relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter text-white italic">Logic Master</h2>
          <p className="text-gray-500 font-mono text-[10px] uppercase tracking-widest mt-2">
            Target ECU: <span className="text-purple-500">{currentProfile.ecuType}</span> // Protocol: CAN-High
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleAISync}
            disabled={isAISyncing}
            className={`px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[9px] flex items-center gap-3 transition-all ${
              isAISyncing ? 'bg-blue-900/50 text-blue-400 animate-pulse' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/20 active:scale-95'
            }`}
          >
            <i className={`fas ${isAISyncing ? 'fa-spinner fa-spin' : 'fa-globe'}`}></i>
            Internet AI Sync
          </button>
          <button 
            onClick={onOptimize}
            disabled={isOptimizing}
            className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[9px] flex items-center gap-3 transition-all ${
              isOptimizing ? 'bg-gray-800 text-gray-600' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-xl shadow-purple-600/20 active:scale-95 border border-purple-400/30'
            }`}
          >
            {isOptimizing ? <i className="fas fa-microchip fa-spin"></i> : <i className="fas fa-bolt"></i>}
            Local Optimizer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Boost Control */}
        <div className="glass p-8 rounded-[2.5rem] border border-gray-800/50 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <i className="fas fa-tachometer-alt text-blue-500 text-xs"></i>
              </div>
              <label className="font-black uppercase tracking-widest text-[10px] text-gray-400">Boost Target</label>
            </div>
            <span className="text-blue-400 font-mono text-2xl font-black">{settings.boostLimit.toFixed(1)} PSI</span>
          </div>
          <input 
            type="range" min="0" max={currentProfile.maxBoost + 10} step="0.5" 
            value={settings.boostLimit}
            onChange={(e) => handleChange('boostLimit', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        {/* Top Speed Limit */}
        <div className="glass p-8 rounded-[2.5rem] border border-gray-800/50 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20">
                <i className="fas fa-gauge-high text-red-500 text-xs"></i>
              </div>
              <label className="font-black uppercase tracking-widest text-[10px] text-gray-400">Top Speed Limit</label>
            </div>
            <span className="text-red-400 font-mono text-2xl font-black">{settings.topSpeedLimit} <span className="text-[10px]">KM/H</span></span>
          </div>
          <input 
            type="range" min="100" max="450" step="5" 
            value={settings.topSpeedLimit}
            onChange={(e) => handleChange('topSpeedLimit', parseInt(e.target.value))}
            className="w-full h-1.5 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-red-500"
          />
        </div>

        {/* Global Offset */}
        <div className="glass p-8 rounded-[2.5rem] border border-gray-800/50 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                <i className="fas fa-arrows-alt-h text-cyan-500 text-xs"></i>
              </div>
              <label className="font-black uppercase tracking-widest text-[10px] text-gray-400">Global Offset</label>
            </div>
            <span className="text-cyan-400 font-mono text-2xl font-black">{settings.globalOffset > 0 ? '+' : ''}{settings.globalOffset.toFixed(1)}%</span>
          </div>
          <input 
            type="range" min="-20" max="20" step="0.5" 
            value={settings.globalOffset}
            onChange={(e) => handleChange('globalOffset', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
        </div>

        {/* Popcorn Intensity */}
        <div className="glass p-8 rounded-[2.5rem] border border-orange-500/20 bg-orange-500/5 space-y-6 relative overflow-hidden group">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                <i className="fas fa-fire text-orange-500 text-xs"></i>
              </div>
              <label className="font-black uppercase tracking-widest text-[10px] text-gray-400 italic">Popcorn Logic</label>
            </div>
            <span className="text-orange-400 font-mono text-2xl font-black italic">{settings.crackleIntensity.toFixed(0)}%</span>
          </div>
          <input 
            type="range" min="0" max="100" step="1" 
            value={settings.crackleIntensity}
            onChange={(e) => handleChange('crackleIntensity', parseInt(e.target.value))}
            className="w-full h-1.5 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
        </div>

        {/* Ignition */}
        <div className="glass p-8 rounded-[2.5rem] border border-gray-800/50 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <i className="fas fa-history text-emerald-500 text-xs"></i>
              </div>
              <label className="font-black uppercase tracking-widest text-[10px] text-gray-400">Ignition Offset</label>
            </div>
            <span className="text-emerald-400 font-mono text-2xl font-black">{settings.ignitionOffset > 0 ? '+' : ''}{settings.ignitionOffset.toFixed(1)}°</span>
          </div>
          <input 
            type="range" min="-15" max="15" step="0.5" 
            value={settings.ignitionOffset}
            onChange={(e) => handleChange('ignitionOffset', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        {/* AFR Target */}
        <div className="glass p-8 rounded-[2.5rem] border border-gray-800/50 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                <i className="fas fa-vial text-purple-500 text-xs"></i>
              </div>
              <label className="font-black uppercase tracking-widest text-[10px] text-gray-400">Power AFR</label>
            </div>
            <span className="text-purple-400 font-mono text-2xl font-black">{settings.afrTarget.toFixed(2)}</span>
          </div>
          <input 
            type="range" min="9.0" max="15.0" step="0.1" 
            value={settings.afrTarget}
            onChange={(e) => handleChange('afrTarget', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        <button 
          onClick={() => onUpdate(INITIAL_TUNE)}
          className="flex-1 py-5 bg-gray-900 hover:bg-gray-800 rounded-2xl font-black text-[9px] uppercase tracking-[0.3em] transition-all border border-gray-800 text-gray-500 hover:text-white"
        >
          Factory Reset ECU
        </button>
        <button 
          onClick={() => {
            alert("Success: Calibration Map Flashed to " + currentProfile.ecuType);
          }}
          className="flex-1 py-5 bg-red-600 hover:bg-red-500 rounded-2xl font-black text-[9px] uppercase tracking-[0.3em] transition-all shadow-xl shadow-red-600/20 text-white border border-red-400/30"
        >
          Flash Flash Memory
        </button>
      </div>
    </div>
  );
};

export default TuneEditor;
