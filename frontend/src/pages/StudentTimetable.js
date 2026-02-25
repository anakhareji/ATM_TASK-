import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, CheckSquare, ListTodo } from 'lucide-react';
import API from '../api/axios';
import GlassCard from '../components/ui/GlassCard';
import { staggerContainer, cardEntrance } from '../utils/motionVariants';

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
      console.error(e);
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
        type: 'task',
        title: t.title,
        time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        meta: `Max ${t.max_marks} • ${t.task_type}`,
      });
    });
    todos.forEach(td => {
      const d = new Date(td.due_date);
      map[d.getDay()].push({
        type: 'todo',
        title: td.title,
        time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        meta: td.status,
      });
    });
    return map;
  }, [tasks, todos]);

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">Weekly Timetable</h1>
          <p className="text-gray-500 font-medium">Organize study plan across the week</p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 animate-pulse text-emerald-600 font-bold">Building timetable...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
          {days.map((label, idx) => (
            <motion.div key={label} variants={cardEntrance}>
              <GlassCard className="h-full">
                <div className="flex items-center gap-2 mb-4">
                  <CalendarDays size={18} className="text-emerald-600" />
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest">{label}</h3>
                </div>
                <div className="space-y-3">
                  {schedule[idx].length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No items</p>
                  ) : (
                    schedule[idx]
                      .sort((a, b) => a.time.localeCompare(b.time))
                      .map((item, i) => (
                        <div
                          key={`${label}-${i}`}
                          className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-3"
                        >
                          <span className={`p-2 rounded-2xl ${item.type === 'task' ? 'bg-emerald-50 text-emerald-600' : 'bg-teal-50 text-teal-600'}`}>
                            {item.type === 'task' ? <CheckSquare size={16} /> : <ListTodo size={16} />}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-800 truncate">{item.title}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.meta}</p>
                          </div>
                          <p className="text-xs font-bold text-gray-600">{item.time}</p>
                        </div>
                      ))
                  )}
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default StudentTimetable;
