import React from 'react';
import GlassCard from './GlassCard';

const ChartContainer = ({ title, children, className = '' }) => {
    return (
        <GlassCard
            className={`h-96 flex flex-col relative overflow-hidden group ${className}`}
            hoverEffect={true}
        >
            {title && (
                <div className="flex items-center justify-between mb-6 relative z-10">
                    <h3 className="text-lg font-bold text-gray-800 tracking-wide flex items-center gap-2">
                        <span className="w-1 h-6 bg-emerald-500 rounded-full"></span>
                        {title}
                    </h3>
                </div>
            )}
            <div className="flex-1 min-h-0 w-full relative z-10">
                {children}
            </div>
        </GlassCard>
    );
};

export default ChartContainer;
