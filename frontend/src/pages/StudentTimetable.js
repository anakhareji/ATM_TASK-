import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CalendarDays, CheckSquare, ListTodo, 
  Clock, Target, Zap, ShieldCheck, 
  ChevronRight, Activity
} from 'lucide-react';
import API from '../api/axios';
import GlassCard from '../components/ui/GlassCard';
import { staggerContainer, cardEntrance } from '../utils/motionVariants';
import toast from 'react-hot-toast';

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const fullDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const StudentTimetable = () => {
  const [tasks, setTasks] = useState([]);
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tRes, tdRes] = await Promise.all([
        API.get('/tasks/my-tasks'),
        API.get('/todo/student'),
      ]);
      setTasks(tRes.data);
      setTodos(tdRes.data);
    } catch (e) {
      toast.error("Failed to recover chronological intel.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const schedule = useMemo(() => {
    const map = {};
    days.forEach((d, idx) => { map[idx] = []; });
    tasks.forEach(t => {
      const d = new Date(t.deadline);
      map[d.getDay()].push({
        id: `task-${t.id}`,
        type: 'task',
        title: t.title,
        time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        meta: `${t.task_type.toUpperCase()} • ${t.max_marks}XP`,
        priority: t.priority || 'Medium'
      });
    });
    todos.forEach(td => {
      const d = new Date(td.due_date);
      map[d.getDay()].push({
        id: `todo-${td.id}`,
        type: 'todo',
        title: td.title,
        time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        meta: td.status.toUpperCase(),
        priority: 'Normal'
      });
    });
    return map;
  }, [tasks, todos]);

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-10 pb-20">
      
      {/* Tactical Timeline Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-white/40 p-1 rounded-[3.5rem] border border-white/50 backdrop-blur-xl">
        <div className="px-10 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/20">
              <CalendarDays size={20} className="text-white" />
            </div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tight italic uppercase">Chronolith Timeline</h1>
          </div>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em]">Weekly Mission Architecture • Live Sync</p>
        </div>

        <div className="flex items-center gap-6 px-10 pb-8 lg:pb-0">
           <div className="flex flex-col items-end">
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Weekly Load</p>
              <p className="text-lg font-black text-gray-800 italic">{tasks.length + todos.length || '0'}<span className="text-xs text-gray-300 ml-1">Objectives</span></p>
           </div>
           <div className="w-px h-10 bg-gray-200" />
           <div className="p-3 bg-teal-50 rounded-2xl border border-teal-100">
               <Activity size={20} className="text-teal-500" />
           </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {[1,2,3,4,5,6,7].map(i => <div key={i} className="h-96 bg-white/20 rounded-[2.5rem] animate-pulse border border-white" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-5 h-full">
          {days.map((label, idx) => (
            <motion.div key={label} variants={cardEntrance} className="h-full group/sector">
              <GlassCard className="h-full min-h-[500px] border-white/60 bg-white/30 backdrop-blur-xl p-6 flex flex-col group-hover/sector:bg-white group-hover/sector:shadow-2xl group-hover/sector:shadow-emerald-500/5 transition-all duration-300">
                <div className="flex flex-col items-center mb-10 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover/sector:bg-emerald-50 group-hover/sector:text-emerald-500 transition-colors duration-300 mb-3">
                     <CalendarDays size={20} />
                  </div>
                  <h3 className="text-sm font-black text-gray-800 uppercase tracking-[0.2em] italic">{fullDays[idx]}</h3>
                  <div className="w-8 h-1 bg-emerald-500/20 group-hover/sector:w-12 transition-all mt-2 rounded-full" />
                </div>

                <div className="space-y-4 flex-1">
                  {schedule[idx].length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 opacity-20 group-hover/sector:opacity-40 transition-opacity">
                       <Target size={24} className="mb-2" />
                       <p className="text-[10px] font-black uppercase tracking-widest">Sector Clear</p>
                    </div>
                  ) : (
                    schedule[idx]
                      .sort((a, b) => a.time.localeCompare(b.time))
                      .map((item, i) => (
                        <div
                          key={item.id}
                          className="group/item p-4 rounded-2xl bg-white/60 border border-white group-hover/sector:bg-gray-50 transition-all duration-300 relative overflow-hidden"
                        >
                          <div className="flex flex-col gap-3 relative z-10">
                            <div className="flex justify-between items-start gap-2">
                               <div className={`p-2 rounded-xl text-white shadow-xl ${item.type === 'task' ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-teal-500 shadow-teal-500/20'}`}>
                                 {item.type === 'task' ? <CheckSquare size={14} /> : <ListTodo size={14} />}
                               </div>
                               <div className="text-right">
                                  <p className="text-xs font-black text-gray-800 uppercase italic tracking-tighter leading-none mb-1">{item.time}</p>
                                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{item.priority}</p>
                               </div>
                            </div>
                            <div>
                               <p className="text-xs font-black text-gray-800 uppercase leading-snug group-hover/item:text-emerald-600 transition-colors">{item.title}</p>
                               <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1 inline-block">{item.meta}</span>
                            </div>
                          </div>
                          {/* Accent bar */}
                          <div className={`absolute top-0 right-0 w-1 h-full ${item.type === 'task' ? 'bg-emerald-500' : 'bg-teal-500'} opacity-30`} />
                        </div>
                      ))
                  )}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{schedule[idx].length} Units</span>
                   <ChevronRight size={14} className="text-gray-200 group-hover/sector:text-emerald-500 group-hover/sector:translate-x-1 transition-all" />
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      <div className="flex justify-center pt-10">
         <div className="flex items-center gap-4 p-2 bg-white/40 border border-white/60 rounded-full backdrop-blur-xl px-10 group cursor-help hover:bg-white60 transition-all">
            <ShieldCheck size={16} className="text-indigo-500" />
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] italic underline decoration-indigo-200 underline-offset-4">Mission Synchronization Verified By Central Command</p>
         </div>
      </div>
    </motion.div>
  );
};

export default StudentTimetable;
