import React, { useEffect, useState } from 'react';
import { Plus, Clock, Newspaper } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from '../../api/axios';
import GlassCard from '../ui/GlassCard';
import { cardEntrance } from '../../utils/motionVariants';

import { useNavigate } from 'react-router-dom';

const NewsSection = () => {
    const navigate = useNavigate();
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const response = await axios.get('/news');
                setNews(response.data || []);
            } catch (error) {
                console.error("Error fetching news:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, []);

    return (
        <GlassCard className="h-full flex flex-col relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-1 h-6 bg-emerald-500 rounded-full"></span>
                    Campus News
                </h3>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/dashboard/news')}
                    className="px-3 py-2 rounded-xl border border-emerald-600 text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center gap-2 text-sm font-semibold"
                >
                    <Plus size={16} />
                    Add News
                </motion.button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {loading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse border border-gray-200"></div>)
                ) : (
                    news.map((item) => (
                        <motion.div
                            key={item.id}
                            variants={cardEntrance}
                            whileHover={{ scale: 1.02 }}
                            onClick={() => navigate('/dashboard/news')}
                            className="p-4 bg-white border border-gray-200 rounded-2xl hover:shadow-md transition-all cursor-pointer"
                        >
                            <h4 className="font-semibold text-gray-800 mb-1">{item.title}</h4>
                            <div className="flex items-center text-xs text-gray-500 gap-1 mb-2">
                                <Clock size={12} />
                                <span>{new Date(item.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{item.content}</p>
                        </motion.div>
                    ))
                )}
            </div>
        </GlassCard>
    );
};

export default NewsSection;
