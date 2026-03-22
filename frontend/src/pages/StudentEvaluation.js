import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, CheckCircle, AlertTriangle, Star,
  X, Sparkles, ClipboardList, Award, ChevronRight, FileText
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import API from '../api/axios';
import GlassCard from '../components/ui/GlassCard';
import { staggerContainer, cardEntrance } from '../utils/motionVariants';
import toast from 'react-hot-toast';

// ── helpers ──────────────────────────────────────────────────────────────────
const scoreToGrade = (s) => {
  const v = parseFloat(s); if (isNaN(v)) return null;
  if (v >= 90) return 'A+'; if (v >= 80) return 'A';
  if (v >= 70) return 'B';  if (v >= 60) return 'C'; return 'D';
};
const GRADE_COLORS = {
  'A+': 'bg-emerald-100 text-emerald-700 border-emerald-300',
  'A' : 'bg-emerald-50  text-emerald-600 border-emerald-200',
  'B' : 'bg-indigo-50   text-indigo-600  border-indigo-200',
  'C' : 'bg-amber-50    text-amber-600   border-amber-200',
  'D' : 'bg-red-50      text-red-500     border-red-200',
};
const gc = (g) => GRADE_COLORS[g] || 'bg-gray-100 text-gray-500 border-gray-200';

const ProgressBar = ({ value, color = 'bg-emerald-500', label }) => (
  <div>
    {label && <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>}
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${Math.min(value, 100)}%` }}/>
      </div>
      <span className="text-xs font-black text-gray-600 min-w-[36px] text-right">{value.toFixed(0)}%</span>
    </div>
  </div>
);

const FORM_DEFAULT = { score: '', semester: '', remarks: '', project_id: '' };

// ── Evaluation Modal ──────────────────────────────────────────────────────────
const EvalModal = ({ student, projects, onClose, onSuccess }) => {
  const [form, setForm]     = useState(FORM_DEFAULT);
  const [busy, setBusy]     = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [showDossier, setShowDossier] = useState(false);
  const previewGrade        = scoreToGrade(form.score);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!form.project_id) return;
      try {
        const res = await API.get(`/performance/student/${student.id}/analytics?project_id=${form.project_id}`);
        setAnalytics(res.data);
      } catch { /* ignore */ }
    };
    fetchAnalytics();
  }, [form.project_id, student.id]);

  const handleGenerateReport = () => {
    if (!analytics) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFillColor(16, 185, 129); // Emerald 500
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text('ACADEMIC MISSION REPORT', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text('Confidential - Faculty Authorized Only', pageWidth / 2, 30, { align: 'center' });

    // Operative Info
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text('OPERATIVE DOSSIER', 14, 55);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const projName = projects.find(p => p.id === parseInt(form.project_id))?.title || 'N/A';
    doc.text(`Codename: ${student.name}`, 14, 65);
    doc.text(`Email: ${student.email}`, 14, 72);
    doc.text(`Project Assigned: ${projName}`, 14, 79);
    doc.text(`Semester: ${form.semester || 'N/A'}`, 14, 86);

    // Analytics Table
    doc.autoTable({
      startY: 95,
      head: [['Metric', 'Value']],
      body: [
        ['Total Assigned Todos', analytics.total_todos.toString()],
        ['Mission Completion Rate', `${((analytics.completed_todos / analytics.total_todos) * 100 || 0).toFixed(1)}%`],
        ['Average Task Score', `${analytics.avg_task_score}%`],
        ['Leadership (Events Hosted)', analytics.events_hosted.toString()],
        ['Participation Bonus', `+${analytics.participation_bonus} pts`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }, // Indigo 600
      styles: { fontSize: 10, cellPadding: 5 }
    });

    // Final Scores Box
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFillColor(243, 244, 246);
    doc.rect(14, finalY, pageWidth - 28, 30, 'F');
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(16, 185, 129); // Emerald
    doc.text(`CALCULATED SYSTEM SCORE: ${analytics.system_score}%`, 20, finalY + 12);
    
    doc.setTextColor(79, 70, 229); // Indigo
    doc.text(`FACULTY ASSESSMENT SCORE: ${form.score || 'PENDING'}%`, 20, finalY + 22);

    // Remarks
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "bold");
    doc.text('FACULTY REMARKS:', 14, finalY + 45);
    doc.setFont("helvetica", "normal");
    const remarksText = doc.splitTextToSize(form.remarks || 'No specific remarks provided.', pageWidth - 28);
    doc.text(remarksText, 14, finalY + 55);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    const date = new Date().toLocaleDateString();
    doc.text(`Generated by Academic Task Management System on ${date}`, pageWidth / 2, 280, { align: 'center' });

    // Save
    doc.save(`Mission_Report_${student.name.replace(/ /g, '_')}.pdf`);
    toast.success('Evaluation Report Generated as PDF');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.project_id || !form.score || !form.semester) {
      toast.error('Please fill all required fields'); return;
    }
    setBusy(true);
    const tid = toast.loading('Submitting evaluation…');
    try {
      await API.post('/performance/', {
        student_id: student.id,
        project_id: parseInt(form.project_id),
        score:      parseFloat(form.score),
        semester:   form.semester,
        remarks:    form.remarks || '',
      });
      toast.success('Evaluation submitted!', { id: tid });
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit', { id: tid });
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}/>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl z-10">

        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white text-xl font-black overflow-hidden ring-2 ring-white/50">
              {student.avatar ? <img src={student.avatar} alt="User" className="w-full h-full object-cover" /> : student.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-black text-white">{student.name}</h2>
              <p className="text-emerald-100 text-xs font-bold">Evaluate Academic Performance</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors">
            <X size={18} className="text-white"/>
          </button>
        </div>

        {/* Analytics Breakdown */}
        <div className="px-8 py-5 bg-gray-50 border-b border-border grid grid-cols-2 gap-4">
          <div className="p-3 bg-card rounded-2xl border border-border shadow-sm">
            <p className="text-[9px] font-black text-secondary-muted uppercase tracking-widest mb-1">Task Avg Score</p>
            <p className="text-lg font-black text-indigo-600">{student.avg_task_score?.toFixed(1) || '0.0'}%</p>
          </div>
          <div className="p-3 bg-card rounded-2xl border border-border shadow-sm">
            <p className="text-[9px] font-black text-secondary-muted uppercase tracking-widest mb-1">Events Hosted</p>
            <p className="text-lg font-black text-emerald-600">{student.events_hosted || 0}</p>
          </div>
          <div className="p-3 bg-card rounded-2xl border border-border shadow-sm">
            <p className="text-[9px] font-black text-secondary-muted uppercase tracking-widest mb-1">Participation Bonus</p>
            <p className="text-lg font-black text-amber-600">+{student.participation_bonus?.toFixed(1) || '0.0'}</p>
          </div>
          <button 
            type="button"
            onClick={() => setShowDossier(!showDossier)}
            className="p-3 bg-card rounded-2xl border border-emerald-200 bg-emerald-50/10 hover:bg-emerald-50/20 transition-all text-left group">
            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1 flex items-center justify-between">
              Mission Dossier <ChevronRight size={10} className={`transform transition-transform ${showDossier ? 'rotate-90' : ''}`} />
            </p>
            <p className="text-lg font-black text-emerald-700">{student.system_score?.toFixed(1) || '0.0'}%</p>
          </button>
        </div>

        {/* Dossier Breakdown */}
        <AnimatePresence>
          {showDossier && analytics && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-8 py-4 bg-surface border-b border-border overflow-hidden"
            >
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <p className="text-[8px] font-black text-secondary-muted uppercase">Todos</p>
                    <p className="text-xs font-black text-secondary">{analytics.completed_todos}/{analytics.total_todos}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[8px] font-black text-secondary-muted uppercase">Overdue</p>
                    <p className="text-xs font-black text-red-500">{analytics.overdue_todos}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[8px] font-black text-secondary-muted uppercase">Tasks</p>
                    <p className="text-xs font-black text-secondary">{analytics.tasks_analyzed}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between px-4 py-2 bg-card rounded-xl border border-border">
                  <span className="text-[10px] font-bold text-secondary-muted uppercase tracking-widest">Leadership Multiplier</span>
                  <span className="text-xs font-black text-emerald-600">+{analytics.events_hosted * 10}pts</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">

          {/* Project */}
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Project *</label>
            <select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })} required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-400 focus:bg-white outline-none transition-all">
              <option value="">-- Select Project --</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>

          {/* Score */}
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
              Faculty Score (0–100) *
            </label>
            <div className="flex items-center gap-3">
              <input type="number" min="0" max="100" step="0.1" placeholder="e.g. 85"
                value={form.score} onChange={e => setForm({ ...form, score: e.target.value })} required
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-400 focus:bg-white outline-none transition-all"/>
              <AnimatePresence>
                {previewGrade && (
                  <motion.span initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}
                    className={`px-4 py-2.5 rounded-2xl text-sm font-black border uppercase tracking-widest ${gc(previewGrade)}`}>
                    {previewGrade}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5 ml-1">Final = 70% system ({student.system_score?.toFixed(1)}%) + 30% your score</p>
          </div>

          {/* Semester pills */}
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Semester *</label>
            <div className="flex flex-wrap gap-2">
              {['SEM S1','SEM S2','SEM S3','SEM S4','SEM S5','SEM S6','SEM S7','SEM S8'].map(sem => (
                <button key={sem} type="button" onClick={() => setForm({ ...form, semester: sem })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase border transition-all
                    ${form.semester === sem ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-emerald-300'}`}>
                  {sem}
                </button>
              ))}
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Remarks (optional)</label>
            <textarea placeholder="Notes about this student's performance…"
              value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-400 focus:bg-white outline-none transition-all resize-none" rows={3}/>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-500 text-sm font-black uppercase tracking-widest hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={busy}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:opacity-90 disabled:opacity-60 transition-all">
              {busy ? <Sparkles size={16} className="animate-spin"/> : <CheckCircle size={16}/>}
              {busy ? 'Submitting…' : 'Submit Evaluation'}
            </button>
          </div>

          {form.project_id && (
            <button 
              type="button" 
              onClick={handleGenerateReport}
              className="w-full flex items-center justify-center gap-2 py-3 mt-2 rounded-2xl bg-surface border border-border text-secondary-muted text-[10px] font-black uppercase tracking-[0.2em] hover:bg-card hover:text-indigo-600 transition-all">
              <FileText size={14} /> Generate Mission Report
            </button>
          )}
        </form>
      </motion.div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const StudentEvaluation = () => {
  const [students,  setStudents]  = useState([]);
  const [projects,  setProjects]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState('all'); // all | pending | evaluated
  const [selected,  setSelected]  = useState(null); // student being evaluated

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [studRes, projRes] = await Promise.all([
        API.get('/faculty/students/progress'),
        API.get('/projects/'),
      ]);
      setStudents(studRes.data || []);
      setProjects(projRes.data || []);
    } catch {
      toast.error('Failed to load student data');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(() => {
    return students.filter(s => {
      const q = search.toLowerCase();
      const matchSearch = !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
      const matchFilter =
        filter === 'all'       ? true :
        filter === 'pending'   ? !s.has_record :
        filter === 'evaluated' ? s.has_record  : true;
      return matchSearch && matchFilter;
    });
  }, [students, search, filter]);

  const stats = useMemo(() => ({
    total:     students.length,
    evaluated: students.filter(s => s.has_record).length,
    pending:   students.filter(s => !s.has_record).length,
    avgScore:  students.length
      ? (students.reduce((a, s) => a + (s.system_score || 0), 0) / students.length).toFixed(1)
      : '0.0',
  }), [students]);

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-8 pb-20 w-full">

      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6
                      bg-white/60 backdrop-blur-2xl border border-white/40 rounded-3xl px-10 py-7 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/30">
            <ClipboardList size={28} className="text-white"/>
          </div>
          <div>
            <h1 className="text-4xl font-black text-gray-800 tracking-tight italic uppercase leading-none">Student Evaluation</h1>
            <p className="text-gray-400 font-bold uppercase text-[11px] tracking-[0.2em] mt-1">Progress Review • Grade Submission • Semester Assessment</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-5 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm text-center">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Pending</p>
            <p className="text-2xl font-black text-rose-500 italic">{stats.pending}</p>
          </div>
          <div className="px-5 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm text-center">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Evaluated</p>
            <p className="text-2xl font-black text-emerald-600 italic">{stats.evaluated}</p>
          </div>
          <div className="px-5 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm text-center">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Avg System</p>
            <p className="text-2xl font-black text-indigo-600 italic">{stats.avgScore}</p>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input type="text" placeholder="Search by name or email…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-400 outline-none shadow-sm font-medium"/>
        </div>
        {/* Filter pills */}
        <div className="flex items-center gap-2">
          {[
            { id: 'all',       label: 'All Students' },
            { id: 'pending',   label: 'Not Evaluated' },
            { id: 'evaluated', label: 'Graded'        },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all
                ${filter === f.id
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/20'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-emerald-300'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Students Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_,i) => <div key={i} className="h-64 bg-white/30 rounded-3xl animate-pulse"/>)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-48 rounded-3xl bg-white/40 border-2 border-dashed border-gray-200 flex flex-col items-center text-center">
          <Users size={56} className="text-gray-200 mb-6"/>
          <h3 className="text-3xl font-black text-gray-400 uppercase tracking-tighter italic">No Students Found</h3>
          <p className="text-base font-bold text-gray-300 uppercase tracking-widest mt-2">Adjust your filter or search query</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((s) => {
            const needsEval = !s.has_record;
            const sysScore  = s.system_score || 0;
            const riskLevel =
              sysScore >= 70 ? 'good' :
              sysScore >= 40 ? 'warn' : 'risk';
            const riskStyles = {
              good: 'border-emerald-200 bg-emerald-50/20',
              warn: 'border-amber-200   bg-amber-50/10',
              risk: 'border-rose-200    bg-rose-50/10',
            };
            const riskIcon = {
              good: <CheckCircle  size={14} className="text-emerald-500"/>,
              warn: <AlertTriangle size={14} className="text-amber-500"/>,
              risk: <AlertTriangle size={14} className="text-rose-500 animate-pulse"/>,
            };

            return (
              <motion.div key={s.id} variants={cardEntrance}>
                <GlassCard className={`h-full flex flex-col border-2 ${riskStyles[riskLevel]} hover:shadow-xl transition-all duration-300 group`}>
                  {/* Card header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-emerald-500/20 overflow-hidden">
                        {s.avatar ? <img src={s.avatar} alt="User" className="w-full h-full object-cover" /> : s.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-black text-gray-800 uppercase italic text-sm leading-tight">{s.name}</h3>
                        <p className="text-[10px] text-gray-400 font-bold mt-0.5">{s.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {riskIcon[riskLevel]}
                      {s.has_record ? (
                        <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black border uppercase tracking-widest ${gc(s.latest_grade)}`}>
                          {s.latest_grade}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-xl text-[9px] font-black border uppercase tracking-widest bg-gray-100 text-gray-400 border-gray-200">
                          Ungraded
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-3 mb-4">
                    {s.semester && (
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-xl text-[9px] font-black border border-indigo-100 uppercase tracking-widest">
                        Sem {s.semester}
                      </span>
                    )}
                    {s.batch && (
                      <span className="px-2.5 py-1 bg-gray-50 text-gray-500 rounded-xl text-[9px] font-black border border-gray-100 uppercase tracking-widest">
                        {s.batch}
                      </span>
                    )}
                    {s.overdue_todos > 0 && (
                      <span className="px-2.5 py-1 bg-rose-50 text-rose-500 rounded-xl text-[9px] font-black border border-rose-100 uppercase tracking-widest animate-pulse">
                        {s.overdue_todos} Overdue
                      </span>
                    )}
                  </div>

                  {/* Progress bars */}
                  <div className="space-y-3 mb-5">
                    <ProgressBar
                      value={sysScore}
                      color={sysScore >= 70 ? 'bg-emerald-500' : sysScore >= 40 ? 'bg-amber-500' : 'bg-rose-500'}
                      label={`System Score: ${sysScore.toFixed(1)}%`}
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <div className="px-2 py-1 bg-gray-50 rounded-lg border border-gray-100">
                           <p className="text-[10px] font-bold text-gray-400 uppercase">Tasks</p>
                           <p className="text-xs font-black text-indigo-600">{s.avg_task_score?.toFixed(0)}%</p>
                        </div>
                        <div className="px-2 py-1 bg-gray-50 rounded-lg border border-gray-100">
                           <p className="text-[10px] font-bold text-gray-400 uppercase">Hosted</p>
                           <p className="text-xs font-black text-emerald-600">{s.events_hosted}</p>
                        </div>
                    </div>
                  </div>

                  {/* Existing grade info */}
                  {s.has_record && (
                    <div className="mb-4 px-3 py-2.5 bg-white/80 rounded-2xl border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Latest Grade</p>
                          <p className="text-sm font-black text-gray-700">{s.latest_semester} — Score: {s.latest_score?.toFixed(1)}</p>
                        </div>
                        <CheckCircle size={18} className="text-emerald-500 shrink-0"/>
                      </div>
                      
                      {!s.submitted_to_admin ? (
                         <button 
                           onClick={(e) => {
                             e.stopPropagation();
                             const tid = toast.loading('Sending to Admin...');
                             API.patch(`/performance/${s.id}/submit`)
                               .then(() => {
                                 toast.success('Submitted to Leaderboard!', {id: tid});
                                 fetchData();
                               })
                               .catch(() => toast.error('Submission failed', {id: tid}));
                           }}
                           className="w-full py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-200 hover:bg-indigo-600 hover:text-white transition-all">
                           Submit to Leaderboard
                         </button>
                      ) : (
                         <div className="py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-200 text-center flex items-center justify-center gap-2">
                            <Sparkles size={12}/> Profile Ranked on Leaderboard
                         </div>
                      )}
                    </div>
                  )}

                  {/* CTA */}
                  <div className="mt-auto">
                    <button onClick={() => setSelected(s)}
                      className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all
                        ${needsEval
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/20 hover:opacity-90'
                          : 'bg-gray-50 text-gray-500 border border-gray-200 hover:border-emerald-300 hover:text-emerald-600'}`}>
                      {needsEval ? (
                        <><Star size={14}/> Evaluate Now</>
                      ) : (
                        <><Award size={14}/> Re-evaluate</>
                      )}
                      <ChevronRight size={12} className="ml-auto opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all"/>
                    </button>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Evaluation modal ── */}
      <AnimatePresence>
        {selected && (
          <EvalModal
            student={selected}
            projects={projects}
            onClose={() => setSelected(null)}
            onSuccess={fetchData}
          />
        )}
      </AnimatePresence>
      </motion.div>
  );
};

export default StudentEvaluation;
