import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, Award, Clock, 
  MessageSquare, Star, TrendingUp, Users, Zap,
  ChevronRight, Target,
  GraduationCap, ClipboardList, BookOpen, User
} from 'lucide-react';
import API from '../api/axios';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import Counter from '../components/ui/Counter';
import { staggerContainer, cardEntrance } from '../utils/motionVariants';
import toast from 'react-hot-toast';

const StudentDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const userName = localStorage.getItem('userName') || 'Operative';

  const fetchDashboardData = async () => {
    try {
      const res = await API.get('/dashboard/student');
      setData(res.data);
    } catch (e) {
      toast.error("Failed to establish secure data link.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse p-4">
        <div className="h-32 bg-white/20 rounded-[3rem]" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-40 bg-white/10 rounded-3xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 h-[500px] bg-white/10 rounded-[3.5rem]" />
           <div className="h-[500px] bg-white/10 rounded-[3.5rem]" />
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-10 pb-20">
      
      {/* Premium Greeting Header */}
      <div className="relative overflow-hidden bg-white/40 p-1 rounded-[3.5rem] border border-white/60 backdrop-blur-2xl shadow-2xl shadow-emerald-500/5">
        <div className="px-12 py-10 flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
           <div>
              <div className="flex items-center gap-3 mb-2 opacity-60">
                 <Zap size={14} className="text-emerald-500 fill-emerald-500" />
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Academic Uplink Active</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tight flex items-baseline gap-4 italic underline-offset-8">
                 Welcome Back, <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 uppercase">{userName.split(' ')[0]}</span>
              </h1>
              <div className="flex items-center gap-6 mt-4">
                 <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                    <GraduationCap size={16} className="text-emerald-600" />
                    <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">{data?.course_name || "Unassigned Track"}</span>
                 </div>
                 <div className="flex items-center gap-2 px-4 py-2 bg-teal-500/10 border border-teal-500/20 rounded-full">
                    <BookOpen size={16} className="text-teal-600" />
                    <span className="text-xs font-black text-teal-700 uppercase tracking-widest">Semester {data?.current_semester || "N/A"}</span>
                 </div>
              </div>
           </div>

           <div className="flex items-center gap-6">
              <div className="text-right hidden lg:block">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Global Standing</p>
                 <div className="flex items-center gap-2 justify-end">
                    <div className="flex -space-x-2">
                       {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[8px] font-black text-white">#{i}</div>)}
                    </div>
                    <span className="text-xs font-black text-emerald-600 uppercase">Top 10%</span>
                 </div>
              </div>
              <div className="w-px h-12 bg-gray-200 hidden lg:block mx-4" />
              <div className="flex flex-col items-center">
                 <div className="relative">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 rotate-12 absolute -inset-1 blur-lg opacity-40 animate-pulse" />
                    <div className="w-20 h-20 rounded-[1.5rem] bg-white flex flex-col items-center justify-center border border-emerald-100 shadow-xl relative z-10">
                       <span className="text-[10px] font-black text-emerald-500 uppercase leading-none mb-1">XP</span>
                       <span className="text-3xl font-black text-gray-800 leading-none">{data?.final_score || 0}</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-emerald-500/5 to-transparent -z-10" />
      </div>

      {/* KPI Stats Suite */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <KPICard 
             title="Academic GPA" 
             value={data?.cgpa || 0} 
             subtext="Measured platform index" 
             icon={TrendingUp} 
             color="text-emerald-500" 
             bg="bg-emerald-500/10" 
             badge={data?.grade || "N/A"}
         />
         <KPICard 
             title="Quest Completion" 
             value={data?.completion_rate ? `${data.completion_rate}%` : '0%'} 
             subtext={`Pending: ${data?.pending_todos || 0} Objectives`} 
             icon={Target} 
             color="text-indigo-500" 
             bg="bg-indigo-500/10" 
         />
         <KPICard 
             title="Submissions" 
             value={data?.completed_todos || 0} 
             subtext="Validated transmissions" 
             icon={ClipboardList} 
             color="text-cyan-500" 
             bg="bg-cyan-500/10" 
         />
         <KPICard 
             title="Global XP" 
             value={data?.final_score || 0} 
             subtext="Total merit points" 
             icon={Star} 
             color="text-amber-500" 
             bg="bg-amber-500/10" 
         />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         
         {/* Live Objectives Feed */}
         <GlassCard className="lg:col-span-2 border-white/50 relative overflow-hidden">
            <div className="flex justify-between items-center mb-10">
               <div>
                  <h3 className="text-2xl font-black text-gray-800 tracking-tight uppercase italic flex items-center gap-3">
                     <ClipboardList className="text-emerald-500" /> Upcoming Briefings
                  </h3>
                  <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">Next 7 days operational timeline</p>
               </div>
               <Button variant="secondary" onClick={() => window.location.href='/dashboard/tasks'} className="rounded-2xl text-[10px] font-black uppercase tracking-widest">Access All</Button>
            </div>

            <div className="space-y-4">
              {data?.upcoming_tasks?.length > 0 ? (
                data.upcoming_tasks.map((task, idx) => (
                  <motion.div 
                    key={task.id} 
                    variants={cardEntrance} 
                    transition={{ delay: idx * 0.1 }}
                    className="group p-6 bg-white/50 border border-gray-100/50 rounded-[2rem] hover:bg-white hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 flex items-center justify-between"
                  >
                     <div className="flex items-center gap-5">
                        <div className={`p-4 rounded-2xl bg-gray-50 group-hover:bg-emerald-50 transition-colors`}>
                           {task.task_type === 'group' ? <Users className="text-emerald-500" size={20} /> : <User className="text-emerald-500" size={20} />}
                        </div>
                        <div>
                           <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-black text-gray-800 uppercase italic tracking-tight group-hover:text-emerald-600 transition-colors">{task.title}</h4>
                              <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-[0.2em] ${
                                task.priority === 'High' ? 'bg-rose-100 text-rose-600' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {task.priority}
                              </span>
                           </div>
                           <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400">
                              <span className="flex items-center gap-1"><Clock size={12} /> {task.countdown}</span>
                              <span className="opacity-30">•</span>
                              <span className="flex items-center gap-1 uppercase tracking-widest">{new Date(task.deadline).toLocaleDateString()}</span>
                           </div>
                        </div>
                     </div>
                     <ChevronRight size={20} className="text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                  </motion.div>
                ))
              ) : (
                <div className="py-20 flex flex-col items-center opacity-30">
                   <Target size={48} className="mb-4" />
                   <p className="text-sm font-black uppercase tracking-[0.2em]">Zero Impeding Threats Found</p>
                </div>
              )}
            </div>
         </GlassCard>

         {/* Right Sidebar: Quick Intel */}
         <div className="space-y-10">
            
            {/* Intel Feedback Loop */}
            <GlassCard className="bg-emerald-600 border-none shadow-2xl shadow-emerald-600/20 text-white relative h-full">
               <div className="relative z-10 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-8">
                       <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                          <MessageSquare size={20} className="text-white" />
                       </div>
                       <h3 className="text-xl font-black uppercase italic tracking-tight">Recent debriefs</h3>
                    </div>

                    <div className="space-y-6">
                       {data?.recent_feedback?.length > 0 ? (
                         data.recent_feedback.map((f, idx) => (
                           <div key={idx} className="bg-white/10 backdrop-blur-md p-5 rounded-[1.5rem] border border-white/10 hover:bg-white/20 transition-all">
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200 mb-2">{f.title}</p>
                              <p className="text-sm font-medium leading-relaxed italic line-clamp-2">"{f.feedback}"</p>
                              <p className="mt-4 text-[9px] font-black text-white/50 uppercase tracking-[0.2em] flex items-center gap-2">
                                 <User size={10} /> Faculty Protocol #{f.faculty_id}
                              </p>
                           </div>
                         ))
                       ) : (
                         <p className="text-sm font-bold text-white/50 py-10 text-center uppercase tracking-widest italic">No recent intel files</p>
                       )}
                    </div>
                  </div>
                  
                  <Button className="w-full mt-10 bg-white text-emerald-700 hover:bg-emerald-50 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl" onClick={() => window.location.href='/dashboard/tasks'}>
                      Review All Feedback
                  </Button>
               </div>
               {/* Pattern */}
               <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none overflow-hidden">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-white rounded-full scale-150 rotate-45" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border border-white/30 rounded-full scale-110" />
               </div>
            </GlassCard>

         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* Achievement suite */}
          <GlassCard className="border-emerald-100 flex flex-col">
              <div className="mb-8">
                  <h3 className="text-xl font-black text-gray-800 uppercase italic tracking-tight flex items-center gap-3">
                      <Award size={24} className="text-amber-500" /> Honor Roll
                  </h3>
              </div>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {data?.achievements?.map((ach, idx) => (
                    <div key={idx} className="p-6 bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-[2rem] flex flex-col items-center text-center group hover:bg-emerald-50 hover:border-emerald-100 transition-all">
                        <div className={`w-16 h-16 rounded-[1.25rem] bg-${ach.badge === 'emerald' ? 'emerald' : 'teal'}-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                            <Zap className={`text-${ach.badge === 'emerald' ? 'emerald' : 'teal'}-600`} size={28} />
                        </div>
                        <h4 className="text-sm font-black text-gray-800 uppercase tracking-tight mb-2 underline underline-offset-4 decoration-emerald-200">{ach.title}</h4>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Achieved • Verification ID: {Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
                    </div>
                  ))}
                  {!data?.achievements?.length && (
                    <div className="col-span-full py-10 flex flex-col items-center opacity-30 grayscale italic justify-center">
                        <Award size={40} className="mb-2" />
                        <p className="text-xs font-black uppercase tracking-widest">Awaiting Merit Recognition</p>
                    </div>
                  )}
              </div>
          </GlassCard>

          {/* Group Activity Stream */}
          <GlassCard className="border-white/50">
             <div className="flex justify-between items-center mb-10">
               <h3 className="text-xl font-black text-gray-800 uppercase italic tracking-tight flex items-center gap-3">
                  <Users size={24} className="text-indigo-500" /> Squad Operations
               </h3>
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Active Channels</span>
               </div>
             </div>

             <div className="space-y-6">
               {data?.group_activity?.length > 0 ? (
                 data.group_activity.map((group, idx) => (
                   <div key={idx} className="p-6 rounded-[2rem] bg-indigo-50/50 border border-indigo-100 hover:bg-white transition-all group/squad">
                      <div className="flex justify-between items-start mb-4">
                         <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-indigo-100 text-indigo-600">
                               <span className="font-black text-lg">{group.group_name.charAt(0)}</span>
                            </div>
                            <div>
                               <h4 className="font-black text-gray-800 uppercase italic leading-none mb-1 group-hover/squad:text-indigo-600 transition-colors">{group.group_name}</h4>
                               <p className="text-[10px] font-black text-indigo-400 tracking-[0.2em] uppercase">{group.member_count} Operatives In-Sync</p>
                            </div>
                         </div>
                      </div>
                      <div className="space-y-3">
                         {group.recent_updates.map((upd, uidx) => (
                           <div key={uidx} className="flex items-center justify-between bg-white/60 p-3 rounded-xl border border-indigo-100/50">
                              <span className="text-[10px] font-bold text-gray-600 uppercase">Phase {upd.task_id} Deployment</span>
                              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-100 px-2 py-0.5 rounded-full">{upd.status}</span>
                           </div>
                         ))}
                         {!group.recent_updates.length && <p className="text-[10px] text-gray-400 italic">Static channel - No recent broadcasts</p>}
                      </div>
                   </div>
                 ))
               ) : (
                <div className="py-20 flex flex-col items-center opacity-30 justify-center">
                    <Users size={40} className="mb-2" />
                    <p className="text-xs font-black uppercase tracking-widest">No Active Squad Assignments</p>
                </div>
               )}
             </div>
          </GlassCard>

      </div>
    </motion.div>
  );
};

const KPICard = ({ title, value, subtext, icon: Icon, color, bg, badge }) => (
  <motion.div variants={cardEntrance} whileHover={{ y: -5 }} className="h-full relative">
    <GlassCard className="h-full flex flex-col justify-between py-8 border-white/50">
      <div className="flex justify-between items-start mb-6">
        <div className={`p-4 rounded-2xl ${bg} ${color} shadow-lg shadow-gray-200/5`}>
          <Icon size={24} />
        </div>
        {badge && (
          <div className="bg-emerald-600 text-white px-3 py-1 rounded-xl text-xs font-black shadow-lg shadow-emerald-600/20 uppercase tracking-widest">
            {badge}
          </div>
        )}
      </div>
      <div>
        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] mb-1">{title}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-4xl font-black text-gray-800 tracking-tighter italic">
            <Counter value={value} />
          </h3>
        </div>
        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-3 opacity-60">Status: {subtext}</p>
      </div>
    </GlassCard>
  </motion.div>
);

export default StudentDashboard;
