import React, { useEffect, useState } from 'react';
import { Briefcase, Users, Calendar, ArrowRight, AlertCircle, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../api/axios';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import { staggerContainer, cardEntrance } from '../utils/motionVariants';

const FacultyProjects = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchProjects = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await API.get('/projects/faculty');
            setProjects(res.data || []);
        } catch (e) {
            console.error(e);
            setError("Failed to load your assigned projects. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const filteredProjects = projects.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleManageGroups = (projectId) => {
        if (!projectId || projectId === "undefined") {
            toast.error("Track ID identification failure: Invalid Project.");
            return;
        }
        navigate(`/dashboard/groups?project_id=${projectId}`);
    };

    const handleManageTasks = (projectId) => {
        if (!projectId || projectId === "undefined") {
            toast.error("Track ID identification failure: Invalid Project.");
            return;
        }
        navigate(`/dashboard/tasks?project_id=${projectId}`);
    };

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-emerald-600 font-bold animate-pulse">Scanning Assigned Projects...</p>
        </div>
    );

    if (error) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-white/50 rounded-3xl border border-dashed border-red-200">
            <AlertCircle className="text-red-500 mb-4" size={48} />
            <h2 className="text-xl font-bold text-gray-800 mb-2">{error}</h2>
            <Button onClick={fetchProjects} variant="secondary">Retry Now</Button>
        </div>
    );

    return (
        <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-8 max-w-7xl mx-auto"
        >
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-800 tracking-tight">Assigned Tracks</h1>
                    <p className="text-gray-500 font-medium mt-1">Manage project groups and monitor track progression</p>
                </div>

                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Filter projects..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm shadow-sm transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Grid */}
            <AnimatePresence mode="wait">
                {filteredProjects.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-32 bg-white/40 rounded-[2.5rem] border border-dashed border-gray-200"
                    >
                        <Briefcase size={64} className="mx-auto text-gray-200 mb-6" />
                        <h3 className="text-2xl font-bold text-gray-400">No Projects Found</h3>
                        <p className="text-gray-300">Your assigned project tracks will appear here.</p>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                        {filteredProjects.map((p) => {
                            const trackId = p.id || p.project_id;
                            return (
                                <motion.div key={trackId} variants={cardEntrance} className="h-full">
                                    <GlassCard className="group h-full flex flex-col p-0 overflow-hidden hover:border-emerald-200 transition-all duration-300">
                                        <div className="p-8 flex-1">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500 shadow-sm">
                                                    <Briefcase size={28} />
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="px-3 py-1 bg-gray-50 text-gray-400 rounded-full text-[10px] font-black tracking-widest uppercase mb-1">
                                                        Track #{p.id}
                                                    </span>
                                                    <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase">
                                                        Semester {p.semester}
                                                    </span>
                                                </div>
                                            </div>

                                            <h3 className="text-2xl font-black text-gray-800 mb-3 group-hover:text-emerald-700 transition-colors">{p.title}</h3>
                                            <p className="text-sm text-gray-500 font-medium leading-relaxed mb-6 line-clamp-2">
                                                {p.description || "Comprehensive academic track for project execution and evaluation."}
                                            </p>

                                            <div className="flex gap-4 mb-8">
                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl text-xs font-bold text-gray-500">
                                                    <Users size={14} className="text-emerald-500" />
                                                    {p.visibility || "Team Based"}
                                                </div>
                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl text-xs font-bold text-gray-500">
                                                    <Calendar size={14} className="text-amber-500" />
                                                    {p.academic_year || "Current Year"}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="px-8 py-5 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center group-hover:bg-emerald-50/30 transition-colors">
                                            <button
                                                className="flex items-center gap-2 text-emerald-600 font-black text-sm uppercase tracking-wider"
                                                onClick={() => handleManageGroups(p.id || p.project_id)}
                                            >
                                                Configure Groups <ArrowRight size={16} />
                                            </button>
                                            <button
                                                className="p-2 text-gray-300 hover:text-emerald-500 transition-colors"
                                                onClick={() => handleManageTasks(p.id || p.project_id)}
                                            >
                                                <Calendar size={18} />
                                            </button>
                                        </div>
                                        <div className="h-1.5 w-full bg-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                                    </GlassCard>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default FacultyProjects;
