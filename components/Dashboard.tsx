
import React from 'react';
import Gauge from './Gauge';
import { Telemetry } from '../types';

interface DashboardProps {
  telemetry: Telemetry;
}

const Dashboard: React.FC<DashboardProps> = ({ telemetry }) => {
  return (
    <div className="flex flex-col h-full bg-[#050505] pb-20 md:pb-0">
      {/* Primary Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 p-4 md:p-8">
        <Gauge 
          value={telemetry.rpm} 
          min={0} 
          max={8000} 
          label="RPM" 
          unit="RPM" 
          color="#f43f5e" 
          size={window.innerWidth < 768 ? 160 : 200}
        />
        <Gauge 
          value={telemetry.boost} 
          min={-14.7} 
          max={30} 
          label="Boost" 
          unit="PSI" 
          color="#3b82f6" 
          size={window.innerWidth < 768 ? 160 : 200}
        />
        <Gauge 
          value={telemetry.afr} 
          min={10} 
          max={16} 
          label="AFR" 
          unit="AFR" 
          color="#10b981" 
          size={window.innerWidth < 768 ? 160 : 200}
        />
        <Gauge 
          value={telemetry.coolantTemp} 
          min={40} 
          max={120} 
          label="Coolant" 
          unit="°C" 
          color="#f59e0b" 
          size={window.innerWidth < 768 ? 160 : 200}
        />
      </div>

      {/* Mobile-Style Widget Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 px-4 md:px-8 mt-2 md:mt-4">
        <div className="glass p-4 md:p-5 rounded-2xl md:rounded-[2rem] border border-white/5">
          <p className="text-[8px] md:text-[10px] text-gray-600 uppercase font-black tracking-widest mb-1">Oil PSI</p>
          <p className="text-xl md:text-2xl font-mono text-cyan-400 font-black">{telemetry.oilPressure.toFixed(0)}</p>
        </div>
        <div className="glass p-4 md:p-5 rounded-2xl md:rounded-[2rem] border border-white/5">
          <p className="text-[8px] md:text-[10px] text-gray-600 uppercase font-black tracking-widest mb-1">IDC %</p>
          <p className="text-xl md:text-2xl font-mono text-purple-400 font-black">{telemetry.injDutyCycle.toFixed(1)}</p>
        </div>
        <div className="glass p-4 md:p-5 rounded-2xl md:rounded-[2rem] border border-white/5">
          <p className="text-[8px] md:text-[10px] text-gray-600 uppercase font-black tracking-widest mb-1">Fuel PSI</p>
          <p className="text-xl md:text-2xl font-mono text-emerald-400 font-black">{telemetry.fuelPressure.toFixed(0)}</p>
        </div>
        <div className="glass p-4 md:p-5 rounded-2xl md:rounded-[2rem] border border-white/5">
          <p className="text-[8px] md:text-[10px] text-gray-600 uppercase font-black tracking-widest mb-1">0-60 Time</p>
          <p className="text-xl md:text-2xl font-mono text-white font-black">{telemetry.zeroToSixty ? telemetry.zeroToSixty.toFixed(2) : '--.--'}</p>
        </div>
        <div className="glass p-4 md:p-5 rounded-2xl md:rounded-[2rem] border border-white/5 flex flex-col justify-center">
          <p className="text-[8px] md:text-[10px] text-gray-600 uppercase font-black tracking-widest mb-2">Lateral G</p>
          <span className="text-xs md:text-sm font-mono font-bold text-gray-400">{telemetry.gForce.toFixed(2)}G</span>
        </div>
        <div className="glass p-4 md:p-5 rounded-2xl md:rounded-[2rem] border border-white/5">
          <p className="text-[8px] md:text-[10px] text-gray-600 uppercase font-black tracking-widest mb-1">Throttle</p>
          <div className="w-full h-1 bg-gray-900 rounded-full mt-2">
            <div className="h-full bg-emerald-500 transition-all duration-100" style={{ width: `${telemetry.throttle}%` }}></div>
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      <div className="px-4 md:px-8 mt-6 md:mt-8 flex flex-col gap-3">
        {telemetry.knock > 1 && (
          <div className="p-4 md:p-5 bg-red-950/20 border border-red-500/50 rounded-2xl md:rounded-[2rem] flex items-center gap-4 md:gap-6 animate-pulse">
            <i className="fas fa-biohazard text-lg md:text-xl text-red-500"></i>
            <div>
              <h3 className="font-black text-xs md:text-sm text-red-500 uppercase italic">Detonation Alert</h3>
              <p className="text-[9px] md:text-xs text-red-200/60 font-mono">RETARDING_IGNITION: {telemetry.knock.toFixed(1)}°</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
