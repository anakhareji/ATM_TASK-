import React from 'react';

const Card = ({ children, className = '', hover = true, glass = false, ...props }) => {
    return (
        <div
            className={`
        relative overflow-hidden rounded-2xl
        ${glass
                    ? 'bg-white/80 backdrop-blur-md border border-white/60 shadow-lg'
                    : 'bg-white border border-gray-100 shadow-md'}
        ${hover
                    ? 'transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-emerald-100'
                    : ''}
        ${className}
      `}
            {...props}
        >
            {children}
        </div>
    );
};

export default Card;
