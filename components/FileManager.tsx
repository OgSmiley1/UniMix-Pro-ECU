
import React from 'react';

interface TuneFile {
  name: string;
  date: string;
  size: string;
  ecu: string;
}

const FileManager: React.FC = () => {
  const files: TuneFile[] = [
    { name: 'NSX_STG2_STREET.unx', date: '2023-10-12', size: '245KB', ecu: 'Honda PGM-FI' },
    { name: 'SUPRA_2JZ_DRAG_V4.unx', date: '2023-11-05', size: '512KB', ecu: 'Link G4X' },
    { name: 'DEMON_E85_KILL_MODE.unx', date: '2023-12-01', size: '128KB', ecu: 'FCA GPEC4LM' },
    { name: 'R34_APEXI_POWFC.unx', date: '2023-09-20', size: '64KB', ecu: 'Apexi PFC' },
  ];

  return (
    <div className="p-8 h-full flex flex-col gap-8 max-w-5xl mx-auto overflow-y-auto pb-24 font-sans no-scrollbar">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter text-white italic">Binary Manager</h2>
          <p className="text-gray-500 font-mono text-[10px] uppercase tracking-widest mt-2">
            UniMix Local Flash Storage // Virtual Drive /dev/sda1
          </p>
        </div>
        <button className="px-6 py-4 bg-purple-600 rounded-2xl font-black uppercase tracking-widest text-[9px] text-white shadow-xl shadow-purple-600/20 active:scale-95">
          <i className="fas fa-file-import mr-2"></i> Import External .UNX
        </button>
      </div>

      <div className="glass rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-white/5 text-[9px] font-black uppercase text-gray-500 tracking-widest">
            <tr>
              <th className="px-8 py-5">Filename</th>
              <th className="px-8 py-5">Target Architecture</th>
              <th className="px-8 py-5">Date</th>
              <th className="px-8 py-5">Size</th>
              <th className="px-8 py-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm">
            {files.map((file, i) => (
              <tr key={i} className="hover:bg-white/5 transition-colors group">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-3">
                    <i className="fas fa-file-code text-purple-500"></i>
                    <span className="font-mono font-bold text-gray-300">{file.name}</span>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <span className="text-[10px] font-black uppercase text-gray-600 italic bg-gray-900 px-3 py-1 rounded-full border border-gray-800">
                    {file.ecu}
                  </span>
                </td>
                <td className="px-8 py-5 text-gray-500 font-mono text-xs">{file.date}</td>
                <td className="px-8 py-5 text-gray-500 font-mono text-xs">{file.size}</td>
                <td className="px-8 py-5 text-right">
                  <button className="px-4 py-2 bg-gray-900 hover:bg-emerald-600 text-gray-400 hover:text-white rounded-xl font-black text-[8px] uppercase tracking-widest transition-all">
                    Load To RAM
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 glass p-6 rounded-[2rem] border border-gray-800 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center border border-blue-500/20">
                <i className="fas fa-hdd text-blue-500"></i>
              </div>
              <div>
                 <p className="text-[8px] font-black uppercase text-gray-700">Storage Capacity</p>
                 <p className="text-sm font-black text-gray-400">82% Free (1.2 GB / 2.0 GB)</p>
              </div>
           </div>
           <div className="w-32 h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
              <div className="h-full bg-blue-600 w-[18%]"></div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default FileManager;
