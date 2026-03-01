import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, Activity, CheckCircle, AlertTriangle, Star,
  X, BookOpen, BarChart3, Zap, TrendingUp, Sparkles,
  ClipboardList, Target, Award, ChevronRight, Filter
} from 'lucide-react';
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
  const previewGrade        = scoreToGrade(form.score);

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
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white text-xl font-black">
              {student.name.charAt(0).toUpperCase()}
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

        {/* Progress summary (read-only) */}
        <div className="px-8 py-4 bg-gray-50 border-b border-gray-100 grid grid-cols-3 gap-4">
          {[
            { label: 'System Score', value: student.system_score?.toFixed(1) || '0.0', color: 'text-emerald-600' },
            { label: 'Todo Rate',    value: `${student.todo_rate || 0}%`,               color: 'text-indigo-600'  },
            { label: 'Overdue',      value: student.overdue_todos || 0,                  color: 'text-rose-500'    },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
              <p className={`text-xl font-black ${color}`}>{value}</p>
            </div>
          ))}
        </div>

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

  const fetchData = async () => {
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
  };

  useEffect(() => { fetchData(); }, []);

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
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-emerald-500/20">
                        {s.name.charAt(0).toUpperCase()}
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
                    <ProgressBar
                      value={s.todo_rate || 0}
                      color="bg-indigo-400"
                      label={`To-Do Progress: ${s.done_todos}/${s.total_todos}`}
                    />
                  </div>

                  {/* Existing grade info */}
                  {s.has_record && (
                    <div className="mb-4 px-3 py-2.5 bg-white/80 rounded-2xl border border-gray-100 flex items-center justify-between">
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Latest Grade</p>
                        <p className="text-sm font-black text-gray-700">{s.latest_semester} — Score: {s.latest_score?.toFixed(1)}</p>
                      </div>
                      <CheckCircle size={18} className="text-emerald-500 shrink-0"/>
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
