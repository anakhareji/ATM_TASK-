import React, { useEffect, useState } from 'react';
import { Bell, Search, User, Menu, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';

const GlassNavbar = ({ isSidebarOpen, setIsOpen }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [recent, setRecent] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showMobileSearch, setShowMobileSearch] = useState(false);

    const navigate = useNavigate();
    const role = localStorage.getItem('userRole');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Debounced search
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.length > 1) {
                setIsSearching(true);
                try {
                    const res = await API.get(`/admin/search?q=${searchQuery}`);
                    setSearchResults(res.data);
                } catch {
                    setSearchResults([]);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const fetchUnread = async () => {
        try {
            const res = await API.get('/notifications/unread-count');
            setUnreadCount(res.data?.unread || 0);
        } catch { setUnreadCount(0); }
    };

    const fetchRecent = async () => {
        try {
            const res = await API.get('/notifications');
            setRecent((res.data || []).slice(0, 5));
        } catch { setRecent([]); }
    };

    useEffect(() => {
        if (role === 'admin') {
            fetchUnread();
            fetchRecent();
        }
    }, [role]);

    return (
        <motion.header
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="sticky top-0 z-50 h-20 px-4 md:px-8 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm"
        >
            <div className="flex items-center gap-4">
                <button onClick={() => setIsOpen(!isSidebarOpen)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 md:hidden transition-colors">
                    <Menu size={24} />
                </button>
                <div className="hidden md:block">
                    <h1 className="text-lg font-bold text-gray-800 tracking-tight">Academic Oversight</h1>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest leading-none">Management Console</p>
                </div>
            </div>

            <div className="flex-1 max-w-xl mx-8 relative hidden md:block">
                <div className="relative group">
                    <input
                        type="text"
                        placeholder="Search students, projects, or users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-100/50 border border-transparent rounded-2xl px-5 py-2.5 pl-12 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white focus:border-emerald-500/30 transition-all duration-300 text-gray-800 placeholder-gray-400"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 transition-colors group-focus-within:text-emerald-500" />
                    {isSearching && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <div className="w-4 h-4 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                        </div>
                    )}
                </div>

                {/* Search Results Dropdown */}
                <AnimatePresence>
                    {searchResults.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute mt-2 w-full bg-white border border-gray-100 rounded-2xl shadow-2xl p-2 overflow-hidden"
                        >
                            {searchResults.map((res, i) => (
                                <button
                                    key={i}
                                    onClick={() => { navigate(res.link); setSearchQuery(''); }}
                                    className="w-full flex items-center gap-4 p-3 hover:bg-emerald-50/50 rounded-xl transition-colors text-left group"
                                >
                                    <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-white transition-colors">
                                        {res.type === 'user' ? <User size={16} className="text-blue-500" /> : <Briefcase size={16} className="text-emerald-500" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">{res.title}</p>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{res.subtitle}</p>
                                    </div>
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative">
                    <button
                        className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-all duration-200 group active:scale-95"
                        onClick={() => setDropdownOpen((o) => !o)}
                    >
                        <Bell className="w-5 h-5 text-gray-500 group-hover:text-indigo-600 transition-colors" />
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2 min-w-[18px] h-4.5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-4 ring-white">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    <AnimatePresence>
                        {dropdownOpen && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="absolute right-0 mt-3 w-80 bg-white border border-gray-100 rounded-2xl shadow-2xl p-4 ring-1 ring-black/5"
                            >
                                <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-50">
                                    <p className="font-bold text-gray-800">Notifications</p>
                                    <button className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:text-indigo-800">Clear All</button>
                                </div>
                                <div className="space-y-3">
                                    {recent.length === 0 ? (
                                        <div className="py-8 text-center">
                                            <p className="text-xs text-gray-400">All caught up!</p>
                                        </div>
                                    ) : (
                                        recent.map((n) => (
                                            <div key={n.id} className="p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 cursor-pointer">
                                                <p className="text-xs text-gray-700 leading-relaxed mb-1">{n.message}</p>
                                                <p className="text-[10px] text-gray-400 font-medium">Recently</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="h-8 w-px bg-gray-200 mx-1 hidden sm:block"></div>

                <div className="flex items-center gap-3 pl-2 group cursor-pointer">
                    <div className="hidden sm:block text-right">
                        <p className="text-xs font-bold text-gray-800 leading-none mb-1 capitalize group-hover:text-emerald-600 transition-colors">{user.name || 'Admin User'}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">{role}</p>
                    </div>
                    <div className="relative">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-0.5 shadow-lg shadow-emerald-500/20 group-hover:rotate-6 transition-transform">
                            <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center font-bold text-emerald-600">
                                {user.name?.[0]?.toUpperCase() || 'A'}
                            </div>
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                    </div>
                </div>
            </div>
        </motion.header>
    );
};

export default GlassNavbar;
