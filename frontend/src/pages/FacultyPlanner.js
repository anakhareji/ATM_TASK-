import React, { useEffect, useState, useMemo } from 'react';
import {
    Plus, Calendar, Target, Flag,
    ListTodo, Info, ChevronRight, Search, Layout, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import API from '../api/axios';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import { staggerContainer, cardEntrance } from '../utils/motionVariants';

const FacultyPlanner = () => {
    // Data States
    const [milestones, setMilestones] = useState([]);
    const [projects, setProjects] = useState([]);
    const [students, setStudents] = useState([]);

    // UI States
    const [loadingInitial, setLoadingInitial] = useState(true);
    const [loadingMilestones, setLoadingMilestones] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Form State
    const initialForm = {
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        project_id: '',
        student_id: ''
    };
    const [formData, setFormData] = useState(initialForm);

    // Initial Fetch (Strategic Data)
    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const [pRes, sRes] = await Promise.all([
                    API.get('/projects/faculty'),
                    API.get('/faculty/students/my-students')
                ]);
                setProjects(pRes.data || []);
                setStudents(sRes.data || []);
            } catch (e) {
                toast.error("Resource acquisition failed: Sync incomplete.");
            } finally {
                setLoadingInitial(false);
            }
        };
        fetchMetadata();
    }, []);

    // Body Scroll Lock
    useEffect(() => {
        if (showModal) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [showModal]);

    // Fetch Milestones
    const fetchMilestones = React.useCallback(async () => {
        setLoadingMilestones(true);
        try {
            const res = await API.get('/planner/faculty');
            setMilestones(res.data || []);
        } catch (e) {
            toast.error("Strategic map retrieval failed.");
        } finally {
            setLoadingMilestones(false);
        }
    }, []);

    useEffect(() => {
        fetchMilestones();
    }, [fetchMilestones]);

    // Handlers
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const loadToast = toast.loading("Deploying strategic milestone...");
        try {
            await API.post('/planner', formData);
            toast.success("Milestone deployed to academic path.", { id: loadToast });
            setShowModal(false);
            setFormData(initialForm);
            fetchMilestones();
        } catch (err) {
            toast.error("Deployment sequence failed.", { id: loadToast });
        } finally {
            setSubmitting(false);
        }
    };

    const filteredMilestones = useMemo(() => {
        return milestones.filter(m =>
            m.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [milestones, searchTerm]);

    if (loadingInitial) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-rose-600 font-bold animate-pulse">Scanning Academic Grid...</p>
        </div>
    );

    return (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-8 max-w-7xl mx-auto pb-20">
            {/* Header Command Center */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white/50 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/20 shadow-sm sticky top-0 z-20">
                <div className="flex-1">
                    <h1 className="text-4xl font-black text-gray-800 tracking-tight flex items-center gap-3">
                        <Target className="text-rose-600" /> Strategic Planner
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">Define course milestones and auto-generate student success paths</p>
                </div>

                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text" placeholder="Search milestones..."
                            className="w-full md:w-64 pl-12 pr-6 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500 font-bold text-sm"
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button icon={<Plus size={20} />} onClick={() => setShowModal(true)} className="bg-rose-600 hover:bg-rose-700 shadow-xl shadow-rose-100 px-8">
                        Set Milestone
                    </Button>
                </div>
            </div>

            {/* Path Grid */}
            <AnimatePresence mode="wait">
                {loadingMilestones ? (
                    <div className="py-32 flex flex-col items-center">
                        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-rose-400 font-bold">Synchronizing Paths...</p>
                    </div>
                ) : filteredMilestones.length === 0 ? (
                    <div className="py-40 flex flex-col items-center text-center bg-white/40 rounded-[2.5rem] border border-dashed border-gray-200">
                        <Layout size={64} className="text-gray-200 mb-6" />
                        <h3 className="text-2xl font-black text-gray-400">Zero Milestones Detected</h3>
                        <p className="text-gray-300 font-medium">Strategic paths must be defined to monitor student progression.</p>
                        <Button onClick={() => setShowModal(true)} variant="ghost" className="mt-8 text-rose-600 font-black">Generate First Milestone</Button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {filteredMilestones.map((milestone) => (
                            <motion.div key={milestone.id} variants={cardEntrance}>
                                <GlassCard className="group hover:border-rose-200 p-0 overflow-hidden rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-300">
                                    <div className="p-8 flex flex-col md:flex-row justify-between gap-8">
                                        <div className="flex gap-6 flex-1">
                                            <div className="p-5 bg-rose-50 text-rose-600 rounded-3xl h-fit group-hover:bg-rose-600 group-hover:text-white transition-all duration-500 shadow-sm">
                                                <Target size={32} />
                                            </div>
                                            <div className="space-y-3 flex-1">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-2xl font-black text-gray-800 tracking-tight">{milestone.title}</h3>
                                                    <span className="px-3 py-1 bg-gray-50 text-gray-400 rounded-full text-[10px] font-black tracking-widest uppercase">
                                                        Track #{milestone.project_id}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 text-xs font-black text-gray-400">
                                                    <span className="flex items-center gap-1.5"><Calendar size={14} className="text-rose-400" /> {new Date(milestone.start_date).toLocaleDateString()}</span>
                                                    <ChevronRight size={14} className="opacity-30" />
                                                    <span className="flex items-center gap-1.5 text-rose-600 italic tracking-widest uppercase">{new Date(milestone.end_date).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-xl">
                                                    Success path for <span className="text-gray-800 font-black">Recipient #{milestone.student_id}</span> focused on achieving defined completion criteria.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-center justify-center gap-4 min-w-[180px] bg-gray-50/50 rounded-3xl p-6">
                                            <div className="text-center">
                                                <p className="text-4xl font-black text-rose-600 tracking-tighter leading-none">{milestone.completed_todos || 0}</p>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Tasks Completed</p>
                                            </div>
                                            <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(milestone.completed_todos / (milestone.total_todos || 1)) * 100}%` }}
                                                    transition={{ duration: 1, ease: "easeOut" }}
                                                    className="h-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]"
                                                />
                                            </div>
                                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">
                                                {Math.round((milestone.completed_todos / (milestone.total_todos || 1)) * 100)}% Success Rate
                                            </p>
                                        </div>
                                    </div>
                                    <div className="px-8 py-5 bg-gray-50/80 border-t border-gray-100 flex justify-between items-center group-hover:bg-rose-50/20">
                                        <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest">
                                            <AlertCircle size={14} className="text-amber-500" /> Path Monitoring Active
                                        </div>
                                        <Button variant="ghost" icon={<ListTodo size={16} />} size="sm" className="font-black">View Execution Log</Button>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        ))}
                    </div>
                )}
            </AnimatePresence>

            {/* Strategic Planner Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                    >
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowModal(false)} />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 50 }}
                            className="bg-white rounded-[3rem] p-10 w-full max-w-xl relative z-10 shadow-2xl border border-white"
                        >
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h2 className="text-3xl font-black text-gray-800 tracking-tight flex items-center gap-3">
                                        <Flag className="text-rose-600" /> Strategy Path
                                    </h2>
                                    <p className="text-gray-400 font-bold text-sm mt-1">Define boundaries for academic milestones</p>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><X size={24} /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400">Milestone Heading</label>
                                    <input
                                        required autoFocus type="text"
                                        placeholder="e.g. Requirement Elicitation & Synthesis"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-3xl outline-none focus:ring-4 focus:ring-rose-50/50 font-black text-lg text-gray-800 transition-all"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-xs font-black uppercase tracking-widest text-gray-400">Project Track</label>
                                        <select required className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500 font-bold text-sm" value={formData.project_id} onChange={e => setFormData({ ...formData, project_id: e.target.value })}>
                                            <option value="">Select Track...</option>
                                            {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-xs font-black uppercase tracking-widest text-gray-400">Target Student</label>
                                        <select required className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500 font-bold text-sm" value={formData.student_id} onChange={e => setFormData({ ...formData, student_id: e.target.value })}>
                                            <option value="">Select Target...</option>
                                            {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.email})</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-xs font-black uppercase tracking-widest text-gray-400">Start Sequence</label>
                                        <input required type="date" className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500 font-bold text-sm" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-xs font-black uppercase tracking-widest text-gray-400">Final Sequence</label>
                                        <input required type="date" className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500 font-bold text-sm" value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <Button type="button" variant="secondary" className="flex-1 py-5" onClick={() => setShowModal(false)}>Abort</Button>
                                    <Button type="submit" className="flex-1 bg-rose-600 hover:bg-rose-700 shadow-xl shadow-rose-100 py-5" disabled={submitting}>
                                        {submitting ? 'Deploying...' : 'Deploy Strategic Path'}
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

const X = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

export default FacultyPlanner;
