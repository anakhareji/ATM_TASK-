import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Layers, Calendar, User, 
  ShieldCheck, ArrowRight, Target, Zap,
  Briefcase, MessageCircle, Star, Info
} from 'lucide-react';
import API from '../api/axios';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import { staggerContainer, cardEntrance } from '../utils/motionVariants';
import toast from 'react-hot-toast';

const StudentGroups = () => {
  const [squads, setSquads] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchSquads = async () => {
    setLoading(true);
    try {
      const res = await API.get('/groups/my-groups');
      setSquads(res.data || []);
    } catch (e) {
      toast.error("Failed to synchronize squad records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSquads();
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
              <p className="text-lg font-black text-gray-800 italic">{squads.length || '0'}<span className="text-xs text-gray-300 ml-1">Units</span></p>
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
          <AnimatePresence mode="popLayout">
            {squads.map((squad) => (
              <motion.div 
                key={squad.id} 
                variants={cardEntrance} 
                initial="hidden"
                animate="visible"
                exit="hidden"
                layout
              >
                <GlassCard className="p-0 overflow-hidden border-white/60 bg-white/40 group">
                  <div className="flex flex-col xl:flex-row">
                    
                    {/* Left Side: Project Intel */}
                    <div className="p-10 xl:w-2/5 bg-gradient-to-br from-white/60 to-transparent border-b xl:border-b-0 xl:border-r border-white/40">
                       <div className="flex items-center justify-between mb-8">
                          <div className="px-4 py-1.5 bg-gray-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-gray-200">
                             <Briefcase size={10} /> Track #{squad.project_id || '??'}
                          </div>
                          <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                             <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">{squad.status || 'Active Deployment'}</span>
                          </div>
                       </div>

                       <h3 className="text-3xl font-black text-gray-800 tracking-tight italic uppercase group-hover:text-indigo-600 transition-colors duration-300 mb-4 leading-none lowercase first-letter:uppercase">
                          {squad.name || "Unnamed Squadron"}
                       </h3>
                       <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2 opacity-60">Objective Track</p>
                       <p className="text-lg font-black text-gray-700 leading-tight mb-4 italic uppercase">
                          {squad.project_title || "Unknown Academic Objective"}
                       </p>
                       <p className="text-sm font-medium text-gray-500 leading-relaxed max-w-sm mb-8 line-clamp-3">
                          {squad.project_description || "Detailed project specifications are currently being synchronized with mission parameters."}
                       </p>

                       <div className="p-6 bg-white/60 rounded-[2rem] border border-white/80 shadow-inner">
                          <div className="flex items-center gap-3 mb-1">
                             <Target size={14} className="text-indigo-400" />
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Squad Identification</p>
                          </div>
                          <p className="text-xs font-bold text-gray-600 indent-6">ID: {squad.id.toString().padStart(4, '0')} // Sector: Gamma-9</p>
                       </div>
                    </div>

                    {/* Right Side: Squad Member Intel */}
                    <div className="p-10 flex-1 flex flex-col">
                       <div className="flex justify-between items-center mb-10">
                          <div>
                             <h4 className="text-2xl font-black text-gray-800 italic uppercase tracking-tight flex items-center gap-3">
                                <Zap size={24} className="text-indigo-500" /> Personnel Roster
                             </h4>
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 ml-9">Authorized operatives in this deployment</p>
                          </div>
                          <div className="px-5 py-2 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-3">
                             <Users size={16} className="text-indigo-500" />
                             <span className="text-xs font-black text-indigo-700">{squad.members.length} Members</span>
                          </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                          {squad.members.map((m) => (
                            <div
                              key={m.student_id}
                              className={`group/member p-6 rounded-[2rem] border transition-all duration-500 flex items-center justify-between ${
                                m.is_leader 
                                ? 'bg-indigo-600 text-white border-indigo-500 shadow-xl shadow-indigo-100' 
                                : 'bg-white/40 border-white/60 hover:bg-white hover:shadow-xl hover:shadow-gray-200/50 text-gray-800'
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg transition-colors duration-300 ${
                                   m.is_leader 
                                   ? 'bg-white/20 text-white' 
                                   : 'bg-indigo-50 text-indigo-500 group-hover/member:bg-indigo-500 group-hover/member:text-white'
                                 }`}>
                                    {(m.name || "").split(' ').filter(Boolean).map(n=>n[0]).join('') || '?'}
                                 </div>
                                 <div className="text-left">
                                    <div className="flex items-center gap-2">
                                       <p className={`text-sm font-black uppercase italic ${m.is_leader ? 'text-white' : 'text-gray-800'}`}>
                                          {m.name || `Operative #${m.student_id}`}
                                       </p>
                                       {m.is_leader && <Star size={12} className="text-yellow-400 fill-yellow-400" />}
                                    </div>
                                    <p className={`text-[10px] font-black uppercase tracking-widest ${m.is_leader ? 'text-indigo-100' : 'text-gray-400'}`}>
                                       {m.is_leader ? 'Commissioned Leader' : 'Mission Specialist'}
                                    </p>
                                    {!m.is_leader && <p className="text-[8px] font-bold text-gray-300 lowercase mt-0.5">{m.email}</p>}
                                 </div>
                              </div>
                              <div className={`transition-opacity ${m.is_leader ? 'opacity-100' : 'opacity-0 group-hover/member:opacity-100'}`}>
                                  <div className={`p-2 rounded-lg ${m.is_leader ? 'bg-white/10' : 'bg-gray-50'}`}>
                                      <Info size={14} className={m.is_leader ? 'text-white/60' : 'text-gray-400'} />
                                  </div>
                              </div>
                            </div>
                          ))}
                       </div>

                       <div className="mt-10 p-6 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm flex items-center justify-between group/status">
                          <div className="flex items-center gap-6">
                             <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                <ShieldCheck size={24} />
                             </div>
                             <div className="text-left">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Operational Readiness</p>
                                <p className="text-sm font-black text-gray-700 uppercase italic">Squad status: Optimal & Synchronized</p>
                             </div>
                          </div>
                          <Button 
                             onClick={() => window.location.href = '/dashboard/tasks'} 
                             className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 rounded-2xl flex items-center gap-3 transition-all duration-300 group-hover/status:gap-5"
                          >
                             <span className="font-black text-[10px] uppercase tracking-widest text-left">View Missions</span>
                             <ArrowRight size={18} />
                          </Button>
                       </div>
                    </div>

                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>

          {squads.length === 0 && (
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
