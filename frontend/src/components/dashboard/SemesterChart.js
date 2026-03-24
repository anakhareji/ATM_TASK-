import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import ChartContainer from '../ui/ChartContainer';
import axios from '../../api/axios';

const SemesterChart = () => {
    const [data, setData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('/analytics/performance/students');
                const rawData = Array.isArray(response.data) ? response.data : [];
                
                // Aggregate average processing per student or map differently if needed
                // Since students dont inherently have a "semester" in their analytics object right now,
                // We will map the average System Score (ATM) metrics to show overall class balance:
                // Let's create a radar or generic bar chart since "semester" data is stripped.
                // We'll map the population's core skills: Quality, Timeliness, Completion.
                let t_qual = 0, t_time = 0, t_comp = 0, total = rawData.length || 1;
                rawData.forEach(s => {
                    t_qual += s.quality_score;
                    t_time += s.timeliness_score;
                    t_comp += s.completion_score;
                });
                
                const processed = [
                    { semester: 'Task Quality', average: Math.round(t_qual / total) },
                    { semester: 'Timeliness', average: Math.round((t_time / total) * (60/20)) }, // normalized to 60 scale visually
                    { semester: 'Completion Drive', average: Math.round((t_comp / total) * (60/20)) }
                ];
                
                setData(processed);
            } catch (error) {
                console.error("Error fetching semester data:", error);
                setData([]);
            }
        };
        fetchData();
    }, []);

    return (
        <ChartContainer title="Metric Averages Across Operatives">
            <div className="w-full h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 0, bottom: 25 }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis
                        dataKey="semester"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                    />
                    <Tooltip
                        cursor={{ fill: 'rgba(16, 185, 129, 0.08)', radius: 8 }}
                        contentStyle={{
                            backgroundColor: '#ffffff',
                            borderRadius: '12px',
                            border: '1px solid #E5E7EB',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            color: '#111827'
                        }}
                        itemStyle={{ color: '#111827' }}
                    />
                    <Bar dataKey="average" radius={[6, 6, 0, 0]} barSize={40}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill="url(#colorGradient)" />
                        ))}
                    </Bar>
                    <defs>
                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} /> {/* Emerald-500 */}
                            <stop offset="95%" stopColor="#14B8A6" stopOpacity={0.3} /> {/* Teal-500 */}
                        </linearGradient>
                    </defs>
                </BarChart>
            </ResponsiveContainer>
            </div>
        </ChartContainer>
    );
};

export default SemesterChart;
