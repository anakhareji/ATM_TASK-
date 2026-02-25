import React from 'react';

/**
 * Standardized Card Component for Admin UI
 * Consistent styling across all admin pages
 */
const StandardCard = ({ children, className = '', hover = false }) => {
    return (
        <div
            className={`
                bg-white rounded-2xl shadow-sm border border-gray-100 p-6
                ${hover ? 'hover:shadow-md transition-shadow duration-200' : ''}
                ${className}
            `}
        >
            {children}
        </div>
    );
};

export default StandardCard;
