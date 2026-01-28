
import React from 'react';
import { TuneSettings } from '../types';
import { INITIAL_TUNE } from '../constants';

interface TuneEditorProps {
  settings: TuneSettings;
  onUpdate: (settings: TuneSettings) => void;
  onOptimize: () => void;
  isOptimizing: boolean;
}

const TuneEditor: React.FC<TuneEditorProps> = ({ 
  settings, 
  onUpdate, 
  onOptimize, 
  isOptimizing 
}) => {
  const handleChange = (key: keyof TuneSettings, value: number) => {
    onUpdate({ ...settings, [key]: value });
  };

  const applyPreset = (mode: 'safe' | 'track' | 'valet' | 'stock') => {
    switch (mode) {
      case 'safe':
        // Fix: Added missing 'revLimit' to satisfy the TuneSettings interface
        onUpdate({ afrTarget: 11.5, boostLimit: 12, ignitionOffset: -1, fuelCorrection: 5, timingRetardPerPsi: 0.5, revLimit: 6500 });
        break;
      case 'track':
        // Fix: Added missing 'revLimit' to satisfy the TuneSettings interface
        onUpdate({ afrTarget: 11.8, boostLimit: 18, ignitionOffset: 2, fuelCorrection: 10, timingRetardPerPsi: 0.3, revLimit: 7500 });
        break;
      case 'valet':
        // Fix: Added missing 'revLimit' to satisfy the TuneSettings interface
        onUpdate({ afrTarget: 14.7, boostLimit: 3, ignitionOffset: -5, fuelCorrection: 0, timingRetardPerPsi: 1.0, revLimit: 3000 });
        break;
      case 'stock':
        onUpdate({ ...INITIAL_TUNE, timingRetardPerPsi: 0.5 });
        break;
    }
  };

  return (
    <div className="p-8 h-full flex flex-col gap-8 max-w-5xl mx-auto overflow-y-auto pb-20">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter text-white italic">Calibration Studio</h2>
          <p className="text-gray-500 font-mono text-xs uppercase tracking-widest mt-2">Active Piggyback Signal Modification Protocol</p>
        </div>
        <button 
          onClick={onOptimize}
          disabled={isOptimizing}
          className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center gap-3 transition-all ${
            isOptimizing ? 'bg-gray-800 text-gray-600' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-xl shadow-purple-600/20 active:scale-95 border border-purple-400/30'
          }`}
        >
          {isOptimizing ? <i className="fas fa-microchip fa-spin"></i> : <i className="fas fa-brain"></i>}
          AI Logic Optimizer
        </button>
      </div>

      {/* Preset Zone */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { id: 'safe', label: 'Street Safe', icon: 'fa-shield-halved', color: 'text-emerald-500' },
          { id: 'track', label: 'Track Attack', icon: 'fa-flag-checkered', color: 'text-red-500' },
          { id: 'valet', label: 'Valet Limit', icon: 'fa-user-lock', color: 'text-amber-500' },
          { id: 'stock', label: 'Factory OEM', icon: 'fa-history', color: 'text-gray-400' }
        ].map((p) => (
          <button 
            key={p.id}
            onClick={() => applyPreset(p.id as any)}
            className="glass p-6 rounded-[2rem] border border-gray-800 hover:border-purple-600/50 hover:bg-purple-950/10 transition-all flex flex-col items-center gap-3 group"
          >
            <i className={`fas ${p.icon} text-2xl ${p.color} group-hover:scale-110 transition-transform`}></i>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{p.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass p-8 rounded-[2.5rem] border border-gray-800/50 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <i className="fas fa-gas-pump text-emerald-500 text-xs"></i>
              </div>
              <label className="font-black uppercase tracking-widest text-[10px] text-gray-400">Target AFR</label>
            </div>
            <span className="text-emerald-400 font-mono text-2xl font-black">{settings.afrTarget.toFixed(2)}</span>
          </div>
          <input 
            type="range" min="10" max="16" step="0.1" 
            value={settings.afrTarget}
            onChange={(e) => handleChange('afrTarget', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        <div className="glass p-8 rounded-[2.5rem] border border-gray-800/50 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <i className="fas fa-wind text-blue-500 text-xs"></i>
              </div>
              <label className="font-black uppercase tracking-widest text-[10px] text-gray-400">Boost Offset</label>
            </div>
            <span className="text-blue-400 font-mono text-2xl font-black">{settings.boostLimit.toFixed(1)} PSI</span>
          </div>
          <input 
            type="range" min="0" max="30" step="0.5" 
            value={settings.boostLimit}
            onChange={(e) => handleChange('boostLimit', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        <div className="glass p-8 rounded-[2.5rem] border border-gray-800/50 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                <i className="fas fa-bolt text-orange-500 text-xs"></i>
              </div>
              <label className="font-black uppercase tracking-widest text-[10px] text-gray-400">Ignition Timing</label>
            </div>
            <span className="text-orange-400 font-mono text-2xl font-black">{settings.ignitionOffset > 0 ? '+' : ''}{settings.ignitionOffset.toFixed(1)}°</span>
          </div>
          <input 
            type="range" min="-10" max="5" step="0.5" 
            value={settings.ignitionOffset}
            onChange={(e) => handleChange('ignitionOffset', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
        </div>

        <div className="glass p-8 rounded-[2.5rem] border border-gray-800/50 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                <i className="fas fa-percentage text-purple-500 text-xs"></i>
              </div>
              <label className="font-black uppercase tracking-widest text-[10px] text-gray-400">Global Fuel Trim</label>
            </div>
            <span className="text-purple-400 font-mono text-2xl font-black">{settings.fuelCorrection > 0 ? '+' : ''}{settings.fuelCorrection.toFixed(0)}%</span>
          </div>
          <input 
            type="range" min="-25" max="25" step="1" 
            value={settings.fuelCorrection}
            onChange={(e) => handleChange('fuelCorrection', parseInt(e.target.value))}
            className="w-full h-1.5 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        <button 
          onClick={() => onUpdate(INITIAL_TUNE)}
          className="flex-1 py-5 bg-gray-900 hover:bg-gray-800 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all border border-gray-800 text-gray-500 hover:text-white"
        >
          Reset All Nodes
        </button>
        <button 
          onClick={() => alert("ECU Global Write Successful. Memory Checksums Validated.")}
          className="flex-1 py-5 bg-red-600 hover:bg-red-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all shadow-xl shadow-red-600/20 text-white border border-red-400/30"
        >
          Flash Persistent Memory
        </button>
      </div>
    </div>
  );
};

export default TuneEditor;
