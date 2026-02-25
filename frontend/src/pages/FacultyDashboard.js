import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, Briefcase, FileText, CheckCircle, Clock,
    TrendingUp, Activity, Plus, AlertTriangle, Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import API from '../api/axios';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import DashboardGreeting from '../components/ui/DashboardGreeting';
import { staggerContainer, cardEntrance } from '../utils/motionVariants';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const EmptyChartState = ({ message = "No data available for this period" }) => (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-gray-400">
        <Activity size={48} className="opacity-10 mb-4" />
        <p className="text-sm font-medium">{message}</p>
    </div>
);

const StatCard = ({ title, value, subtext, icon: Icon, color, trend }) => (
    <motion.div variants={cardEntrance}>
        <GlassCard className={`flex items-center gap-4 border-l-4 ${color} relative overflow-hidden`}>
            <div className={`p-3 rounded-2xl ${color.replace('border-', 'bg-').replace('-500', '-50')}`}>
                <Icon className={color.replace('border-', 'text-')} size={24} />
            </div>
            <div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">{title}</p>
                <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-black text-gray-800">{value}</p>
                    {trend && (
                        <span className={`text-xs font-bold ${trend > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {trend > 0 ? '▲' : '▼'} {Math.abs(trend)}%
                        </span>
                    )}
                </div>
                {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
            </div>
        </GlassCard>
    </motion.div>
);

const FacultyDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);

    // Raw Data States
    const [projects, setProjects] = useState([]);
    const [students, setStudents] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [grades, setGrades] = useState([]);

    const fetchDashboardData = async () => {
        try {
            const results = await Promise.allSettled([
                API.get('/projects/faculty'),
                API.get('/faculty/students/my-students'),
                API.get('/faculty/tasks'),
                API.get('/faculty/submissions'),
                API.get('/faculty/grades'),
                API.get('/dashboard/faculty')
            ]);
            const [projectsRes, studentsRes, tasksRes, submissionsRes, gradesRes, aggRes] = results;

            if (projectsRes.status === 'fulfilled') setProjects(projectsRes.value.data || []);
            if (studentsRes.status === 'fulfilled') setStudents(studentsRes.value.data || []);
            if (tasksRes.status === 'fulfilled') setTasks(tasksRes.value.data || []);
            if (submissionsRes.status === 'fulfilled') setSubmissions(submissionsRes.value.data || []);
            if (gradesRes.status === 'fulfilled') setGrades(gradesRes.value.data || []);

            // Optional: aggregated counts available if needed

            const allFailed = results.every(r => r.status === 'rejected');
            if (allFailed) {
                setError("Failed to load dashboard analytics. Please try again.");
                toast.error("Cloud synchronization failed.");
            } else {
                setError("");
            }
        } catch (err) {
            console.error("Dashboard Sync Failed:", err);
            setError("Failed to load dashboard analytics. Please try again.");
            toast.error("Cloud synchronization failed.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));

        fetchDashboardData();

        const interval = setInterval(() => {
            fetchDashboardData();
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    // --- KPI ENGINE ---
    const kpi = useMemo(() => {
        const totalProjects = projects?.length ?? 0;
        const totalStudents = students?.length ?? 0;
        const totalTasks = tasks?.length ?? 0;

        const pendingReviews = submissions?.filter(
            s => s.status === "submitted"
        ).length ?? 0;

        const avgScore = grades?.length
            ? (
                grades.reduce((sum, g) => sum + (g.score || 0), 0) /
                grades.length
            ).toFixed(2)
            : 0;

        const submissionRate = tasks?.length
            ? (
                (submissions.length / tasks.length) * 100
            ).toFixed(1)
            : 0;

        return {
            projects: totalProjects,
            students: totalStudents,
            tasks: totalTasks,
            submissions: submissions?.length ?? 0,
            pending: pendingReviews,
            avgScore,
            submissionRate
        };
    }, [projects, students, tasks, submissions, grades]);

    // --- CHART DATA TRANSFORMATION ---
    const chartData = useMemo(() => {
        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        const taskTrend = last7Days.map(date => ({
            date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
            tasks: tasks.filter(t => t.created_at?.startsWith(date)).length
        }));

        const statusDist = [
            { name: 'Submitted', value: submissions.filter(s => s.status === 'submitted' || s.status === 'graded').length },
            { name: 'Pending', value: kpi.pending },
            { name: 'Missing', value: Math.max(0, kpi.tasks - submissions.length) }
        ];

        const gradeDist = [
            { grade: 'A', count: grades.filter(g => g.score >= 80).length },
            { grade: 'B', count: grades.filter(g => g.score >= 70 && g.score < 80).length },
            { grade: 'C', count: grades.filter(g => g.score >= 60 && g.score < 70).length },
            { grade: 'D', count: grades.filter(g => g.score >= 50 && g.score < 60).length },
            { grade: 'F', count: grades.filter(g => g.score < 50).length }
        ];

        return { taskTrend, statusDist, gradeDist };
    }, [tasks, submissions, kpi, grades]);

    // --- ACTIVITY ENGINE ---
    const derivedActivity = useMemo(() => {
        return [
            ...tasks.map(t => ({
                id: `task-${t.id}`,
                action: "Task Created",
                entity: t.title,
                time: t.created_at
            })),
            ...submissions.map(s => ({
                id: `sub-${s.id}`,
                action: "Submission Received",
                entity: `${s.student_name} - ${s.task_title}`,
                time: s.submitted_at
            }))
        ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);
    }, [tasks, submissions]);

    const insights = useMemo(() => {
        const alerts = [];

        if (kpi.pending > 5)
            alerts.push({
                type: "critical",
                msg: "You have more than 5 pending reviews."
            });

        if (kpi.avgScore < 40 && grades.length > 0)
            alerts.push({
                type: "warning",
                msg: "Class performance is below average."
            });

        return alerts;
    }, [kpi, grades]);

    if (loading) return (
        <div className="space-y-8 max-w-7xl mx-auto p-8 animate-pulse">
            <div className="flex justify-between items-end">
                <div className="space-y-3">
                    <div className="h-10 w-64 bg-gray-200 rounded-2xl"></div>
                    <div className="h-4 w-48 bg-gray-100 rounded-xl"></div>
                </div>
                <div className="flex gap-3">
                    <div className="h-12 w-32 bg-gray-200 rounded-xl"></div>
                    <div className="h-12 w-32 bg-gray-200 rounded-xl"></div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-32 bg-gray-100 rounded-[2rem]"></div>
                ))}
            </div>
            <div className="grid grid-cols-3 gap-8">
                <div className="col-span-2 h-[400px] bg-gray-50 rounded-[2.5rem]"></div>
                <div className="space-y-8">
                    <div className="h-[180px] bg-gray-50 rounded-[2rem]"></div>
                    <div className="h-[180px] bg-gray-50 rounded-[2rem]"></div>
                </div>
            </div>
        </div>
    );

    if (error) return (
        <div className="p-8 text-center">
            <p className="text-rose-500 font-bold mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry Connection</Button>
        </div>
    );

    const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1'];

    return (
        <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-8 max-w-7xl mx-auto pb-12"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <DashboardGreeting user={user} />
                <div className="flex gap-3 mb-8">
                    <Button
                        variant="secondary"
                        onClick={() => navigate('/dashboard/projects')}
                        icon={<Briefcase size={18} />}
                    >
                        My Projects
                    </Button>
                    <Button
                        icon={<Plus size={18} />}
                        onClick={() => navigate('/dashboard/tasks')}
                    >
                        New Task
                    </Button>
                </div>
            </div>

            {/* Smart Insights Panel */}
            {insights.length > 0 && (
                <motion.div variants={cardEntrance} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {insights.map((alert, idx) => (
                        <div key={idx} className={`p-4 rounded-xl border-l-4 shadow-sm flex items-center gap-3
                            ${alert.type === 'critical' ? 'bg-rose-50 border-rose-500 text-rose-700' :
                                alert.type === 'warning' ? 'bg-amber-50 border-amber-500 text-amber-700' :
                                    'bg-blue-50 border-blue-500 text-blue-700'}`}>
                            <AlertTriangle size={20} />
                            <span className="font-bold text-sm">{alert.msg}</span>
                        </div>
                    ))}
                </motion.div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Projects" value={kpi.projects} subtext="Active academic projects" icon={Briefcase} color="border-indigo-500" />
                <StatCard title="Active Students" value={kpi.students} subtext="Enrolled in your courses" icon={Users} color="border-emerald-500" />
                <StatCard title="Submission Rate" value={`${kpi.submissionRate}%`} subtext={`${submissions.length}/${kpi.tasks} Tasks Submitted`} icon={Activity} color="border-cyan-500" />
                <StatCard title="Avg Score" value={kpi.avgScore} subtext="Class performance average" icon={TrendingUp} color="border-purple-500" />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Main Inteactive Chart */}
                <GlassCard className="xl:col-span-2 min-h-[400px]">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <Activity size={20} className="text-emerald-600" />
                        Task Activity Trend
                    </h3>
                    {chartData.taskTrend.some(d => d.tasks > 0) ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData.taskTrend}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} />
                                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} />
                                <RechartsTooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Line type="monotone" dataKey="tasks" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyChartState message="No task activity in the last 7 days" />
                    )}
                </GlassCard>

                {/* Grade Distribution & Pie */}
                <div className="space-y-8">
                    <GlassCard>
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Submission Status</h3>
                        <div className="h-[200px] flex justify-center">
                            {submissions.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartData.statusDist}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {chartData.statusDist.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyChartState message="No submissions to track" />
                            )}
                        </div>
                    </GlassCard>

                    <GlassCard className="flex-1">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Grade Distribution</h3>
                        {grades.length > 0 ? (
                            <ResponsiveContainer width="100%" height={150}>
                                <BarChart data={chartData.gradeDist}>
                                    <XAxis dataKey="grade" axisLine={false} tickLine={false} />
                                    <RechartsTooltip cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <EmptyChartState message="No grades issued yet" />
                        )}
                    </GlassCard>
                </div>
            </div>

            {/* Timeline & Recent Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <GlassCard>
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <Clock size={20} className="text-emerald-600" />
                        Recent Activity Timeline
                    </h3>
                    <div className="space-y-6 relative pl-2">
                        <div className="absolute left-[19px] top-2 bottom-4 w-[2px] bg-gray-100"></div>

                        {derivedActivity.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">No recent activity detected</div>
                        ) : (
                            derivedActivity.map((item, idx) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="relative pl-8 flex flex-col gap-1"
                                >
                                    <div className="absolute left-[13px] top-1.5 w-3.5 h-3.5 rounded-full bg-white border-4 border-emerald-500 shadow-sm z-10"></div>
                                    <p className="text-sm font-bold text-gray-800">{item.action}</p>
                                    <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded w-fit">
                                        {item.entity}
                                    </span>
                                    <p className="text-[11px] text-gray-400">
                                        {formatDistanceToNow(new Date(item.time), { addSuffix: true })}
                                    </p>
                                </motion.div>
                            ))
                        )}
                    </div>
                </GlassCard>

                <GlassCard>
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <CheckCircle size={20} className="text-indigo-600" />
                        Pending Reviews
                    </h3>
                    {/* Logic to show pending reviews if specific data available, else fallback */}
                    <div className="space-y-4">
                        {submissions.filter(s => s.status === 'submitted').length > 0 ? (
                            <div className="space-y-3">
                                {submissions.filter(s => s.status === 'submitted').slice(0, 3).map((sub) => (
                                    <div key={sub.id} className="p-4 bg-gray-50 rounded-2xl flex justify-between items-center border border-gray-100 group hover:border-emerald-200 transition-all">
                                        <div>
                                            <p className="font-bold text-gray-800 leading-tight">{sub.student_name}</p>
                                            <p className="text-xs text-gray-400 mt-1">{sub.task_title}</p>
                                        </div>
                                        <Button
                                            size="sm"
                                            className="px-4 py-2"
                                            onClick={() => navigate(`/dashboard/submissions?task_id=${sub.task_id}`)}
                                        >
                                            Review
                                        </Button>
                                    </div>
                                ))}
                                {submissions.filter(s => s.status === 'submitted').length > 3 && (
                                    <p className="text-center text-xs text-gray-400 pt-2 font-bold uppercase tracking-widest cursor-pointer hover:text-emerald-500 transition-colors" onClick={() => navigate('/dashboard/submissions')}>
                                        + {submissions.filter(s => s.status === 'submitted').length - 3} more awaiting
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                                <CheckCircle size={48} className="mb-4 opacity-20" />
                                <p>All caught up! No pending reviews.</p>
                            </div>
                        )}
                    </div>
                </GlassCard>
            </div>
        </motion.div>
    );
};

export default FacultyDashboard;
