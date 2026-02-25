import React from 'react';
import GlassCard from '../ui/GlassCard';

const NotificationItem = ({ n, onRead, onViewAll }) => {
  return (
    <GlassCard className={`${!n.is_read ? 'bg-emerald-50 border-l-4 border-emerald-500' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className={`font-bold ${!n.is_read ? 'text-emerald-700' : 'text-gray-800'}`}>{n.title || 'Notification'}</h4>
          <p className="text-sm text-gray-600">{n.message}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
            {new Date(n.created_at).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          {!n.is_read && (
            <button onClick={onRead} className="px-3 py-1 rounded-lg border border-gray-200 text-xs font-bold hover:bg-gray-50">
              Mark Read
            </button>
          )}
          <button onClick={onViewAll} className="px-3 py-1 rounded-lg border border-gray-200 text-xs font-bold hover:bg-gray-50">
            View All
          </button>
        </div>
      </div>
    </GlassCard>
  );
};

export default NotificationItem;
