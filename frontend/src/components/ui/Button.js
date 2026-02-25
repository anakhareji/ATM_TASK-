import React from 'react';

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    isLoading = false,
    ...props
}) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 ease-in-out active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:opacity-70 disabled:cursor-not-allowed rounded-lg';

    const variants = {
        primary: 'bg-emerald-600 hover:bg-emerald-700 text-white',

        secondary: 'border border-gray-300 text-gray-700 hover:bg-gray-100',

        outline: 'bg-transparent text-gray-700 border border-gray-300 hover:bg-gray-50',
        ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
        danger: 'border border-red-500 text-red-500 hover:bg-red-50'
    };

    const sizes = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-5 py-2.5 text-sm',
        lg: 'px-6 py-3 text-base',
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size]} ${className}`}
            disabled={isLoading}
            {...props}
        >
            {isLoading ? (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : null}
            <span>{children}</span>
        </button>
    );
};

export default Button;
