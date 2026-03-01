import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Users, Bell, FileText, Newspaper, Activity,
    Calendar, LogOut, Briefcase, Layers, CheckSquare, Shield,
    GraduationCap, ClipboardList, Award, Trophy, ListTodo
} from 'lucide-react';

const ADMIN_NAV = [
    {
        label: 'Overview',
        items: [{ name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }]
    },
    {
        label: 'People & Access',
        items: [
            { name: 'Identity Governance', path: '/dashboard/users', icon: Users },
            { name: 'Student Approvals', path: '/dashboard/approvals', icon: CheckSquare },
        ]
    },
    {
        label: 'Academic Activity',
        items: [
            { name: 'Global Projects', path: '/dashboard/projects-global', icon: Briefcase },
            { name: 'Global Submissions', path: '/dashboard/submissions-global', icon: ClipboardList },
            { name: 'Performance Analytics', path: '/dashboard/performance', icon: Activity },
        ]
    },
    {
        label: 'Administration',
        items: [
            { name: 'Academic Structure', path: '/dashboard/academic-structure', icon: Layers },
            { name: 'Audit Logs', path: '/dashboard/audit', icon: Shield },
            { name: 'Achievement & Recognition', path: '/dashboard/recognition', icon: Award },
        ]
    }
];

const FACULTY_NAV = [
    {
        label: 'Classroom',
        items: [
            { name: 'Briefing Room', path: '/dashboard', icon: LayoutDashboard },
            { name: 'Personnel', path: '/dashboard/students', icon: Users },
        ]
    },
    {
        label: 'Operations',
        items: [
            { name: 'Active Tracks', path: '/dashboard/projects', icon: Briefcase },
            { name: 'Assignment Hub', path: '/dashboard/tasks', icon: CheckSquare },
            { name: 'Squad Management', path: '/dashboard/groups', icon: Layers },
        ]
    },
    {
        label: 'Execution',
        items: [
            { name: 'Operational Intel', path: '/dashboard/submissions', icon: FileText },
            { name: 'Academic Planner', path: '/dashboard/planner', icon: ListTodo },
        ]
    }
];

const STUDENT_NAV = [
    {
        label: 'Mission Control',
        items: [
            { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
            { name: 'My Tasks', path: '/dashboard/tasks', icon: CheckSquare },
        ]
    },
    {
        label: 'Squad & Intel',
        items: [
            { name: 'My Groups', path: '/dashboard/my-groups', icon: Layers },
            { name: 'To-Do List', path: '/dashboard/todo', icon: ListTodo },
        ]
    },
    {
        label: 'Campus Intel',
        items: [
            { name: 'Campus Pulse', path: '/dashboard/news-events', icon: Newspaper },
            { name: 'Notifications', path: '/dashboard/notifications', icon: Bell },
        ]
    },
    {
        label: 'performance',
        items: [
            { name: 'Hall of Fame', path: '/dashboard/leaderboard', icon: Trophy },
            { name: 'Service Record', path: '/dashboard/grades', icon: Award },
        ]
    },
    {
        label: 'briefings',
        items: [
            { name: 'Schedule', path: '/dashboard/timetable', icon: Calendar },
        ]
    }
];

const GlassSidebar = ({ isOpen, setIsOpen }) => {
    const navigate = useNavigate();
    const role = (localStorage.getItem('userRole') || 'student').toLowerCase();
    const userName = localStorage.getItem('userName') || 'User';
    const initials = userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    const navSections = role === 'admin' ? ADMIN_NAV : role === 'faculty' ? FACULTY_NAV : STUDENT_NAV;
    const portalLabel = role.charAt(0).toUpperCase() + role.slice(1) + ' Portal';

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <div className="w-72 h-full bg-white border-r border-gray-100 flex flex-col shadow-lg overflow-hidden">
            {/* Logo */}
            <div className="flex items-center gap-3 px-6 h-20 border-b border-gray-100 shrink-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="text-lg font-black text-gray-800 tracking-tight leading-none uppercase">Academia</h1>
                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] leading-none mt-1">{portalLabel}</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto pt-6 pb-20 px-3 space-y-4 custom-scrollbar">
                {navSections.map((section) => (
                    <div key={section.label} className="space-y-1">
                        <div className="px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                            {section.label}
                        </div>
                        {section.items.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/dashboard'}
                                onClick={() => setIsOpen && setIsOpen(false)}
                                className={({ isActive }) => `
                                    flex items-center gap-3 px-4 py-2.5 rounded-2xl
                                    transition-all duration-300 group text-sm font-bold
                                    ${isActive
                                        ? 'bg-emerald-50/80 text-emerald-700 shadow-sm border border-emerald-100/50'
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800 border border-transparent'
                                    }
                                `}
                            >
                                {({ isActive }) => (
                                    <>
                                        <item.icon
                                            size={18}
                                            className={`shrink-0 transition-all duration-300 ${isActive ? 'scale-110 text-emerald-600' : 'text-gray-400 group-hover:text-gray-600 group-hover:scale-110'}`}
                                        />
                                        <span className="truncate">{item.name}</span>
                                        {isActive && (
                                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        )}
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </div>
                ))}
            </nav>

            {/* Profile & Logout */}
            <div className="p-4 border-t border-gray-100 shrink-0 space-y-3 bg-gray-50/30">
                <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white border border-gray-100 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-400/20 shrink-0">
                        <span className="font-black text-white text-xs">{initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-gray-800 truncate leading-tight">{userName}</p>
                        <p className="text-[10px] text-gray-400 truncate font-bold uppercase tracking-widest">{role}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all duration-300 active:scale-95 text-xs font-black uppercase tracking-widest"
                >
                    <LogOut size={16} />
                    Terminate Session
                </button>
            </div>
        </div>
    );
};

export default GlassSidebar;
