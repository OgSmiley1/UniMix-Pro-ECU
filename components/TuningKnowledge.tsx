
import React, { useState } from 'react';
import { VehicleProfile } from '../types';
import { TUNING_TECHNIQUES, COMMON_MISTAKES } from '../services/tuningKnowledge';

interface TuningKnowledgeProps {
  profile: VehicleProfile;
}

const TuningKnowledge: React.FC<TuningKnowledgeProps> = ({ profile }) => {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="glass p-6 rounded-[2rem] border border-gray-800/50 space-y-6">
      <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
        <i className="fas fa-book text-purple-500"></i> Tuning Reference
      </h3>

      {profile.notes && (
        <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
          <p className="text-[8px] font-black uppercase tracking-widest text-purple-400 mb-1">{profile.name}{profile.region ? ` — ${profile.region}` : ''}</p>
          <p className="text-xs text-gray-400 leading-relaxed">{profile.notes}</p>
        </div>
      )}

      <div className="space-y-2">
        {TUNING_TECHNIQUES.map(t => (
          <div key={t.id} className="border border-gray-800 rounded-xl overflow-hidden">
            <button
              onClick={() => setOpenId(openId === t.id ? null : t.id)}
              className="w-full flex justify-between items-center px-4 py-3 bg-black/30 hover:bg-black/50 transition-colors text-left"
            >
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">{t.title}</span>
              <i className={`fas fa-chevron-down text-gray-600 text-[10px] transition-transform ${openId === t.id ? 'rotate-180' : ''}`}></i>
            </button>
            {openId === t.id && (
              <div className="px-4 py-4 space-y-3 bg-black/10">
                <p className="text-xs text-gray-400 leading-relaxed">{t.howItWorks}</p>
                <div>
                  <p className="text-[8px] font-black uppercase text-red-500 tracking-widest mb-1">Risks</p>
                  <ul className="space-y-1">
                    {t.risks.map((r, i) => (
                      <li key={i} className="text-[10px] text-gray-500 leading-relaxed flex gap-2">
                        <span className="text-red-500">•</span>{r}
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="text-[10px] text-emerald-400 font-mono uppercase tracking-widest">{t.verdict}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div>
        <p className="text-[8px] font-black uppercase text-amber-500 tracking-widest mb-2">Common Mistakes to Avoid</p>
        <ul className="space-y-1.5">
          {COMMON_MISTAKES.map((m, i) => (
            <li key={i} className="text-[10px] text-gray-500 leading-relaxed flex gap-2">
              <i className="fas fa-exclamation-triangle text-amber-500/60 mt-0.5 text-[8px]"></i>{m}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TuningKnowledge;
