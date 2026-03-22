import React, { useEffect, useState } from 'react';
import API from '../api/axios';
import PageHeader from '../components/ui/PageHeader';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import { Search, FileText, FileBarChart, Calendar, Briefcase, Zap, X, Printer, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const AdminTasks = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    
    // Report Modal State
    const [showReportModal, setShowReportModal] = useState(null);
    const [loadingReport, setLoadingReport] = useState(false);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const res = await API.get('/tasks');
            setTasks(res.data || []);
        } catch (error) {
            toast.error("Telemetry failed: Global tasks unreachable");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const filtered = tasks.filter(t => 
        (t.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.description || "").toLowerCase().includes(searchTerm.toLowerCase())
    ).filter(t => {
        if (!statusFilter) return true;
        return t.status?.toLowerCase() === statusFilter.toLowerCase();
    });

    const handleViewReport = async (taskId) => {
        setLoadingReport(true);
        const loadToast = toast.loading("Decrypting Official Intelligence Report...");
        try {
            const res = await API.get(`/tasks/${taskId}/report`);
            setShowReportModal(res.data);
            toast.dismiss(loadToast);
        } catch (err) {
            toast.error("Failed to compile report. Report may no longer be available.", { id: loadToast });
        } finally {
            setLoadingReport(false);
        }
    };

    return (
        <div className="space-y-8 pb-12">
            <PageHeader
                title="Global Tasks & Missions"
                subtitle="High-level observatory for all department-issued tasks and their evaluation reports"
            >
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Identify specific mission parameters..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 pr-6 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 outline-none w-72 md:w-96 shadow-sm transition-all"
                        />
                    </div>
                    <select
                        className="px-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-gray-600 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 outline-none"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        <option value="draft">Draft</option>
                        <option value="assigned">Assigned</option>
                        <option value="in_progress">In Progress</option>
                        <option value="closed">Closed / Finalized</option>
                    </select>
                </div>
            </PageHeader>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-48 bg-white/50 border border-gray-100 rounded-[2rem] animate-pulse" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-32">
                    <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <Briefcase size={32} className="text-gray-300" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-800 mb-2">No Active Missions Found</h3>
                    <p className="text-gray-400 max-w-xs mx-auto text-sm">No tasks match your current observatory filters.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <AnimatePresence>
                        {filtered.map((task, idx) => (
                            <motion.div
                                key={task.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <GlassCard className="flex flex-col h-full group hover:border-emerald-200 transition-colors relative overflow-hidden shadow-sm hover:shadow-xl">
                                    <div className="mb-6">
                                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 shadow-sm ${
                                            task.status === 'closed' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                                            task.status === 'in_progress' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                            'bg-amber-50 text-amber-600 border border-amber-100'
                                        }`}>
                                            {task.status || 'Unknown'}
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-800 mb-2 leading-tight pr-8">{task.title}</h3>
                                        <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed">
                                            {task.description || "No mission brief provided."}
                                        </p>
                                    </div>
                                    <div className="mt-auto space-y-4">
                                        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                                                <Zap size={12} className="animate-pulse" />
                                                <span>{task.max_marks || 100} Points</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
                                                <Calendar size={12} />
                                                <span>DUE: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}</span>
                                            </div>
                                        </div>
                                        <div className="pt-2">
                                            <Button 
                                                className={`w-full text-white rounded-xl flex justify-center items-center gap-2 font-black text-xs h-10 relative overflow-hidden group/btn ${
                                                    task.status === 'closed' 
                                                        ? 'bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/30' 
                                                        : 'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/30'
                                                }`}
                                                onClick={() => handleViewReport(task.id)}
                                            >
                                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                                                <FileBarChart size={16} /> {task.status === 'closed' ? 'View Official Report' : 'View Progress'}
                                            </Button>
                                        </div>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Official Report Modal (Identical to Faculty View) */}
            <AnimatePresence>
                {showReportModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md print:bg-white print:p-0 print:block"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white rounded-[2rem] p-8 w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl relative custom-scrollbar print:shadow-none print:max-h-none print:w-full print:p-0"
                        >
                            <div className="flex justify-between items-start mb-8 print:hidden">
                                <h2 className="text-2xl font-black text-gray-800 flex items-center gap-3">
                                    <CheckCircle className="text-indigo-600" /> Official Administration Report
                                </h2>
                                <div className="flex gap-4">
                                    <Button onClick={() => window.print()} className="bg-emerald-600 hover:bg-emerald-700 px-6 py-2 shadow-emerald-100 shadow-lg text-xs flex items-center gap-2">
                                        <Printer size={16} /> Print Report
                                    </Button>
                                    <button onClick={() => setShowReportModal(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><X size={24} /></button>
                                </div>
                            </div>

                            {/* Printable Content */}
                            <div className="space-y-8">
                                <div className="text-center border-b-[3px] border-double border-gray-200 pb-8">
                                    <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase mb-2">{showReportModal.title}</h1>
                                    <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Official Evaluation Record &bull; Max Points: {showReportModal.max_marks}</p>
                                    <div className="flex justify-center gap-6 mt-4 text-xs font-bold text-gray-400">
                                        <p>Deployed: {showReportModal.started_at ? new Date(showReportModal.started_at).toLocaleString() : 'N/A'}</p>
                                        <p>&bull;</p>
                                        <p>Closed: {showReportModal.closed_at ? new Date(showReportModal.closed_at).toLocaleString() : 'On-Going'}</p>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm border-collapse">
                                        <thead>
                                            <tr className="border-b-2 border-gray-800 text-xs uppercase tracking-widest text-gray-400 font-black">
                                                <th className="py-4 px-4 font-black">Operative</th>
                                                <th className="py-4 px-4 font-black">Status</th>
                                                <th className="py-4 px-4 font-black">Evaluation Date</th>
                                                <th className="py-4 px-4 font-black text-right">Time Logged</th>
                                                <th className="py-4 px-4 font-black text-right">Score</th>
                                                <th className="py-4 px-4 font-black text-center">Grade</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 font-bold">
                                            {showReportModal.participants.map((p, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                    <td className="py-4 px-4"><p className="text-gray-900">{p.student_name}</p></td>
                                                    <td className="py-4 px-4">
                                                        <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest ${p.status === 'graded' ? 'bg-emerald-100 text-emerald-700' : p.status === 'submitted' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                                                            {p.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4 text-gray-600">{p.submitted_at ? new Date(p.submitted_at).toLocaleString() : '-'}</td>
                                                    <td className="py-4 px-4 text-right text-indigo-600">
                                                        {p.time_taken_seconds > 0 ? (
                                                            p.time_taken_seconds > 86400 
                                                                ? `${Math.floor(p.time_taken_seconds / 86400)}d ${Math.floor((p.time_taken_seconds % 86400)/3600)}h`
                                                                : `${Math.floor(p.time_taken_seconds / 3600)}h ${Math.floor((p.time_taken_seconds % 3600) / 60)}m`
                                                        ) : '-'}
                                                    </td>
                                                    <td className="py-4 px-4 text-right text-lg font-black text-gray-800">{p.marks !== null ? p.marks : '-'}</td>
                                                    <td className="py-4 px-4 text-center">
                                                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-gray-900 text-white font-black">{p.grade || '-'}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminTasks;
