import React, { useEffect, useState, useMemo } from 'react';
import { 
  Bell, Search, Menu, Calendar, X, User, Mail, Shield, 
  Layers, BookOpen, GraduationCap, CalendarDays, ChevronRight, 
  LogOut, Hash, ExternalLink 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
const ProfilePanel = ({ user, profile, onClose, onEditProfile }) => {
  const navigate = useNavigate();
  const rc = roleColors(user.role);

  const handleLogout = () => {
    if (window.hasUnsavedSettings) {
        if (window.confirm("You have unsaved changes. Click OK to stay and save them, or Cancel to discard and leave.")) {
            return;
        }
    }
    localStorage.clear();
    document.documentElement.classList.remove('dark');
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
          <div className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/40 flex items-center justify-center text-white text-2xl font-black shadow-lg overflow-hidden shrink-0">
            {profile?.avatar || user?.avatar ? (
                <img src={profile?.avatar || user?.avatar} alt="User" className="w-full h-full object-cover" />
            ) : (
                <User size={32} className="text-white opacity-90" />
            )}
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
      <div className="px-6 -mt-5 relative z-10">
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
        <button onClick={() => { onEditProfile(); onClose(); }}
          className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-gray-700 hover:bg-gray-50 transition-all group">
          <div className="flex items-center gap-3">
            <User size={16}/>
            <span className="text-sm font-black uppercase tracking-widest">Edit Profile</span>
          </div>
          <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all"/>
        </button>
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
// Search Index
// ─────────────────────────────────────────────
const SEARCH_INDEX = [
    // Admin Routes
    { title: 'Dashboard', subtitle: 'Admin Overview', path: '/dashboard', type: 'page', roles: ['admin'] },
    { title: 'Identity Governance', subtitle: 'Manage Users & Roles', path: '/dashboard/users', type: 'page', roles: ['admin'] },
    { title: 'Student Approvals', subtitle: 'Pending Registrations', path: '/dashboard/approvals', type: 'page', roles: ['admin'] },
    { title: 'Global Projects', subtitle: 'Academic Activity', path: '/dashboard/projects-global', type: 'page', roles: ['admin'] },
    { title: 'Global Submissions', subtitle: 'Academic Activity', path: '/dashboard/submissions-global', type: 'page', roles: ['admin'] },
    { title: 'Performance Analytics', subtitle: 'Academic Activity', path: '/dashboard/performance', type: 'page', roles: ['admin'] },
    { title: 'Campus Pulse', subtitle: 'Administration', path: '/dashboard/campus-pulse', type: 'page', roles: ['admin'] },
    { title: 'Academic Structure', subtitle: 'Administration', path: '/dashboard/academic-structure', type: 'page', roles: ['admin'] },
    { title: 'Audit Logs', subtitle: 'System Logs', path: '/dashboard/audit', type: 'page', roles: ['admin'] },
    { title: 'Achievement & Recognition', subtitle: 'Administration', path: '/dashboard/recognition', type: 'page', roles: ['admin'] },

    // Faculty Routes
    { title: 'Briefing Room', subtitle: 'Faculty Overview', path: '/dashboard', type: 'page', roles: ['faculty'] },
    { title: 'Personnel', subtitle: 'Manage Students', path: '/dashboard/students', type: 'page', roles: ['faculty'] },
    { title: 'Active Tracks', subtitle: 'Projects', path: '/dashboard/projects', type: 'page', roles: ['faculty'] },
    { title: 'Assignment Hub', subtitle: 'Tasks & Assignments', path: '/dashboard/tasks', type: 'page', roles: ['faculty'] },
    { title: 'Squad Management', subtitle: 'Groups', path: '/dashboard/groups', type: 'page', roles: ['faculty'] },
    { title: 'Operational Intel', subtitle: 'Submissions', path: '/dashboard/submissions', type: 'page', roles: ['faculty'] },
    { title: 'Academic Planner', subtitle: 'Planning', path: '/dashboard/planner', type: 'page', roles: ['faculty'] },
    { title: 'Evaluate Students', subtitle: 'Grading', path: '/dashboard/evaluate', type: 'page', roles: ['admin', 'faculty'] },

    // Student Routes
    { title: 'Mission Control', subtitle: 'Overview', path: '/dashboard', type: 'page', roles: ['student'] },
    { title: 'My Tasks', subtitle: 'Assignments', path: '/dashboard/tasks', type: 'page', roles: ['student'] },
    { title: 'My Groups', subtitle: 'Squad & Intel', path: '/dashboard/my-groups', type: 'page', roles: ['student'] },
    { title: 'To-Do List', subtitle: 'Personal Tasks', path: '/dashboard/todo', type: 'page', roles: ['student'] },
    { title: 'Campus Pulse', subtitle: 'News & Events', path: '/dashboard/news-events', type: 'page', roles: ['student'] },
    { title: 'Notifications', subtitle: 'Alerts', path: '/dashboard/notifications', type: 'page', roles: ['student', 'faculty', 'admin'] },
    { title: 'Hall of Fame', subtitle: 'Leaderboard', path: '/dashboard/leaderboard', type: 'page', roles: ['student'] },
    { title: 'Service Record', subtitle: 'Grades & Performance', path: '/dashboard/grades', type: 'page', roles: ['student'] },
    { title: 'Schedule', subtitle: 'Timetable', path: '/dashboard/timetable', type: 'page', roles: ['student'] },
    
    // Additional helpful quick links for all
    { title: 'Profile Settings', subtitle: 'Account', path: '/dashboard/profile', type: 'user', roles: ['admin', 'faculty', 'student'] }
];

// ─────────────────────────────────────────────
// Main Navbar
// ─────────────────────────────────────────────
const GlassNavbar = ({ isSidebarOpen, setIsOpen }) => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const currentDate = new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    const [showProfile, setShowProfile] = useState(false);
    const [profile, setProfile] = useState(null);
    const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);

    useEffect(() => {
        const fetchUnread = async () => {
            try {
                const res = await API.get('/notifications/unread-count');
                setUnreadCount(res.data?.unread || 0);
            } catch { setUnreadCount(0); }
        };
        const fetchProfile = async () => {
            try {
                const res = await API.get('/auth/me');
                setProfile(res.data);
            } catch { }
        };
        fetchUnread();
        fetchProfile();
    }, []);

    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const q = searchQuery.toLowerCase();
        return SEARCH_INDEX.filter(item => {
            const matchesRole = user.role && item.roles.includes(user.role);
            const matchesText = item.title.toLowerCase().includes(q) || 
                              item.subtitle.toLowerCase().includes(q);
            return matchesRole && matchesText;
        }).slice(0, 6);
    }, [searchQuery, user.role]);

    const handleSearchSelect = (path) => {
        if (window.hasUnsavedSettings) {
            if (window.confirm("You have unsaved changes. Click OK to stay and save them, or Cancel to discard and leave.")) {
                return;
            }
        }
        setSearchQuery('');
        navigate(path);
    };

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
                        placeholder="Search mission or page..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && searchResults.length > 0) {
                                handleSearchSelect(searchResults[0].path);
                            }
                        }}
                        className="w-64 bg-white border border-gray-200 rounded-2xl px-5 py-3 pl-12 text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all duration-300 text-secondary placeholder-secondary-muted"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-muted w-5 h-5 group-focus-within:text-primary transition-colors"/>
                    
                    {/* Search Results Dropdown */}
                    <AnimatePresence>
                        {searchQuery.trim() && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden py-2"
                            >
                                {searchResults.length > 0 ? (
                                    searchResults.map((res, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSearchSelect(res.path)}
                                            className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors text-left group"
                                        >
                                            <div>
                                                <p className="text-sm font-black text-gray-800">{res.title}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{res.subtitle}</p>
                                            </div>
                                            <ExternalLink size={14} className="text-gray-200 group-hover:text-primary transition-colors" />
                                        </button>
                                    ))
                                ) : (
                                    <div className="px-5 py-4 text-center">
                                        <p className="text-xs font-bold text-gray-400 italic">No matches found</p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Notifications */}
                <button 
                    onClick={(e) => {
                        if (window.hasUnsavedSettings && window.location.pathname !== '/dashboard/notifications') {
                            if (window.confirm("You have unsaved changes. Click OK to stay and save them, or Cancel to discard and leave.")) {
                                e.preventDefault();
                                return;
                            }
                        }
                        navigate('/dashboard/notifications');
                    }}
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
