import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { CheckCircle2, Clock, MoreHorizontal, User, Calendar } from 'lucide-react';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pendingEvents, setPendingEvents] = useState(0);

    const fetchStats = useCallback(async () => {
        try {
            const res = await API.get('/admin/dashboard-stats');
            setStats(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));
        fetchStats();
    }, [fetchStats]);

    if (loading) return (
            <div className="p-8 space-y-8 animate-pulse bg-surface min-h-screen">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[...Array(3)].map((_, i) => <div key={i} className="h-48 bg-white rounded-[32px]" />)}
                </div>
                <div className="h-96 bg-white rounded-[32px]" />
            </div>
    );

    const kpi = stats?.kpi || {};

    return (
            <div className="space-y-8 pb-12 font-sans overflow-x-hidden">
                {/* Dashboard content */}
            {/* Row 1: Top Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Task Finished */}
                <div className="lg:col-span-3 stat-card flex flex-col justify-between h-48 group">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-primary/5 rounded-2xl group-hover:bg-primary/10 transition-colors">
                            <CheckCircle2 size={24} className="text-primary" />
                        </div>
                        <button className="text-secondary-muted hover:text-secondary">
                            <MoreHorizontal size={20} />
                        </button>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-secondary-muted mb-1">Task Finished</p>
                        <div className="flex items-baseline gap-2">
                             <h3 className="text-4xl font-black text-secondary">08</h3>
                             <p className="text-sm font-bold text-secondary-muted">/ 15</p>
                        </div>
                    </div>
                </div>

                {/* Tracked Time */}
                <div className="lg:col-span-3 stat-card flex flex-col justify-between h-48 group">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-[#e2f0ff] rounded-2xl group-hover:bg-[#d0e6ff] transition-colors">
                            <Clock size={24} className="text-[#3b82f6]" />
                        </div>
                        <button className="text-secondary-muted hover:text-secondary">
                            <MoreHorizontal size={20} />
                        </button>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-secondary-muted mb-1">Tracked Time</p>
                        <h3 className="text-4xl font-black text-secondary">31<span className="text-2xl ml-1 text-secondary-muted">h</span> 45<span className="text-2xl ml-1 text-secondary-muted">m</span></h3>
                    </div>
                </div>

                {/* Task Overview */}
                <div className="lg:col-span-6 stat-card h-48 flex flex-col justify-between group">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-black text-secondary">Task Overview</h3>
                        <button className="text-secondary-muted hover:text-secondary">
                            <MoreHorizontal size={20} />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs font-bold text-secondary-muted">
                                <span>Complete</span>
                                <span>75%</span>
                            </div>
                            <div className="progress-bar-container"><div className="progress-bar-fill w-[75%]" /></div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs font-bold text-secondary-muted">
                                <span>In Progress</span>
                                <span>50%</span>
                            </div>
                            <div className="progress-bar-container"><div className="progress-bar-fill w-[50%] bg-[#3b82f6]" /></div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs font-bold text-secondary-muted">
                                <span>Not Start</span>
                                <span>40%</span>
                            </div>
                            <div className="progress-bar-container"><div className="progress-bar-fill w-[40%] bg-emerald-500" /></div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs font-bold text-secondary-muted">
                                <span>Delayed</span>
                                <span>10%</span>
                            </div>
                            <div className="progress-bar-container"><div className="progress-bar-fill w-[10%] bg-amber-500" /></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 2: All Tasks & Progress */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* All Tasks Table */}
                <div className="lg:col-span-8 bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-8 flex justify-between items-center border-b border-gray-50">
                        <h3 className="text-xl font-black text-secondary tracking-tight">All Tasks</h3>
                        <div className="flex gap-2">
                             <button className="px-4 py-2 text-xs font-bold bg-gray-50 text-secondary-muted rounded-xl hover:bg-gray-100 transition-colors">Weekly</button>
                             <button className="px-4 py-2 text-xs font-bold bg-primary/10 text-primary rounded-xl transition-colors">Monthly</button>
                        </div>
                    </div>
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-[#FBFCFD]">
                                <tr>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-secondary-muted">Project Name</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-secondary-muted">Manager</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-secondary-muted">Deadline</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-secondary-muted">Status</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-secondary-muted">Progress</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 font-bold text-sm">
                                {[
                                    { name: 'Redesign Web App', manager: 'Alice Johnson', date: '21 Mar 2026', status: 'Running', progress: '75%', color: 'primary' },
                                    { name: 'Database Optimization', manager: 'Bob Smith', date: '25 Mar 2026', status: 'Pending', progress: '40%', color: 'amber-500' },
                                    { name: 'Mobile App Setup', manager: 'Charlie Brown', date: '28 Mar 2026', status: 'Running', progress: '30%', color: 'blue-500' },
                                    { name: 'API Documentation', manager: 'David Miller', date: '01 Apr 2026', status: 'Complete', progress: '100%', color: 'emerald-500' },
                                ].map((task, i) => (
                                    <tr key={i} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-8 py-5 text-secondary">{task.name}</td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200"><User size={14} className="text-gray-400" /></div>
                                                <span className="text-secondary-muted">{task.manager}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-secondary-muted">{task.date}</td>
                                        <td className="px-8 py-5">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                task.status === 'Running' ? 'bg-primary/10 text-primary' : 
                                                task.status === 'Complete' ? 'bg-emerald-100 text-emerald-600' : 
                                                'bg-amber-100 text-amber-600'
                                            }`}>
                                                {task.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className={`h-full bg-primary rounded-full`} style={{ width: task.progress, backgroundColor: task.color === 'primary' ? 'var(--color-primary)' : task.color }} />
                                                </div>
                                                <span className="text-xs text-secondary-muted min-w-[30px]">{task.progress}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Progress Mini Cards */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="stat-card flex flex-col items-center justify-center py-10">
                         <div className="relative w-40 h-40 mb-6">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="80" cy="80" r="70" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                                <circle cx="80" cy="80" r="70" fill="transparent" stroke="url(#gradient)" strokeWidth="12" strokeDasharray="440" strokeDashoffset="110" strokeLinecap="round" />
                                <defs>
                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#FF6767" />
                                        <stop offset="100%" stopColor="#FF8E8E" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-4xl font-black text-secondary">75%</span>
                                <span className="text-[10px] font-black text-secondary-muted uppercase tracking-widest mt-1">Progress</span>
                            </div>
                         </div>
                         <h4 className="text-xl font-black text-secondary">Weekly Progress</h4>
                         <p className="text-sm font-bold text-secondary-muted mt-2 text-center px-4">You have finished 10 tasks this week!</p>
                    </div>

                    <div className="stat-card bg-secondary text-white border-transparent">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="font-black tracking-tight">Running Task</h4>
                            <Clock size={20} className="text-primary" />
                        </div>
                        <div className="space-y-2">
                             <h2 className="text-4xl font-black">35</h2>
                             <p className="text-sm font-bold text-secondary-muted">Total tasks currently active</p>
                        </div>
                        <div className="mt-8 pt-8 border-t border-white/10 flex justify-between items-center text-xs font-black uppercase tracking-widest">
                            <span className="text-secondary-muted">Next Deadline</span>
                            <span className="text-primary">2 Hours Later</span>
                        </div>
                    </div>
                </div>
            </div>
            </div>
    );
};

export default AdminDashboard;
