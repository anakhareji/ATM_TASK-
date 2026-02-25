import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ListTodo, Calendar, CheckCircle, AlertTriangle, Plus } from 'lucide-react';
import API from '../api/axios';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import { staggerContainer, cardEntrance } from '../utils/motionVariants';

const StudentTodo = () => {
  const [todos, setTodos] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', due_date: '' });

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [listRes, progRes] = await Promise.all([
        API.get('/todo/student'),
        API.get('/todo/student/progress')
      ]);
      setTodos(listRes.data);
      setProgress(progRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await API.post('/todo/', {
        title: form.title,
        description: form.description,
        due_date: new Date(form.due_date).toISOString(),
        student_id: user.id,
      });
      setShowForm(false);
      setForm({ title: '', description: '', due_date: '' });
      fetchData();
    } catch (err) {
      alert('Failed to create to-do');
    }
  };

  const markComplete = async (id) => {
    try {
      await API.patch(`/todo/${id}/complete`);
      fetchData();
    } catch {
      alert('Failed to update status');
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
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">My To-Do</h1>
          <p className="text-gray-500 font-medium">Track personal study tasks and meet deadlines</p>
        </div>
        <div className="flex gap-3">
          <Button icon={<Plus size={18} />} onClick={() => setShowForm(true)}>Add Task</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={cardEntrance}>
          <GlassCard className="flex items-center gap-4 border-l-4 border-emerald-500">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Completed</p>
              <p className="text-2xl font-black text-gray-800">{progress?.completed || 0}</p>
            </div>
          </GlassCard>
        </motion.div>
        <motion.div variants={cardEntrance}>
          <GlassCard className="flex items-center gap-4 border-l-4 border-amber-500">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total</p>
              <p className="text-2xl font-black text-gray-800">{progress?.total || 0}</p>
            </div>
          </GlassCard>
        </motion.div>
        <motion.div variants={cardEntrance}>
          <GlassCard className="flex items-center gap-4 border-l-4 border-teal-500">
            <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl">
              <ListTodo size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Progress</p>
              <p className="text-2xl font-black text-gray-800">{progress?.progress_percent || 0}%</p>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      <div className="space-y-6">
        {todos.map(t => (
          <motion.div key={t.id} variants={cardEntrance}>
            <GlassCard className="flex items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-black text-gray-800">{t.title}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    t.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                    t.status === 'overdue' ? 'bg-rose-100 text-rose-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {t.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 font-medium">{t.description}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mt-1">
                  <Calendar size={12} /> {new Date(t.due_date).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {t.status !== 'completed' && (
                  <Button onClick={() => markComplete(t.id)} className="bg-emerald-600 hover:bg-emerald-700">Mark Done</Button>
                )}
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg relative z-10 shadow-2xl">
            <h2 className="text-2xl font-black text-gray-800 mb-6">Add To-Do</h2>
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Title</label>
                <input
                  required
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Description</label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Due Date</label>
                <input
                  required
                  type="date"
                  value={form.due_date}
                  onChange={e => setForm({ ...form, due_date: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700">Create</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default StudentTodo;
