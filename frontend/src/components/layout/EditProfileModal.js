import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Camera, Mail, Save, Loader2 } from 'lucide-react';
import API from '../../api/axios';
import toast from 'react-hot-toast';

const EditProfileModal = ({ isOpen, onClose, user, onUpdate }) => {
    const [formData, setFormData] = useState({
        name: user.name || '',
        email: user.email || '',
        avatar: user.avatar || ''
    });
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, avatar: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await API.put(`/users/${user.id || 'me'}`, formData);
            
            toast.success('Profile updated successfully');
            
            // Update local storage
            const updatedUser = { ...user, ...formData };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            localStorage.setItem('userName', formData.name);
            if (formData.avatar) localStorage.setItem('userAvatar', formData.avatar);
            
            if (onUpdate) onUpdate(updatedUser);
            onClose();
            // Dispatch event so sidebar and navbar update immediately
            window.dispatchEvent(new Event('profileUpdated'));
        } catch (err) {
            toast.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
                />
                
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden"
                >
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <h2 className="text-xl font-black text-gray-800 tracking-tight">Edit Profile</h2>
                        <button onClick={onClose} className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors shadow-sm">
                            <X size={18} className="text-gray-500" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Avatar */}
                        <div className="flex flex-col items-center gap-4">
                            <label className="relative group cursor-pointer block">
                                <div className="w-24 h-24 rounded-3xl bg-gray-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                                    {formData.avatar ? (
                                        <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={40} className="text-gray-400" />
                                    )}
                                </div>
                                <div className="absolute inset-0 bg-black/40 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Camera size={24} className="text-white" />
                                </div>
                                <input 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*" 
                                    onChange={handleImageUpload} 
                                />
                            </label>
                        </div>

                        {/* Name */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Full Name</label>
                            <div className="relative">
                                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input 
                                    type="text" 
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm font-bold text-gray-800"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Email Address</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input 
                                    type="email" 
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm text-gray-800"
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-4 flex gap-3">
                            <button type="button" onClick={onClose}
                                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors">
                                Cancel
                            </button>
                            <button type="submit" disabled={loading}
                                className="flex-1 py-3 rounded-xl bg-orange-500 text-white font-black text-sm uppercase tracking-widest hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30">
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                Save Changes
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default EditProfileModal;
