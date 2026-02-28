import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckSquare, UploadCloud, MessageSquare, Calendar, User, Users, 
  AlertCircle, MessageCircle, Send, Clock, Search, Filter, ChevronRight,
  Info, CheckCircle2, FileText, CheckCircle
} from 'lucide-react';
import API from '../api/axios';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import { staggerContainer, cardEntrance } from '../utils/motionVariants';
import toast from 'react-hot-toast';

const TaskComments = ({ taskId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [taskId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/tasks/${taskId}/comments`);
      setComments(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await API.post(`/tasks/${taskId}/comments`, { comment_text: newComment });
      setNewComment('');
      fetchComments();
    } catch (e) {
      toast.error('Failed to post comment');
    }
  };

  return (
    <div className="mt-5 pt-5 border-t border-gray-100 flex flex-col h-[350px]">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
            <MessageCircle size={16} className="text-gray-500" /> Discussion
        </h4>
      </div>
      
      <div className="flex-1 overflow-y-auto mb-4 pr-2 space-y-3 custom-scrollbar">
        {loading ? (
           <div className="space-y-3">
               {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-50 animate-pulse rounded-lg md:w-2/3" />)}
           </div>
        ) : comments.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center">
               <MessageSquare size={32} className="mb-2 opacity-50" />
               <p className="text-sm font-medium">No comments yet</p>
           </div>
        ) : (
          comments.map(c => (
            <div key={c.id} className={`flex flex-col ${c.role === 'student' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl shadow-sm text-sm ${
                    c.role === 'student' 
                    ? 'bg-indigo-600 text-white rounded-br-sm' 
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                }`}>
                  <p className="leading-relaxed whitespace-pre-wrap">{c.comment_text}</p>
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-400 font-medium px-1">
                  <span>{c.user_name}</span>
                  <span>•</span>
                  <span>{new Date(c.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSend} className="relative mt-auto">
        <input 
          type="text" 
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="w-full pl-4 pr-12 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all shadow-sm"
        />
        <button type="submit" disabled={!newComment.trim()} className="absolute right-1.5 top-1.5 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all">
          <Send size={16} />
        </button>
      </form>
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
                      className={`text-sm font-medium flex items-center gap-2 transition-colors ${
                          activeCommentTask === task.id ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'
                      }`}
                      onClick={() => setActiveCommentTask(activeCommentTask === task.id ? null : task.id)}
                    >
                      <MessageCircle size={16} /> 
                      {activeCommentTask === task.id ? 'Close Discussion' : 'Discussion'}
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
