
import React from 'react';

interface GaugeProps {
  value: number | null;
  min: number;
  max: number;
  label: string;
  unit: string;
  color?: string;
  size?: number;
}

const Gauge: React.FC<GaugeProps> = ({
  value,
  min,
  max,
  label,
  unit,
  color = '#7c3aed',
  size = 200
}) => {
  const hasValue = value !== null;
  const displayColor = hasValue ? color : '#3f3f46';
  const radius = (size / 2) - 10;
  const circumference = 2 * Math.PI * radius;
  const progress = hasValue ? Math.min(Math.max((value - min) / (max - min), 0), 1) : 0;
  const dashOffset = circumference * (1 - progress * 0.75); // 270 degree arc

  return (
    <div className="flex flex-col items-center justify-center relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-[225deg]">
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1e1e1e"
          strokeWidth="12"
          strokeDasharray={`${circumference * 0.75} ${circumference}`}
          strokeLinecap="round"
        />
        {/* Progress Bar */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={displayColor}
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-out"
        />
      </svg>

      {/* Value Readout */}
      <div className="absolute inset-0 flex flex-col items-center justify-center mt-2">
        <span className={`text-4xl font-black tracking-tighter ${hasValue ? 'text-white' : 'text-gray-700'}`}>
          {hasValue ? value.toFixed(unit === 'AFR' ? 2 : 0) : 'N/A'}
        </span>
        <span className="text-xs uppercase font-bold text-gray-500">{unit}</span>
      </div>
      
      {/* Label */}
      <div className="absolute bottom-0 text-sm font-bold uppercase tracking-widest text-gray-400">
        {label}
      </div>
    </div>
  );
};

export default Gauge;
