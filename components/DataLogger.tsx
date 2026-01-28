
import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Telemetry } from '../types';

interface DataLoggerProps {
  logs: Telemetry[];
  isRecording: boolean;
  onToggleRecording: () => void;
  onClear: () => void;
}

const DataLogger: React.FC<DataLoggerProps> = ({ logs, isRecording, onToggleRecording, onClear }) => {
  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Data Logger</h2>
          <p className="text-gray-500">High-fidelity session recording and analysis.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={onClear}
            className="px-6 py-2 border border-gray-700 hover:bg-gray-800 rounded-lg font-bold transition-all"
          >
            Clear Session
          </button>
          <button 
            onClick={onToggleRecording}
            className={`px-8 py-2 rounded-lg font-bold flex items-center gap-2 transition-all ${
              isRecording ? 'bg-red-600 hover:bg-red-500 animate-pulse' : 'bg-green-600 hover:bg-green-500'
            }`}
          >
            <i className={`fas ${isRecording ? 'fa-stop' : 'fa-play'}`}></i>
            {isRecording ? 'Stop Recording' : 'Start Session'}
          </button>
        </div>
      </div>

      <div className="flex-1 glass rounded-2xl p-4 min-h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={logs.slice(-50)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="timestamp" hide />
            <YAxis yAxisId="left" stroke="#888" />
            <YAxis yAxisId="right" orientation="right" stroke="#888" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
              itemStyle={{ color: '#fff' }}
            />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="rpm" 
              stroke="#f43f5e" 
              dot={false} 
              isAnimationActive={false}
              name="RPM"
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="boost" 
              stroke="#3b82f6" 
              dot={false} 
              isAnimationActive={false}
              name="Boost"
            />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="afr" 
              stroke="#10b981" 
              dot={false} 
              isAnimationActive={false}
              name="AFR"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full text-left">
          <thead className="text-gray-500 uppercase text-xs font-bold border-b border-gray-800">
            <tr>
              <th className="py-2">Time</th>
              <th>RPM</th>
              <th>Boost</th>
              <th>AFR</th>
              <th>Temp</th>
              <th>Knock</th>
            </tr>
          </thead>
          <tbody className="text-sm font-mono">
            {logs.slice(-5).reverse().map((log, i) => (
              <tr key={i} className="border-b border-gray-900 last:border-0">
                <td className="py-3 text-gray-400">{new Date(log.timestamp).toLocaleTimeString()}</td>
                <td className="text-red-400">{log.rpm.toFixed(0)}</td>
                <td className="text-blue-400">{log.boost.toFixed(1)}</td>
                <td className="text-emerald-400">{log.afr.toFixed(2)}</td>
                <td className="text-orange-400">{log.coolantTemp.toFixed(1)}</td>
                <td className={log.knock > 0 ? 'text-red-500 font-bold' : 'text-gray-600'}>{log.knock.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataLogger;
