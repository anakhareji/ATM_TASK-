import React, { useEffect, useState, useRef } from 'react';
import { Bell, Search, User, Menu, Briefcase, LogOut, X,
         Mail, Shield, BookOpen, GraduationCap, Layers, CalendarDays,
         Hash, CheckCircle, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
    const [profileOpen, setProfileOpen]   = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [unreadCount, setUnreadCount]   = useState(0);
    const [recent, setRecent]             = useState([]);
    const [searchQuery, setSearchQuery]   = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching]   = useState(false);
    const [profile, setProfile]           = useState(null);

    const profileRef = useRef(null);
    const navigate   = useNavigate();
    const role       = localStorage.getItem('userRole');
    const user       = JSON.parse(localStorage.getItem('user') || '{}');
    const rc         = roleColors(role);

    // Close profile panel when clicking outside
    useEffect(() => {
      const handler = (e) => {
        if (profileRef.current && !profileRef.current.contains(e.target)) {
          setProfileOpen(false);
        }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Fetch full profile on open
    const fetchProfile = async () => {
      if (profile) return; // already loaded
      try {
        const res = await API.get('/auth/me');
        setProfile(res.data);
      } catch {
        // fallback to localStorage data
        setProfile({ ...user, role, status: 'active' });
      }
    };

    const handleProfileToggle = () => {
      if (!profileOpen) fetchProfile();
      setProfileOpen(o => !o);
      setDropdownOpen(false);
    };

    // Debounced search
    useEffect(() => {
        const fn = setTimeout(async () => {
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
        return () => clearTimeout(fn);
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
            <div className="flex items-center gap-3">

                {/* Bell */}
                <div className="relative">
                    <button className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-all duration-200 group active:scale-95"
                        onClick={() => { setDropdownOpen(o => !o); setProfileOpen(false); }}>
                        <Bell className="w-5 h-5 text-gray-500 group-hover:text-indigo-600 transition-colors"/>
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </button>
                    <AnimatePresence>
                        {dropdownOpen && (
                            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="absolute right-0 mt-3 w-80 bg-white border border-gray-100 rounded-2xl shadow-2xl p-4 ring-1 ring-black/5 z-50">
                                <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-50">
                                    <p className="font-bold text-gray-800">Notifications</p>
                                    <button className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:text-indigo-800" onClick={() => navigate('/dashboard/notifications')}>View All</button>
                                </div>
                                <div className="space-y-3">
                                    {recent.length === 0 ? (
                                        <div className="py-8 text-center"><p className="text-xs text-gray-400">All caught up!</p></div>
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

                <div className="h-8 w-px bg-gray-200 mx-1 hidden sm:block"/>

                {/* Profile button + panel */}
                <div className="relative" ref={profileRef}>
                    <button onClick={handleProfileToggle}
                        className={`flex items-center gap-3 pl-2 pr-1 py-1 rounded-2xl transition-all duration-200 ${profileOpen ? 'bg-gray-100' : 'hover:bg-gray-50'}`}>
                        <div className="hidden sm:block text-right">
                            <p className="text-xs font-bold text-gray-800 leading-none mb-1 capitalize">{user.name || 'User'}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">{role}</p>
                        </div>
                        <div className="relative">
                            <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${rc.bg} p-0.5 shadow-lg transition-transform duration-300 ${profileOpen ? 'rotate-6' : ''}`}>
                                <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center font-bold text-sm"
                                    style={{ color: 'var(--tw-gradient-to)' }}>
                                    {(user.name || 'U').charAt(0).toUpperCase()}
                                </div>
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"/>
                        </div>
                    </button>

                    <AnimatePresence>
                        {profileOpen && (
                            <ProfilePanel user={{ ...user, role }} profile={profile} onClose={() => setProfileOpen(false)}/>
                        )}
                    </AnimatePresence>
                </div>

            </div>
        </motion.header>
    );
};

export default GlassNavbar;
