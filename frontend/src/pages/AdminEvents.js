import React, { useEffect, useState } from 'react';
import AdminGlassLayout from '../components/layout/AdminGlassLayout';
import GlassCard from '../components/ui/GlassCard';
import Modal from '../components/ui/Modal';
import Toast from '../components/ui/Toast';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import PageHeader from '../components/ui/PageHeader';
import API from '../api/axios';
import { getErrorMessage } from '../utils/errorHelpers';

const toISO = (dtLocal) => {
  if (!dtLocal) return null;
  // dtLocal: "YYYY-MM-DDTHH:MM"
  const d = new Date(dtLocal);
  return d.toISOString();
};

const fromISOToLocal = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => (n < 10 ? '0' + n : n);
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
};

const AdminEvents = () => {
  const role = localStorage.getItem('userRole');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ open: false, type: 'success', message: '' });

  const [addOpen, setAddOpen] = useState(false);
  const [edit, setEdit] = useState({ open: false, id: null, title: '', description: '', event_date: '' });
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });

  const [form, setForm] = useState({ title: '', description: '', event_date: '' });

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await API.get('/events');
      setItems(res.data || []);
    } catch {
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role !== 'admin') return;
    fetchEvents();
  }, [role]);

  const handleAdd = async () => {
    try {
      await API.post('/events', {
        title: form.title,
        description: form.description,
        event_date: toISO(form.event_date)
      });
      setToast({ open: true, type: 'success', message: 'Event added successfully' });
      setAddOpen(false);
      setForm({ title: '', description: '', event_date: '' });
      fetchEvents();
    } catch (e) {
      setToast({ open: true, type: 'error', message: getErrorMessage(e, 'Failed to add event') });
    }
  };
  const handleUpdate = async () => {
    try {
      await API.put(`/events/${edit.id}`, {
        title: edit.title,
        description: edit.description,
        event_date: edit.event_date ? toISO(edit.event_date) : undefined
      });
      setToast({ open: true, type: 'success', message: 'Event updated successfully' });
      setEdit({ open: false, id: null, title: '', description: '', event_date: '' });
      fetchEvents();
    } catch (e) {
      setToast({ open: true, type: 'error', message: getErrorMessage(e, 'Failed to update event') });
    }
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/events/${confirmDelete.id}`);
      setToast({ open: true, type: 'success', message: 'Event deleted successfully' });
      setConfirmDelete({ open: false, id: null });
      fetchEvents();
    } catch (e) {
      setToast({ open: true, type: 'error', message: getErrorMessage(e, 'Failed to delete event') });
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
      <div className="space-y-6">
        <PageHeader title="Events Management" subtitle="Create and manage campus events">
          <Button onClick={() => setAddOpen(true)}>Add Event</Button>
        </PageHeader>

        {loading ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 animate-pulse">
            {[...Array(6)].map((_, i) => (<div key={i} className="h-32 bg-white rounded-xl border border-gray-200"></div>))}
          </div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <div className="w-24 h-24 bg-emerald-50 border border-emerald-100 rounded-full mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-700">No events yet</h3>
            <p className="text-sm text-gray-500">Create your first event</p>
            <div className="mt-4">
              <Button onClick={() => setAddOpen(true)}>Add Event</Button>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {items.map((ev) => {
              const upcoming = new Date(ev.event_date) > new Date();
              return (
                <GlassCard key={ev.id}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">{ev.title}</h3>
                      <p className="text-sm text-gray-600 mt-2">{ev.description}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={upcoming ? 'primary' : 'default'}>{upcoming ? 'Upcoming' : 'Past'}</Badge>
                      <p className="text-xs text-gray-500 mt-2">{new Date(ev.event_date).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setEdit({ open: true, id: ev.id, title: ev.title, description: ev.description, event_date: fromISOToLocal(ev.event_date) })}
                    >
                      Edit
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => setConfirmDelete({ open: true, id: ev.id })}>Delete</Button>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}

        <Modal
          open={addOpen}
          title="Add Event"
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
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
              rows={3}
            />
            <input
              type="datetime-local"
              value={form.event_date}
              onChange={(e) => setForm({ ...form, event_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </Modal>

        <Modal
          open={edit.open}
          title="Edit Event"
          onClose={() => setEdit({ open: false, id: null, title: '', description: '', event_date: '' })}
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
              placeholder="Description"
              value={edit.description}
              onChange={(e) => setEdit({ ...edit, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
              rows={3}
            />
            <input
              type="datetime-local"
              value={edit.event_date}
              onChange={(e) => setEdit({ ...edit, event_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </Modal>

        <Modal
          open={confirmDelete.open}
          title="Delete Event"
          onClose={() => setConfirmDelete({ open: false, id: null })}
          actions={<Button variant="danger" onClick={handleDelete}>Delete</Button>}
        >
          <p className="text-gray-700">Delete this event?</p>
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

export default AdminEvents;
