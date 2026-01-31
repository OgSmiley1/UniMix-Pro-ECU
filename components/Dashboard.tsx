
import React, { useEffect, useState, useRef } from 'react';
import Gauge from './Gauge';
import { Telemetry } from '../types';

interface DashboardProps {
  telemetry: Telemetry;
}

// A subtle value component that pulses whenever the value changes
const LiveValue: React.FC<{ value: string | number; colorClass?: string }> = ({ value, colorClass = "text-white" }) => {
  const [pulse, setPulse] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current !== value) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 300);
      prevValue.current = value;
      return () => clearTimeout(timer);
    }
  }, [value]);

  return (
    <span className={`${colorClass} transition-all duration-300 ${pulse ? 'animate-value-pulse brightness-150' : ''}`}>
      {value}
    </span>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ telemetry }) => {
  const getAfrColor = (afr: number) => {
    if (afr < 11.5) return "#ef4444"; 
    if (afr > 15.5) return "#f59e0b"; 
    return "#10b981"; 
  };

  return (
    <div className="flex flex-col h-full bg-[#020202] pb-24 md:pb-8 font-sans overflow-y-auto no-scrollbar scanline relative">
      {/* Subtle Data Stream Indicator at the very top */}
      <div className="w-full h-0.5 bg-gray-900/20 relative overflow-hidden">
        <div className="absolute top-0 left-0 h-full w-24 bg-gradient-to-r from-transparent via-purple-500 to-transparent animate-[scanline_2s_linear_infinite]"></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 p-4 md:p-10 z-10">
        <div className="flex justify-center transform hover:scale-105 transition-all duration-500">
          <Gauge 
            value={telemetry.rpm} 
            min={0} 
            max={9000} 
            label="Engine Speed" 
            unit="RPM" 
            color="#f43f5e" 
            size={window.innerWidth < 768 ? 160 : 240}
          />
        </div>
        <div className="flex justify-center transform hover:scale-105 transition-all duration-500">
          <Gauge 
            value={telemetry.boost} 
            min={-14.7} 
            max={45} 
            label="MAP Pressure" 
            unit="PSI" 
            color="#3b82f6" 
            size={window.innerWidth < 768 ? 160 : 240}
          />
        </div>
        <div className="flex justify-center transform hover:scale-105 transition-all duration-500">
          <Gauge 
            value={telemetry.afr} 
            min={9} 
            max={18} 
            label="Wideband AFR" 
            unit="AFR" 
            color={getAfrColor(telemetry.afr)} 
            size={window.innerWidth < 768 ? 160 : 240}
          />
        </div>
        <div className="flex justify-center transform hover:scale-105 transition-all duration-500">
          <Gauge 
            value={telemetry.coolantTemp} 
            min={40} 
            max={140} 
            label="ECT Sensor" 
            unit="°C" 
            color={telemetry.coolantTemp > 105 ? "#ef4444" : "#f59e0b"} 
            size={window.innerWidth < 768 ? 160 : 240}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-5 px-4 md:px-10 z-10">
        {[
          { label: 'Oil Pressure', value: telemetry.oilPressure, unit: 'PSI', color: 'text-cyan-400' },
          { label: 'Duty Cycle', value: telemetry.injDutyCycle, unit: '%', color: 'text-purple-400' },
          { label: 'Fuel Press.', value: telemetry.fuelPressure, unit: 'PSI', color: 'text-emerald-400' },
          { label: 'Air Intake', value: telemetry.iat, unit: '°C', color: 'text-amber-400' },
          { label: 'MAP Volts', value: telemetry.mapVoltage, unit: 'V', color: 'text-blue-300' },
          { label: 'Ign. Timing', value: 15 + (telemetry.throttle / 5), unit: 'BTDC', color: 'text-orange-400' },
        ].map((stat, i) => (
          <div key={i} className="glass p-5 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[8px] text-gray-700 uppercase font-black tracking-[0.2em]">{stat.label}</p>
              <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse opacity-50"></div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className={`text-2xl font-mono font-black ${stat.color}`}>
                <LiveValue value={stat.value.toFixed(stat.unit === '%' ? 1 : 0)} colorClass={stat.color} />
              </p>
              <span className="text-[10px] font-bold text-gray-800 uppercase">{stat.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 md:px-10 mt-8 z-10">
        <div className="glass p-6 rounded-[2.5rem] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
             <div className="w-16 h-16 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center relative overflow-hidden">
               <i className={`fas fa-bolt text-2xl ${telemetry.knock > 1.2 ? 'text-red-500 animate-pulse' : 'text-emerald-500 opacity-20'}`}></i>
               {/* Live Signal Ripple */}
               <div className="absolute inset-0 bg-emerald-500/5 animate-ping"></div>
             </div>
             <div>
               <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1 flex items-center gap-2">
                 Safety Relay Status
                 <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
               </h4>
               <p className={`text-sm font-mono font-black ${telemetry.knock > 1.2 ? 'text-red-500' : 'text-emerald-400'}`}>
                 {telemetry.knock > 1.2 ? `KNOCK DETECTED // RETARDING TIMING` : 'SYSTEM NOMINAL // STREAMING LIVE'}
               </p>
             </div>
          </div>
          <div className="flex gap-8">
             <div className="text-right">
               <p className="text-[8px] font-black uppercase text-gray-700 tracking-tighter">0-100 KM/H</p>
               <p className="text-3xl font-mono font-black text-white italic">
                 <LiveValue value={telemetry.zeroToSixty ? telemetry.zeroToSixty.toFixed(2) : '--.--'} />
                 <span className="text-[12px] ml-1">S</span>
               </p>
             </div>
             <div className="w-px h-12 bg-gray-900 mx-2"></div>
             <div className="text-right">
               <p className="text-[8px] font-black uppercase text-gray-700 tracking-tighter">Velocity</p>
               <p className="text-3xl font-mono font-black text-white italic">
                 <LiveValue value={telemetry.speed.toFixed(0)} />
                 <span className="text-[12px] ml-1">KM/H</span>
               </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
