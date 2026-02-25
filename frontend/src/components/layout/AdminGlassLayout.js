import React, { useState } from 'react';
import GlassSidebar from './GlassSidebar';
import GlassNavbar from './GlassNavbar';

const AdminGlassLayout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="h-screen flex flex-col bg-gray-50 font-sans text-gray-900">
            {/* Header */}
            <GlassNavbar isSidebarOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            {/* Content below header */}
            <div className="flex flex-1 overflow-hidden min-h-0">
                {/* Mobile Drawer + Overlay */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 z-30 bg-gray-900/50 md:hidden transition-opacity"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}
                <div
                    className={`fixed inset-y-0 left-0 z-40 w-72 md:hidden transform transition-transform duration-300 bg-white border-r border-gray-100 ${
                        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
                >
                    <GlassSidebar />
                </div>

                {/* Desktop Sidebar */}
                <aside className="hidden md:block w-72 h-full bg-white border-r border-gray-100 flex flex-col">
                    <GlassSidebar />
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto px-8 py-6 min-h-0">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminGlassLayout;
