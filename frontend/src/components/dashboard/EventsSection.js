import React, { useEffect, useState } from 'react';
import { Calendar, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from '../../api/axios';
import GlassCard from '../ui/GlassCard';
import { cardEntrance } from '../../utils/motionVariants';

import { useNavigate } from 'react-router-dom';

const EventsSection = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await axios.get('/events');
                setEvents(response.data || []);
            } catch (error) {
                console.error("Error fetching events:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    return (
        <GlassCard className="h-full flex flex-col relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-1 h-6 bg-emerald-500 rounded-full"></span>
                    Campus Events
                </h3>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/dashboard/events')}
                    className="px-3 py-2 rounded-xl border border-emerald-600 text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center gap-2 text-sm font-semibold"
                >
                    <Plus size={16} />
                    Add Event
                </motion.button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {loading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-16 bg-white rounded-2xl animate-pulse border border-gray-200"></div>)
                ) : (
                    events.map((event) => (
                        <motion.div
                            key={event.id}
                            variants={cardEntrance}
                            whileHover={{ x: 5 }}
                            onClick={() => navigate('/dashboard/events')}
                            className="flex items-center gap-4 p-3 bg-white border border-gray-200 rounded-2xl hover:shadow-md transition-all cursor-pointer"
                        >
                            <div className="flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center text-emerald-700 bg-emerald-50 border border-emerald-100">
                                <span className="text-[10px] font-bold uppercase">{new Date(event.event_date || event.date).toLocaleString('default', { month: 'short' })}</span>
                                <span className="text-xl font-bold leading-none">{new Date(event.event_date || event.date).getDate()}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-800 truncate">{event.title}</h4>
                                <div className="flex items-center text-xs text-gray-500 gap-1 mt-1">
                                    <Calendar size={12} />
                                    <span>{new Date(event.event_date || event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </GlassCard>
    );
};

export default EventsSection;
