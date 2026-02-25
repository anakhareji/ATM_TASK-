import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Users, Trophy, Bell, FileText, Newspaper,
    Activity, Calendar, Award, Briefcase, ListTodo, Layers, CheckSquare, LogOut, Shield
} from 'lucide-react';

const Sidebar = ({ role = 'student', isOpen, setIsOpen }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const menuItems = {
        student: [
            { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
            { name: 'Leaderboard', path: '/dashboard/leaderboard', icon: <Trophy size={20} /> },
            { name: 'Grades', path: '/dashboard/grades', icon: <Award size={20} /> },
            { name: 'My Tasks', path: '/dashboard/my-tasks', icon: <CheckSquare size={20} /> },
            { name: 'My To-Do', path: '/dashboard/todo', icon: <ListTodo size={20} /> },
            { name: 'My Groups', path: '/dashboard/my-groups', icon: <Layers size={20} /> },
            { name: 'Timetable', path: '/dashboard/timetable', icon: <Calendar size={20} /> },
            { name: 'Notifications', path: '/dashboard/notifications', icon: <Bell size={20} /> },
        ],
        faculty: [
            { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
            { name: 'Students', path: '/dashboard/students', icon: <Users size={20} /> },
            { name: 'Projects', path: '/dashboard/projects', icon: <Briefcase size={20} /> },
            { name: 'Tasks', path: '/dashboard/tasks', icon: <CheckSquare size={20} /> },
            { name: 'Groups', path: '/dashboard/groups', icon: <Layers size={20} /> },
            { name: 'Submissions', path: '/dashboard/submissions', icon: <FileText size={20} /> },
            { name: 'Academic Planner', path: '/dashboard/planner', icon: <ListTodo size={20} /> },
            { name: 'News & Events', path: '/dashboard/news-events', icon: <Newspaper size={20} /> },
        ],
        admin: [
            { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
            { name: 'User Management', path: '/dashboard/users', icon: <Users size={20} /> },
            { name: 'Student Approvals', path: '/dashboard/approvals', icon: <CheckSquare size={20} /> },
            { name: 'Global Projects', path: '/dashboard/projects-global', icon: <Briefcase size={20} /> },
            { name: 'Global Submissions', path: '/dashboard/submissions-global', icon: <FileText size={20} /> },
            { name: 'Academic Structure', path: '/dashboard/academic-structure', icon: <Layers size={20} /> },
            { name: 'Performance', path: '/dashboard/performance', icon: <Activity size={20} /> },
            { name: 'Audit Logs', path: '/dashboard/audit', icon: <Shield size={20} /> },
            { name: 'News & Events', path: '/dashboard/news', icon: <Calendar size={20} /> },
            { name: 'Notifications', path: '/dashboard/notifications', icon: <Bell size={20} /> },
        ],
    };

    const currentMenu = menuItems[role] || menuItems.student;

    return (
        <div className="h-full flex flex-col bg-white">
            <div className="flex items-center justify-center h-16 border-b border-gray-100">
                <Link to="/" className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2 rounded-xl shadow-md">
                        <Activity className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xl font-bold text-gray-800 tracking-tight">Academia</span>
                </Link>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-4">
                <div className="mb-6 px-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Main Menu</p>
                </div>
                <nav className="space-y-1">
                    {currentMenu.map((item) => (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={`flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 group ${location.pathname === item.path
                                ? 'bg-emerald-50 text-emerald-700 font-bold shadow-sm'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <span
                                className={`mr-3 transition-colors duration-200 ${location.pathname === item.path ? 'text-emerald-600' : 'text-gray-400 group-hover:text-gray-600'
                                    }`}
                            >
                                {item.icon}
                            </span>
                            {item.name}
                        </Link>
                    ))}
                </nav>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50/30">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold border-2 border-white shadow-sm">
                        U
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">User Account</p>
                        <p className="text-xs text-gray-500 truncate capitalize">{role}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-200 active:scale-95 text-sm font-medium"
                >
                    <LogOut size={16} />
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
