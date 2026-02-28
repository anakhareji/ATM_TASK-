import React, { useState } from 'react';
import GlassSidebar from './GlassSidebar';
import GlassNavbar from './GlassNavbar';

const AppGlassLayout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="h-screen flex flex-col bg-gray-50 font-sans text-gray-900 overflow-hidden">
            {/* Header */}
            <GlassNavbar isSidebarOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            {/* Content below header */}
            <div className="flex flex-1 overflow-hidden min-h-0 relative">
                {/* Mobile Drawer Overlay */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 z-30 bg-gray-900/40 backdrop-blur-sm md:hidden transition-opacity duration-300"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}
                
                {/* Mobile Sidebar */}
                <div
                    className={`fixed inset-y-0 left-0 z-40 w-72 md:hidden transform transition-transform duration-500 ease-in-out bg-white ${
                        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
                >
                    <GlassSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
                </div>

                {/* Desktop Sidebar */}
                <aside className="hidden md:block w-72 h-full bg-white flex flex-col shrink-0">
                    <GlassSidebar />
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto bg-[#fafafa] custom-scrollbar relative">
                    {/* Background decorative elements */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-teal-500/5 rounded-full blur-[100px] -z-10 pointer-events-none" />
                    
                    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-10">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AppGlassLayout;
