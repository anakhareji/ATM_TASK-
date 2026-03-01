import React, { useEffect, useState, useMemo } from 'react';
import {
    Users, Plus, Trash2, Search,
    Star, Edit3, X, XCircle,
    CheckCircle2, Layers, AlertCircle, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../api/axios';
import Button from '../components/ui/Button';
import GlassCard from '../components/ui/GlassCard';
import { staggerContainer, cardEntrance } from '../utils/motionVariants';
import { getErrorMessage } from '../utils/errorHelpers';

const FacultyGroups = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Data States
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState("");
    const projectIdFromUrl = searchParams.get("project_id");
    const [groups, setGroups] = useState([]);
    const [students, setStudents] = useState([]);

    // URL State Sync
    useEffect(() => {
        if (projectIdFromUrl && projectIdFromUrl !== "undefined") {
            setSelectedProject(projectIdFromUrl);
        }
    }, [projectIdFromUrl]);

    // UI States
    const [loadingInitial, setLoadingInitial] = useState(true);
    const [loadingGroups, setLoadingGroups] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [leaderId, setLeaderId] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    // Body Scroll Lock
    useEffect(() => {
        if (showCreateModal) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [showCreateModal]);

    // Initial Data Fetch
    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const [pRes, sRes] = await Promise.all([
                    API.get('/projects/faculty'),
                    API.get('/faculty/students/my-students')
                ]);
                setProjects(pRes.data || []);
                setStudents(sRes.data || []);
            } catch (err) {
                console.error(err);
                toast.error("Critical: Failed to sync academic metadata.");
            } finally {
                setLoadingInitial(false);
            }
        };
        fetchMetadata();
    }, []);

    const fetchGroups = React.useCallback(async () => {
        if (!selectedProject || selectedProject === "undefined") {
            setGroups([]);
            return;
        }
        setLoadingGroups(true);
        try {
            const res = await API.get(`/groups/project/${selectedProject}`);
            setGroups(res.data || []);
        } catch (e) {
            toast.error("Failed to retrieve groups for this track.");
        } finally {
            setLoadingGroups(false);
        }
    }, [selectedProject]);

    // Fetch Groups when Project Changes (Controlled)
    useEffect(() => {
        if (selectedProject && selectedProject !== "undefined") {
            fetchGroups();
        } else {
            setGroups([]);
        }
    }, [fetchGroups, selectedProject]);

    // Handle Dropdown Change
    const handleProjectChange = (e) => {
        const val = e.target.value;
        setSelectedProject(val);
        if (val) {
            setSearchParams({ project_id: val });
        } else {
            setSearchParams({});
        }
    };

    // Actions
    const handleCreateGroup = async (e) => {
        if (e) e.preventDefault();

        const projectId = parseInt(selectedProject);
        if (isNaN(projectId) || projectId <= 0) {
            toast.error("Invalid academic track selected.");
            return;
        }

        if (!newGroupName.trim()) {
            toast.error("Group name is required.");
            return;
        }

        if (selectedStudents.length === 0) {
            toast.error("Squad is understaffed. Recruit members first.");
            return;
        }

        if (!leaderId) {
            toast.error("A squad requires a leader. Assign one to deploy.");
            return;
        }

        const sidArray = selectedStudents.map(s => parseInt(s.id));

        setActionLoading(true);
        const loadToast = toast.loading("Initializing group metadata...");
        try {
            await API.post('/groups', { 
                project_id: projectId, 
                name: newGroupName,
                student_ids: sidArray,
                leader_id: parseInt(leaderId)
            });

            // Toast success
            toast.success(`Group "${newGroupName}" established successfully.`, { id: loadToast });

            // Refetch and cleanup
            setNewGroupName('');
            setSelectedStudents([]);
            setLeaderId("");
            setShowCreateModal(false);
            fetchGroups();
        } catch (err) {
            toast.error(getErrorMessage(err, "Group initialization failed."), { id: loadToast });
        } finally {
            setActionLoading(false);
        }
    };

    const toggleStudentSelection = (student) => {
        setSelectedStudents(prev => {
            const isSelected = prev.some(s => s.id === student.id);
            if (isSelected) {
                // If it was the leader, reset it
                if (String(student.id) === String(leaderId)) setLeaderId("");
                return prev.filter(s => s.id !== student.id);
            }
            return [...prev, student];
        });
    };

    const handleDeleteGroup = async (groupId) => {
        if (!window.confirm("CRITICAL: This will destroy all group data and student memberships. Proceed?")) return;

        const loadToast = toast.loading("Purging group data...");
        try {
            await API.delete(`/groups/${groupId}`);
            setGroups(prev => prev.filter(g => g.id !== groupId));
            toast.success("Group purged successfully.", { id: loadToast });
        } catch (err) {
            toast.error(getErrorMessage(err, "Destruction sequence failed."), { id: loadToast });
        }
    };

    // Filters
    const filteredGroups = useMemo(() => {
        return groups.filter(g => (g.name || "").toLowerCase().includes(searchQuery.toLowerCase()));
    }, [groups, searchQuery]);

    if (loadingInitial) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-indigo-600 font-bold animate-pulse">Establishing Secure Hub...</p>
        </div>
    );

    return (
        <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-8 max-w-7xl mx-auto pb-20"
        >
            {/* Header / Command Center */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/20 shadow-sm sticky top-0 z-20">
                <div className="flex-1">
                    <h1 className="text-4xl font-black text-gray-800 tracking-tight flex items-center gap-3">
                        <Users className="text-indigo-600" /> Crew Management
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">Assign students and manage group leaders for selected tracks</p>
                </div>

                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    <select
                        className="px-6 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm shadow-sm disabled:opacity-50 transition-all cursor-pointer"
                        value={selectedProject}
                        onChange={handleProjectChange}
                        disabled={loadingInitial || projects.length === 0}
                    >
                        <option key="default" value="">Select Project Track...</option>
                        {projects.length === 0 && !loadingInitial && (
                            <option key="none" disabled>No tracks available</option>
                        )}
                        {projects.map(p => {
                            const trackId = p.id || p.project_id;
                            return (
                                <option key={trackId} value={String(trackId)}>{p.title}</option>
                            );
                        })}
                    </select>

                    <Button
                        disabled={!selectedProject}
                        icon={<Plus size={20} />}
                        onClick={() => setShowCreateModal(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100 shadow-xl px-8"
                    >
                        Create Group
                    </Button>
                </div>
            </div>

            {/* List Content */}
            {!selectedProject ? (
                <EmptyState icon={Layers} message="Mission Briefing Required" subtext="Select an academic track from the dropdown to manage squads." />
            ) : loadingGroups ? (
                <div className="py-32 flex flex-col items-center">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-indigo-400 font-bold text-sm">Synchronizing Groups...</p>
                </div>
            ) : groups.length === 0 ? (
                <EmptyState icon={Info} message="No Existing Groups" subtext="Begin by creating the first squad for this track." action={() => setShowCreateModal(true)} />
            ) : (
                <div className="space-y-6">
                    <div className="relative max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Find a group..."
                            className="w-full pl-12 pr-6 py-3 bg-white/80 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {filteredGroups.length === 0 ? (
                            <div className="col-span-full py-20 bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center grayscale opacity-50">
                                <Search size={40} className="text-gray-300 mb-4" />
                                <h3 className="text-lg font-black text-gray-400 uppercase tracking-widest">No matching squadrons</h3>
                                <p className="text-xs text-gray-300 font-bold mt-1">Refine your search parameters or recruit a new squad.</p>
                            </div>
                        ) : filteredGroups.map(group => (
                            <GroupCard
                                key={group.id}
                                group={group}
                                allStudents={students}
                                onDelete={() => handleDeleteGroup(group.id)}
                                onUpdate={fetchGroups} // Simplify: just refetch groups for now or optimize later
                                setGroups={setGroups}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Modals */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                    >
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={() => setShowCreateModal(false)} />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-[2.5rem] p-10 w-full max-w-md relative z-10 shadow-2xl overflow-hidden border border-white"
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />
                            <h2 className="text-3xl font-black text-gray-800 mb-6">Deploy Squad</h2>
                            <form onSubmit={handleCreateGroup} className="space-y-6">
                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2 block font-sans">Group Name</label>
                                    <input
                                        autoFocus required
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-gray-800 transition-all placeholder:text-gray-300"
                                        placeholder="e.g. Apollo Squad"
                                        value={newGroupName}
                                        onChange={(e) => setNewGroupName(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 block pb-1">Recruit Members <span className="text-indigo-600 font-bold ml-1">({selectedStudents.length})</span></label>
                                    <div className="max-h-48 overflow-y-auto pr-2 space-y-2 custom-scrollbar border-y border-gray-100 py-3">
                                        {students.length === 0 ? (
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest py-4 text-center italic">No Personnel Available</p>
                                        ) : students.map(s => {
                                            const isSelected = selectedStudents.some(sel => sel.id === s.id);
                                            return (
                                                <div 
                                                    key={s.id} 
                                                    onClick={() => toggleStudentSelection(s)}
                                                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                                                        isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100 bg-white hover:border-gray-200'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${isSelected ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                            {s.name.charAt(0)}
                                                        </div>
                                                        <span className={`text-[11px] font-black uppercase tracking-tight ${isSelected ? 'text-indigo-700' : 'text-gray-600'}`}>{s.name}</span>
                                                    </div>
                                                    {isSelected && <CheckCircle2 size={16} className="text-indigo-500" />}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {selectedStudents.length > 0 && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                                        <label className="text-xs font-black uppercase tracking-widest text-indigo-600 mb-2 block">Commission Leader</label>
                                        <select 
                                            required
                                            value={leaderId}
                                            onChange={(e) => setLeaderId(e.target.value)}
                                            className="w-full px-5 py-4 bg-indigo-50 border border-indigo-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-gray-800 text-sm italic transition-all shadow-sm"
                                        >
                                            <option value="">Choose your Leader...</option>
                                            {selectedStudents.map(s => (
                                                <option key={s.id} value={String(s.id)}>{s.name} (Select as Commander)</option>
                                            ))}
                                        </select>
                                    </motion.div>
                                )}

                                <div className="flex gap-4 pt-4 sticky bottom-0 bg-white">
                                    <Button type="button" variant="secondary" className="flex-1 py-4 font-black uppercase tracking-[0.2em] text-[10px]" onClick={() => {
                                        setShowCreateModal(false);
                                        setSelectedStudents([]);
                                        setLeaderId("");
                                    }}>Abort</Button>
                                    <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 py-4 shadow-lg shadow-indigo-100 font-black uppercase tracking-[0.2em] text-[10px]" disabled={actionLoading}>
                                        {actionLoading ? 'Deploying...' : 'Deploy Squad'}
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

const EmptyState = ({ icon: Icon, message, subtext, action }) => (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-40 flex flex-col items-center text-center">
        <div className="w-24 h-24 bg-indigo-50 rounded-[2rem] flex items-center justify-center mb-8 shadow-sm">
            <Icon size={40} className="text-indigo-500" />
        </div>
        <h3 className="text-2xl font-black text-gray-400">{message}</h3>
        <p className="text-gray-300 mt-2 font-medium max-w-sm">{subtext}</p>
        {action && (
            <Button onClick={action} variant="ghost" className="mt-8 text-indigo-600 font-black">
                Execute Creation
            </Button>
        )}
    </motion.div>
);

const GroupCard = ({ group, allStudents, onDelete, setGroups }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(group.name);
    const [adding, setAdding] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState("");

    const handleAddMember = async () => {
        if (!selectedStudent) return;

        // Prevent duplicate
        if (group.members.some(m => m.student_id === parseInt(selectedStudent))) {
            toast.error("Student already exists in this squad.");
            setSelectedStudent("");
            return;
        }

        setAdding(true);
        try {
            await API.post(`/groups/${group.id}/members`, { student_id: parseInt(selectedStudent) });
            setGroups(prev => prev.map(g => g.id === group.id ? { ...g, members: [...g.members, { student_id: parseInt(selectedStudent), is_leader: false }] } : g));
            toast.success("Squad size increased.");
            setSelectedStudent("");
        } catch (e) {
            toast.error(getErrorMessage(e, "Transfer failed."));
        } finally {
            setAdding(false);
        }
    };

    const handleRemoveMember = async (sid) => {
        if (!window.confirm("Evict student from this squad?")) return;
        try {
            await API.delete(`/groups/${group.id}/members/${sid}`);
            setGroups(prev => prev.map(g => g.id === group.id ? { ...g, members: g.members.filter(m => m.student_id !== sid) } : g));
            toast.success("Squad member removed.");
        } catch (e) { toast.error("Eviction failed."); }
    };

    const handleSetLeader = async (sid) => {
        try {
            await API.put(`/groups/${group.id}/leader`, { student_id: sid });
            setGroups(prev => prev.map(g => g.id === group.id ? { ...g, members: g.members.map(m => ({ ...m, is_leader: m.student_id === sid })) } : g));
            toast.success("Squad leader assigned.");
        } catch (e) { toast.error("Commission failed."); }
    };

    const handleRename = async () => {
        if (!editName.trim()) return setIsEditing(false);
        try {
            await API.put(`/groups/${group.id}/rename`, { name: editName });
            setGroups(prev => prev.map(g => g.id === group.id ? { ...g, name: editName } : g));
            toast.success("Identification updated.");
            setIsEditing(false);
        } catch (e) { toast.error("Rename failed."); }
    };

    return (
        <motion.div layout variants={cardEntrance}>
            <GlassCard className="p-0 overflow-hidden group hover:border-indigo-200 transition-all shadow-sm hover:shadow-xl rounded-3xl">
                {/* Card Header */}
                <div className="p-6 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center group-hover:bg-indigo-50/20">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="p-3 bg-white rounded-2xl text-indigo-500 shadow-sm">
                            <Layers size={20} />
                        </div>
                        {isEditing ? (
                            <div className="flex items-center gap-2 w-full max-w-xs">
                                <input autoFocus className="w-full px-3 py-1.5 rounded-xl border border-indigo-200 outline-none font-bold text-sm" value={editName} onChange={e => setEditName(e.target.value)} />
                                <button onClick={handleRename} className="text-emerald-500 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors"><CheckCircle2 size={18} /></button>
                                <button onClick={() => setIsEditing(false)} className="text-red-400 hover:bg-red-50 p-1.5 rounded-lg transition-colors"><X size={18} /></button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-black text-gray-800 tracking-tight">{group.name}</h3>
                                <button onClick={() => setIsEditing(true)} className="p-1.5 text-gray-300 hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-all"><Edit3 size={14} /></button>
                            </div>
                        )}
                    </div>
                    <button onClick={onDelete} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Add Member Controls */}
                    <div className="flex gap-2">
                        <select
                            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs"
                            value={selectedStudent}
                            onChange={(e) => setSelectedStudent(e.target.value)}
                        >
                            <option value="">Recruit Member...</option>
                            {allStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <Button
                            className="bg-indigo-600 px-4 py-2.5 rounded-xl flex items-center gap-2"
                            disabled={!selectedStudent || adding}
                            onClick={handleAddMember}
                        >
                            {adding ? '...' : <Plus size={16} />}
                        </Button>
                    </div>

                    {/* Member List */}
                    <div className="space-y-2">
                        {group.members.length === 0 ? (
                            <p className="text-center py-6 text-gray-300 text-xs font-bold uppercase tracking-widest italic">Squad Empty</p>
                        ) : (
                            group.members.map(m => {
                                const s = allStudents.find(st => st.id === m.student_id);
                                return (
                                    <div key={m.student_id} className={`flex justify-between items-center p-4 rounded-2xl border transition-all ${m.is_leader ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white border-gray-100 hover:border-indigo-100 shadow-sm'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs ${m.is_leader ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                {s?.name?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black tracking-tight">{s?.name || `Ref ID: ${m.student_id}`}</p>
                                                <p className={`text-[10px] font-bold ${m.is_leader ? 'text-white/60' : 'text-gray-400'}`}>{s?.email || 'Active Duty'}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            {!m.is_leader && (
                                                <button onClick={() => handleSetLeader(m.student_id)} className="p-2 text-gray-300 hover:text-amber-500 transition-colors"><Star size={16} /></button>
                                            )}
                                            <button onClick={() => handleRemoveMember(m.student_id)} className={`p-2 transition-colors ${m.is_leader ? 'text-white/40 hover:text-red-300' : 'text-gray-300 hover:text-red-500'}`}><XCircle size={16} /></button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Footer Meta */}
                <div className="px-6 py-3 bg-gray-50 flex justify-between items-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{group.members.length} Members</p>
                    {group.members.some(m => m.is_leader) ? (
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Leader Assigned</p>
                    ) : (
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-1"><AlertCircle size={10} /> Leader Required</p>
                    )}
                </div>
            </GlassCard>
        </motion.div>
    );
};

export default FacultyGroups;
