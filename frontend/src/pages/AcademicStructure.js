import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Layers, Plus, Trash2, Edit2, Search, BookOpen, Users as UsersIcon,
    CheckCircle, XCircle, AlertTriangle, Briefcase, GraduationCap,
    RefreshCw, Building2, BookMarked, TrendingUp, MoreHorizontal, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import AdminGlassLayout from '../components/layout/AdminGlassLayout';
import API from '../api/axios';

/* ─────────────────────────────────────────────
   ANIMATION VARIANTS
───────────────────────────────────────────── */
const fade = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } }, exit: { opacity: 0, y: -8 } };
const stagger = { visible: { transition: { staggerChildren: 0.06 } } };

/* ─────────────────────────────────────────────
   SHARED FIELD CLASSES
───────────────────────────────────────────── */
const fieldCls = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 transition-all";
const labelCls = "block text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 mb-1.5 ml-0.5";

/* ─────────────────────────────────────────────
   MODAL WRAPPER
───────────────────────────────────────────── */
const Modal = ({ open, title, onClose, onSave, saveLabel = 'Save', saveColor = 'emerald', children, loading }) => {
    if (!open) return null;
    const colors = { emerald: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20', red: 'bg-red-600 hover:bg-red-500 shadow-red-500/20', indigo: 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20' };
    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 16 }}
                className="relative bg-white rounded-[2rem] shadow-2xl shadow-gray-900/10 w-full max-w-lg border border-gray-100"
            >
                <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
                    <h2 className="text-xl font-black text-gray-800">{title}</h2>
                    <button onClick={onClose} className="p-2 text-gray-300 hover:text-gray-600 transition-colors rounded-xl hover:bg-gray-50">
                        <XCircle size={20} />
                    </button>
                </div>
                <div className="px-8 py-6">{children}</div>
                <div className="flex justify-end gap-3 px-8 py-5 border-t border-gray-100 bg-gray-50/40 rounded-b-[2rem]">
                    <button onClick={onClose} className="px-6 py-2.5 rounded-2xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={onSave}
                        disabled={loading}
                        className={`px-8 py-2.5 rounded-2xl text-sm font-black text-white shadow-lg transition-all duration-200 active:scale-95 disabled:opacity-50 ${colors[saveColor]}`}
                    >
                        {loading ? 'Processing...' : saveLabel}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

/* ─────────────────────────────────────────────
   BADGE
───────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
    const active = status === 'active';
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
            {active ? <CheckCircle size={10} /> : <XCircle size={10} />}
            {status}
        </span>
    );
};

/* ─────────────────────────────────────────────
   STAT CARD
───────────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, color, bg }) => (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm shadow-gray-200/50 flex items-center gap-5 hover:shadow-md hover:border-gray-200 transition-all duration-300">
        <div className={`${bg} ${color} p-3.5 rounded-2xl shrink-0`}>
            <Icon size={22} />
        </div>
        <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">{label}</p>
            <p className="text-2xl font-black text-gray-800 leading-none">{value}</p>
        </div>
    </div>
);

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
const AcademicStructure = () => {
    const role = localStorage.getItem('userRole');
    const [activeTab, setActiveTab] = useState('departments');
    const [loading, setLoading] = useState(true);
    const [saveLoading, setSaveLoading] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [courses, setCourses] = useState([]);
    const [workload, setWorkload] = useState([]);
    const [search, setSearch] = useState('');
    const [deptFilter, setDeptFilter] = useState('');
    const [years, setYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState(null);
    const [programs, setPrograms] = useState([]);
    const [semesters, setSemesters] = useState([]);
    const [coursesV1, setCoursesV1] = useState([]);
    const [departmentsV1, setDepartmentsV1] = useState([]);
    const [showArchived, setShowArchived] = useState(false);
    const [activity, setActivity] = useState([]);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedDept, setSelectedDept] = useState(null);
    const [expandedPrograms, setExpandedPrograms] = useState({});

    // Department modal
    const deptDefault = { open: false, id: null, name: '', code: '', description: '', status: 'active' };
    const [deptModal, setDeptModal] = useState(deptDefault);

    // Program modal
    const programDefault = { open: false, department_id: '', name: '', type: 'UG', duration_years: 3, intake_capacity: 60 };
    const [programModal, setProgramModal] = useState(programDefault);

    // Course modal
    const courseDefault = { open: false, id: null, department_id: '', name: '', duration: 2, total_semesters: 4, status: 'active' };
    const [courseModal, setCourseModal] = useState(courseDefault);

    // Course (v1) modal for inline add under Program
    const courseV1Default = { open: false, program_id: '', name: '', batch: '', credits: 0, code: '' };
    const [courseV1Modal, setCourseV1Modal] = useState(courseV1Default);

    // List of departments for dropdowns (legacy)
    const [legacyDepts, setLegacyDepts] = useState([]);

    // Faculty assignment modal
    const facultyDefault = { open: false, id: null, name: '', department_id: '', course_id: '' };
    const [facultyModal, setFacultyModal] = useState(facultyDefault);

    // Delete confirmation
    const [deleteModal, setDeleteModal] = useState({ open: false, type: '', id: null, name: '' });

    /* ── Fetch ── */
    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const results = await Promise.allSettled([
                API.get('/academic/departments'),
                API.get('/academic/courses'),
                API.get('/academic/faculty/workload'),
                API.get('/v1/academic-structure/academic-years'),
                API.get('/v1/academic-structure/programs'),
                API.get('/v1/academic-structure/semesters'),
                API.get('/v1/academic-structure/courses'),
                API.get('/v1/academic-structure/departments', { params: { page: 1, page_size: 100, academic_year_id: selectedYear?.id || undefined } }),
                API.get('/admin/audit-logs/?limit=8'),
                API.get('/v1/academic-structure/overview'),
            ]);
            const get = (i) => results[i].status === 'fulfilled' ? results[i].value.data : null;
            const d = get(0), c = get(1), w = get(2), y = get(3), p = get(4), s = get(5), c1 = get(6), dv1 = get(7), a = get(8), ov = get(9);
            setDepartments(Array.isArray(d) ? d : []);
            setLegacyDepts(Array.isArray(d) ? d : []);
            setCourses(Array.isArray(c) ? c : []);
            setWorkload(Array.isArray(w) ? w : []);
            setYears(Array.isArray(y) ? y : []);
            setPrograms(Array.isArray(p) ? p : []);
            setSemesters(Array.isArray(s) ? s : []);
            setCoursesV1(Array.isArray(c1) ? c1 : []);
            setDepartmentsV1(Array.isArray(dv1?.items) ? dv1.items : []);
            setActivity(Array.isArray(a) ? a : []);
            setStats(ov && typeof ov === 'object' ? ov : { total_departments: 0, active_courses: 0, faculty_count: 0, enrollment_count: 0 });
            if (!selectedYear && Array.isArray(y) && y.length) {
                setSelectedYear(y[0]);
            }
            const anyRejected = results.some(r => r.status === 'rejected');
            if (anyRejected) toast.error('Some academic data failed to load, showing partial results');
        } catch (err) {
            toast.error('Failed to load academic data');
        } finally {
            setLoading(false);
        }
    }, [selectedYear]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    /* ── Filtered lists ── */
    const filteredDepts = useMemo(() => {
        const base = selectedYear
            ? departmentsV1.filter(d => d.academic_year_id === selectedYear.id && !d.is_archived)
            : departmentsV1.filter(d => !d.is_archived);
        return base.filter(d =>
            d.name?.toLowerCase().includes(search.toLowerCase()) ||
            d.code?.toLowerCase().includes(search.toLowerCase())
        );
    }, [departmentsV1, search, selectedYear]);

    const filteredCourses = useMemo(() =>
        courses.filter(c => {
            const matchSearch = c.name?.toLowerCase().includes(search.toLowerCase()) ||
                c.department_name?.toLowerCase().includes(search.toLowerCase());
            const matchFilter = !deptFilter || c.department_id === parseInt(deptFilter);
            return matchSearch && matchFilter;
        }), [courses, search, deptFilter]);

    const filteredWorkload = useMemo(() =>
        workload.filter(w =>
            w.name?.toLowerCase().includes(search.toLowerCase()) ||
            w.department?.toLowerCase().includes(search.toLowerCase())
        ), [workload, search]);

    /* ── Stats ── */
    const [stats, setStats] = useState({ total_departments: 0, active_courses: 0, faculty_count: 0, enrollment_count: 0 });

    /* ── Department CRUD ── */
    const saveDept = async () => {
        if (!deptModal.name.trim() || !deptModal.code.trim()) return toast.error('Name and Code are required');
        if (!selectedYear) return toast.error('Select an Academic Year first');
        setSaveLoading(true);
        try {
            if (deptModal.id) {
                await API.put(`/academic/departments/${deptModal.id}`, deptModal);
                toast.success('Department updated!');
            } else {
                await API.post('/v1/academic-structure/departments', { ...deptModal, academic_year_id: selectedYear.id });
                toast.success('Department created!');
                setStats(s => ({ ...s, total_departments: (s.total_departments || 0) + 1 }));
            }
            setDeptModal(deptDefault);
            fetchAll();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Operation failed');
        } finally {
            setSaveLoading(false);
        }
    };

    const saveProgram = async () => {
        if (!programModal.department_id || !programModal.name.trim()) return toast.error('Program name and department are required');
        setSaveLoading(true);
        try {
            const payload = {
                department_id: parseInt(programModal.department_id),
                name: programModal.name,
                type: programModal.type,
                duration_years: parseInt(programModal.duration_years),
                intake_capacity: parseInt(programModal.intake_capacity)
            };
            await API.post('/v1/academic-structure/programs', payload);
            toast.success('Program created!');
            setProgramModal(programDefault);
            fetchAll();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Operation failed');
        } finally {
            setSaveLoading(false);
        }
    };

    const saveCourseV1 = async () => {
        if (!courseV1Modal.program_id || !courseV1Modal.name.trim()) return toast.error('Course name and program are required');
        setSaveLoading(true);
        try {
            const payload = {
                program_id: parseInt(courseV1Modal.program_id),
                name: courseV1Modal.name,
                batch: courseV1Modal.batch,
                credits: parseInt(courseV1Modal.credits || 0),
                code: courseV1Modal.code || undefined
            };
            await API.post('/v1/academic-structure/courses', payload);
            toast.success('Course added!');
            setCourseV1Modal(courseV1Default);
            fetchAll();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Operation failed');
        } finally {
            setSaveLoading(false);
        }
    };

    const toggleDeptStatus = async (dept) => {
        try {
            if (dept.status === 'active') {
                await API.delete(`/v1/academic-structure/departments/${dept.id}`);
                toast.success('Department archived');
            } else {
                await API.patch(`/v1/academic-structure/departments/${dept.id}/activate`);
                toast.success('Department activated');
            }
            fetchAll();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Status update failed');
        }
    };

    /* ── Course CRUD ── */
    const saveCourse = async () => {
        if (!courseModal.name.trim() || !courseModal.department_id) return toast.error('Name and Department are required');
        setSaveLoading(true);
        try {
            const payload = {
                department_id: parseInt(courseModal.department_id),
                name: courseModal.name,
                duration: parseInt(courseModal.duration),
                total_semesters: parseInt(courseModal.total_semesters),
                status: courseModal.status,
            };
            if (courseModal.id) {
                await API.put(`/academic/courses/${courseModal.id}`, payload);
                toast.success('Course updated!');
            } else {
                await API.post('/academic/courses', payload);
                toast.success('Course created!');
                setStats(s => ({ ...s, active_courses: (s.active_courses || 0) + 1 }));
            }
            setCourseModal(courseDefault);
            fetchAll();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Operation failed');
        } finally {
            setSaveLoading(false);
        }
    };

    const toggleCourseStatus = async (course) => {
        try {
            await API.put(`/academic/courses/${course.id}`, { ...course, status: course.status === 'active' ? 'archived' : 'active' });
            toast.success(`Course ${course.status === 'active' ? 'archived' : 'activated'}`);
            fetchAll();
        } catch { toast.error('Status update failed'); }
    };

    const saveFacultyAssignment = async () => {
        if (!facultyModal.department_id) return toast.error('Department is required');
        setSaveLoading(true);
        try {
            await API.put(`/academic/faculty/${facultyModal.id}/assign`, null, {
                params: {
                    department_id: facultyModal.department_id,
                    course_id: facultyModal.course_id || undefined
                }
            });
            toast.success('Faculty assignment updated!');
            setFacultyModal(facultyDefault);
            fetchAll();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Assignment failed');
        } finally {
            setSaveLoading(false);
        }
    };

    /* ── Delete ── */
    const confirmDelete = async () => {
        setSaveLoading(true);
        try {
            if (deleteModal.type === 'dept') {
                await API.delete(`/v1/academic-structure/departments/${deleteModal.id}`);
                setStats(s => ({ ...s, total_departments: Math.max(0, (s.total_departments || 0) - 1) }));
            } else {
                await API.delete(`/v1/academic-structure/courses/${deleteModal.id}`);
                setStats(s => ({ ...s, active_courses: Math.max(0, (s.active_courses || 0) - 1) }));
            }
            toast.success(`"${deleteModal.name}" removed`);
            setDeleteModal({ open: false, type: '', id: null, name: '' });
            fetchAll();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Cannot delete — active dependencies exist');
        } finally {
            setSaveLoading(false);
        }
    };

    /* ── Tab config ── */
    const TABS = [
        { id: 'departments', label: 'Departments', icon: Building2, count: departments.length },
        { id: 'courses', label: 'Academic Streams', icon: BookMarked, count: courses.length },
        { id: 'workload', label: 'Faculty Allocation', icon: Briefcase, count: workload.length },
    ];

    return (
        <AdminGlassLayout>
            <div className="pb-20 space-y-8">

                {/* ── Page Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                                <GraduationCap size={20} className="text-white" />
                            </div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Academic Structure</h1>
                        </div>
                        <p className="text-sm text-gray-400 font-medium pl-1">Manage departments, courses, and faculty allocation across the institution</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <select
                            value={selectedYear?.id || ''}
                            onChange={e => {
                                const yr = years.find(y => y.id === parseInt(e.target.value));
                                setSelectedYear(yr || null);
                                if (yr) toast.success(`Academic Year ${yr.name}${yr.locked ? ' (Locked)' : ''}`);
                            }}
                            className="px-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-600 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 min-w-[180px] shadow-sm appearance-none"
                        >
                            <option value="">Select Year</option>
                            {years.map(y => <option key={y.id} value={y.id}>{y.name}{y.locked ? ' (Locked)' : ''}</option>)}
                        </select>
                        {(!years || years.length === 0) && (
                            <button
                                onClick={async () => {
                                    const name = window.prompt('Enter Academic Year label (e.g., 2024-2025)');
                                    if (!name || !name.trim()) return;
                                    try {
                                        const res = await API.post('/v1/academic-structure/academic-years', { name: name.trim() });
                                        const created = res.data;
                                        const updated = [created, ...years];
                                        setYears(updated);
                                        setSelectedYear(created);
                                        toast.success(`Academic Year ${created.name} created and selected`);
                                    } catch (e) {
                                        toast.error(e?.response?.data?.detail || 'Failed to create year');
                                    }
                                }}
                                className="px-4 py-2.5 rounded-2xl border border-emerald-200 text-emerald-600 hover:bg-emerald-50 text-sm font-black transition-all"
                            >
                                Add Year
                            </button>
                        )}
                        <button onClick={fetchAll} className="p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all">
                            <RefreshCw size={18} />
                        </button>
                        {selectedYear && (role === 'admin' || role === 'super_admin') && (
                            <button
                                onClick={async () => {
                                    try {
                                        const res = await API.patch(`/v1/academic-structure/academic-years/${selectedYear.id}/toggle-lock`);
                                        const locked = res.data.locked;
                                        const updatedYears = years.map(y => y.id === selectedYear.id ? { ...y, locked } : y);
                                        setYears(updatedYears);
                                        setSelectedYear({ ...selectedYear, locked });
                                        toast.success(locked ? 'Academic Year locked' : 'Academic Year unlocked');
                                    } catch (e) {
                                        toast.error(e?.response?.data?.detail || 'Toggle failed');
                                    }
                                }}
                                className={`px-4 py-2.5 rounded-2xl border ${selectedYear.locked ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'} text-sm font-black transition-all`}
                            >
                                {selectedYear.locked ? 'Unlock Year' : 'Lock Year'}
                            </button>
                        )}
                        {activeTab !== 'workload' && (
                            <button
                                onClick={() => {
                                    if (!selectedYear) {
                                        toast.error('Select an Academic Year to enable create/edit operations');
                                        return;
                                    }
                                    if (activeTab === 'departments') {
                                        setDeptModal({ ...deptDefault, open: true });
                                    } else {
                                        setCourseModal({ ...courseDefault, open: true });
                                    }
                                }}
                                disabled={selectedYear?.locked}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-black shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
                            >
                                <Plus size={18} />
                                New {activeTab === 'departments' ? 'Department' : 'Course'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Governance banner */}
                {(!selectedYear || selectedYear?.locked) && (
                    <div className={`mt-4 rounded-2xl border px-4 py-3 ${!selectedYear ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                        <div className="flex items-center gap-2">
                            <AlertTriangle size={16} />
                            <p className="text-sm font-bold">
                                {!selectedYear
                                    ? 'Select an Academic Year to enable create/edit operations.'
                                    : 'Academic Year is locked. Structural changes are restricted.'}
                            </p>
                        </div>
                    </div>
                )}

                {/* ── Stats Row ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard icon={Building2} label="Total Departments" value={stats.total_departments} color="text-indigo-600" bg="bg-indigo-50" />
                    <StatCard icon={BookMarked} label="Active Courses" value={stats.active_courses} color="text-emerald-600" bg="bg-emerald-50" />
                    <StatCard icon={UsersIcon} label="Enrolled Students" value={stats.enrollment_count} color="text-teal-600" bg="bg-teal-50" />
                    <StatCard icon={Briefcase} label="Faculty Members" value={stats.faculty_count} color="text-purple-600" bg="bg-purple-50" />
                </div>

                {/* ── Search & Filters ── */}
                <div className="flex flex-wrap gap-3 items-center">
                    <div className="relative flex-1 min-w-[240px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder={`Search ${activeTab}...`}
                            className="w-full pl-11 pr-5 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 transition-all shadow-sm"
                        />
                    </div>
                    {activeTab === 'courses' && (
                        <select
                            value={deptFilter}
                            onChange={e => setDeptFilter(e.target.value)}
                            className="px-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-600 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 min-w-[180px] shadow-sm appearance-none"
                        >
                            <option value="">All Departments</option>
                            {departmentsV1.filter(d => !d.is_archived).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    )}
                </div>

                {/* ── Tabs ── */}
                <div className="flex flex-wrap gap-2 bg-gray-100/70 p-1.5 rounded-2xl w-fit border border-gray-100">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setSearch(''); setDeptFilter(''); }}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all duration-300 ${activeTab === tab.id
                                ? 'bg-white shadow-md text-emerald-600 border border-gray-100'
                                : 'text-gray-400 hover:text-gray-700'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-black ${activeTab === tab.id ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-500'}`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-gray-400">Departments</div>
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-600">
                        <input
                            type="checkbox"
                            checked={showArchived}
                            onChange={async (e) => {
                                setShowArchived(e.target.checked);
                                try {
                                    const res = await API.get('/v1/academic-structure/departments', { params: { page: 1, page_size: 100, academic_year_id: selectedYear?.id || undefined, archived: e.target.checked } });
                                    setDepartmentsV1(Array.isArray(res.data?.items) ? res.data.items : []);
                                } catch { }
                            }}
                        />
                        Show Archived
                    </label>
                </div>

                {/* ── Loading Skeleton ── */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-48 bg-white border border-gray-100 rounded-3xl" />
                        ))}
                    </div>
                ) : (
                    <AnimatePresence mode="wait">

                        {/* ══════════════════════ DEPARTMENTS ══════════════════════ */}
                        {activeTab === 'departments' && (
                            <motion.div key="depts" variants={stagger} initial="hidden" animate="visible" exit="exit">
                                {filteredDepts.length === 0 ? (
                                    <div className="py-32 text-center border-2 border-dashed border-gray-100 rounded-[3rem]">
                                        <Building2 size={48} className="mx-auto mb-3 text-gray-200" />
                                        <p className="text-gray-400 font-bold text-sm">No departments found</p>
                                        <p className="text-gray-300 text-xs mt-1">Create your first department to get started</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {filteredDepts.map(dept => {
                                            const dPrograms = programs.filter(pr => pr.department_id === dept.id);
                                            const ug = dPrograms.find(pr => (pr.type || '').toUpperCase() === 'UG');
                                            const pg = dPrograms.find(pr => (pr.type || '').toUpperCase() === 'PG');
                                            const ugCourseCount = coursesV1.filter(c => c.program_id === ug?.id).length;
                                            const pgCourseCount = coursesV1.filter(c => c.program_id === pg?.id).length;
                                            return (
                                                <motion.div key={dept.id} variants={fade}>
                                                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-indigo-100 transition-all duration-300 group overflow-hidden">
                                                        {/* Color top stripe */}
                                                        <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500" />
                                                        <div className="p-6">
                                                            <div className="flex items-start justify-between mb-5">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                                        <Building2 size={20} />
                                                                    </div>
                                                                    <div>
                                                                        <h3 className="text-base font-black text-gray-800 leading-tight">{dept.name}</h3>
                                                                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">{dept.code}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <StatusBadge status={dept.is_active ? 'active' : 'inactive'} />
                                                                    <button
                                                                        onClick={() => { setSelectedDept(dept); setDetailsOpen(true); }}
                                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                                                                        title="View details"
                                                                    >
                                                                        <MoreHorizontal size={16} />
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 min-h-[32px] mb-5">
                                                                {dept.description || 'No description provided for this department.'}
                                                            </p>
                                                            <div className="space-y-2 mb-5">
                                                                {ug && (
                                                                    <div className="flex items-center justify-between">
                                                                        <p className="text-xs font-bold text-gray-600">UG: {ug.name}</p>
                                                                        <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">{ugCourseCount} {ugCourseCount === 1 ? 'course' : 'courses'}</span>
                                                                    </div>
                                                                )}
                                                                {pg && (
                                                                    <div className="flex items-center justify-between">
                                                                        <p className="text-xs font-bold text-gray-600">PG: {pg.name}</p>
                                                                        <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-purple-50 text-purple-600 border border-purple-100">{pgCourseCount} {pgCourseCount === 1 ? 'course' : 'courses'}</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                                                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                                                                    <BookOpen size={13} className="text-indigo-400" />
                                                                    {(ugCourseCount + pgCourseCount)} {(ugCourseCount + pgCourseCount) === 1 ? 'course' : 'courses'}
                                                                </div>
                                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button
                                                                        onClick={() => toggleDeptStatus({ ...dept, status: dept.is_active ? 'active' : 'inactive' })}
                                                                        className={`p-1.5 rounded-lg text-xs transition-colors ${dept.is_active ? 'text-amber-500 hover:bg-amber-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                                                                        title={dept.is_active ? 'Archive' : 'Activate'}
                                                                    >
                                                                        {dept.is_active ? <XCircle size={16} /> : <CheckCircle size={16} />}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setDeleteModal({ open: true, type: 'dept', id: dept.id, name: dept.name })}
                                                                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )
                                        })}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* ══════════════════════ COURSES ══════════════════════ */}
                        {activeTab === 'courses' && (
                            <motion.div key="courses" variants={fade} initial="hidden" animate="visible" exit="exit">
                                {filteredCourses.length === 0 ? (
                                    <div className="py-32 text-center border-2 border-dashed border-gray-100 rounded-[3rem]">
                                        <BookMarked size={48} className="mx-auto mb-3 text-gray-200" />
                                        <p className="text-gray-400 font-bold text-sm">No courses found</p>
                                        <p className="text-gray-300 text-xs mt-1">Create a department first, then add courses</p>
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden">
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-50/80 border-b border-gray-100">
                                                <tr>
                                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Course</th>
                                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Department</th>
                                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Structure</th>
                                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Students</th>
                                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Status</th>
                                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {filteredCourses.map(course => (
                                                    <tr key={course.id} className="group hover:bg-emerald-50/25 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                                                                    <BookMarked size={17} />
                                                                </div>
                                                                <p className="font-black text-gray-800 text-sm">{course.name}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-xs font-bold px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100/50">
                                                                {course.department_name}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <p className="text-xs font-bold text-gray-600">
                                                                {course.duration}yr · {course.total_semesters} sem
                                                            </p>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <div className="flex items-center justify-center gap-1.5">
                                                                <UsersIcon size={13} className="text-teal-500" />
                                                                <span className="text-xs font-black text-teal-600">{course.student_count ?? 0}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <StatusBadge status={course.status} />
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={() => toggleCourseStatus(course)}
                                                                    className={`p-1.5 rounded-lg transition-colors ${course.status === 'active' ? 'text-amber-500 hover:bg-amber-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                                                                    title={course.status === 'active' ? 'Archive' : 'Activate'}
                                                                >
                                                                    {course.status === 'active' ? <XCircle size={15} /> : <CheckCircle size={15} />}
                                                                </button>
                                                                <button
                                                                    onClick={() => setCourseModal({ open: true, id: course.id, name: course.name, department_id: course.department_id, duration: course.duration, total_semesters: course.total_semesters, status: course.status })}
                                                                    className="p-1.5 rounded-lg text-indigo-400 hover:bg-indigo-50 transition-colors"
                                                                >
                                                                    <Edit2 size={15} />
                                                                </button>
                                                                <button
                                                                    onClick={() => setDeleteModal({ open: true, type: 'course', id: course.id, name: course.name })}
                                                                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                                                                >
                                                                    <Trash2 size={15} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* ══════════════════════ WORKLOAD ══════════════════════ */}
                        {activeTab === 'workload' && (
                            <motion.div key="workload" variants={fade} initial="hidden" animate="visible" exit="exit">
                                {filteredWorkload.length === 0 ? (
                                    <div className="py-32 text-center border-2 border-dashed border-gray-100 rounded-[3rem]">
                                        <Briefcase size={48} className="mx-auto mb-3 text-gray-200" />
                                        <p className="text-gray-400 font-bold text-sm">No faculty data available</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                        {filteredWorkload.map((f, idx) => {
                                            const pct = Math.min(Math.round((f.project_count / 10) * 100), 100);
                                            const barColor = pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-amber-500' : 'bg-emerald-500';
                                            return (
                                                <motion.div key={f.id} variants={fade}>
                                                    <div
                                                        onClick={() => setFacultyModal({ open: true, id: f.id, name: f.name, department_id: f.department_id || '', course_id: f.course_id || '' })}
                                                        className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group relative"
                                                    >
                                                        <div className="flex items-center gap-3 mb-4">
                                                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center font-black text-indigo-600 text-sm border border-indigo-100">
                                                                {f.name?.[0]?.toUpperCase()}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-black text-gray-800 text-sm truncate">{f.name}</p>
                                                                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider truncate">{f.department}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-xs font-bold text-gray-400">Project Load</span>
                                                            <span className="text-xs font-black text-gray-700">{f.project_count} / 10</span>
                                                        </div>
                                                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
                                                                style={{ width: `${pct}%` }}
                                                            />
                                                        </div>
                                                        <div className="mt-3 text-right">
                                                            <span className={`text-[10px] font-black uppercase tracking-widest ${pct > 80 ? 'text-red-500' : pct > 50 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                                                {pct > 80 ? 'Overloaded' : pct > 50 ? 'Moderate' : 'Available'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}
                            </motion.div>
                        )}

                    </AnimatePresence>
                )}
            </div>

            {showArchived && departmentsV1.filter(d => d.is_archived).length > 0 && (
                <div className="mt-8">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Archived Departments</h3>
                        <button onClick={() => setShowArchived(false)} className="text-xs font-bold text-gray-500 px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50">Hide</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {departmentsV1.filter(d => d.is_archived).map(d => (
                            <div key={d.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-500">
                                            <Building2 size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-gray-800">{d.name}</p>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{d.code}</span>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600 border border-gray-200">ARCHIVED</span>
                                </div>
                                <div className="mt-3 text-xs text-gray-500 font-bold">Tap “Show Archived” to manage</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Activity */}
            {!loading && activity.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-3">Recent Activity</h3>
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <ul className="divide-y divide-gray-100">
                            {activity.map(item => (
                                <li key={item.id} className="px-6 py-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <TrendingUp size={16} className="text-indigo-500" />
                                        <p className="text-sm font-bold text-gray-700">{item.action}</p>
                                    </div>
                                    <p className="text-xs text-gray-400">{item.timestamp?.replace('T', ' ').slice(0, 19)}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* Department Details Panel */}
            <AnimatePresence>
                {detailsOpen && selectedDept && (
                    <div className="fixed inset-0 z-[70]">
                        <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setDetailsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 40 }}
                            className="absolute right-0 top-0 bottom-0 w-full sm:w-[480px] bg-white border-l border-gray-100 shadow-2xl"
                        >
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">Department</p>
                                    <h3 className="text-xl font-black text-gray-900">{selectedDept.name}</h3>
                                </div>
                                <button onClick={() => setDetailsOpen(false)} className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50">
                                    <XCircle size={18} />
                                </button>
                            </div>
                            <div className="p-6 space-y-6 overflow-y-auto h-full">
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-gray-50 rounded-2xl p-3 text-center">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Programs</p>
                                        <p className="text-lg font-black text-gray-800">{programs.filter(pr => pr.department_id === selectedDept.id).length}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-2xl p-3 text-center">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Courses</p>
                                        <p className="text-lg font-black text-gray-800">{courses.filter(c => c.department_id === selectedDept.id).length}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-2xl p-3 text-center">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Active Semesters</p>
                                        <p className="text-lg font-black text-gray-800">
                                            {semesters.filter(sm => programs.some(pr => pr.id === sm.program_id && pr.department_id === selectedDept.id)).length}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-2">Programs</h4>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-xs font-bold text-gray-500">Manage Programs</div>
                                        <button
                                            onClick={() => setProgramModal({
                                                ...programDefault,
                                                open: true,
                                                department_id: selectedDept.id
                                            })}
                                            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black"
                                        >
                                            + Add Program
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {programs.filter(pr => pr.department_id === selectedDept.id).map(pr => (
                                            <div key={pr.id} className="bg-gray-50 rounded-2xl p-3">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-800">{pr.name}</p>
                                                        <p className="text-xs text-gray-400 font-bold">{pr.type}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => setExpandedPrograms(ep => ({ ...ep, [pr.id]: !ep[pr.id] }))}
                                                        className="px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 text-xs font-bold"
                                                    >
                                                        {expandedPrograms[pr.id] ? 'Hide' : 'Expand'}
                                                    </button>
                                                </div>
                                                {expandedPrograms[pr.id] && (
                                                    <div className="mt-3 space-y-3">
                                                        <div>
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Courses</p>
                                                            <div className="space-y-2">
                                                                {coursesV1.filter(c => c.program_id === pr.id).map(c => (
                                                                    <div key={c.id} className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-2.5">
                                                                        <p className="text-sm font-bold text-gray-700">{c.name || c.title}</p>
                                                                        <StatusBadge status={c.is_active ? 'active' : 'inactive'} />
                                                                    </div>
                                                                ))}
                                                                <button
                                                                    onClick={() => setCourseV1Modal({ ...courseV1Default, open: true, program_id: pr.id })}
                                                                    className="mt-2 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black"
                                                                >
                                                                    Add Course
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Semesters</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {semesters.filter(sm => sm.program_id === pr.id).map(sm => (
                                                                    <span key={sm.id} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white border border-gray-100 text-gray-600">
                                                                        Sem {sm.number}
                                                                    </span>
                                                                ))}
                                                                {semesters.filter(sm => sm.program_id === pr.id).length === 0 && (
                                                                    <span className="text-xs text-gray-400 font-bold">None</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {programs.filter(pr => pr.department_id === selectedDept.id).length === 0 && (
                                            <div className="py-16 text-center border-2 border-dashed border-gray-100 rounded-[2rem]">
                                                <Layers size={32} className="mx-auto mb-2 text-gray-200" />
                                                <p className="text-gray-400 font-bold text-sm">No programs found</p>
                                                <button
                                                    onClick={() => setProgramModal({ ...programDefault, open: true, department_id: selectedDept.id })}
                                                    className="mt-3 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                                                >
                                                    Add Program
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ══════════════════════════ MODALS ══════════════════════════ */}

            {/* Department Create/Edit */}
            <AnimatePresence>
                {deptModal.open && (
                    <Modal
                        open
                        title={deptModal.id ? 'Edit Department' : 'Create Department'}
                        onClose={() => setDeptModal(deptDefault)}
                        onSave={saveDept}
                        saveLabel={deptModal.id ? 'Update' : 'Create'}
                        loading={saveLoading}
                    >
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2">
                                    <label className={labelCls}>Department Name *</label>
                                    <input
                                        type="text"
                                        className={fieldCls}
                                        placeholder="e.g. Computer Applications"
                                        value={deptModal.name}
                                        onChange={e => setDeptModal(m => ({ ...m, name: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>Code *</label>
                                    <input
                                        type="text"
                                        className={fieldCls}
                                        placeholder="MCA"
                                        value={deptModal.code}
                                        onChange={e => setDeptModal(m => ({ ...m, code: e.target.value.toUpperCase() }))}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className={labelCls}>Description</label>
                                <textarea
                                    className={`${fieldCls} resize-none h-24`}
                                    placeholder="Brief description of the department's objectives..."
                                    value={deptModal.description}
                                    onChange={e => setDeptModal(m => ({ ...m, description: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className={labelCls}>Status</label>
                                <select
                                    className={fieldCls}
                                    value={deptModal.status}
                                    onChange={e => setDeptModal(m => ({ ...m, status: e.target.value }))}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                    </Modal>
                )}
            </AnimatePresence>

            {/* Course Create/Edit */}
            <AnimatePresence>
                {courseModal.open && (
                    <Modal
                        open
                        title={courseModal.id ? 'Edit Course' : 'Create Course'}
                        onClose={() => setCourseModal(courseDefault)}
                        onSave={saveCourse}
                        saveLabel={courseModal.id ? 'Update' : 'Create'}
                        loading={saveLoading}
                    >
                        <div className="space-y-4">
                            <div>
                                <label className={labelCls}>Parent Department *</label>
                                <select
                                    className={fieldCls}
                                    value={courseModal.department_id}
                                    onChange={e => setCourseModal(m => ({ ...m, department_id: e.target.value }))}
                                >
                                    <option value="">— Select Department —</option>
                                    {departmentsV1.filter(d => d.is_active && !d.is_archived).map(d => (
                                        <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>Course Name *</label>
                                <input
                                    type="text"
                                    className={fieldCls}
                                    placeholder="e.g. Master of Computer Applications"
                                    value={courseModal.name}
                                    onChange={e => setCourseModal(m => ({ ...m, name: e.target.value }))}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>Duration (Years)</label>
                                    <input
                                        type="number"
                                        min="1" max="6"
                                        className={fieldCls}
                                        value={courseModal.duration}
                                        onChange={e => setCourseModal(m => ({ ...m, duration: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>Total Semesters</label>
                                    <input
                                        type="number"
                                        min="1" max="12"
                                        className={fieldCls}
                                        value={courseModal.total_semesters}
                                        onChange={e => setCourseModal(m => ({ ...m, total_semesters: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className={labelCls}>Status</label>
                                <select
                                    className={fieldCls}
                                    value={courseModal.status}
                                    onChange={e => setCourseModal(m => ({ ...m, status: e.target.value }))}
                                >
                                    <option value="active">Active</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>
                        </div>
                    </Modal>
                )}
            </AnimatePresence>

            {/* Program Create */}
            <AnimatePresence>
                {programModal.open && (
                    <Modal
                        open
                        title="Create Program"
                        onClose={() => setProgramModal(programDefault)}
                        onSave={saveProgram}
                        saveLabel="Create"
                        loading={saveLoading}
                    >
                        <div className="space-y-4">
                            <div>
                                <label className={labelCls}>Department *</label>
                                <select
                                    className={fieldCls}
                                    value={programModal.department_id}
                                    onChange={e => setProgramModal(m => ({ ...m, department_id: e.target.value }))}
                                >
                                    <option value="">— Select Department —</option>
                                    {departmentsV1.filter(d => d.is_active && !d.is_archived).map(d => (
                                        <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>Program Name *</label>
                                    <input
                                        type="text"
                                        className={fieldCls}
                                        placeholder="e.g. Bachelor of Computer Applications"
                                        value={programModal.name}
                                        onChange={e => setProgramModal(m => ({ ...m, name: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>Type</label>
                                    <select
                                        className={fieldCls}
                                        value={programModal.type}
                                        onChange={e => setProgramModal(m => ({ ...m, type: e.target.value }))}
                                    >
                                        <option value="UG">UG</option>
                                        <option value="PG">PG</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>Duration (Years)</label>
                                    <input
                                        type="number"
                                        min="1" max="6"
                                        className={fieldCls}
                                        value={programModal.duration_years}
                                        onChange={e => setProgramModal(m => ({ ...m, duration_years: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>Intake Capacity</label>
                                    <input
                                        type="number"
                                        min="10" max="1000"
                                        className={fieldCls}
                                        value={programModal.intake_capacity}
                                        onChange={e => setProgramModal(m => ({ ...m, intake_capacity: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>
                    </Modal>
                )}
            </AnimatePresence>

            {/* Course v1 Create */}
            <AnimatePresence>
                {courseV1Modal.open && (
                    <Modal
                        open
                        title="Add Course"
                        onClose={() => setCourseV1Modal(courseV1Default)}
                        onSave={saveCourseV1}
                        saveLabel="Add Course"
                        loading={saveLoading}
                    >
                        <div className="space-y-4">
                            <div>
                                <label className={labelCls}>Program *</label>
                                <select
                                    className={fieldCls}
                                    value={courseV1Modal.program_id}
                                    onChange={e => setCourseV1Modal(m => ({ ...m, program_id: e.target.value }))}
                                >
                                    <option value="">— Select Program —</option>
                                    {programs.filter(p => selectedDept ? p.department_id === selectedDept.id : true).map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>Course Name *</label>
                                    <input
                                        type="text"
                                        className={fieldCls}
                                        value={courseV1Modal.name}
                                        onChange={e => setCourseV1Modal(m => ({ ...m, name: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>Batch</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 2024–2027"
                                        className={fieldCls}
                                        value={courseV1Modal.batch}
                                        onChange={e => setCourseV1Modal(m => ({ ...m, batch: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>Credits</label>
                                    <input
                                        type="number"
                                        min="0" max="60"
                                        className={fieldCls}
                                        value={courseV1Modal.credits}
                                        onChange={e => setCourseV1Modal(m => ({ ...m, credits: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>Code</label>
                                    <input
                                        type="text"
                                        className={fieldCls}
                                        value={courseV1Modal.code}
                                        onChange={e => setCourseV1Modal(m => ({ ...m, code: e.target.value.toUpperCase() }))}
                                    />
                                </div>
                            </div>
                        </div>
                    </Modal>
                )}
            </AnimatePresence>

            {/* Faculty Assignment Modal */}
            <AnimatePresence>
                {facultyModal.open && (
                    <Modal
                        open
                        title={`Assign Faculty: ${facultyModal.name}`}
                        onClose={() => setFacultyModal(facultyDefault)}
                        onSave={saveFacultyAssignment}
                        saveLabel="Update Assignment"
                        loading={saveLoading}
                    >
                        <div className="space-y-4">
                            <div>
                                <label className={labelCls}>Select Department *</label>
                                <select
                                    className={fieldCls}
                                    value={facultyModal.department_id}
                                    onChange={e => setFacultyModal(m => ({ ...m, department_id: e.target.value, course_id: '' }))}
                                >
                                    <option value="">— Select Department —</option>
                                    {legacyDepts.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>Select Course (Optional)</label>
                                <select
                                    className={fieldCls}
                                    value={facultyModal.course_id || ''}
                                    onChange={e => setFacultyModal(m => ({ ...m, course_id: e.target.value }))}
                                    disabled={!facultyModal.department_id}
                                >
                                    <option value="">— No Specific Course —</option>
                                    {courses.filter(c => c.department_id === parseInt(facultyModal.department_id)).map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                                <div className="flex gap-3">
                                    <AlertCircle size={18} className="text-indigo-500 shrink-0 mt-0.5" />
                                    <p className="text-[11px] font-bold text-indigo-700 leading-relaxed">
                                        Assigning a faculty to a department allows them to manage projects and tasks within that department's scope.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Modal>
                )}
            </AnimatePresence>

            {/* Delete Confirmation */}
            <AnimatePresence>
                {deleteModal.open && (
                    <Modal
                        open
                        title="Confirm Deletion"
                        onClose={() => setDeleteModal({ open: false, type: '', id: null, name: '' })}
                        onSave={confirmDelete}
                        saveLabel="Yes, Delete"
                        saveColor="red"
                        loading={saveLoading}
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-11 h-11 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                                <AlertTriangle size={22} />
                            </div>
                            <div>
                                <p className="font-black text-gray-800 mb-1">Delete "{deleteModal.name}"?</p>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    This action is permanent. If active {deleteModal.type === 'dept' ? 'courses' : 'students'} are linked, deletion will be blocked to preserve data integrity.
                                </p>
                            </div>
                        </div>
                    </Modal>
                )}
            </AnimatePresence>
        </AdminGlassLayout>
    );
};

export default AcademicStructure;
