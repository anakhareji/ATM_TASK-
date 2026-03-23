import React, { useState } from 'react';
import GlassSidebar from './GlassSidebar';
import GlassNavbar from './GlassNavbar';

const AppGlassLayout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="h-screen flex font-sans text-secondary overflow-hidden">
            {/* Mobile Drawer Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-secondary/20 backdrop-blur-sm md:hidden transition-opacity duration-300"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
            
            {/* Sidebar (Mobile & Desktop) */}
            <div
                className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-500 ease-in-out md:relative md:translate-x-0 ${
                    isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <GlassSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-full relative">
                {/* Navbar */}
                <GlassNavbar isSidebarOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
                
                {/* Main scrollable area */}
                <main className="flex-1 overflow-y-auto relative custom-scrollbar">
                    {/* Content */}
                    <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-10 transition-all duration-500">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AppGlassLayout;
