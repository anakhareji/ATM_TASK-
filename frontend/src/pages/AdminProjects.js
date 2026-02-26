import React, { useEffect, useState } from 'react';
import AdminGlassLayout from '../components/layout/AdminGlassLayout';
import API from '../api/axios';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import GlassCard from '../components/ui/GlassCard';
import { Briefcase, User, Trash2, Calendar, FileText, Search, Zap, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const AdminProjects = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [deptFilter, setDeptFilter] = useState('');
    const [departments, setDepartments] = useState([]);
    const [createOpen, setCreateOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        title: '',
        description: '',
        department_id: '',
        course_id: '',
        lead_faculty_id: '',
        academic_year: '',
        start_date: '',
        end_date: '',
        status: 'Draft',
        visibility: 'Department Only',
        allow_tasks: false,
    });

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const params = {};
            if (searchTerm) params.q = searchTerm;
            if (statusFilter) params.status = statusFilter;
            if (deptFilter) params.department_id = deptFilter;
            const res = await API.get('/admin/projects', { params });
            const payload = Array.isArray(res.data) ? res.data : (res.data?.projects || []);
            setProjects(payload);
        } catch (error) {
            console.error("Project Load Error:", error?.response?.data || error?.message);
            toast.error("Failed to load global projects registry");
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const res = await API.get('/v1/academic-structure/departments?page=1&page_size=100');
            setDepartments(res.data?.items || []);
        } catch { }
    };

    useEffect(() => {
        fetchProjects();
        fetchDepartments();
    }, []);

    useEffect(() => {
        fetchProjects();
    }, [searchTerm, statusFilter, deptFilter]);

    const handleDelete = async (id) => {
        if (!window.confirm("CRITICAL ACTION: Are you sure you want to PERMANENTLY delete this project globally? This action cannot be undone.")) return;
        try {
            await API.delete(`/admin/projects/${id}`);
            toast.success("Project purged from system records");
            fetchProjects();
        } catch (err) {
            toast.error("Purge protocol failed");
        }
    };

    const filtered = projects;

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.title) {
            toast.error("Project title is required");
            return;
        }
        setSaving(true);
        try {
            await API.post('/admin/projects', {
                ...form,
                department_id: form.department_id ? parseInt(form.department_id) : null,
                course_id: form.course_id ? parseInt(form.course_id) : null,
                lead_faculty_id: form.lead_faculty_id ? parseInt(form.lead_faculty_id) : null,
            });
            toast.success("Project created successfully");
            setCreateOpen(false);
            setForm({
                title: '',
                description: '',
                department_id: '',
                course_id: '',
                lead_faculty_id: '',
                academic_year: '',
                start_date: '',
                end_date: '',
                status: 'Draft',
                visibility: 'Department Only',
                allow_tasks: false,
            });
            fetchProjects();
        } catch (err) {
            toast.error("Failed to create project");
        } finally {
            setSaving(false);
        }
    };

    const handleStatusAction = async (proj, action) => {
        try {
            if (action === 'publish') {
                await API.patch(`/admin/projects/${proj.id}/publish`);
                toast.success("Project published");
            } else if (action === 'archive') {
                await API.patch(`/admin/projects/${proj.id}/archive`);
                toast.success("Project archived");
            }
            fetchProjects();
        } catch {
            toast.error("Action failed");
        }
    };

    return (
        <AdminGlassLayout>
            <div className="space-y-8 pb-12">
                <PageHeader
                    title="Global Repository"
                    subtitle="Omniscient oversight of all active academic streams and faculty-led research"
                >
                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Filter by stream or lead..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-12 pr-6 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 outline-none w-72 md:w-96 shadow-sm transition-all"
                            />
                        </div>
                        <select
                            className="px-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-gray-600 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 outline-none"
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                        >
                            <option value="">All Status</option>
                            <option value="Draft">Draft</option>
                            <option value="Published">Published</option>
                            <option value="Archived">Archived</option>
                        </select>
                        <select
                            className="px-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-gray-600 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 outline-none"
                            value={deptFilter}
                            onChange={e => setDeptFilter(e.target.value)}
                        >
                            <option value="">All Departments</option>
                            {departments.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                        <Button
                            className="bg-green-600 hover:bg-green-500 text-white rounded-2xl px-6 font-black"
                            onClick={() => setCreateOpen(true)}
                        >
                            + Create Project
                        </Button>
                    </div>
                </PageHeader>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-64 bg-white/50 border border-gray-100 rounded-[2rem] animate-pulse" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-32">
                        <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <Briefcase size={32} className="text-gray-300" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-800 mb-2">No Records Found</h3>
                        <p className="text-gray-400 max-w-xs mx-auto text-sm">No Projects match your current observatory filters.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <AnimatePresence>
                            {filtered.map((proj, idx) => (
                                <motion.div
                                    key={proj.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                >
                                    <GlassCard className="flex flex-col h-full group hover:border-emerald-200 transition-colors relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleDelete(proj.id)}
                                                className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                                title="Purge Project"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>

                                        <div className="mb-6">
                                            <div className="inline-flex p-3 rounded-2xl bg-indigo-50 text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
                                                <Briefcase size={24} />
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-800 mb-2 leading-tight pr-8">{proj.title}</h3>
                                            <p className="text-gray-500 text-sm line-clamp-3 leading-relaxed">
                                                {proj.description || "No project overview available."}
                                            </p>
                                        </div>

                                        <div className="mt-auto space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 font-black text-[10px]">
                                                    {proj.faculty_name?.[0]}
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">Lead Academic</p>
                                                    <p className="text-sm font-bold text-gray-700 leading-none">{proj.faculty_name}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                    proj.status === 'Published'
                                                        ? 'bg-emerald-50 text-emerald-600'
                                                        : proj.status === 'Archived'
                                                        ? 'bg-gray-100 text-gray-500'
                                                        : 'bg-amber-50 text-amber-600'
                                                }`}>
                                                    {proj.status || 'Draft'}
                                                </span>
                                                {proj.department_name && (
                                                    <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest">
                                                        {proj.department_name}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                                                    <Zap size={12} className="animate-pulse" />
                                                    <span>{proj.task_count} Tasks Active</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
                                                    <Calendar size={12} />
                                                    <span>INIT: {new Date(proj.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-end gap-2 mt-3">
                                                {proj.status !== 'Published' && (
                                                    <Button size="sm" variant="ghost" className="px-3 py-1 text-xs font-bold text-emerald-600" onClick={() => handleStatusAction(proj, 'publish')}>
                                                        Publish
                                                    </Button>
                                                )}
                                                {proj.status !== 'Archived' && (
                                                    <Button size="sm" variant="ghost" className="px-3 py-1 text-xs font-bold text-gray-500" onClick={() => handleStatusAction(proj, 'archive')}>
                                                        Archive
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </GlassCard>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {createOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setCreateOpen(false)} />
                        <div className="relative bg-white rounded-3xl border border-gray-100 w-full max-w-2xl p-6">
                            <h2 className="text-xl font-black text-gray-900 mb-4">Create Project</h2>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div>
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Project Title</label>
                                    <input
                                        type="text"
                                        value={form.title}
                                        onChange={e => setForm({ ...form, title: e.target.value })}
                                        className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-emerald-500/10"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Description</label>
                                    <textarea
                                        value={form.description}
                                        onChange={e => setForm({ ...form, description: e.target.value })}
                                        className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-emerald-500/10"
                                        rows={3}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Department</label>
                                        <select
                                            value={form.department_id}
                                            onChange={e => setForm({ ...form, department_id: e.target.value })}
                                            className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-emerald-500/10"
                                        >
                                            <option value="">Select...</option>
                                            {departments.map(d => (
                                                <option key={d.id} value={d.id}>{d.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Academic Year</label>
                                        <input
                                            type="text"
                                            value={form.academic_year}
                                            onChange={e => setForm({ ...form, academic_year: e.target.value })}
                                            className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-emerald-500/10"
                                            placeholder="2025-2026"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Start Date</label>
                                        <input
                                            type="date"
                                            value={form.start_date}
                                            onChange={e => setForm({ ...form, start_date: e.target.value })}
                                            className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-emerald-500/10"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest">End Date</label>
                                        <input
                                            type="date"
                                            value={form.end_date}
                                            onChange={e => setForm({ ...form, end_date: e.target.value })}
                                            className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-emerald-500/10"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Status</label>
                                        <select
                                            value={form.status}
                                            onChange={e => setForm({ ...form, status: e.target.value })}
                                            className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-emerald-500/10"
                                        >
                                            <option value="Draft">Draft</option>
                                            <option value="Published">Published</option>
                                            <option value="Archived">Archived</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Visibility</label>
                                        <select
                                            value={form.visibility}
                                            onChange={e => setForm({ ...form, visibility: e.target.value })}
                                            className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-emerald-500/10"
                                        >
                                            <option value="Department Only">Department Only</option>
                                            <option value="Institution Wide">Institution Wide</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-3 mt-6">
                                        <input
                                            id="allowTasks"
                                            type="checkbox"
                                            checked={form.allow_tasks}
                                            onChange={e => setForm({ ...form, allow_tasks: e.target.checked })}
                                            className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <label htmlFor="allowTasks" className="text-xs font-bold text-gray-600">Allow Task Creation</label>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-4">
                                    <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
                                    <Button type="submit" className="bg-green-600 hover:bg-green-500" disabled={saving}>
                                        {saving ? 'Creating...' : 'Create Project'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminGlassLayout>
    );
};

export default AdminProjects;
