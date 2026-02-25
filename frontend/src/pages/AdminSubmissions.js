import React, { useEffect, useState } from 'react';
import AdminGlassLayout from '../components/layout/AdminGlassLayout';
import API from '../api/axios';
import PageHeader from '../components/ui/PageHeader';
import GlassCard from '../components/ui/GlassCard';
import { Search, FileText, User, CheckCircle, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

const AdminSubmissions = () => {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchSubmissions = async () => {
        try {
            const res = await API.get('/admin/submissions');
            setSubmissions(res.data);
        } catch (err) {
            toast.error("Telemetry failed: records unreachable");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubmissions();
    }, []);

    const filtered = submissions.filter(s =>
        s.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.task_title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusStyle = (status) => {
        const s = status.toLowerCase();
        if (s.includes('grade')) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        if (s.includes('complete')) return 'bg-indigo-50 text-indigo-600 border-indigo-100';
        return 'bg-amber-50 text-amber-600 border-amber-100';
    };

    return (
        <AdminGlassLayout>
            <div className="space-y-8 pb-12">
                <PageHeader
                    title="Submission Archive"
                    subtitle="Universal surveillance of all task completions, evaluations, and academic milestones"
                >
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Identify student or task signature..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 pr-6 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 outline-none w-72 md:w-96 shadow-sm transition-all"
                        />
                    </div>
                </PageHeader>

                <GlassCard className="p-0 overflow-hidden shadow-xl shadow-gray-200/40 border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm border-collapse">
                            <thead className="bg-gray-50/80 border-b border-gray-100">
                                <tr>
                                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Student Identity</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Task Allocation</th>
                                    <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Lifecycle State</th>
                                    <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Evaluation</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Timeline Index</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 bg-white">
                                {loading ? (
                                    [1, 2, 3, 4, 5, 6].map(i => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-8 py-5"><div className="h-5 w-40 bg-gray-100 rounded-lg" /></td>
                                            <td className="px-8 py-5"><div className="h-5 w-64 bg-gray-100 rounded-lg" /></td>
                                            <td className="px-8 py-5 flex justify-center"><div className="h-6 w-20 bg-gray-100 rounded-lg" /></td>
                                            <td className="px-8 py-5"><div className="h-5 w-12 bg-gray-100 rounded-lg mx-auto" /></td>
                                            <td className="px-8 py-5"><div className="h-5 w-24 bg-gray-100 rounded-lg ml-auto" /></td>
                                        </tr>
                                    ))
                                ) : filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-32 text-center">
                                            <FileText size={64} className="mx-auto mb-6 text-gray-200" />
                                            <h3 className="text-xl font-bold text-gray-400 tracking-tight">Archive Empty</h3>
                                            <p className="text-gray-400 text-xs mt-2 max-w-xs mx-auto">No records match the current surveillance parameters.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    <AnimatePresence>
                                        {filtered.map((s, idx) => (
                                            <motion.tr
                                                key={s.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: idx * 0.02 }}
                                                className="hover:bg-emerald-50/30 transition-colors group cursor-default"
                                            >
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-emerald-600 font-black text-xs border border-gray-100 shadow-sm group-hover:scale-110 transition-transform">
                                                            {s.student_name?.[0]}
                                                        </div>
                                                        <span className="text-gray-800 font-bold">{s.student_name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div>
                                                        <p className="text-gray-700 font-medium group-hover:text-emerald-700 transition-colors">{s.task_title}</p>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Stream Artifact</p>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-center">
                                                    <div className={`inline-flex items-center px-2.5 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider ${getStatusStyle(s.status)} shadow-sm`}>
                                                        {s.status}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-center">
                                                    {s.grade ? (
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-emerald-600 font-black text-lg leading-none">{s.grade}</span>
                                                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-tighter mt-1">Verified</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-200 font-bold">Unranked</span>
                                                    )}
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-gray-700 font-bold text-xs">{format(new Date(s.submitted_at), 'MMM dd, yyyy')}</span>
                                                        <span className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">{format(new Date(s.submitted_at), 'HH:mm')} Z</span>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                )}
                            </tbody>
                        </table>
                    </div>
                </GlassCard>
            </div>
        </AdminGlassLayout>
    );
};

export default AdminSubmissions;
