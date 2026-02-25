import React from 'react';
import GlassCard from '../ui/GlassCard';

const FeedbackCard = ({ item }) => {
  return (
    <GlassCard className="group hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="font-bold text-gray-800">{item.title}</h4>
          <p className="text-sm text-gray-600">{item.feedback}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
            Faculty #{item.faculty_id} • {item.timestamp ? new Date(item.timestamp).toLocaleString() : ''}
          </p>
        </div>
      </div>
    </GlassCard>
  );
};

export default FeedbackCard;
