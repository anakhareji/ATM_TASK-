import React, { useEffect, useState, useMemo } from 'react';
import {
    FileText, User, Download, Search, CheckCircle2,
    Clock, AlertCircle, TrendingUp, X, Filter, ChevronLeft, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api/axios';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';

const ReviewSubmissions = () => {
    // Data States
    const [tasks, setTasks] = useState([]);
    const [selectedTaskId, setSelectedTaskId] = useState('');
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    // UI States
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [showGradeModal, setShowGradeModal] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Grading Form
    const [gradeData, setGradeData] = useState({
        marks: 0,
        feedback: '',
        grade: 'A'
    });

    // --- FETCH ---
    const fetchTasks = async () => {
        try {
            const res = await API.get('/tasks/my-tasks');
            // Filter only published tasks or tasks with submissions
            setTasks(res.data.filter(t => t.status !== 'draft') || []);
        } catch (e) {
            console.error(e);
            showToast("Failed to load tasks", "error");
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchSubmissions = async (taskId) => {
        if (!taskId) return;
        setLoading(true);
        try {
            const res = await API.get(`/tasks/${taskId}/submissions`);
            setSubmissions(res.data || []);
        } catch (e) {
            showToast("Failed to load submissions", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedTaskId) {
            fetchSubmissions(selectedTaskId);
        } else {
            setSubmissions([]);
        }
    }, [selectedTaskId]);

    // --- HANDLERS ---
    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleGradeClick = (sub) => {
        setSelectedSubmission(sub);
        setGradeData({
            marks: sub.marks || 0,
            feedback: sub.feedback || '',
            grade: sub.grade || 'A'
        });
        setShowGradeModal(true);
    };

    const calculateGrade = (marks, max) => {
        const percentage = (marks / max) * 100;
        if (percentage >= 90) return 'A+';
        if (percentage >= 80) return 'A';
        if (percentage >= 70) return 'B';
        if (percentage >= 60) return 'C';
        if (percentage >= 50) return 'D';
        return 'F';
    };

    const handleMarksChange = (val) => {
        const selectedTaskObj = tasks.find(t => t.id == selectedTaskId);
        const max = selectedTaskObj?.max_marks || 100;
        // Don't clamp rigidly, allow typing, but validate on blur or submit
        // However, clamping is safer for "controlled" inputs to prevent invalid state
        const marks = Math.min(Math.max(0, parseInt(val) || 0), max);

        setGradeData(prev => ({
            ...prev,
            marks: marks,
            grade: calculateGrade(marks, max)
        }));
    };

    const submitGrade = async () => {
        setSubmitting(true);
        try {
            await API.post(`/tasks/${selectedTaskId}/grade`, {
                submission_id: selectedSubmission.id,
                ...gradeData
            });
            setShowGradeModal(false);
            showToast("Graded successfully");
            fetchSubmissions(selectedTaskId); // Refresh
        } catch (e) {
            showToast("Grading failed", "error");
        } finally {
            setSubmitting(false);
        }
    };

    // --- FILTER & ANALYTICS ---

    const filteredSubmissions = useMemo(() => {
        return submissions.filter(s => {
            if (filter !== 'all' && s.status !== filter) return false;
            if (search && !s.student_name.toLowerCase().includes(search.toLowerCase())) return false;
            return true;
        });
    }, [submissions, filter, search]);

    const stats = useMemo(() => {
        const total = submissions.length;
        const graded = submissions.filter(s => s.status === 'graded').length;
        const late = submissions.filter(s => s.is_late).length;
        const avg = graded > 0
            ? (submissions.reduce((acc, curr) => acc + (curr.marks || 0), 0) / graded).toFixed(1)
            : 0;

        return { total, graded, late, avg };
    }, [submissions]);

    // --- RENDER ---

    return (
        <div className="space-y-6 min-h-screen pb-20 relative">
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`fixed top-4 right-4 px-6 py-3 rounded-xl shadow-2xl z-[200] font-bold flex items-center gap-3 ${toast.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}
                    >
                        {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* HEADER & SELECTION */}
            <div className="bg-white/50 backdrop-blur-xl p-6 rounded-3xl border border-white/20 shadow-sm sticky top-0 z-30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-800 tracking-tight flex items-center gap-2">
                        <FileText className="text-indigo-600" /> Review Submissions
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">Evaluate student performance</p>
                </div>

                <div className="w-full md:w-auto">
                    <select
                        className="w-full md:w-64 px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm shadow-sm"
                        value={selectedTaskId}
                        onChange={(e) => setSelectedTaskId(e.target.value)}
                    >
                        <option value="">Select Task to Review...</option>
                        {tasks.map(t => <option key={t.id} value={String(t.id)}>{t.title}</option>)}
                    </select>
                </div>
            </div>

            {selectedTaskId ? (
                <>
                    {/* STATS ROW */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard label="Total Submissions" value={stats.total} icon={<User size={18} />} color="blue" />
                        <StatCard label="Graded" value={stats.graded} icon={<CheckCircle2 size={18} />} color="emerald" />
                        <StatCard label="Late Submissions" value={stats.late} icon={<Clock size={18} />} color="amber" />
                        <StatCard label="Average Score" value={stats.avg} icon={<TrendingUp size={18} />} color="indigo" />
                    </div>

                    {/* CONTROLS */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                className="w-full pl-10 pr-4 py-2 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-gray-700"
                                placeholder="Search student..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 bg-white p-1 rounded-xl border">
                            {['all', 'submitted', 'graded'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${filter === f ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* TABLE */}
                    <GlassCard className="overflow-hidden p-0">
                        {loading ? (
                            <div className="py-20 text-center text-indigo-500 animate-pulse font-bold">Loading submissions...</div>
                        ) : filteredSubmissions.length === 0 ? (
                            <div className="py-20 text-center text-gray-400 font-medium">No submissions found.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-50/50 text-gray-400 text-xs font-bold uppercase tracking-wider">
                                        <tr>
                                            <th className="p-4">Student</th>
                                            <th className="p-4">Submitted At</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4">Attachment</th>
                                            <th className="p-4">Score</th>
                                            <th className="p-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredSubmissions.map((sub) => (
                                            <motion.tr
                                                key={sub.id}
                                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                                className="hover:bg-indigo-50/30 transition-colors group"
                                            >
                                                <td className="p-4">
                                                    <div>
                                                        <p className="font-bold text-gray-800">{sub.student_name}</p>
                                                        <p className="text-xs text-gray-400">{sub.student_email}</p>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-sm font-medium text-gray-600">
                                                    <div className="flex flex-col">
                                                        <span>{new Date(sub.submitted_at).toLocaleDateString()}</span>
                                                        <span className="text-[10px] text-gray-400">{new Date(sub.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <StatusBadge status={sub.status} isLate={sub.is_late} />
                                                </td>
                                                <td className="p-4">
                                                    {sub.file_url ? (
                                                        <a href={sub.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-indigo-100 text-gray-600 hover:text-indigo-600 rounded-lg text-xs font-bold transition-colors">
                                                            <Download size={14} /> View
                                                        </a>
                                                    ) : (
                                                        <span className="text-xs text-gray-300 italic">No File</span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    {sub.status === 'graded' ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-lg font-black text-gray-800">{sub.marks}</span>
                                                            <span className={`text-[10px] font-bold px-1.5 rounded ${getGradeColor(sub.grade)}`}>{sub.grade}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">–</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <Button size="sm" onClick={() => handleGradeClick(sub)} className="bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200">
                                                        {sub.status === 'graded' ? 'Edit Grade' : 'Grade Submission'}
                                                    </Button>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </GlassCard>
                </>
            ) : (
                <EmptyState />
            )}

            {/* GRADING MODAL */}
            <AnimatePresence>
                {showGradeModal && selectedSubmission && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-3xl p-8 w-full max-w-lg relative shadow-2xl"
                        >
                            <button onClick={() => setShowGradeModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><X /></button>

                            <h2 className="text-2xl font-black text-gray-800 mb-1">Grade Submission</h2>
                            <p className="text-gray-500 font-medium text-sm mb-6 flex items-center gap-2">
                                <User size={14} /> {selectedSubmission.student_name}
                            </p>

                            <div className="space-y-6">
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-center">
                                    <div>
                                        <h4 className="text-xs font-bold uppercase text-gray-400 mb-1">Current Grade</h4>
                                        <p className="text-xs text-gray-500">Based on max {tasks.find(t => t.id == selectedTaskId)?.max_marks}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-4xl font-black text-indigo-600">{gradeData.marks}</div>
                                        <div className={`text-2xl font-black px-4 py-1 rounded-xl ${getGradeColor(gradeData.grade)}`}>{gradeData.grade}</div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Marks Awarded</label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                                        value={gradeData.marks}
                                        onChange={(e) => handleMarksChange(e.target.value)}
                                        max={tasks.find(t => t.id == selectedTaskId)?.max_marks}
                                        disabled={submitting}
                                    />
                                    <p className="text-[10px] text-gray-400 text-right">Max allowed: {tasks.find(t => t.id == selectedTaskId)?.max_marks}</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Feedback</label>
                                    <textarea
                                        rows={4}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                                        placeholder="Enter constructive feedback..."
                                        value={gradeData.feedback}
                                        onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
                                        disabled={submitting}
                                    />
                                </div>

                                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 py-3 text-lg" onClick={submitGrade} disabled={submitting}>
                                    {submitting ? 'Saving Evaluation...' : 'Submit Evaluation'}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- SUB COMPONENTS ---

const StatCard = ({ label, value, icon, color }) => (
    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-black text-gray-800 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-xl bg-${color}-50 text-${color}-600`}>
            {React.cloneElement(icon, { size: 24 })}
        </div>
    </div>
);

const EmptyState = () => (
    <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-32 text-center bg-white/30 rounded-3xl border border-dashed border-gray-200"
    >
        <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
            <Search size={40} className="text-indigo-300" />
        </div>
        <h2 className="text-xl font-bold text-gray-400">No Task Selected</h2>
        <p className="text-gray-400 text-sm mt-1">Please select a task from the dropdown to review submissions.</p>
    </motion.div>
);

const StatusBadge = ({ status, isLate }) => {
    // If graded, status is implied
    if (status === 'graded') return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-black uppercase tracking-wide"><CheckCircle2 size={12} /> Graded</span>;

    // If submitted
    return (
        <div className="flex gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-black uppercase tracking-wide"><Clock size={12} /> Submitted</span>
            {isLate && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-black uppercase tracking-wide"><AlertCircle size={12} /> Late</span>}
        </div>
    )
};

const getGradeColor = (grade) => {
    switch (grade) {
        case 'A+': return 'bg-emerald-100 text-emerald-700';
        case 'A': return 'bg-emerald-100 text-emerald-700';
        case 'B': return 'bg-blue-100 text-blue-700';
        case 'C': return 'bg-yellow-100 text-yellow-700';
        case 'D': return 'bg-orange-100 text-orange-700';
        default: return 'bg-red-100 text-red-700';
    }
};

export default ReviewSubmissions;
