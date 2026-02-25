import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import API from '../api/axios';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import SummaryCard from '../components/student/SummaryCard';
import DeadlineCard from '../components/student/DeadlineCard';
import PerformanceChart from '../components/student/PerformanceChart';
import FeedbackCard from '../components/student/FeedbackCard';
import NotificationItem from '../components/student/NotificationItem';
import AchievementBadge from '../components/student/AchievementBadge';
import DashboardGreeting from '../components/ui/DashboardGreeting';
import { staggerContainer, cardEntrance } from '../utils/motionVariants';
import { TrendingUp, Target, Clock, Award, Calendar } from 'lucide-react';

const StudentDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await API.get('/dashboard/student');
      setData(res.data);
    } catch (e) {
      setError('Failed to load student dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const performanceSeries = useMemo(() => {
    if (!data?.final_score) return [];
    return [{ semester: data.semester || 'Current', final_score: data.final_score }];
  }, [data]);

  if (loading) {
    return <div className="p-8 animate-pulse text-emerald-600 font-bold">Preparing your dashboard...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600 font-bold">{error}</div>;
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex-1 w-full">
          <DashboardGreeting user={user} />
          <div className="flex items-center gap-3 -mt-4 mb-4">
            <span className="px-3 py-1 rounded-full bg-gray-50 border border-gray-200 text-[10px] font-black uppercase tracking-widest">
              {data?.course_name || 'Academic Stream'}
            </span>
            <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest">
              SEM {data?.current_semester || data?.semester || '—'}
            </span>
            {data?.department_name && (
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest">
                {data.department_name}
              </span>
            )}
            <span className="px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-[10px] font-black uppercase tracking-widest">
              Progress {Math.round(data?.semester_progress || 0)}%
            </span>
          </div>
        </div>
        <div className="hidden md:block mb-8">
          <Button onClick={() => window.location.href = '/dashboard/my-tasks'}>Go to Tasks</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <SummaryCard
          icon={<Target size={22} />}
          title="Today's Focus"
          accent="emerald"
          items={[
            { label: 'Due Today', value: (data?.upcoming_tasks || []).filter(t => t.countdown === 'Due today').length, badgeColor: 'text-rose-600' },
            { label: 'Due This Week', value: (data?.upcoming_tasks || []).length },
            { label: 'Urgent', value: (data?.upcoming_tasks || []).filter(t => t.priority === 'High').length, badgeColor: 'text-rose-600' },
          ]}
        />
        <SummaryCard
          icon={<Clock size={22} />}
          title="To‑Do Overview"
          accent="teal"
          items={[
            { label: 'Total', value: data?.total_todos || 0 },
            { label: 'Completed', value: data?.completed_todos || 0 },
            { label: 'Overdue', value: data?.overdue_todos || 0, badgeColor: 'text-rose-600' },
          ]}
        />
        <SummaryCard
          icon={<Award size={22} />}
          title="Performance Snapshot"
          accent="cyan"
          items={[
            { label: 'Final Score', value: data?.final_score ?? '—' },
            { label: 'Grade', value: data?.grade ?? '—' },
            { label: 'Completion', value: `${Math.round(data?.completion_rate || 0)}%` },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={cardEntrance} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-800">Upcoming Deadlines</h3>
          </div>
          {(data?.upcoming_tasks || []).map(t => (
            <DeadlineCard key={t.id} task={t} />
          ))}
          {(data?.upcoming_tasks || []).length === 0 && (
            <GlassCard className="text-center py-16 text-gray-400">No upcoming tasks</GlassCard>
          )}
        </motion.div>
        <motion.div variants={cardEntrance}>
          <PerformanceChart data={performanceSeries} />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={cardEntrance} className="space-y-3">
          <h3 className="text-lg font-bold text-gray-800">Recent Feedback</h3>
          {(data?.recent_feedback || []).map((f, idx) => (
            <FeedbackCard key={idx} item={f} />
          ))}
          {(data?.recent_feedback || []).length === 0 && (
            <GlassCard className="text-center py-16 text-gray-400">No feedback yet</GlassCard>
          )}
        </motion.div>
        <motion.div variants={cardEntrance} className="space-y-3">
          <h3 className="text-lg font-bold text-gray-800">My Groups Activity</h3>
          {(data?.group_activity || []).map((g, idx) => (
            <GlassCard key={idx} className="group hover:shadow-md transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-gray-800">{g.group_name}</p>
                  <p className="text-sm text-gray-500">Members {g.member_count}</p>
                </div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Updates</div>
              </div>
              <div className="mt-3 space-y-2">
                {(g.recent_updates || []).map((u, i) => (
                  <div key={i} className="flex items-center justify-between text-sm text-gray-600">
                    <span>Task #{u.task_id}</span>
                    <span className="text-[10px] font-bold uppercase">{u.status}</span>
                  </div>
                ))}
                {(g.recent_updates || []).length === 0 && <p className="text-xs text-gray-400 italic">No recent updates</p>}
              </div>
            </GlassCard>
          ))}
          {(data?.group_activity || []).length === 0 && (
            <GlassCard className="text-center py-16 text-gray-400">No group activity</GlassCard>
          )}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={cardEntrance} className="space-y-3">
          <h3 className="text-lg font-bold text-gray-800">Notifications</h3>
          {(data?.notifications || []).slice(0, 3).map((n) => (
            <NotificationItem
              key={n.id}
              n={n}
              onRead={async () => {
                try { await API.patch(`/notifications/${n.id}/read`); fetchData(); } catch { }
              }}
              onViewAll={() => window.location.href = '/dashboard/notifications'}
            />
          ))}
          {(data?.notifications || []).length === 0 && (
            <GlassCard className="text-center py-12 text-gray-400">No notifications</GlassCard>
          )}
        </motion.div>
        <motion.div variants={cardEntrance} className="lg:col-span-2">
          <GlassCard className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Achievements</h3>
              <p className="text-sm text-gray-500">Keep up your streaks and performance</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {(data?.achievements || []).map((a, idx) => (
                <AchievementBadge key={idx} title={a.title} color={a.badge} />
              ))}
              {(data?.achievements || []).length === 0 && (
                <AchievementBadge title="Getting Started" color="amber" />
              )}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default StudentDashboard;
