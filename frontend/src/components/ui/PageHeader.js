import React from 'react';

/**
 * Standardized Page Header Component for Admin UI
 * Consistent header styling across all admin pages
 */
const PageHeader = ({
    title,
    subtitle,
    children, // For right-side actions (search, filters, buttons)
    className = ''
}) => {
    return (
        <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${className}`}>
            {/* Left side - Title and subtitle */}
            <div>
                <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
                {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
            </div>

            {/* Right side - Actions */}
            {children && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {children}
                </div>
            )}
        </div>
    );
};

export default PageHeader;
