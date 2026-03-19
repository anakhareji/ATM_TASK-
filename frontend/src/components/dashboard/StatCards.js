import React from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, GraduationCap, Target } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import Counter from '../ui/Counter';
import { cardEntrance } from '../../utils/motionVariants';

const KPICard = ({ title, value, growth, subtext, icon: Icon, color, bg }) => (
    <motion.div variants={cardEntrance} whileHover={{ y: -2 }} className="w-full">
        <GlassCard className="flex items-center px-5 py-5 gap-4 shadow-sm border-gray-100 bg-white">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${bg} ${color}`}>
                <Icon size={20} strokeWidth={2.5}/>
            </div>
            <div className="flex-1">
                <p className="text-gray-800 text-xs font-medium mb-1">{title}</p>
                <div className="flex items-end gap-2">
                    <h3 className="text-2xl font-black text-gray-900 leading-none">
                        <Counter value={value} />
                    </h3>
                </div>
                {growth && (
                    <div className="text-[10px] mt-1 text-gray-400 font-medium">
                        <span className={`${growth.includes('-') || String(growth).startsWith('-') ? 'text-red-500' : 'text-emerald-500'} font-bold`}>{growth}</span> {subtext}
                    </div>
                )}
            </div>
        </GlassCard>
    </motion.div>
);

const StatCards = ({ kpi }) => {
    if (!kpi) return null;
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:flex lg:flex-col gap-5">
            <KPICard
                title="Total Active Learners"
                value={kpi.users ?? 0}
                growth={kpi.growth?.users || '+8% this month'}
                subtext="Active users"
                icon={Users}
                color="text-teal-600"
                bg="bg-teal-50"
            />
            <KPICard
                title="Completed Courses"
                value={kpi.projects ?? 0}
                growth={kpi.growth?.projects || '+12%'}
                subtext="Total completed"
                icon={GraduationCap}
                color="text-orange-600"
                bg="bg-orange-50"
            />
            <KPICard
                title="New Enrollments"
                value={kpi.pending_approvals ?? 0}
                growth="this week"
                subtext="Recent enrolls"
                icon={UserPlus}
                color="text-blue-600"
                bg="bg-blue-50"
            />
            <KPICard
                title="Avg. Assessment Score"
                value={kpi.avg_score ?? '91%'}
                growth={kpi.growth?.performance || '+3%'}
                subtext="Overall score"
                icon={Target}
                color="text-emerald-600"
                bg="bg-emerald-50"
            />
        </div>
    );
};

export default StatCards;
