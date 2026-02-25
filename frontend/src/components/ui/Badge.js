import React from 'react';

/**
 * Standardized Badge Component for Admin UI
 * Consistent badge styling for status, roles, and categories
 */

const Badge = ({ children, variant = 'default', className = '' }) => {
    const variants = {
        // Status badges
        active: 'bg-green-100 text-green-600',
        inactive: 'bg-red-100 text-red-600',
        pending: 'bg-yellow-100 text-yellow-600',

        // Role badges
        student: 'bg-blue-100 text-blue-600',
        faculty: 'bg-emerald-100 text-emerald-600',
        admin: 'bg-purple-100 text-purple-600',

        // General badges
        default: 'bg-gray-100 text-gray-600',
        primary: 'bg-emerald-100 text-emerald-600',
        success: 'bg-green-100 text-green-600',
        warning: 'bg-yellow-100 text-yellow-600',
        danger: 'bg-red-100 text-red-600',
        info: 'bg-blue-100 text-blue-600',
    };

    const baseClasses = 'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium';
    const variantClasses = variants[variant] || variants.default;

    return (
        <span className={`${baseClasses} ${variantClasses} ${className}`}>
            {children}
        </span>
    );
};

export default Badge;
