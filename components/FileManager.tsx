
import React, { useEffect, useState } from 'react';
import { TuneSettings } from '../types';

interface SavedProfile {
  name: string;
  date: string;
  ecu: string;
  data: TuneSettings;
}

interface FileManagerProps {
  tune: TuneSettings;
  ecuType: string;
  onLoadTune: (settings: TuneSettings) => void;
}

const STORAGE_KEY = 'unimix_tune_profiles';

const loadProfiles = (): SavedProfile[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const persistProfiles = (profiles: SavedProfile[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
};

const FileManager: React.FC<FileManagerProps> = ({ tune, ecuType, onLoadTune }) => {
  const [profiles, setProfiles] = useState<SavedProfile[]>([]);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    setProfiles(loadProfiles());
  }, []);

  const bytesUsed = new Blob([JSON.stringify(profiles)]).size;

  const handleSave = () => {
    const name = newName.trim();
    if (!name) return;
    const next = [
      ...profiles.filter(p => p.name !== name),
      { name, date: new Date().toISOString().slice(0, 10), ecu: ecuType, data: tune },
    ];
    setProfiles(next);
    persistProfiles(next);
    setNewName('');
  };

  const handleDelete = (name: string) => {
    const next = profiles.filter(p => p.name !== name);
    setProfiles(next);
    persistProfiles(next);
  };

  return (
    <div className="p-8 h-full flex flex-col gap-8 max-w-5xl mx-auto overflow-y-auto pb-24 font-sans no-scrollbar">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter text-white italic">Tune Profiles</h2>
          <p className="text-gray-500 font-mono text-[10px] uppercase tracking-widest mt-2">
            Saved locally in this browser (localStorage) — not on the vehicle's ECU.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Profile name"
            className="bg-black border border-gray-800 px-4 py-3 rounded-xl text-white font-mono text-sm outline-none focus:border-purple-600"
          />
          <button
            onClick={handleSave}
            disabled={!newName.trim()}
            className="px-6 py-3 bg-purple-600 rounded-2xl font-black uppercase tracking-widest text-[9px] text-white shadow-xl shadow-purple-600/20 active:scale-95 disabled:opacity-30"
          >
            <i className="fas fa-save mr-2"></i> Save Current Tune
          </button>
        </div>
      </div>

      <div className="glass rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-white/5 text-[9px] font-black uppercase text-gray-500 tracking-widest">
            <tr>
              <th className="px-8 py-5">Profile Name</th>
              <th className="px-8 py-5">Target Architecture</th>
              <th className="px-8 py-5">Saved</th>
              <th className="px-8 py-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm">
            {profiles.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-8 py-10 text-center text-gray-700 text-xs uppercase tracking-widest">
                  No saved profiles yet
                </td>
              </tr>
            ) : profiles.map((p, i) => (
              <tr key={i} className="hover:bg-white/5 transition-colors group">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-3">
                    <i className="fas fa-file-code text-purple-500"></i>
                    <span className="font-mono font-bold text-gray-300">{p.name}</span>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <span className="text-[10px] font-black uppercase text-gray-600 italic bg-gray-900 px-3 py-1 rounded-full border border-gray-800">
                    {p.ecu}
                  </span>
                </td>
                <td className="px-8 py-5 text-gray-500 font-mono text-xs">{p.date}</td>
                <td className="px-8 py-5 text-right space-x-2">
                  <button
                    onClick={() => onLoadTune(p.data)}
                    className="px-4 py-2 bg-gray-900 hover:bg-emerald-600 text-gray-400 hover:text-white rounded-xl font-black text-[8px] uppercase tracking-widest transition-all"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => handleDelete(p.name)}
                    className="px-4 py-2 bg-gray-900 hover:bg-red-600 text-gray-400 hover:text-white rounded-xl font-black text-[8px] uppercase tracking-widest transition-all"
                  >
                    Delete
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
                 <p className="text-[8px] font-black uppercase text-gray-700">Local Storage Used</p>
                 <p className="text-sm font-black text-gray-400">{(bytesUsed / 1024).toFixed(2)} KB · {profiles.length} profile(s)</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default FileManager;
