import React from 'react';

const NeonCard = ({ children, className = '', hover = true, ...props }) => {
    return (
        <div
            className={`
        relative overflow-hidden rounded-2xl
        bg-[#0f172a]/70 backdrop-blur-xl 
        border border-fuchsia-500/30
        shadow-[0_0_30px_rgba(139,92,246,0.2)]
        ${hover
                    ? 'transition-all duration-300 ease-out hover:scale-105 hover:border-cyan-400 hover:shadow-[0_0_50px_rgba(34,211,238,0.4)]'
                    : ''}
        ${className}
      `}
            {...props}
        >
            {/* Decorative gradient line at top */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-fuchsia-500 to-transparent opacity-50"></div>

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
};

export default NeonCard;
