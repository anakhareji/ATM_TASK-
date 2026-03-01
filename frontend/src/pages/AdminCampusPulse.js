import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Newspaper, Calendar, Search, Plus, Edit3, Trash2,
  CheckCircle, XCircle, PauseCircle, PlayCircle, Clock,
  MapPin, AlertCircle, RefreshCw, Image, Users, Phone, X,
  Star, StarOff, Eye, EyeOff, Tag as TagIcon, BookOpen
} from 'lucide-react';
import AdminGlassLayout from '../components/layout/AdminGlassLayout';
import GlassCard from '../components/ui/GlassCard';
import Modal from '../components/ui/Modal';
import Toast from '../components/ui/Toast';
import Button from '../components/ui/Button';
import API from '../api/axios';
import { getErrorMessage } from '../utils/errorHelpers';

const BACKEND = 'http://localhost:8000';

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

const CATEGORIES = [
  { value: 'general',      label: 'General',      color: 'bg-gray-100 text-gray-600 border-gray-200' },
  { value: 'academic',     label: 'Academic',     color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { value: 'announcement', label: 'Announcement', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'placement',    label: 'Placement',    color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'achievement',  label: 'Achievement',  color: 'bg-amber-50 text-amber-700 border-amber-200' },
];
const catMeta = (cat) => CATEGORIES.find(c => c.value === cat) || CATEGORIES[0];

const StatusBadge = ({ status }) => {
  const meta = STATUS_META[status] || { label: 'Active', color: 'bg-gray-100 text-gray-500 border-gray-200' };
  return <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${meta.color}`}>{meta.label}</span>;
};

// ─── Defaults ─────────────────────────────────────────────────────────────────
const NEWS_FORM_DEFAULT  = { title: '', content: '', category: 'general', tags: '', is_featured: false, published: false };
const EVENT_FORM_DEFAULT = { title: '', description: '', event_date: '', location: '', organizer: '', contact_info: '', tags: '', max_participants: '' };

// ─── Main Component ───────────────────────────────────────────────────────────
const AdminCampusPulse = () => {
  const role = localStorage.getItem('userRole');
  const [activeTab, setActiveTab] = useState('news');
  const [searchTerm, setSearchTerm] = useState('');

  // NEWS state
  const [news, setNews]                   = useState([]);
  const [newsLoading, setNewsLoading]     = useState(true);
  const [addNewsOpen, setAddNewsOpen]     = useState(false);
  const [editNewsModal, setEditNewsModal] = useState({ open: false, id: null, ...NEWS_FORM_DEFAULT });
  const [deleteNews, setDeleteNews]       = useState({ open: false, id: null });
  const [newsForm, setNewsForm]           = useState(NEWS_FORM_DEFAULT);
  const [newsImage, setNewsImage]         = useState(null);
  const [newsImagePreview, setNewsImagePreview] = useState(null);
  const [editNewsImage, setEditNewsImage] = useState(null);
  const [editNewsImagePreview, setEditNewsImagePreview] = useState(null);
  const [detailNews, setDetailNews]       = useState(null);

  // EVENTS state
  const [events, setEvents]                     = useState([]);
  const [eventsLoading, setEventsLoading]       = useState(true);
  const [addEventOpen, setAddEventOpen]         = useState(false);
  const [editEventModal, setEditEventModal]     = useState({ open: false, id: null, ...EVENT_FORM_DEFAULT });
  const [deleteEvent, setDeleteEvent]           = useState({ open: false, id: null });
  const [eventForm, setEventForm]               = useState(EVENT_FORM_DEFAULT);
  const [imageFile, setImageFile]               = useState(null);
  const [imagePreview, setImagePreview]         = useState(null);
  const [editImageFile, setEditImageFile]       = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [detailEvent, setDetailEvent]           = useState(null);

  // TOAST
  const [toast, setToast] = useState({ open: false, type: 'success', message: '' });
  const showToast = (type, message) => setToast({ open: true, type, message });

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchNews = async () => {
    setNewsLoading(true);
    try { const r = await API.get('/news/admin/all'); setNews(r.data || []); }
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

  // ── Image helpers ──────────────────────────────────────────────────────────
  const buildFD = (form, imgFile, imageFieldName = 'image') => {
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') {
        fd.append(k, typeof v === 'boolean' ? String(v) : v);
      }
    });
    if (imgFile) fd.append(imageFieldName, imgFile);
    return fd;
  };

  const handleImgChange = (e, setter, previewSetter) => {
    const file = e.target.files[0]; if (!file) return;
    setter(file); previewSetter(URL.createObjectURL(file));
  };

  // ── NEWS Handlers ──────────────────────────────────────────────────────────
  const handleAddNews = async () => {
    try {
      const fd = buildFD(newsForm, newsImage);
      await API.post('/news', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      showToast('success', 'News created'); setAddNewsOpen(false);
      setNewsForm(NEWS_FORM_DEFAULT); setNewsImage(null); setNewsImagePreview(null); fetchNews();
    } catch (e) { showToast('error', getErrorMessage(e, 'Failed to add news')); }
  };

  const handleUpdateNews = async () => {
    const { id, open, ...fields } = editNewsModal;
    try {
      const fd = buildFD(fields, editNewsImage);
      await API.put(`/news/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      showToast('success', 'News updated');
      setEditNewsModal({ open: false, id: null, ...NEWS_FORM_DEFAULT });
      setEditNewsImage(null); setEditNewsImagePreview(null); fetchNews();
    } catch (e) { showToast('error', getErrorMessage(e, 'Failed to update news')); }
  };

  const handleDeleteNews = async () => {
    try {
      await API.delete(`/news/${deleteNews.id}`);
      showToast('success', 'News deleted'); setDeleteNews({ open: false, id: null }); fetchNews();
    } catch (e) { showToast('error', getErrorMessage(e, 'Failed to delete news')); }
  };

  const handleTogglePublish = async (id) => {
    try { await API.patch(`/news/${id}/publish`); fetchNews(); }
    catch (e) { showToast('error', getErrorMessage(e, 'Toggle failed')); }
  };

  const handleToggleFeatured = async (id) => {
    try { await API.patch(`/news/${id}/feature`); fetchNews(); }
    catch (e) { showToast('error', getErrorMessage(e, 'Feature toggle failed')); }
  };

  const openEditNews = (item) => {
    setEditNewsModal({
      open: true, id: item.id,
      title: item.title || '', content: item.content || '',
      category: item.category || 'general', tags: item.tags || '',
      is_featured: !!item.is_featured, published: !!item.published,
    });
    setEditNewsImagePreview(item.cover_image_url ? `${BACKEND}${item.cover_image_url}` : null);
    setEditNewsImage(null);
  };

  // ── EVENT Handlers ─────────────────────────────────────────────────────────
  const handleAddEvent = async () => {
    try {
      const fd = buildFD(eventForm, imageFile);
      await API.post('/events', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      showToast('success', 'Event created'); setAddEventOpen(false);
      setEventForm(EVENT_FORM_DEFAULT); setImageFile(null); setImagePreview(null); fetchEvents();
    } catch (e) { showToast('error', getErrorMessage(e, 'Failed to add event')); }
  };

  const handleUpdateEvent = async () => {
    const { id, open, ...fields } = editEventModal;
    try {
      const fd = buildFD(fields, editImageFile);
      await API.put(`/events/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      showToast('success', 'Event updated');
      setEditEventModal({ open: false, id: null, ...EVENT_FORM_DEFAULT });
      setEditImageFile(null); setEditImagePreview(null); fetchEvents();
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

  // ── Filters ────────────────────────────────────────────────────────────────
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
                        onView={() => setDetailNews(item)}
                        onEdit={() => openEditNews(item)}
                        onDelete={() => setDeleteNews({ open: true, id: item.id })}
                        onTogglePublish={() => handleTogglePublish(item.id)}
                        onToggleFeatured={() => handleToggleFeatured(item.id)} />
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
                        onReject={()  => handleEventAction(ev.id, 'reject',  'Event rejected')}
                        onHold={() => handleEventAction(ev.id, 'hold', 'Event placed on hold')}
                        onUnhold={() => handleEventAction(ev.id, 'unhold', 'Event resumed')}
                        onApproveEnd={() => handleEventAction(ev.id, 'approve-end', 'Event ended')} />
                    ))}
                  </div>
              }
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── News Detail Modal ── */}
        <AnimatePresence>
          {detailNews && <NewsDetailModal item={detailNews} onClose={() => setDetailNews(null)} />}
        </AnimatePresence>

        {/* ── Event Detail Modal ── */}
        <AnimatePresence>
          {detailEvent && <EventDetailModal ev={detailEvent} onClose={() => setDetailEvent(null)} isAdmin />}
        </AnimatePresence>

        {/* ══ NEWS MODALS ══ */}
        {/* Add News */}
        <Modal open={addNewsOpen} title="Publish News Article" onClose={() => { setAddNewsOpen(false); setNewsImage(null); setNewsImagePreview(null); }} actions={<Button onClick={handleAddNews}>Publish</Button>}>
          <NewsFormFields form={newsForm} setForm={setNewsForm} imagePreview={newsImagePreview}
            onImageChange={e => handleImgChange(e, setNewsImage, setNewsImagePreview)}
            onImageRemove={() => { setNewsImage(null); setNewsImagePreview(null); }} />
        </Modal>

        {/* Edit News */}
        <Modal open={editNewsModal.open} title="Edit News Article" onClose={() => { setEditNewsModal({ open: false, id: null, ...NEWS_FORM_DEFAULT }); setEditNewsImage(null); setEditNewsImagePreview(null); }} actions={<Button onClick={handleUpdateNews}>Update</Button>}>
          <NewsFormFields form={editNewsModal} setForm={v => setEditNewsModal(p => ({ ...p, ...v }))} imagePreview={editNewsImagePreview}
            onImageChange={e => handleImgChange(e, setEditNewsImage, setEditNewsImagePreview)}
            onImageRemove={() => { setEditNewsImage(null); setEditNewsImagePreview(null); }} />
        </Modal>

        {/* Delete News */}
        <Modal open={deleteNews.open} title="Delete News" onClose={() => setDeleteNews({ open: false, id: null })} actions={<Button variant="danger" onClick={handleDeleteNews}>Yes, Delete</Button>}>
          <p className="text-gray-600 text-sm">Permanently delete this news article?</p>
        </Modal>

        {/* ══ EVENT MODALS ══ */}
        <Modal open={addEventOpen} title="Create Campus Event" onClose={() => { setAddEventOpen(false); setImageFile(null); setImagePreview(null); }} actions={<Button onClick={handleAddEvent}>Create Event</Button>}>
          <EventFormFields form={eventForm} setForm={setEventForm} imagePreview={imagePreview}
            onImageChange={e => handleImgChange(e, setImageFile, setImagePreview)}
            onImageRemove={() => { setImageFile(null); setImagePreview(null); }} />
        </Modal>

        <Modal open={editEventModal.open} title="Edit Event" onClose={() => { setEditEventModal({ open: false, id: null, ...EVENT_FORM_DEFAULT }); setEditImageFile(null); setEditImagePreview(null); }} actions={<Button onClick={handleUpdateEvent}>Update Event</Button>}>
          <EventFormFields form={editEventModal} setForm={v => setEditEventModal(p => ({ ...p, ...v }))} imagePreview={editImagePreview}
            onImageChange={e => handleImgChange(e, setEditImageFile, setEditImagePreview)}
            onImageRemove={() => { setEditImageFile(null); setEditImagePreview(null); }} />
        </Modal>

        <Modal open={deleteEvent.open} title="Delete Event" onClose={() => setDeleteEvent({ open: false, id: null })} actions={<Button variant="danger" onClick={handleDeleteEvent}>Yes, Delete</Button>}>
          <p className="text-gray-600 text-sm">Permanently delete this event?</p>
        </Modal>

        <Toast open={toast.open} type={toast.type} message={toast.message} onClose={() => setToast({ ...toast, open: false })} />
      </div>
    </AdminGlassLayout>
  );
};

// ─── News Form Fields ──────────────────────────────────────────────────────────
const NewsFormFields = ({ form, setForm, imagePreview, onImageChange, onImageRemove }) => (
  <div className="space-y-3 max-h-[68vh] overflow-y-auto pr-1">
    {/* Cover Image */}
    <div>
      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Cover Image</label>
      {imagePreview
        ? <div className="relative">
            <img src={imagePreview} alt="preview" className="w-full h-40 object-cover rounded-2xl border border-gray-200" />
            <button type="button" onClick={onImageRemove} className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow border border-gray-200"><X size={14} /></button>
          </div>
        : <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
            <Image size={20} className="text-gray-400 mb-1" /><span className="text-xs text-gray-400 font-semibold">Upload Cover Image</span>
            <input type="file" accept="image/*" className="hidden" onChange={onImageChange} />
          </label>
      }
    </div>

    <input type="text" placeholder="Headline / Title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none font-medium" />
    <textarea placeholder="Article Content / Body *" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none font-medium" rows={5} />

    {/* Category */}
    <div>
      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Category</label>
      <div className="flex flex-wrap gap-2">
        {['general','academic','announcement','placement','achievement'].map(cat => (
          <button key={cat} type="button" onClick={() => setForm({ ...form, category: cat })}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase border transition-all ${form.category === cat ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-indigo-300'}`}>
            {cat}
          </button>
        ))}
      </div>
    </div>

    <input type="text" placeholder="Tags (comma separated, e.g. exam,results)" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none font-medium" />

    {/* Toggles */}
    <div className="flex items-center gap-4 pt-1">
      <label className="flex items-center gap-2 cursor-pointer">
        <div onClick={() => setForm({ ...form, published: !form.published })}
          className={`w-10 h-5 rounded-full transition-colors relative ${form.published ? 'bg-emerald-500' : 'bg-gray-200'}`}>
          <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow ${form.published ? 'left-5' : 'left-0.5'}`} />
        </div>
        <span className="text-xs font-black text-gray-600 uppercase tracking-widest">Published</span>
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
        <div onClick={() => setForm({ ...form, is_featured: !form.is_featured })}
          className={`w-10 h-5 rounded-full transition-colors relative ${form.is_featured ? 'bg-amber-400' : 'bg-gray-200'}`}>
          <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow ${form.is_featured ? 'left-5' : 'left-0.5'}`} />
        </div>
        <span className="text-xs font-black text-gray-600 uppercase tracking-widest">Featured</span>
      </label>
    </div>
  </div>
);

// ─── Event Form Fields ─────────────────────────────────────────────────────────
const EventFormFields = ({ form, setForm, imagePreview, onImageChange, onImageRemove }) => (
  <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
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

// ─── Empty State ───────────────────────────────────────────────────────────────
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

// ─── News Admin Card ───────────────────────────────────────────────────────────
const NewsAdminCard = ({ item, onView, onEdit, onDelete, onTogglePublish, onToggleFeatured }) => {
  const cat = catMeta(item.category);
  const imgSrc = item.cover_image_url ? `${BACKEND}${item.cover_image_url}` : null;
  return (
    <GlassCard className="group p-0 overflow-hidden flex flex-col hover:border-indigo-200 hover:shadow-lg transition-all duration-300 rounded-3xl cursor-pointer" onClick={onView}>
      {/* Cover image / placeholder */}
      {imgSrc
        ? <img src={imgSrc} alt={item.title} className="w-full h-32 object-cover" />
        : <div className="w-full h-20 bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center">
            <Newspaper size={28} className="text-white/50" />
          </div>
      }

      <div className="p-5 flex flex-col flex-1 gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${cat.color}`}>{cat.label}</span>
              {item.is_featured && <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-200">⭐ Featured</span>}
            </div>
            <h3 className="font-black text-gray-800 leading-tight text-sm line-clamp-2">{item.title}</h3>
          </div>
          <span className={`shrink-0 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${item.published ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
            {item.published ? 'Live' : 'Draft'}
          </span>
        </div>

        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{item.content}</p>

        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-semibold">
          <Clock size={10} />{new Date(item.created_at).toLocaleDateString()}
          {item.read_time_mins && <><span className="w-px h-3 bg-gray-200"/><BookOpen size={10}/>{item.read_time_mins} min read</>}
        </div>

        {/* Action row */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-gray-100 pt-3 mt-auto" onClick={e => e.stopPropagation()}>
          <button onClick={onTogglePublish} className={`flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-black uppercase rounded-lg border transition-colors ${item.published ? 'border-orange-200 text-orange-600 hover:bg-orange-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}>
            {item.published ? <><EyeOff size={11} />Unpublish</> : <><Eye size={11} />Publish</>}
          </button>
          <button onClick={onToggleFeatured} className={`flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-black uppercase rounded-lg border transition-colors ${item.is_featured ? 'border-amber-200 text-amber-600 hover:bg-amber-50' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
            {item.is_featured ? <><StarOff size={11}/>Unfeature</> : <><Star size={11}/>Feature</>}
          </button>
          <div className="ml-auto flex gap-1.5">
            <button onClick={onEdit}   className="p-1.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors"><Edit3 size={13} /></button>
            <button onClick={onDelete} className="p-1.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"><Trash2 size={13} /></button>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

// ─── News Detail Modal ─────────────────────────────────────────────────────────
const NewsDetailModal = ({ item, onClose }) => {
  const cat    = catMeta(item.category);
  const imgSrc = item.cover_image_url ? `${BACKEND}${item.cover_image_url}` : null;
  const tags   = item.tags ? item.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {imgSrc
          ? <img src={imgSrc} alt={item.title} className="w-full h-56 object-cover" />
          : <div className="w-full h-36 bg-gradient-to-br from-indigo-500 to-purple-700 flex items-center justify-center"><Newspaper size={48} className="text-white/40" /></div>
        }
        <div className="p-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex flex-wrap gap-2">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${cat.color}`}>{cat.label}</span>
              {item.is_featured && <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-amber-50 text-amber-600 border border-amber-200">⭐ Featured</span>}
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${item.published ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                {item.published ? 'Published' : 'Draft'}
              </span>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"><X size={18} /></button>
          </div>
          <h2 className="text-2xl font-black text-gray-800 mb-1">{item.title}</h2>
          <div className="flex items-center gap-3 text-xs text-gray-400 font-semibold mb-5">
            <Clock size={12}/> {new Date(item.created_at).toLocaleString()}
            {item.read_time_mins && <><span className="w-px h-3 bg-gray-200"/><BookOpen size={12}/>{item.read_time_mins} min read</>}
          </div>
          <p className="text-gray-600 leading-relaxed whitespace-pre-wrap mb-5">{item.content}</p>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map(t => <span key={t} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold border border-indigo-100">#{t}</span>)}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Event Admin Card ──────────────────────────────────────────────────────────
const EventAdminCard = ({ ev, onView, onEdit, onDelete, onApprove, onReject, onHold, onUnhold, onApproveEnd }) => {
  const imgSrc = ev.image_url ? `${BACKEND}${ev.image_url}` : null;
  return (
    <GlassCard className="group p-0 overflow-hidden flex flex-col hover:border-emerald-200 hover:shadow-lg transition-all duration-300 rounded-3xl cursor-pointer" onClick={onView}>
      {imgSrc
        ? <img src={imgSrc} alt={ev.title} className="w-full h-36 object-cover" />
        : <div className="w-full h-24 bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center"><Calendar size={32} className="text-white/50" /></div>
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
          <span className="flex items-center gap-1"><Clock size={11} className="text-emerald-500"/>{new Date(ev.event_date).toLocaleDateString()}</span>
          <span className="flex items-center gap-1"><MapPin size={11} className="text-emerald-500"/>{ev.location || 'Campus'}</span>
          {ev.max_participants && <span className="flex items-center gap-1"><Users size={11} className="text-purple-500"/>{ev.max_participants}</span>}
        </div>
        {ev.host_student_id && <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Student Hosted</span>}

        <div className="flex flex-wrap items-center gap-1.5 border-t border-gray-100 pt-3" onClick={e => e.stopPropagation()}>
          {ev.status === 'pending' && <>
            <button onClick={onApprove} className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-black uppercase rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"><CheckCircle size={11}/>Approve</button>
            <button onClick={onReject}  className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-black uppercase rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"><XCircle size={11}/>Reject</button>
          </>}
          {ev.status === 'approved'      && <button onClick={onHold}      className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-black uppercase rounded-lg bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100"><PauseCircle size={11}/>Hold</button>}
          {ev.status === 'held'          && <button onClick={onUnhold}    className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-black uppercase rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"><PlayCircle size={11}/>Resume</button>}
          {ev.status === 'end_requested' && <button onClick={onApproveEnd} className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-black uppercase rounded-lg bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100"><CheckCircle size={11}/>Approve End</button>}
          <div className="ml-auto flex gap-1.5">
            <button onClick={onEdit}   className="p-1.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-colors"><Edit3 size={13}/></button>
            <button onClick={onDelete} className="p-1.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"><Trash2 size={13}/></button>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

// ─── Event Detail Modal ────────────────────────────────────────────────────────
const EventDetailModal = ({ ev, onClose, isAdmin = false }) => {
  const imgSrc  = ev.image_url ? `${BACKEND}${ev.image_url}` : null;
  const tagList = ev.tags ? ev.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
  return (
    <motion.div key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {imgSrc ? <img src={imgSrc} alt={ev.title} className="w-full h-60 object-cover" />
                : <div className="w-full h-44 bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center"><Calendar size={56} className="text-white/50" /></div>}
        <div className="p-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={ev.status} />
              {isAdmin && ev.host_student_id && <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase border border-indigo-200">Student Hosted</span>}
            </div>
            <button onClick={onClose} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"><X size={18}/></button>
          </div>
          <h2 className="text-3xl font-black text-gray-800 mb-1">{ev.title}</h2>
          {ev.organizer && <p className="text-sm text-indigo-500 font-bold mb-4">by {ev.organizer}</p>}
          <p className="text-gray-500 leading-relaxed mb-6">{ev.description}</p>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <InfoBox icon={<Clock size={16} className="text-emerald-500"/>} label="Date & Time" value={new Date(ev.event_date).toLocaleString()} />
            <InfoBox icon={<MapPin size={16} className="text-emerald-500"/>} label="Venue" value={ev.location || 'Campus Main'} />
            {ev.max_participants && <InfoBox icon={<Users size={16} className="text-purple-500"/>} label="Capacity" value={`${ev.max_participants} participants`} />}
            {ev.contact_info    && <InfoBox icon={<Phone size={16} className="text-gray-400"/>}   label="Contact"  value={ev.contact_info} />}
          </div>
          {tagList.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tagList.map(t => <span key={t} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold border border-indigo-100">#{t}</span>)}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const InfoBox = ({ icon, label, value }) => (
  <div className="p-3.5 bg-gray-50 rounded-2xl flex items-start gap-3">
    <div className="mt-0.5 shrink-0">{icon}</div>
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-sm font-bold text-gray-700">{value}</p>
    </div>
  </div>
);

export default AdminCampusPulse;
