import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userRole, setUserRole] = useState('student'); // Default fallback

    useEffect(() => {
        const storedRole = localStorage.getItem('userRole') || 'student';
        setUserRole(storedRole);
    }, []);

    return (
        <div className="h-screen flex overflow-hidden bg-gray-50 font-sans">
            {/* Mobile Drawer + Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-gray-900/50 md:hidden transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
            <div
                className={`fixed inset-y-0 left-0 z-40 w-72 md:hidden transform transition-transform duration-300 bg-white border-r border-gray-100 ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <Sidebar role={userRole} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
            </div>

            {/* Desktop Sidebar */}
            <aside className="hidden md:block w-72 h-full border-r border-gray-100 bg-white">
                <Sidebar role={userRole} isOpen={false} setIsOpen={setSidebarOpen} />
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-between bg-white border-b border-gray-100 px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2">
                        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-1.5 rounded-lg text-white">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <span className="font-bold text-gray-800 tracking-tight">Academia</span>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 -mr-2 text-gray-500 hover:text-emerald-600 focus:outline-none transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto h-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
