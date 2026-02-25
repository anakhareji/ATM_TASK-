import React from 'react';

const FeatureIcon = ({ icon, title, description, delay = 0 }) => {
    return (
        <div
            className="flex flex-col items-center text-center group p-6 rounded-2xl transition-all duration-300 hover:bg-white hover:shadow-xl"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                <span className="text-3xl">{icon}</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-emerald-700 transition-colors">
                {title}
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                {description}
            </p>
        </div>
    );
};

export default FeatureIcon;
