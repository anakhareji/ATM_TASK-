import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import AdminGlassLayout from '../components/layout/AdminGlassLayout';
import AnimatedPage from '../components/layout/AnimatedPage';
import GradeChart from '../components/dashboard/GradeChart';
import SemesterChart from '../components/dashboard/SemesterChart';
import AuditLogTable from '../components/dashboard/AuditLogTable';
import DashboardGreeting from '../components/ui/DashboardGreeting';
import { staggerContainer } from '../utils/motionVariants';
import API from '../api/axios';
import GlassCard from '../components/ui/GlassCard';
import StatCards from '../components/dashboard/StatCards';
import EngagementChart from '../components/dashboard/EngagementChart';
import InsightsList from '../components/dashboard/InsightsList';

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

        // Fetch pending event requests
        API.get('/events')
            .then(res => {
                const pending = (res.data || []).filter(e => e.status === 'pending').length;
                setPendingEvents(pending);
            })
            .catch(() => {});

        const interval = setInterval(() => {
            fetchStats();
            API.get('/events').then(res => {
                const pending = (res.data || []).filter(e => e.status === 'pending').length;
                setPendingEvents(pending);
            }).catch(() => {});
        }, 60000);
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

        // Pending event requests
        if (pendingEvents > 0) alerts.push({
            type: 'event',
            priority: 2,
            msg: `${pendingEvents} student event request${pendingEvents > 1 ? 's' : ''} awaiting your approval.`,
            link: '/dashboard/campus-pulse'
        });

        if (alerts.length === 0) alerts.push({ type: 'healthy', priority: 4, msg: "All systems operating within normal parameters." });

        return alerts.sort((a, b) => a.priority - b.priority);
    }, [kpi, pendingEvents]);

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

                    {/* Main Dashboard Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 xl:gap-8">
                        {/* Left Column: Stat Cards */}
                        <div className="lg:col-span-1">
                            <StatCards kpi={kpi} />
                        </div>

                        {/* Right Column: Chart and Insights */}
                        <div className="lg:col-span-2 flex flex-col gap-6 xl:gap-8">
                            <EngagementChart stats={stats} />
                            <InsightsList insights={insights} kpi={kpi} navigate={navigate} />
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



export default AdminDashboard;
