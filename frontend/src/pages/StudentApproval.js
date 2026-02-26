import React, { useEffect, useState } from 'react';
import AdminGlassLayout from '../components/layout/AdminGlassLayout';
import API from '../api/axios';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import {
    UserSearch, Mail,
    GraduationCap, AlertCircle, Clock, Shield
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../components/ui/GlassCard';
import { formatDistanceToNow } from 'date-fns';

const StudentApproval = () => {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rejectModal, setRejectModal] = useState({ open: false, id: null, reason: '' });

    const fetchRecommendations = async () => {
        try {
            const res = await API.get('/admin/recommendations');
            setRecommendations(res.data.filter(r => r.status === 'pending'));
        } catch (err) {
            toast.error("Failed to load enrollment queue");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecommendations();
    }, []);

    const handleApprove = async (id) => {
        try {
            await API.post(`/admin/recommendations/${id}/approve`);
            toast.success("Student assigned academic credentials!", {
                icon: '🎓',
                style: { borderRadius: '12px', background: '#dcfce7', color: '#166534' }
            });
            // Update local state instead of reload
            setRecommendations(prev => prev.filter(r => r.id !== id));
        } catch (err) {
            toast.error("Handshake protocol failed");
        }
    };

    const handleReject = async () => {
        const { id, reason } = rejectModal;
        if (!reason) return toast.error("Please provide a refusal reason");

        try {
            await API.post(`/admin/recommendations/${id}/reject`, { reason });
            toast.success("Application successfully refused");
            setRecommendations(prev => prev.filter(r => r.id !== id));
            setRejectModal({ open: false, id: null, reason: '' });
        } catch (err) {
            toast.error("Rejection signal failed");
        }
    };

    return (
        <AdminGlassLayout>
            <div className="space-y-8">
                <PageHeader
                    title="Enrollment Protocol"
                    subtitle="Finalize student integration through faculty endorsement records"
                />

                {loading ? (
                    <div className="grid gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-44 bg-white/4 shadow-sm border border-gray-100/50 rounded-[2rem] animate-pulse" />
                        ))}
                    </div>
                ) : recommendations.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <GlassCard className="text-center py-32 border-dashed border-2 border-gray-200">
                            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <UserSearch size={32} className="text-gray-300" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-800 mb-2">Queue Clear</h3>
                            <p className="text-gray-400 max-w-xs mx-auto">All faculty recommendations have been fully synchronized and processed.</p>
                        </GlassCard>
                    </motion.div>
                ) : (
                    <div className="grid gap-6">
                        <AnimatePresence mode='popLayout'>
                            {recommendations.map((rec) => (
                                <motion.div
                                    key={rec.id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.4 }}
                                >
                                    <GlassCard className="group hover:border-emerald-200 transition-colors">
                                        <div className="flex flex-col lg:row justify-between lg:flex-row gap-8">
                                            <div className="flex-1 flex gap-6">
                                                <div className="relative">
                                                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${rec.type === 'faculty' ? 'from-amber-500 to-orange-500' : 'from-indigo-500 to-emerald-500'} p-0.5 mt-1`}>
                                                        <div className={`w-full h-full rounded-[14px] bg-white flex items-center justify-center ${rec.type === 'faculty' ? 'text-amber-600' : 'text-indigo-600'}`}>
                                                            {rec.type === 'faculty' ? <Shield size={28} /> : <GraduationCap size={28} />}
                                                        </div>
                                                    </div>
                                                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 ${rec.type === 'faculty' ? 'bg-amber-500' : 'bg-amber-400'} border-4 border-white rounded-full flex items-center justify-center shadow-sm`}>
                                                        {rec.type === 'faculty' ? <Shield size={10} className="text-white" /> : <Clock size={10} className="text-white" />}
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h3 className="text-xl font-black text-gray-800">{rec.name}</h3>
                                                        <div className={`px-2 py-0.5 ${rec.type === 'faculty' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'} text-[10px] uppercase font-bold tracking-widest rounded-lg border`}>
                                                            {rec.type === 'faculty' ? 'Faculty Role' : `Level: ${rec.semester}`}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-x-5 gap-y-2 mb-4">
                                                        <div className="flex items-center gap-2 text-sm text-gray-400 font-medium">
                                                            <Mail size={14} className="text-emerald-500" />
                                                            {rec.email}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm text-gray-400 font-medium border-l border-gray-200 pl-5">
                                                            <AlertCircle size={14} className="text-indigo-500" />
                                                            {rec.department}
                                                        </div>
                                                    </div>

                                                    <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50 italic text-gray-500 text-sm">
                                                        "{rec.remarks || 'No endorsement statement provided'}"
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col justify-between items-end min-w-[240px]">
                                                <div className="text-right">
                                                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Recommended By</p>
                                                    <p className="font-bold text-gray-800">{rec.faculty_name}</p>
                                                    <p className="text-[10px] text-emerald-500 font-bold">
                                                        {rec.created_at ? formatDistanceToNow(new Date(rec.created_at), { addSuffix: true }) : 'Now'}
                                                    </p>
                                                </div>
                                                <div className="flex gap-3 w-full lg:w-auto mt-6">
                                                    <Button
                                                        variant="ghost"
                                                        className="flex-1 lg:flex-none py-3 px-6 text-red-500 hover:bg-red-50 font-bold"
                                                        onClick={() => setRejectModal({ open: true, id: rec.id, reason: '' })}
                                                    >
                                                        Refuse
                                                    </Button>
                                                    <Button
                                                        className={`flex-1 lg:flex-none py-3 px-8 ${rec.type === 'faculty' ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/20' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'} shadow-lg font-bold`}
                                                        onClick={() => handleApprove(rec.id)}
                                                    >
                                                        {rec.type === 'faculty' ? 'Approve Faculty' : 'Finalize Integration'}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </GlassCard>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Rejection Modal */}
            <AnimatePresence>
                {rejectModal.open && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl"
                        >
                            <h3 className="text-2xl font-black text-gray-800 mb-2">Refusal Policy</h3>
                            <p className="text-sm text-gray-400 mb-6">Provide a detailed reason for denying this integration request. This will be logged.</p>

                            <textarea
                                value={rejectModal.reason}
                                onChange={(e) => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
                                placeholder="E.g. Incomplete credentials or duplicate entry..."
                                className="w-full h-32 bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/30 transition-all mb-6 resize-none"
                            />

                            <div className="flex gap-4">
                                <Button
                                    variant="ghost"
                                    className="flex-1 bg-gray-50 hover:bg-gray-100"
                                    onClick={() => setRejectModal({ open: false, id: null, reason: '' })}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1 bg-red-600 hover:bg-red-500 shadow-lg shadow-red-500/20"
                                    onClick={handleReject}
                                >
                                    Refuse Integration
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </AdminGlassLayout>
    );
};

export default StudentApproval;
