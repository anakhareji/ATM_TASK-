import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import AdminGlassLayout from '../components/layout/AdminGlassLayout';
import AnimatedPage from '../components/layout/AnimatedPage';
import GradeChart from '../components/dashboard/GradeChart';
import SemesterChart from '../components/dashboard/SemesterChart';
import AuditLogTable from '../components/dashboard/AuditLogTable';
import DashboardGreeting from '../components/ui/DashboardGreeting';
import { staggerContainer, cardEntrance } from '../utils/motionVariants';
import API from '../api/axios';
import {
    Activity, Users, Folder, TrendingUp, AlertCircle,
    CheckCircle, ArrowUpRight, ArrowDownRight, Zap
} from 'lucide-react';
import {
    XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';
import Button from '../components/ui/Button';
import GlassCard from '../components/ui/GlassCard';
import Counter from '../components/ui/Counter';

const AdminDashboard = () => {
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

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

        const interval = setInterval(fetchStats, 60000);
        return () => clearInterval(interval);
    }, [fetchStats]);

    const kpi = stats?.kpi || {};
    const insights = useMemo(() => {
        const alerts = [];
        if (kpi.pending_approvals > 5) alerts.push({ type: 'critical', priority: 1, msg: `${kpi.pending_approvals} Identity protocols (Faculty/Student) pending activation.` });
        else if (kpi.pending_approvals > 0) alerts.push({ type: 'info', priority: 3, msg: `${kpi.pending_approvals} Pending admission & faculty integration requests.` });

        const subRate = parseFloat(kpi.submission_rate || 0);
        if (subRate < 30) alerts.push({ type: 'warning', priority: 2, msg: `Critical: Global submission rate is low (${kpi.submission_rate}).` });

        if (kpi.avg_score < 40) alerts.push({ type: 'warning', priority: 2, msg: `Academic Alert: Avg performance below 40%.` });

        if (alerts.length === 0) alerts.push({ type: 'healthy', priority: 4, msg: "All systems operating within normal parameters." });

        return alerts.sort((a, b) => a.priority - b.priority);
    }, [kpi]);

    if (loading) return (
        <AdminGlassLayout>
            <div className="p-8 space-y-8 animate-pulse">
                <div className="h-20 w-full bg-white/20 rounded-[2.5rem]"></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => <div key={i} className="h-36 bg-white/10 rounded-3xl" />)}
                </div>
                <div className="grid grid-cols-3 gap-8">
                    <div className="col-span-2 h-96 bg-white/10 rounded-3xl" />
                    <div className="h-96 bg-white/10 rounded-3xl" />
                </div>
            </div>
        </AdminGlassLayout>
    );

    return (
        <AdminGlassLayout>
            <AnimatedPage>
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="space-y-8 pb-12"
                >
                    <DashboardGreeting user={user} />

                    {/* KPI Analytics Suite */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <KPICard
                            title="Total Ecosystem"
                            value={kpi.users ?? 0}
                            growth={kpi.growth?.users}
                            subtext={`${kpi.faculty ?? 0} Faculty | ${kpi.students ?? 0} Students`}
                            icon={Users}
                            color="text-indigo-500"
                            bg="bg-indigo-500/10"
                        />
                        <KPICard
                            title="Project Velocity"
                            value={kpi.projects ?? 0}
                            growth={kpi.growth?.projects}
                            subtext="Live academic streams"
                            icon={Folder}
                            color="text-emerald-500"
                            bg="bg-emerald-500/10"
                        />
                        <KPICard
                            title="Submission Index"
                            value={kpi.submission_rate ?? '0%'}
                            growth={kpi.growth?.submissions}
                            subtext="Global task completion"
                            icon={Activity}
                            color="text-cyan-500"
                            bg="bg-cyan-500/10"
                        />
                        <KPICard
                            title="Performance Avg"
                            value={kpi.avg_score ?? 0}
                            growth={kpi.growth?.performance}
                            subtext="Measured platform score"
                            icon={TrendingUp}
                            color="text-purple-500"
                            bg="bg-purple-500/10"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Area Chart: System Activity */}
                        <GlassCard className="lg:col-span-2">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">System Activity Trend</h3>
                                    <p className="text-xs text-gray-400 font-medium">Real-time platform engagement metrics</p>
                                </div>
                                <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full">
                                    <Zap size={14} className="text-emerald-600 animate-pulse" />
                                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Live</span>
                                </div>
                            </div>
                            <div className="h-[320px] w-full">
                                {stats?.performance_trend ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={stats.performance_trend}>
                                            <defs>
                                                <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                            <RechartsTooltip
                                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="activity"
                                                stroke="#10b981"
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#colorActivity)"
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="score"
                                                stroke="#6366f1"
                                                strokeWidth={3}
                                                fill="transparent"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-400">
                                        No trend data available
                                    </div>
                                )}
                            </div>
                        </GlassCard>

                        {/* Smart Insights Panel */}
                        <div className="space-y-6">
                            <GlassCard className="h-full border-t-4 border-amber-400">
                                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                    <AlertCircle size={20} className="text-amber-500" />
                                    Smart Insights
                                </h3>
                                <div className="space-y-4">
                                    {insights.map((alert, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className={`p-4 rounded-2xl border flex gap-3 ${alert.type === 'critical' ? 'bg-red-50 border-red-100 text-red-700' :
                                                alert.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                                                    alert.type === 'healthy' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                                                        'bg-indigo-50 border-indigo-100 text-indigo-700'
                                                }`}
                                        >
                                            <div className="mt-0.5">
                                                {alert.type === 'critical' ? <AlertCircle size={18} /> :
                                                    alert.type === 'healthy' ? <CheckCircle size={18} /> : <Zap size={18} />}
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase font-black tracking-widest opacity-60 mb-1">{alert.type}</p>
                                                <p className="text-sm font-bold leading-snug">{alert.msg}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                                {kpi?.pending_approvals > 0 && (
                                    <div className="mt-8 pt-6 border-t border-gray-100">
                                        <Button
                                            className="w-full bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20"
                                            onClick={() => window.location.href = '/dashboard/approvals'}
                                        >
                                            Launch Approval Protocol
                                        </Button>
                                    </div>
                                )}
                            </GlassCard>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        <div className="space-y-8">
                            <GlassCard>
                                <h3 className="text-xl font-bold text-gray-800 mb-6">Performance Distribution</h3>
                                <GradeChart />
                            </GlassCard>
                            <GlassCard>
                                <h3 className="text-xl font-bold text-gray-800 mb-6">Cross-Semester Analytics</h3>
                                <SemesterChart />
                            </GlassCard>
                        </div>
                        <div className="h-full">
                            <AuditLogTable logs={stats?.recent_audits || []} />
                        </div>
                    </div>
                </motion.div>
            </AnimatedPage>
        </AdminGlassLayout>
    );
};

const KPICard = ({ title, value, growth, subtext, icon: Icon, color, bg }) => (
    <motion.div variants={cardEntrance} whileHover={{ y: -5 }} className="h-full">
        <GlassCard className="h-full flex flex-col justify-between py-6">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${bg} ${color}`}>
                    <Icon size={24} />
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black ${growth?.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                    }`}>
                    {growth?.startsWith('+') ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {growth}
                </div>
            </div>
            <div>
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">{title}</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-black text-gray-800">
                        <Counter value={value} />
                    </h3>
                </div>
                <p className="text-gray-500 text-xs font-medium mt-2">{subtext}</p>
            </div>
        </GlassCard>
    </motion.div>
);

export default AdminDashboard;
