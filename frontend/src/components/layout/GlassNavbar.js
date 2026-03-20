import React, { useEffect, useState } from 'react';
import { Bell, Search, Menu, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';

const GlassNavbar = ({ isSidebarOpen, setIsOpen }) => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const currentDate = new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    useEffect(() => {
        const fetchUnread = async () => {
            try {
                const res = await API.get('/notifications/unread-count');
                setUnreadCount(res.data?.unread || 0);
            } catch { setUnreadCount(0); }
        };
        fetchUnread();
    }, []);

    return (
        <header className="h-20 px-8 flex items-center justify-between bg-surface border-b border-gray-100 relative z-30">
            {/* Left: Page Title */}
            <div className="flex items-center gap-4">
                <button onClick={() => setIsOpen(!isSidebarOpen)} className="p-2 rounded-xl bg-white border border-gray-100 text-secondary md:hidden shadow-sm transition-all active:scale-95">
                    <Menu size={20}/>
                </button>
                <h2 className="text-2xl font-black text-secondary tracking-tight hidden md:block">
                    Dashboard
                </h2>
            </div>

            {/* Center: Date */}
            <div className="absolute left-1/2 -translate-x-1/2 hidden lg:flex items-center gap-3 px-6 py-2 bg-white rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md cursor-default">
                <Calendar size={18} className="text-primary" />
                <span className="text-sm font-black text-secondary tracking-tight">{currentDate}</span>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative group hidden sm:block">
                    <input 
                        type="text" 
                        placeholder="Search your task here..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-64 bg-white border border-gray-200 rounded-2xl px-5 py-3 pl-12 text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all duration-300 text-secondary placeholder-secondary-muted"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-muted w-5 h-5 group-focus-within:text-primary transition-colors"/>
                </div>

                {/* Notifications */}
                <button 
                    onClick={() => navigate('/dashboard/notifications')}
                    className="relative p-3 rounded-2xl bg-white border border-gray-100 hover:border-primary/30 hover:bg-primary/5 transition-all group shadow-sm active:scale-95"
                >
                    <Bell className="w-6 h-6 text-secondary-muted group-hover:text-primary transition-colors"/>
                    {unreadCount > 0 && (
                        <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-primary rounded-full ring-2 ring-white animate-pulse" />
                    )}
                </button>
            </div>
        </header>
    );
};

export default GlassNavbar;
