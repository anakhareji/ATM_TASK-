import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { getGreeting } from '../../utils/getGreeting';

const motivationalLines = [
    "Let's make today productive!",
    "Ready to guide your students?",
    "Keep pushing excellence!",
    "Another day to build brilliance!",
    "Innovation starts with a single step.",
    "Your hard work is shaping the future."
];

const DashboardGreeting = ({ user }) => {
    const randomLine = useMemo(() =>
        motivationalLines[Math.floor(Math.random() * motivationalLines.length)],
        []);

    if (!user) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="bg-gradient-to-r from-emerald-50 to-indigo-50 p-8 rounded-[2.5rem] shadow-sm border border-white/50 backdrop-blur-xl mb-8"
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black text-gray-800 tracking-tight">
                        {getGreeting(user.name || user.username || 'User')} 👋
                    </h1>
                    <p className="text-gray-500 font-medium mt-2 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        {randomLine}
                    </p>
                </div>
                <div className="hidden md:block">
                    <span className="px-5 py-2 bg-white/60 backdrop-blur-md border border-white rounded-full text-[10px] font-black uppercase tracking-widest text-gray-400 shadow-sm">
                        {user.role || 'Dashboard'} Access
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

export default DashboardGreeting;
