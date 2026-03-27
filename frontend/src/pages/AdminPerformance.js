import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Download, Users, Star, TrendingUp, Search, Plus, X, BookOpen, CheckCircle, Sparkles, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GradeChart from '../components/dashboard/GradeChart';
import Leaderboard from '../components/dashboard/Leaderboard';
import SemesterChart from '../components/dashboard/SemesterChart';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import API from '../api/axios';
import { staggerContainer, cardEntrance } from '../utils/motionVariants';
import toast from 'react-hot-toast';

// Grade colour helper
const gColor = (g) => {
  if (!g) return 'bg-gray-100 text-gray-500 border-gray-200';
  if (g === 'A+')  return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (g === 'A')   return 'bg-emerald-50  text-emerald-600 border-emerald-100';
  if (g === 'B+')  return 'bg-indigo-50   text-indigo-700  border-indigo-200';
  if (g === 'B')   return 'bg-indigo-50   text-indigo-600  border-indigo-100';
  if (g === 'C')   return 'bg-amber-50    text-amber-600   border-amber-200';
  return                  'bg-red-50      text-red-500     border-red-200';
};

// Live score → grade preview
const scoreToGrade = (s) => {
  const v = parseFloat(s);
  if (isNaN(v)) return null;
  if (v >= 90) return 'A+';
  if (v >= 80) return 'A';
  if (v >= 70) return 'B';
  if (v >= 60) return 'C';
  return 'D';
};

const FORM_DEFAULT = { student_id: '', project_id: '', score: '', semester: '', remarks: '' };

const AdminPerformance = () => {
  const role = localStorage.getItem('userRole');

  // Lists for dropdowns
  const [students, setStudents] = useState([]);
  const [projects, setProjects] = useState([]);

  // Grade entry form
  const [showGradeForm, setShowGradeForm]   = useState(false);
  const [form, setForm]                     = useState(FORM_DEFAULT);
  const [submitting, setSubmitting]         = useState(false);

  // Registry table
  const [minScore, setMinScore] = useState('');
  const [maxScore, setMaxScore] = useState('');
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [stats, setStats]       = useState({ avg: 0, total: 0, passRate: 0 });

  const [submittedReports, setSubmittedReports] = useState([]);

  // Computed grade preview while admin types
  const previewGrade = scoreToGrade(form.score);

  // Pagination & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ── fetch helpers ──────────────────────────────────────────────────────────
  const fetchDropdowns = useCallback(async () => {
    try {
      const [usersRes, projRes] = await Promise.all([
        API.get('/admin/users'),
        API.get('/projects/'),
      ]);
      setStudents((usersRes.data || []).filter(u => u.role === 'student'));
      setProjects(projRes.data || []);
    } catch {
      /* dropdowns are optional — fail silently */
    }
  }, []);

  const fetchRange = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get('/analytics/performance/students');
      let data = res.data || [];
      if (minScore !== '') data = data.filter(d => d.atm_score >= parseFloat(minScore));
      if (maxScore !== '') data = data.filter(d => d.atm_score <= parseFloat(maxScore));
      setFiltered(data);
    } catch {
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  }, [minScore, maxScore]);

  const fetchStats = useCallback(async () => {
    try {
      const statsRes = await API.get('/analytics/performance/stats');
      const data = statsRes.data || {};
      
      setStats({
        avg:      `${data.average_score || 0}%`,
        total:    data.total_records || 0,
        passRate: `${data.pass_rate || 0}%`,
      });
    } catch { /* ignore */ }
  }, []);

  const handleRankStudent = async (performanceId) => {
    const tid = toast.loading('Officially Ranking Student...');
    try {
      await API.post(`/performance/${performanceId}/rank`);
      toast.success('Student Ranked on Leaderboard!', { id: tid });
      fetchStats();
      fetchRange();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Ranking failed', { id: tid });
    }
  };

  const handleExport = async () => {
    try {
      const response = await API.get('/performance/export', { responseType: 'blob' });
      const url  = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'academic_report.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      toast.error('Export failed');
    }
  };

  useEffect(() => {
    fetchRange();
    fetchStats();
    fetchDropdowns();
  }, [fetchRange, fetchStats, fetchDropdowns]);

  // Handle derived state for filtering locally
  const processedStudents = useMemo(() => {
    let result = [...filtered];
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => 
        (s.name && s.name.toLowerCase().includes(q)) || 
        (s.student_id && s.student_id.toString().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q))
      );
    }
    
    if (selectedDept) {
      result = result.filter(s => s.department_name === selectedDept);
    }
    
    return result;
  }, [filtered, searchQuery, selectedDept]);

  const totalPages = Math.ceil(processedStudents.length / itemsPerPage);
  const currentStudents = processedStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const uniqueDepartments = useMemo(() => {
    const depts = new Set(filtered.map(s => s.department_name).filter(d => Boolean(d) && d !== 'N/A'));
    return Array.from(depts);
  }, [filtered]);

  // ── Submit grade ───────────────────────────────────────────────────────────
  const handleSubmitGrade = async (e) => {
    e.preventDefault();
    if (!form.student_id || !form.project_id || !form.score || !form.semester) {
      toast.error('Please fill all required fields');
      return;
    }
    setSubmitting(true);
    const tid = toast.loading('Submitting grade...');
    try {
      await API.post('/performance/', {
        student_id: parseInt(form.student_id),
        project_id: parseInt(form.project_id),
        score:      parseFloat(form.score),
        semester:   form.semester,
        remarks:    form.remarks || '',
      });
      toast.success('Grade submitted successfully!', { id: tid });
      setShowGradeForm(false);
      setForm(FORM_DEFAULT);
      fetchRange();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit grade', { id: tid });
    } finally {
      setSubmitting(false);
    }
  };

  if (role !== 'admin') {
    return (
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-center p-8 bg-white/50 backdrop-blur-md rounded-3xl border border-red-100 shadow-xl">
            <p className="text-red-600 font-bold text-xl mb-2">Access Denied</p>
            <p className="text-gray-500">Only authorized administrators can view this module.</p>
          </div>
        </div>
    );
  }

  return (
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-8">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4
                        bg-white border border-gray-100 rounded-3xl px-8 py-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/20">
              <TrendingUp size={24} className="text-white"/>
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-800 tracking-tight">Performance Management</h1>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">Grade Entry • Rankings • Analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleExport}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-600 text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-colors">
              <Download size={15}/> Export CSV
            </button>
          </div>
        </div>

        {/* ── Stat Pills ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Average Score', value: `${stats.avg}`, icon: Star,       color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Total Records', value: stats.total,     icon: Users,      color: 'text-teal-600',    bg: 'bg-teal-50'    },
            { label: 'Pass Rate',     value: stats.passRate,  icon: TrendingUp, color: 'text-cyan-600',    bg: 'bg-cyan-50'    },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <motion.div key={label} variants={cardEntrance}>
              <GlassCard className={`flex items-center gap-5`}>
                <div className={`p-3 ${bg} ${color} rounded-2xl`}><Icon size={24}/></div>
                <div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">{label}</p>
                  <p className="text-2xl font-black text-gray-800">{value}</p>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* ── Charts Row ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <motion.div variants={cardEntrance} className="h-full"><GradeChart/></motion.div>
          <motion.div variants={cardEntrance} className="h-full"><Leaderboard/></motion.div>
        </div>
        <motion.div variants={cardEntrance}><SemesterChart/></motion.div>

        {/* ── Registry Table ── */}
        <motion.div variants={cardEntrance}>
          <GlassCard className="space-y-6">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                 <div className="p-3 bg-primary/10 mb-2 rounded-2xl">
                    <Search size={24} className="text-primary" />
                 </div>
                 <div>
                    <h3 className="text-lg font-bold text-secondary">Performance Registry</h3>
                    <p className="text-xs text-secondary-muted font-medium">Detailed audit of student evaluations across all projects</p>
                 </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 bg-gray-50/50 p-2 rounded-2xl border border-gray-100">
                <input
                  type="text"
                  placeholder="Search student..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 w-full sm:w-48 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
                
                <select
                  value={selectedDept}
                  onChange={(e) => { setSelectedDept(e.target.value); setCurrentPage(1); }}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 w-full sm:w-40 focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer transition-all"
                >
                  <option value="">All Departments</option>
                  {uniqueDepartments.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <div className="hidden sm:block w-px h-8 bg-gray-200 mx-1"></div>

                {/* Score constraints */}
                <input type="number" placeholder="Min" value={minScore} onChange={e => setMinScore(e.target.value)}
                  className="w-full sm:w-16 px-3 py-2 text-center text-sm font-bold bg-white border border-gray-200 rounded-xl outline-none focus:border-primary transition-colors"/>
                <input type="number" placeholder="Max" value={maxScore} onChange={e => setMaxScore(e.target.value)}
                  className="w-full sm:w-16 px-3 py-2 text-center text-sm font-bold bg-white border border-gray-200 rounded-xl outline-none focus:border-primary transition-colors"/>
                <Button onClick={fetchRange} className="w-full sm:w-auto px-5 py-2 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all">
                  Filter
                </Button>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-card/30">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"/>
                  <p className="mt-4 text-secondary-muted font-medium">Loading records...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-12 text-center bg-surface/50">
                  <Users size={48} className="mx-auto text-secondary-muted/50 mb-4"/>
                  <p className="text-secondary-muted font-bold mb-1">No Records Found</p>
                  <p className="text-xs text-secondary-muted/80">There are currently no performance records to display.</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-border">
                  <thead>
                    <tr className="bg-surface/80">
                      {['Student', 'Dept/Sem', 'Score', 'Class', 'Tasks'].map(h => (
                        <th key={h} className="px-6 py-4 text-left text-xs font-bold text-secondary-muted uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card/50">
                    {currentStudents.map((r, idx) => (
                      <motion.tr key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                        className="hover:bg-surface/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs overflow-hidden">
                              {r.avatar ? <img src={r.avatar} alt="Avatar" className="w-full h-full object-cover" /> : '?'}
                            </div>
                            <div className="flex flex-col">
                               <span className="font-bold text-sm text-secondary group-hover:text-primary transition-colors flex items-center gap-1.5">
                                 {r.name || `Student #${r.student_id}`}
                                 {r.official_badge && (
                                    <Crown size={14} className={
                                        r.official_badge === 'gold' ? 'text-amber-500 fill-amber-300' :
                                        r.official_badge === 'silver' ? 'text-gray-400 fill-gray-200' :
                                        r.official_badge === 'bronze' ? 'text-amber-700 fill-amber-600' : 'text-emerald-500'
                                    } />
                                 )}
                               </span>
                               <span className="text-[10px] font-bold text-secondary-muted uppercase tracking-widest leading-none mt-0.5">
                                 ID: {r.student_id}
                               </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex flex-col">
                              <span className="text-sm font-bold text-secondary">{r.department_name || 'N/A'}</span>
                              <span className="text-[10px] font-bold text-secondary-muted uppercase tracking-widest mt-0.5">{r.semester}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4 flex flex-col gap-1">
                          <span className="text-[10px] text-emerald-600 font-bold">ATM: <span className="text-emerald-500 font-black text-sm">{r.atm_score}</span></span>
                          <span className="text-[9px] text-gray-400 font-medium">Quality: {r.quality_score}</span>
                          <span className="text-[9px] text-gray-400 font-medium">Timeliness: {r.timeliness_score}</span>
                          <span className="text-[9px] text-gray-400 font-medium">Completion: {r.completion_score}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest border ${
                                        r.atm_score >= 90 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                        r.atm_score >= 70 ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 
                                        'bg-gray-50 text-gray-700 border border-gray-200'
                          }`}>
                            {r.atm_score >= 90 ? 'A+' : r.atm_score >= 80 ? 'A' : r.atm_score >= 70 ? 'B' : r.atm_score >= 60 ? 'C' : 'D'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-secondary-muted/60">{r.total_graded} Graded Tasks</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between p-6 border-t border-gray-50 bg-gray-50/30 gap-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-secondary-muted">
                   Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, processedStudents.length)} of {processedStudents.length} entries
                </p>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-secondary-muted hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm"
                  >
                    Previous
                  </button>
                  <span className="px-4 text-[10px] font-black uppercase tracking-widest text-secondary rounded-xl bg-gray-100 py-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-secondary-muted hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* ══ GRADE ENTRY MODAL ══ */}
        <AnimatePresence>
          {showGradeForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowGradeForm(false)}/>

              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">

                {/* Modal header */}
                <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                      <BookOpen size={20} className="text-white"/>
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-gray-800">Enter Grade</h2>
                      <p className="text-xs text-gray-400 font-medium">Create a performance record for a student</p>
                    </div>
                  </div>
                  <button onClick={() => setShowGradeForm(false)} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
                    <X size={18} className="text-gray-500"/>
                  </button>
                </div>

                <form onSubmit={handleSubmitGrade} className="px-8 py-6 space-y-5">

                  {/* Student */}
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Student *</label>
                    {students.length > 0 ? (
                      <select value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })} required
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-400 focus:bg-white outline-none transition-all">
                        <option value="">-- Select Student --</option>
                        {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.email})</option>)}
                      </select>
                    ) : (
                      <input type="number" placeholder="Student ID (e.g. 3)" value={form.student_id}
                        onChange={e => setForm({ ...form, student_id: e.target.value })} required
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-400 focus:bg-white outline-none transition-all"/>
                    )}
                  </div>

                  {/* Project */}
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Project *</label>
                    {projects.length > 0 ? (
                      <select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })} required
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-400 focus:bg-white outline-none transition-all">
                        <option value="">-- Select Project --</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                      </select>
                    ) : (
                      <input type="number" placeholder="Project ID (e.g. 1)" value={form.project_id}
                        onChange={e => setForm({ ...form, project_id: e.target.value })} required
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-400 focus:bg-white outline-none transition-all"/>
                    )}
                  </div>

                  {/* Score + Live Grade Preview */}
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Faculty Score (0–100) *</label>
                    <div className="flex items-center gap-3">
                      <input type="number" min="0" max="100" step="0.1" placeholder="e.g. 85"
                        value={form.score} onChange={e => setForm({ ...form, score: e.target.value })} required
                        className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-400 focus:bg-white outline-none transition-all"/>
                      <AnimatePresence>
                        {previewGrade && (
                          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                            className={`px-4 py-2.5 rounded-2xl text-sm font-black border uppercase tracking-widest min-w-[56px] text-center ${gColor(previewGrade)}`}>
                            {previewGrade}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium mt-1.5 ml-1">
                      Final score = 70% system + 30% faculty. Grade shown is a preview.
                    </p>
                  </div>

                  {/* Semester */}
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Semester *</label>
                    <div className="flex flex-wrap gap-2">
                      {['SEM S1','SEM S2','SEM S3','SEM S4','SEM S5','SEM S6','SEM S7','SEM S8'].map(sem => (
                        <button key={sem} type="button" onClick={() => setForm({ ...form, semester: sem })}
                          className={`px-4 py-2 rounded-xl text-xs font-black uppercase border transition-all ${form.semester === sem ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-emerald-300'}`}>
                          {sem}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Remarks */}
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Remarks (optional)</label>
                    <textarea placeholder="Any comments about this student's performance..."
                      value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-400 focus:bg-white outline-none transition-all resize-none" rows={3}/>
                  </div>

                  {/* Submit */}
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowGradeForm(false)}
                      className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-500 text-sm font-black uppercase tracking-widest hover:bg-gray-50 transition-colors">
                      Cancel
                    </button>
                    <button type="submit" disabled={submitting}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:opacity-90 disabled:opacity-60 transition-all">
                      {submitting ? <Sparkles size={16} className="animate-spin"/> : <CheckCircle size={16}/>}
                      {submitting ? 'Submitting...' : 'Submit Grade'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </motion.div>
  );
};

export default AdminPerformance;
