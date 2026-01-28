
import React, { useEffect, useState, useRef } from 'react';

const LiveTerminal: React.FC = () => {
  const [lines, setLines] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Listen for simulated/real CAN commands from the hardware service
    const handleTx = (e: any) => {
      const { cmd } = e.detail;
      const timestamp = new Date().getTime().toString(16).slice(-8).toUpperCase();
      const newLine = `[${timestamp}]  TX_CMD  >>  ${cmd}`;
      setLines(prev => [...prev.slice(-100), newLine]);
    };

    window.addEventListener('can-bus-tx', handleTx as EventListener);

    // 2. Continuous Background Noise (Simulated CAN Traffic)
    const interval = setInterval(() => {
      const timestamp = new Date().getTime().toString(16).slice(-8).toUpperCase();
      const arbId = ["0x7E0", "0x7E8", "0x18DAF110", "0x201", "0x32A", "0x4B0"].sort(() => Math.random() - 0.5)[0];
      const data = Array.from({ length: 8 }, () => 
        Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase()
      ).join(' ');
      
      const newLine = `[${timestamp}]  ${arbId}  DATA: ${data}`;
      setLines(prev => [...prev.slice(-100), newLine]);
    }, 200);

    return () => {
      clearInterval(interval);
      window.removeEventListener('can-bus-tx', handleTx as EventListener);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div className="flex flex-col h-full bg-[#050505] border border-gray-900 rounded-2xl overflow-hidden font-mono text-[9px] shadow-2xl">
      <div className="bg-[#0a0a0a] px-5 py-3 border-b border-gray-900 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <i className="fas fa-terminal text-purple-500 text-[10px]"></i>
          <span className="text-gray-400 font-black tracking-[0.2em] uppercase">CAN-BUS ANALYZER</span>
        </div>
        <div className="flex gap-4 items-center">
          <span className="text-[8px] text-emerald-500 font-bold tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">500 KBPS</span>
          <div className="flex gap-1">
             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
             <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-ping"></div>
          </div>
        </div>
      </div>
      <div 
        ref={scrollRef}
        className="flex-1 p-5 overflow-y-auto space-y-1 text-gray-600 leading-none scrollbar-hide select-none"
      >
        {lines.map((line, i) => {
          const isTx = line.includes('TX_CMD');
          return (
            <div key={i} className={`hover:bg-white/5 transition-colors py-0.5 rounded px-1 ${isTx ? 'bg-purple-900/10 text-purple-400' : ''}`}>
              <span className="text-gray-800 mr-3">{i.toString().padStart(5, '0')}</span>
              <span className={isTx ? 'font-black' : ''}>{line}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LiveTerminal;
