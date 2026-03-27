import React, { useEffect, useState, useMemo } from 'react';
import API from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  Award, CheckCircle, XCircle, Search, ShieldCheck, 
  TrendingUp, RefreshCcw, Star, Users, CheckSquare, 
  Clock, Target, X, Settings, MousePointer2, 
  History, Download, Crown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/ui/GlassCard';

const AdminRecognition = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState('');
  const [yearId, setYearId] = useState('');
  const [report, setReport] = useState(null);
  const [issuing, setIssuing] = useState(false);
  const [badgeType, setBadgeType] = useState('gold');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [weights, setWeights] = useState({
    weight_task_completion: 0.3,
    weight_avg_score: 0.5,
    weight_group_contribution: 0.1,
    weight_event_participation: 0.1,
  });
  const [savingWeights, setSavingWeights] = useState(false);
  const [recent, setRecent] = useState([]);
  const [registrySearch, setRegistrySearch] = useState('');
  const [editingCert, setEditingCert] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const navigate = useNavigate();

  const cardEntrance = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const getRankIcon = (idx) => {
    if (idx === 0) return <Crown className="text-amber-500" size={18} />;
    if (idx === 1) return <Star className="text-gray-400 fill-gray-100" size={16} />;
    if (idx === 2) return <Star className="text-amber-600 fill-amber-100" size={14} />;
    return <span className="text-[10px] font-black text-gray-300">#{idx + 1}</span>;
  };

  const filteredRecent = useMemo(() => {
    if (!recent) return [];
    return recent.filter(r => 
      r.student_name?.toLowerCase().includes(registrySearch.toLowerCase()) ||
      r.student_id?.toString().includes(registrySearch) ||
      r.badge_type?.toLowerCase().includes(registrySearch.toLowerCase())
    );
  }, [recent, registrySearch]);

  const loadStats = async () => {
    try {
      const res = await API.get('/recognition/stats');
      setStats(res.data);
      const w = await API.get('/admin/settings');
      setWeights(prev => ({
        weight_task_completion: parseFloat(w.data.weight_task_completion ?? prev.weight_task_completion),
        weight_avg_score: parseFloat(w.data.weight_avg_score ?? prev.weight_avg_score),
        weight_group_contribution: parseFloat(w.data.weight_group_contribution ?? prev.weight_group_contribution),
        weight_event_participation: parseFloat(w.data.weight_event_participation ?? prev.weight_event_participation),
      }));
      const r = await API.get('/recognition/recent');
      setRecent(r.data || []);
    } catch {
      toast.error('Failed to load recognition stats');
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async () => {
    if (!studentId) return toast.error('Enter student ID');
    setReport(null);
    try {
      const res = await API.get(`/recognition/student-performance/${studentId}`, { params: yearId ? { academic_year_id: yearId } : {} });
      setReport(res.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to fetch performance');
    }
  };

  const issueBadge = async () => {
    if (!report) return;
    setIssuing(true);
    try {
      await API.post('/recognition/issue', { student_id: report.student_id, academic_year_id: yearId || null, badge_type: badgeType });
      toast.success('Badge issued');
      setConfirmOpen(false);
      loadStats();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Issue failed');
    } finally {
      setIssuing(false);
    }
  };

  useEffect(() => { loadStats(); }, []);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <Award size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 leading-tight">Achievement & Recognition</h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Certification Review Panel</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-3 py-2">
            <Search size={16} className="text-gray-400" />
            <input value={studentId} onChange={e => setStudentId(e.target.value)} placeholder="Student ID" className="outline-none text-sm w-28" />
            <input value={yearId} onChange={e => setYearId(e.target.value)} placeholder="Year ID" className="outline-none text-sm w-20 border-l border-gray-100 pl-2" />
            <button onClick={fetchReport} className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-black">Fetch</button>
          </div>
        </div>
      </div>
            {/* ── Individual Student Report OVERLAY (Now Inline at Top) ── */}
      <AnimatePresence>
        {report && (
          <div className="mb-12">
            <GlassCard className="overflow-hidden border-none shadow-2xl relative group">
              {/* Premium Header Decoration */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-indigo-600" />
              
              <div className="bg-gradient-to-br from-emerald-600 to-teal-800 p-10 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                   <Target size={240} className="rotate-12"/>
                </div>
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-[32px] bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-3xl font-black shadow-inner overflow-hidden">
                      {report?.avatar ? (
                         <img src={`http://localhost:8000${report.avatar}`} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                         report?.name?.charAt(0) || 'S'
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.4em] text-emerald-100/60 mb-2">Student Dossier</p>
                      <h2 className="text-4xl font-black italic leading-none tracking-tighter">{report?.name || 'Unknown Student'}</h2>
                      <p className="text-[10px] font-bold text-emerald-100/40 uppercase tracking-widest mt-1">Ref ID #{report?.student_id || report?.roll_no || 'Unknown'} Enterprise Archive</p>
                      <div className="flex items-center gap-3 mt-4">
                         <span className="px-3 py-1 rounded-full bg-white/20 border border-white/20 text-[10px] font-black uppercase tracking-widest">
                           {report?.eligibility_status || 'analyzing'}
                         </span>
                         <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest opacity-70">
                           <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Verified for Evaluation
                         </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-[32px] text-center min-w-[200px] hover:bg-white/20 transition-all">
                    <p className="text-[9px] font-black uppercase tracking-widest mb-3 opacity-60">Recommended Badge</p>
                    <div className="flex items-center justify-center gap-3 bg-white text-emerald-800 px-6 py-3 rounded-2xl shadow-xl">
                       <Star size={18} className="text-amber-500 fill-amber-500"/>
                       <span className="text-base font-black uppercase italic tracking-tighter">{report?.recommended_badge || 'pending'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/90 p-10">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
                  {[
                    { label: 'Completion', val: `${report?.completion_rate || 0}%`, icon: <CheckSquare size={14}/> },
                    { label: 'Quality', val: report?.avg_score || 0, icon: <Star size={14}/> },
                    { label: 'Weights', val: report?.group_contribution || 10, icon: <Users size={14}/> },
                    { label: 'Events', val: report?.event_participation || 5, icon: <Clock size={14}/> },
                    { label: 'ATM Rating', val: report?.performance_score || 0, icon: <TrendingUp size={14}/>, highlight: true },
                  ].map(stat => (
                    <div key={stat.label}>
                       <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                         {stat.icon} {stat.label}
                       </p>
                       <p className={`text-4xl font-black italic ${stat.highlight ? 'text-emerald-600' : 'text-gray-900'}`}>{stat.val}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-12 pt-10 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex gap-3">
                    {['gold', 'silver', 'bronze'].map(type => (
                      <button 
                        key={type}
                        onClick={() => setBadgeType(type)}
                        className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          badgeType === type ? 'bg-amber-100 text-amber-600 border border-amber-200' : 'bg-gray-50 text-gray-400 border border-transparent hover:bg-gray-100'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <button 
                       onClick={() => setConfirmOpen(true)}
                       className="px-10 py-4 bg-emerald-600 text-white rounded-[24px] text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-600/30 hover:shadow-emerald-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-3"
                    >
                      <Award size={16}/> Approve Certification
                    </button>
                    <button onClick={() => setReport(null)} className="p-4 bg-gray-50 text-gray-300 rounded-2xl hover:text-gray-500 transition-colors">
                      <X size={20}/>
                    </button>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-white border border-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white rounded-3xl border border-gray-100 p-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Certifications</p>
            <p className="text-3xl font-black text-gray-800">{stats.total_certifications}</p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
            {/* ── Top Candidates ── */}
            <motion.div variants={cardEntrance} className="xl:col-span-1">
              <div className="flex items-center justify-between px-2 mb-5">
                <h3 className="text-xl font-black text-gray-900 uppercase italic tracking-tight flex items-center gap-3">
                  <TrendingUp className="text-emerald-500"/> Ranked Candidates
                </h3>
                <RefreshCcw size={16} className="text-gray-300 hover:text-emerald-500 cursor-pointer transition-colors" onClick={loadStats}/>
              </div>
              <GlassCard className="p-6 border-white/50 bg-white/40 space-y-4 shadow-xl">
                {!stats?.top_students || stats.top_students.length === 0 ? (
                  <div className="py-10 text-center">
                    <Users size={32} className="text-gray-200 mx-auto mb-2"/>
                    <p className="text-xs font-bold text-gray-300 uppercase italic tracking-widest">Awaiting ATM Sync</p>
                  </div>
                ) : (
                  stats.top_students.map((student, idx) => (
                    <motion.div 
                      key={idx} 
                      whileHover={{ x: 5 }} 
                      className="p-4 bg-white/80 rounded-2xl border border-white/60 shadow-sm flex items-center justify-between group transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 overflow-hidden relative">
                          {student.avatar ? (
                             <img src={`http://localhost:8000${student.avatar}`} alt="User" className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-multiply" />
                          ) : null}
                          <span className="relative z-10">{getRankIcon(idx)}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                             <p className="text-sm font-black text-gray-800 uppercase italic leading-none">{student?.name}</p>
                             {student.official_badge && (
                                <Crown size={12} className={
                                  student.official_badge === 'gold' ? 'text-amber-500 fill-amber-300' :
                                  student.official_badge === 'silver' ? 'text-gray-400 fill-gray-200' :
                                  'text-amber-700 fill-amber-600'
                                } />
                             )}
                          </div>
                          <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-widest">ID: {student?.roll_no || student?.student_id || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-black text-emerald-600 leading-none">{student?.performance_score}</p>
                        <p className="text-[8px] font-black text-gray-300 uppercase tracking-tighter">ATM Score</p>
                      </div>
                    </motion.div>
                  ))
                )}
                <button 
                  onClick={() => navigate('/dashboard/performance')} 
                  className="w-full py-3 rounded-xl border border-dashed border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-white/60 hover:text-indigo-600 hover:border-indigo-200 transition-all"
                >
                  View Global Analytics
                </button>
              </GlassCard>
            </motion.div>

            {/* ── Scoring config ── */}
            <motion.div variants={cardEntrance} className="xl:col-span-2 space-y-8">
              <div>
          <h3 className="text-xl font-black text-gray-900 uppercase italic tracking-tight px-2 mb-5 flex items-center justify-between gap-3">
            <span className="flex items-center gap-3"><Settings className="text-gray-400"/> System Intelligence Weights</span>
            <button onClick={() => setSettingsOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Settings size={16} className="text-indigo-600"/>
            </button>
          </h3>
                <GlassCard className="p-8 border-white/50 bg-white/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[
                      { label: 'Task Quality', key: 'weight_avg_score', icon: <Star size={14}/> },
                      { label: 'Completion Drive', key: 'weight_task_completion', icon: <CheckCircle size={14}/> },
                      { label: 'Team Efficiency', key: 'weight_group_contribution', icon: <Users size={14}/> },
                      { label: 'Participation', key: 'weight_event_participation', icon: <MousePointer2 size={14}/> },
                    ].map(item => (
                      <div key={item.key} className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                            {item.icon} {item.label}
                          </label>
                          <span className="text-xs font-black text-indigo-600 italic bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                             {weights[item.key]}
                          </span>
                        </div>
                        <input 
                          type="range" step="0.05" min="0" max="1" 
                          value={weights[item.key]} 
                          onChange={e=>setWeights(w=>({...w, [item.key]: parseFloat(e.target.value||0)}))} 
                          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" 
                        />
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-10 flex items-center justify-between p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 border-dashed">
                    <div>
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">Cumulative Vector Sum</p>
                      <p className={`text-2xl font-black italic ${(weights.weight_task_completion + weights.weight_avg_score + weights.weight_group_contribution + weights.weight_event_participation).toFixed(2) === '1.00' ? 'text-emerald-600' : 'text-amber-600 animate-pulse'}`}>
                        {(weights.weight_task_completion + weights.weight_avg_score + weights.weight_group_contribution + weights.weight_event_participation).toFixed(2)}
                      </p>
                    </div>
                    <button 
                      onClick={async ()=>{
                        setSavingWeights(true);
                        try {
                          await API.post('/admin/settings', weights);
                          toast.success('Cognitive weights synchronized!');
                        } catch {
                          toast.error('Sync failed');
                        } finally { setSavingWeights(false); }
                      }}
                      disabled={savingWeights}
                      className="px-8 py-3.5 rounded-2xl bg-indigo-600 text-white text-[11px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/25 hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-3"
                    >
                      {savingWeights ? <RefreshCcw size={14} className="animate-spin"/> : <RefreshCcw size={14}/>}
                      {savingWeights ? 'Updating Sync...' : 'Sync Global Weights'}
                    </button>
                  </div>
                </GlassCard>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* ── Registry Table ── */}
      <div className="mt-16">
        <div className="flex items-center justify-between px-2 mb-8">
          <h3 className="text-2xl font-black text-gray-900 uppercase italic tracking-tight flex items-center gap-4">
            <History className="text-indigo-500"/> Issuance Registry
          </h3>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-indigo-500 transition-colors" size={16}/>
            <input 
              type="text" placeholder="Filter registry..." 
              value={registrySearch} onChange={e=>setRegistrySearch(e.target.value)} 
              className="pl-12 pr-6 py-3 bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-indigo-500 transition-all w-64"
            />
          </div>
        </div>
        
        <GlassCard className="overflow-hidden border-white/40 bg-white/40">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-900/5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                <th className="py-5 px-10">Candidate</th>
                <th className="py-5 px-10">Badge Rank</th>
                <th className="py-5 px-10">Algorithm Perf.</th>
                <th className="py-5 px-10">Deployment Date</th>
                <th className="py-5 px-10 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecent.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-20 text-center">
                    <p className="text-xs font-black text-gray-300 uppercase tracking-widest italic">Registry Void</p>
                  </td>
                </tr>
              ) : (
                filteredRecent.map((row, idx) => (
                  <tr key={row.id} className="border-t border-gray-900/5 group hover:bg-white/40 transition-colors">
                    <td className="py-6 px-10">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-lg font-black shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform overflow-hidden">
                          {row?.student_avatar ? (
                             <img src={`http://localhost:8000${row.student_avatar}`} alt="User" className="w-full h-full object-cover" />
                          ) : (
                             row?.student_name?.charAt(0) || 'U'
                          )}
                        </div>
                        <div>
                          <p className="text-base font-black text-gray-800 italic">{row.student_name}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                            {row?.roll_no || `Ref ID #${row?.id || '?'}`}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-6 px-10">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                        row.badge_type === 'gold' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        row.badge_type === 'silver' ? 'bg-gray-50 text-gray-500 border-gray-100' :
                        'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {row.badge_type}
                      </span>
                    </td>
                    <td className="py-6 px-10">
                      <p className="text-sm font-black text-gray-700">{row.performance_score}</p>
                    </td>
                    <td className="py-6 px-10">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {row.issue_date?.split(' ')[0] || 'N/A'}
                      </p>
                    </td>
                    <td className="py-6 px-10 text-right">
                       <div className="flex items-center justify-end gap-2">
                         <button 
                           onClick={() => setEditingCert(row)}
                           className="p-3 rounded-2xl bg-indigo-50 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100 transition-all"
                         >
                           <Settings size={18}/>
                         </button>
                         <button className="p-3 rounded-2xl bg-gray-50 text-gray-400 hover:text-indigo-600 transition-all">
                           <Download size={18}/>
                         </button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            </table>
          </GlassCard>
        </div>

      {/* ── Modals ── */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setSettingsOpen(false)} />
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white rounded-[40px] border border-white/40 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] w-full max-w-lg overflow-hidden">
            <div className={`h-4 ${
               badgeType === 'gold' ? 'bg-amber-500' : 
               badgeType === 'silver' ? 'bg-gray-400' : 'bg-amber-700'
            }`} />
            <div className="p-10 text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6 text-emerald-600 shadow-inner">
                <ShieldCheck size={40} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Avg Score</label>
                <input type="number" step="0.01" min="0" max="1" value={weights.weight_avg_score} onChange={e=>setWeights(w=>({...w, weight_avg_score: parseFloat(e.target.value||0)}))} className="w-full px-3 py-2 rounded-xl border border-gray-200 mt-1" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Group Contribution</label>
                <input type="number" step="0.01" min="0" max="1" value={weights.weight_group_contribution} onChange={e=>setWeights(w=>({...w, weight_group_contribution: parseFloat(e.target.value||0)}))} className="w-full px-3 py-2 rounded-xl border border-gray-200 mt-1" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Event Participation</label>
                <input type="number" step="0.01" min="0" max="1" value={weights.weight_event_participation} onChange={e=>setWeights(w=>({...w, weight_event_participation: parseFloat(e.target.value||0)}))} className="w-full px-3 py-2 rounded-xl border border-gray-200 mt-1" />
              </div>
            </div>
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs font-bold text-gray-500">Sum: {(weights.weight_task_completion + weights.weight_avg_score + weights.weight_group_contribution + weights.weight_event_participation).toFixed(2)}</p>
              <button
                disabled={savingWeights}
                onClick={async ()=>{
                  setSavingWeights(true);
                  try {
                    await API.post('/admin/settings', {
                      weight_task_completion: weights.weight_task_completion,
                      weight_avg_score: weights.weight_avg_score,
                      weight_group_contribution: weights.weight_group_contribution,
                      weight_event_participation: weights.weight_event_participation
                    });
                    toast.success('Weights updated');
                  } catch {
                    toast.error('Failed to update weights');
                  } finally {
                    setSavingWeights(false);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-black"
              >
                {savingWeights ? 'Saving...' : 'Save Weights'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {report && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-white rounded-3xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Student</p>
                <p className="text-lg font-black text-gray-900">ID #{report.student_id}</p>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${report.eligibility_status==='eligible'?'bg-emerald-50 text-emerald-600 border border-emerald-100':'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                {report.eligibility_status==='eligible' ? <CheckCircle size={12} /> : <ShieldCheck size={12} />}
                {report.eligibility_status}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-gray-50">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Completion Rate</p>
                <p className="text-xl font-black text-gray-900">{report.completion_rate}%</p>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Average Score</p>
                <p className="text-xl font-black text-gray-900">{report.avg_score}</p>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Group Contribution</p>
                <p className="text-xl font-black text-gray-900">{report.group_contribution}</p>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Events</p>
                <p className="text-xl font-black text-gray-900">{report.event_participation}</p>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Performance Score</p>
                <p className="text-xl font-black text-gray-900">{report.performance_score}</p>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Recommended</p>
                <p className="text-xl font-black text-indigo-600 font-black">{report.recommended_badge || '—'}</p>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button onClick={() => setConfirmOpen(true)} className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-black">Approve Badge</button>
              <button onClick={async () => { await API.post('/recognition/reject', { certification_id: report.certification_id || 0 }); toast.success('Marked as rejected'); }} className="px-6 py-2.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-sm font-black">Reject</button>
              <button onClick={async () => { await API.post('/recognition/request-revaluation', { student_id: report.student_id }); toast.success('Re-evaluation requested'); }} className="px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-white text-sm font-black">Request Re-evaluation</button>
            </div>
          </div>
        </motion.div>
      )}

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setConfirmOpen(false)} />
          <div className="relative bg-white rounded-3xl border border-gray-100 w-full max-w-md p-6">
            <p className="text-lg font-black text-gray-900 mb-2">Confirm Issuance</p>
            <p className="text-sm text-gray-500 mb-4">Issue a {badgeType} badge to student #{report?.student_id}.</p>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setConfirmOpen(false)} className="px-5 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-600">Cancel</button>
              <button disabled={issuing} onClick={issueBadge} className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-black">{issuing ? 'Issuing...' : 'Confirm'}</button>
            </div>
          </div>
        </div>
      )}

      {recent && recent.length > 0 && (
        <div className="bg-white rounded-3xl border border-gray-100 p-6 mt-8">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Recent Issued Badges</p>
            <div className="text-xs text-gray-500 font-bold">Showing {recent.length}</div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-collapse">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Certificate</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Student</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Badge</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Score</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Issued</th>
                  <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {recent.map(row => (
                  <tr key={row.id} className="group hover:bg-emerald-50/30 transition-colors">
                    <td className="px-4 py-3 font-bold text-gray-800">#{row.id}</td>
                    <td className="px-4 py-3">
                      <div className="text-gray-800 font-bold">{row.student_name}</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{row.student_email}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-bold">{row.badge_type}</td>
                    <td className="px-4 py-3 text-gray-700 font-bold">{row.performance_score}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(row.issue_date).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={async () => {
                          try {
                            const res = await API.get(`/recognition/${row.id}/export`, { responseType: 'blob' });
                            const blob = new Blob([res.data], { type: 'application/pdf' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `certificate_${row.id}.pdf`;
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                            URL.revokeObjectURL(url);
                          } catch {
                            toast.error('Export failed');
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-black"
                      >
                        Export PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRecognition;
