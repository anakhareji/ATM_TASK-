import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckSquare, UploadCloud, MessageSquare, User, Users, 
  AlertCircle, Clock, Search,
  Info, CheckCircle2, FileText, CheckCircle,
  Layout, Bold, Italic, Link, Paperclip, AtSign, Smile, Code, History, List, Edit3, Trash2
} from 'lucide-react';
import API from '../api/axios';
import { staggerContainer, cardEntrance } from '../utils/motionVariants';
import toast from 'react-hot-toast';
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
    const toolbarId = useMemo(() => `toolbar-${Math.random().toString(36).substr(2, 9)}`, []);

    const modules = useMemo(() => ({
        toolbar: false, // Explicitly disabled as requested
        keyboard: {
            bindings: {
                tab: false,
            }
        }
    }), []);

    const formats = [
        'bold', 'italic', 'list', 'code'
    ];

    return (
        <div className="bg-white border-2 border-indigo-100 rounded-3xl shadow-xl overflow-hidden animate-slideUp group">
            <div className="quill-wrapper">
                <ReactQuill
                    theme="snow"
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    modules={modules}
                    formats={formats}
                    className="comment-quill"
                />
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .comment-quill .ql-container {
                    border: none !important;
                    font-family: inherit;
                    min-height: 120px;
                }
                .comment-quill .ql-editor {
                    padding: 1.25rem;
                    font-size: 0.75rem;
                    font-weight: 500;
                    color: #4b5563;
                    min-height: 120px;
                    text-align: left;
                }
                .comment-quill .ql-editor strong, .comment-quill .ql-editor b {
                    font-weight: 800 !important;
                }
                .comment-quill .ql-editor em, .comment-quill .ql-editor i {
                    font-style: italic !important;
                    font-weight: 500 !important;
                }
                .comment-quill .ql-editor.ql-blank::before {
                    color: #d1d5db;
                    font-style: normal;
                    left: 1.25rem;
                }
                .ql-bold.ql-active, .ql-italic.ql-active, .ql-list.ql-active, .ql-code.ql-active {
                    background: white !important;
                    color: #4f46e5 !important;
                    box-shadow: 0 4px 12px -2px rgba(99, 102, 241, 0.15);
                }
                .comment-quill .ql-toolbar {
                    display: none;
                }
                .quill-content h1, .quill-content h2, .quill-content h3 { font-weight: 800; color: #111827; margin-bottom: 0.5rem; }
                .quill-content ul { list-style-type: disc; margin-left: 1.5rem; margin-bottom: 1rem; }
                .quill-content ol { list-style-type: decimal; margin-left: 1.5rem; margin-bottom: 1rem; }
                .quill-content blockquote { border-left: 4px solid #6366f1; padding-left: 1rem; font-style: italic; color: #4f46e5; background: #f5f3ff; padding-top: 0.5rem; padding-bottom: 0.5rem; border-radius: 0 0.75rem 0.75rem 0; margin-bottom: 1rem; }
                .quill-content a { color: #4f46e5; text-decoration: underline; font-weight: 700; }
                .quill-content code { background: #f3f4f6; color: #e11d48; padding: 0.2rem 0.4rem; border-radius: 0.375rem; font-family: monospace; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
            `}} />

            <div className="p-4 bg-gray-50 flex gap-3 justify-start items-center border-t border-gray-100">
                <button 
                    type="button"
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg hover:shadow-indigo-200/50 ring-offset-2 focus:ring-2 focus:ring-indigo-500"
                    onClick={(e) => { e.preventDefault(); onSave(); }}
                >
                    Save Entry
                </button>
                <button 
                    type="button"
                    className="px-6 py-2 text-gray-500 hover:text-gray-700 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all hover:bg-gray-100"
                    onClick={(e) => { e.preventDefault(); onCancel(); }}
                >
                    Discard
                </button>
                <div className="ml-auto flex items-center gap-1.5 text-[8px] font-black text-indigo-300 uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">
                    <CheckSquare size={10} /> Instant Sync Active
                </div>
            </div>
        </div>
    );
};

const TaskComments = ({ taskId }) => {
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
        if (!window.confirm('Erase this activity entry permanently?')) return;
        try {
            await API.delete(`/tasks/comments/${id}`);
            fetchComments();
            toast.success('Activity erased');
        } catch (e) {
            toast.error('Failed to erase activity');
        }
    };

    return (
        <div className="mt-6 pt-6 border-t border-gray-100 animate-fadeIn text-left">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2 uppercase tracking-wider">
                <Layout size={16} className="text-indigo-500" /> Activity Log
            </h3>
            
            <div className="flex gap-1 border-b border-gray-100 mb-6 overflow-x-auto pb-1 custom-scrollbar">
                {['all', 'comments', 'history', 'approvals'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${
                            activeTab === tab 
                            ? 'border-indigo-600 text-indigo-600' 
                            : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {activeTab === 'comments' ? (
                <div className="space-y-6">
                    {/* Add Comment Section */}
                    <div className="flex gap-3 group">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-[10px] shadow-md shrink-0 uppercase">
                            {localStorage.getItem('userName')?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 space-y-3">
                            {!isInputFocused ? (
                                <div 
                                    onClick={() => setIsInputFocused(true)}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-gray-400 text-xs font-medium cursor-text hover:bg-white hover:border-gray-200 transition-all shadow-sm"
                                >
                                    Add a comment...
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
                    <div className="space-y-6 pt-2">
                        {loading && comments.length === 0 ? (
                            [1,2].map(i => <div key={i} className="h-20 bg-gray-50 animate-pulse rounded-xl" />)
                        ) : comments.length === 0 ? (
                            <div className="text-center py-6">
                                <MessageSquare size={24} className="mx-auto text-gray-200 mb-2" />
                                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">No activity yet</p>
                            </div>
                        ) : (
                            comments.map(c => (
                                <div key={c.id} className="relative">
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 font-bold text-[10px] shrink-0 uppercase">
                                            {c.user_name?.charAt(0) || '?'}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            {editingId === c.id ? (
                                                <div className="animate-fadeIn space-y-2">
                                                     <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest">Editing Activity</span>
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
                                                <>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[11px] font-bold text-gray-800">{c.user_name}</span>
                                                            <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">• {new Date(c.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                        {c.user_id === currentUserId && (
                                                            <div className="flex gap-1">
                                                                <button 
                                                                    onClick={() => { setEditingId(c.id); setEditContent(c.comment_text); }}
                                                                    className="p-1 text-gray-400 hover:text-indigo-600 transition-all"
                                                                >
                                                                    <Edit3 size={12} />
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleDelete(c.id)}
                                                                    className="p-1 text-gray-400 hover:text-rose-600 transition-all"
                                                                >
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm overflow-hidden text-left">
                                                        <RichContent content={c.comment_text} />
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            ) : (
                <div className="py-12 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                    <History size={24} className="mx-auto text-gray-200 mb-2" />
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">History Log Coming Soon</p>
                </div>
            )}
        </div>
    );
};

const MissionTimer = ({ startedAt }) => {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    if (!startedAt) return;

    const calculateElapsed = () => {
      const utcString = typeof startedAt === 'string' && !startedAt.endsWith('Z') ? startedAt + 'Z' : startedAt;
      const start = new Date(utcString).getTime();
      const now = new Date().getTime();
      let diff = now - start;
      if (diff < 0) diff = 0;

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setElapsed(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 1000);

    return () => clearInterval(interval);
  }, [startedAt]);

  if (!startedAt) return null;

  return (
    <div className="flex flex-col justify-end text-right">
      <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-0.5">Time Spent</span>
      <span className="text-sm font-semibold tracking-tight text-indigo-600 tabular-nums">
        {elapsed || '00:00:00'}
      </span>
    </div>
  );
};

const StudentTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(null);
  const [submissionText, setSubmissionText] = useState('');
  const [activeCommentTask, setActiveCommentTask] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await API.get('/tasks/my-tasks');
      setTasks(res.data);
    } catch (e) {
      toast.error('Failed to sync mission data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!showSubmitModal || submitting) return;
    
    setSubmitting(true);
    const loadToast = toast.loading("Uploading mission evidence...");
    try {
      await API.post(`/tasks/${showSubmitModal.id}/submit`, { submission_text: submissionText });
      toast.success("Transmission Received.", { id: loadToast });
      setShowSubmitModal(null);
      setSubmissionText('');
      fetchTasks();
    } catch (err) {
      toast.error('Broadcast Interrupted. Retry.', { id: loadToast });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
        const matchesSearch = (t.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                              (t.description || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || t.dynamic_status === statusFilter;
        return matchesSearch && matchesStatus;
    });
  }, [tasks, searchTerm, statusFilter]);

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <CheckSquare size={28} className="text-indigo-600" />
            My Tasks
          </h1>
          <p className="text-sm text-gray-500 mt-1.5 ml-1">Manage and track your assigned projects and submissions</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative group w-full lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-shadow shadow-sm"
            />
          </div>
          <div className="flex items-center p-1 bg-gray-100 rounded-lg border border-gray-200">
             {['all', 'in_progress', 'submitted', 'graded', 'overdue'].map(f => (
               <button 
                 key={f}
                 onClick={() => setStatusFilter(f)}
                 className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${
                     statusFilter === f 
                     ? 'bg-white text-gray-900 shadow-sm' 
                     : 'text-gray-500 hover:text-gray-700'
                 }`}
               >
                 {f.replace('_', ' ')}
               </button>
             ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            {[1,2,3,4].map(i => <div key={i} className="h-[280px] bg-gray-50 rounded-2xl animate-pulse border border-gray-100" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pt-4">
          {filteredTasks.map((task) => (
            <motion.div key={task.id} variants={cardEntrance} initial="hidden" animate="visible" exit="hidden" layout className="h-full">
              <div className="group h-full flex flex-col p-6 bg-white border border-gray-200 hover:border-indigo-100 rounded-2xl hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 relative overflow-hidden">
                
                {/* Status Indicator Bar */}
                <div className={`absolute top-0 left-0 w-1 h-full ${
                  task.dynamic_status.includes('overdue') ? 'bg-red-500' :
                  task.dynamic_status === 'submitted' ? 'bg-emerald-500' :
                  task.dynamic_status === 'in_progress' ? 'bg-blue-500' :
                  task.dynamic_status === 'graded' ? 'bg-indigo-500' :
                  'bg-yellow-400'
                }`} />

                <div className="flex-1 pl-2">
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                          task.dynamic_status.includes('overdue') ? 'bg-red-50 text-red-600 border border-red-100' :
                          task.dynamic_status === 'submitted' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                          task.dynamic_status === 'in_progress' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                          task.dynamic_status === 'graded' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                          'bg-yellow-50 text-yellow-600 border border-yellow-100'
                        }`}>
                          {task.dynamic_status.replace('_', ' ').charAt(0).toUpperCase() + task.dynamic_status.replace('_', ' ').slice(1)}
                        </span>
                        <span className="text-xs text-gray-400 font-medium">#{task.id}</span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 leading-snug">
                        {task.title}
                      </h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                        {task.description || "No description provided."}
                      </p>
                    </div>

                    <div className="shrink-0 flex flex-col gap-3 min-w-[100px] items-end">
                       <div className="px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg border border-gray-200 flex items-center justify-center gap-1.5 whitespace-nowrap">
                          <CheckCircle2 size={14} className="text-gray-400"/>
                          <span className="font-semibold text-xs">{task.max_marks} Pts</span>
                       </div>
                       <MissionTimer startedAt={task.started_at} />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-8 gap-y-3 mb-6">
                      <div className="flex items-center gap-2.5">
                          <Clock size={16} className="text-gray-400" />
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500 uppercase font-semibold">Deadline</span>
                            <span className="text-sm font-medium text-gray-800">{new Date(task.deadline).toLocaleDateString()} {new Date(task.deadline).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                          {task.task_type === 'group' ? <Users size={16} className="text-gray-400" /> : <User size={16} className="text-gray-400" />}
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500 uppercase font-semibold">Type</span>
                            <span className="text-sm font-medium text-gray-800 capitalize">{task.task_type} Task</span>
                          </div>
                      </div>
                  </div>

                  {task.faculty_feedback && (
                    <div className="mb-6 p-4 bg-blue-50/50 rounded-xl border border-blue-100/50">
                         <div className="flex items-center gap-2 mb-1.5">
                            <Info size={14} className="text-blue-600" />
                            <p className="text-xs font-semibold text-blue-800">Faculty Feedback</p>
                         </div>
                         <p className="text-sm text-gray-700 leading-relaxed">{task.faculty_feedback}</p>
                    </div>
                  )}
                </div>

                <div className="mt-auto pl-2 space-y-4">
                  <div className="flex items-center justify-between pt-5 border-t border-gray-100">
                    <button 
                      className={`text-sm font-bold flex items-center gap-2 transition-colors uppercase tracking-widest ${
                          activeCommentTask === task.id ? 'text-indigo-600' : 'text-gray-400 hover:text-indigo-600'
                      }`}
                      onClick={() => setActiveCommentTask(activeCommentTask === task.id ? null : task.id)}
                    >
                      <MessageSquare size={16} /> 
                      {activeCommentTask === task.id ? 'Close Log' : 'Activity Log'}
                    </button>
                    
                    <div className="flex items-center gap-3">
                      {(task.dynamic_status.includes('in_progress') || task.dynamic_status.includes('overdue')) && (
                        <button
                          onClick={() => setShowSubmitModal(task)}
                          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors shadow-[0_2px_10px_rgb(79,70,229,0.2)]"
                        >
                          <UploadCloud size={16} />
                          Submit Task
                        </button>
                      )}
                      {(task.dynamic_status === 'submitted' || task.dynamic_status === 'graded') && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 text-gray-700 border border-gray-200">
                           {task.dynamic_status === 'graded' ? <CheckCircle size={14} className="text-emerald-500" /> : <CheckCircle2 size={14} className="text-blue-500" />}
                           <span className="text-xs font-medium">
                               {task.dynamic_status === 'graded' ? 'Graded' : 'Submitted'}
                           </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {activeCommentTask === task.id && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: 'auto', opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }} 
                        className="overflow-hidden"
                      >
                         <TaskComments taskId={task.id} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ))}
          
          {filteredTasks.length === 0 && (
            <div className="col-span-full py-20 rounded-2xl bg-white border border-gray-200 flex flex-col items-center justify-center text-center shadow-sm w-full">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                    <CheckSquare size={28} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">No Tasks Found</h3>
                <p className="text-sm text-gray-500 mt-1">You're all caught up on your assignments.</p>
            </div>
          )}
        </div>
      )}

      {/* Submission Portal Overlay */}
      <AnimatePresence>
        {showSubmitModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
              onClick={() => !submitting && setShowSubmitModal(null)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl p-8 w-full max-w-xl relative z-10 shadow-xl"
            >
              <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">
                        Submit Assignment
                    </h2>
                    <p className="text-sm text-gray-500 font-medium flex items-center gap-1.5">
                        <FileText size={14} className="text-indigo-500" /> {showSubmitModal.title}
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowSubmitModal(null)}
                    className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 rounded-lg transition-colors"
                  >
                        <X size={20} />
                  </button>
              </div>

              {new Date() > new Date(showSubmitModal.deadline) && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                    <AlertCircle className="text-red-500 mt-0.5 shrink-0" size={18} />
                    <div>
                        <p className="text-sm font-semibold text-red-800">Late Submission</p>
                        <p className="text-sm text-red-600 mt-0.5">The deadline has passed. A late penalty may be applied to your grade.</p>
                    </div>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Submission Details</label>
                  <textarea
                    rows={6}
                    required
                    placeholder="Provide a link to your repository, Google Drive, or enter text directly..."
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 hover:border-gray-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all shadow-sm resize-y"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors" onClick={() => setShowSubmitModal(null)} disabled={submitting}>
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-[0_2px_10px_rgb(79,70,229,0.3)] transition-colors flex items-center gap-2" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Assignment'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const X = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

export default StudentTasks;
