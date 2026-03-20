import React, { useEffect, useState, useMemo } from 'react';
import {
  Newspaper, Calendar, Bell, Search,
  ArrowRight, MapPin, Clock, Tag, ExternalLink,
  Plus, AlertTriangle, Users, Phone, X, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api/axios';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

const BACKEND = 'http://localhost:8000';

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };

// ─── Root ────────────────────────────────────────────────────────────────────
const NewsEvents = () => {
  const userStr = localStorage.getItem('user');
  const user    = userStr ? JSON.parse(userStr) : null;
  const userId  = user?.id || user?.user_id;

  const [news,     setNews]     = useState([]);
  const [events,   setEvents]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [fetchErr, setFetchErr] = useState(null);
  const [activeTab, setActiveTab]   = useState('news');
  const [searchTerm, setSearchTerm] = useState('');

  // modals
  const [addOpen,     setAddOpen]     = useState(false);
  const [form,        setForm]        = useState({ title: '', description: '', event_date: '', location: '', organizer: '', contact_info: '', tags: '', max_participants: '' });
  const [imageFile,   setImageFile]   = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formErr,     setFormErr]     = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [confirmEnd,  setConfirmEnd]  = useState({ open: false, id: null });
  const [detailEvent, setDetailEvent] = useState(null);   // event detail modal

  // banner
  const [banner, setBanner] = useState(null);
  const showBanner = (type, msg) => { setBanner({ type, msg }); setTimeout(() => setBanner(null), 3500); };

  // ── fetch ──
  const fetchAll = async () => {
    setLoading(true); setFetchErr(null);
    try {
      const [nRes, eRes] = await Promise.all([API.get('/news'), API.get('/events')]);
      setNews((nRes.data || []).filter(n => n.published !== false));
      setEvents(eRes.data || []);
    } catch (err) {
      console.error('Campus Pulse fetch error:', err);
      setFetchErr('Could not load campus updates. Try again.');
    } finally { setLoading(false); }
  };
  useEffect(() => { fetchAll(); }, []);

  // image select
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // ── submit request ──
  const handleRequestEvent = async () => {
    if (!form.title.trim() || !form.description.trim() || !form.event_date) {
      setFormErr('Title, description and date are required.'); return;
    }
    setFormErr(''); setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (imageFile) fd.append('image', imageFile);
      await API.post('/events/request', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      showBanner('success', 'Event request submitted — waiting for admin approval.');
      setAddOpen(false);
      setForm({ title: '', description: '', event_date: '', location: '', organizer: '', contact_info: '', tags: '', max_participants: '' });
      setImageFile(null); setImagePreview(null);
      fetchAll();
    } catch (err) {
      const d = err?.response?.data?.detail;
      setFormErr(typeof d === 'string' ? d : 'Failed to submit request.');
    } finally { setSubmitting(false); }
  };

  // ── request end ──
  const handleRequestEnd = async () => {
    try {
      await API.patch(`/events/${confirmEnd.id}/request-end`);
      showBanner('success', 'End request sent to admin.');
      setConfirmEnd({ open: false, id: null }); fetchAll();
    } catch (err) {
      const d = err?.response?.data?.detail;
      showBanner('error', typeof d === 'string' ? d : 'Failed to send end request.');
      setConfirmEnd({ open: false, id: null });
    }
  };

  // ── filtered list ──
  const filteredItems = useMemo(() => {
    const src = activeTab === 'news' ? news : events;
    if (!searchTerm.trim()) return src;
    const s = searchTerm.toLowerCase();
    return src.filter(i =>
      (i.title || '').toLowerCase().includes(s) ||
      (i.content || i.description || '').toLowerCase().includes(s)
    );
  }, [news, events, activeTab, searchTerm]);

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">

      {/* Banner */}
      <AnimatePresence>
        {banner && (
          <motion.div key="banner" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className={`flex items-center gap-3 px-5 py-3 rounded-2xl text-sm font-bold border shadow-md ${banner.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
            <AlertTriangle size={16} /> {banner.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white/60 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/30 shadow-sm sticky top-0 z-20">
        <div className="flex-1">
          <h1 className="text-4xl font-black text-gray-800 tracking-tight flex items-center gap-3">
            {activeTab === 'news' ? <Newspaper className="text-indigo-600" /> : <Calendar className="text-emerald-600" />}
            Campus Pulse
          </h1>
          <p className="text-gray-500 font-medium mt-1">Stay synchronized with latest announcements and institutional events</p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto items-center">
          <div className="flex bg-gray-100 p-1.5 rounded-2xl w-full md:w-56">
            {['news', 'events'].map(tab => (
              <button key={tab} onClick={() => { setActiveTab(tab); setSearchTerm(''); }}
                className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white shadow-lg text-indigo-600 scale-105' : 'text-gray-400 hover:text-gray-600'}`}>
                {tab}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" placeholder={`Search ${activeTab}…`}
              className="w-full pl-11 pr-5 py-3 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-400 font-semibold text-sm"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          {activeTab === 'events' && (
            <button onClick={() => setAddOpen(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:opacity-90 transition-opacity whitespace-nowrap">
              <Plus size={16} /> Host Event
            </button>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      {loading ? (
        <div className="min-h-[50vh] flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-indigo-600 font-bold animate-pulse">Syncing Campus Intelligence…</p>
        </div>
      ) : fetchErr ? (
        <div className="flex flex-col items-center justify-center py-32 bg-red-50/50 rounded-[2.5rem] border border-dashed border-red-200">
          <AlertTriangle size={48} className="text-red-300 mb-4" />
          <p className="text-red-500 font-bold">{fetchErr}</p>
          <button onClick={fetchAll} className="mt-4 px-5 py-2.5 rounded-xl bg-red-100 text-red-600 text-xs font-black uppercase tracking-widest hover:bg-red-200 transition-colors">Retry</button>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {filteredItems.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="py-40 flex flex-col items-center text-center bg-white/40 rounded-[2.5rem] border border-dashed border-gray-200">
              <Bell size={64} className="text-gray-200 mb-6" />
              <h3 className="text-2xl font-black text-gray-400 uppercase">Silence in the Air</h3>
              <p className="text-gray-300 font-medium max-w-sm mt-2">
                {searchTerm ? `No ${activeTab} match your search.` : activeTab === 'events' ? 'No approved events yet. Request to host one!' : 'No news announcements yet.'}
              </p>
              {activeTab === 'events' && !searchTerm && (
                <button onClick={() => setAddOpen(true)} className="mt-6 flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 text-white text-xs font-black uppercase tracking-widest shadow hover:bg-emerald-600 transition-colors">
                  <Plus size={14} /> Host an Event
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div key={activeTab} variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filteredItems.map(item => (
                activeTab === 'news'
                  ? <NewsCard key={item.id} item={item} />
                  : <EventCard key={item.id} item={item} userId={userId}
                      onView={() => setDetailEvent(item)}
                      onEndRequest={() => setConfirmEnd({ open: true, id: item.id })} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* ── Event Detail Modal ── */}
      <AnimatePresence>
        {detailEvent && (
          <EventDetailModal event={detailEvent} userId={userId}
            onClose={() => setDetailEvent(null)}
            onEndRequest={() => { setDetailEvent(null); setConfirmEnd({ open: true, id: detailEvent.id }); }} />
        )}
      </AnimatePresence>

      {/* ── Host Event Modal ── */}
      <Modal open={addOpen} title="Request to Host Event"
        onClose={() => { setAddOpen(false); setFormErr(''); setImageFile(null); setImagePreview(null); }}
        actions={<Button onClick={handleRequestEvent} isLoading={submitting}>Submit Request</Button>}>
        <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
          {formErr && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-bold">{formErr}</div>}

          {/* Image upload */}
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Event Brochure / Banner Image</label>
            {imagePreview
              ? <div className="relative"><img src={imagePreview} alt="preview" className="w-full h-40 object-cover rounded-2xl border border-gray-200" />
                  <button onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute top-2 right-2 bg-white rounded-full p-1 shadow"><X size={14} /></button></div>
              : <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                  <Plus size={24} className="text-gray-400 mb-1" /><span className="text-xs text-gray-400 font-semibold">Upload Image / Brochure</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
            }
          </div>

          <input type="text" placeholder="Event Title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 outline-none font-medium" />
          <textarea placeholder="Event Description & Details *" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 outline-none font-medium" rows={3} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Date & Time *</label>
              <input type="datetime-local" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 outline-none font-medium" />
            </div>
            <input type="text" placeholder="Venue / Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 outline-none font-medium mt-5" />
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
      </Modal>

      {/* ── Confirm End Modal ── */}
      <Modal open={confirmEnd.open} title="Request to End Event"
        onClose={() => setConfirmEnd({ open: false, id: null })}
        actions={<Button variant="danger" onClick={handleRequestEnd}>Yes, Request End</Button>}>
        <p className="text-gray-600 text-sm">Are you sure you want to end this event? An admin must approve before it is officially closed.</p>
      </Modal>
    </div>
  );
};

// ─── Event Detail Modal ──────────────────────────────────────────────────────
const EventDetailModal = ({ event, userId, onClose, onEndRequest }) => {
  const isHost     = event.host_student_id != null && event.host_student_id === userId;
  const isUpcoming = new Date(event.event_date) > new Date();
  const imgSrc     = event.image_url ? `${BACKEND}${event.image_url}` : null;
  const tagList    = event.tags ? event.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

  return (
    <motion.div key="detail-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>

        {/* Banner image */}
        {imgSrc
          ? <img src={imgSrc} alt={event.title} className="w-full h-56 object-cover" />
          : <div className="w-full h-40 bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
              <Calendar size={56} className="text-white/60" />
            </div>
        }

        <div className="p-8">
          {/* Status + close */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex flex-wrap gap-2">
              {event.status === 'approved' && isUpcoming && <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase border border-emerald-200">Upcoming</span>}
              {event.status === 'approved' && !isUpcoming && <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-[10px] font-black uppercase border border-gray-200">Past</span>}
              {event.status === 'pending'  && <span className="px-3 py-1 bg-amber-50  text-amber-600 rounded-full text-[10px] font-black uppercase border border-amber-200">Pending Approval</span>}
              {event.status === 'held'     && <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase border border-orange-200">On Hold</span>}
              {event.status === 'ended'    && <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-[10px] font-black uppercase border border-gray-200">Ended</span>}
              {isHost && <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase border border-indigo-200">Your Event</span>}
            </div>
            <button onClick={onClose} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"><X size={18} /></button>
          </div>

          <h2 className="text-3xl font-black text-gray-800 leading-tight mb-3">{event.title}</h2>
          <p className="text-gray-500 leading-relaxed mb-6">{event.description}</p>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <InfoBox icon={<Clock size={16} className="text-emerald-500" />} label="Date & Time" value={new Date(event.event_date).toLocaleString()} />
            <InfoBox icon={<MapPin size={16} className="text-emerald-500" />} label="Venue" value={event.location || 'Campus Main'} />
            {event.organizer && <InfoBox icon={<Tag size={16} className="text-indigo-500" />} label="Organizer" value={event.organizer} />}
            {event.max_participants && <InfoBox icon={<Users size={16} className="text-purple-500" />} label="Capacity" value={`${event.max_participants} participants`} />}
            {event.contact_info && <InfoBox icon={<Phone size={16} className="text-gray-500" />} label="Contact" value={event.contact_info} className="col-span-2" />}
          </div>

          {/* Tags */}
          {tagList.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {tagList.map(t => (
                <span key={t} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold border border-indigo-100">#{t}</span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 border-t border-gray-100 pt-5">
            {event.status === 'approved' && isUpcoming && (
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-widest border border-emerald-200 hover:bg-emerald-100 transition-colors">
                <ExternalLink size={13} /> Add to Calendar
              </button>
            )}
            {!isHost && event.status === 'approved' && isUpcoming && (
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-black uppercase tracking-widest border border-indigo-200 hover:bg-indigo-100 transition-colors">
                Register <ChevronRight size={13} />
              </button>
            )}
            {isHost && event.status === 'approved' && isUpcoming && (
              <button onClick={onEndRequest} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-600 text-xs font-black uppercase tracking-widest border border-red-200 hover:bg-red-100 transition-colors">
                End Event <ArrowRight size={13} />
              </button>
            )}
          </div>
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

// ─── News Card ───────────────────────────────────────────────────────────────
const NewsCard = ({ item }) => (
  <motion.div variants={fadeUp} className="h-full">
    <GlassCard className="p-0 overflow-hidden group h-full flex flex-col hover:border-indigo-200 rounded-[2.5rem] transition-all duration-300 shadow-sm hover:shadow-xl">
      <div className="p-8 flex-1">
        <div className="flex justify-between items-start mb-6">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-sm">
            <Newspaper size={24} />
          </div>
          <span className="px-3 py-1 bg-gray-50 text-gray-400 rounded-full text-[10px] font-black tracking-widest uppercase">
            {new Date(item.created_at).toLocaleDateString()}
          </span>
        </div>
        <h3 className="text-2xl font-black text-gray-800 mb-4 group-hover:text-indigo-700 transition-colors leading-tight">{item.title}</h3>
        <p className="text-sm text-gray-500 font-medium leading-relaxed line-clamp-4">{item.content}</p>
      </div>
      <div className="px-8 py-5 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center">
        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Official Publication</p>
        <button className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest">Read <ArrowRight size={15} /></button>
      </div>
      <div className="h-1.5 w-full bg-indigo-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
    </GlassCard>
  </motion.div>
);

// ─── Event Card (compact, click to expand) ───────────────────────────────────
const EventCard = ({ item, userId, onView, onEndRequest }) => {
  const isHost     = item.host_student_id != null && item.host_student_id === userId;
  const isUpcoming = new Date(item.event_date) > new Date();
  const imgSrc     = item.image_url ? `${BACKEND}${item.image_url}` : null;

  return (
    <motion.div variants={fadeUp} className="h-full cursor-pointer" onClick={onView}>
      <GlassCard className={`p-0 overflow-hidden group h-full flex flex-col hover:border-emerald-300 rounded-[2.5rem] transition-all duration-300 shadow-sm hover:shadow-xl ${!isUpcoming && item.status === 'approved' ? 'opacity-75' : ''}`}>

        {/* Image banner */}
        {imgSrc
          ? <img src={imgSrc} alt={item.title} className="w-full h-44 object-cover group-hover:brightness-105 transition-all duration-500" />
          : <div className="w-full h-32 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 flex items-center justify-center relative overflow-hidden">
              <Calendar size={40} className="text-white/40" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
        }

        <div className="p-6 flex-1 flex flex-col">
          {/* Status row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-1.5 flex-wrap">
              {item.status === 'approved'      && isUpcoming  && <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase border border-emerald-200">Upcoming</span>}
              {item.status === 'approved'      && !isUpcoming && <span className="px-2.5 py-1 bg-gray-100 text-gray-500 rounded-full text-[10px] font-black uppercase border border-gray-200">Past</span>}
              {item.status === 'pending'       && <span className="px-2.5 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase border border-amber-200">Pending</span>}
              {item.status === 'held'          && <span className="px-2.5 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase border border-orange-200">On Hold</span>}
              {item.status === 'ended'         && <span className="px-2.5 py-1 bg-gray-100 text-gray-400 rounded-full text-[10px] font-black uppercase border border-gray-200">Ended</span>}
              {item.status === 'end_requested' && <span className="px-2.5 py-1 bg-purple-50 text-purple-600 rounded-full text-[10px] font-black uppercase border border-purple-200">End Requested</span>}
              {isHost && <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase border border-indigo-200">Your Event</span>}
            </div>
            <span className="text-[10px] text-gray-400 font-bold">#{item.id}</span>
          </div>

          <h3 className="text-xl font-black text-gray-800 mb-2 group-hover:text-emerald-700 transition-colors leading-tight">{item.title}</h3>
          {item.organizer && <p className="text-xs text-indigo-500 font-bold mb-2">by {item.organizer}</p>}
          <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-4 flex-1">{item.description}</p>

          {/* Meta chips */}
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl">
              <Clock size={13} className="text-emerald-500 shrink-0" />
              <div><p className="text-[9px] font-black text-gray-400 uppercase">Date</p>
                <p className="text-xs font-black text-gray-700">{new Date(item.event_date).toLocaleDateString()}</p></div>
            </div>
            <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl">
              <MapPin size={13} className="text-emerald-500 shrink-0" />
              <div><p className="text-[9px] font-black text-gray-400 uppercase">Venue</p>
                <p className="text-xs font-black text-gray-700 truncate">{item.location || 'Campus Main'}</p></div>
            </div>
            {item.max_participants && (
              <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl">
                <Users size={13} className="text-purple-500 shrink-0" />
                <div><p className="text-[9px] font-black text-gray-400 uppercase">Capacity</p>
                  <p className="text-xs font-black text-gray-700">{item.max_participants}</p></div>
              </div>
            )}
          </div>

          {/* Tags */}
          {item.tags && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {item.tags.split(',').slice(0, 3).map(t => t.trim()).filter(Boolean).map(t => (
                <span key={t} className="px-2 py-0.5 bg-indigo-50 text-indigo-500 rounded-full text-[10px] font-bold border border-indigo-100">#{t}</span>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center" onClick={e => e.stopPropagation()}>
          <button onClick={onView} className="flex items-center gap-1.5 text-emerald-600 font-black text-xs uppercase tracking-widest hover:text-emerald-800 transition-colors">
            View Details <ChevronRight size={14} />
          </button>
          {isHost && item.status === 'approved' && isUpcoming && (
            <button onClick={e => { e.stopPropagation(); onEndRequest(); }}
              className="flex items-center gap-1.5 text-red-500 hover:text-red-700 font-black text-xs uppercase tracking-widest transition-colors bg-red-50 px-3 py-1.5 rounded-xl border border-red-100">
              End Event <ArrowRight size={13} />
            </button>
          )}
        </div>
        <div className={`h-1.5 w-full scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500 ${item.status === 'approved' ? 'bg-emerald-500' : 'bg-gray-300'}`} />
      </GlassCard>
    </motion.div>
  );
};

export default NewsEvents;
