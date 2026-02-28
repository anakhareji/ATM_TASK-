import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ListTodo, Calendar, CheckCircle, 
  AlertTriangle, Plus, X, Target, 
  Activity, Zap, Clock, ClipboardList
} from 'lucide-react';
import API from '../api/axios';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import Counter from '../components/ui/Counter';
import { staggerContainer, cardEntrance } from '../utils/motionVariants';
import toast from 'react-hot-toast';

const StudentTodo = () => {
  const [todos, setTodos] = useState([]);
  const [assignedTasks, setAssignedTasks] = useState([]); // New state for faculty tasks
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', due_date: '' });
  const [expandedTaskId, setExpandedTaskId] = useState(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [listRes, progRes, taskRes] = await Promise.all([
        API.get('/todo/student'),
        API.get('/todo/student/progress'),
        API.get('/tasks/assigned') // FETCH ASSIGNED BUT NOT STARTED
      ]);
      setTodos(listRes.data);
      setProgress(progRes.data);
      setAssignedTasks(taskRes.data);
    } catch (e) {
      toast.error("Failed to recover personnel objectives.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const loadToast = toast.loading("Recording mission objective...");
    try {
      await API.post('/todo/', {
        title: form.title,
        description: form.description,
        due_date: new Date(form.due_date).toISOString(),
        student_id: user.id,
      });
      toast.success("Objective Established.", { id: loadToast });
      setShowForm(false);
      setForm({ title: '', description: '', due_date: '' });
      fetchData();
    } catch (err) {
      toast.error("Deployment Failed.", { id: loadToast });
    }
  };

  const markComplete = async (id) => {
    const loadToast = toast.loading("Validating objective completion...");
    try {
      await API.patch(`/todo/${id}/complete`);
      toast.success("Objective Fulfilled.", { id: loadToast });
      fetchData();
    } catch {
      toast.error("Status Update Failed.", { id: loadToast });
    }
  };

  const acceptTask = async (id) => {
    const loadToast = toast.loading("Securing mission authorization...");
    try {
      await API.patch(`/tasks/${id}/accept`);
      toast.success("Operational Intel Secured. Timer Activated.", { id: loadToast });
      fetchData();
      // Should ideally navigate or user can see it in My Tasks
    } catch {
      toast.error("Authorization Protocols Failed.", { id: loadToast });
    }
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-10 pb-20">
      
      {/* Tactical Planning Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-white/40 p-1 rounded-[3.5rem] border border-white/50 backdrop-blur-xl">
        <div className="px-10 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/20">
              <ListTodo size={20} className="text-white" />
            </div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tight italic uppercase">Tactical Planning</h1>
          </div>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em]">Personnel Objectives • Mission Timeline</p>
        </div>

        <div className="px-10 pb-8 lg:pb-0 flex items-center gap-4">
           <Button 
              icon={<Plus size={18} />} 
              onClick={() => setShowForm(true)}
              className="bg-gray-800 hover:bg-black text-[10px] font-black uppercase tracking-widest py-4 px-8 rounded-[2rem] shadow-2xl active:scale-95 transition-all"
           >
              Establish New Objective
           </Button>
        </div>
      </div>

      {/* KPI Stats Suite */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <KPICard 
             title="Objectives Met" 
             value={progress?.completed || 0} 
             subtext="Validated completions" 
             icon={CheckCircle} 
             color="text-emerald-500" 
             bg="bg-emerald-500/10" 
         />
         <KPICard 
             title="Active Briefings" 
             value={(progress?.total || 0) + assignedTasks.length} 
             subtext="Total personnel tasks" 
             icon={Target} 
             color="text-amber-500" 
             bg="bg-amber-500/10" 
         />
         <KPICard 
             title="Mission Velocity" 
             value={`${progress?.progress_percent || 0}%`} 
             subtext="Operational efficiency" 
             icon={Activity} 
             color="text-teal-500" 
             bg="bg-teal-500/10" 
         />
      </div>

      {/* Task Feed */}
      <div className="space-y-6">
        {loading ? (
             <div className="h-40 bg-white/20 rounded-[2.5rem] animate-pulse" />
        ) : (
          <AnimatePresence>
            {/* 🛡️ RENDER ASSIGNED FACULTY TASKS FIRST */}
            {assignedTasks.map((t) => {
              const isExpanded = expandedTaskId === t.id;
              return (
              <motion.div key={`task-${t.id}`} variants={cardEntrance} initial="hidden" animate="visible" exit="hidden" layout>
                 <GlassCard className="p-8 border-indigo-200 bg-indigo-50/10 group hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-300 relative overflow-hidden">
                    <div 
                      className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10 cursor-pointer"
                      onClick={() => setExpandedTaskId(isExpanded ? null : t.id)}
                    >
                       <div className="flex items-center gap-6 text-center md:text-left flex-1 w-full">
                          <div className="w-14 h-14 rounded-2xl bg-indigo-500 text-white flex shrink-0 items-center justify-center shadow-lg shadow-indigo-500/20">
                             <Zap size={28} className={isExpanded ? "" : "animate-pulse"} />
                          </div>
                          <div className="flex-1 w-full text-left">
                             <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                                <h3 className="text-xl font-black text-gray-800 uppercase italic tracking-tight">{t.title}</h3>
                                <span className="px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] bg-indigo-100 text-indigo-700 border border-indigo-200">
                                   System Directive
                                </span>
                                <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[8px] font-black uppercase tracking-widest italic border border-amber-100">
                                   Awaiting Personnel
                                </span>
                             </div>
                             <p className={`text-sm font-medium text-gray-500 max-w-2xl ${isExpanded ? '' : 'line-clamp-2'}`}>
                               {t.description || "No mission intel provided."}
                             </p>
                             <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <div className="flex items-center gap-1">
                                    <Clock size={12} className="text-indigo-500" />
                                    <span>Deadline: {t.deadline ? new Date(t.deadline).toLocaleDateString() : 'N/A'}</span>
                                </div>
                                <div className="w-px h-3 bg-gray-200 hidden md:block" />
                                <div className="flex items-center gap-1">
                                    <Target size={12} className="text-rose-500" />
                                    <span>{t.priority || 'Normal'} Visibility</span>
                                </div>
                             </div>
                          </div>
                       </div>
                       
                       {!isExpanded && (
                          <div className="shrink-0 text-indigo-400 text-[8px] font-black tracking-widest uppercase italic animate-bounce mt-4 md:mt-0">
                             Click to Expand
                          </div>
                       )}
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="relative z-10 mt-6 pt-6 border-t border-indigo-200/50 flex flex-col items-center sm:items-end overflow-hidden"
                        >
                           <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-4 italic text-center sm:text-right max-w-sm">
                             Confirm readiness to begin mission protocol. This action will transfer the task to your active queue and mark it "In Progress".
                           </p>
                           <Button 
                              onClick={(e) => { e.stopPropagation(); acceptTask(t.id); }}
                              className="bg-indigo-600 hover:bg-indigo-700 text-[10px] font-black uppercase tracking-widest py-4 px-10 rounded-2xl shadow-xl shadow-indigo-500/20 active:scale-95 transition-all w-full sm:w-auto"
                           >
                              Set to In-Progress & Save
                           </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Highlight bar */}
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
                 </GlassCard>
              </motion.div>
            )})}

            {/* 📝 RENDER PERSONAL TODOS */}
            {todos.map((t) => (
              <motion.div key={`todo-${t.id}`} variants={cardEntrance} initial="hidden" animate="visible" exit="hidden" layout>
                <GlassCard className="p-8 border-white/60 bg-white/40 group hover:bg-white hover:shadow-2xl hover:shadow-emerald-500/5 transition-all duration-300">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6 text-center md:text-left">
                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors duration-300 ${
                         t.status === 'completed' ? 'bg-emerald-50 text-emerald-500' : 'bg-gray-50 text-gray-400 group-hover:bg-emerald-50 group-hover:text-emerald-500'
                       }`}>
                          {t.status === 'completed' ? <CheckCircle size={28} /> : <Zap size={28} />}
                       </div>
                       <div>
                          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                             <h3 className="text-xl font-black text-gray-800 uppercase italic tracking-tight">{t.title}</h3>
                             <span className={`px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] border ${
                                t.status === 'completed' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                t.status === 'overdue' ? 'bg-rose-100 text-rose-700 border-rose-200 animate-pulse' :
                                'bg-amber-100 text-amber-700 border-amber-200'
                             }`}>
                                {t.status}
                             </span>
                          </div>
                          <p className="text-sm font-medium text-gray-500 max-w-xl">{t.description}</p>
                          <div className="flex items-center justify-center md:justify-start gap-4 mt-4">
                             <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <Clock size={12} className="text-orange-500" />
                                <span>Due: {new Date(t.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'})}</span>
                             </div>
                             <div className="w-px h-3 bg-gray-200" />
                             <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <ClipboardList size={12} className="text-emerald-500" />
                                <span>Objective #{t.id}</span>
                             </div>
                          </div>
                       </div>
                    </div>
                    
                    <div className="shrink-0">
                      {t.status !== 'completed' ? (
                        <Button 
                           onClick={() => markComplete(t.id)} 
                           className="bg-emerald-600 hover:bg-emerald-700 text-[10px] font-black uppercase tracking-widest py-4 px-10 rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95"
                        >
                           Validate Fulfillment
                        </Button>
                      ) : (
                        <div className="flex items-center gap-3 px-8 py-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 italic font-black text-[10px] uppercase tracking-widest">
                           <CheckCircle size={16} /> Archive Protocol Active
                        </div>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {!loading && todos.length === 0 && assignedTasks.length === 0 && (
          <div className="py-40 rounded-[4rem] bg-white/40 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center backdrop-blur-sm grayscale opacity-60">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                  <Target size={48} className="text-gray-300" />
              </div>
              <h3 className="text-2xl font-black text-gray-400 uppercase tracking-tighter italic">Zero Active Objectives</h3>
              <p className="text-sm font-bold text-gray-300 uppercase tracking-widest mt-2">Field status clear • Awaiting new directives</p>
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }} 
               className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" 
               onClick={() => setShowForm(false)} 
            />
            <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="bg-white rounded-[3.5rem] p-12 w-full max-w-xl relative z-10 shadow-3xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8">
                  <button onClick={() => setShowForm(false)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-rose-50 hover:text-rose-500 transition-all">
                      <X size={20} />
                  </button>
              </div>

              <div className="mb-10">
                <div className="flex items-center gap-3 mb-2">
                    <Plus className="text-emerald-500" />
                    <h2 className="text-3xl font-black text-gray-800 tracking-tight italic uppercase">New Directive</h2>
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Formalize personal mission parameters</p>
              </div>

              <form onSubmit={handleCreate} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-4">Directive Title</label>
                  <input
                    required
                    type="text"
                    placeholder="Short mission identifier..."
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    className="w-full px-8 py-5 bg-gray-50 border border-gray-100 rounded-[2rem] focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-black uppercase italic tracking-tight text-gray-800 transition-all placeholder:text-gray-300 placeholder:italic"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-4">Intel Summary</label>
                  <textarea
                    rows={4}
                    placeholder="Detailed objective protocols..."
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className="w-full px-8 py-5 bg-gray-50 border border-gray-100 rounded-[2rem] focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-gray-600 transition-all resize-none placeholder:text-gray-300"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-4">Deployment Deadline</label>
                  <div className="relative">
                      <input
                        required
                        type="date"
                        value={form.due_date}
                        onChange={e => setForm({ ...form, due_date: e.target.value })}
                        className="w-full px-8 py-5 bg-gray-50 border border-gray-100 rounded-[2rem] focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-black uppercase tracking-[0.2em] text-gray-600 transition-all cursor-pointer"
                      />
                      <Calendar className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={20} />
                  </div>
                </div>
                <div className="flex gap-4 pt-6">
                  <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 py-5 rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] shadow-2xl shadow-emerald-500/20 active:scale-95">Deploy Directive</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const KPICard = ({ title, value, subtext, icon: Icon, color, bg }) => (
  <motion.div variants={cardEntrance} whileHover={{ y: -5 }}>
    <GlassCard className="h-full py-8 border-white/50">
      <div className="flex items-center gap-6">
        <div className={`p-4 rounded-2xl ${bg} ${color} shadow-lg shadow-gray-200/5`}>
          <Icon size={24} />
        </div>
        <div>
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] mb-1">{title}</p>
          <h3 className="text-3xl font-black text-gray-800 tracking-tighter italic leading-none">
            <Counter value={value} />
          </h3>
          <p className="text-gray-500 text-[8px] font-black uppercase tracking-widest mt-2">{subtext}</p>
        </div>
      </div>
    </GlassCard>
  </motion.div>
);

export default StudentTodo;
