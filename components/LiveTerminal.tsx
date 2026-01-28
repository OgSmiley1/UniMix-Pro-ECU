
import React, { useEffect, useState, useRef } from 'react';

const LiveTerminal: React.FC = () => {
  const [lines, setLines] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const timestamp = new Date().getTime().toString(16).slice(-8).toUpperCase();
      const arbId = ["0x7E0", "0x7E8", "0x18DAF110", "0x201"].sort(() => Math.random() - 0.5)[0];
      const data = Array.from({ length: 8 }, () => 
        Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase()
      ).join(' ');
      
      const newLine = `[${timestamp}]  ${arbId}  DATA: ${data}`;
      setLines(prev => [...prev.slice(-100), newLine]);
    }, 150);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div className="flex flex-col h-full bg-black border border-purple-900/30 rounded-xl overflow-hidden font-mono text-[10px]">
      <div className="bg-gray-900 px-4 py-2 border-b border-gray-800 flex justify-between items-center">
        <span className="text-purple-400 font-bold tracking-widest uppercase">CAN-BUS RAW ECHO</span>
        <div className="flex gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-gray-600">BAUD: 500K</span>
        </div>
      </div>
      <div 
        ref={scrollRef}
        className="flex-1 p-4 overflow-y-auto space-y-1 text-gray-400 leading-none scrollbar-hide"
      >
        {lines.map((line, i) => (
          <div key={i} className="hover:bg-white/5 transition-colors py-0.5">
            <span className="text-gray-600 mr-2">{i.toString().padStart(4, '0')}</span>
            {line}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveTerminal;
