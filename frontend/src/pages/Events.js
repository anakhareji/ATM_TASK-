import React, { useEffect, useState } from 'react';
import AdminEvents from './AdminEvents';
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
  const d = new Date(dtLocal);
  return d.toISOString();
};

const Events = () => {
  const role = localStorage.getItem('userRole');
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const userId = user?.id || user?.user_id;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ open: false, type: 'success', message: '' });

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', event_date: '' });
  const [confirmEnd, setConfirmEnd] = useState({ open: false, id: null });

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
    if (role !== 'admin') {
      fetchEvents();
    }
  }, [role]);

  if (role === 'admin') {
    return <AdminEvents />;
  }

  const handleRequestEvent = async () => {
    try {
      await API.post('/events/request', {
        title: form.title,
        description: form.description,
        event_date: toISO(form.event_date)
      });
      setToast({ open: true, type: 'success', message: 'Event request submitted' });
      setAddOpen(false);
      setForm({ title: '', description: '', event_date: '' });
      fetchEvents();
    } catch (e) {
      setToast({ open: true, type: 'error', message: getErrorMessage(e, 'Failed to request event') });
    }
  };

  const handleRequestEnd = async () => {
    try {
      await API.patch(`/events/${confirmEnd.id}/request-end`);
      setToast({ open: true, type: 'success', message: 'End event request sent to admin' });
      setConfirmEnd({ open: false, id: null });
      fetchEvents();
    } catch (e) {
      setToast({ open: true, type: 'error', message: getErrorMessage(e, 'Failed to request event end') });
    }
  };

  const myEvents = items.filter(ev => ev.host_student_id === userId);

  return (
    <div className="space-y-6 flex-1 w-full max-w-7xl mx-auto p-6 md:p-8">
      <PageHeader title="My Events" subtitle="Manage events you have requested to host">
        <Button onClick={() => setAddOpen(true)}>Request to Host Event</Button>
      </PageHeader>

      {loading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 animate-pulse">
          {[...Array(6)].map((_, i) => (<div key={i} className="h-32 bg-white rounded-xl border border-gray-200"></div>))}
        </div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : myEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <div className="w-24 h-24 bg-emerald-50 border border-emerald-100 rounded-full mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-700">No events requested</h3>
          <p className="text-sm text-gray-500">You haven't requested to host any events yet.</p>
          <div className="mt-4">
            <Button onClick={() => setAddOpen(true)}>Request to Host</Button>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {myEvents.map((ev) => {
            const upcoming = new Date(ev.event_date) > new Date();
            return (
              <GlassCard key={ev.id}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{ev.title}</h3>
                    <p className="text-sm text-gray-600 mt-2">{ev.description}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={ev.status === 'pending' || ev.status === 'end_requested' ? 'warning' : ev.status === 'held' ? 'danger' : ev.status === 'ended' ? 'default' : upcoming ? 'primary' : 'default'}>
                      {ev.status === 'pending' ? 'Pending Approval' : ev.status === 'end_requested' ? 'End Requested' : ev.status === 'rejected' ? 'Rejected' : ev.status === 'held' ? 'On Hold' : ev.status === 'ended' ? 'Ended' : upcoming ? 'Upcoming' : 'Past'}
                    </Badge>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mb-4 flex items-center gap-2">
                  <span className="font-semibold">Event Date:</span> 
                  {new Date(ev.event_date).toLocaleString()}
                </div>
                
                <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t pt-4">
                  {ev.status === 'approved' && upcoming && (
                    <Button 
                      variant="danger" 
                      size="sm" 
                      onClick={() => setConfirmEnd({ open: true, id: ev.id })}
                    >
                      End Event
                    </Button>
                  )}
                  {ev.status === 'end_requested' && (
                    <span className="text-xs text-gray-400 font-medium">Waiting for admin to end</span>
                  )}
                  {ev.status === 'pending' && (
                    <span className="text-xs text-gray-400 font-medium">Waiting for admin approval</span>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      <Modal
        open={addOpen}
        title="Request to Host Event"
        onClose={() => setAddOpen(false)}
        actions={<Button onClick={handleRequestEvent}>Submit Request</Button>}
      >
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Event Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
          />
          <textarea
            placeholder="Event Description & Details"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            rows={4}
          />
          <input
            type="datetime-local"
            value={form.event_date}
            onChange={(e) => setForm({ ...form, event_date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
      </Modal>

      <Modal
        open={confirmEnd.open}
        title="Request to End Event"
        onClose={() => setConfirmEnd({ open: false, id: null })}
        actions={<Button variant="danger" onClick={handleRequestEnd}>Yes, Request End</Button>}
      >
        <p className="text-gray-700">Are you sure you want to request to end this event? An admin must approve the request.</p>
      </Modal>

      <Toast
        open={toast.open}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ ...toast, open: false })}
      />
    </div>
  );
};

export default Events;
