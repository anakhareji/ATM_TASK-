import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, ShieldCheck, Mail, Trash2, 
  Clock, CheckCircle, Info, AlertTriangle,
  Radio, Zap
} from "lucide-react";
import API from "../api/axios";
import AdminNotifications from "./AdminNotifications";
import GlassCard from "../components/ui/GlassCard";
import Button from "../components/ui/Button";
import { staggerContainer, cardEntrance } from "../utils/motionVariants";
import toast from "react-hot-toast";

const Notifications = () => {
  const role = localStorage.getItem("userRole");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await API.get("/notifications");
      setItems(res.data);
    } catch (e) {
      toast.error("Transmission synchronization failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role !== "admin") {
      fetchItems();
    }
  }, [role]);

  const markRead = async (id) => {
    try {
      await API.patch(`/notifications/${id}/read`);
      fetchItems();
    } catch {
      toast.error("Failed to update status protocol.");
    }
  };

  const deleteNotification = async (id) => {
    const loadToast = toast.loading("Executing dismissal protocol...");
    try {
      await API.delete(`/notifications/${id}`);
      toast.success("Transmission Dismissed.", { id: loadToast });
      fetchItems();
    } catch {
      toast.error("Dismissal protocol failed.", { id: loadToast });
    }
  };

  if (role === 'admin') {
    return <AdminNotifications />;
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-10 pb-20">
      
      {/* Secure Feed Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-white/40 p-1 rounded-[3.5rem] border border-white/50 backdrop-blur-xl">
        <div className="px-10 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/20">
              <Radio size={20} className="text-white" />
            </div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tight italic uppercase">Secure Transmissions</h1>
          </div>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em]">Encrypted Data Stream • Active Personnel Notifications</p>
        </div>

        <div className="flex items-center gap-6 px-10 pb-8 lg:pb-0">
           <div className="text-right">
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Unread Protocol</p>
              <p className="text-lg font-black text-gray-800 italic">{items.filter(i => !i.is_read).length || '0'}<span className="text-xs text-gray-300 ml-1">Alerts</span></p>
           </div>
           <div className="w-px h-10 bg-gray-200" />
           <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
               <ShieldCheck size={20} className="text-emerald-500" />
           </div>
        </div>
      </div>

      <div className="space-y-6 max-w-5xl mx-auto">
        {loading ? (
             <div className="h-40 bg-white/20 rounded-[2.5rem] animate-pulse" />
        ) : (
          <AnimatePresence>
            {items.map((n) => (
              <motion.div key={n.id} variants={cardEntrance} layout>
                <GlassCard className={`p-8 border-white/60 bg-white/40 group hover:bg-white hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-300 overflow-hidden relative ${!n.is_read ? 'border-l-4 border-l-emerald-500 bg-emerald-50/20 shadow-emerald-500/10 shadow-lg' : ''}`}>
                  
                  <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                    <div className="flex items-center gap-6 text-center md:text-left">
                       <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-300 ${
                         !n.is_read ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20' : 'bg-gray-50 text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-500'
                       }`}>
                          {!n.is_read ? <Zap size={30} className="animate-pulse" /> : <Mail size={30} />}
                       </div>
                       <div>
                          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                             <h3 className={`text-xl font-black italic tracking-tight uppercase ${!n.is_read ? 'text-gray-900 font-black' : 'text-gray-600 font-bold'}`}>
                               {n.title || 'Inbound Intelligence'}
                             </h3>
                             {!n.is_read && (
                                <span className="px-3 py-1 bg-emerald-500 text-white rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 italic">
                                   Urgent Ops
                                </span>
                             )}
                          </div>
                          <p className={`text-sm leading-relaxed max-w-2xl ${!n.is_read ? 'text-gray-800 font-bold' : 'text-gray-500 font-medium'}`}>
                             {n.message}
                          </p>
                          <div className="flex items-center justify-center md:justify-start gap-4 mt-4">
                             <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <Clock size={12} className="text-orange-500" />
                                <span>Detected: {new Date(n.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}</span>
                             </div>
                             <div className="w-px h-3 bg-gray-200" />
                             <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <Info size={12} className="text-indigo-500" />
                                <span>Ref Code: TR-{n.id.toString().padStart(4, '0')}</span>
                             </div>
                          </div>
                       </div>
                    </div>
                    
                    <div className="flex flex-row md:flex-col gap-3 shrink-0">
                      {!n.is_read && (
                        <button 
                           onClick={() => markRead(n.id)}
                           className="flex items-center justify-center w-40 py-3 rounded-2xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:shadow-xl hover:shadow-emerald-500/20 active:scale-95 transition-all gap-2"
                        >
                           <CheckCircle size={14} /> Validate Intel
                        </button>
                      )}
                      <button 
                         onClick={() => deleteNotification(n.id)}
                         className="flex items-center justify-center w-40 py-3 rounded-2xl bg-white border border-gray-100 text-gray-400 text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 hover:shadow-xl hover:shadow-rose-500/10 active:scale-95 transition-all gap-2"
                      >
                         <Trash2 size={14} /> Purge Record
                      </button>
                    </div>
                  </div>

                  {/* Glass decorative element */}
                  <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-indigo-500/5 rounded-full blur-[60px] pointer-events-none group-hover:bg-indigo-500/10 transition-all duration-700" />
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {!loading && items.length === 0 && (
          <div className="py-40 rounded-[4rem] bg-white/40 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center backdrop-blur-sm grayscale opacity-60">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                  <Mail size={48} className="text-gray-300" />
              </div>
              <h3 className="text-2xl font-black text-gray-400 uppercase tracking-tighter italic">No Active Transmissions</h3>
              <p className="text-sm font-bold text-gray-300 uppercase tracking-widest mt-2">Personal data stream clear • Awaiting new directives</p>
          </div>
        )}
      </div>

      <div className="flex justify-center pt-8">
         <div className="flex items-center gap-4 p-2 bg-white/40 border border-white/60 rounded-full backdrop-blur-xl px-10 group cursor-help hover:bg-white60 transition-all">
            <Radio size={16} className="text-emerald-500 animate-pulse" />
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] italic">Encrypted Secure Line Established With Central Command</p>
         </div>
      </div>
    </motion.div>
  );
};

export default Notifications;
