import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Users, Bell, FileText, Newspaper, Activity,
    Calendar, LogOut, Briefcase, Layers, CheckSquare, Shield,
    GraduationCap, ClipboardList, ChevronDown, ChevronUp, Award
} from 'lucide-react';

const NAV_SECTIONS = [
    {
        label: 'Overview',
        items: [
            { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        ]
    },
    {
        label: 'People & Access',
        items: [
            { name: 'Identity Governance', path: '/dashboard/users', icon: Users },
            { name: 'Student Approvals', path: '/dashboard/approvals', icon: CheckSquare },
        ]
    },
    {
        label: 'Academic Structure',
        items: [
            { name: 'Departments & Courses', path: '/dashboard/academic-structure', icon: Layers },
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
            { name: 'Audit Logs', path: '/dashboard/audit', icon: Shield },
            { name: 'News & Events', path: '/dashboard/news', icon: Newspaper },
            { name: 'Notifications', path: '/dashboard/notifications', icon: Bell },
            { name: 'Achievement & Recognition', path: '/dashboard/recognition', icon: Award },
        ]
    }
];

const GlassSidebar = ({ isOpen, setIsOpen }) => {
    const navigate = useNavigate();
    const userName = localStorage.getItem('userName') || 'Administrator';
    const userEmail = localStorage.getItem('userEmail') || '';
    const initials = userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <div className="w-72 h-full bg-white border-r border-gray-100 flex flex-col shadow-lg">
            {/* Logo */}
            <div className="flex items-center gap-3 px-6 h-20 border-b border-gray-100 shrink-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="text-lg font-black text-gray-800 tracking-tight leading-none">ATM</h1>
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.15em] leading-none mt-0.5">Admin Portal</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-2">
                {NAV_SECTIONS.map((section) => (
                    <div key={section.label} className="mb-2">
                        <div className="px-4 py-2 rounded-lg bg-gray-50 text-xs font-bold uppercase tracking-widest text-gray-600">
                            {section.label}
                        </div>
                        {section.items.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/dashboard'}
                                onClick={() => setIsOpen && setIsOpen(false)}
                                className={({ isActive }) => `
                                    flex items-center gap-3 px-3 py-2.5 rounded-xl
                                    transition-all duration-200 group text-sm font-semibold
                                    ${isActive
                                        ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100/50'
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                                    }
                                `}
                            >
                                {({ isActive }) => (
                                    <>
                                        <item.icon
                                            size={18}
                                            className={`shrink-0 transition-colors ${isActive ? 'text-emerald-600' : 'text-gray-400 group-hover:text-gray-600'}`}
                                        />
                                        <span className="truncate">{item.name}</span>
                                        {isActive && (
                                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                        )}
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </div>
                ))}
            </nav>

            {/* User Profile & Logout */}
            <div className="p-4 border-t border-gray-100 shrink-0 space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80 border border-gray-100">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-sm shrink-0">
                        <span className="font-black text-white text-xs">{initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate leading-tight">{userName}</p>
                        <p className="text-[10px] text-gray-400 truncate font-medium">Administrator</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all duration-200 active:scale-95 text-sm font-bold"
                >
                    <LogOut size={16} />
                    Sign Out
                </button>
            </div>
        </div>
    );
};

export default GlassSidebar;
