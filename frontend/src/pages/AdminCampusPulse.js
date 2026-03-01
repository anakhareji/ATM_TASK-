import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Newspaper, Calendar, Search, Plus, Edit3, Trash2,
  CheckCircle, XCircle, PauseCircle, PlayCircle, Clock,
  Bell, MapPin, Tag, AlertCircle, RefreshCw, Image, Users, Phone, X, ChevronRight
} from 'lucide-react';
import AdminGlassLayout from '../components/layout/AdminGlassLayout';
import GlassCard from '../components/ui/GlassCard';
import Modal from '../components/ui/Modal';
import Toast from '../components/ui/Toast';
import Button from '../components/ui/Button';
import API from '../api/axios';
import { getErrorMessage } from '../utils/errorHelpers';

const BACKEND = 'http://localhost:8000';

const toISO = (dtLocal) => { if (!dtLocal) return null; return new Date(dtLocal).toISOString(); };
const fromISOToLocal = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = n => (n < 10 ? '0' + n : n);
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const STATUS_META = {
  pending:       { label: 'Pending',       color: 'bg-amber-50  text-amber-600  border-amber-200'  },
  approved:      { label: 'Approved',      color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected:      { label: 'Rejected',      color: 'bg-red-50    text-red-600    border-red-200'    },
  held:          { label: 'On Hold',       color: 'bg-orange-50 text-orange-600 border-orange-200' },
  end_requested: { label: 'End Requested', color: 'bg-purple-50 text-purple-600 border-purple-200' },
  ended:         { label: 'Ended',         color: 'bg-gray-100  text-gray-500   border-gray-200'   },
};

const StatusBadge = ({ status }) => {
  const meta = STATUS_META[status] || { label: 'Active', color: 'bg-gray-100 text-gray-500 border-gray-200' };
  return <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${meta.color}`}>{meta.label}</span>;
};

// ─── Event form default ───────────────────────────────────────────────────────
const EVENT_FORM_DEFAULT = { title: '', description: '', event_date: '', location: '', organizer: '', contact_info: '', tags: '', max_participants: '' };

// ─── Main Component ──────────────────────────────────────────────────────────
const AdminCampusPulse = () => {
  const role = localStorage.getItem('userRole');
  const [activeTab, setActiveTab] = useState('news');
  const [searchTerm, setSearchTerm] = useState('');

  // NEWS
  const [news, setNews]             = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [addNewsOpen, setAddNewsOpen] = useState(false);
  const [editNews, setEditNews]       = useState({ open: false, id: null, title: '', content: '' });
  const [deleteNews, setDeleteNews]   = useState({ open: false, id: null });
  const [newsForm, setNewsForm]       = useState({ title: '', content: '' });

  // EVENTS
  const [events, setEvents]             = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [addEventOpen, setAddEventOpen]   = useState(false);
  const [editEventModal, setEditEventModal] = useState({ open: false, id: null, ...EVENT_FORM_DEFAULT });
  const [deleteEvent, setDeleteEvent]     = useState({ open: false, id: null });
  const [eventForm, setEventForm]         = useState(EVENT_FORM_DEFAULT);
  const [imageFile, setImageFile]         = useState(null);
  const [imagePreview, setImagePreview]   = useState(null);
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);

  // Event detail view
  const [detailEvent, setDetailEvent] = useState(null);

  // TOAST
  const [toast, setToast] = useState({ open: false, type: 'success', message: '' });
  const showToast = (type, message) => setToast({ open: true, type, message });

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchNews = async () => {
    setNewsLoading(true);
    try { const r = await API.get('/news'); setNews(r.data || []); }
    catch { showToast('error', 'Failed to load news'); }
    finally { setNewsLoading(false); }
  };

  const fetchEvents = async () => {
    setEventsLoading(true);
    try { const r = await API.get('/events'); setEvents(r.data || []); }
    catch { showToast('error', 'Failed to load events'); }
    finally { setEventsLoading(false); }
  };

  useEffect(() => { if (role !== 'admin') return; fetchNews(); fetchEvents(); }, []);

  // ── Image handlers ──────────────────────────────────────────────────────────
  const handleImageChange = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (!file) return;
    if (isEdit) { setEditImageFile(file); setEditImagePreview(URL.createObjectURL(file)); }
    else        { setImageFile(file);     setImagePreview(URL.createObjectURL(file)); }
  };

  const buildEventFD = (form, imgFile) => {
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
    if (imgFile) fd.append('image', imgFile);
    return fd;
  };

  // ── NEWS Handlers ───────────────────────────────────────────────────────────
  const handleAddNews = async () => {
    try {
      await API.post('/news', { title: newsForm.title, content: newsForm.content });
      showToast('success', 'News published'); setAddNewsOpen(false); setNewsForm({ title: '', content: '' }); fetchNews();
    } catch (e) { showToast('error', getErrorMessage(e, 'Failed to add news')); }
  };
  const handleUpdateNews = async () => {
    try {
      await API.put(`/news/${editNews.id}`, { title: editNews.title, content: editNews.content });
      showToast('success', 'News updated'); setEditNews({ open: false, id: null, title: '', content: '' }); fetchNews();
    } catch (e) { showToast('error', getErrorMessage(e, 'Failed to update news')); }
  };
  const handleDeleteNews = async () => {
    try {
      await API.delete(`/news/${deleteNews.id}`);
      showToast('success', 'News deleted'); setDeleteNews({ open: false, id: null }); fetchNews();
    } catch (e) { showToast('error', getErrorMessage(e, 'Failed to delete news')); }
  };
  const handleTogglePublish = async (id, published) => {
    try { await API.put(`/news/${id}`, { published: !published }); showToast('success', `News ${!published ? 'published' : 'unpublished'}`); fetchNews(); }
    catch (e) { showToast('error', getErrorMessage(e, 'Toggle failed')); }
  };

  // ── EVENTS Handlers ─────────────────────────────────────────────────────────
  const handleAddEvent = async () => {
    try {
      const fd = buildEventFD(eventForm, imageFile);
      await API.post('/events', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      showToast('success', 'Event created'); setAddEventOpen(false); setEventForm(EVENT_FORM_DEFAULT); setImageFile(null); setImagePreview(null); fetchEvents();
    } catch (e) { showToast('error', getErrorMessage(e, 'Failed to add event')); }
  };

  const handleUpdateEvent = async () => {
    try {
      const { id, open, ...fields } = editEventModal;
      const fd = buildEventFD(fields, editImageFile);
      await API.put(`/events/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      showToast('success', 'Event updated'); setEditEventModal({ open: false, id: null, ...EVENT_FORM_DEFAULT }); setEditImageFile(null); setEditImagePreview(null); fetchEvents();
    } catch (e) { showToast('error', getErrorMessage(e, 'Failed to update event')); }
  };

  const handleDeleteEvent = async () => {
    try {
      await API.delete(`/events/${deleteEvent.id}`);
      showToast('success', 'Event deleted'); setDeleteEvent({ open: false, id: null }); fetchEvents();
    } catch (e) { showToast('error', getErrorMessage(e, 'Failed to delete event')); }
  };

  const handleEventAction = async (id, action, successMsg) => {
    try { await API.patch(`/events/${id}/${action}`); showToast('success', successMsg); fetchEvents(); }
    catch (e) { showToast('error', getErrorMessage(e, 'Action failed')); }
  };

  // ── Filters ─────────────────────────────────────────────────────────────────
  const filteredNews = useMemo(() => {
    if (!searchTerm) return news;
    const s = searchTerm.toLowerCase();
    return news.filter(n => (n.title||'').toLowerCase().includes(s) || (n.content||'').toLowerCase().includes(s));
  }, [news, searchTerm]);

  const filteredEvents = useMemo(() => {
    if (!searchTerm) return events;
    const s = searchTerm.toLowerCase();
    return events.filter(ev => (ev.title||'').toLowerCase().includes(s) || (ev.description||'').toLowerCase().includes(s));
  }, [events, searchTerm]);

  if (role !== 'admin') {
    return <AdminGlassLayout><div className="flex items-center justify-center py-40"><p className="text-red-600 font-bold">Access Denied — Admins Only</p></div></AdminGlassLayout>;
  }

  return (
    <AdminGlassLayout>
      <div className="space-y-8">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <div>
            <div className="flex items-center gap-3 mb-1">
              {activeTab === 'news'
                ? <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center"><Newspaper className="text-indigo-600" size={22} /></div>
                : <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center"><Calendar className="text-emerald-600" size={22} /></div>}
              <h1 className="text-2xl font-black text-gray-800 tracking-tight">Campus Pulse</h1>
              <span className="ml-2 px-2.5 py-1 bg-gray-100 text-gray-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-gray-200">Admin Control</span>
            </div>
            <p className="text-sm text-gray-400 font-medium">Full editorial control over news and campus events</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-stretch sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input type="text" placeholder={`Search ${activeTab}…`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-300 w-full sm:w-56 font-medium" />
            </div>
            <div className="flex bg-gray-100 p-1 rounded-2xl">
              {['news', 'events'].map(tab => (
                <button key={tab} onClick={() => { setActiveTab(tab); setSearchTerm(''); }}
                  className={`flex-1 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white shadow text-indigo-600' : 'text-gray-400 hover:text-gray-700'}`}>
                  {tab}
                </button>
              ))}
            </div>
            <button onClick={() => activeTab === 'news' ? setAddNewsOpen(true) : setAddEventOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-emerald-500 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:opacity-90 transition-opacity whitespace-nowrap">
              <Plus size={16} /> {activeTab === 'news' ? 'Add News' : 'Add Event'}
            </button>
            <button onClick={() => activeTab === 'news' ? fetchNews() : fetchEvents()}
              className="p-2.5 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors border border-gray-200" title="Refresh">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* ── Content ── */}
        <AnimatePresence mode="wait">
          {(activeTab === 'news' ? newsLoading : eventsLoading) ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 animate-pulse">
              {[...Array(6)].map((_, i) => <div key={i} className="h-56 bg-white rounded-2xl border border-gray-100" />)}
            </motion.div>
          ) : activeTab === 'news' ? (
            <motion.div key="news-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {filteredNews.length === 0
                ? <EmptyState icon={<Newspaper size={48} className="text-gray-200" />} label="No news yet" sub="Create your first announcement." onCreate={() => setAddNewsOpen(true)} ctaLabel="Add News" />
                : <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredNews.map(item => (
                      <NewsAdminCard key={item.id} item={item}
                        onEdit={() => setEditNews({ open: true, id: item.id, title: item.title, content: item.content })}
                        onDelete={() => setDeleteNews({ open: true, id: item.id })}
                        onTogglePublish={() => handleTogglePublish(item.id, item.published)} />
                    ))}
                  </div>
              }
            </motion.div>
          ) : (
            <motion.div key="events-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {filteredEvents.length === 0
                ? <EmptyState icon={<Calendar size={48} className="text-gray-200" />} label="No events yet" sub="Create a new campus event." onCreate={() => setAddEventOpen(true)} ctaLabel="Add Event" />
                : <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredEvents.map(ev => (
                      <EventAdminCard key={ev.id} ev={ev}
                        onView={() => setDetailEvent(ev)}
                        onEdit={() => { setEditEventModal({ open: true, id: ev.id, title: ev.title, description: ev.description, event_date: fromISOToLocal(ev.event_date), location: ev.location||'', organizer: ev.organizer||'', contact_info: ev.contact_info||'', tags: ev.tags||'', max_participants: ev.max_participants||'' }); setEditImagePreview(ev.image_url ? `${BACKEND}${ev.image_url}` : null); }}
                        onDelete={() => setDeleteEvent({ open: true, id: ev.id })}
                        onApprove={() => handleEventAction(ev.id, 'approve', 'Event approved')}
                        onReject={() => handleEventAction(ev.id, 'reject', 'Event rejected')}
                        onHold={() => handleEventAction(ev.id, 'hold', 'Event placed on hold')}
                        onUnhold={() => handleEventAction(ev.id, 'unhold', 'Event resumed')}
                        onApproveEnd={() => handleEventAction(ev.id, 'approve-end', 'Event ended')} />
                    ))}
                  </div>
              }
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Event Detail Modal ── */}
        <AnimatePresence>
          {detailEvent && (
            <EventDetailModal ev={detailEvent} onClose={() => setDetailEvent(null)} isAdmin />
          )}
        </AnimatePresence>

        {/* ── NEWS Modals ── */}
        <Modal open={addNewsOpen} title="Publish News Announcement" onClose={() => setAddNewsOpen(false)} actions={<Button onClick={handleAddNews}>Publish</Button>}>
          <div className="space-y-3">
            <input type="text" placeholder="Headline / Title" value={newsForm.title} onChange={e => setNewsForm({ ...newsForm, title: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none font-medium" />
            <textarea placeholder="Content / Body" value={newsForm.content} onChange={e => setNewsForm({ ...newsForm, content: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none font-medium" rows={5} />
          </div>
        </Modal>

        <Modal open={editNews.open} title="Edit News" onClose={() => setEditNews({ open: false, id: null, title: '', content: '' })} actions={<Button onClick={handleUpdateNews}>Update</Button>}>
          <div className="space-y-3">
            <input type="text" placeholder="Title" value={editNews.title} onChange={e => setEditNews({ ...editNews, title: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none font-medium" />
            <textarea placeholder="Content" value={editNews.content} onChange={e => setEditNews({ ...editNews, content: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none font-medium" rows={5} />
          </div>
        </Modal>

        <Modal open={deleteNews.open} title="Delete News" onClose={() => setDeleteNews({ open: false, id: null })} actions={<Button variant="danger" onClick={handleDeleteNews}>Yes, Delete</Button>}>
          <p className="text-gray-600 text-sm">Permanently delete this news item?</p>
        </Modal>

        {/* ── EVENT Modals ── */}
        <Modal open={addEventOpen} title="Create Campus Event" onClose={() => { setAddEventOpen(false); setImageFile(null); setImagePreview(null); }} actions={<Button onClick={handleAddEvent}>Create Event</Button>}>
          <EventFormFields form={eventForm} setForm={setEventForm} imagePreview={imagePreview} onImageChange={e => handleImageChange(e, false)} onImageRemove={() => { setImageFile(null); setImagePreview(null); }} />
        </Modal>

        <Modal open={editEventModal.open} title="Edit Event" onClose={() => { setEditEventModal({ open: false, id: null, ...EVENT_FORM_DEFAULT }); setEditImageFile(null); setEditImagePreview(null); }} actions={<Button onClick={handleUpdateEvent}>Update Event</Button>}>
          <EventFormFields form={editEventModal} setForm={(v) => setEditEventModal(p => ({ ...p, ...v }))} imagePreview={editImagePreview} onImageChange={e => handleImageChange(e, true)} onImageRemove={() => { setEditImageFile(null); setEditImagePreview(null); }} />
        </Modal>

        <Modal open={deleteEvent.open} title="Delete Event" onClose={() => setDeleteEvent({ open: false, id: null })} actions={<Button variant="danger" onClick={handleDeleteEvent}>Yes, Delete</Button>}>
          <p className="text-gray-600 text-sm">Permanently delete this event?</p>
        </Modal>

        <Toast open={toast.open} type={toast.type} message={toast.message} onClose={() => setToast({ ...toast, open: false })} />
      </div>
    </AdminGlassLayout>
  );
};

// ─── Reusable Event Form Fields ───────────────────────────────────────────────
const EventFormFields = ({ form, setForm, imagePreview, onImageChange, onImageRemove }) => (
  <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
    {/* Image */}
    <div>
      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Event Brochure / Banner</label>
      {imagePreview
        ? <div className="relative"><img src={imagePreview} alt="preview" className="w-full h-40 object-cover rounded-2xl border border-gray-200" />
            <button type="button" onClick={onImageRemove} className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow border border-gray-200"><X size={14} /></button></div>
        : <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
            <Image size={22} className="text-gray-400 mb-1" /><span className="text-xs text-gray-400 font-semibold">Upload Image / Brochure</span>
            <input type="file" accept="image/*" className="hidden" onChange={onImageChange} />
          </label>
      }
    </div>

    <input type="text" placeholder="Event Title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 outline-none font-medium" />
    <textarea placeholder="Event Description *" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 outline-none font-medium" rows={3} />

    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Date & Time *</label>
        <input type="datetime-local" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 outline-none font-medium" />
      </div>
      <input type="text" placeholder="Venue / Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 outline-none font-medium self-end" />
    </div>

    <div className="grid grid-cols-2 gap-3">
      <input type="text" placeholder="Organizer / Club" value={form.organizer} onChange={e => setForm({ ...form, organizer: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 outline-none font-medium" />
      <input type="text" placeholder="Contact (email/phone)" value={form.contact_info} onChange={e => setForm({ ...form, contact_info: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 outline-none font-medium" />
    </div>

    <div className="grid grid-cols-2 gap-3">
      <input type="text" placeholder="Tags (comma separated)" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 outline-none font-medium" />
      <input type="number" placeholder="Max Participants" value={form.max_participants} onChange={e => setForm({ ...form, max_participants: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 outline-none font-medium" />
    </div>
  </div>
);

// ─── EmptyState ───────────────────────────────────────────────────────────────
const EmptyState = ({ icon, label, sub, onCreate, ctaLabel }) => (
  <div className="flex flex-col items-center justify-center py-32 bg-white/50 rounded-3xl border border-dashed border-gray-200">
    <div className="mb-4">{icon}</div>
    <h3 className="text-lg font-black text-gray-400 uppercase tracking-wide">{label}</h3>
    <p className="text-sm text-gray-300 mt-1 mb-6">{sub}</p>
    <button onClick={onCreate} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest shadow hover:bg-indigo-700 transition-colors">
      <Plus size={14} /> {ctaLabel}
    </button>
  </div>
);

// ─── News Admin Card ──────────────────────────────────────────────────────────
const NewsAdminCard = ({ item, onEdit, onDelete, onTogglePublish }) => (
  <GlassCard className="group flex flex-col gap-4 hover:border-indigo-200 hover:shadow-lg transition-all duration-300 rounded-3xl">
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0"><Newspaper size={18} className="text-indigo-600" /></div>
        <div>
          <h3 className="font-black text-gray-800 leading-tight text-sm">{item.title}</h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{new Date(item.created_at).toLocaleDateString()}</p>
        </div>
      </div>
      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${item.published ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
        {item.published ? 'Published' : 'Draft'}
      </span>
    </div>
    <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 border-t border-gray-50 pt-3">{item.content}</p>
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3 mt-auto">
      <button onClick={onTogglePublish} className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border transition-colors ${item.published ? 'border-orange-200 text-orange-600 hover:bg-orange-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}>
        {item.published ? <><AlertCircle size={12} /> Unpublish</> : <><CheckCircle size={12} /> Publish</>}
      </button>
      <div className="flex gap-2">
        <button onClick={onEdit} className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors"><Edit3 size={14} /></button>
        <button onClick={onDelete} className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"><Trash2 size={14} /></button>
      </div>
    </div>
  </GlassCard>
);

// ─── Event Admin Card ─────────────────────────────────────────────────────────
const EventAdminCard = ({ ev, onView, onEdit, onDelete, onApprove, onReject, onHold, onUnhold, onApproveEnd }) => {
  const isUpcoming = new Date(ev.event_date) > new Date();
  const imgSrc = ev.image_url ? `${BACKEND}${ev.image_url}` : null;
  return (
    <GlassCard className="group p-0 overflow-hidden flex flex-col hover:border-emerald-200 hover:shadow-lg transition-all duration-300 rounded-3xl cursor-pointer" onClick={onView}>
      {/* Banner */}
      {imgSrc
        ? <img src={imgSrc} alt={ev.title} className="w-full h-36 object-cover" />
        : <div className="w-full h-24 bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
            <Calendar size={32} className="text-white/50" />
          </div>
      }
      <div className="p-5 flex flex-col flex-1 gap-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-black text-gray-800 leading-tight text-sm mb-0.5">{ev.title}</h3>
            {ev.organizer && <p className="text-[10px] text-indigo-500 font-bold">{ev.organizer}</p>}
          </div>
          <StatusBadge status={ev.status} />
        </div>
        <p className="text-xs text-gray-500 line-clamp-2">{ev.description}</p>
        <div className="flex items-center gap-3 text-xs text-gray-400 font-semibold">
          <span className="flex items-center gap-1"><Clock size={11} className="text-emerald-500" />{new Date(ev.event_date).toLocaleDateString()}</span>
          <span className="flex items-center gap-1"><MapPin size={11} className="text-emerald-500" />{ev.location || 'Campus'}</span>
          {ev.max_participants && <span className="flex items-center gap-1"><Users size={11} className="text-purple-500" />{ev.max_participants}</span>}
        </div>
        {ev.host_student_id && <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Student Hosted</span>}

        {/* Lifecycle + edit/delete */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-gray-100 pt-3" onClick={e => e.stopPropagation()}>
          {ev.status === 'pending' && <>
            <button onClick={onApprove} className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-black uppercase rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"><CheckCircle size={11} />Approve</button>
            <button onClick={onReject}  className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-black uppercase rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"><XCircle size={11} />Reject</button>
          </>}
          {ev.status === 'approved' && <button onClick={onHold}   className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-black uppercase rounded-lg bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100"><PauseCircle size={11} />Hold</button>}
          {ev.status === 'held'     && <button onClick={onUnhold} className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-black uppercase rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"><PlayCircle size={11} />Resume</button>}
          {ev.status === 'end_requested' && <button onClick={onApproveEnd} className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-black uppercase rounded-lg bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100"><CheckCircle size={11} />Approve End</button>}
          <div className="ml-auto flex gap-1.5">
            <button onClick={onEdit}   className="p-1.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-colors"><Edit3 size={13} /></button>
            <button onClick={onDelete} className="p-1.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"><Trash2 size={13} /></button>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

// ─── Event Detail Modal (shared by admin + student) ───────────────────────────
const EventDetailModal = ({ ev, onClose, isAdmin = false }) => {
  const isUpcoming = new Date(ev.event_date) > new Date();
  const imgSrc     = ev.image_url ? `${BACKEND}${ev.image_url}` : null;
  const tagList    = ev.tags ? ev.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

  return (
    <motion.div key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

        {imgSrc
          ? <img src={imgSrc} alt={ev.title} className="w-full h-60 object-cover" />
          : <div className="w-full h-44 bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center"><Calendar size={56} className="text-white/50" /></div>
        }

        <div className="p-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={ev.status} />
              {isAdmin && ev.host_student_id && <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase border border-indigo-200">Student Hosted</span>}
            </div>
            <button onClick={onClose} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"><X size={18} /></button>
          </div>

          <h2 className="text-3xl font-black text-gray-800 mb-1">{ev.title}</h2>
          {ev.organizer && <p className="text-sm text-indigo-500 font-bold mb-4">by {ev.organizer}</p>}
          <p className="text-gray-500 leading-relaxed mb-6">{ev.description}</p>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <InfoBox icon={<Clock size={16} className="text-emerald-500" />} label="Date & Time" value={new Date(ev.event_date).toLocaleString()} />
            <InfoBox icon={<MapPin size={16} className="text-emerald-500" />} label="Venue" value={ev.location || 'Campus Main'} />
            {ev.max_participants && <InfoBox icon={<Users size={16} className="text-purple-500" />} label="Capacity" value={`${ev.max_participants} participants`} />}
            {ev.contact_info && <InfoBox icon={<Phone size={16} className="text-gray-400" />} label="Contact" value={ev.contact_info} />}
          </div>

          {tagList.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {tagList.map(t => <span key={t} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold border border-indigo-100">#{t}</span>)}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const InfoBox = ({ icon, label, value, className = '' }) => (
  <div className={`p-3.5 bg-gray-50 rounded-2xl flex items-start gap-3 ${className}`}>
    <div className="mt-0.5 shrink-0">{icon}</div>
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-sm font-bold text-gray-700">{value}</p>
    </div>
  </div>
);

export default AdminCampusPulse;
