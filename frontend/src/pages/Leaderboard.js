import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, Star, Shield, Sparkles, TrendingUp, Users, Crown, Zap } from 'lucide-react';
import API from '../api/axios';
import GlassCard from '../components/ui/GlassCard';
import { staggerContainer, cardEntrance } from '../utils/motionVariants';
import toast from 'react-hot-toast';

const GRADE_META = {
  'A+': { color: 'text-emerald-600 bg-emerald-50 border-emerald-200', glow: 'shadow-emerald-500/20' },
  'A' : { color: 'text-emerald-600 bg-emerald-50 border-emerald-100', glow: 'shadow-emerald-500/10' },
  'B+': { color: 'text-indigo-600  bg-indigo-50  border-indigo-200',  glow: 'shadow-indigo-500/20'  },
  'B' : { color: 'text-indigo-600  bg-indigo-50  border-indigo-100',  glow: 'shadow-indigo-500/10'  },
  'C' : { color: 'text-amber-600   bg-amber-50   border-amber-200',   glow: 'shadow-amber-500/20'   },
  'D' : { color: 'text-red-500     bg-red-50     border-red-200',     glow: ''                       },
};
const gradeMeta = (g) => GRADE_META[g] || { color: 'text-gray-500 bg-gray-100 border-gray-200', glow: '' };

const Leaderboard = () => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [seeding, setSeeding] = useState(false);

  const fetchLeaders = () => {
    setLoading(true);
    API.get('/performance/leaderboard?limit=20')
      .then(r => setLeaders(r.data))
      .catch(() => setError('Failed to load leaderboard'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLeaders(); }, []);

  const seedDemoData = async () => {
    setSeeding(true);
    try {
      await API.post('/performance/seed');
      toast.success('Demo data loaded! Rankings updated.');
      fetchLeaders();
    } catch {
      toast.error('Failed to load demo data.');
    } finally {
      setSeeding(false);
    }
  };

  const top3    = leaders.slice(0, 3);
  const rest    = leaders.slice(3);
  const myName  = localStorage.getItem('userName') || '';

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-10 pb-20 w-full">

      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6
                      bg-white/60 backdrop-blur-2xl border border-white/40 rounded-3xl px-10 py-7 shadow-sm w-full">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-xl shadow-amber-500/30">
            <Trophy size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-gray-800 tracking-tight italic uppercase leading-none">Hall of Fame</h1>
            <p className="text-gray-400 font-bold uppercase text-[11px] tracking-[0.2em] mt-1">Elite Tier Rankings • Validated Academic Intel</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ranked Scholars</p>
            <p className="text-4xl font-black text-gray-800 italic leading-none">{leaders.length}</p>
          </div>
          <div className="w-px h-14 bg-gray-200" />
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-2xl border border-emerald-100">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Live Rankings</span>
          </div>
          <button onClick={seedDemoData} disabled={seeding}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:opacity-90 disabled:opacity-60 transition-all">
            <Sparkles size={14} className={seeding ? 'animate-spin' : 'animate-pulse'}/>
            {seeding ? 'Loading...' : 'Demo Data'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_,i)=><div key={i} className="h-20 bg-white/30 rounded-3xl animate-pulse"/>)}
        </div>
      ) : error ? (
        <div className="py-32 flex flex-col items-center gap-4 opacity-60">
          <Shield size={48} className="text-rose-300"/>
          <p className="font-black text-rose-500 uppercase tracking-widest">{error}</p>
        </div>
      ) : leaders.length === 0 ? (
        <div className="py-48 rounded-3xl bg-white/40 border-2 border-dashed border-gray-200 flex flex-col items-center text-center">
          <Award size={56} className="text-gray-200 mb-6"/>
          <h3 className="text-3xl font-black text-gray-400 uppercase tracking-tighter italic">No Rankings Yet</h3>
          <p className="text-base font-bold text-gray-300 uppercase tracking-widest mt-2 mb-8">Awaiting evaluation cycle completion</p>
          <button onClick={seedDemoData} disabled={seeding}
            className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-black uppercase tracking-widest shadow-lg shadow-emerald-500/25 hover:opacity-90 disabled:opacity-60 transition-all">
            <Sparkles size={16} className={seeding ? 'animate-spin' : 'animate-pulse'}/>
            {seeding ? 'Loading Demo Data...' : 'Load Demo Data'}
          </button>
          <p className="text-xs text-gray-300 font-medium mt-3">Populates sample performance records for this account</p>
        </div>
      ) : (
        <div className="space-y-10">

          {/* ── Podium (Top 3) ── */}
          {top3.length > 0 && (
            <div className="grid grid-cols-3 gap-6">
              {/* 2nd */}
              {top3[1] && (
                <motion.div variants={cardEntrance} className="flex flex-col items-center gap-4 pt-10">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center text-white text-3xl font-black italic shadow-xl shadow-gray-500/20">
                      {top3[1].student_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center shadow">
                      <Medal size={16} className="text-gray-500"/>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="font-black text-gray-800 uppercase italic">{top3[1].student_name}</p>
                    <p className="text-xs text-gray-400 font-bold mt-0.5">Phase {top3[1].semester || 'N/A'}</p>
                    <p className="text-2xl font-black text-gray-700 italic mt-1">{top3[1].final_score.toFixed(1)}<span className="text-xs text-gray-300 ml-1">XP</span></p>
                  </div>
                  <div className="w-full h-24 bg-gradient-to-t from-gray-100 to-gray-50 rounded-t-2xl border-t border-x border-gray-200 flex items-center justify-center">
                    <span className="text-4xl font-black text-gray-300">2</span>
                  </div>
                </motion.div>
              )}

              {/* 1st */}
              {top3[0] && (
                <motion.div variants={cardEntrance} className="flex flex-col items-center gap-4">
                  <Crown size={28} className="text-yellow-400 animate-pulse"/>
                  <div className="relative">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-white text-4xl font-black italic shadow-2xl shadow-yellow-500/30">
                      {top3[0].student_name.charAt(0).toUpperCase()}
                      <div className="absolute inset-0 bg-white/20 animate-pulse rounded-2xl"/>
                    </div>
                    <div className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-yellow-400 border-2 border-white flex items-center justify-center shadow-lg shadow-yellow-500/30">
                      <Trophy size={16} className="text-white"/>
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-[8px] font-black bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full uppercase tracking-widest border border-yellow-200">Grand Scholar</span>
                    <p className="font-black text-gray-800 uppercase italic text-lg mt-1">{top3[0].student_name}</p>
                    <p className="text-xs text-gray-400 font-bold mt-0.5">Phase {top3[0].semester || 'N/A'}</p>
                    <p className="text-3xl font-black text-amber-600 italic mt-1">{top3[0].final_score.toFixed(1)}<span className="text-sm text-gray-300 ml-1">XP</span></p>
                  </div>
                  <div className="w-full h-36 bg-gradient-to-t from-yellow-100 to-yellow-50 rounded-t-2xl border-t border-x border-yellow-200 flex items-center justify-center">
                    <span className="text-5xl font-black text-yellow-200 flex items-center gap-2"><Sparkles size={28} className="text-yellow-300 animate-pulse"/>1<Sparkles size={28} className="text-yellow-300 animate-pulse"/></span>
                  </div>
                </motion.div>
              )}

              {/* 3rd */}
              {top3[2] && (
                <motion.div variants={cardEntrance} className="flex flex-col items-center gap-4 pt-16">
                  <div className="relative">
                    <div className="w-18 h-18 w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-700 flex items-center justify-center text-white text-2xl font-black italic shadow-xl shadow-orange-500/20">
                      {top3[2].student_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-amber-100 border-2 border-white flex items-center justify-center shadow">
                      <Medal size={14} className="text-amber-600"/>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="font-black text-gray-800 uppercase italic">{top3[2].student_name}</p>
                    <p className="text-xs text-gray-400 font-bold mt-0.5">Phase {top3[2].semester || 'N/A'}</p>
                    <p className="text-2xl font-black text-amber-700 italic mt-1">{top3[2].final_score.toFixed(1)}<span className="text-xs text-gray-300 ml-1">XP</span></p>
                  </div>
                  <div className="w-full h-16 bg-gradient-to-t from-amber-50 to-orange-50 rounded-t-2xl border-t border-x border-amber-100 flex items-center justify-center">
                    <span className="text-3xl font-black text-amber-200">3</span>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* ── Rest of rankings table ── */}
          {rest.length > 0 && (
            <GlassCard className="overflow-hidden p-0 border-white/50 bg-white/40 backdrop-blur-2xl w-full">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100">
                      <th className="py-5 px-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">Rank</th>
                      <th className="py-5 px-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">Scholar</th>
                      <th className="py-5 px-8 text-[10px] font-black text-gray-400 uppercase tracking-widest hidden md:table-cell">Phase</th>
                      <th className="py-5 px-8 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Grade</th>
                      <th className="py-5 px-8 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {rest.map((s, i) => {
                      const gm  = gradeMeta(s.grade);
                      const isMe = s.student_name === myName;
                      return (
                        <tr key={s.student_id} className={`group hover:bg-white/70 transition-all ${isMe ? 'bg-indigo-50/40' : ''}`}>
                          <td className="py-5 px-8">
                            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center group-hover:bg-white group-hover:border-emerald-200 group-hover:shadow transition-all">
                              <span className="text-xs font-black text-gray-400">#{i + 4}</span>
                            </div>
                          </td>
                          <td className="py-5 px-8">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-lg italic shadow-md shadow-emerald-500/15">
                                {s.student_name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-black text-gray-800 uppercase italic group-hover:text-emerald-600 transition-colors">{s.student_name}</p>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">STU-{s.student_id}</p>
                              </div>
                              {isMe && <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-indigo-200">You</span>}
                            </div>
                          </td>
                          <td className="py-5 px-8 hidden md:table-cell">
                            <span className="px-3 py-1.5 bg-gray-50 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all">
                              {s.semester || 'N/A'}
                            </span>
                          </td>
                          <td className="py-5 px-8 text-center">
                            <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border inline-block min-w-[3.5rem] ${gm.color}`}>
                              {s.grade || '—'}
                            </span>
                          </td>
                          <td className="py-5 px-8 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-2xl font-black text-gray-800 italic group-hover:text-emerald-600 transition-colors">{s.final_score.toFixed(1)}</span>
                              <Star size={14} className="text-gray-200"/>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          )}

          {/* footer */}
          <div className="flex justify-center pt-2">
            <div className="flex items-center gap-4 px-10 py-3 bg-white/40 border border-white/60 rounded-full backdrop-blur-xl">
              <TrendingUp size={16} className="text-emerald-500"/>
              <p className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] italic">Rankings Updated In Real-Time Based On Peer Performance</p>
              <Sparkles size={16} className="text-emerald-500 animate-pulse"/>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Leaderboard;
