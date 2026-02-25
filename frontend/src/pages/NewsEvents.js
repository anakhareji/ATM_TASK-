import React, { useEffect, useState, useMemo } from 'react';
import {
  Newspaper, Calendar, Bell, Info, Search,
  Filter, ArrowRight, MapPin, Clock, Tag, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import API from '../api/axios';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import { staggerContainer, cardEntrance } from '../utils/motionVariants';

const NewsEvents = () => {
  // Data States
  const [news, setNews] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('news');
  const [searchTerm, setSearchTerm] = useState("");

  // Initial Fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [newsRes, eventsRes] = await Promise.all([
          API.get('/news'),
          API.get('/events')
        ]);
        setNews(newsRes.data || []);
        setEvents(eventsRes.data || []);
      } catch (e) {
        toast.error("Connectivity issue: Could not sync campus updates.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filters
  const filteredContent = useMemo(() => {
    const source = activeTab === 'news' ? news : events;
    return source.filter(item =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.content || item.description || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [news, events, activeTab, searchTerm]);

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-indigo-600 font-bold animate-pulse">Syncing Campus Intelligence...</p>
    </div>
  );

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-8 max-w-7xl mx-auto pb-20">
      {/* Header / Tab Control */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white/50 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/20 shadow-sm sticky top-0 z-20">
        <div className="flex-1">
          <h1 className="text-4xl font-black text-gray-800 tracking-tight flex items-center gap-3">
            {activeTab === 'news' ? <Newspaper className="text-indigo-600" /> : <Calendar className="text-emerald-600" />}
            Campus Pulse
          </h1>
          <p className="text-gray-500 font-medium mt-1">Stay synchronized with latest announcements and institutional events</p>
        </div>

        <div className="flex flex-col md:flex-row gap-6 w-full md:w-auto items-center">
          <div className="flex bg-gray-100 p-1.5 rounded-2xl w-full md:w-64">
            {['news', 'events'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white shadow-xl text-indigo-600 scale-105' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text" placeholder={`Search ${activeTab}...`}
              className="w-full pl-12 pr-6 py-3 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Content Display */}
      <AnimatePresence mode="wait">
        {filteredContent.length === 0 ? (
          <motion.div
            key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="py-40 flex flex-col items-center text-center bg-white/40 rounded-[2.5rem] border border-dashed border-gray-200"
          >
            <Bell size={64} className="text-gray-200 mb-6" />
            <h3 className="text-2xl font-black text-gray-400 uppercase">Silence in the Air</h3>
            <p className="text-gray-300 font-medium max-w-sm mt-2">No active {activeTab} matches your current filters.</p>
          </motion.div>
        ) : (
          <motion.div
            key={activeTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8"
          >
            {filteredContent.map(item => (
              activeTab === 'news' ? <NewsCard key={item.id} item={item} /> : <EventCard key={item.id} item={item} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const NewsCard = ({ item }) => (
  <motion.div variants={cardEntrance} className="h-full">
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
        <p className="text-sm text-gray-500 font-medium leading-relaxed mb-6 line-clamp-4">
          {item.content}
        </p>
        <div className="flex gap-3 mb-4">
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-xl text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <Tag size={12} className="text-indigo-400" /> Announcement
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-xl text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <Clock size={12} className="text-indigo-400" /> Recent
          </span>
        </div>
      </div>
      <div className="px-8 py-5 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center group-hover:bg-indigo-50/20">
        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Official Publication</p>
        <button className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest">
          Read Report <ArrowRight size={16} />
        </button>
      </div>
      <div className="h-1.5 w-full bg-indigo-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
    </GlassCard>
  </motion.div>
);

const EventCard = ({ item }) => (
  <motion.div variants={cardEntrance} className="h-full">
    <GlassCard className="p-0 overflow-hidden group h-full flex flex-col hover:border-emerald-200 rounded-[2.5rem] transition-all duration-300 shadow-sm hover:shadow-xl">
      <div className="p-8 flex-1">
        <div className="flex justify-between items-start mb-6">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500 shadow-sm">
            <Calendar size={24} />
          </div>
          <div className="flex flex-col items-end">
            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black tracking-widest uppercase mb-1">
              Upcoming
            </span>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              ID #{item.id}
            </span>
          </div>
        </div>
        <h3 className="text-2xl font-black text-gray-800 mb-4 group-hover:text-emerald-700 transition-colors leading-tight">{item.title}</h3>
        <p className="text-sm text-gray-500 font-medium leading-relaxed mb-6 line-clamp-3">
          {item.description}
        </p>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-3">
            <Clock size={16} className="text-emerald-500" />
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase">Schedule</p>
              <p className="text-xs font-black text-gray-700">{new Date(item.event_date).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-3">
            <MapPin size={16} className="text-emerald-500" />
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase">Location</p>
              <p className="text-xs font-black text-gray-700">Campus Main</p>
            </div>
          </div>
        </div>
      </div>
      <div className="px-8 py-5 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center group-hover:bg-emerald-50/20">
        <button className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest">
          Add to Calendar <ExternalLink size={14} />
        </button>
        <button className="flex items-center gap-2 text-gray-400 font-black text-xs uppercase tracking-widest">
          Register <ArrowRight size={16} />
        </button>
      </div>
      <div className="h-1.5 w-full bg-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
    </GlassCard>
  </motion.div>
);

export default NewsEvents;
