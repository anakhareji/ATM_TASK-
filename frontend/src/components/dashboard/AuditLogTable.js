import React from 'react';
import { motion } from 'framer-motion';
import {
    UserPlus, UserMinus, Shield, Zap, Briefcase,
    Trash2, Edit, CheckCircle, Clock
} from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import { formatDistanceToNow } from 'date-fns';

const AuditLogTable = ({ logs = [] }) => {
    const getActionIcon = (action) => {
        const a = action.toLowerCase();
        if (a.includes('create') || a.includes('approve_recommendation')) return { icon: <UserPlus size={16} />, color: 'bg-emerald-100 text-emerald-600', label: 'Auth' };
        if (a.includes('delete')) return { icon: <Trash2 size={16} />, color: 'bg-red-100 text-red-600', label: 'Safety' };
        if (a.includes('deactivate')) return { icon: <UserMinus size={16} />, color: 'bg-amber-100 text-amber-600', label: 'Access' };
        if (a.includes('activate')) return { icon: <Zap size={16} />, color: 'bg-emerald-100 text-emerald-600', label: 'Access' };
        if (a.includes('role')) return { icon: <Shield size={16} />, color: 'bg-indigo-100 text-indigo-600', label: 'Perms' };
        if (a.includes('project')) return { icon: <Briefcase size={16} />, color: 'bg-blue-100 text-blue-600', label: 'Acad' };
        return { icon: <Edit size={16} />, color: 'bg-gray-100 text-gray-600', label: 'System' };
    };

    return (
        <GlassCard className="h-full flex flex-col p-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 tracking-tight">System Live Feed</h3>
                    <p className="text-xs text-gray-400 font-medium tracking-wide">Real-time infrastructure governance log</p>
                </div>
                <div className="p-2 bg-emerald-50 rounded-xl">
                    <CheckCircle size={18} className="text-emerald-500" />
                </div>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto max-h-[600px] pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                {logs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-20 text-center opacity-40">
                        <Clock size={48} className="mb-4" />
                        <p className="text-sm font-bold">No activity detected yet.</p>
                    </div>
                ) : (
                    logs.map((log, idx) => {
                        const style = getActionIcon(log.action);
                        return (
                            <motion.div
                                key={log.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="flex gap-4 group"
                            >
                                <div className="flex flex-col items-center">
                                    <div className={`p-2.5 rounded-xl ${style.color} shadow-sm group-hover:scale-110 transition-transform`}>
                                        {style.icon}
                                    </div>
                                    {idx !== logs.length - 1 && <div className="w-0.5 h-full bg-gray-100 mt-2 rounded-full"></div>}
                                </div>

                                <div className="pb-6 flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-sm font-black text-gray-800 group-hover:text-emerald-600 transition-colors">
                                            {log.action.replace(/_/g, ' ').toUpperCase()}
                                        </p>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded-md">
                                            {style.label}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-[200px] truncate">
                                        {log.entity_type} ID: {log.entity_id} • Target modification
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-2 text-[10px] text-gray-400 font-bold">
                                        <Clock size={10} />
                                        {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
                <button
                    onClick={() => window.location.href = '/dashboard/audit'}
                    className="w-full py-3 bg-gray-50 hover:bg-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 transition-all hover:text-indigo-600"
                >
                    View Comprehensive Audit Log
                </button>
            </div>
        </GlassCard>
    );
};

export default AuditLogTable;
