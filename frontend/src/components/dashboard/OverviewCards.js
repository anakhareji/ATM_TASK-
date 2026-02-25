import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, UserCheck, Folder, Award, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from '../../api/axios';
import AnimatedStatCard from '../ui/AnimatedStatCard';
import { staggerContainer } from '../../utils/motionVariants';

const OverviewCards = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeStudents: 0,
        totalProjects: 0,
        averageScore: 0,
        totalPerformanceRecords: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axios.get('/dashboard/admin');
                const d = response.data;
                setStats({
                    totalUsers: d.total_users,
                    activeStudents: d.active_students,
                    totalFaculty: d.total_faculty,
                    totalProjects: d.total_projects,
                    totalTasks: d.total_tasks,
                    averageScore: d.average_final_score,
                    totalPerformanceRecords: d.total_performance_records
                });
            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
                // Fallback for demo if API fails
                setStats({
                    totalUsers: 1240,
                    activeStudents: 856,
                    totalFaculty: 120,
                    totalProjects: 432,
                    totalTasks: 980,
                    averageScore: 78,
                    totalPerformanceRecords: 156
                });
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const cards = [
        { title: 'Total Users', value: stats.totalUsers, icon: Users, color: 'bg-emerald-500 text-emerald-100', description: 'Manage all users', link: '/dashboard/users' },
        { title: 'Active Students', value: stats.activeStudents, icon: UserCheck, color: 'bg-teal-500 text-teal-100', description: 'Currently active', link: '/dashboard/users?role=student' },
        { title: 'Total Faculty', value: stats.totalFaculty, icon: Award, color: 'bg-emerald-500 text-emerald-100', description: 'Teaching staff', link: '/dashboard/users?role=faculty' },
        { title: 'Total Projects', value: stats.totalProjects, icon: Folder, color: 'bg-cyan-500 text-cyan-100', description: 'Submitted projects' },
        { title: 'Total Tasks', value: stats.totalTasks, icon: Activity, color: 'bg-lime-500 text-lime-100', description: 'Assigned tasks' },
        { title: 'Avg Final Score', value: stats.averageScore, icon: Award, color: 'bg-green-500 text-green-100', description: 'Across all semesters', link: '/dashboard/performance' },
    ];

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 shadow-md animate-pulse h-32 border border-gray-100"></div>
                ))}
            </div>
        );
    }

    return (
        <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-6 mb-8"
        >
            {cards.map((card, index) => (
                <div key={index} className="h-full">
                    {card.link ? (
                        <Link to={card.link}>
                            <AnimatedStatCard
                                index={index}
                                title={card.title}
                                value={card.value}
                                icon={card.icon}
                                color={card.color}
                                description={card.description}
                            />
                        </Link>
                    ) : (
                        <AnimatedStatCard
                            index={index}
                            title={card.title}
                            value={card.value}
                            icon={card.icon}
                            color={card.color}
                            description={card.description}
                        />
                    )}
                </div>
            ))}
        </motion.div>
    );
};

export default OverviewCards;
