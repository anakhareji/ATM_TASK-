import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Users, Bell, FileText, Newspaper, Activity,
    Calendar, LogOut, Briefcase, Layers, CheckSquare, Shield,
    GraduationCap, ClipboardList, Award, Trophy, ListTodo, User
} from 'lucide-react';
import API from '../../api/axios';

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
            { name: 'Global Projects',        path: '/dashboard/projects-global',    icon: Briefcase     },
            { name: 'Global Submissions',     path: '/dashboard/submissions-global', icon: ClipboardList },
            { name: 'Performance Analytics',  path: '/dashboard/performance',        icon: Activity      },
            { name: 'Evaluate Students',      path: '/dashboard/evaluate',           icon: GraduationCap },
        ]
    },
    {
        label: 'Administration',
        items: [
            { name: 'Campus Pulse', path: '/dashboard/campus-pulse', icon: Newspaper },
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
            { name: 'Academic Planner',  path: '/dashboard/planner',     icon: ListTodo },
            { name: 'Evaluate Students', path: '/dashboard/evaluate',    icon: GraduationCap },
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
    const [role, setRole] = useState((localStorage.getItem('userRole') || 'student').toLowerCase());
    const [userName, setUserName] = useState(localStorage.getItem('userName') || 'User');
    const [userEmail, setUserEmail] = useState(localStorage.getItem('userEmail') || 'user@example.com');
    const [userAvatar, setUserAvatar] = useState(localStorage.getItem('userAvatar'));

    useEffect(() => {
        const handleProfileUpdate = () => {
            setUserName(localStorage.getItem('userName') || 'User');
            setUserEmail(localStorage.getItem('userEmail') || 'user@example.com');
            setUserAvatar(localStorage.getItem('userAvatar'));
            setRole((localStorage.getItem('userRole') || 'student').toLowerCase());
        };
        window.addEventListener('profileUpdated', handleProfileUpdate);
        return () => window.removeEventListener('profileUpdated', handleProfileUpdate);
    }, []);

    const navSections = role === 'admin' ? ADMIN_NAV : role === 'faculty' ? FACULTY_NAV : STUDENT_NAV;

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <div className="w-72 h-full bg-[#000000] flex flex-col overflow-hidden text-white font-sans">
            {/* Profile Section at TOP */}
            <div className="p-8 flex flex-col items-center border-b border-white/10">
                <div className="w-20 h-20 rounded-full border-2 border-primary overflow-hidden mb-4 p-1 ring-2 ring-primary/20 bg-white">
                    {userAvatar ? (
                        <img src={userAvatar} alt="User" className="w-full h-full object-cover rounded-full" />
                    ) : (
                        <div className="w-full h-full bg-surface-muted flex items-center justify-center text-secondary">
                             <User size={32} />
                        </div>
                    )}
                </div>
                <div className="text-center">
                    <h3 className="text-lg font-black tracking-tight leading-tight">{userName}</h3>
                    <p className="text-xs text-secondary-muted font-bold mt-1 lowercase opacity-70 truncate max-w-[200px]">{userEmail}</p>
                </div>
            </div>

            {/* Logo / App Name */}
            <div className="px-8 py-4 flex items-center gap-2 opacity-80">
                 <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Mission Control</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-2 custom-scrollbar-hidden">
                {navSections.map((section) => (
                    <div key={section.label} className="space-y-1">
                        {section.items.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/dashboard'}
                                onClick={() => setIsOpen && setIsOpen(false)}
                                className={({ isActive }) => `
                                    flex items-center gap-4 px-6 py-4 rounded-2xl
                                    transition-all duration-300 group text-sm font-bold
                                    ${isActive
                                        ? 'bg-primary/10 text-primary border border-primary/20'
                                        : 'text-secondary-muted hover:text-white hover:bg-white/5'
                                    }
                                `}
                            >
                                {({ isActive }) => (
                                    <>
                                        <item.icon
                                            size={20}
                                            className={`shrink-0 transition-all duration-300 ${isActive ? 'text-primary scale-110' : 'text-secondary-muted group-hover:text-white'}`}
                                        />
                                        <span className="truncate flex-1 tracking-tight">{item.name}</span>
                                        {isActive && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_#FF6767]" />
                                        )}
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </div>
                ))}
                
                {/* Fixed Utilities for all roles */}
                <div className="pt-4 border-t border-white/5 mt-4">
                     <NavLink
                        to="/dashboard/settings"
                        className={({ isActive }) => `flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all ${isActive ? 'bg-primary/10 text-primary' : 'text-secondary-muted hover:text-white hover:bg-white/5'}`}
                     >
                        <Shield size={20} className="shrink-0" />
                        <span>Settings</span>
                     </NavLink>
                </div>
            </nav>

            {/* Logout at BOTTOM */}
            <div className="p-6 border-t border-white/10">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-secondary-muted hover:text-white hover:bg-white/5 transition-all duration-300 group"
                >
                    <LogOut size={20} className="shrink-0 group-hover:text-primary transition-colors" />
                    <span className="text-sm font-bold tracking-tight">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default GlassSidebar;
