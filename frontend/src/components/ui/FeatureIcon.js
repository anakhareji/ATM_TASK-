import React from 'react';

const FeatureIcon = ({ icon, title, description, delay = 0 }) => {
    return (
        <div
            className="flex flex-col items-center text-center group p-6 rounded-none transition-all duration-300"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-blue-900 border border-slate-200 mb-6 transition-all duration-500 group-hover:bg-blue-900 group-hover:text-white group-hover:shadow-2xl group-hover:shadow-blue-900/20 group-hover:-translate-y-2">
                {icon}
            </div>
            <h3 className="text-xl font-serif font-bold text-slate-800 mb-4 transition-colors">
                {title}
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
                {description}
            </p>
        </div>
    );
};

export default FeatureIcon;
