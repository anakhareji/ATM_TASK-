import React, { useEffect, useState, useMemo } from 'react';
import {
    CheckCircle2, AlertCircle, MessageSquare,
    FileText, Search, Download, Info, Star, StarHalf, X, Clock, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../api/axios';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import { staggerContainer, cardEntrance } from '../utils/motionVariants';

const FacultySubmissions = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    // Data States
    const [tasks, setTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(searchParams.get('task_id') || "");
    const [submissions, setSubmissions] = useState([]);

    // UI States
    const [loadingInitial, setLoadingInitial] = useState(true);
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(null);
    const [gradingLoading, setGradingLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Review Form State
    const [reviewForm, setReviewForm] = useState({ marks: '', internal_feedback: '', grade: 'A' });

    // Initial Fetch
    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const res = await API.get('/tasks/my-tasks');
                // Only show tasks that are published and can have submissions
                setTasks(res.data.filter(t => t.status !== 'draft') || []);
            } catch (e) {
                toast.error("Failed to synchronize task registry.");
            } finally {
                setLoadingInitial(false);
            }
        };
        fetchTasks();
    }, []);

    // Fetch Submissions (Sync with selectedTask)
    const fetchSubmissions = React.useCallback(async () => {
        if (!selectedTask) {
            setSubmissions([]);
            return;
        }
        setLoadingSubmissions(true);
        try {
            const res = await API.get(`/tasks/${selectedTask}/submissions`);
            setSubmissions(res.data || []);
        } catch (e) {
            toast.error("Transmission error: Could not retrieve deliverables.");
        } finally {
            setLoadingSubmissions(false);
        }
    }, [selectedTask]);

    useEffect(() => {
        fetchSubmissions();
    }, [fetchSubmissions]);

    // Body Scroll Lock
    useEffect(() => {
        if (showReviewModal) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [showReviewModal]);

    // Handlers
    const handleTaskChange = (e) => {
        const val = e.target.value;
        setSelectedTask(val);
        if (val) setSearchParams({ task_id: val });
        else setSearchParams({});
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        const currentTask = tasks.find(t => String(t.id) === String(selectedTask));
        if (!currentTask) return;

        if (parseInt(reviewForm.marks) > currentTask.max_marks) {
            return toast.error(`Boundary Error: Max allowed is ${currentTask.max_marks}`);
        }

        setGradingLoading(true);
        const loadToast = toast.loading("Processing evaluation...");
        try {
            await API.post(`/tasks/${selectedTask}/grade`, {
                submission_id: showReviewModal.id,
                marks: parseInt(reviewForm.marks),
                feedback: reviewForm.internal_feedback,
                grade: calculateGrade(reviewForm.marks, currentTask.max_marks)
            });
            toast.success("Evaluation synchronized.", { id: loadToast });
            setShowReviewModal(null);
            fetchSubmissions();
        } catch (err) {
            toast.error("Evaluation sync failed.", { id: loadToast });
        } finally {
            setGradingLoading(false);
        }
    };

    const calculateGrade = (marks, max) => {
        const pct = (marks / max) * 100;
        if (pct >= 90) return 'A+';
        if (pct >= 80) return 'A';
        if (pct >= 70) return 'B';
        if (pct >= 60) return 'C';
        if (pct >= 50) return 'D';
        return 'F';
    };

    const filteredSubmissions = useMemo(() => {
        return submissions.filter(s =>
            s.student_name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [submissions, searchTerm]);

    if (loadingInitial) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-blue-600 font-bold animate-pulse">Initializing Evaluation Engine...</p>
        </div>
    );

    return (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-8 max-w-7xl mx-auto pb-20">
            {/* Header / Selection Control */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white/50 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/20 shadow-sm sticky top-0 z-20">
                <div className="flex-1">
                    <h1 className="text-4xl font-black text-gray-800 tracking-tight flex items-center gap-3">
                        <FileText className="text-blue-600" /> Review Center
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">Grade student deliverables and provide constructive feedback</p>
                </div>

                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text" placeholder="Search students..."
                            className="w-full md:w-64 pl-12 pr-6 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="px-6 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm shadow-sm transition-all"
                        value={selectedTask}
                        onChange={handleTaskChange}
                    >
                        <option value="">Select Task to Review...</option>
                        {tasks.map(t => <option key={t.id} value={String(t.id)}>{t.title}</option>)}
                    </select>
                </div>
            </div>

            {/* Submissions List */}
            {!selectedTask ? (
                <div className="py-40 flex flex-col items-center text-center">
                    <div className="w-24 h-24 bg-blue-50 rounded-[2rem] flex items-center justify-center mb-8">
                        <Star size={40} className="text-blue-400" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-400">Awaiting Selection</h3>
                    <p className="text-gray-300 font-medium max-w-sm mt-2">Select an active assignment track to begin the evaluation process.</p>
                </div>
            ) : loadingSubmissions ? (
                <div className="py-32 flex flex-col items-center">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-blue-400 font-bold">Retrieving Deliverables...</p>
                </div>
            ) : filteredSubmissions.length === 0 ? (
                <div className="py-40 flex flex-col items-center text-center bg-white/40 rounded-[2.5rem] border border-dashed border-gray-200">
                    <Info size={64} className="text-gray-200 mb-6" />
                    <h3 className="text-2xl font-black text-gray-400">No Submissions Detected</h3>
                    <p className="text-gray-300 font-medium">Students haven't uploaded any deliverables for this mission yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {filteredSubmissions.map(sub => (
                        <motion.div key={sub.id} variants={cardEntrance}>
                            <GlassCard className="flex flex-col xl:flex-row items-center justify-between gap-8 p-8 group hover:border-blue-200 transition-all rounded-3xl shadow-sm hover:shadow-xl">
                                <div className="flex items-center gap-6 flex-1 w-full">
                                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-sm">
                                        <FileText size={28} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl font-black text-gray-800 tracking-tight">{sub.student_name || `Recipient #${sub.student_id}`}</h3>
                                            <span className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${sub.status === 'submitted' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                {sub.status}
                                            </span>
                                            {sub.is_late && <span className="bg-rose-100 text-rose-600 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest">Late</span>}
                                        </div>
                                        <p className="text-sm text-gray-500 font-medium italic line-clamp-1">" {sub.submission_text || "No descriptive text provided in transmission."} "</p>
                                        <div className="flex flex-wrap items-center gap-6 mt-4 pt-4 border-t border-gray-100">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1 bg-emerald-100 text-emerald-600 rounded-lg"><Clock size={12} /></div>
                                                <div>
                                                    <p className="text-[7px] font-black uppercase text-gray-400 tracking-widest">Intake</p>
                                                    <p className="text-[10px] font-bold text-gray-600">
                                                        {sub.task_started_at ? new Date(sub.task_started_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="p-1 bg-blue-100 text-blue-600 rounded-lg"><Send size={12} /></div>
                                                <div>
                                                    <p className="text-[7px] font-black uppercase text-gray-400 tracking-widest">Transmission</p>
                                                    <p className="text-[10px] font-bold text-gray-600">
                                                        {new Date(sub.submitted_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                    </p>
                                                </div>
                                            </div>
                                            {sub.file_url && (
                                                <a href={sub.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-blue-600 text-[10px] font-black uppercase tracking-widest hover:underline ml-auto">
                                                    <Download size={14} /> View Payload
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8 w-full xl:w-auto border-t xl:border-t-0 xl:border-l border-gray-100 pt-6 xl:pt-0 xl:pl-8 justify-between">
                                    <div className="text-center px-4">
                                        <p className={`text-4xl font-black ${sub.status === 'graded' ? 'text-emerald-600' : 'text-blue-600'}`}>
                                            {sub.marks || 0}
                                        </p>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Authenticated</p>
                                    </div>
                                    <Button
                                        onClick={() => {
                                            setShowReviewModal(sub);
                                            setReviewForm({ marks: sub.marks || '', internal_feedback: sub.feedback || '', grade: sub.grade || 'A' });
                                        }}
                                        className={`${sub.status === 'graded' ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-100'} px-8`}
                                    >
                                        {sub.status === 'graded' ? 'Recalibrate' : 'Evaluate Now'}
                                    </Button>
                                </div>
                            </GlassCard>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Review Modal */}
            <AnimatePresence>
                {showReviewModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                    >
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowReviewModal(null)} />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 50 }}
                            className="bg-white rounded-[3rem] p-10 w-full max-w-lg relative z-10 shadow-2xl border border-white"
                        >
                            <div className="flex justify-between items-center mb-10">
                                <h2 className="text-3xl font-black text-gray-800 tracking-tight flex items-center gap-3">
                                    <MessageSquare className="text-blue-600" /> Evaluation
                                </h2>
                                <button onClick={() => setShowReviewModal(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><X size={24} /></button>
                            </div>

                            <form onSubmit={handleReviewSubmit} className="space-y-8">
                                <div className="grid grid-cols-1 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-xs font-black uppercase tracking-widest text-gray-400">Awarded Points</label>
                                        <div className="relative">
                                            <input
                                                required autoFocus type="number"
                                                className="w-full px-6 py-5 bg-gray-50 border border-gray-100 rounded-3xl outline-none focus:ring-4 focus:ring-blue-50/50 font-black text-3xl text-blue-600 text-center"
                                                value={reviewForm.marks}
                                                onChange={(e) => setReviewForm({ ...reviewForm, marks: e.target.value })}
                                            />
                                            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 font-black">
                                                / {tasks.find(t => String(t.id) === String(selectedTask))?.max_marks}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-xs font-black uppercase tracking-widest text-gray-400">Critical Feedback</label>
                                        <textarea
                                            rows={5}
                                            required
                                            placeholder="Provide detailed evaluation remarks..."
                                            value={reviewForm.internal_feedback}
                                            onChange={(e) => setReviewForm({ ...reviewForm, internal_feedback: e.target.value })}
                                            className="w-full px-6 py-5 bg-gray-50 border border-gray-100 rounded-3xl outline-none focus:ring-4 focus:ring-blue-50/50 font-medium text-sm leading-relaxed"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <Button type="button" variant="secondary" className="flex-1 py-5" onClick={() => setShowReviewModal(null)}>Abort</Button>
                                    <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-100 py-5" disabled={gradingLoading}>
                                        {gradingLoading ? 'Processing...' : 'Authorize Grade'}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default FacultySubmissions;
