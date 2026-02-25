import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LayoutDashboard, ShieldCheck, CheckSquare, Layers, Briefcase, FileText, Activity, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Section = ({ title, icon, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/60 border border-gray-100 shadow-sm hover:bg-white transition-all duration-200"
      >
        <div className="flex items-center gap-2 text-gray-700 font-bold">
          <span className="text-emerald-600">{icon}</span>
          <span>{title}</span>
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-gray-500"
        >
          <ChevronDown size={18} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-2 space-y-1 overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Item = ({ to, icon, label, active }) => (
  <Link
    to={to}
    className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 ${
      active ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
    }`}
  >
    <span className="flex items-center gap-2">
      <span className={`${active ? 'text-emerald-600' : 'text-gray-400'}`}>{icon}</span>
      <span className="font-medium">{label}</span>
    </span>
  </Link>
);

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const active = (path) => location.pathname === path;

  return (
    <div className={`fixed inset-y-0 left-0 z-40 w-[280px] transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
      <div className="h-full flex flex-col bg-white/70 backdrop-blur-sm border-r border-gray-100 shadow-lg">
        <div className="flex items-center gap-3 px-4 h-16 border-b border-gray-100">
          <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
            <Activity size={20} />
          </div>
          <div className="font-black text-gray-800 tracking-tight">Academic Task Management</div>
          <button onClick={onClose} className="ml-auto lg:hidden px-2 py-1 rounded-lg text-gray-500 hover:text-emerald-700 transition-all">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <Section title="Overview" icon={<LayoutDashboard size={18} />}>
            <Item to="/admin/dashboard" icon={<LayoutDashboard size={18} />} label="Dashboard" active={active('/admin/dashboard')} />
          </Section>
          <Section title="People & Access" icon={<ShieldCheck size={18} />}>
            <Item to="/admin/identity" icon={<ShieldCheck size={18} />} label="Identity Governance" active={active('/admin/identity')} />
            <Item to="/admin/approvals" icon={<CheckSquare size={18} />} label="Student Approvals" active={active('/admin/approvals')} />
          </Section>
          <Section title="Academic Structure" icon={<Layers size={18} />}>
            <Item to="/admin/structure" icon={<Layers size={18} />} label="Departments & Courses" active={active('/admin/structure')} />
          </Section>
          <Section title="Academic Activity" icon={<Briefcase size={18} />}>
            <Item to="/admin/projects" icon={<Briefcase size={18} />} label="Global Projects" active={active('/admin/projects')} />
            <Item to="/admin/submissions" icon={<FileText size={18} />} label="Global Submissions" active={active('/admin/submissions')} />
            <Item to="/admin/performance" icon={<Activity size={18} />} label="Performance Analytics" active={active('/admin/performance')} />
          </Section>
        </div>
        <div className="border-t border-gray-100 bg-gray-50/50 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold border-2 border-white shadow-sm">A</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-gray-900 truncate">Admin</div>
              <div className="text-xs text-gray-500 truncate">Administrator</div>
            </div>
          </div>
          <button
            onClick={() => { localStorage.clear(); navigate('/login'); }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-200 active:scale-95 text-sm font-medium"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
