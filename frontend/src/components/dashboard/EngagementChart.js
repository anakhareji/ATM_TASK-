import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from 'recharts';
import GlassCard from '../ui/GlassCard';

const EngagementChart = ({ stats }) => {
    return (
        <GlassCard className="w-full relative shadow-sm bg-white border-gray-100 px-6 py-6">
            <h3 className="text-lg font-black text-gray-900 mb-1">Learning Engagement Trends</h3>
            <div className="flex items-center gap-4 mb-6">
                <span className="flex items-center gap-1.5 text-xs text-gray-500 font-medium"><div className="w-2.5 h-2.5 rounded-full bg-[#f87171]"></div> Active learners</span>
                <span className="flex items-center gap-1.5 text-xs text-gray-500 font-medium"><div className="w-2.5 h-2.5 rounded-full bg-[#34d399]"></div> Completions</span>
                <span className="flex items-center gap-1.5 text-xs text-gray-500 font-medium"><div className="w-2.5 h-2.5 rounded-full bg-[#60a5fa]"></div> Session Duration</span>
            </div>
            <div className="h-[280px] w-full mt-4">
                {stats?.performance_trend ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stats.performance_trend} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                            <RechartsTooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                            <Line type="monotone" dataKey="activity" stroke="#f87171" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                            <Line type="monotone" dataKey="score" stroke="#34d399" strokeWidth={3} dot={false} />
                            <Line type="monotone" dataKey="dummy" stroke="#60a5fa" strokeWidth={3} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">No trend data available</div>
                )}
            </div>
        </GlassCard>
    );
};

export default EngagementChart;
