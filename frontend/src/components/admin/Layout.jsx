import React, { useState } from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="h-screen w-screen bg-gray-50 overflow-hidden">
      <div className="flex h-full">
        <Sidebar isOpen={open} onClose={() => setOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0 ml-0 lg:ml-[280px]">
          <div className="h-16 bg-white border-b border-gray-100 shadow-sm flex items-center px-4">
            <button
              onClick={() => setOpen(true)}
              className="lg:hidden px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all duration-200"
            >
              Menu
            </button>
            <div className="ml-auto flex items-center gap-2">
              <div className="px-3 py-1 rounded-full bg-gray-50 border border-gray-200 text-xs font-bold">Admin</div>
            </div>
          </div>
          <main className="flex-1 overflow-y-auto">
            <div className="p-6 lg:p-8">
              <div className="max-w-7xl mx-auto">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
