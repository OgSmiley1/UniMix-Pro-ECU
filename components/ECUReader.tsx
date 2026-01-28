
import React, { useState } from 'react';
import { hardware } from '../services/hardwareService';

const ECUReader: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<{code: string, desc: string, status: string}[]>([]);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => setLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 20)]);

  const runScan = async () => {
    setIsScanning(true);
    setResults([]);
    addLog("Initiating Full System Interrogation...");
    
    // Simulate multi-module scan
    const modules = ['ECM', 'TCM', 'BCM', 'SRS'];
    for (const mod of modules) {
      addLog(`Querying ${mod} via CAN-Gateway...`);
      await new Promise(r => setTimeout(r, 600));
    }

    const dtcs = await hardware.readDTCs();
    if (dtcs.length > 0) {
      setResults(dtcs.map(d => ({
        code: d.split(' - ')[0],
        desc: d.split(' - ')[1],
        status: 'Confirmed'
      })));
      addLog(`${dtcs.length} Faults Found in ECM.`);
    } else {
      addLog("No active DTCs found. System Healthy.");
    }
    
    setIsScanning(false);
  };

  const handleClearCodes = async () => {
    if (confirm("Executing MODE 04 will clear all fault history and reset readiness monitors. Proceed?")) {
      setIsScanning(true);
      addLog("Sending Mode 04 Global Clear command...");
      const success = await hardware.clearCodes();
      if (success) {
        setResults([]);
        addLog("ECU memory wiped. Readiness reset.");
      } else {
        addLog("Clear failed: ECU Rejected Request (Security Access Denied)");
      }
      setIsScanning(false);
    }
  };

  return (
    <div className="p-4 md:p-8 h-full max-w-5xl mx-auto flex flex-col gap-6 pb-24 md:pb-8 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-white italic">Diagnostics <span className="text-purple-600 text-sm">v4.0</span></h2>
          <p className="text-gray-500 text-xs font-mono tracking-widest uppercase">CAN-BUS Interrogation & DTC Clearing</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={runScan}
            disabled={isScanning}
            className="flex-1 md:flex-none px-8 py-4 bg-purple-600 hover:bg-purple-500 rounded-2xl font-black uppercase text-[10px] tracking-widest text-white shadow-xl transition-all active:scale-95"
          >
            {isScanning ? <i className="fas fa-sync fa-spin"></i> : <i className="fas fa-search"></i>}
            <span className="ml-2">Deep Scan</span>
          </button>
          <button 
            onClick={handleClearCodes}
            disabled={isScanning}
            className="flex-1 md:flex-none px-8 py-4 bg-red-600/20 text-red-500 border border-red-500/30 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all hover:bg-red-600/30"
          >
            Clear ECU
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
        {/* DTC List */}
        <div className="lg:col-span-2 glass rounded-[2.5rem] p-6 border border-gray-800 overflow-y-auto">
          <h3 className="text-[10px] font-black uppercase text-gray-500 mb-6 tracking-widest flex items-center gap-2">
            <i className="fas fa-bug text-red-500"></i> Active Fault Codes
          </h3>
          
          {results.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-gray-800">
              <i className="fas fa-check-circle text-4xl mb-4 opacity-10"></i>
              <p className="uppercase text-[10px] font-black tracking-widest opacity-30">All Modules Nominal</p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((res, i) => (
                <div key={i} className="p-5 bg-black/40 border border-red-500/20 rounded-2xl flex justify-between items-center group hover:border-red-500/50 transition-all">
                  <div>
                    <span className="text-red-500 font-black font-mono text-xl mr-4">{res.code}</span>
                    <span className="text-sm font-bold text-gray-300">{res.desc}</span>
                  </div>
                  <span className="text-[9px] bg-red-600/20 text-red-500 px-3 py-1 rounded-full font-black uppercase">{res.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Console Log */}
        <div className="glass rounded-[2.5rem] p-6 border border-gray-800 flex flex-col">
          <h3 className="text-[10px] font-black uppercase text-gray-500 mb-6 tracking-widest flex items-center gap-2">
            <i className="fas fa-terminal text-purple-500"></i> Protocol Log
          </h3>
          <div className="flex-1 font-mono text-[9px] text-emerald-500/70 overflow-y-auto space-y-2 scrollbar-hide">
            {log.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ECUReader;
