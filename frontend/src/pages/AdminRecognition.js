import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  Award, Search, ShieldCheck, TrendingUp, Users, Settings, 
  Crown, RefreshCcw, Star, CheckCircle, XCircle, FileText,
  CheckSquare, Calendar, Download, MousePointer2, Target,
  Clock, History, X
} from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import { staggerContainer, cardEntrance } from '../utils/motionVariants';

const AdminRecognition = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState('');
  const [registrySearch, setRegistrySearch] = useState('');
  const [yearId] = useState('');
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
  const [editingCert, setEditingCert] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const cardEntrance = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const getRankIcon = (index) => {
    if (index === 0) return <Crown className="text-amber-400 fill-amber-200/50" size={18} />;
    if (index === 1) return <Crown className="text-gray-400 fill-gray-200/50" size={16} />;
    if (index === 2) return <Crown className="text-amber-700 fill-amber-600/30" size={14} />;
    return <span className="text-[10px] font-black text-gray-400">#{index + 1}</span>;
  };

  const filteredRecent = useMemo(() => {
    if (!registrySearch.trim()) return recent;
    const q = registrySearch.toLowerCase();
    return recent.filter(r => 
      (r.student_name && r.student_name.toLowerCase().includes(q)) ||
      (r.student_id && r.student_id.toString().includes(q)) ||
      (r.id && r.id.toString().includes(q)) ||
      (r.roll_no && r.roll_no.toLowerCase().includes(q))
    );
  }, [recent, registrySearch]);

  const loadStats = async () => {
    try {
      const res = await API.get('/recognition/stats');
      setStats(res.data);
      // Fallback or fetch from settings
      try {
        const w = await API.get('/admin/settings');
        if (w.data) {
           setWeights({
            weight_task_completion: parseFloat(w.data.weight_task_completion ?? 0.3),
            weight_avg_score: parseFloat(w.data.weight_avg_score ?? 0.5),
            weight_group_contribution: parseFloat(w.data.weight_group_contribution ?? 0.1),
            weight_event_participation: parseFloat(w.data.weight_event_participation ?? 0.1),
          });
        }
      } catch(e) { console.warn("Settings fetch fail", e); }
      
      const r = await API.get('/recognition/recent');
      setRecent(r.data || []);
    } catch {
      toast.error('Failed to load recognition records');
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async () => {
    if (!studentId) return toast.error('Enter student ID');
    setReport(null);
    try {
      const res = await API.get(`/recognition/student-performance/${studentId}`, { 
        params: yearId ? { academic_year_id: yearId } : {} 
      });
      setReport(res.data);
      toast.success(`Dossier found for ID #${studentId}`);
    } catch (err) {
      const errorData = err.response?.data?.detail;
      const errorMessage = typeof errorData === 'string' 
        ? errorData 
        : (Array.isArray(errorData) ? errorData[0]?.msg : 'Failed to fetch performance archive');
      toast.error(errorMessage);
    }
  };

  const issueBadge = async () => {
    if (!report) return;
    setIssuing(true);
    try {
      await API.post('/recognition/issue', { 
        student_id: report.internal_id, 
        badge_type: badgeType,
        performance_score: report.performance_score
      });
      toast.success(`Elite ${badgeType.toUpperCase()} certification issued!`);
      setConfirmOpen(false);
      loadStats();
    } catch (err) {
      const errorData = err.response?.data?.detail;
      const errorMessage = typeof errorData === 'string' 
        ? errorData 
        : (Array.isArray(errorData) ? errorData[0]?.msg : 'Certification issuance failed');
      toast.error(errorMessage);
    } finally {
      setIssuing(false);
    }
  };

  const updateBadge = async (newType) => {
    if (!editingCert) return;
    setIsUpdating(true);
    try {
      await API.patch(`/recognition/${editingCert.id}`, { badge_type: newType });
      toast.success('Certification recalibrated!');
      setEditingCert(null);
      loadStats();
    } catch {
      toast.error('Recalibration failed');
    } finally {
      setIsUpdating(false);
    }
  };



  useEffect(() => { loadStats(); }, []);

  // Autocomplete Logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (studentId.length >= 2) {
        setIsSearchingSuggestions(true);
        try {
          const res = await API.get('/admin/users', { 
            params: { q: studentId, role: 'student', page_size: 5 } 
          });
          const filtered = (res.data.items || []).filter(u => u.role.toLowerCase() === 'student');
          setSuggestions(filtered);
          setShowDropdown(true);
        } catch (e) {
          console.error("Suggestion fetch fail", e);
        } finally {
          setIsSearchingSuggestions(false);
        }
      } else {
        setSuggestions([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [studentId]);

  const handleSelectSuggestion = (student) => {
    setStudentId(student.roll_no || student.id.toString());
    setSuggestions([]);
    setShowDropdown(false);
    // Auto-fetch report for selected student
    setTimeout(() => {
        setReport(null);
        API.get(`/recognition/student-performance/${student.roll_no || student.id}`, { 
            params: yearId ? { academic_year_id: yearId } : {} 
          }).then(res => {
            setReport(res.data);
            toast.success(`Dossier loaded for ${student.name}`);
          }).catch(() => {
            toast.error("Failed to load dossier");
          });
    }, 100);
  };

  return (
    <div className="space-y-10 pb-20 w-full animate-fadeIn relative">
      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8
                      bg-white/40 backdrop-blur-3xl border border-white/40 rounded-3xl px-10 py-8 shadow-sm relative z-20">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/30">
            <Award size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight italic uppercase leading-none">Recognition</h1>
            <p className="text-gray-400 font-bold uppercase text-[11px] tracking-[0.3em] mt-2 flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-500" /> Advanced Certification Panel
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white/60 p-2 rounded-2xl border border-white/40 shadow-inner relative z-50">
          <div className="flex items-center gap-2 px-4 py-2">
            <Search size={18} className={`transition-colors ${isSearchingSuggestions ? 'text-indigo-500 animate-pulse' : 'text-gray-400'}`} />
            <input 
              value={studentId} 
              onChange={e => setStudentId(e.target.value)} 
              onFocus={() => studentId.length >= 2 && setShowDropdown(true)}
              onKeyDown={e => e.key === 'Enter' && fetchReport()}
              placeholder="Name or ID..." 
              className="bg-transparent outline-none text-sm font-bold w-48 placeholder:text-gray-300" 
            />
          </div>
          
          <AnimatePresence>
            {showDropdown && suggestions.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white/90 backdrop-blur-xl border border-white/40 rounded-2xl shadow-2xl z-[100] overflow-hidden"
              >
                {suggestions.map((s) => (
                  <div 
                    key={s.id}
                    onClick={() => handleSelectSuggestion(s)}
                    className="px-5 py-3 hover:bg-indigo-50 cursor-pointer transition-colors border-b border-gray-50 last:border-none group"
                  >
                    <p className="text-sm font-black text-gray-800 italic group-hover:text-indigo-600 transition-colors">{s.name}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">ID: {s.roll_no || s.id}</p>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            onClick={fetchReport}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:scale-105 transition-all active:scale-95"
          >
            Pull details of student
          </button>
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
                    <div className="w-20 h-20 rounded-[32px] bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-3xl font-black shadow-inner">
                      {report?.name?.charAt(0) || 'S'}
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

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white/20 rounded-3xl animate-pulse border border-white/10" />)}
        </div>
      ) : (
        <div className="space-y-10">
          {/* ── Key Metrics ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <GlassCard className="p-8 border-white/60 bg-white/60 group hover:border-emerald-500/50 transition-all">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Total Issued</p>
              <div className="flex items-end justify-between">
                <p className="text-4xl font-black text-gray-900 group-hover:text-emerald-600 transition-colors">{stats?.total_certifications ?? 0}</p>
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-500"><Award size={20}/></div>
              </div>
            </GlassCard>

            <GlassCard className="p-8 border-white/60 bg-white/60 lg:col-span-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Award Distribution</p>
              <div className="flex items-center gap-6">
                {['gold', 'silver', 'bronze', 'participation'].map(type => (
                  <div key={type} className="flex-1 text-center group">
                    <p className={`text-xl font-black italic mb-1 ${
                      type === 'gold' ? 'text-amber-500' : 
                      type === 'silver' ? 'text-gray-400' : 
                      type === 'bronze' ? 'text-amber-700' : 'text-emerald-500'
                    }`}>{stats?.distribution?.[type] ?? 0}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-600 transition-colors">{type}</p>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="p-8 border-white/60 bg-white/60 group hover:border-indigo-500/50 transition-all">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Algorithm Weights</p>
              <div className="flex items-end justify-between">
                <p className="text-4xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors">4</p>
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-500"><Settings size={20}/></div>
              </div>
            </GlassCard>
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
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
                          {getRankIcon(idx)}
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
                <h3 className="text-xl font-black text-gray-900 uppercase italic tracking-tight px-2 mb-5 flex items-center gap-3">
                  <Settings className="text-gray-400"/> System Intelligence Weights
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


      {/* ── Modals ── */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setConfirmOpen(false)} />
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white rounded-[40px] border border-white/40 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] w-full max-w-lg overflow-hidden">
            <div className={`h-4 ${
               badgeType === 'gold' ? 'bg-amber-500' : 
               badgeType === 'silver' ? 'bg-gray-400' : 'bg-amber-700'
            }`} />
            <div className="p-10 text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6 text-emerald-600 shadow-inner">
                <ShieldCheck size={40} />
              </div>
              <h3 className="text-3xl font-black text-gray-900 italic tracking-tighter uppercase mb-4">Confirm Issuance</h3>
              <p className="text-sm font-bold text-gray-400 leading-relaxed mb-10 px-8">
                You are about to officially certify student <span className="text-gray-900">#{report?.student_id}</span> with an elite <span className="text-emerald-600">Level {badgeType.toUpperCase()}</span> badge based on their archived ATM merits.
              </p>
              <div className="flex gap-4">
                <button onClick={() => setConfirmOpen(false)} className="flex-1 py-5 rounded-3xl bg-gray-50 border border-gray-100 text-gray-500 text-sm font-black uppercase tracking-widest hover:bg-gray-100 transition-all">Cancel</button>
                <button 
                  disabled={issuing} 
                  onClick={issueBadge} 
                  className="flex-1 py-5 rounded-3xl bg-emerald-600 text-white text-sm font-black uppercase tracking-widest shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                  {issuing ? <RefreshCcw size={16} className="animate-spin" /> : <Award size={18} />}
                  {issuing ? 'Deploying...' : 'Issue Badge'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      {/* ── Badge Edit Modal ── */}
      {editingCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setEditingCert(null)} />
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white rounded-[40px] border border-white/40 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <RefreshCcw size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 italic tracking-tighter uppercase">Modify Award</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recalibrating for {editingCert.student_name}</p>
                </div>
              </div>
              
              <div className="space-y-4 mb-10">
                {['gold', 'silver', 'bronze'].map(type => (
                  <button 
                    key={type}
                    onClick={() => updateBadge(type)}
                    disabled={isUpdating}
                    className={`w-full py-5 rounded-3xl text-sm font-black uppercase tracking-widest transition-all flex items-center justify-between px-8 border-2 ${
                      editingCert.badge_type === type ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 text-gray-400 border-transparent hover:border-indigo-100'
                    }`}
                  >
                    <span>{type} Badge</span>
                    {editingCert.badge_type === type && <CheckCircle size={18}/>}
                  </button>
                ))}
              </div>
              
              <button 
                onClick={() => setEditingCert(null)}
                className="w-full py-5 rounded-3xl bg-gray-900 text-white text-[10px] font-black uppercase tracking-[0.3em] hover:bg-gray-800 transition-all"
              >
                Close Without Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {/* End Modals */}
    </div>
  );
};

export default AdminRecognition;
