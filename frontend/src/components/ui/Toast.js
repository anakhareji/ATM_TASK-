import React from 'react';

const Toast = ({ open, type = 'success', message, onClose }) => {
  if (!open) return null;
  const styles =
    type === 'success'
      ? 'bg-emerald-600 text-white border border-emerald-500'
      : 'bg-red-600 text-white border border-red-500';
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className={`rounded-xl shadow-lg px-4 py-3 ${styles}`}>
        <div className="flex items-center gap-2">
          <span className="font-semibold">{type === 'success' ? 'Success' : 'Error'}</span>
          <span className="text-white/90">{message}</span>
          <button className="ml-4 underline" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default Toast;
