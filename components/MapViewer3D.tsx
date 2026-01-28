
import React, { useState, useEffect, useCallback, useRef } from 'react';

interface MapViewerProps {
  currentRpm: number;
  currentLoad: number;
}

const MapViewer3D: React.FC<MapViewerProps> = ({ currentRpm, currentLoad }) => {
  const [activeMap, setActiveMap] = useState<'fuel' | 'ignition'>('fuel');
  const [selectedCell, setSelectedCell] = useState<{ r: number, c: number } | null>(null);
  const [isLiveTracing, setIsLiveTracing] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const initializeGrid = (type: 'fuel' | 'ignition') => {
    return Array.from({ length: 16 }, (_, r) =>
      Array.from({ length: 16 }, (_, c) => {
        const load = (15 - r) * 6.6;
        const rpm = c * 500 + 500;
        return type === 'fuel' 
          ? 14.7 - (load / 25) - (rpm / 8000) 
          : 35 - (load / 5) + (rpm / 2000);
      })
    );
  };

  const [fuelGrid, setFuelGrid] = useState(initializeGrid('fuel'));
  const [ignGrid, setIgnGrid] = useState(initializeGrid('ignition'));

  const grid = activeMap === 'fuel' ? fuelGrid : ignGrid;

  const updateCellValue = useCallback((newValue: number, r: number, c: number) => {
    const newGrid = grid.map((row, rowIdx) =>
      row.map((cell, colIdx) => (rowIdx === r && colIdx === c ? newValue : cell))
    );
    if (activeMap === 'fuel') setFuelGrid(newGrid);
    else setIgnGrid(newGrid);
  }, [grid, activeMap]);

  const adjustValue = useCallback((delta: number) => {
    if (!selectedCell) return;
    const currentVal = grid[selectedCell.r][selectedCell.c];
    updateCellValue(currentVal + delta, selectedCell.r, selectedCell.c);
  }, [grid, selectedCell, updateCellValue]);

  const getCellColor = (val: number) => {
    if (activeMap === 'fuel') {
      if (val < 11.5) return 'rgba(239, 68, 68, 0.9)';
      if (val < 13.5) return 'rgba(234, 179, 8, 0.9)';
      return 'rgba(16, 185, 129, 0.9)';
    } else {
      if (val < 10) return 'rgba(59, 130, 246, 0.9)';
      if (val < 25) return 'rgba(16, 185, 129, 0.9)';
      return 'rgba(239, 68, 68, 0.9)';
    }
  };

  const loadIndex = 15 - Math.floor(Math.min(currentLoad / 6.6, 15));
  const rpmIndex = Math.floor(Math.min(currentRpm / 500, 15));
  const currentLiveValue = grid[loadIndex][rpmIndex];

  return (
    <div className="flex flex-col h-full bg-[#050505] text-white p-4 md:p-6 gap-6 overflow-hidden pb-24 md:pb-6 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter leading-none flex items-center gap-3">
            <i className="fas fa-microchip text-purple-500"></i>
            Map Editor
          </h2>
          <p className="text-[10px] text-gray-500 font-mono mt-1 tracking-widest uppercase italic">X: RPM | Y: Load [%]</p>
        </div>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
          <div className="bg-black/40 border border-gray-800 p-1 rounded-xl flex shadow-inner shrink-0">
            <button 
              onClick={() => setActiveMap('fuel')}
              className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeMap === 'fuel' ? 'bg-purple-600 text-white' : 'text-gray-500'}`}
            >
              Fuel
            </button>
            <button 
              onClick={() => setActiveMap('ignition')}
              className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeMap === 'ignition' ? 'bg-purple-600 text-white' : 'text-gray-500'}`}
            >
              Ignition
            </button>
          </div>
          <button 
            onClick={() => setIsLiveTracing(!isLiveTracing)}
            className={`px-4 py-2 rounded-xl border font-black text-[9px] uppercase tracking-widest shrink-0 ${isLiveTracing ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500/30' : 'bg-gray-800 text-gray-500 border-gray-700'}`}
          >
            Tracer {isLiveTracing ? 'Active' : 'Locked'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
        {/* Main Grid Scroll Container */}
        <div className="flex-1 glass rounded-[2rem] md:rounded-[2.5rem] border border-gray-800/40 p-2 md:p-4 overflow-auto scrollbar-hide relative shadow-2xl">
          <div className="min-w-[600px] h-full flex flex-col">
            <div className="grid grid-cols-17 gap-0.5">
              <div className="h-8"></div>
              {Array.from({length: 16}).map((_, i) => (
                <div key={i} className={`text-[8px] text-center font-mono py-2 ${rpmIndex === i && isLiveTracing ? 'text-purple-400 font-black' : 'text-gray-600'}`}>
                  {i * 500 + 500}
                </div>
              ))}
              
              {grid.map((row, r) => (
                <React.Fragment key={r}>
                  <div className={`text-[8px] flex items-center pr-2 font-mono justify-end h-8 ${loadIndex === r && isLiveTracing ? 'text-purple-400 font-black' : 'text-gray-600'}`}>
                    {((15 - r) * 6.6).toFixed(0)}
                  </div>
                  {row.map((val, c) => {
                    const isTracer = r === loadIndex && c === rpmIndex && isLiveTracing;
                    const isSelected = selectedCell?.r === r && selectedCell?.c === c;
                    return (
                      <div 
                        key={`${r}-${c}`}
                        onClick={() => setSelectedCell({ r, c })}
                        style={{ backgroundColor: getCellColor(val) }}
                        className={`
                          h-8 rounded-sm flex items-center justify-center text-[9px] font-mono font-black cursor-pointer transition-all relative
                          ${isSelected ? 'ring-2 ring-white z-20 scale-110 brightness-125' : 'opacity-80 hover:opacity-100'}
                          ${isTracer ? 'ring-1 ring-purple-400 ring-offset-1 ring-offset-black z-10' : ''}
                        `}
                      >
                        {val.toFixed(1)}
                        {isTracer && <div className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none"></div>}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="w-full md:w-80 flex flex-col gap-4 overflow-y-auto">
          {selectedCell ? (
            <div className="glass p-5 rounded-[2rem] border border-gray-800 shadow-xl space-y-4">
              <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
                <i className="fas fa-edit text-purple-500"></i> Cell Modulator
              </h3>
              
              <div className="bg-black/60 p-4 rounded-2xl border border-gray-800 text-center">
                <p className="text-[8px] text-gray-700 uppercase font-black mb-1">Current</p>
                <div className="flex items-center justify-center gap-3">
                  <button onClick={() => adjustValue(-0.1)} className="p-3 bg-gray-900 rounded-lg text-white">-</button>
                  <input 
                    type="number"
                    className="w-24 bg-transparent text-3xl font-black font-mono text-center outline-none"
                    value={grid[selectedCell.r][selectedCell.c].toFixed(1)}
                    onChange={(e) => updateCellValue(parseFloat(e.target.value) || 0, selectedCell.r, selectedCell.c)}
                  />
                  <button onClick={() => adjustValue(0.1)} className="p-3 bg-gray-900 rounded-lg text-white">+</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                 <button onClick={() => adjustValue(0.5)} className="py-3 bg-gray-800 rounded-xl text-[9px] font-black uppercase tracking-widest">+0.5</button>
                 <button onClick={() => adjustValue(-0.5)} className="py-3 bg-gray-800 rounded-xl text-[9px] font-black uppercase tracking-widest">-0.5</button>
              </div>

              <button 
                onClick={() => alert("Hardware Calibration Map Updated Successfully.")}
                className="w-full py-4 bg-purple-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all"
              >
                Write to RAM
              </button>
            </div>
          ) : (
            <div className="glass p-8 rounded-[2rem] border-2 border-dashed border-gray-800/50 text-center">
              <p className="text-[9px] uppercase font-black tracking-[0.2em] text-gray-700">Select cell to calibrate</p>
            </div>
          )}
          
          <div className="glass p-5 rounded-[2rem] border border-gray-800">
             <div className="flex justify-between items-center mb-4">
               <span className="text-[9px] font-black uppercase text-gray-600">Tracer Logic</span>
               <span className="text-[10px] font-mono text-emerald-400 font-bold">{currentLiveValue.toFixed(2)}</span>
             </div>
             <div className="grid grid-cols-2 gap-3 text-center">
               <div className="bg-black/30 p-3 rounded-xl border border-gray-900">
                 <p className="text-[7px] text-gray-700 font-black mb-1">LOAD</p>
                 <p className="text-xs font-mono font-black text-purple-400">{currentLoad.toFixed(1)}</p>
               </div>
               <div className="bg-black/30 p-3 rounded-xl border border-gray-900">
                 <p className="text-[7px] text-gray-700 font-black mb-1">RPM</p>
                 <p className="text-xs font-mono font-black text-purple-400">{currentRpm.toFixed(0)}</p>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapViewer3D;
