import React from 'react';
import GlassCard from '../ui/GlassCard';

const priorityMap = {
  High: { border: 'border-rose-500', pill: 'bg-rose-50 text-rose-700' },
  Medium: { border: 'border-amber-500', pill: 'bg-amber-50 text-amber-700' },
  Low: { border: 'border-emerald-500', pill: 'bg-emerald-50 text-emerald-700' },
};

const DeadlineCard = ({ task }) => {
  const p = priorityMap[task.priority] || priorityMap.Medium;
  return (
    <GlassCard className={`flex items-center justify-between gap-4 border-l-4 ${p.border}`}>
      <div className="flex items-center gap-3">
        <div>
          <h4 className="font-bold text-gray-800">{task.title}</h4>
          <p className="text-sm text-gray-500">Project #{task.project_id}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{task.countdown}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${p.pill}`}>{task.priority}</span>
        <span className="px-3 py-1 rounded-full bg-gray-50 border border-gray-200 text-gray-700 text-[10px] font-black">{new Date(task.deadline).toLocaleDateString()}</span>
      </div>
    </GlassCard>
  );
};

export default DeadlineCard;
