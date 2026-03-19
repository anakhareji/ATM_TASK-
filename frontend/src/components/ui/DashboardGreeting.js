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
            className="bg-[#ffece0] p-8 md:px-10 rounded-[2.5rem] mb-8 relative overflow-hidden"
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        Welcome back, {(user?.name || user?.username || 'Sarah').split(' ')[0]}!
                        <span className="text-3xl md:text-4xl">👋</span>
                    </h1>
                    <p className="text-gray-700 font-medium mt-2 text-base md:text-lg">
                        Let's make learning amazing today!
                    </p>
                </div>
            </div>
            
            {/* SVG Illustration Wrapper */}
            <div className="hidden md:block absolute right-0 bottom-0 top-0 w-1/3 opacity-80 pointer-events-none">
                <svg viewBox="0 0 400 200" className="w-full h-full object-cover object-right-bottom">
                    <circle cx="300" cy="100" r="80" fill="#ffb4a2" opacity="0.3"/>
                    <rect x="220" y="140" width="120" height="15" rx="7.5" fill="#f87171" opacity="0.4"/>
                    <rect x="240" y="125" width="80" height="15" rx="7.5" fill="#34d399" opacity="0.4"/>
                </svg>
            </div>
        </motion.div>
    );
};

export default DashboardGreeting;
