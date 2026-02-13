
import React, { useState, useEffect, useCallback, useRef } from 'react';

interface MapViewerProps {
  currentRpm: number;
  currentLoad: number;
  profileId: string;
}

const MapViewer3D: React.FC<MapViewerProps> = ({ currentRpm, currentLoad, profileId }) => {
  const [activeMap, setActiveMap] = useState<'fuel' | 'ignition'>('fuel');
  const [selectedCell, setSelectedCell] = useState<{ r: number, c: number } | null>(null);
  const [isLiveTracing, setIsLiveTracing] = useState(true);

  // Initialize grids with realistic baseline values
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

  // Update cell helper
  const updateCellValue = useCallback((newValue: number, r: number, c: number) => {
    // Sanitize input
    const sanitized = isNaN(newValue) ? 0 : newValue;
    const updateGrid = (prev: number[][]) => {
      const next = [...prev];
      next[r] = [...next[r]];
      next[r][c] = sanitized;
      return next;
    };

    if (activeMap === 'fuel') setFuelGrid(updateGrid);
    else setIgnGrid(updateGrid);
  }, [activeMap]);

  // Delta adjustment helper
  const adjustValue = useCallback((delta: number) => {
    if (!selectedCell) return;
    const currentVal = grid[selectedCell.r][selectedCell.c];
    updateCellValue(currentVal + delta, selectedCell.r, selectedCell.c);
  }, [grid, selectedCell, updateCellValue]);

  // Acura-specific optimized map application
  const applyAcuraTune = () => {
    const optimized = grid.map((row, r) => 
      row.map((cell, c) => {
        const load = (15 - r) * 6.6;
        if (load > 60) return activeMap === 'fuel' ? 11.5 : cell + 2.0;
        return cell;
      })
    );
    if (activeMap === 'fuel') setFuelGrid(optimized);
    else setIgnGrid(optimized);
    alert("Acura Precision Calibration Applied Successfully.");
  };

  // Dynamic coloring based on value vs safe zones
  const getCellColor = (val: number) => {
    if (activeMap === 'fuel') {
      if (val < 11.0) return 'rgba(239, 68, 68, 0.95)'; // Dangerously rich
      if (val < 12.5) return 'rgba(16, 185, 129, 0.9)';  // Power zone
      if (val < 14.0) return 'rgba(234, 179, 8, 0.8)';   // Cruising
      return 'rgba(59, 130, 246, 0.8)';                // Lean/Eco
    } else {
      if (val < 10) return 'rgba(59, 130, 246, 0.9)';   // Retarded
      if (val < 25) return 'rgba(16, 185, 129, 0.9)';   // Nominal
      return 'rgba(239, 68, 68, 0.95)';                // Aggressive
    }
  };

  // Resolve indices for live tracer crosshair
  const loadIndex = 15 - Math.floor(Math.min(currentLoad / 6.6, 15));
  const rpmIndex = Math.floor(Math.min(currentRpm / 500, 15));
  
  // Crosshair logic: If live tracing, use sensor data. If not, use user selection.
  const tracerR = isLiveTracing ? loadIndex : selectedCell?.r;
  const tracerC = isLiveTracing ? rpmIndex : selectedCell?.c;

  const currentLiveValue = grid[loadIndex]?.[rpmIndex] || 0;

  return (
    <div className="flex flex-col h-full bg-[#050505] text-white p-4 md:p-6 gap-6 overflow-hidden pb-24 md:pb-6 font-sans">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="group">
          <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter leading-none flex items-center gap-3">
            <i className="fas fa-border-all text-purple-500 group-hover:rotate-90 transition-transform duration-500"></i>
            Map Editor
          </h2>
          <p className="text-[10px] text-gray-500 font-mono mt-1 tracking-widest uppercase italic">X: RPM | Y: Load [%]</p>
        </div>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
          {profileId === 'acura-nsx-s' && (
             <button 
               onClick={applyAcuraTune}
               className="px-6 py-2 bg-red-600/10 text-red-500 border border-red-500/30 rounded-xl font-black text-[9px] uppercase tracking-widest shrink-0 hover:bg-red-600 hover:text-white transition-all shadow-lg"
             >
               <i className="fas fa-magic mr-2"></i> Acura Precision Tune
             </button>
          )}
          <div className="bg-black/40 border border-gray-800 p-1 rounded-xl flex shadow-inner shrink-0">
            <button 
              onClick={() => setActiveMap('fuel')}
              className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeMap === 'fuel' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500'}`}
            >
              Fuel
            </button>
            <button 
              onClick={() => setActiveMap('ignition')}
              className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeMap === 'ignition' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500'}`}
            >
              Ignition
            </button>
          </div>
          <button 
            onClick={() => setIsLiveTracing(!isLiveTracing)}
            className={`px-4 py-2 rounded-xl border font-black text-[9px] uppercase tracking-widest shrink-0 transition-all ${isLiveTracing ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500/30 ring-1 ring-emerald-500/20' : 'bg-gray-800 text-gray-500 border-gray-700'}`}
          >
            <i className={`fas ${isLiveTracing ? 'fa-crosshairs' : 'fa-lock'} mr-2`}></i>
            Tracer {isLiveTracing ? 'Active' : 'Locked'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
        {/* Main Grid View */}
        <div className="flex-1 glass rounded-[2.5rem] border border-gray-800/40 p-2 md:p-4 overflow-auto no-scrollbar relative shadow-2xl">
          <div className="min-w-[800px] h-full flex flex-col">
            <div className="grid grid-cols-17 gap-0.5 relative">
              {/* X-Axis Header (RPM) */}
              <div className="h-8"></div>
              {Array.from({length: 16}).map((_, i) => (
                <div key={i} className={`text-[8px] text-center font-mono py-2 transition-colors ${tracerC === i ? 'text-purple-400 font-black' : 'text-gray-600'}`}>
                  {i * 500 + 500}
                </div>
              ))}
              
              {/* Grid Rows */}
              {grid.map((row, r) => (
                <React.Fragment key={r}>
                  {/* Y-Axis Label (Load) */}
                  <div className={`text-[8px] flex items-center pr-2 font-mono justify-end h-8 transition-colors ${tracerR === r ? 'text-purple-400 font-black' : 'text-gray-600'}`}>
                    {((15 - r) * 6.6).toFixed(0)}%
                  </div>
                  {/* Map Cells */}
                  {row.map((val, c) => {
                    const isTracer = r === loadIndex && c === rpmIndex && isLiveTracing;
                    const isSelected = selectedCell?.r === r && selectedCell?.c === c;
                    const isCrosshair = r === tracerR || c === tracerC;
                    
                    return (
                      <div 
                        key={`${r}-${c}`}
                        onClick={() => {
                           setSelectedCell({ r, c });
                           setIsLiveTracing(false); // Stop tracing when user takes manual control
                        }}
                        style={{ backgroundColor: getCellColor(val) }}
                        className={`
                          h-8 rounded-sm flex items-center justify-center text-[9px] font-mono font-black cursor-pointer transition-all relative
                          ${isSelected ? 'ring-2 ring-white z-20 scale-110 brightness-125 shadow-2xl' : 'opacity-80 hover:opacity-100'}
                          ${isTracer ? 'ring-1 ring-emerald-400 ring-offset-1 ring-offset-black z-10' : ''}
                          ${!isTracer && isCrosshair && !isSelected ? 'brightness-110' : ''}
                        `}
                      >
                        {val.toFixed(1)}
                        {isTracer && <div className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none"></div>}
                        {!isTracer && isCrosshair && <div className="absolute inset-0 bg-purple-500/10 pointer-events-none"></div>}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Side Calibration Controls */}
        <div className="w-full md:w-80 flex flex-col gap-4 overflow-y-auto no-scrollbar pb-4">
          {selectedCell ? (
            <div className="glass p-5 rounded-[2rem] border border-gray-800 shadow-xl space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex justify-between items-center">
                <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2 italic">
                  <i className="fas fa-edit text-purple-500"></i> Cell Modulator
                </h3>
                <button onClick={() => setSelectedCell(null)} className="text-gray-700 hover:text-gray-400 transition-colors">
                  <i className="fas fa-times-circle"></i>
                </button>
              </div>
              
              <div className="bg-black/60 p-5 rounded-[1.5rem] border border-gray-800 text-center relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <p className="text-[8px] text-gray-700 uppercase font-black mb-1">Calibration Target</p>
                <div className="flex items-center justify-center gap-3">
                  <button onClick={() => adjustValue(-0.1)} className="w-10 h-10 bg-gray-900 hover:bg-gray-800 rounded-xl text-white font-bold border border-gray-800 transition-all">-</button>
                  <input 
                    type="number"
                    step="0.1"
                    className="w-24 bg-transparent text-3xl font-black font-mono text-center outline-none text-purple-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={grid[selectedCell.r][selectedCell.c].toFixed(1)}
                    onChange={(e) => updateCellValue(parseFloat(e.target.value), selectedCell.r, selectedCell.c)}
                  />
                  <button onClick={() => adjustValue(0.1)} className="w-10 h-10 bg-gray-900 hover:bg-gray-800 rounded-xl text-white font-bold border border-gray-800 transition-all">+</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                 <button onClick={() => adjustValue(0.5)} className="py-3 bg-gray-900 hover:bg-gray-800 rounded-xl text-[9px] font-black uppercase tracking-widest border border-gray-800 transition-all">+0.5 Offset</button>
                 <button onClick={() => adjustValue(-0.5)} className="py-3 bg-gray-900 hover:bg-gray-800 rounded-xl text-[9px] font-black uppercase tracking-widest border border-gray-800 transition-all">-0.5 Offset</button>
              </div>

              <button 
                onClick={() => {
                  const val = grid[selectedCell.r][selectedCell.c].toFixed(2);
                  window.dispatchEvent(new CustomEvent('can-bus-tx', { 
                    detail: { cmd: `WRITE_RAM_ADDR_${selectedCell.r}_${selectedCell.c}_VAL_${val}`, timestamp: Date.now() } 
                  }));
                  alert("RAM Write Sequence Successful.");
                }}
                className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-purple-600/20 active:scale-95 transition-all border border-purple-400/20"
              >
                Flash Address
              </button>
            </div>
          ) : (
            <div className="glass p-8 rounded-[2.5rem] border-2 border-dashed border-gray-800/50 text-center flex items-center justify-center flex-col gap-4 min-h-[220px]">
              <div className="w-12 h-12 rounded-full bg-gray-900/50 flex items-center justify-center border border-gray-800">
                <i className="fas fa-mouse-pointer text-gray-700 text-lg"></i>
              </div>
              <p className="text-[9px] uppercase font-black tracking-[0.2em] text-gray-700 max-w-[150px] leading-relaxed italic">Select a table cell to initiate manual calibration</p>
            </div>
          )}
          
          {/* Live Tracer Data */}
          <div className="glass p-5 rounded-[2rem] border border-gray-800 bg-black/20">
             <div className="flex justify-between items-center mb-4">
               <span className="text-[9px] font-black uppercase text-gray-600 italic">Tracer Matrix</span>
               <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-400/5 px-2 py-1 rounded border border-emerald-400/10">
                 {currentLiveValue.toFixed(2)}
               </span>
             </div>
             <div className="grid grid-cols-2 gap-3 text-center">
               <div className="bg-black/30 p-3 rounded-xl border border-gray-900 group">
                 <p className="text-[7px] text-gray-700 font-black mb-1 uppercase tracking-widest">MAP LOAD</p>
                 <p className="text-xs font-mono font-black text-purple-400 transition-transform group-hover:scale-110">{currentLoad.toFixed(1)}%</p>
               </div>
               <div className="bg-black/30 p-3 rounded-xl border border-gray-900 group">
                 <p className="text-[7px] text-gray-700 font-black mb-1 uppercase tracking-widest">ENGINE RPM</p>
                 <p className="text-xs font-mono font-black text-purple-400 transition-transform group-hover:scale-110">{currentRpm.toFixed(0)}</p>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapViewer3D;
