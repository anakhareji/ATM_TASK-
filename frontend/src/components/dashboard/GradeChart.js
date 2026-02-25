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
                const response = await axios.get('/performance/grade-distribution');
                // Ensure dict is an object
                const dict = response.data && typeof response.data === 'object' ? response.data : {};

                // Map to Recharts format and filter out 0 values if needed for better display
                // or just keep them but ensure they are numbers
                const processed = Object.entries(dict).map(([name, value]) => ({
                    name: String(name),
                    value: Number(value) || 0
                }));

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
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="rgba(0,0,0,0)" // Remove stroke
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
            {data.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-sm text-gray-500">No grade data available</p>
                </div>
            )}
        </ChartContainer>
    );
};

export default GradeChart;
