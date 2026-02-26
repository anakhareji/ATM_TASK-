import React from 'react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import ChartContainer from '../ui/ChartContainer';

const PerformanceChart = ({ data = [] }) => {
  // If there's only one data point, the line chart renders empty or just a tiny dot.
  // We duplicate it to create a flat line for visual weight.
  const chartData = data.length === 1 
    ? [{ semester: 'Previous', final_score: data[0].final_score }, data[0]]
    : data;

  return (
    <ChartContainer title="Semester Performance">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid stroke="#F3F4F6" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="semester" tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
          <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', boxShadow: 'none' }} />
          <Line 
            type="monotone" 
            dataKey="final_score" 
            stroke="#10B981" 
            strokeWidth={3} 
            dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }} 
            activeDot={{ r: 6, fill: '#10B981', strokeWidth: 0 }} 
            isAnimationActive={data.length > 1}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default PerformanceChart;
