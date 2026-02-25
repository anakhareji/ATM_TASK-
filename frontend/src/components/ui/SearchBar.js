import React from 'react';

const SearchBar = ({ placeholder = "What do you want to learn today?", onSearch }) => {
    return (
        <div className="relative max-w-2xl mx-auto w-full group">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative flex items-center bg-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-2 transition-shadow duration-300 group-hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100">
                <div className="pl-6 text-emerald-500">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input
                    type="text"
                    placeholder={placeholder}
                    className="w-full px-4 py-3 bg-transparent text-gray-700 placeholder-gray-400 focus:outline-none font-medium"
                />
                <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-full font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105">
                    Search
                </button>
            </div>
        </div>
    );
};

export default SearchBar;
