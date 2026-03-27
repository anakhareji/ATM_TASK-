import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Mail, Shield, Camera, Save, Loader2, 
  MapPin, Phone, Hash, Calendar, Zap, Star,
  Award, Target, ChevronRight, GraduationCap,
  Briefcase, Activity
} from 'lucide-react';
import API from '../api/axios';
import GlassCard from '../components/ui/GlassCard';
import PremiumProfileBadge from '../components/ui/PremiumProfileBadge';
import { staggerContainer } from '../utils/motionVariants';
import toast from 'react-hot-toast';

const Profile = () => {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: user.name || '',
        email: user.email || '',
        avatar: user.avatar || '',
        phone: '',
        bio: '',
        department: '',
        location: 'Main Campus'
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await API.get('/auth/me');
                setProfile(res.data);
                setFormData(prev => ({
                    ...prev,
                    name: res.data.name || prev.name,
                    email: res.data.email || prev.email,
                    avatar: res.data.avatar || prev.avatar,
                    phone: res.data.phone || '',
                    bio: res.data.bio || '',
                    department: res.data.department || ''
                }));
            } catch {
                toast.error('Failed to sync profile data');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, avatar: reader.result }));
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
                avatar: formData.avatar,
                department: formData.department
            });
            
            toast.success('Service Record Updated');
            
            const updatedUser = { ...user, ...formData };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            localStorage.setItem('userName', formData.name);
            if (formData.avatar) localStorage.setItem('userAvatar', formData.avatar);
            
            setUser(updatedUser);
            window.dispatchEvent(new Event('profileUpdated'));
        } catch {
            toast.error('Uplink failed: Profile update rejected');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-8 animate-pulse p-4">
                <div className="h-48 bg-white/20 rounded-[3rem]" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="h-96 bg-white/10 rounded-[3rem]" />
                    <div className="md:col-span-2 h-96 bg-white/10 rounded-[3rem]" />
                </div>
            </div>
        );
    }

    const roleColors = {
        admin: 'from-violet-500 to-purple-700 shadow-violet-500/20',
        faculty: 'from-blue-500 to-indigo-700 shadow-indigo-500/20',
        student: 'from-emerald-500 to-teal-600 shadow-emerald-500/20'
    }[user.role?.toLowerCase()] || 'from-gray-500 to-gray-700 shadow-gray-500/20';

    return (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-10 pb-20">
            
            {/* Massive Hero Header */}
            <div className="relative overflow-hidden rounded-[3.5rem] bg-white shadow-2xl shadow-gray-200/50 border border-gray-100 p-1">
                <div className={`h-48 bg-gradient-to-br ${roleColors} rounded-[3.2rem] relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
                        <div className="absolute top-0 right-0 w-[600px] h-[600px] border border-white rounded-full translate-x-1/2 -translate-y-1/2" />
                        <div className="absolute top-1/2 left-0 w-[300px] h-[300px] border border-white/30 rounded-full -translate-x-1/2" />
                    </div>
                </div>
                
                <div className="px-10 pb-8 flex flex-col md:flex-row items-end gap-8 -mt-20 relative z-10">
                    <div className="relative group">
                        <div className="w-40 h-40 rounded-[2.5rem] bg-white p-2 shadow-2xl border border-gray-100 ring-8 ring-white">
                            <div className="w-full h-full rounded-[2rem] overflow-hidden bg-gray-50 flex items-center justify-center relative">
                                {formData.avatar ? (
                                    <img src={formData.avatar} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={64} className="text-gray-200" />
                                )}
                                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex flex-col items-center justify-center text-white text-[10px] font-black uppercase tracking-widest">
                                    <Camera size={24} className="mb-1" />
                                    Update Avatar
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                </label>
                            </div>
                        </div>
                        <div className="absolute bottom-2 right-2 w-8 h-8 rounded-xl bg-emerald-500 border-4 border-white flex items-center justify-center shadow-lg">
                            <Zap size={14} className="text-white fill-white" />
                        </div>
                    </div>

                    <div className="flex-1 mb-2">
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-4xl font-black text-gray-900 tracking-tight">{user.name}</h1>
                            <span className="px-3 py-1 bg-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 border border-gray-200">
                                UID-{profile?.id || 'ALPHA'}
                            </span>
                        </div>
                        {user.role?.toLowerCase() === 'student' ? (
                            <p className="text-emerald-600 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                                <Activity size={14} /> Global Rank: <span className="font-black italic">{profile?.recognition_tier || 'Operative'}</span>
                            </p>
                        ) : (
                            <p className="text-emerald-600 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                                <Activity size={14} /> Global Rank: <span className="font-black italic">Elite Tier Operative</span>
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-3 mb-2">
                        <button onClick={handleSave} disabled={saving} className="px-8 py-3.5 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:bg-gray-800 transition-all active:scale-95 flex items-center gap-3">
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            {saving ? 'Syncing...' : 'Save Service Record'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Tactical Stats */}
                <div className="space-y-6">
                    <GlassCard className="p-8 border-white/50 bg-white/40">
                        <h3 className="text-lg font-black text-gray-800 uppercase italic mb-6 tracking-tight flex items-center gap-3">
                            <Shield className="text-indigo-500" size={20} /> Identity Intel
                        </h3>
                        <div className="space-y-5">
                            <ProfileField icon={Mail} label="Communication Link" value={user.email} />
                            <ProfileField icon={Briefcase} label="Deployment Role" value={user.role?.toUpperCase()} />
                            <ProfileField icon={MapPin} label="Operational Sector" value={formData.location} />
                            <ProfileField icon={Calendar} label="Induction Date" value="September 2025" />
                        </div>
                    </GlassCard>

                    <GlassCard className="p-8 bg-gradient-to-br from-indigo-600 to-blue-700 border-none text-white shadow-xl shadow-indigo-600/20">
                        {user.role?.toLowerCase() === 'student' ? (
                            <PremiumProfileBadge 
                                tier={profile?.recognition_tier || 'Gold'} 
                                xp={profile?.final_score || 0}
                                followers="12.7k"
                                name={user.name}
                            />
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-xl font-black uppercase italic tracking-tight">Merit Status</h3>
                                    <Award size={24} className="opacity-50" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-white/10 rounded-2xl border border-white/10">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">XP Points</p>
                                        <p className="text-2xl font-black italic">{profile?.final_score || 0}</p>
                                    </div>
                                    <div className="p-4 bg-white/10 rounded-2xl border border-white/10">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Medals</p>
                                        <p className="text-2xl font-black italic">{profile?.medals?.length || 0}</p>
                                    </div>
                                </div>

                                {profile?.medals && profile.medals.length > 0 && (
                                    <div className="mt-6 flex flex-wrap gap-3">
                                        {profile.medals.map((medal, idx) => (
                                            <motion.div 
                                                key={idx}
                                                initial={{ scale: 0, rotate: -45 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                transition={{ type: "spring", stiffness: 300, delay: idx * 0.1 }}
                                                className={`flex-1 flex items-center justify-center p-3 rounded-2xl border shadow-xl ${
                                                    medal.toLowerCase() === 'gold' ? 'bg-gradient-to-br from-yellow-300 to-amber-500 border-yellow-200 text-yellow-900 shadow-yellow-500/50' :
                                                    medal.toLowerCase() === 'silver' ? 'bg-gradient-to-br from-gray-200 to-gray-400 border-gray-100 text-gray-800 shadow-gray-400/50' :
                                                    'bg-gradient-to-br from-amber-600 to-orange-700 border-amber-500 text-orange-50 shadow-orange-700/50'
                                                }`}
                                            >
                                                <Award size={20} />
                                                <span className="ml-2 text-[10px] font-black uppercase tracking-widest">{medal}</span>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}

                                <button className="w-full mt-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all">
                                    Review Achievements
                                </button>
                            </>
                        )}
                    </GlassCard>
                </div>

                {/* Edit Section */}
                <div className="lg:col-span-2">
                    <GlassCard className="p-10 border-white/60">
                         <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-2xl font-black text-gray-800 tracking-tight italic uppercase flex items-center gap-3">
                                    <Target className="text-emerald-500" size={24} /> Edit Identity Data
                                </h3>
                                <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">Maintain updated credentials for optimal system sync</p>
                            </div>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Operative Name</label>
                                <input 
                                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all"
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Communication Uplink</label>
                                <input 
                                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all"
                                    value={formData.email}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Department / HQ</label>
                                <input 
                                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all"
                                    placeholder="e.g. Computer Science Deployment"
                                    value={formData.department}
                                    onChange={e => setFormData({...formData, department: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Contact Signal</label>
                                <input 
                                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all"
                                    placeholder="+1 (555) 000-0000"
                                    value={formData.phone}
                                    onChange={e => setFormData({...formData, phone: e.target.value})}
                                />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Tactical Biography</label>
                                <textarea 
                                    rows={4}
                                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all resize-none"
                                    placeholder="Brief background summary..."
                                    value={formData.bio}
                                    onChange={e => setFormData({...formData, bio: e.target.value})}
                                />
                            </div>
                         </div>
                    </GlassCard>
                </div>

            </div>
        </motion.div>
    );
};

const ProfileField = ({ icon: Icon, label, value }) => (
    <div className="flex gap-4">
        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-gray-100 shadow-sm text-gray-400 shrink-0">
            <Icon size={16} />
        </div>
        <div className="min-w-0">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
            <p className="text-sm font-black text-gray-800 truncate leading-tight uppercase italic">{value || 'N/A'}</p>
        </div>
    </div>
);

export default Profile;
