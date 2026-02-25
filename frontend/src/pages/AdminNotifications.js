import React, { useEffect, useState } from 'react';
import AdminGlassLayout from '../components/layout/AdminGlassLayout';
import GlassCard from '../components/ui/GlassCard';
import Toast from '../components/ui/Toast';
import Button from '../components/ui/Button';
import PageHeader from '../components/ui/PageHeader';
import API from '../api/axios';

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
      <AdminGlassLayout>
        <div className="p-6">
          <p className="text-red-600 font-semibold">Unauthorized</p>
        </div>
      </AdminGlassLayout>
    );
  }

  return (
    <AdminGlassLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <PageHeader title="Notifications Center" subtitle="Send and review notifications" />

        <GlassCard className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800">Send Notification</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Target</label>
              <select
                value={form.target_type}
                onChange={(e) => setForm({ ...form, target_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Users</option>
                <option value="role">Specific Role</option>
                <option value="user">Specific User</option>
              </select>
            </div>
            {form.target_type === 'role' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}
            {form.target_type === 'user' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">User ID</label>
                <input
                  type="number"
                  value={form.user_id}
                  onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium text-gray-700">Message</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                rows={4}
              />
            </div>
          </div>
          <div>
            <Button onClick={handleSend}>Send</Button>
          </div>
        </GlassCard>

        <GlassCard className="overflow-x-auto">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Notification History</h3>
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[...Array(6)].map((_, i) => <div key={i} className="h-14 bg-white rounded-xl border border-gray-200"></div>)}
            </div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <div className="w-24 h-24 bg-emerald-50 border border-emerald-100 rounded-full mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-700">No notifications yet</h3>
              <p className="text-sm text-gray-500">Send your first notification</p>
            </div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-6 py-4 text-left">User ID</th>
                  <th className="px-6 py-4 text-left">Message</th>
                  <th className="px-6 py-4 text-center">Type</th>
                  <th className="px-6 py-4 text-left">Created At</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((n) => (
                  <tr key={n.id} className="hover:bg-gray-50 transition duration-200">
                    <td className="px-6 py-4 text-gray-700">{n.user_id}</td>
                    <td className="px-6 py-4 text-gray-700">{n.message}</td>
                    <td className="px-6 py-4 text-center">{n.type}</td>
                    <td className="px-6 py-4 text-gray-700">{new Date(n.created_at).toLocaleString()}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs border ${n.is_read ? 'bg-gray-50 text-gray-700 border-gray-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                        {n.is_read ? 'Read' : 'Unread'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        {!n.is_read && <Button size="sm" onClick={() => markRead(n.id)}>Mark Read</Button>}
                        <Button size="sm" variant="danger" onClick={() => deleteNotification(n.id)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </GlassCard>

        <Toast
          open={toast.open}
          type={toast.type}
          message={toast.message}
          onClose={() => setToast({ ...toast, open: false })}
        />
      </div>
    </AdminGlassLayout>
  );
};

export default AdminNotifications;
