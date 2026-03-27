import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import axios from '../../api/axios';
import ChartContainer from '../ui/ChartContainer';

const COLORS = ['#10B981', '#14B8A6', '#F59E0B', '#EF4444', '#6B7280']; // Emerald, Teal, Amber, Red, Gray

const GradeChart = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('/analytics/performance/students');
                const students = Array.isArray(response.data) ? response.data : [];
                
                const buckets = { "90-100% (A+)": 0, "80-89% (A)": 0, "70-79% (B)": 0, "<70% (C/D)": 0 };
                students.forEach(s => {
                    if (s.atm_score >= 90) buckets["90-100% (A+)"]++;
                    else if (s.atm_score >= 80) buckets["80-89% (A)"]++;
                    else if (s.atm_score >= 70) buckets["70-79% (B)"]++;
                    else buckets["<70% (C/D)"]++;
                });

                const processed = Object.entries(buckets)
                    .filter(([name, value]) => value > 0)
                    .map(([name, value]) => ({ name, value }));

                setData(processed);
            } catch (error) {
                console.error("Error fetching grade distribution:", error);
                setData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return <ChartContainer title="Grade Distribution" className="animate-pulse"></ChartContainer>;
    }

    return (
        <ChartContainer title="Grade Distribution">
            <div className="w-full h-[250px] relative">
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="name"
                        stroke="rgba(0,0,0,0)"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                        {data.length === 0 ? null : data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#ffffff',
                            borderRadius: '12px',
                            border: '1px solid #E5E7EB',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            color: '#111827'
                        }}
                        itemStyle={{ color: '#111827' }}
                    />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        wrapperStyle={{ paddingTop: '20px', opacity: 0.8 }}
                    />
                </PieChart>
            </ResponsiveContainer>
            </div>
            {data.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-sm text-gray-500">No grade data available</p>
                </div>
            )}
        </ChartContainer>
    );
};

export default GradeChart;
