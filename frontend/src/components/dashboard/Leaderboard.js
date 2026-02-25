import React, { useEffect, useState, useCallback } from 'react';
import { Trophy, Medal, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from '../../api/axios';
import GlassCard from '../ui/GlassCard';
import { tableRowVariants } from '../../utils/motionVariants';

const Leaderboard = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [minScore, setMinScore] = useState('');
    const [maxScore, setMaxScore] = useState('');

    const fetchLeaderboard = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (minScore !== '') params.min_score = parseFloat(minScore);
            if (maxScore !== '') params.max_score = parseFloat(maxScore);

            const response = await axios.get('/performance/leaderboard', { params });
            const rawData = Array.isArray(response.data) ? response.data : [];
            const processed = rawData.map(s => ({
                ...s,
                final_score: Number(s.final_score) || 0,
                student_name: s.student_name || `Student #${s.student_id}`
            }));
            setStudents(processed.slice(0, 5));
        } catch (error) {
            console.error("Error fetching leaderboard:", error);
            setStudents([]);
        } finally {
            setLoading(false);
        }
    }, [minScore, maxScore]);

    useEffect(() => {
        fetchLeaderboard();
    }, [fetchLeaderboard]);

    const getRankIcon = (index) => {
        if (index === 0) return <Trophy className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />;
        if (index === 1) return <Medal className="w-5 h-5 text-gray-300 drop-shadow-md" />;
        if (index === 2) return <Medal className="w-5 h-5 text-amber-600 drop-shadow-md" />;
        return <span className="font-bold text-emerald-200/50 text-sm w-5 text-center">{index + 1}</span>;
    };

    return (
        <GlassCard className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <span className="p-2 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-600">
                        <Trophy size={18} />
                    </span>
                    Top Performers
                </h3>
            </div>

            {/* Glass Filter Input */}
            <div className="flex gap-3 mb-6">
                <div className="relative flex-1">
                    <input
                        type="number"
                        placeholder="Min Score"
                        value={minScore}
                        onChange={(e) => setMinScore(e.target.value)}
                        className="w-full pl-3 pr-3 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-gray-800 placeholder-gray-400"
                    />
                </div>
                <div className="relative flex-1">
                    <input
                        type="number"
                        placeholder="Max Score"
                        value={maxScore}
                        onChange={(e) => setMaxScore(e.target.value)}
                        className="w-full pl-3 pr-3 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-gray-800 placeholder-gray-400"
                    />
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={fetchLeaderboard}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl shadow-sm hover:bg-emerald-700 transition-all flex items-center justify-center font-medium"
                >
                    <Filter className="w-4 h-4" />
                </motion.button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {loading ? (
                    <div className="space-y-3 animate-pulse">
                        {[1, 2, 3].map(i => <div key={i} className="h-14 bg-white rounded-xl border border-gray-200"></div>)}
                    </div>
                ) : students.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                        <Trophy size={32} className="text-gray-300 mb-2" />
                        <p className="text-sm font-bold text-gray-500">No Performers Found</p>
                        <p className="text-[10px] text-gray-400">Try adjusting the score filters.</p>
                    </div>
                ) : (
                    students.map((student, index) => (
                        <motion.div
                            key={index}
                            variants={tableRowVariants}
                            // 'initial' and 'animate' propagated from parent staggerContainer
                            className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-2xl hover:shadow-md transition-all shadow-sm group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-8 flex justify-center">
                                    {getRankIcon(index)}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800 text-sm group-hover:text-emerald-700 transition-colors">
                                        {student.student_name || `Student #${student.student_id}`}
                                    </p>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${student.grade === 'A' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                        student.grade === 'B' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-gray-50 text-gray-700 border border-gray-200'
                                        }`}>
                                        Grade {student.grade}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="font-black text-lg text-emerald-600">{student.final_score}</span>
                                <p className="text-[10px] text-gray-400 uppercase font-bold">Score</p>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </GlassCard>
    );
};

export default Leaderboard;
