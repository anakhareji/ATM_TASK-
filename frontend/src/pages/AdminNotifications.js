import React, { useEffect, useState } from 'react';
import GlassCard from '../components/ui/GlassCard';
import Toast from '../components/ui/Toast';
import PageHeader from '../components/ui/PageHeader';
import API from '../api/axios';
import { Send, Bell, Trash2, CheckCircle, Mail, User, AlertCircle, Info } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminNotifications = () => {
  const role = localStorage.getItem('userRole');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ open: false, type: 'success', message: '' });

  const [form, setForm] = useState({
    target_type: 'all',
    role: 'student',
    user_id: '',
    message: ''
  });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await API.get('/notifications');
      setItems(res.data || []);
    } catch {
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role !== 'admin') return;
    fetchAll();
  }, [role]);

  const handleSend = async () => {
    try {
      const data = {
        target_type: form.target_type,
        message: form.message
      };
      if (form.target_type === 'role') data.role = form.role;
      if (form.target_type === 'user') data.user_id = parseInt(form.user_id);

      await API.post('/notifications', data);
      setToast({ open: true, type: 'success', message: 'Notification sent' });
      setForm({ target_type: 'all', role: 'student', user_id: '', message: '' });
      fetchAll();
    } catch {
      setToast({ open: true, type: 'error', message: 'Failed to send notification' });
    }
  };

  const markRead = async (id) => {
    try {
      await API.patch(`/notifications/${id}/read`);
      fetchAll();
    } catch {
      setToast({ open: true, type: 'error', message: 'Failed to mark as read' });
    }
  };

  const deleteNotification = async (id) => {
    try {
      await API.delete(`/notifications/${id}`);
      fetchAll();
    } catch {
      setToast({ open: true, type: 'error', message: 'Failed to delete notification' });
    }
  };

  if (role !== 'admin') {
    return (
      <div className="p-6">
        <p className="text-red-600 font-semibold">Unauthorized</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12 font-sans">
      <div className="flex items-center gap-3">
         <div className="p-3 bg-primary/10 rounded-2xl">
            <Bell size={28} className="text-primary" />
         </div>
         <div>
            <h1 className="text-3xl font-black text-secondary tracking-tight">Notification Center</h1>
            <p className="text-sm font-bold text-secondary-muted uppercase tracking-widest mt-1">Broadcast messages & manage history</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Send Notification Card */}
        <div className="lg:col-span-4 space-y-6">
          <GlassCard className="p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
               <Mail size={120} className="text-primary" />
            </div>
            <div className="relative z-10">
              <h3 className="text-xl font-black text-secondary flex items-center gap-2 mb-6">
                 New Broadcast
              </h3>
              
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-secondary-muted uppercase tracking-widest">Target Audience</label>
                  <select
                    value={form.target_type}
                    onChange={(e) => setForm({ ...form, target_type: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-secondary focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
                  >
                    <option value="all">Broadcast to All Users</option>
                    <option value="role">Specific Role Group</option>
                    <option value="user">Specific Operative (ID)</option>
                  </select>
                </div>

                {form.target_type === 'role' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
                    <label className="text-[10px] font-black text-secondary-muted uppercase tracking-widest">Select Role</label>
                    <select
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-secondary focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
                    >
                      <option value="student">All Students</option>
                      <option value="faculty">All Faculty</option>
                      <option value="admin">All Admins</option>
                    </select>
                  </motion.div>
                )}

                {form.target_type === 'user' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
                    <label className="text-[10px] font-black text-secondary-muted uppercase tracking-widest">Target User ID</label>
                    <input
                      type="number"
                      placeholder="e.g. 42"
                      value={form.user_id}
                      onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-secondary focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </motion.div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-secondary-muted uppercase tracking-widest">Transmission Payload</label>
                  <textarea
                    placeholder="Enter your message here..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-secondary focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none custom-scrollbar"
                    rows={5}
                  />
                </div>

                <button 
                  onClick={handleSend}
                  disabled={!form.message.trim() || (form.target_type === 'user' && !form.user_id)}
                  className="w-full mt-4 py-4 bg-primary text-white rounded-2xl text-[12px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary-hover disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
                >
                  <Send size={16} /> Transmit
                </button>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* History Table */}
        <div className="lg:col-span-8">
          <GlassCard className="p-0 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-white/50">
               <h3 className="text-xl font-black text-secondary">Transmission Log</h3>
               <div className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-bold text-secondary-muted">{items.length} Records</div>
            </div>
            
            <div className="overflow-x-auto custom-scrollbar">
              {loading ? (
                <div className="p-8 space-y-4 animate-pulse">
                  {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-50 rounded-2xl"></div>)}
                </div>
              ) : error ? (
                <div className="p-12 text-center text-red-500 font-bold">{error}</div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-sm">
                    <Bell size={32} className="text-gray-300" />
                  </div>
                  <h3 className="text-lg font-black text-secondary">No Transmissions</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest mt-1">Broadcast history is empty</p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead className="bg-[#FBFCFD] sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary-muted">Target</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary-muted w-1/2">Payload</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary-muted">Timestamp</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary-muted text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 font-bold text-sm bg-white/40">
                    {items.map((n) => (
                      <tr key={n.id} className="hover:bg-gray-50/80 transition duration-200 group">
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                n.type === 'system' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                              }`}>
                                 {n.type === 'system' ? <AlertCircle size={14}/> : <Info size={14}/>}
                              </div>
                              <div className="flex flex-col">
                                 <span className="text-secondary">{n.user_id ? `User #${n.user_id}` : 'Global'}</span>
                                 <span className="text-[9px] text-secondary-muted uppercase tracking-widest line-clamp-1">{n.type}</span>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex flex-col">
                              <span className="text-secondary group-hover:text-primary transition-colors line-clamp-2">{n.message}</span>
                              <div className="flex gap-2 mt-1">
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${n.is_read ? 'bg-gray-50 text-gray-400 border-gray-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                                  {n.is_read ? 'Read' : 'Unread'}
                                </span>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-secondary-muted">
                           {new Date(n.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                            {!n.is_read && (
                              <button onClick={() => markRead(n.id)} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-colors" title="Mark Read">
                                <CheckCircle size={18} />
                              </button>
                            )}
                            <button onClick={() => deleteNotification(n.id)} className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors" title="Delete Log">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </GlassCard>
        </div>
      </div>

      <Toast
        open={toast.open}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ ...toast, open: false })}
      />
    </div>
  );
};

export default AdminNotifications;
