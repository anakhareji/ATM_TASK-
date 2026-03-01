import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarDays, CheckSquare, ListTodo, Clock, Target, Zap,
  ShieldCheck, Activity, ChevronLeft, ChevronRight
} from 'lucide-react';
import API from '../api/axios';
import GlassCard from '../components/ui/GlassCard';
import { staggerContainer, cardEntrance } from '../utils/motionVariants';
import toast from 'react-hot-toast';

const DAY_LABELS   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAYS    = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

// Generate dates for the current week (Sunday → Saturday)
const getWeekDates = (offsetWeeks = 0) => {
  const today = new Date();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - today.getDay() + offsetWeeks * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return d;
  });
};

const isSameDay = (d1, d2) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth()    === d2.getMonth()    &&
  d1.getDate()     === d2.getDate();

const ITEM_COLORS = {
  task: { bg: 'bg-emerald-50', border: 'border-l-4 border-l-emerald-500', icon: 'bg-emerald-500', dot: 'bg-emerald-500' },
  todo: { bg: 'bg-teal-50',    border: 'border-l-4 border-l-teal-500',    icon: 'bg-teal-500',    dot: 'bg-teal-500'    },
};

const StudentTimetable = () => {
  const [tasks,   setTasks]   = useState([]);
  const [todos,   setTodos]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);

  const today     = new Date();
  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tRes, tdRes] = await Promise.all([
        API.get('/tasks/my-tasks'),
        API.get('/todo/student'),
      ]);
      setTasks(tRes.data  || []);
      setTodos(tdRes.data || []);
    } catch {
      toast.error('Failed to load schedule.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Map items to weekday slots
  const schedule = useMemo(() => {
    const map = weekDates.map(() => []);
    tasks.forEach(t => {
      const d = new Date(t.deadline);
      const idx = weekDates.findIndex(wd => isSameDay(wd, d));
      if (idx >= 0) map[idx].push({
        id: `task-${t.id}`, type: 'task',
        title: t.title,
        time:  d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        meta:  `${(t.task_type||'task').toUpperCase()} • ${t.max_marks}XP`,
        priority: t.priority || 'Medium',
      });
    });
    todos.forEach(td => {
      if (!td.due_date) return;
      const d = new Date(td.due_date);
      const idx = weekDates.findIndex(wd => isSameDay(wd, d));
      if (idx >= 0) map[idx].push({
        id: `todo-${td.id}`, type: 'todo',
        title: td.title,
        time:  d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        meta:  (td.status||'').toUpperCase(),
        priority: 'Normal',
      });
    });
    return map;
  }, [tasks, todos, weekDates]);

  const totalItems = schedule.reduce((s, day) => s + day.length, 0);
  const weekLabel  = (() => {
    const s = weekDates[0], e = weekDates[6];
    const fmt = d => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return `${fmt(s)} – ${fmt(e)}`;
  })();

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-8 pb-20 w-full">

      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6
                      bg-white/60 backdrop-blur-2xl border border-white/40 rounded-3xl px-10 py-7 shadow-sm w-full">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-xl shadow-teal-500/30">
            <CalendarDays size={28} className="text-white"/>
          </div>
          <div>
            <h1 className="text-4xl font-black text-gray-800 tracking-tight italic uppercase leading-none">Schedule</h1>
            <p className="text-gray-400 font-bold uppercase text-[11px] tracking-[0.2em] mt-1">Weekly Mission Timeline • Live Sync</p>
          </div>
        </div>

        <div className="flex items-center gap-5">
          {/* Week picker */}
          <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <button onClick={() => setWeekOffset(w => w - 1)} className="w-8 h-8 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 flex items-center justify-center transition-colors">
              <ChevronLeft size={16} className="text-gray-500"/>
            </button>
            <span className="text-sm font-black text-gray-700 min-w-[140px] text-center">{weekLabel}</span>
            <button onClick={() => setWeekOffset(w => w + 1)} className="w-8 h-8 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 flex items-center justify-center transition-colors">
              <ChevronRight size={16} className="text-gray-500"/>
            </button>
          </div>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)} className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 text-xs font-black uppercase tracking-widest border border-indigo-100 hover:bg-indigo-100 transition-colors">
              Today
            </button>
          )}
          <div className="text-right">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Weekly Load</p>
            <p className="text-3xl font-black text-gray-800 italic leading-none">{totalItems} <span className="text-base text-gray-300">Items</span></p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
          {[...Array(7)].map((_,i) => <div key={i} className="h-96 bg-white/20 rounded-3xl animate-pulse"/>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
          {weekDates.map((date, idx) => {
            const isToday = isSameDay(date, today);
            const dayItems = [...schedule[idx]].sort((a, b) => a.time.localeCompare(b.time));
            return (
              <motion.div key={idx} variants={cardEntrance} className="h-full group/col">
                {/* Day header */}
                <div className={`mb-3 p-3 rounded-2xl text-center transition-all ${isToday ? 'bg-emerald-500 shadow-lg shadow-emerald-500/25' : 'bg-white/60 border border-white/40'}`}>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${isToday ? 'text-white/80' : 'text-gray-400'}`}>{DAY_LABELS[date.getDay()]}</p>
                  <p className={`text-2xl font-black italic leading-none mt-0.5 ${isToday ? 'text-white' : 'text-gray-700'}`}>{date.getDate()}</p>
                  {isToday && <p className="text-[8px] font-black text-emerald-200 uppercase tracking-widest mt-0.5">Today</p>}
                </div>

                {/* Items card */}
                <GlassCard className={`min-h-[420px] flex flex-col gap-3 transition-all duration-300 p-4
                  ${isToday ? 'border-emerald-200 bg-emerald-50/30 shadow-lg shadow-emerald-500/5' : 'bg-white/30 border-white/50 group-hover/col:bg-white group-hover/col:shadow-xl'}`}>
                  {dayItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center flex-1 opacity-20 group-hover/col:opacity-40 transition-opacity py-8">
                      <Target size={22} className="mb-2"/>
                      <p className="text-[9px] font-black uppercase tracking-widest">Clear</p>
                    </div>
                  ) : (
                    dayItems.map(item => {
                      const clr = ITEM_COLORS[item.type];
                      return (
                        <div key={item.id} className={`rounded-2xl border border-white p-3 ${clr.bg} ${clr.border} relative overflow-hidden`}>
                          {/* Icon */}
                          <div className={`w-7 h-7 rounded-xl ${clr.icon} flex items-center justify-center mb-2 shadow`}>
                            {item.type === 'task' ? <CheckSquare size={13} className="text-white"/> : <ListTodo size={13} className="text-white"/>}
                          </div>
                          {/* Time */}
                          <p className="text-xs font-black text-gray-500 mb-1 flex items-center gap-1">
                            <Clock size={10}/> {item.time}
                          </p>
                          {/* Title */}
                          <p className="text-[11px] font-black text-gray-800 uppercase leading-snug">{item.title}</p>
                          {/* Meta */}
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">{item.meta}</p>
                        </div>
                      );
                    })
                  )}

                  {dayItems.length > 0 && (
                    <div className="mt-auto pt-2 border-t border-gray-100/50 flex items-center justify-between">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{dayItems.length} item{dayItems.length > 1 ? 's' : ''}</span>
                      <div className="flex gap-1">
                        {dayItems.some(i => i.type === 'task') && <div className="w-2 h-2 rounded-full bg-emerald-400"/>}
                        {dayItems.some(i => i.type === 'todo') && <div className="w-2 h-2 rounded-full bg-teal-400"/>}
                      </div>
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Legend + footer */}
      <div className="flex justify-center items-center gap-8">
        <div className="flex items-center gap-6 px-8 py-3 bg-white/50 border border-white/60 rounded-full backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"/>
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Task</span>
          </div>
          <div className="w-px h-4 bg-gray-200"/>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-teal-500"/>
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">To-Do</span>
          </div>
          <div className="w-px h-4 bg-gray-200"/>
          <ShieldCheck size={14} className="text-indigo-400"/>
          <span className="text-[10px] font-black text-gray-400 italic">Timeline synced with tasks & todos</span>
        </div>
      </div>
    </motion.div>
  );
};

export default StudentTimetable;
