import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, Star, Search, Filter } from 'lucide-react';
import API from '../api/axios';
import GlassCard from '../components/ui/GlassCard';
import { staggerContainer, cardEntrance } from '../utils/motionVariants';

const Leaderboard = () => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await API.get('/performance/leaderboard?limit=20');
        setLeaders(response.data);
      } catch (err) {
        console.error("Leaderboard Error:", err);
        setError("Failed to load leaderboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const getRankIcon = (index) => {
    switch(index) {
      case 0: return <Trophy className="text-yellow-500" size={28} />;
      case 1: return <Medal className="text-gray-400" size={28} />;
      case 2: return <Medal className="text-amber-600" size={28} />;
      default: return <span className="text-gray-400 font-bold text-lg">#{index + 1}</span>;
    }
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-8 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600">
            Leaderboard
          </h1>
          <p className="text-gray-500 mt-1">Top performers across all academic streams</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
      ) : error ? (
        <GlassCard className="text-center py-16 text-rose-500 font-bold">
          {error}
        </GlassCard>
      ) : leaders.length === 0 ? (
        <GlassCard className="text-center py-16 text-gray-400 flex flex-col items-center">
          <Award size={48} className="text-gray-300 mb-4" />
          <p className="text-lg font-semibold">No rankings available yet</p>
          <p className="text-sm">Check back after performance evaluations are published.</p>
        </GlassCard>
      ) : (
        <motion.div variants={cardEntrance} initial="hidden" animate="visible" className="space-y-4">
          <GlassCard className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="py-4 px-6 font-bold text-gray-600 text-sm uppercase tracking-wider">Rank</th>
                    <th className="py-4 px-6 font-bold text-gray-600 text-sm uppercase tracking-wider">Student</th>
                    <th className="py-4 px-6 font-bold text-gray-600 text-sm uppercase tracking-wider hidden md:table-cell">Semester</th>
                    <th className="py-4 px-6 font-bold text-gray-600 text-sm uppercase tracking-wider text-center">Grade</th>
                    <th className="py-4 px-6 font-bold text-gray-600 text-sm uppercase tracking-wider text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50/80">
                  {leaders.map((student, index) => (
                    <tr 
                      key={student.student_id} 
                      className={`hover:bg-emerald-50/30 transition-colors ${index < 3 ? 'bg-amber-50/20' : ''}`}
                    >
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center justify-center w-8">
                          {getRankIcon(index)}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold
                            ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg shadow-yellow-500/30' : 
                              index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 shadow-lg shadow-gray-500/30' : 
                              index === 2 ? 'bg-gradient-to-br from-amber-500 to-orange-700 shadow-lg shadow-orange-500/30' : 
                              'bg-gradient-to-br from-emerald-500 to-teal-600'}`}
                          >
                            {student.student_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">{student.student_name}</p>
                            {index === 0 && <span className="text-xs font-bold text-yellow-600 uppercase tracking-wider">Top Scholar</span>}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap hidden md:table-cell">
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold uppercase tracking-wider">
                          Sem {student.semester || 'N/A'}
                        </span>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-block min-w-[3rem]
                          ${student.grade === 'A+' || student.grade === 'A' ? 'bg-emerald-100 text-emerald-700' : 
                            student.grade === 'B+' || student.grade === 'B' ? 'bg-blue-100 text-blue-700' : 
                            student.grade === 'C' ? 'bg-amber-100 text-amber-700' : 
                            'bg-gray-100 text-gray-700'}`}
                        >
                          {student.grade || '—'}
                        </span>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-lg font-black text-gray-800">{student.final_score.toFixed(1)}</span>
                          <Star className={`mb-1 ${index < 3 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} size={14} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Leaderboard;
