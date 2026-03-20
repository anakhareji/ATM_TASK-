import React, { useEffect, useState } from 'react'; 
import { Bell, Search, Menu, Calendar, X, User, Hash, Mail, Shield, Layers, BookOpen, GraduationCap, CalendarDays, ChevronRight, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import API from '../../api/axios';

// ─────────────────────────────────────────────
// Role colour helpers
// ─────────────────────────────────────────────
const ROLE_COLORS = {
  admin:   { bg: 'from-violet-500 to-purple-700',  badge: 'bg-violet-100 text-violet-700 border-violet-200' },
  faculty: { bg: 'from-blue-500   to-indigo-700',  badge: 'bg-blue-100   text-blue-700   border-blue-200'   },
  student: { bg: 'from-emerald-500 to-teal-600',   badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
};
const roleColors = (r) => ROLE_COLORS[(r||'').toLowerCase()] || ROLE_COLORS.student;

// ─────────────────────────────────────────────
// Profile Panel
// ─────────────────────────────────────────────
const ProfilePanel = ({ user, profile, onClose }) => {
  const navigate = useNavigate();
  const rc = roleColors(user.role);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const InfoRow = ({ icon: Icon, label, value, mono = false }) => {
    if (!value && value !== 0) return null;
    return (
      <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
        <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
          <Icon size={13} className="text-gray-500"/>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
          <p className={`text-sm font-bold text-gray-800 truncate ${mono ? 'font-mono text-xs' : ''}`}>{value}</p>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.93, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.93, y: 8 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="absolute right-0 mt-3 w-80 bg-white border border-gray-100 rounded-3xl shadow-2xl overflow-hidden z-50"
      style={{ top: '100%' }}
    >
      {/* Header banner */}
      <div className={`bg-gradient-to-br ${rc.bg} px-6 pt-6 pb-10 relative`}>
        <button onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors">
          <X size={13} className="text-white"/>
        </button>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/40 flex items-center justify-center text-white text-2xl font-black shadow-lg">
            {(user.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-black text-white leading-tight">{user.name || 'Unknown User'}</h3>
            <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border bg-white/20 text-white border-white/30`}>
              {user.role || 'user'}
            </span>
          </div>
        </div>
      </div>

      {/* Status chip — overlaps header */}
      <div className="px-6 -mt-5">
        <div className="flex items-center gap-2 bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-2.5">
          <div className={`w-2 h-2 rounded-full ${profile?.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`}/>
          <span className="text-xs font-black text-gray-600 uppercase tracking-widest">
            {profile?.status || 'active'}
          </span>
          {profile?.id && (
            <>
              <div className="mx-2 w-px h-4 bg-gray-200"/>
              <Hash size={11} className="text-gray-400"/>
              <span className="text-xs font-mono font-bold text-gray-500">UID-{profile.id}</span>
            </>
          )}
        </div>
      </div>

      {/* Info grid — role-aware */}
      <div className="px-6 py-4">
        <InfoRow icon={Mail}   label="Email" value={profile?.email || user.email}/>
        <InfoRow icon={Shield} label="Role"  value={(profile?.role || user.role || '').toUpperCase()}/>

        {/* Department — shown for all roles */}
        {profile?.department && <InfoRow icon={Layers} label="Department" value={profile.department}/>}

        {/* Faculty: no Batch / no Current Semester */}
        {(profile?.role || user.role || '').toLowerCase() === 'student' && (
          <>
            {profile?.program  && <InfoRow icon={BookOpen}      label="Program"          value={profile.program}/>}
            {profile?.course   && <InfoRow icon={GraduationCap} label="Course"           value={profile.course}/>}
            {profile?.batch    && <InfoRow icon={CalendarDays}  label="Batch"            value={profile.batch}/>}
            {profile?.current_semester != null && (
              <InfoRow icon={Layers} label="Current Semester" value={`Semester ${profile.current_semester}`}/>
            )}
          </>
        )}

        {profile?.joined && (
          <InfoRow icon={CalendarDays} label="Joined"
            value={new Date(profile.joined).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}/>
        )}
      </div>

      {/* Footer actions */}
      <div className="px-4 pb-4 space-y-2 border-t border-gray-50 pt-3">
        <button onClick={handleLogout}
          className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-all group">
          <div className="flex items-center gap-3">
            <LogOut size={16}/>
            <span className="text-sm font-black uppercase tracking-widest">Sign Out</span>
          </div>
          <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all"/>
        </button>
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────
// Main Navbar
// ─────────────────────────────────────────────
const GlassNavbar = ({ isSidebarOpen, setIsOpen }) => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const userRole = (localStorage.getItem('userRole') || 'student').toLowerCase();
    
    // Search filter logic
    const filteredSearch = searchQuery.trim() === '' ? [] : SEARCH_INDEX.filter(item => 
        item.roles.includes(userRole) && 
        (item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
         item.subtitle.toLowerCase().includes(searchQuery.toLowerCase()))
    ).slice(0, 5);

    const currentDate = new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    useEffect(() => {
        fetchUnread();
        fetchRecent();
        const poll = setInterval(fetchUnread, 30000);
        return () => clearInterval(poll);
    }, []);

    return (
        <motion.header
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="sticky top-0 z-50 h-20 px-4 md:px-8 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm"
        >
            {/* Left: Brand */}
            <div className="flex items-center gap-4">
                <button onClick={() => setIsOpen(!isSidebarOpen)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 md:hidden transition-colors">
                    <Menu size={24}/>
                </button>
                <div className="hidden md:block">
                    <h1 className="text-lg font-bold text-gray-800 tracking-tight">Academic Oversight</h1>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest leading-none">Management Console</p>
                </div>
            </div>

            {/* Center: Search */}
            <div className="flex-1 max-w-xl mx-8 relative hidden md:block">
                <div className="relative group">
                    <input type="text" placeholder="Search students, projects, or users..."
                        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-100/50 border border-transparent rounded-2xl px-5 py-2.5 pl-12 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white focus:border-emerald-500/30 transition-all duration-300 text-gray-800 placeholder-gray-400"/>
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-emerald-500 transition-colors"/>
                    {isSearching && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <div className="w-4 h-4 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"/>
                        </div>
                    )}
                </div>
                <AnimatePresence>
                    {searchResults.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                            className="absolute mt-2 w-full bg-white border border-gray-100 rounded-2xl shadow-2xl p-2 overflow-hidden">
                            {searchResults.map((res, i) => (
                                <button key={i} onClick={() => { navigate(res.link); setSearchQuery(''); }}
                                    className="w-full flex items-center gap-4 p-3 hover:bg-emerald-50/50 rounded-xl transition-colors text-left group">
                                    <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-white transition-colors">
                                        {res.type === 'user' ? <User size={16} className="text-blue-500"/> : <Briefcase size={16} className="text-emerald-500"/>}
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

            {/* Right: Actions */}
            <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative group hidden sm:block z-50">
                    <input 
                        type="text" 
                        placeholder="Search your task here..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                        className="w-64 bg-white border border-gray-100 rounded-2xl px-5 py-3 pl-12 text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all duration-300 text-secondary placeholder-secondary-muted"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-muted w-5 h-5 group-focus-within:text-primary transition-colors"/>
                    
                    {/* Search Dropdown */}
                    {isSearchFocused && searchQuery.trim() !== '' && (
                        <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden py-2 z-50">
                            {filteredSearch.length > 0 ? (
                                filteredSearch.map((result, idx) => (
                                    <div 
                                        key={idx}
                                        onClick={() => {
                                            navigate(result.path);
                                            setSearchQuery('');
                                            setIsSearchFocused(false);
                                        }}
                                        className="px-5 py-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between group transition-colors"
                                    >
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">{result.title}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{result.subtitle}</p>
                                        </div>
                                        <ChevronRight size={14} className="text-gray-300 group-hover:text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                    </div>
                                ))
                            ) : (
                                <div className="px-5 py-6 text-center">
                                    <p className="text-sm font-bold text-gray-400">No matching operations</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </motion.header>
    );
};

export default GlassNavbar;
