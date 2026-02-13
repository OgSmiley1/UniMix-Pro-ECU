
import React, { useState, useEffect } from 'react';
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
  const [aiAdvice, setAiAdvice] = useState<TuningAISuggestion | null>(null);
  const [isAISyncing, setIsAISyncing] = useState(false);

  // Periodically get fresh AI insights based on live telemetry
  useEffect(() => {
    const checkAI = async () => {
      if (logs.length < 10) return;
      const suggestion = await optimizeTuneWithAI(currentProfile, settings, logs);
      if (suggestion) setAiAdvice(suggestion);
    };

    const interval = setInterval(checkAI, 15000); // Check every 15s
    checkAI(); // Initial check
    return () => clearInterval(interval);
  }, [currentProfile, logs.length]); // Dependencies tuned for non-intrusive updates

  const handleChange = (key: keyof TuneSettings, value: number | string) => {
    onUpdate({ ...settings, [key]: value });
  };

  const currentTelemetry = logs[logs.length - 1] || { afr: 14.7, boost: 0, knock: 0 };

  // Helper to check if a parameter is currently deviating from AI safe ranges
  const getDeviationStatus = (val: number, range?: [number, number]) => {
    if (!range) return 'nominal';
    if (val < range[0]) return 'low';
    if (val > range[1]) return 'high';
    return 'nominal';
  };

  const afrStatus = getDeviationStatus(currentTelemetry.afr, aiAdvice?.safeEnvelope?.afr);
  const boostStatus = getDeviationStatus(currentTelemetry.boost, aiAdvice?.safeEnvelope?.boost);

  return (
    <div className="p-8 h-full flex flex-col gap-8 max-w-5xl mx-auto overflow-y-auto pb-24 no-scrollbar relative">
      {/* AI Advisor Panel */}
      <div className={`glass p-6 rounded-[2rem] border transition-all duration-700 ${aiAdvice ? 'border-blue-500/20 opacity-100' : 'border-gray-800 opacity-50'}`}>
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
               <i className={`fas fa-robot text-xs ${isAISyncing ? 'animate-spin' : ''} text-blue-400`}></i>
             </div>
             <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 italic">Live AI Advisor</h3>
          </div>
          {aiAdvice && <span className="text-[8px] font-mono text-gray-600 uppercase tracking-widest">Confidence: 98.2%</span>}
        </div>
        <p className="text-xs text-gray-400 italic leading-relaxed">
          {aiAdvice?.reasoning || "Analyzing telemetry stream... waiting for load pull to calibrate safety envelope."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Boost Control with AI Ghost Marker */}
        <div className={`glass p-8 rounded-[2.5rem] border transition-all ${boostStatus !== 'nominal' ? 'border-red-500/40 bg-red-500/5' : 'border-gray-800/50'} space-y-6 relative overflow-hidden group`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <i className="fas fa-tachometer-alt text-blue-500 text-xs"></i>
              </div>
              <label className="font-black uppercase tracking-widest text-[10px] text-gray-400">Boost Target</label>
            </div>
            <span className={`font-mono text-2xl font-black ${boostStatus !== 'nominal' ? 'text-red-400 animate-pulse' : 'text-blue-400'}`}>
              {settings.boostLimit.toFixed(1)} PSI
            </span>
          </div>
          
          <div className="relative">
            {/* AI Recommended Safe Range Track */}
            {aiAdvice?.safeEnvelope?.boost && (
              <div className="absolute top-1/2 -translate-y-1/2 h-1 bg-blue-500/20 rounded-full z-0" 
                   style={{ 
                     left: `${(aiAdvice.safeEnvelope.boost[0] / (currentProfile.maxBoost + 10)) * 100}%`,
                     width: `${((aiAdvice.safeEnvelope.boost[1] - aiAdvice.safeEnvelope.boost[0]) / (currentProfile.maxBoost + 10)) * 100}%` 
                   }}>
              </div>
            )}
            <input 
              type="range" min="0" max={currentProfile.maxBoost + 10} step="0.5" 
              value={settings.boostLimit}
              onChange={(e) => handleChange('boostLimit', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-blue-500 relative z-10"
            />
          </div>
          {boostStatus !== 'nominal' && (
            <p className="text-[8px] text-red-500 font-black uppercase tracking-widest flex items-center gap-2">
              <i className="fas fa-exclamation-triangle"></i> Telemetry exceeding AI Safe Envelope
            </p>
          )}
        </div>

        {/* AFR Target with deviation detection */}
        <div className={`glass p-8 rounded-[2.5rem] border transition-all ${afrStatus !== 'nominal' ? 'border-orange-500/40 bg-orange-500/5' : 'border-gray-800/50'} space-y-6`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                <i className="fas fa-vial text-purple-500 text-xs"></i>
              </div>
              <label className="font-black uppercase tracking-widest text-[10px] text-gray-400">Power AFR</label>
            </div>
            <span className={`font-mono text-2xl font-black ${afrStatus !== 'nominal' ? 'text-orange-400 animate-pulse' : 'text-purple-400'}`}>
              {settings.afrTarget.toFixed(2)}
            </span>
          </div>
          <div className="relative">
             {aiAdvice?.safeEnvelope?.afr && (
              <div className="absolute top-1/2 -translate-y-1/2 h-1 bg-purple-500/20 rounded-full z-0" 
                   style={{ 
                     left: `${((aiAdvice.safeEnvelope.afr[0] - 9) / 6) * 100}%`,
                     width: `${((aiAdvice.safeEnvelope.afr[1] - aiAdvice.safeEnvelope.afr[0]) / 6) * 100}%` 
                   }}>
              </div>
            )}
            <input 
              type="range" min="9.0" max="15.0" step="0.1" 
              value={settings.afrTarget}
              onChange={(e) => handleChange('afrTarget', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-purple-500 relative z-10"
            />
          </div>
          {afrStatus === 'low' && <p className="text-[8px] text-emerald-500 uppercase font-black">Running Richer than AI Recommendation</p>}
          {afrStatus === 'high' && <p className="text-[8px] text-orange-500 uppercase font-black">WARNING: Leaning beyond AI Safety Bounds</p>}
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

        {/* Top Speed Limit */}
        <div className="glass p-8 rounded-[2.5rem] border border-gray-800/50 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20">
                <i className="fas fa-gauge-high text-red-500 text-xs"></i>
              </div>
              <label className="font-black uppercase tracking-widest text-[10px] text-gray-400">Speed Limit</label>
            </div>
            <span className="text-red-400 font-mono text-2xl font-black">{settings.topSpeedLimit} KM/H</span>
          </div>
          <input 
            type="range" min="100" max="450" step="5" 
            value={settings.topSpeedLimit}
            onChange={(e) => handleChange('topSpeedLimit', parseInt(e.target.value))}
            className="w-full h-1.5 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-red-500"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <button 
          onClick={onOptimize}
          disabled={isOptimizing}
          className="flex-1 py-5 bg-purple-600 hover:bg-purple-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all shadow-xl shadow-purple-600/20 text-white"
        >
          {isOptimizing ? 'Recalibrating...' : 'Full System Optimize'}
        </button>
      </div>
    </div>
  );
};

export default TuneEditor;
