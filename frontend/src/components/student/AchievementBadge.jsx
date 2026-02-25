import React from 'react';

const palette = {
  emerald: 'from-emerald-500 to-teal-500',
  teal: 'from-teal-500 to-cyan-500',
  rose: 'from-rose-500 to-pink-500',
  amber: 'from-amber-500 to-orange-500',
};

const AchievementBadge = ({ title, color = 'emerald' }) => {
  const grad = palette[color] || palette.emerald;
  return (
    <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${grad} text-white text-[10px] font-black uppercase tracking-widest shadow-sm`}>
      {title}
    </div>
  );
};

export default AchievementBadge;
