import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Moon, Sun, HelpCircle, ShieldCheck, FileText, 
  ChevronRight, Camera, Save, Loader2, LogOut,
  Bell, Monitor, Globe, Smartphone, Lock, XCircle,
  ExternalLink, Mail, MessageSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import GlassCard from '../components/ui/GlassCard';
import { staggerContainer } from '../utils/motionVariants';
import toast from 'react-hot-toast';

/* ─────────────────────────────────────────────
   INTERNAL MODAL COMPONENT
   ───────────────────────────────────────────── */
const SettingsModal = ({ open, title, onClose, children }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" 
                onClick={onClose} 
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-card rounded-[2.5rem] shadow-2xl w-full max-w-2xl border border-border overflow-hidden"
            >
                <div className="px-10 py-8 border-b border-border flex items-center justify-between bg-surface/50">
                    <h2 className="text-2xl font-black text-secondary italic uppercase tracking-tight">{title}</h2>
                    <button onClick={onClose} className="p-3 text-secondary/30 hover:text-secondary transition-colors rounded-2xl hover:bg-card shadow-sm">
                        <XCircle size={24} />
                        
                    </button>
                </div>
                <div className="px-10 py-10 max-h-[60vh] overflow-y-auto custom-scrollbar-hidden">
                    {children}
                </div>
                <div className="px-10 py-6 border-t border-border bg-surface flex justify-end">
                    <button onClick={onClose} className="px-8 py-3 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:opacity-90 transition-all active:scale-95">
                        Acknowledged
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

const Settings = () => {
    const navigate = useNavigate();
    const [user] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
    const [, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    
    // Theme state
    const [darkMode, setDarkMode] = useState(() => {
        if (user && user.id) {
            return localStorage.getItem(`theme_${user.id}`) === 'dark';
        }
        return false;
    });
    
    // Modal state
    const [modal, setModal] = useState({ open: false, title: '', content: null });

    const [formData, setFormData] = useState({
        name: user.name || '',
        email: user.email || '',
        avatar: user.avatar || '',
        roll_no: user.roll_no || ''
    });

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (window.hasUnsavedSettings) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            if (window.hasUnsavedSettings && user && user.id) {
                const savedTheme = localStorage.getItem(`theme_${user.id}`);
                if (savedTheme === 'dark') {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            }
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.hasUnsavedSettings = false;
            setHasUnsavedChanges(false);
        };
    }, [user]);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await API.get('/auth/me');
                setProfile(res.data);
                setFormData({
                    name: res.data.name || user.name,
                    email: res.data.email || user.email,
                    avatar: res.data.avatar || user.avatar,
                    roll_no: res.data.roll_no || ''
                });
            } catch {
                toast.error('Failed to sync settings data');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [user.name, user.email, user.avatar]);

    const toggleTheme = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        if (newMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        window.hasUnsavedSettings = true;
        setHasUnsavedChanges(true);
    };

    const handleTerminateSession = () => {
        localStorage.clear();
        document.documentElement.classList.remove('dark');
        window.hasUnsavedSettings = false;
        setHasUnsavedChanges(false);
        toast.success('Session Terminated Successfully');
        setTimeout(() => navigate('/login'), 500);
    };

    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, avatar: reader.result }));
                window.hasUnsavedSettings = true;
                setHasUnsavedChanges(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await API.put(`/users/${user.id || 'me'}`, {
                name: formData.name,
                email: formData.email,
                avatar: formData.avatar
            });
            
            // Apply theme changes
            if (user && user.id) {
                localStorage.setItem(`theme_${user.id}`, darkMode ? 'dark' : 'light');
            }
            if (darkMode) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
            window.hasUnsavedSettings = false;
            setHasUnsavedChanges(false);

            toast.success('System Settings Synchronized');
            const updatedUser = { ...user, ...formData };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            localStorage.setItem('userName', formData.name);
            if (formData.avatar) localStorage.setItem('userAvatar', formData.avatar);
            window.dispatchEvent(new Event('profileUpdated'));
        } catch {
            toast.error('Uplink failed: Update rejected');
        } finally {
            setSaving(false);
        }
    };

    const openHelp = () => setModal({
        open: true,
        title: 'Help Desk & FAQ',
        content: (
            <div className="space-y-6">
                <div className="p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100 flex items-center gap-4">
                    <MessageSquare className="text-indigo-600" size={32} />
                    <div>
                        <p className="font-black text-indigo-900 uppercase italic tracking-tight">Live Intelligence Support</p>
                        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Typical response time: <span className="font-black">Under 5 minutes</span></p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button className="flex flex-col items-center p-6 bg-white border border-gray-100 rounded-[2rem] hover:border-emerald-400 transition-all group scale-100 active:scale-95 shadow-sm">
                        <Mail className="text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-800">Email Support</span>
                    </button>
                    <button className="flex flex-col items-center p-6 bg-white border border-gray-100 rounded-[2rem] hover:border-indigo-400 transition-all group scale-100 active:scale-95 shadow-sm">
                        <ExternalLink className="text-indigo-500 mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-800">Documentation</span>
                    </button>
                </div>
                <div className="space-y-4">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Current Manual Status</p>
                    <div className="space-y-2">
                        {[
                            'How to track individual student tasks?',
                            'Generating academic evaluation reports',
                            'Managing group collaborations',
                            'Understanding mission leaderboard ranking'
                        ].map((q, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl text-[11px] font-bold text-gray-600">
                                {q} <ChevronRight size={14} className="text-gray-300" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    });

    const openPrivacy = () => setModal({
        open: true,
        title: 'Privacy Protocol',
        content: (
            <div className="space-y-6 text-sm text-gray-600 font-medium leading-relaxed">
                <p>Welcome to the Academic Task Management System (ATMS). Your privacy is a high-priority mission directive.</p>
                <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                    <h4 className="font-black text-gray-800 uppercase tracking-[0.15em] text-[11px] mb-3">1. Data Encryption</h4>
                    <p className="text-[11px]">All communications between your operative terminal and our core servers are encrypted using 256-bit AES protocols. Your identifying data is siloed and accessible only to authorized institutional administrators.</p>
                </div>
                <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                    <h4 className="font-black text-gray-800 uppercase tracking-[0.15em] text-[11px] mb-3">2. Mission Logs</h4>
                    <p className="text-[11px]">System action logs are maintained for audit purposes to ensure institutional integrity. Logs are automatically purged or archived after 24 operational months.</p>
                </div>
                <p className="text-[10px] italic font-bold text-gray-400">By continuing to use this system, you acknowledge adherence to these privacy protocols.</p>
            </div>
        )
    });

    const openLicense = () => setModal({
        open: true,
        title: 'License Agreement',
        content: (
            <div className="space-y-6">
                <div className="flex items-center gap-4 p-6 bg-amber-50 rounded-[2rem] border border-amber-100">
                    <FileText className="text-amber-600" size={32} />
                    <div>
                        <p className="font-black text-amber-900 uppercase italic">Enterprise Operational License</p>
                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest italic">Institutional Tier Subscription Active</p>
                    </div>
                </div>
                <div className="space-y-4 text-[11px] text-gray-500 font-bold leading-relaxed px-2">
                    <p>Proprietary software protected by international intellectual property laws. Unauthorized duplication or redistribution of this software or its tactical assets will result in immediate termination of access and potential disciplinary measures.</p>
                    <p>© 2026 Academic Task Management Systems. All rights reserved globally.</p>
                </div>
            </div>
        )
    });

    const openSecurity = () => setModal({
        open: true,
        title: 'Security Clearance',
        content: (
            <div className="space-y-8">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Current Validation Key (Password)</label>
                        <input type="password" placeholder="••••••••" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">New Terminal Password</label>
                        <input type="password" placeholder="Min 12 characters recommended" className="w-full px-6 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold outline-none ring-4 ring-indigo-500/5 focus:border-indigo-400 transition-all" />
                    </div>
                </div>
                <button 
                    onClick={() => { toast.success('Password Cipher Updated Successfully'); setModal({ open: false }); }}
                    className="w-full py-4 bg-gray-900 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gray-800 transition-all active:scale-95"
                >
                    Rotate Security Keys
                </button>
            </div>
        )
    });

    if (loading) {
        return (
            <div className="space-y-8 animate-pulse p-4">
                <div className="h-40 bg-white/20 rounded-[3rem]" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="h-64 bg-white/10 rounded-[3rem]" />
                    <div className="h-64 bg-white/10 rounded-[3rem]" />
                </div>
            </div>
        );
    }

    return (
        <>
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-10 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-secondary tracking-tight flex items-center gap-4 italic uppercase">
                         System Config
                    </h1>
                    <p className="text-sm font-bold text-secondary-muted mt-2 uppercase tracking-[0.2em]">Manage your operative identity and mission aesthetics</p>
                </div>
                <button 
                    onClick={handleSave} 
                    disabled={saving || !hasUnsavedChanges} 
                    className={`px-10 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-3 ${
                        hasUnsavedChanges 
                            ? 'bg-primary text-white hover:opacity-90 shadow-2xl active:scale-95' 
                            : 'bg-surface border border-border text-secondary/40 cursor-not-allowed shadow-none'
                    }`}
                >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? 'Syncing...' : 'Apply Changes'}
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* 1. OPERATIVE IDENTITY */}
                <GlassCard className="p-10 border-white/10 group overflow-hidden relative shadow-2xl shadow-indigo-500/5">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <h3 className="text-xl font-black text-secondary uppercase italic mb-8 tracking-tight flex items-center gap-3">
                        <User className="text-indigo-500" size={22} /> Operative Identity
                    </h3>
                    <div className="flex flex-col sm:flex-row items-center gap-10">
                        <div className="relative group/avatar">
                            <div className="w-32 h-32 rounded-[2.5rem] bg-white p-1.5 shadow-2xl border border-gray-100 ring-4 ring-white transition-transform group-hover/avatar:scale-105 duration-500">
                                <div className="w-full h-full rounded-[2rem] overflow-hidden bg-gray-50 flex items-center justify-center relative">
                                    {formData.avatar ? (
                                        <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={48} className="text-gray-200" />
                                    )}
                                    <label className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-all cursor-pointer flex flex-col items-center justify-center text-white text-[9px] font-black uppercase tracking-widest text-center px-4">
                                        <Camera size={20} className="mb-1" />
                                        Upload New Ident
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 space-y-6 w-full">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary-muted ml-1">Codename</label>
                                <input 
                                    className="w-full px-6 py-3.5 bg-surface border border-border rounded-2xl text-sm font-bold text-secondary focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all shadow-sm"
                                    value={formData.name}
                                    onChange={e => { setFormData({...formData, name: e.target.value}); window.hasUnsavedSettings = true; setHasUnsavedChanges(true); }}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary-muted ml-1">Unique Terminal ID</label>
                                <input 
                                    className="w-full px-6 py-3.5 bg-surface border border-border rounded-2xl text-sm font-bold text-secondary-muted opacity-70 cursor-not-allowed outline-none shadow-sm"
                                    value={formData.roll_no || '#PENDING'}
                                    readOnly
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Uplink Address</label>
                                <input 
                                    className="w-full px-6 py-3.5 bg-surface border border-border rounded-2xl text-sm font-bold text-secondary focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all shadow-sm"
                                    value={formData.email}
                                    onChange={e => { setFormData({...formData, email: e.target.value}); window.hasUnsavedSettings = true; setHasUnsavedChanges(true); }}
                                />
                            </div>
                        </div>
                    </div>
                </GlassCard>

                {/* 2. MISSION AESTHETICS */}
                <GlassCard className="p-10 border-white/60 bg-white/40 shadow-2xl shadow-primary/5">
                    <h3 className="text-xl font-black text-gray-800 uppercase italic mb-8 tracking-tight flex items-center gap-3">
                        <Monitor className="text-primary" size={22} /> Mission Aesthetics
                    </h3>
                    <div className="space-y-4">
                        <div 
                            onClick={toggleTheme}
                            className="flex items-center justify-between p-6 bg-surface border border-border rounded-[2rem] cursor-pointer hover:border-primary/30 transition-all group shadow-sm"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${darkMode ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-amber-100 text-amber-600'}`}>
                                    {darkMode ? <Moon size={22} /> : <Sun size={22} />}
                                </div>
                                <div>
                                    <p className="text-sm font-black text-secondary uppercase italic tracking-tight">{darkMode ? 'Interstellar Dark' : 'Daylight Protocol'}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-secondary-muted">Current Theme Environment</p>
                                </div>
                            </div>
                            <button className={`w-14 h-7 rounded-full relative transition-all duration-300 ${darkMode ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-sm ${darkMode ? 'left-8' : 'left-1'}`} />
                            </button>
                        </div>
                        <SettingsToggle icon={Bell} label="Deployment Alerts" initialValue={true} />
                        <SettingsToggle icon={Globe} label="Region: International" initialValue={true} />
                    </div>
                </GlassCard>

                {/* 3. SUPPORT & INTELLIGENCE */}
                <GlassCard className="p-10 border-white/60 bg-white/40 shadow-2xl shadow-emerald-500/5">
                    <h3 className="text-xl font-black text-gray-800 uppercase italic mb-8 tracking-tight flex items-center gap-3">
                        <HelpCircle className="text-emerald-500" size={22} /> Support & Intel
                    </h3>
                    <div className="space-y-3">
                        <SettingsLink onClick={openHelp} icon={HelpCircle} label="Access Help Desk" sub="Consult the technical manual and FAQ" color="text-emerald-500" bg="bg-emerald-50" />
                        <SettingsLink onClick={openSecurity} icon={Lock} label="Security Clearance" sub="Update your tactical credentials" color="text-indigo-500" bg="bg-indigo-50" />
                        <SettingsLink onClick={() => toast.success('Mobile Uplink Synchronized')} icon={Smartphone} label="Mobile Uplink" sub="Sync with handheld devices" color="text-amber-500" bg="bg-amber-50" />
                    </div>
                </GlassCard>

                {/* 4. LEGAL PROTOCOLS */}
                <GlassCard className="p-10 border-white/60 bg-white/40 shadow-2xl shadow-violet-500/5">
                    <h3 className="text-xl font-black text-gray-800 uppercase italic mb-8 tracking-tight flex items-center gap-3">
                        <ShieldCheck className="text-violet-500" size={22} /> Legal Protocols
                    </h3>
                    <div className="space-y-3">
                        <SettingsLink onClick={openPrivacy} icon={FileText} label="Privacy Policy" sub="How we handle mission data" color="text-violet-500" bg="bg-violet-50" />
                        <SettingsLink onClick={openLicense} icon={FileText} label="License Agreement" sub="Operational terms and conditions" color="text-gray-500" bg="bg-gray-50" />
                        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                             <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">Version 4.5.2-Alpha</p>
                              <button onClick={handleTerminateSession} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-400 transition-colors group">
                                 <LogOut size={12} className="group-hover:-translate-x-1 transition-transform" /> Terminate Session
                             </button>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </motion.div>

        <AnimatePresence>
            {modal.open && (
                <SettingsModal 
                    open={modal.open} 
                    title={modal.title} 
                    onClose={() => setModal({ ...modal, open: false })}
                >
                    {modal.content}
                </SettingsModal>
            )}
        </AnimatePresence>
        </>
    );
};

const SettingsToggle = ({ icon: Icon, label, initialValue }) => {
    const [val, setVal] = useState(initialValue);
    return (
        <div className="flex items-center justify-between p-5 bg-card/50 border border-border rounded-2xl shadow-sm hover:border-border/50 transition-all">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-secondary/40">
                    <Icon size={18} />
                </div>
                <p className="text-[11px] font-black uppercase tracking-widest text-secondary/60">{label}</p>
            </div>
            <button 
                onClick={() => { setVal(!val); toast.success(`${label} ${!val ? 'Active' : 'Offline'}`); }}
                className={`w-10 h-5 rounded-full relative transition-all duration-300 ${val ? 'bg-primary' : 'bg-gray-200'}`}
            >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-300 ${val ? 'left-5' : 'left-1'}`} />
            </button>
        </div>
    );
};

const SettingsLink = ({ icon: Icon, label, sub, color, bg, onClick }) => (
    <div 
        onClick={onClick}
        className="flex items-center justify-between p-5 bg-card hover:bg-surface/80 border border-border rounded-2xl cursor-pointer group transition-all shadow-sm hover:shadow-md"
    >
        <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl ${bg} ${color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                <Icon size={20} />
            </div>
            <div>
                <p className="text-sm font-black text-secondary uppercase italic tracking-tight">{label}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-secondary-muted">{sub}</p>
            </div>
        </div>
        <ChevronRight size={16} className="text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
    </div>
);

export default Settings;

