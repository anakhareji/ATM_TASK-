import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
    Plus, AlertCircle, Trash2, Edit3, Calendar, Download,
    User, Users,
    FileText, Eye, X, Send, Search, Info, Clock,
    MessageSquare, History, List, Bold, Italic, Link, Paperclip, AtSign, Smile, Layout, Code, PlusCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../api/axios';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import { staggerContainer, cardEntrance } from '../utils/motionVariants';
import { getErrorMessage } from '../utils/errorHelpers';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import DOMPurify from 'dompurify';

const RichContent = ({ content, className = '' }) => {
    return (
        <div 
            className={`prose prose-sm max-w-none text-gray-600 font-medium leading-relaxed quill-content ${className}`}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
        />
    );
};

// Toolbar removed as requested

const CommentEditor = ({ value, onChange, onSave, onCancel, placeholder, autoFocus = false }) => {
    const toolbarId = useMemo(() => `toolbar-faculty-${Math.random().toString(36).substr(2, 9)}`, []);

    const modules = useMemo(() => ({
        toolbar: false
    }), []);

    const formats = [
        'bold', 'italic', 'list', 'code-block'
    ];

    return (
        <div className="bg-white border-2 border-indigo-100 rounded-[2.5rem] shadow-2xl overflow-hidden animate-slideUp font-sans group">
            <div className="quill-wrapper">
                <ReactQuill
                    theme="snow"
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    modules={modules}
                    formats={formats}
                    className="faculty-quill"
                />
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .faculty-quill .ql-container {
                    border: none !important;
                    font-family: inherit;
                    min-height: 150px;
                }
                .faculty-quill .ql-editor {
                    padding: 1.5rem;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #374151;
                    min-height: 150px;
                    line-height: 1.6;
                    text-align: left;
                }
                .faculty-quill .ql-editor strong, .faculty-quill .ql-editor b {
                    font-weight: 900 !important;
                }
                .faculty-quill .ql-editor em, .faculty-quill .ql-editor i {
                    font-style: italic !important;
                }
                .faculty-quill .ql-editor strong, .faculty-quill .ql-editor b {
                    font-weight: 900 !important;
                }
                .faculty-quill .ql-editor em, .faculty-quill .ql-editor i {
                    font-style: italic !important;
                    font-weight: 500 !important;
                }
                .faculty-quill .ql-editor.ql-blank::before {
                    color: #d1d5db;
                    font-style: italic;
                    left: 1.5rem;
                    font-weight: 400;
                }
                .ql-bold.ql-active, .ql-italic.ql-active, .ql-list.ql-active, .ql-code-block.ql-active {
                    background: white !important;
                    color: #4f46e5 !important;
                    box-shadow: 0 4px 12px -2px rgba(99, 102, 241, 0.15);
                }
                .faculty-quill .ql-toolbar {
                    display: none;
                }
                .quill-content h1, .quill-content h2 { font-weight: 900; color: #111827; margin-top: 1.5rem; margin-bottom: 0.75rem; }
                .quill-content ul { list-style-type: disc; margin-left: 2rem; margin-bottom: 1.25rem; }
                .quill-content ol { list-style-type: decimal; margin-left: 2rem; margin-bottom: 1.25rem; }
                .quill-content blockquote { border-left: 6px solid #818cf8; padding: 1rem 1.5rem; font-style: italic; color: #4338ca; background: #eef2ff; border-radius: 0 0.75rem 0.75rem 0; margin-bottom: 1.5rem; }
                .quill-content a { color: #6366f1; text-decoration: underline; font-weight: 800; text-underline-offset: 4px; }
                .quill-content code { background: #f3f4f6; color: #be185d; padding: 0.25rem 0.5rem; rounded: 0.5rem; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 0.9em; }
                .quill-content pre { background: #111827; color: #f9fafb; padding: 1.5rem; border-radius: 1rem; margin-bottom: 1.5rem; overflow-x: auto; font-family: inherit; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
            `}} />

            <div className="p-5 bg-gray-50/50 flex gap-4 justify-start items-center border-t border-gray-100">
                <Button 
                    size="sm" 
                    className="px-10 bg-indigo-600 hover:bg-indigo-700 font-black uppercase tracking-widest rounded-2xl shadow-xl hover:shadow-indigo-200/50 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                    onClick={(e) => { e.preventDefault(); onSave(); }}
                >
                    Log Activity
                </Button>
                <Button 
                    size="sm" 
                    variant="ghost" 
                    className="px-8 text-gray-400 hover:text-gray-600 hover:bg-white font-black uppercase tracking-widest rounded-2xl transition-all"
                    onClick={(e) => { e.preventDefault(); onCancel(); }}
                >
                    Cancel
                </Button>
                <div className="ml-auto flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">
                    <Layout size={12} /> Rich Editor Ready
                </div>
            </div>
        </div>
    );
};

const TaskActivity = ({ taskId }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('comments');
    const [isInputFocused, setIsInputFocused] = useState(false);
    
    // Editing state
    const [editingId, setEditingId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const currentUserId = user.id || user.user_id;

    const fetchComments = useCallback(async () => {
        setLoading(true);
        try {
            const res = await API.get(`/tasks/${taskId}/comments`);
            setComments(res.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [taskId]);

    useEffect(() => {
        if (taskId) fetchComments();
    }, [taskId, fetchComments]);

    const handleSend = async () => {
        if (!newComment.trim()) return;
        try {
            await API.post(`/tasks/${taskId}/comments`, { comment_text: newComment });
            setNewComment('');
            setIsInputFocused(false);
            fetchComments();
            toast.success('Comment logged');
        } catch (e) {
            toast.error('Failed to log activity');
        }
    };

    const handleUpdate = async (id) => {
        if (!editContent.trim()) return;
        try {
            await API.put(`/tasks/comments/${id}`, { comment_text: editContent });
            setEditingId(null);
            fetchComments();
            toast.success('Activity updated');
        } catch (e) {
            toast.error('Failed to update activity');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Erase this activity log entry permanently?')) return;
        try {
            await API.delete(`/tasks/comments/${id}`);
            fetchComments();
            toast.success('Activity erased');
        } catch (e) {
            toast.error('Failed to erase activity');
        }
    };

    return (
        <div className="mt-8 pt-8 border-t border-gray-100 animate-fadeIn text-left">
            <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
                <Layout size={20} className="text-gray-400" /> Activity
            </h3>
            
            <div className="flex gap-1 border-b border-gray-100 mb-6 overflow-x-auto pb-1 no-scrollbar">
                {['all', 'comments', 'history', 'approvals'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${
                            activeTab === tab 
                            ? 'border-indigo-600 text-indigo-600' 
                            : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {(activeTab === 'comments' || activeTab === 'all') ? (
                <div className="space-y-6">
                    {/* Add Comment Section */}
                    <div className="flex gap-4 group">
                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-indigo-100 shrink-0 uppercase">
                            {localStorage.getItem('userName')?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 space-y-3">
                            {!isInputFocused ? (
                                <div 
                                    onClick={() => setIsInputFocused(true)}
                                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-gray-400 text-sm font-medium cursor-text hover:bg-white hover:border-gray-200 transition-all shadow-sm"
                                >
                                    Add a comment or observation...
                                </div>
                            ) : (
                                <CommentEditor 
                                    value={newComment}
                                    onChange={setNewComment}
                                    onSave={handleSend}
                                    onCancel={() => { setIsInputFocused(false); setNewComment(''); }}
                                    placeholder="Type your message here..."
                                    autoFocus
                                />
                            )}
                        </div>
                    </div>

                    {/* Comments Feed */}
                    <div className="space-y-8 pl-14 pt-4 border-l-2 border-gray-50">
                        {loading && comments.length === 0 ? (
                            [1,2].map(i => <div key={i} className="h-24 bg-gray-50 animate-pulse rounded-2xl" />)
                        ) : comments.length === 0 ? (
                            <div className="text-center py-10">
                                <MessageSquare size={32} className="mx-auto text-gray-200 mb-2" />
                                <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">No activity logged yet</p>
                            </div>
                        ) : (
                            comments.map(c => (
                                <div key={c.id} className="relative group/msg">
                                    <div className={`absolute -left-[65px] top-0 w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-[10px] shadow-sm z-10 transition-transform group-hover/msg:scale-110 uppercase ${
                                        c.role === 'student' ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-white border-gray-100 text-gray-400'
                                    }`}>
                                        {c.user_name?.charAt(0) || '?'}
                                    </div>
                                    
                                    {editingId === c.id ? (
                                        <div className="space-y-3 animate-fadeIn">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Editing Entry</span>
                                            </div>
                                            <CommentEditor 
                                                value={editContent}
                                                onChange={setEditContent}
                                                onSave={() => handleUpdate(c.id)}
                                                onCancel={() => setEditingId(null)}
                                                autoFocus
                                            />
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-black text-gray-800">{c.user_name}</span>
                                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                                        c.role === 'student' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
                                                    }`}>
                                                        {c.role}
                                                    </span>
                                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis">
                                                        • {new Date(c.created_at).toLocaleDateString()} at {new Date(c.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    </span>
                                                </div>
                                                
                                                {c.user_id === currentUserId && (
                                                    <div className="flex gap-1 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => { setEditingId(c.id); setEditContent(c.comment_text); }}
                                                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                        >
                                                            <Edit3 size={14} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(c.id)}
                                                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <div className={`p-5 rounded-3xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden text-left ${
                                                c.role === 'student' ? 'bg-amber-50/30 border-amber-100' : 'bg-white border-gray-100'
                                            }`}>
                                                <RichContent content={c.comment_text} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            ) : (
                <div className="py-20 text-center bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200">
                    <History size={40} className="mx-auto text-gray-200 mb-3" />
                    <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Log History Coming Soon</p>
                </div>
            )}
        </div>
    );
};

const FacultyTasks = () => {
    const [searchParams] = useSearchParams();

    // Data State
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [students, setStudents] = useState([]);
    const [groups, setGroups] = useState([]);

    // UI State
    const [loadingInitial, setLoadingInitial] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const [selectedTask, setSelectedTask] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTaskActivity, setActiveTaskActivity] = useState(null);

    // Form State (Controlled)
    const initialForm = {
        title: '',
        description: '',
        priority: 'Medium',
        deadline: '',
        project_id: (searchParams.get('project_id') && searchParams.get('project_id') !== "undefined") ? searchParams.get('project_id') : '',
        task_type: 'individual',
        student_id: '',
        selected_students: [],
        group_id: '',
        max_marks: 100,
        file_url: '',
        late_penalty: 0
    };
    const [formData, setFormData] = useState(initialForm);
    const [formErrors, setFormErrors] = useState({});

    // Grade State
    const [gradeData, setGradeData] = useState({ marks: '', feedback: '' });
    const [gradingLoading, setGradingLoading] = useState(false);

    // Initial Fetch (Promise.all)
    const fetchInitialData = async () => {
        try {
            const [tasksRes, projectsRes, studentsRes] = await Promise.all([
                API.get('/tasks/my-tasks'),
                API.get('/projects/faculty'),
                API.get('/faculty/students/my-students')
            ]);
            setTasks(tasksRes.data || []);
            setProjects(projectsRes.data || []);
            setStudents(studentsRes.data || []);
        } catch (e) {
            console.error(e);
            toast.error("Failed to synchronize task database.");
        } finally {
            setLoadingInitial(false);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    // Body Scroll Lock
    useEffect(() => {
        if (showCreateModal || showSubmissionsModal) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [showCreateModal, showSubmissionsModal]);

    // Handler: Project Change (Fetch Groups)
    const handleProjectChange = async (projectId) => {
        setFormData({ ...formData, project_id: projectId, group_id: '' });
        if (projectId) {
            try {
                const res = await API.get(`/groups/project/${projectId}`);
                setGroups(res.data || []);
            } catch (e) {
                toast.error("Group data for this track is unavailable.");
            }
        } else {
            setGroups([]);
        }
    };

    // Handler: Validation
    const validateForm = () => {
        const errors = {};
        if (!formData.title.trim()) errors.title = "Project objective title is required";
        if (!formData.project_id) errors.project_id = "Assigned academic track is required";
        if (!formData.deadline) errors.deadline = "Completion deadline is mandatory";
        if (formData.max_marks <= 0) errors.max_marks = "Max marks must be a positive integer";

        if (formData.task_type === 'individual' && (!formData.selected_students || formData.selected_students.length === 0)) {
            errors.student_id = "At least one individual recipient must be added";
        }
        if (formData.task_type === 'group' && !formData.group_id) {
            errors.group_id = "Assigned squad must be selected";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Handler: Create Task
    const handleCreateTask = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        if (submitting) return;

        setSubmitting(true);
        const loadToast = toast.loading("Deploying task draft...");
        
        try {
            // Construct a clean payload
            const payload = {
                title: formData.title,
                description: formData.description,
                priority: formData.priority,
                deadline: formData.deadline,
                project_id: parseInt(formData.project_id),
                task_type: formData.task_type,
                max_marks: parseInt(formData.max_marks || 100),
                file_url: formData.file_url || null,
                late_penalty: parseFloat(formData.late_penalty || 0)
            };

            // Add targeted recipient based on type
            if (formData.task_type === 'individual') {
                payload.group_id = null; // Backend expects None for group_id in individual mode
                
                if (isEditing && formData._identical_tasks) {
                     const oldTasks = formData._identical_tasks.filter(t => t.student_id);
                     const oldSids = oldTasks.map(t => String(t.student_id));
                     const newSids = formData.selected_students || [];
                     
                     const tasksToDelete = oldTasks.filter(t => !newSids.includes(String(t.student_id)));
                     const sidsToAdd = newSids.filter(sid => !oldSids.includes(sid));
                     const tasksToUpdate = oldTasks.filter(t => newSids.includes(String(t.student_id)));

                     // Use Promise.all fallback gracefully if delete is completely empty
                     const deletePromises = tasksToDelete.map(t => API.delete(`/tasks/${t.id}`));
                     const addPromises = sidsToAdd.map(sid => API.post('/tasks', { ...payload, student_id: parseInt(sid) }));
                     const updatePromises = tasksToUpdate.map(t => API.put(`/tasks/${t.id}`, { ...payload, student_id: parseInt(t.student_id) }));

                     await Promise.all([...deletePromises, ...addPromises, ...updatePromises]);
                     
                     toast.success("Assignment updated across all selected recipients.", { id: loadToast });
                } else {
                     await Promise.all((formData.selected_students || []).map(async (sid) => {
                          return API.post('/tasks', { ...payload, student_id: parseInt(sid) });
                     }));
                     toast.success("Tasks deployed as drafts. You must publish them to notify recipients.", { id: loadToast });
                }
            } else {
                payload.group_id = parseInt(formData.group_id);
                payload.student_id = null;
                if (isEditing && selectedTask) {
                    await API.put(`/tasks/${selectedTask.id}`, payload);
                    toast.success("Task updated successfully.", { id: loadToast });
                } else {
                    await API.post('/tasks', payload);
                    toast.success("Task deployed as draft. You must publish it to notify recipients.", { id: loadToast });
                }
            }
            setShowCreateModal(false);
            setFormData(initialForm);
            setIsEditing(false);
            setSelectedTask(null);
            fetchInitialData();
        } catch (err) {
            toast.error(getErrorMessage(err, "Task deployment failed."), { id: loadToast });
        } finally {
            setSubmitting(false);
        }
    };
    
    // Handler: Edit Task Load
    const handleEditClick = async (task) => {
        setIsEditing(true);
        setSelectedTask(task);
        if (task.project_id) {
            try {
                const res = await API.get(`/groups/project/${task.project_id}`);
                setGroups(res.data || []);
            } catch (e) {
                setGroups([]);
            }
        }
        
        let deadlineLocal = "";
        try {
            if (task.deadline) {
                const d = new Date(task.deadline);
                deadlineLocal = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            }
        } catch(e) {}
        
        const identicalTasks = tasks.filter(t => 
            t.title === task.title && 
            t.project_id === task.project_id && 
            t.task_type === task.task_type
        );

        setFormData({
            title: task.title,
            description: task.description || '',
            priority: task.priority || 'Medium',
            deadline: deadlineLocal,
            project_id: task.project_id || '',
            task_type: task.task_type || 'individual',
            student_id: '',
            selected_students: task.task_type === 'individual' ? identicalTasks.map(t => String(t.student_id)).filter(id => id !== "null") : [],
            group_id: task.group_id || '',
            max_marks: task.max_marks || 100,
            file_url: task.file_url || '',
            late_penalty: task.late_penalty || 0,
            _identical_tasks: identicalTasks
        });
        setShowCreateModal(true);
    };

    // Handler: Publish
    const handlePublish = async (id) => {
        const loadToast = toast.loading("Broadcasting assignment...");
        try {
            await API.put(`/tasks/${id}/publish`);
            toast.success("Task is now active. Students have been notified.", { id: loadToast });
            fetchInitialData();
        } catch (err) {
            toast.error("Broadcast failed.", { id: loadToast });
        }
    };

    // Handler: Delete
    const handleDelete = async (id) => {
        if (!window.confirm("CRITICAL: Permanent deletion of task data. Proceed?")) return;
        const loadToast = toast.loading("Purging task history...");
        try {
            await API.delete(`/tasks/${id}`);
            setTasks(prev => prev.filter(t => t.id !== id));
            toast.success("Task purged.", { id: loadToast });
        } catch (err) {
            toast.error("Purge failed.", { id: loadToast });
        }
    };

    // Handler: Submissions & Grading
    const handleViewSubmissions = async (task) => {
        setSelectedTask(task);
        const loadToast = toast.loading("Retrieving student deliverables...");
        try {
            const res = await API.get(`/tasks/${task.id}/submissions`);
            setSubmissions(res.data);
            setShowSubmissionsModal(true);
            toast.dismiss(loadToast);
        } catch (e) {
            toast.error("Failed to load deliverables.", { id: loadToast });
        }
    };

    const handleGradeSubmission = async (submissionId) => {
        if (!gradeData.marks) return toast.error("Marks required.");
        if (parseInt(gradeData.marks) > selectedTask.max_marks) return toast.error(`Boundary error: Max allowed is ${selectedTask.max_marks}`);
        if (parseInt(gradeData.marks) < 0) return toast.error("Boundary error: Minimum marks is 0");

        setGradingLoading(true);
        const loadToast = toast.loading("Processing grade & performance sync...");
        try {
            await API.post(`/tasks/${selectedTask.id}/grade`, {
                submission_id: submissionId,
                marks: parseInt(gradeData.marks),
                feedback: gradeData.feedback,
                grade: calculateGrade(gradeData.marks, selectedTask.max_marks)
            });
            toast.success("Performance synced successfully.", { id: loadToast });
            // Refresh submissions
            const res = await API.get(`/tasks/${selectedTask.id}/submissions`);
            setSubmissions(res.data);
            setGradeData({ marks: '', feedback: '' });
        } catch (e) {
            toast.error("Sync failed.", { id: loadToast });
        } finally {
            setGradingLoading(false);
        }
    };

    const calculateGrade = (marks, max) => {
        const pct = (marks / max) * 100;
        if (pct >= 90) return 'A+';
        if (pct >= 80) return 'A';
        if (pct >= 70) return 'B';
        if (pct >= 60) return 'C';
        if (pct >= 50) return 'D';
        return 'F';
    };

    // Filtering & Sorting
    const filteredTasks = useMemo(() => {
        return tasks.filter(t => {
            const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
            const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.description?.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesStatus && matchesSearch;
        }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }, [tasks, statusFilter, searchTerm]);

    if (loadingInitial) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-emerald-600 font-bold animate-pulse">Establishing Mission Control...</p>
        </div>
    );

    return (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-8 max-w-7xl mx-auto pb-20">
            {/* Header / Filter Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white/50 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/20 shadow-sm sticky top-0 z-20">
                <div className="flex-1">
                    <h1 className="text-4xl font-black text-gray-800 tracking-tight flex items-center gap-3">
                        <FileText className="text-emerald-600" /> Assignment Hub
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">Lifecycle management for academic deliverables</p>
                </div>

                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text" placeholder="Search tasks..."
                            className="w-full md:w-64 pl-12 pr-6 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm shadow-sm"
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="px-6 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm shadow-sm"
                        value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Lifecycles</option>
                        <option value="draft">Draft (Private)</option>
                        <option value="published">Active (Published)</option>
                        <option value="submitted">Needs Review</option>
                    </select>
                    <Button icon={<Plus size={20} />} onClick={() => {
                        setIsEditing(false);
                        setSelectedTask(null);
                        setFormData(initialForm);
                        setShowCreateModal(true);
                    }} className="bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-100 px-8">
                        Deploy Task
                    </Button>
                </div>
            </div>

            {/* Grid Content */}
            <AnimatePresence mode="wait">
                {filteredTasks.length === 0 ? (
                    <div className="py-40 flex flex-col items-center text-center bg-white/40 rounded-[2.5rem] border border-dashed border-gray-200">
                        <Info size={64} className="text-gray-200 mb-6" />
                        <h3 className="text-2xl font-black text-gray-400">No Assignments Found</h3>
                        <p className="text-gray-300 font-medium italic">Try adjusting your filters or deploy a new mission.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {filteredTasks.map(task => (
                            <TaskCard
                                key={task.id} task={task}
                                onPublish={() => handlePublish(task.id)}
                                onDelete={() => handleDelete(task.id)}
                                onEdit={() => handleEditClick(task)}
                                onViewSubmissions={() => handleViewSubmissions(task)}
                                isActiveActivity={activeTaskActivity === task.id}
                                toggleActivity={() => setActiveTaskActivity(activeTaskActivity === task.id ? null : task.id)}
                            />
                        ))}
                    </div>
                )}
            </AnimatePresence>

            {/* Modals */}
            <AnimatePresence>
                {showCreateModal && (
                    <CreateTaskModal
                        isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); setIsEditing(false); setSelectedTask(null); }}
                        onSubmit={handleCreateTask} formData={formData} setFormData={setFormData}
                        formErrors={formErrors} projects={projects} students={students} groups={groups}
                        onProjectChange={handleProjectChange} submitting={submitting} isEditing={isEditing}
                    />
                )}

                {showSubmissionsModal && (
                    <SubmissionsModal
                        isOpen={showSubmissionsModal} onClose={() => setShowSubmissionsModal(false)}
                        task={selectedTask} submissions={submissions} gradeData={gradeData}
                        setGradeData={setGradeData} onGrade={handleGradeSubmission} loading={gradingLoading}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const TaskCard = ({ task, onPublish, onDelete, onEdit, onViewSubmissions, isActiveActivity, toggleActivity }) => {
    const isOverdue = new Date(task.deadline) < new Date();
    return (
        <motion.div layout variants={cardEntrance}>
            <GlassCard className="group p-0 overflow-hidden border-l-8 border-l-transparent hover:border-l-emerald-500 transition-all duration-300 rounded-[2rem] shadow-sm hover:shadow-2xl">
                <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex gap-4">
                            <div className={`p-4 rounded-[1.5rem] shadow-sm ${task.task_type === 'group' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                {task.task_type === 'group' ? <Users size={24} /> : <User size={24} />}
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-800 tracking-tight group-hover:text-emerald-700 transition-colors uppercase">
                                    {task.title}
                                </h3>
                                <div className="flex flex-wrap items-center gap-3 mt-1">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase ${task.status === 'draft' ? 'bg-gray-100 text-gray-500' : 'bg-emerald-100 text-emerald-600'}`}>
                                        {task.status}
                                    </span>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${task.priority === 'High' ? 'text-rose-500' : task.priority === 'Medium' ? 'text-amber-500' : 'text-emerald-500'}`}>
                                        {task.priority} Priority
                                    </span>
                                    {task.student_name && (
                                        <span className="text-[10px] font-black uppercase text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md">
                                            {task.student_name}
                                        </span>
                                    )}
                                    {task.group_name && (
                                        <span className="text-[10px] font-black uppercase text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md">
                                            {task.group_name}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={onEdit} className="p-3 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-2xl transition-all">
                                <Edit3 size={20} />
                            </button>
                            {task.status === 'draft' && (
                                <button onClick={onPublish} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all">
                                    <Send size={14} /> Global Publish
                                </button>
                            )}
                            <button onClick={onDelete} className="p-3 text-gray-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>

                    <p className="text-sm text-gray-500 font-medium leading-relaxed mb-8 line-clamp-3">
                        {task.description || "Mission objective details pending documentation."}
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className={`p-4 rounded-2xl flex items-center gap-3 ${isOverdue ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400'}`}>
                            <Calendar size={18} />
                            <div>
                                <p className="text-[10px] uppercase font-black opacity-60">Deadline</p>
                                <p className="text-xs font-black">{new Date(task.deadline).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 text-gray-400 rounded-2xl flex items-center gap-3">
                            <AlertCircle size={18} />
                            <div>
                                <p className="text-[10px] uppercase font-black opacity-60">Boundary</p>
                                <p className="text-xs font-black">{task.max_marks} Points</p>
                            </div>
                        </div>
                        {task.started_at && (
                            <div className="col-span-2 p-4 bg-emerald-50/50 text-emerald-600 rounded-2xl flex items-center justify-between border border-emerald-100/50">
                                <div className="flex items-center gap-3">
                                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                                   <div>
                                       <p className="text-[8px] uppercase font-black opacity-60 tracking-wider">Operational Intake Pulse</p>
                                       <p className="text-xs font-bold italic">{new Date(task.started_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                   </div>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Active Phase</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-8 py-5 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center group-hover:bg-emerald-50/20">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/60">
                        {task.project_title || `Track #${task.project_id}`}
                    </p>
                    <div className="flex items-center gap-6">
                        <button
                            onClick={toggleActivity}
                            className={`flex items-center gap-2 font-black text-xs uppercase tracking-widest transition-colors ${isActiveActivity ? 'text-indigo-600' : 'text-gray-400 hover:text-indigo-500'}`}
                        >
                            Activity Log <MessageSquare size={16} />
                        </button>
                        {task.status !== 'draft' && (
                            <button
                                onClick={onViewSubmissions}
                                className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest group/btn"
                            >
                                Review Submissions <Eye size={16} className="group-hover/btn:scale-110 transition-transform" />
                            </button>
                        )}
                    </div>
                </div>

                <AnimatePresence>
                    {isActiveActivity && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-white px-8 pb-10 overflow-hidden"
                        >
                            <TaskActivity taskId={task.id} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </GlassCard>
        </motion.div>
    );
};

const CreateTaskModal = ({ isOpen, onClose, onSubmit, formData, setFormData, formErrors, projects, students, groups, onProjectChange, submitting, isEditing }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
        <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 50 }}
            className="bg-white rounded-[3rem] p-10 w-full max-w-3xl relative z-10 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar border border-white"
        >
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-3xl font-black text-gray-800 tracking-tight flex items-center gap-3"><Plus className="text-emerald-600" /> {isEditing ? 'Update Task' : 'New Assignment'}</h2>
                    <p className="text-gray-400 font-bold text-sm mt-1">{isEditing ? 'Modify your mission parameters' : 'Configure objective parameters and target recipients'}</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><X size={24} /></button>
            </div>

            <form onSubmit={onSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400">Target Track <span className="text-rose-500">*</span></label>
                        <select
                            className={`w-full px-5 py-3.5 bg-gray-50 border rounded-2xl outline-none font-bold text-sm transition-all ${formErrors.project_id ? 'border-rose-300 ring-2 ring-rose-100' : 'border-gray-100 focus:ring-2 focus:ring-emerald-500'}`}
                            value={formData.project_id}
                            onChange={(e) => onProjectChange(e.target.value)}
                        >
                            <option key="default" value="">Select Target Trace...</option>
                            {projects.map(p => (
                                <option key={p.id || p.project_id} value={String(p.id || p.project_id)}>{p.title}</option>
                            ))}
                        </select>
                        {formErrors.project_id && <p className="text-[10px] text-rose-500 font-black uppercase tracking-wider pl-1">{formErrors.project_id}</p>}
                    </div>
                    <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400">Modality</label>
                        <div className="flex bg-gray-100 p-1.5 rounded-2xl">
                            {['individual', 'group'].map(type => (
                                <button
                                    key={type} type="button"
                                    onClick={() => setFormData({ ...formData, task_type: type })}
                                    className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${formData.task_type === type ? 'bg-white shadow-xl text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400">Assigned Recipient <span className="text-rose-500">*</span></label>
                    {formData.task_type === 'individual' ? (
                        <div className="space-y-4">
                            <div className="flex gap-2 relative">
                                <select
                                    className={`w-full px-5 py-3.5 bg-gray-50 border rounded-2xl outline-none font-bold text-sm ${formErrors.student_id ? 'border-rose-300 ring-2 ring-rose-100' : 'border-gray-100 focus:ring-2 focus:ring-emerald-500'}`}
                                    value={formData.student_id}
                                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                                >
                                    <option value="">Select Student...</option>
                                    {(() => {
                                        const selectedProj = projects.find(p => String(p.id || p.project_id) === String(formData.project_id));
                                        let filtered = students;
                                        if (selectedProj) {
                                            if (selectedProj.department_id) filtered = filtered.filter(s => String(s.department_id) === String(selectedProj.department_id));
                                            if (selectedProj.course_id) filtered = filtered.filter(s => !s.course_id || String(s.course_id) === String(selectedProj.course_id));
                                        }
                                        filtered = filtered.filter(s => !(formData.selected_students || []).includes(String(s.id)));
                                        return filtered.map(s => <option key={s.id} value={s.id}>{s.name} ({s.email})</option>);
                                    })()}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!formData.student_id) return;
                                        const currentSelected = formData.selected_students || [];
                                        if (!currentSelected.includes(String(formData.student_id))) {
                                            setFormData({ 
                                                ...formData, 
                                                selected_students: [...currentSelected, String(formData.student_id)], 
                                                student_id: '' 
                                            });
                                        }
                                    }}
                                    className="px-5 bg-emerald-100 text-emerald-600 hover:bg-emerald-200 rounded-2xl transition-colors font-black flex items-center justify-center shadow-sm"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                            
                            {(formData.selected_students && formData.selected_students.length > 0) && (
                                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3 max-h-40 overflow-y-auto custom-scrollbar flex flex-col gap-2 shadow-inner">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1 px-1">Selected Recipients ({formData.selected_students.length})</p>
                                    {formData.selected_students.map(sid => {
                                        const stu = students.find(s => String(s.id) === String(sid));
                                        return (
                                            <div key={sid} className="flex justify-between items-center bg-white px-4 py-3 rounded-xl shadow-sm text-sm font-bold border border-gray-100 group">
                                                <span className="text-gray-700">{stu ? `${stu.name} (${stu.email})` : `Student ID: ${sid}`}</span>
                                                <button 
                                                    type="button" 
                                                    onClick={() => {
                                                        const currentSelected = formData.selected_students || [];
                                                        setFormData({
                                                            ...formData,
                                                            selected_students: currentSelected.filter(id => String(id) !== String(sid))
                                                        });
                                                    }} 
                                                    className="text-gray-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (
                        <select
                            className={`w-full px-5 py-3.5 bg-gray-50 border rounded-2xl outline-none font-bold text-sm disabled:opacity-50 ${formErrors.group_id ? 'border-rose-300 ring-2 ring-rose-100' : 'border-gray-100 focus:ring-2 focus:ring-emerald-500'}`}
                            disabled={!formData.project_id}
                            value={formData.group_id}
                            onChange={(e) => setFormData({ ...formData, group_id: e.target.value })}
                        >
                            <option value="">Select Squad {formData.project_id ? '' : '(Track Required First)'}</option>
                            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                    )}
                    {(formErrors.student_id || formErrors.group_id) && <p className="text-[10px] text-rose-500 font-black uppercase tracking-wider pl-1">{formErrors.student_id || formErrors.group_id}</p>}
                </div>

                <div className="space-y-3">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400">Objective Heading <span className="text-rose-500">*</span></label>
                    <input
                        className={`w-full px-5 py-3.5 bg-gray-50 border rounded-2xl outline-none font-black text-lg ${formErrors.title ? 'border-rose-300 ring-2 ring-rose-100' : 'border-gray-100 focus:ring-2 focus:ring-emerald-500'}`}
                        placeholder="e.g. Design Entity Relationship Diagram"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                    {formErrors.title && <p className="text-[10px] text-rose-500 font-black uppercase tracking-wider pl-1">{formErrors.title}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400">Lifecycle Finish <span className="text-rose-500">*</span></label>
                        <input
                            type="datetime-local"
                            className={`w-full px-5 py-3.5 bg-gray-50 border rounded-2xl outline-none font-bold text-sm ${formErrors.deadline ? 'border-rose-300 ring-2 ring-rose-100' : 'border-gray-100'}`}
                            value={formData.deadline}
                            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                        />
                        {formErrors.deadline && <p className="text-[10px] text-rose-500 font-black uppercase tracking-wider pl-1">{formErrors.deadline}</p>}
                    </div>
                    <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400">Maximum Points</label>
                        <input
                            type="number" min="0"
                            className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-black text-sm text-emerald-600"
                            value={formData.max_marks}
                            onChange={(e) => setFormData({ ...formData, max_marks: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400">Operational Briefing</label>
                    <textarea
                        rows={4}
                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-3xl outline-none font-medium text-sm leading-relaxed"
                        placeholder="Specify task requirements, deliverables, and evaluation criteria..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>

                <div className="flex gap-4 pt-6">
                    <Button type="button" variant="secondary" className="flex-1 py-5" onClick={onClose}>Abort Mission</Button>
                    <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 py-5 shadow-xl shadow-emerald-100" disabled={submitting}>
                        {submitting ? 'Initializing...' : (isEditing ? 'Update' : 'Establish Draft')}
                    </Button>
                </div>
            </form>
        </motion.div>
    </motion.div>
);

const SubmissionsModal = ({ isOpen, onClose, task, submissions, gradeData, setGradeData, onGrade, loading }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 backdrop-blur-xl" onClick={onClose} />
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="bg-white rounded-[3.5rem] p-4 w-full max-w-6xl h-[90vh] flex flex-col relative z-20 shadow-2xl border border-white/50"
        >
            <div className="p-8 pb-4 flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">{task?.title}</h2>
                    <p className="text-gray-400 font-bold text-sm tracking-wider uppercase mt-1">Operational Deliverables ({submissions.length})</p>
                </div>
                <button onClick={onClose} className="p-4 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all"><X size={28} /></button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-4 space-y-6 custom-scrollbar">
                {submissions.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                        <Send size={80} className="mb-6" />
                        <h3 className="text-3xl font-black uppercase">No Active Transmissions</h3>
                    </div>
                ) : (
                    submissions.map(sub => (
                        <div key={sub.id} className="group p-8 bg-gray-50/50 rounded-[2.5rem] border border-gray-100 flex flex-col xl:flex-row gap-10 hover:bg-white hover:border-emerald-100 transition-all duration-500 shadow-sm hover:shadow-xl">
                            <div className="flex-1">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center font-black text-lg text-emerald-600 shadow-sm">
                                        {sub.student_name?.charAt(0) || '?'}
                                    </div>
                                    <div>
                                        <p className="text-xl font-black text-gray-800">{sub.student_name}</p>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase ${sub.is_late ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                {sub.is_late ? 'Late Submission' : 'On Time'}
                                            </span>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(sub.submitted_at).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white/80 p-6 rounded-3xl border border-gray-100 mb-6">
                                    <label className="text-[10px] font-black uppercase text-gray-300 tracking-widest block mb-3">Transmission Payload</label>
                                    <p className="text-sm text-gray-600 font-medium leading-relaxed italic">" {sub.submission_text || "Zero payload detected."} "</p>
                                </div>

                                <div className="flex flex-wrap items-center gap-6 mt-4 pt-4 border-t border-gray-100 mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1 bg-emerald-100 text-emerald-600 rounded-lg"><Clock size={12} /></div>
                                        <div>
                                            <p className="text-[7px] font-black uppercase text-gray-400 tracking-widest">Intake Pulse</p>
                                            <p className="text-[10px] font-bold text-gray-600">
                                                {sub.task_started_at ? new Date(sub.task_started_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="p-1 bg-blue-100 text-blue-600 rounded-lg"><Send size={12} /></div>
                                        <div>
                                            <p className="text-[7px] font-black uppercase text-gray-400 tracking-widest">Transmission</p>
                                            <p className="text-[10px] font-bold text-gray-600">
                                                {new Date(sub.submitted_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                            </p>
                                        </div>
                                    </div>
                                    {sub.file_url && (
                                        <a href={sub.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 px-6 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all ml-auto">
                                            <Download size={16} /> Open Payload
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div className="w-full xl:w-80 flex flex-col justify-center gap-4 border-t xl:border-t-0 xl:border-l border-gray-100 pt-6 xl:pt-0 xl:pl-10">
                                {sub.status === 'graded' ? (
                                    <div className="text-center p-8 bg-emerald-600 text-white rounded-[2rem] shadow-xl">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Authenticated Grade</p>
                                        <div className="text-6xl font-black mb-1 leading-none">{sub.marks}</div>
                                        <p className="text-sm font-black tracking-tighter opacity-80 uppercase">Grade: {sub.grade}</p>
                                        <div className="mt-6 pt-6 border-t border-white/20">
                                            <p className="text-[10px] text-left opacity-80 italic leading-relaxed">"{sub.feedback || "Standard validation clearance."}"</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <h4 className="text-center text-[10px] font-black uppercase tracking-widest text-emerald-600">Pending Evaluation</h4>
                                        <div className="relative">
                                            <input
                                                type="number" placeholder="Award Points"
                                                className="w-full text-2xl font-black p-5 border-2 border-gray-100 rounded-3xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50/50 text-center"
                                                min="0" max={task?.max_marks}
                                                onChange={(e) => setGradeData({ ...gradeData, marks: e.target.value })}
                                            />
                                            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-200 font-black">/ {task?.max_marks}</span>
                                        </div>
                                        <textarea
                                            placeholder="Evaluation Feedback..."
                                            className="w-full text-xs font-bold p-5 bg-gray-50 border border-gray-100 rounded-3xl focus:ring-4 focus:ring-emerald-50/50 outline-none h-32"
                                            onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
                                        />
                                        <Button
                                            className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-50 rounded-[2rem]"
                                            onClick={() => onGrade(sub.id)}
                                            disabled={loading}
                                        >
                                            {loading ? 'Processing...' : 'Authenticate Grade'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
            {/* Footer gradient */}
            <div className="h-10 bg-gradient-to-t from-white to-transparent pointer-events-none rounded-b-[3.5rem] sticky bottom-0" />
        </motion.div>
    </motion.div>
);

export default FacultyTasks;
