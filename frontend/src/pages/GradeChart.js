import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, Award, TrendingUp, AlertCircle, 
  FileText, Activity, Zap, History, Target
} from 'lucide-react';
import API from '../api/axios';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import PerformanceChart from '../components/student/PerformanceChart';
import { staggerContainer, cardEntrance } from '../utils/motionVariants';
import toast from 'react-hot-toast';

const GradeChart = () => {
  const [performances, setPerformances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGrades = async () => {
    try {
      const response = await API.get('/performance/me');
      setPerformances(response.data);
    } catch (err) {
      toast.error("Failed to recover academic intel files.");
      setError("Failed to load your performance history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrades();
  }, []);

  const chartData = useMemo(() => {
    // Sort oldest to newest for the chart timeline
    return [...performances].reverse().map(p => ({
      semester: p.semester || 'Current',
      final_score: p.final_score
    }));
  }, [performances]);

  const latest = performances.length > 0 ? performances[0] : null;

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-10 pb-20">
      
      {/* High-Impact Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-white/40 p-1 rounded-[3.5rem] border border-white/50 backdrop-blur-xl">
        <div className="px-10 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/20">
              <TrendingUp size={20} className="text-white" />
            </div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tight italic uppercase">Academic Performance</h1>
          </div>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em]">Validated Grades • Mission History</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 px-10 pb-8 lg:pb-0">
          <div className="group relative">
              <GlassCard className="px-8 py-4 border-emerald-100/50 bg-white/60 hover:bg-white hover:-translate-y-1 transition-all duration-300">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Cumulative Index</p>
                  <div className="flex items-center gap-2">
                     <span className="text-3xl font-black text-emerald-600 italic">{(latest?.final_score / 10).toFixed(2) || '0.00'}</span>
                     <span className="text-sm font-black text-emerald-400 uppercase">GPA</span>
                  </div>
              </GlassCard>
          </div>
          <div className="group relative">
              <GlassCard className="px-8 py-4 border-teal-100/50 bg-white/60 hover:bg-white hover:-translate-y-1 transition-all duration-300">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Standing Rank</p>
                  <div className="flex items-center gap-2">
                     <span className="text-3xl font-black text-teal-600 italic">{latest?.grade || 'N/A'}</span>
                     <span className="text-sm font-black text-teal-400 uppercase">GRADE</span>
                  </div>
              </GlassCard>
          </div>
          <div className="pl-4">
             <Button 
                onClick={async () => {
                   const loadToast = toast.loading("Synthesizing mock data...");
                   try {
                     await API.post('/performance/seed');
                     toast.success("Intelligence Injected.", { id: loadToast });
                     fetchGrades();
                   } catch {
                     toast.error("Synthesis Failed.", { id: loadToast });
                   }
                }} 
                className="bg-gray-800 hover:bg-black text-[10px] font-black uppercase tracking-widest py-3 px-6 rounded-2xl shadow-xl active:scale-95"
             >
                 Inject Intel Mock
             </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-96 bg-white/20 rounded-[4rem] animate-pulse border border-white" />
      ) : performances.length === 0 ? (
        <div className="py-40 rounded-[4rem] bg-white/40 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center backdrop-blur-sm grayscale opacity-60">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <FileText size={48} className="text-gray-300" />
            </div>
            <h3 className="text-2xl font-black text-gray-400 uppercase tracking-tighter italic">Zero Records Detected</h3>
            <p className="text-sm font-bold text-gray-300 uppercase tracking-widest mt-2">Awaiting official faculty validation</p>
        </div>
      ) : (
        <div className="space-y-12">
          
          {/* Performance Flow Visualization */}
          <motion.div variants={cardEntrance} className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-[4rem] blur-2xl opacity-0 group-hover:opacity-100 transition-duration-1000" />
              <GlassCard className="relative overflow-hidden h-[450px] border-white/60 p-10 bg-white/40 flex flex-col">
                  <div className="flex justify-between items-center mb-8">
                     <div>
                        <h3 className="text-2xl font-black text-gray-800 uppercase italic tracking-tight flex items-center gap-3">
                           <Activity className="text-emerald-500" /> Success Trajectory
                        </h3>
                        <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">Growth Analytics • Semester Lifecycle</p>
                     </div>
                     <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                         Live Stream Active
                     </div>
                  </div>
                  <div className="flex-1 w-full min-h-0">
                      <PerformanceChart data={chartData} />
                  </div>
              </GlassCard>
          </motion.div>

          {/* Operational Logs History */}
          <motion.div variants={cardEntrance} className="space-y-6">
            <div className="flex items-center justify-between px-4">
               <div>
                  <h3 className="text-2xl font-black text-gray-800 uppercase italic tracking-tight flex items-center gap-3">
                     <History className="text-indigo-500" /> Audit History
                  </h3>
                  <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">Detailed breakdown of all published evaluations</p>
               </div>
               <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100">
                   <Target size={20} className="text-indigo-600" />
               </div>
            </div>

            <GlassCard className="overflow-hidden p-0 border-white/50 bg-white/30 backdrop-blur-2xl">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100/50 backdrop-blur-md border-b border-gray-100">
                      <th className="py-6 px-10 font-black text-[10px] text-gray-500 uppercase tracking-[0.3em]">Lifecycle Date</th>
                      <th className="py-6 px-10 font-black text-[10px] text-gray-500 uppercase tracking-[0.3em]">Operational Phase</th>
                      <th className="py-6 px-10 font-black text-[10px] text-gray-500 uppercase tracking-[0.3em] hidden md:table-cell">Asset Metrics</th>
                      <th className="py-6 px-10 font-black text-[10px] text-gray-500 uppercase tracking-[0.3em] text-center">Status Grade</th>
                      <th className="py-6 px-10 font-black text-[10px] text-gray-500 uppercase tracking-[0.3em] text-right">Merit Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {performances.map((perf, index) => (
                      <tr key={perf.id} className="group hover:bg-white/60 transition-all duration-300">
                        <td className="py-6 px-10 whitespace-nowrap">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                                <Zap size={16} />
                             </div>
                             <span className="text-sm font-black text-gray-800 italic uppercase">
                                {new Date(perf.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'})}
                             </span>
                          </div>
                        </td>
                        <td className="py-6 px-10 whitespace-nowrap">
                          <span className="px-4 py-1.5 bg-gray-50 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-100 group-hover:border-indigo-100 group-hover:text-indigo-600 transition-all">
                            Phase {perf.semester || 'Final'}
                          </span>
                        </td>
                        <td className="py-6 px-10 hidden md:table-cell">
                          <div className="flex items-center gap-5">
                            <div className="flex flex-col">
                               <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Human Auth</span>
                               <span className="text-sm font-black text-gray-700 italic">{perf.score}<span className="text-gray-300 mr-2">/100</span></span>
                            </div>
                            <div className="w-px h-6 bg-gray-100" />
                            <div className="flex flex-col">
                               <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">System Audit</span>
                               <span className="text-sm font-black text-gray-700 italic">{perf.system_score}<span className="text-gray-300 mr-2">/100</span></span>
                            </div>
                          </div>
                        </td>
                        <td className="py-6 px-10 whitespace-nowrap text-center">
                          <span className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest inline-block min-w-[4rem] border transition-all ${
                            perf.grade === 'A+' || perf.grade === 'A' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm shadow-emerald-500/5' : 
                            perf.grade === 'B+' || perf.grade === 'B' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 
                            perf.grade === 'C' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                            'bg-gray-50 text-gray-500 border-gray-100'}`}
                          >
                            {perf.grade || '—'}
                          </span>
                        </td>
                        <td className="py-6 px-10 whitespace-nowrap text-right">
                          <div className="flex flex-col items-end">
                             <span className="text-2xl font-black text-gray-900 italic tracking-tighter group-hover:text-emerald-600 transition-colors">
                               {perf.final_score ? perf.final_score.toFixed(1) : '0.0'}
                             </span>
                             <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Valid XP</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
            <div className="flex justify-center pt-8">
               <div className="flex items-center gap-4 p-2 bg-white/40 border border-white/60 rounded-full backdrop-blur-xl px-10">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] italic">Encrypted Ledger Verified By Higher Protocol</p>
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-white shadow-lg">
                      <Award size={12} className="text-white" />
                  </div>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default GradeChart;
