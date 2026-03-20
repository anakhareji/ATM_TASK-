import React, { useEffect, useState, useMemo } from "react";
import {
    UserPlus,
    Search,
    Mail,
    User,
    Info,
    CheckCircle,
    XCircle,
    Clock,
    ArrowRight,
    ShieldCheck,
    AlertTriangle,
    X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import API from "../api/axios";
import GlassCard from "../components/ui/GlassCard";
import Button from "../components/ui/Button";
import { staggerContainer, cardEntrance } from "../utils/motionVariants";
import { getErrorMessage } from "../utils/errorHelpers";

const FacultyStudents = () => {
    // Data States
    const [students, setStudents] = useState([]);
    const [departments, setDepartments] = useState([]); // Array to store fetched departmments
    const [loading, setLoading] = useState(true);

    // UI States
    const [showModal, setShowModal] = useState(false);
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const initialForm = {
        name: "",
        email: "",
        department: "",
        semester: "",
        remarks: "",
    };
    const [formData, setFormData] = useState(initialForm);

    // Initial Data Fetch
    const fetchData = React.useCallback(async (status = "all") => {
        setLoading(true);
        try {
            const param = status === "all" ? "" : `?status=${status}`;
            const [studentsRes, deptRes] = await Promise.all([
                API.get(`/faculty/student-recommendations${param}`),
                API.get('/admin/departments')
            ]);
            setStudents(studentsRes.data || []);
            setDepartments(deptRes.data || []);
        } catch (err) {
            toast.error("Network Synchronizer: Data retrieval failed.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData(statusFilter);
    }, [statusFilter]);

    // Body Scroll Lock
    useEffect(() => {
        if (showModal) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [showModal]);

    // Handlers
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const loadToast = toast.loading("Submitting recommendation to administration...");
        try {
            await API.post("/faculty/student-recommendations", formData);
            toast.success("Recommendation successfully queued for approval.", { id: loadToast });
            setShowModal(false);
            setFormData(initialForm);
            fetchData();
        } catch (err) {
            toast.error(getErrorMessage(err, "Submission sequence failed."), { id: loadToast });
        } finally {
            setSubmitting(false);
        }
    };

    // Filtered Data
    const filteredStudents = useMemo(() => {
        return students.filter((s) => {
            const matchesStatus = statusFilter === "all" ? true : s.status === statusFilter;
            const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.email.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesStatus && matchesSearch;
        });
    }, [students, statusFilter, searchQuery]);

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
            <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-teal-600 font-bold animate-pulse">Syncing Recommendation Database...</p>
        </div>
    );

    return (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-8 max-w-7xl mx-auto pb-20">

            {/* Header Command Center */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white/50 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/20 shadow-sm sticky top-0 z-20">
                <div className="flex-1">
                    <h1 className="text-4xl font-black text-gray-800 tracking-tight flex items-center gap-3">
                        <ShieldCheck className="text-teal-600" /> Administrative Access
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">Submit student recommendations for official system enrollment and track approval status</p>
                </div>

                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text" placeholder="Identify student..."
                            className="w-full md:w-64 pl-12 pr-6 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-teal-500 font-bold text-sm"
                            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <select
                        className="px-6 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-teal-500 font-bold text-sm shadow-sm"
                        value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Global Status</option>
                        <option value="pending">Pending Validation</option>
                        <option value="approved">Authenticated</option>
                        <option value="rejected">Authorization Denied</option>
                    </select>
                    <Button
                        icon={<UserPlus size={20} />}
                        onClick={() => setShowModal(true)}
                        className="bg-teal-600 hover:bg-teal-700 shadow-xl shadow-teal-100 px-8"
                    >
                        Recommend Now
                    </Button>
                </div>
            </div>

            {/* Grid of Recommended Students */}
            <AnimatePresence mode="wait">
                {filteredStudents.length === 0 ? (
                    <div className="py-40 flex flex-col items-center text-center bg-white/40 rounded-[2.5rem] border border-dashed border-gray-200">
                        <Info size={64} className="text-gray-200 mb-6" />
                        <h3 className="text-2xl font-black text-gray-400">Zero Entries Found</h3>
                        <p className="text-gray-300 font-medium italic">Adjust your filters or initiate a new student recommendation.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredStudents.map((recommendation) => (
                            <motion.div key={recommendation.id} variants={cardEntrance}>
                                <GlassCard className="group p-0 overflow-hidden border-t-8 border-t-transparent hover:border-t-teal-500 transition-all duration-300 rounded-[2rem] shadow-sm hover:shadow-xl">
                                    <div className="p-8">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="p-4 bg-teal-50 text-teal-600 rounded-2xl group-hover:bg-teal-600 group-hover:text-white transition-all duration-500 shadow-sm">
                                                <User size={28} />
                                            </div>
                                            <span
                                                className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm
                        ${recommendation.status === "approved" ? "bg-emerald-50 text-emerald-600" :
                                                        recommendation.status === "pending" ? "bg-amber-50 text-amber-600" :
                                                            "bg-rose-50 text-rose-600"}
                      `}
                                            >
                                                {recommendation.status}
                                            </span>
                                        </div>

                                        <h3 className="text-2xl font-black text-gray-800 tracking-tight group-hover:text-teal-700 transition-colors">
                                            {recommendation.name}
                                        </h3>

                                        <div className="flex items-center gap-2 mt-2 text-gray-400 font-bold text-xs">
                                            <Mail size={14} className="text-teal-500" /> {recommendation.email}
                                        </div>

                                        <div className="mt-8 pt-6 border-t border-gray-50 flex justify-between items-center">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">Operational Detail</p>
                                                <p className="text-xs font-black text-gray-500">
                                                    {recommendation.department} | Sem {recommendation.semester}
                                                </p>
                                            </div>
                                            <div className="p-2 bg-gray-50 rounded-xl">
                                                {recommendation.status === 'approved' ? <CheckCircle size={18} className="text-emerald-500" /> :
                                                    recommendation.status === 'pending' ? <Clock size={18} className="text-amber-500 animate-pulse" /> :
                                                        <XCircle size={18} className="text-rose-500" />}
                                            </div>
                                        </div>
                                    </div>

                                    {recommendation.remarks && (
                                        <div className="px-8 py-5 bg-gray-50/50 border-t border-gray-100 italic text-[11px] text-gray-400 font-medium">
                                            " {recommendation.remarks} "
                                        </div>
                                    )}
                                </GlassCard>
                            </motion.div>
                        ))}
                    </div>
                )}
            </AnimatePresence>

            {/* Recommendation Form Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                    >
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowModal(false)} />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 50 }}
                            className="bg-white rounded-[3rem] p-10 w-full max-w-lg relative z-10 shadow-2xl border border-white"
                        >
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h2 className="text-3xl font-black text-gray-800 tracking-tight flex items-center gap-3">
                                        <UserPlus className="text-teal-600" /> Identify Student
                                    </h2>
                                    <p className="text-gray-400 font-bold text-sm mt-1">Submit recommendation for administrative vetting</p>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><X size={26} /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400">Full Name</label>
                                    <input
                                        required autoFocus
                                        placeholder="e.g. Marcus Aurelius"
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-bold text-gray-800"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400">Institutional Email</label>
                                    <input
                                        required type="email"
                                        placeholder="student_id@university.edu"
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-bold text-gray-800"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-xs font-black uppercase tracking-widest text-gray-400">Department</label>
                                        <select
                                            required
                                            className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-bold text-gray-800 text-sm"
                                            value={formData.department}
                                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        >
                                            <option value="">Select Department...</option>
                                            {departments.map(d => (
                                                <option key={d.id} value={d.name}>{d.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-xs font-black uppercase tracking-widest text-gray-400">Current Semester</label>
                                        <input
                                            required
                                            placeholder="e.g. 4"
                                            className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-bold text-gray-800 text-sm text-center"
                                            value={formData.semester}
                                            onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400">Faculty Remarks</label>
                                    <textarea
                                        rows={4}
                                        placeholder="Justification for student recommendation..."
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium text-sm leading-relaxed"
                                        value={formData.remarks}
                                        onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                    />
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <Button type="button" variant="secondary" className="flex-1 py-5" onClick={() => setShowModal(false)}>Cancel Sequence</Button>
                                    <Button type="submit" className="flex-1 bg-teal-600 hover:bg-teal-700 py-5 shadow-xl shadow-teal-100" disabled={submitting}>
                                        {submitting ? 'Authenticating...' : 'Authorize Submission'}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default FacultyStudents;
