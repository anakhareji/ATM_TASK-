import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Layers, Calendar, User, 
  ShieldCheck, ArrowRight, Target, Zap,
  Briefcase, MessageCircle
} from 'lucide-react';
import API from '../api/axios';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import { staggerContainer, cardEntrance } from '../utils/motionVariants';
import toast from 'react-hot-toast';

const StudentGroups = () => {
  const [groupTasks, setGroupTasks] = useState([]);
  const [groupsByProject, setGroupsByProject] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const tasksRes = await API.get('/tasks/my-tasks');
      const groupOnly = tasksRes.data.filter(t => t.task_type === 'group');
      setGroupTasks(groupOnly);

      const uniqueProjects = [...new Set(groupOnly.map(t => t.project_id))];
      const entries = await Promise.all(
        uniqueProjects.map(async (pid) => {
          try {
            const res = await API.get(`/groups/project/${pid}`);
            return [pid, res.data];
          } catch {
            return [pid, []];
          }
        })
      );
      const map = {};
      entries.forEach(([pid, data]) => { map[pid] = data; });
      setGroupsByProject(map);
    } catch (e) {
      toast.error("Failed to synchronize squad data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-10 pb-20">
      
      {/* Squad Briefing Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-white/40 p-1 rounded-[3.5rem] border border-white/50 backdrop-blur-xl">
        <div className="px-10 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/20">
              <Users size={20} className="text-white" />
            </div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tight italic uppercase">Squad Operations</h1>
          </div>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em]">Collaborative Tactical Units • Active Deployments</p>
        </div>

        <div className="flex items-center gap-6 px-10 pb-8 lg:pb-0">
           <div className="text-right">
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Active Squads</p>
              <p className="text-lg font-black text-gray-800 italic">{groupTasks.length || '0'}<span className="text-xs text-gray-300 ml-1">Units</span></p>
           </div>
           <div className="w-px h-10 bg-gray-200" />
           <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
               <ShieldCheck size={20} className="text-emerald-500" />
           </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-8">
            {[1,2].map(i => <div key={i} className="h-64 bg-white/20 rounded-[3rem] animate-pulse border border-white" />)}
        </div>
      ) : (
        <div className="space-y-10">
          <AnimatePresence>
            {groupTasks.map((task) => {
              const groups = groupsByProject[task.project_id] || [];
              const thisGroup = groups.find(g => g.id === task.group_id);
              
              return (
                <motion.div key={task.id} variants={cardEntrance} layout>
                  <GlassCard className="p-0 overflow-hidden border-white/60 bg-white/40 group">
                    <div className="flex flex-col xl:flex-row">
                      
                      {/* Left Side: Task/Project Intel */}
                      <div className="p-10 xl:w-2/5 bg-gradient-to-br from-white/60 to-transparent border-b xl:border-b-0 xl:border-r border-white/40">
                         <div className="flex items-center justify-between mb-8">
                            <div className="px-4 py-1.5 bg-gray-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                               <Briefcase size={10} /> Project #{task.project_id}
                            </div>
                            <div className="flex items-center gap-2">
                               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                               <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest uppercase">Validated Unit</span>
                            </div>
                         </div>

                         <h3 className="text-3xl font-black text-gray-800 tracking-tight italic uppercase group-hover:text-indigo-600 transition-colors duration-300 mb-4 leading-none">
                            {task.title}
                         </h3>
                         <p className="text-sm font-medium text-gray-500 leading-relaxed max-w-sm mb-8">
                            {task.description || "In-depth tactical collaboration required to fulfill objective parameters."}
                         </p>

                         <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-white/60 rounded-2xl border border-white/80">
                               <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Operational Deadline</p>
                               <div className="flex items-center gap-2 text-gray-700">
                                  <Calendar size={14} className="text-orange-500" />
                                  <span className="text-xs font-black uppercase">{new Date(task.deadline).toLocaleDateString()}</span>
                               </div>
                            </div>
                            <div className="p-4 bg-white/60 rounded-2xl border border-white/80">
                               <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Max Merit Yield</p>
                               <div className="flex items-center gap-2 text-gray-700">
                                  <Target size={14} className="text-emerald-500" />
                                  <span className="text-xs font-black uppercase">{task.max_marks} XP</span>
                               </div>
                            </div>
                         </div>
                      </div>

                      {/* Right Side: Squad Member Intel */}
                      <div className="p-10 flex-1">
                         <div className="flex justify-between items-center mb-8">
                            <div>
                               <h4 className="text-xl font-black text-gray-800 italic uppercase tracking-tight flex items-center gap-3">
                                  <Zap size={20} className="text-indigo-500" /> Squad Roster
                               </h4>
                               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Personnel assigned to this sector</p>
                            </div>
                            <Button 
                               onClick={() => window.location.href = '/dashboard/my-tasks'} 
                               variant="secondary"
                               className="text-[10px] font-black uppercase tracking-widest px-6 py-2.5 rounded-xl border-indigo-100 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50"
                            >
                               Unit Transmissions
                            </Button>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {thisGroup?.members?.length ? (
                              thisGroup.members.map((m, idx) => (
                                <div
                                  key={`${m.student_id}-${idx}`}
                                  className="group/member p-4 rounded-2xl bg-white/40 border border-white/60 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-4">
                                     <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover/member:bg-indigo-500 group-hover/member:text-white transition-colors duration-300">
                                        <User size={20} />
                                     </div>
                                     <div>
                                        <p className="text-sm font-black text-gray-800 uppercase italic">Operative #{m.student_id}</p>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rank: Field Agent</p>
                                     </div>
                                  </div>
                                  <div className="opacity-0 group-hover/member:opacity-100 transition-opacity">
                                      <MessageCircle size={16} className="text-indigo-400" />
                                  </div>
                                </div>
                              ))
                            ) : (
                               <div className="col-span-full py-16 bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center">
                                  <ShieldCheck size={32} className="text-gray-200 mb-2" />
                                  <p className="text-xs font-black text-gray-300 uppercase tracking-[0.2em]">Personnel Records Restricted</p>
                               </div>
                            )}
                         </div>

                         <div className="mt-8 p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100 border-dashed flex items-center justify-between">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                                  <ShieldCheck size={18} />
                                </div>
                                <div className="text-left">
                                   <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-0.5">Tactical Alignment</p>
                                   <p className="text-xs font-bold text-emerald-800">Squad synchronized for project implementation.</p>
                                </div>
                            </div>
                            <ArrowRight size={20} className="text-emerald-300" />
                         </div>
                      </div>

                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {groupTasks.length === 0 && (
            <div className="py-40 rounded-[4rem] bg-white/40 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center backdrop-blur-sm grayscale opacity-60">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                    <Users size={48} className="text-gray-300" />
                </div>
                <h3 className="text-2xl font-black text-gray-400 uppercase tracking-tighter italic">Zero Squad Assignments</h3>
                <p className="text-sm font-bold text-gray-300 uppercase tracking-widest mt-2">Active standalone operative status confirmed</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default StudentGroups;
