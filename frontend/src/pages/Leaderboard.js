import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Award, Star, Search, Filter, ShieldCheck, Sparkles, TrendingUp, Users } from 'lucide-react';
import API from '../api/axios';
import GlassCard from '../components/ui/GlassCard';
import { staggerContainer, cardEntrance } from '../utils/motionVariants';

const Leaderboard = () => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await API.get('/performance/leaderboard?limit=20');
        setLeaders(response.data);
      } catch (err) {
        console.error("Leaderboard Error:", err);
        setError("Failed to load leaderboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const getRankIcon = (index) => {
    switch(index) {
      case 0: return (
        <div className="relative">
           <Trophy className="text-yellow-500 drop-shadow-lg" size={32} />
           <Sparkles className="absolute -top-2 -right-2 text-yellow-400 animate-pulse" size={14} />
        </div>
      );
      case 1: return <Medal className="text-gray-400 drop-shadow-md" size={30} />;
      case 2: return <Medal className="text-amber-600 drop-shadow-sm" size={28} />;
      default: return <span className="text-gray-400 font-black text-xs uppercase tracking-tighter">#{index + 1}</span>;
    }
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-10 pb-20">
      
      {/* Hall of Fame Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-white/40 p-1 rounded-[3.5rem] border border-white/50 backdrop-blur-xl">
        <div className="px-10 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/20">
              <Trophy size={20} className="text-white" />
            </div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tight italic uppercase">Elite Tier Rankings</h1>
          </div>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em]">Validated Academic Intel • Global Hall of Fame</p>
        </div>

        <div className="flex flex-wrap items-center gap-6 px-10 pb-8 lg:pb-0">
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Live Feed Active</span>
           </div>
           <div className="h-10 w-px bg-gray-200" />
           <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">Global Participants</p>
                  <p className="text-lg font-black text-gray-800 italic">{leaders.length || '0'}<span className="text-xs text-gray-300 ml-1">Operatives</span></p>
              </div>
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <Users size={18} className="text-gray-400" />
              </div>
           </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6">
            {[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-white/20 rounded-3xl animate-pulse" />)}
        </div>
      ) : error ? (
        <GlassCard className="text-center py-24 text-rose-500 font-black uppercase tracking-widest">
           <ShieldCheck className="mx-auto mb-4 opacity-20" size={60} />
           {error}
        </GlassCard>
      ) : leaders.length === 0 ? (
        <div className="py-40 rounded-[4rem] bg-white/40 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center backdrop-blur-sm grayscale opacity-60">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <Award size={48} className="text-gray-300" />
            </div>
            <h3 className="text-2xl font-black text-gray-400 uppercase tracking-tighter italic">No Operational Rankings</h3>
            <p className="text-sm font-bold text-gray-300 uppercase tracking-widest mt-2">Stand by for evaluation cycle completion</p>
        </div>
      ) : (
        <motion.div variants={cardEntrance} className="space-y-6">
          <GlassCard className="overflow-hidden p-0 border-white/50 bg-white/30 backdrop-blur-2xl">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100/50 backdrop-blur-md border-b border-gray-100">
                    <th className="py-6 px-10 font-black text-[10px] text-gray-500 uppercase tracking-[0.3em]">Tier</th>
                    <th className="py-6 px-10 font-black text-[10px] text-gray-500 uppercase tracking-[0.3em]">Operative Identity</th>
                    <th className="py-6 px-10 font-black text-[10px] text-gray-500 uppercase tracking-[0.3em] hidden md:table-cell">Operational Phase</th>
                    <th className="py-6 px-10 font-black text-[10px] text-gray-500 uppercase tracking-[0.3em] text-center">Status Index</th>
                    <th className="py-6 px-10 font-black text-[10px] text-gray-500 uppercase tracking-[0.3em] text-right">Validated XP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {leaders.map((student, index) => (
                    <tr 
                      key={student.student_id} 
                      className={`group hover:bg-white/60 transition-all duration-300 ${index < 3 ? 'bg-emerald-50/10' : ''}`}
                    >
                      <td className="py-6 px-10 whitespace-nowrap">
                        <div className="flex items-center justify-center w-12 h-12 bg-gray-50 rounded-2xl border border-gray-100 group-hover:bg-white group-hover:border-emerald-200 group-hover:shadow-lg group-hover:shadow-emerald-500/5 transition-all">
                          {getRankIcon(index)}
                        </div>
                      </td>
                      <td className="py-6 px-10">
                        <div className="flex items-center gap-5">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl italic shadow-2xl relative overflow-hidden
                            ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-yellow-500/20' : 
                              index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 shadow-gray-500/20' : 
                              index === 2 ? 'bg-gradient-to-br from-amber-500 to-orange-700 shadow-orange-500/20' : 
                              'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20'}`}
                          >
                            {student.student_name.charAt(0).toUpperCase()}
                            {index < 3 && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
                          </div>
                          <div>
                            <p className="font-black text-gray-800 uppercase italic tracking-tight group-hover:text-emerald-600 transition-colors">{student.student_name}</p>
                            <div className="flex items-center gap-2 mt-1">
                                {index === 0 && <span className="text-[8px] font-black bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full uppercase tracking-widest">Grand Scholar</span>}
                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">ID: STU-{student.student_id}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-6 px-10 whitespace-nowrap hidden md:table-cell">
                        <span className="px-4 py-1.5 bg-gray-50 text-gray-500 border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all">
                          Phase {student.semester || 'N/A'}
                        </span>
                      </td>
                      <td className="py-6 px-10 whitespace-nowrap text-center">
                        <div className="inline-flex flex-col items-center">
                            <span className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest inline-block min-w-[4rem] border transition-all
                            ${student.grade === 'A+' || student.grade === 'A' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm shadow-emerald-500/5' : 
                              student.grade === 'B+' || student.grade === 'B' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 
                              student.grade === 'C' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                              'bg-gray-50 text-gray-500 border-gray-100'}`}
                            >
                            {student.grade || '—'}
                            </span>
                        </div>
                      </td>
                      <td className="py-6 px-10 whitespace-nowrap text-right">
                        <div className="flex flex-col items-end">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-black text-gray-900 italic tracking-tighter group-hover:text-emerald-600 transition-colors">{student.final_score.toFixed(1)}</span>
                                <Star className={`mb-1 ${index < 3 ? 'text-yellow-400 fill-yellow-400 animate-pulse' : 'text-gray-200'}`} size={16} />
                            </div>
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Validated Points</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>

          <div className="flex justify-center pt-8">
               <div className="flex items-center gap-4 p-2 bg-white/40 border border-white/60 rounded-full backdrop-blur-xl px-10 group cursor-help hover:bg-white/60 transition-all">
                  <TrendingUp size={16} className="text-emerald-500" />
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] italic">Rankings Updated In Real-Time Based On Peer Performance</p>
                  <Sparkles size={16} className="text-emerald-500 animate-pulse" />
               </div>
            </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Leaderboard;
