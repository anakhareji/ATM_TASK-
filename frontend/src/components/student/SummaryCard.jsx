import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../ui/GlassCard';

const colorMap = {
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  teal: { bg: 'bg-teal-50', text: 'text-teal-600' },
  cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
};

const SummaryCard = ({ icon, title, items, accent = 'emerald' }) => {
  const c = colorMap[accent] || colorMap.emerald;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <GlassCard className="group hover:shadow-md transition-all rounded-2xl">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl ${c.bg} ${c.text}`}>
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest">{title}</h3>
            <div className="mt-3 space-y-2">
              {items.map((it, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 font-medium">{it.label}</span>
                  <span className={`text-sm font-bold ${it.badgeColor || 'text-gray-800'}`}>{it.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default SummaryCard;
