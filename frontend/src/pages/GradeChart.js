import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Award, AlertCircle, FileText } from 'lucide-react';
import API from '../api/axios';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import PerformanceChart from '../components/student/PerformanceChart';
import { staggerContainer, cardEntrance } from '../utils/motionVariants';

const GradeChart = () => {
  const [performances, setPerformances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const response = await API.get('/performance/me');
        setPerformances(response.data);
      } catch (err) {
        console.error("Grades Error:", err);
        setError("Failed to load your performance history");
      } finally {
        setLoading(false);
      }
    };
    fetchGrades();
  }, []);

  const chartData = useMemo(() => {
    // Sort oldest to newest for the chart timeline
    return [...performances].reverse().map(p => ({
      semester: p.semester || 'Current',
      final_score: p.final_score
    }));
  }, [performances]);

  const currentGrade = performances.length > 0 ? performances[0].grade : '—';
  const currentScore = performances.length > 0 ? performances[0].final_score : 0;

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-8 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600">
            My Grades & Performance
            <Button 
                onClick={async () => {
                   await API.post('/performance/seed');
                   window.location.reload();
                }} 
                className="ml-4 text-xs bg-emerald-100 text-emerald-700 py-1 px-3 hover:bg-emerald-200"
            >
                Add Mock Data
            </Button>
          </h1>
          <p className="text-gray-500 mt-1">Track your academic progress across all projects</p>
        </div>
        <div className="flex items-center gap-4">
          <GlassCard className="px-6 py-3 border-emerald-100 flex flex-col items-center">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Latest Score</span>
            <span className="text-2xl font-black text-emerald-600">{currentScore.toFixed(1)}</span>
          </GlassCard>
          <GlassCard className="px-6 py-3 border-teal-100 flex flex-col items-center">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Current Grade</span>
            <span className="text-2xl font-black text-teal-600">{currentGrade}</span>
          </GlassCard>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
      ) : error ? (
        <GlassCard className="text-center py-16 text-rose-500 font-bold flex flex-col items-center">
          <AlertCircle size={48} className="text-rose-300 mb-4" />
          <p>{error}</p>
        </GlassCard>
      ) : performances.length === 0 ? (
        <GlassCard className="text-center py-16 text-gray-400 flex flex-col items-center">
          <FileText size={48} className="text-gray-300 mb-4" />
          <p className="text-lg font-semibold">No performance records yet</p>
          <p className="text-sm">Your grades will appear here once faculty complete your evaluations.</p>
        </GlassCard>
      ) : (
        <div className="space-y-8">
          <motion.div variants={cardEntrance} initial="hidden" animate="visible" className="h-80">
            <PerformanceChart data={chartData} />
          </motion.div>

          <motion.div variants={cardEntrance} initial="hidden" animate="visible" className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800 mt-8 mb-4">Detailed History</h3>
            <GlassCard className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="py-4 px-6 font-bold text-gray-600 text-sm uppercase tracking-wider">Date</th>
                      <th className="py-4 px-6 font-bold text-gray-600 text-sm uppercase tracking-wider">Semester</th>
                      <th className="py-4 px-6 font-bold text-gray-600 text-sm uppercase tracking-wider hidden md:table-cell">Metrics</th>
                      <th className="py-4 px-6 font-bold text-gray-600 text-sm uppercase tracking-wider text-center">Grade</th>
                      <th className="py-4 px-6 font-bold text-gray-600 text-sm uppercase tracking-wider text-right">Final Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50/80">
                    {performances.map((perf) => (
                      <tr key={perf.id} className="hover:bg-emerald-50/30 transition-colors">
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-800">
                            {new Date(perf.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold uppercase tracking-wider">
                            Sem {perf.semester || 'Current'}
                          </span>
                        </td>
                        <td className="py-4 px-6 hidden md:table-cell">
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 font-medium" title="Faculty Assessment Score">
                              Auth: <span className="font-bold text-gray-700">{perf.score}</span>
                            </span>
                            <span className="text-xs text-gray-500 font-medium" title="Automated System Score">
                              Sys: <span className="font-bold text-gray-700">{perf.system_score}</span>
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-block min-w-[3rem]
                            ${perf.grade === 'A+' || perf.grade === 'A' ? 'bg-emerald-100 text-emerald-700' : 
                              perf.grade === 'B+' || perf.grade === 'B' ? 'bg-blue-100 text-blue-700' : 
                              perf.grade === 'C' ? 'bg-amber-100 text-amber-700' : 
                              'bg-gray-100 text-gray-700'}`}
                          >
                            {perf.grade || '—'}
                          </span>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-right">
                          <span className="text-lg font-black text-emerald-600">
                            {perf.final_score ? perf.final_score.toFixed(1) : '—'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default GradeChart;
