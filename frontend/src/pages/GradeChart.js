import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, Award, Activity, History, Zap, Target, BookOpen, BarChart3, Star, Sparkles
} from 'lucide-react';
import API from '../api/axios';
import GlassCard from '../components/ui/GlassCard';
import PerformanceChart from '../components/student/PerformanceChart';
import { staggerContainer, cardEntrance } from '../utils/motionVariants';
import toast from 'react-hot-toast';

const GRADE_META = {
  'A+': { color: 'bg-emerald-50 text-emerald-600 border-emerald-200', bar: 'bg-emerald-500', pct: 100 },
  'A' : { color: 'bg-emerald-50 text-emerald-600 border-emerald-100', bar: 'bg-emerald-400', pct: 90  },
  'B+': { color: 'bg-indigo-50  text-indigo-600  border-indigo-200',  bar: 'bg-indigo-500',  pct: 82  },
  'B' : { color: 'bg-indigo-50  text-indigo-600  border-indigo-100',  bar: 'bg-indigo-400',  pct: 74  },
  'C' : { color: 'bg-amber-50   text-amber-600   border-amber-200',   bar: 'bg-amber-500',   pct: 62  },
  'D' : { color: 'bg-red-50     text-red-500     border-red-200',     bar: 'bg-red-400',     pct: 50  },
};
const gradeMeta = (g) => GRADE_META[g] || { color: 'bg-gray-100 text-gray-500 border-gray-200', bar: 'bg-gray-300', pct: 0 };

const GradeChart = () => {
  const [performances, setPerformances] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [seeding, setSeeding]           = useState(false);

  const fetchGrades = async () => {
    try {
      const r = await API.get('/performance/me');
      setPerformances(r.data);
    } catch {
      toast.error('Failed to load your service record.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGrades(); }, []);

  const seedDemoData = async () => {
    setSeeding(true);
    try {
      await API.post('/performance/seed');
      toast.success('Demo records loaded! Refreshing...');
      await fetchGrades();
    } catch {
      toast.error('Failed to load demo data.');
    } finally {
      setSeeding(false);
    }
  };

  const chartData = useMemo(() =>
    [...performances].reverse().map(p => ({ semester: p.semester || 'Current', final_score: p.final_score })),
    [performances]
  );

  const latest = performances[0] || null;
  const avg    = performances.length
    ? (performances.reduce((a, p) => a + p.final_score, 0) / performances.length).toFixed(1)
    : '—';
  const best   = performances.reduce((b, p) => p.final_score > (b?.final_score || 0) ? p : b, null);
  const gm     = gradeMeta(latest?.grade);

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-10 pb-20 w-full">

      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6
                      bg-white/60 backdrop-blur-2xl border border-white/40 rounded-3xl px-10 py-7 shadow-sm w-full">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/30">
            <BookOpen size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-gray-800 tracking-tight italic uppercase leading-none">Service Record</h1>
            <p className="text-gray-400 font-bold uppercase text-[11px] tracking-[0.2em] mt-1">Academic Performance • Validated Grade History</p>
          </div>
        </div>

        {/* Stat pills */}
        <div className="flex items-center gap-4">
          {/* GPA */}
          <div className="px-6 py-4 bg-white rounded-2xl border border-gray-100 shadow-sm text-center min-w-[110px]">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Cumulative GPA</p>
            <p className="text-3xl font-black text-emerald-600 italic leading-none">
              {latest ? (latest.final_score / 10).toFixed(2) : '—'}
            </p>
          </div>
          {/* Grade */}
          <div className="px-6 py-4 bg-white rounded-2xl border border-gray-100 shadow-sm text-center min-w-[100px]">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Latest Grade</p>
            <p className={`text-3xl font-black italic leading-none ${latest ? gradeMeta(latest.grade).color.split(' ')[1] : 'text-gray-300'}`}>
              {latest?.grade || '—'}
            </p>
          </div>
          {/* Average */}
          <div className="px-6 py-4 bg-white rounded-2xl border border-gray-100 shadow-sm text-center min-w-[100px]">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Avg Score</p>
            <p className="text-3xl font-black text-indigo-600 italic leading-none">{avg}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="h-96 bg-white/20 rounded-3xl animate-pulse"/>
          <div className="h-48 bg-white/20 rounded-3xl animate-pulse"/>
        </div>
      ) : performances.length === 0 ? (
        <div className="py-40 rounded-3xl bg-white/40 border-2 border-dashed border-gray-200 flex flex-col items-center text-center">
          <BookOpen size={56} className="text-gray-200 mb-6"/>
          <h3 className="text-3xl font-black text-gray-400 uppercase tracking-tighter italic">No Records Found</h3>
          <p className="text-base font-bold text-gray-300 uppercase tracking-widest mt-2 mb-8">Awaiting faculty grade submission</p>
          <button onClick={seedDemoData} disabled={seeding}
            className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-black uppercase tracking-widest shadow-lg shadow-emerald-500/25 hover:opacity-90 disabled:opacity-60 transition-all">
            <Sparkles size={16} className={seeding ? 'animate-spin' : 'animate-pulse'}/>
            {seeding ? 'Loading Demo Data...' : 'Load Demo Data'}
          </button>
          <p className="text-xs text-gray-300 font-medium mt-3">Populates 3 sample semesters for testing</p>
        </div>
      ) : (
        <div className="space-y-10">

          {/* ── Quick Stats row ── */}
          <div className="grid grid-cols-3 gap-6">
            {/* Total evaluations */}
            <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-sm flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                <BarChart3 size={26} className="text-indigo-500"/>
              </div>
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Evaluations</p>
                <p className="text-4xl font-black text-gray-800 italic leading-none">{performances.length}</p>
              </div>
            </div>
            {/* Best score */}
            <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-sm flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                <Star size={26} className="text-amber-500"/>
              </div>
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Best Score</p>
                <p className="text-4xl font-black text-amber-600 italic leading-none">{best?.final_score?.toFixed(1) || '—'}</p>
              </div>
            </div>
            {/* Progress indicator */}
            <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-sm">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Current Grade Bar</p>
              <div className="flex items-center gap-4">
                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${gm.bar} transition-all duration-1000`} style={{ width: `${gm.pct}%` }}/>
                </div>
                <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase border ${gm.color}`}>{latest?.grade || '—'}</span>
              </div>
            </div>
          </div>

          {/* ── Chart ── */}
          <motion.div variants={cardEntrance} className="relative group">
            <GlassCard className="overflow-hidden h-[420px] border-white/60 p-8 bg-white/50 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-black text-gray-800 uppercase italic tracking-tight flex items-center gap-3">
                    <Activity className="text-emerald-500"/> Success Trajectory
                  </h3>
                  <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">Growth Analytics • Semester Lifecycle</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"/>Live
                </div>
              </div>
              <div className="flex-1 w-full min-h-0">
                <PerformanceChart data={chartData}/>
              </div>
            </GlassCard>
          </motion.div>

          {/* ── History table ── */}
          <motion.div variants={cardEntrance}>
            <div className="flex items-center justify-between px-2 mb-5">
              <h3 className="text-2xl font-black text-gray-800 uppercase italic tracking-tight flex items-center gap-3">
                <History className="text-indigo-500"/> Evaluation History
              </h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{performances.length} records</p>
            </div>

            <GlassCard className="overflow-hidden p-0 border-white/50 bg-white/40 backdrop-blur-2xl w-full">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100">
                      <th className="py-5 px-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                      <th className="py-5 px-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">Semester</th>
                      <th className="py-5 px-8 text-[10px] font-black text-gray-400 uppercase tracking-widest hidden md:table-cell">Scores</th>
                      <th className="py-5 px-8 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Grade</th>
                      <th className="py-5 px-8 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Final Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {performances.map((p) => {
                      const gm2 = gradeMeta(p.grade);
                      return (
                        <tr key={p.id} className="group hover:bg-white/70 transition-all">
                          <td className="py-5 px-8">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-colors">
                                <Zap size={16} className="text-gray-400 group-hover:text-emerald-500 transition-colors"/>
                              </div>
                              <span className="text-sm font-black text-gray-700 italic uppercase">
                                {new Date(p.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'})}
                              </span>
                            </div>
                          </td>
                          <td className="py-5 px-8">
                            <span className="px-3 py-1.5 bg-gray-50 text-gray-500 rounded-xl text-xs font-black uppercase tracking-widest border border-gray-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all">
                              {p.semester || 'Final'}
                            </span>
                          </td>
                          <td className="py-5 px-8 hidden md:table-cell">
                            <div className="flex items-center gap-6">
                              <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Faculty</p>
                                <p className="text-base font-black text-gray-700 italic">{p.score}<span className="text-gray-300 text-xs ml-1">/100</span></p>
                              </div>
                              <div className="w-px h-6 bg-gray-100"/>
                              <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">System</p>
                                <p className="text-base font-black text-gray-700 italic">{p.system_score}<span className="text-gray-300 text-xs ml-1">/100</span></p>
                              </div>
                            </div>
                          </td>
                          <td className="py-5 px-8 text-center">
                            <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border inline-block min-w-[3.5rem] ${gm2.color}`}>
                              {p.grade || '—'}
                            </span>
                          </td>
                          <td className="py-5 px-8 text-right">
                            <div className="flex items-end justify-end flex-col">
                              <span className="text-2xl font-black text-gray-800 italic group-hover:text-emerald-600 transition-colors">
                                {p.final_score?.toFixed(1) || '0.0'}
                              </span>
                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">XP Points</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default GradeChart;
