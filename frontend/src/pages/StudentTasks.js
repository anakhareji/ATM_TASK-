import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckSquare, UploadCloud, MessageSquare, Calendar, User, Users, AlertCircle, MessageCircle, Send
} from 'lucide-react';
import API from '../api/axios';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import { staggerContainer, cardEntrance } from '../utils/motionVariants';

const TaskComments = ({ taskId, onClose }) => {
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
      alert('Failed to post comment');
    }
  };

  return (
    <div className="mt-6 border-t border-gray-100 pt-6">
      <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
        <MessageCircle size={16} className="text-emerald-600"/> Discussion Log
      </h4>
      
      <div className="space-y-4 max-h-60 overflow-y-auto mb-4 pr-2 custom-scrollbar">
        {loading ? (
           <div className="text-xs text-gray-400">Loading comments...</div>
        ) : comments.length === 0 ? (
           <div className="text-xs text-gray-400 italic">No comments yet. Start the conversation!</div>
        ) : (
          comments.map(c => (
            <div key={c.id} className={`p-3 rounded-xl ${c.role === 'student' ? 'bg-gray-50' : 'bg-emerald-50'}`}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-gray-700">{c.user_name} <span className="text-[10px] text-gray-400 font-normal uppercase">({c.role})</span></span>
                <span className="text-[10px] text-gray-400">{new Date(c.created_at).toLocaleString([], {hour: '2-digit', minute:'2-digit', month: 'short', day: 'numeric'})}</span>
              </div>
              <p className="text-sm text-gray-600">{c.comment_text}</p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSend} className="flex gap-2 relative">
        <input 
          type="text" 
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Type a message or question..."
          className="w-full pl-4 pr-12 py-2 bg-gray-50 border border-gray-200 rounded-full focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
        />
        <button type="submit" disabled={!newComment.trim()} className="absolute right-1 top-1 p-1.5 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:opacity-50 transition-all">
          <Send size={14} />
        </button>
      </form>
    </div>
  );
};

const StudentTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(null);
  const [submissionText, setSubmissionText] = useState('');
  const [activeCommentTask, setActiveCommentTask] = useState(null);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await API.get('/tasks/my-tasks');
      setTasks(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!showSubmitModal) return;
    try {
      await API.post(`/tasks/${showSubmitModal.id}/submit`, { submission_text: submissionText });
      setShowSubmitModal(null);
      setSubmissionText('');
      fetchTasks();
    } catch (err) {
      alert('Submission failed');
    }
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">My Tasks</h1>
          <p className="text-gray-500 font-medium">View, track and submit your assigned tasks</p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 animate-pulse text-emerald-600 font-bold">Loading tasks...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {tasks.map((task) => (
            <motion.div key={task.id} variants={cardEntrance} layout>
              <GlassCard className="group h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-gray-50 text-gray-500 rounded-2xl group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                        <CheckSquare size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-gray-800">{task.title}</h3>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            task.status === 'assigned' ? 'bg-amber-100 text-amber-700' :
                            task.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                            task.status === 'verified' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-rose-100 text-rose-700'
                          }`}>
                            {task.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 font-medium mt-1">{task.description}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mt-2">
                          <Calendar size={12} /> {new Date(task.deadline).toLocaleDateString()} • {task.priority}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          {task.task_type === 'group' ? (
                            <span className="flex items-center gap-1"><Users size={14} /> Group #{task.group_id}</span>
                          ) : (
                            <span className="flex items-center gap-1"><User size={14} /> Individual</span>
                          )}
                          <span className="font-bold text-gray-400 uppercase tracking-widest">Max {task.max_marks}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 hidden sm:block">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Faculty</p>
                      <p className="text-sm font-medium text-gray-600">#{task.faculty_id}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="text-sm text-gray-500">
                      {task.faculty_feedback && (
                        <div className="p-3 bg-blue-50/50 rounded-xl mb-3 border border-blue-100">
                            <p className="text-xs font-bold text-blue-700 mb-1 uppercase tracking-wider">Faculty Feedback</p>
                            <p className="italic text-gray-700">“{task.faculty_feedback}”</p>
                        </div>
                      )}
                      {task.submitted_at && (
                        <p className="text-[10px] font-bold text-emerald-600 uppercase mt-1">Submitted {new Date(task.submitted_at).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
                   <Button 
                      variant="secondary" 
                      className="text-xs flex items-center gap-2 py-1.5 px-3"
                      onClick={() => setActiveCommentTask(activeCommentTask === task.id ? null : task.id)}
                    >
                      <MessageCircle size={14} /> 
                      {activeCommentTask === task.id ? 'Hide Chat' : 'Discuss'}
                   </Button>
                  
                  <div className="flex gap-3">
                    {(task.status === 'assigned' || task.status === 'returned') && (
                      <Button
                        icon={<UploadCloud size={16} />}
                        onClick={() => setShowSubmitModal(task)}
                        className="bg-emerald-600 hover:bg-emerald-700 py-1.5 text-xs"
                      >
                        Submit Work
                      </Button>
                    )}
                    {task.status === 'verified' && (
                      <div className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase">Approved</div>
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {activeCommentTask === task.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                       <TaskComments taskId={task.id} onClose={() => setActiveCommentTask(null)} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            </motion.div>
          ))}
          {tasks.length === 0 && (
            <div className="col-span-full text-center text-gray-400 py-20 font-medium">
              <AlertCircle className="mx-auto mb-4" />
              No tasks found
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showSubmitModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowSubmitModal(null)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 w-full max-w-lg relative z-10 shadow-2xl"
            >
              <h2 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-2">
                <UploadCloud className="text-emerald-600" /> Submit Task
              </h2>
              <p className="text-sm text-gray-500 mb-6">You are submitting work for <span className="font-bold text-gray-700">"{showSubmitModal.title}"</span>.</p>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Submission Text / Links</label>
                  <textarea
                    rows={6}
                    required
                    placeholder="Provide a link to your work, or paste your text submission here..."
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-sm transition-all resize-none"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowSubmitModal(null)}>Cancel</Button>
                  <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20">Submit Evidence</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StudentTasks;
