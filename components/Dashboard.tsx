
import React from 'react';
import Gauge from './Gauge';
import { Telemetry } from '../types';

interface DashboardProps {
  telemetry: Telemetry;
}

const Dashboard: React.FC<DashboardProps> = ({ telemetry }) => {
  // Enhanced AFR Color Logic
  const getAfrColor = (afr: number) => {
    if (afr < 11.5) return "#ef4444"; // Rich (Danger/Power)
    if (afr > 15.5) return "#f59e0b"; // Lean (Cruising)
    return "#10b981"; // Stoichiometric
  };

  return (
    <div className="flex flex-col h-full bg-[#020202] pb-24 md:pb-8 font-sans overflow-y-auto scrollbar-hide">
      {/* Primary Performance Cluster */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 p-4 md:p-10">
        <div className="flex justify-center transform hover:scale-105 transition-transform duration-500">
          <Gauge 
            value={telemetry.rpm} 
            min={0} 
            max={8500} 
            label="Engine Speed" 
            unit="RPM" 
            color="#f43f5e" 
            size={window.innerWidth < 768 ? 160 : 220}
          />
        </div>
        <div className="flex justify-center transform hover:scale-105 transition-transform duration-500">
          <Gauge 
            value={telemetry.boost} 
            min={-14.7} 
            max={45} 
            label="Manifold Pressure" 
            unit="PSI" 
            color="#3b82f6" 
            size={window.innerWidth < 768 ? 160 : 220}
          />
        </div>
        <div className="flex justify-center transform hover:scale-105 transition-transform duration-500">
          <Gauge 
            value={telemetry.afr} 
            min={9} 
            max={18} 
            label="Lambda / AFR" 
            unit="AFR" 
            color={getAfrColor(telemetry.afr)} 
            size={window.innerWidth < 768 ? 160 : 220}
          />
        </div>
        <div className="flex justify-center transform hover:scale-105 transition-transform duration-500">
          <Gauge 
            value={telemetry.coolantTemp} 
            min={40} 
            max={130} 
            label="Thermal State" 
            unit="°C" 
            color={telemetry.coolantTemp > 105 ? "#ef4444" : "#f59e0b"} 
            size={window.innerWidth < 768 ? 160 : 220}
          />
        </div>
      </div>

      {/* High-Frequency Data Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-5 px-4 md:px-10">
        {[
          { label: 'Oil Pressure', value: telemetry.oilPressure, unit: 'PSI', color: 'text-cyan-400' },
          { label: 'Inj. Duty', value: telemetry.injDutyCycle, unit: '%', color: 'text-purple-400' },
          { label: 'Fuel Pressure', value: telemetry.fuelPressure, unit: 'PSI', color: 'text-emerald-400' },
          { label: 'Inlet Temp', value: telemetry.iat, unit: '°C', color: 'text-amber-400' },
          { label: 'MAP Voltage', value: telemetry.mapVoltage, unit: 'V', color: 'text-blue-300' },
          { label: 'Knock Volts', value: telemetry.knock, unit: 'V', color: 'text-red-400' },
        ].map((stat, i) => (
          <div key={i} className="glass p-5 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <p className="text-[9px] text-gray-600 uppercase font-black tracking-[0.2em] mb-2">{stat.label}</p>
            <div className="flex items-baseline gap-2">
              <p className={`text-2xl font-mono font-black ${stat.color}`}>{stat.value.toFixed(stat.label.includes('Duty') ? 1 : 0)}</p>
              <span className="text-[10px] font-bold text-gray-800 uppercase">{stat.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Dynamic Alert Banner */}
      <div className="px-4 md:px-10 mt-8">
        <div className="glass p-6 rounded-[2.5rem] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
             <div className="w-16 h-16 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center">
               <i className={`fas fa-bolt text-2xl ${telemetry.knock > 1.5 ? 'text-red-500 animate-pulse' : 'text-emerald-500 opacity-20'}`}></i>
             </div>
             <div>
               <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Ignition Safety Monitor</h4>
               <p className={`text-sm font-mono font-bold ${telemetry.knock > 1.5 ? 'text-red-500' : 'text-gray-400'}`}>
                 {telemetry.knock > 1.5 ? `DETONATION DETECTED: RETARDING ${telemetry.knock.toFixed(1)}°` : 'COMBUSTION STABILITY: NOMINAL'}
               </p>
             </div>
          </div>
          <div className="flex gap-4">
             <div className="text-right">
               <p className="text-[9px] font-black uppercase text-gray-700 tracking-tighter">V-Box 0-60</p>
               <p className="text-2xl font-mono font-black text-white italic">{telemetry.zeroToSixty ? telemetry.zeroToSixty.toFixed(2) : '--.--'}<span className="text-[10px] ml-1">S</span></p>
             </div>
             <div className="w-px h-10 bg-gray-900 mx-2"></div>
             <div className="text-right">
               <p className="text-[9px] font-black uppercase text-gray-700 tracking-tighter">Current Speed</p>
               <p className="text-2xl font-mono font-black text-white italic">{telemetry.speed.toFixed(0)}<span className="text-[10px] ml-1">KM/H</span></p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
