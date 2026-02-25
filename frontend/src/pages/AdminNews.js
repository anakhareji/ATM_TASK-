import React, { useEffect, useMemo, useState } from 'react';
import AdminGlassLayout from '../components/layout/AdminGlassLayout';
import GlassCard from '../components/ui/GlassCard';
import Modal from '../components/ui/Modal';
import Toast from '../components/ui/Toast';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import PageHeader from '../components/ui/PageHeader';
import API from '../api/axios';
import { getErrorMessage } from '../utils/errorHelpers';

const AdminNews = () => {
  const role = localStorage.getItem('userRole');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ open: false, type: 'success', message: '' });
  const [q, setQ] = useState('');

  const [addOpen, setAddOpen] = useState(false);
  const [edit, setEdit] = useState({ open: false, id: null, title: '', content: '' });
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });

  const [form, setForm] = useState({ title: '', content: '' });

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await API.get('/news');
      setItems(res.data || []);
    } catch {
      setError('Failed to load news');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role !== 'admin') return;
    fetchNews();
  }, [role]);

  const handleAdd = async () => {
    try {
      await API.post('/news', { title: form.title, content: form.content });
      setToast({ open: true, type: 'success', message: 'News added successfully' });
      setAddOpen(false);
      setForm({ title: '', content: '' });
      fetchNews();
    } catch (e) {
      setToast({ open: true, type: 'error', message: getErrorMessage(e, 'Failed to add news') });
    }
  };

  const handleUpdate = async () => {
    try {
      await API.put(`/news/${edit.id}`, { title: edit.title, content: edit.content });
      setToast({ open: true, type: 'success', message: 'News updated successfully' });
      setEdit({ open: false, id: null, title: '', content: '' });
      fetchNews();
    } catch (e) {
      setToast({ open: true, type: 'error', message: getErrorMessage(e, 'Failed to update news') });
    }
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/news/${confirmDelete.id}`);
      setToast({ open: true, type: 'success', message: 'News deleted successfully' });
      setConfirmDelete({ open: false, id: null });
      fetchNews();
    } catch (e) {
      setToast({ open: true, type: 'error', message: getErrorMessage(e, 'Failed to delete news') });
    }
  };

  const togglePublish = async (id, published) => {
    try {
      await API.put(`/news/${id}`, { published: !published });
      setToast({ open: true, type: 'success', message: `News ${!published ? 'published' : 'unpublished'}` });
      fetchNews();
    } catch (e) {
      setToast({ open: true, type: 'error', message: getErrorMessage(e, 'Failed to toggle status') });
    }
  };

  const filtered = useMemo(() => {
    if (!q) return items;
    const s = q.toLowerCase();
    return items.filter(n => (n.title || '').toLowerCase().includes(s) || (n.content || '').toLowerCase().includes(s));
  }, [items, q]);

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
      <div className="space-y-6">
        <PageHeader title="Campus News" subtitle="Create and manage announcements">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search news..."
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          />
          <Button onClick={() => setAddOpen(true)}>Add News</Button>
        </PageHeader>

        {loading ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 animate-pulse">
            {[...Array(6)].map((_, i) => (<div key={i} className="h-32 bg-white rounded-xl border border-gray-200"></div>))}
          </div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <div className="w-24 h-24 bg-emerald-50 border border-emerald-100 rounded-full mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-700">No news yet</h3>
            <p className="text-sm text-gray-500">Create your first announcement</p>
            <div className="mt-4">
              <Button onClick={() => setAddOpen(true)}>Add News</Button>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((n) => (
              <GlassCard key={n.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{n.title}</h3>
                    <p className="text-sm text-gray-600 mt-2">{n.content}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={n.published ? 'primary' : 'default'}>{n.published ? 'Published' : 'Unpublished'}</Badge>
                    <button
                      onClick={() => togglePublish(n.id, n.published)}
                      className="text-sm font-medium text-emerald-700 hover:text-emerald-900 transition-colors"
                    >
                      {n.published ? 'Unpublish' : 'Publish'}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setEdit({ open: true, id: n.id, title: n.title, content: n.content })}>Edit</Button>
                    <Button variant="danger" size="sm" onClick={() => setConfirmDelete({ open: true, id: n.id })}>Delete</Button>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        <Modal
          open={addOpen}
          title="Add News"
          onClose={() => setAddOpen(false)}
          actions={<Button onClick={handleAdd}>Save</Button>}
        >
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
            />
            <textarea
              placeholder="Content"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
              rows={4}
            />
          </div>
        </Modal>

        <Modal
          open={edit.open}
          title="Edit News"
          onClose={() => setEdit({ open: false, id: null, title: '', content: '' })}
          actions={<Button onClick={handleUpdate}>Update</Button>}
        >
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Title"
              value={edit.title}
              onChange={(e) => setEdit({ ...edit, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
            />
            <textarea
              placeholder="Content"
              value={edit.content}
              onChange={(e) => setEdit({ ...edit, content: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
              rows={4}
            />
          </div>
        </Modal>

        <Modal
          open={confirmDelete.open}
          title="Delete News"
          onClose={() => setConfirmDelete({ open: false, id: null })}
          actions={<Button variant="danger" onClick={handleDelete}>Delete</Button>}
        >
          <p className="text-gray-700">Delete this news item?</p>
        </Modal>

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

export default AdminNews;
