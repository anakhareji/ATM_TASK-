import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, ShieldCheck, Mail, Radio, Zap, Clock, Info, X,
  CheckCircle, Calendar, AlertTriangle, Tag
} from "lucide-react";
import API from "../api/axios";
import AdminNotifications from "./AdminNotifications";
import { staggerContainer, cardEntrance } from "../utils/motionVariants";

// Type → icon / color map
const TYPE_META = {
  event:   { icon: Calendar,      color: "bg-emerald-500", light: "bg-emerald-50  text-emerald-700", label: "Event"  },
  task:    { icon: CheckCircle,   color: "bg-indigo-500",  light: "bg-indigo-50   text-indigo-700",  label: "Task"   },
  group:   { icon: Tag,           color: "bg-purple-500",  light: "bg-purple-50   text-purple-700",  label: "Group"  },
  alert:   { icon: AlertTriangle, color: "bg-amber-500",   light: "bg-amber-50    text-amber-700",   label: "Alert"  },
  default: { icon: Zap,           color: "bg-gray-500",    light: "bg-gray-100    text-gray-600",    label: "Notice" },
};
const getMeta = (type) => TYPE_META[type] || TYPE_META.default;

// ─── Main ─────────────────────────────────────────────────────────────────────
const Notifications = () => {
  const role = localStorage.getItem("userRole");
  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [selected, setSelected] = useState(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await API.get("/notifications");
      setItems(res.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { if (role !== "admin") fetchItems(); }, [role]);

  const openDetail = async (n) => {
    setSelected(n);
    if (!n.is_read) {
      try {
        await API.patch(`/notifications/${n.id}/read`);
        setItems(prev => prev.map(item => item.id === n.id ? { ...item, is_read: true } : item));
        window.dispatchEvent(new CustomEvent("notificationRead"));
      } catch { /* silent */ }
    }
  };

  const closeDetail = () => setSelected(null);

  if (role === "admin") return <AdminNotifications />;

  const unread = items.filter(i => !i.is_read).length;
  const read   = items.filter(i =>  i.is_read).length;
  const total  = items.length;

  const typeCounts = items.reduce((acc, n) => {
    const t = n.type || "default";
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  const latestUnread = items.filter(i => !i.is_read).slice(0, 3);

  return (
    <>
      <motion.div
        variants={staggerContainer} initial="hidden" animate="visible"
        className="space-y-8 pb-20 w-full"
      >
        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6
                        bg-white/60 backdrop-blur-2xl border border-white/40 rounded-3xl px-10 py-7 shadow-sm w-full">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-xl shadow-indigo-500/30">
              <Radio size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-gray-800 tracking-tight italic uppercase leading-none">
                Secure Transmissions
              </h1>
              <p className="text-gray-400 font-bold uppercase text-[11px] tracking-[0.2em] mt-1">
                Encrypted Data Stream • Active Personnel Notifications
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Unread Protocol</p>
              <p className="text-4xl font-black text-gray-800 italic leading-none">
                {unread} <span className="text-base text-gray-300">Alerts</span>
              </p>
            </div>
            <div className="w-px h-14 bg-gray-200" />
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-center">
              <ShieldCheck size={26} className="text-emerald-500" />
            </div>
          </div>
        </div>

        {/* ── Summary Panel ─────────────────────────────────────────────── */}
        {!loading && total > 0 && (
          <div className="w-full bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl p-8 shadow-sm">

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              {/* Total */}
              <div className="flex items-center gap-5 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="w-16 h-16 rounded-2xl bg-gray-200 flex items-center justify-center shrink-0">
                  <Bell size={28} className="text-gray-500" />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Total</p>
                  <p className="text-5xl font-black text-gray-800 leading-none">{total}</p>
                </div>
              </div>
              {/* Unread */}
              <div className="flex items-center gap-5 p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/25">
                  <Zap size={28} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-1">Unread</p>
                  <p className="text-5xl font-black text-emerald-700 leading-none">{unread}</p>
                </div>
              </div>
              {/* Read */}
              <div className="flex items-center gap-5 p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/25">
                  <CheckCircle size={28} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-1">Read</p>
                  <p className="text-5xl font-black text-indigo-700 leading-none">{read}</p>
                </div>
              </div>
            </div>

            {/* Category breakdown + latest unread */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Category bars */}
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">By Category</p>
                <div className="space-y-4">
                  {Object.entries(typeCounts).map(([type, count]) => {
                    const meta  = getMeta(type);
                    const pct   = Math.round((count / total) * 100);
                    const IconC = meta.icon;
                    return (
                      <div key={type} className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.color}`}>
                          <IconC size={18} className="text-white" />
                        </div>
                        <span className="text-sm font-black text-gray-600 uppercase tracking-widest w-16 shrink-0">{meta.label}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${meta.color} transition-all duration-700`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-sm font-black text-gray-600 w-6 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Latest unread */}
              {latestUnread.length > 0 && (
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Latest Unread</p>
                  <div className="space-y-3">
                    {latestUnread.map(n => {
                      const meta  = getMeta(n.type);
                      const IconC = meta.icon;
                      return (
                        <div
                          key={n.id}
                          onClick={() => openDetail(n)}
                          className="flex items-start gap-4 p-4 bg-gray-50 hover:bg-white rounded-2xl border border-gray-100 hover:border-emerald-200 hover:shadow-md cursor-pointer transition-all duration-200"
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.color}`}>
                            <IconC size={18} className="text-white" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-black text-gray-800 truncate">{n.title || "Notification"}</p>
                            <p className="text-xs text-gray-500 font-medium truncate mt-0.5">{n.message}</p>
                          </div>
                          <span className={`mt-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase shrink-0 ${meta.light}`}>
                            {meta.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Notification List ─────────────────────────────────────────── */}
        <div className="space-y-4 w-full">
          {loading ? (
            <div className="h-40 bg-white/20 rounded-3xl animate-pulse" />
          ) : (
            <AnimatePresence>
              {items.map((n) => {
                const meta     = getMeta(n.type);
                const IconComp = meta.icon;
                return (
                  <motion.div
                    key={n.id}
                    variants={cardEntrance}
                    initial="hidden" animate="visible" exit="hidden"
                    layout
                    onClick={() => openDetail(n)}
                    className={`cursor-pointer rounded-3xl border transition-all duration-300
                      hover:shadow-2xl hover:scale-[1.005] overflow-hidden relative w-full
                      ${!n.is_read
                        ? "bg-white border-l-4 border-l-emerald-500 shadow-lg shadow-emerald-500/10"
                        : "bg-white/70 border-white/60 hover:bg-white"
                      }`}
                  >
                    <div className="flex items-center gap-7 p-7 relative z-10">
                      {/* Icon */}
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0
                        ${!n.is_read ? `${meta.color} text-white shadow-xl` : "bg-gray-100 text-gray-400"}`}>
                        <IconComp size={28} className={!n.is_read ? "animate-pulse" : ""} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-1.5">
                          <h3 className={`text-lg font-black italic uppercase ${!n.is_read ? "text-gray-900" : "text-gray-500"}`}>
                            {n.title || "Inbound Intelligence"}
                          </h3>
                          {!n.is_read && (
                            <span className="px-3 py-1 bg-emerald-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest shrink-0">
                              Unread
                            </span>
                          )}
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shrink-0 ${meta.light}`}>
                            {meta.label}
                          </span>
                        </div>
                        <p className={`text-base leading-relaxed line-clamp-2 ${!n.is_read ? "text-gray-700 font-semibold" : "text-gray-400 font-medium"}`}>
                          {n.message}
                        </p>
                        <div className="flex items-center gap-3 mt-3">
                          <span className="flex items-center gap-1.5 text-xs font-black text-gray-400 uppercase tracking-widest">
                            <Clock size={12} className="text-orange-400" />
                            {new Date(n.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span className="w-px h-4 bg-gray-200" />
                          <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                            Ref: TR-{n.id.toString().padStart(4, "0")}
                          </span>
                        </div>
                      </div>

                      {/* Tap hint */}
                      <div className="shrink-0 text-gray-300">
                        <Info size={22} />
                      </div>
                    </div>

                    {!n.is_read && (
                      <div className="absolute top-0 right-0 -mr-10 -mt-10 w-48 h-48 bg-emerald-400/10 rounded-full blur-[80px] pointer-events-none" />
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}

          {!loading && items.length === 0 && (
            <div className="py-48 rounded-3xl bg-white/40 border-2 border-dashed border-gray-200 flex flex-col items-center text-center">
              <div className="w-28 h-28 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <Mail size={56} className="text-gray-200" />
              </div>
              <h3 className="text-3xl font-black text-gray-400 uppercase tracking-tighter italic">No Active Transmissions</h3>
              <p className="text-base font-bold text-gray-300 uppercase tracking-widest mt-3">Personal data stream clear • Awaiting new directives</p>
            </div>
          )}
        </div>

        {/* footer */}
        <div className="flex justify-center pt-4">
          <div className="flex items-center gap-4 px-10 py-3 bg-white/40 border border-white/60 rounded-full backdrop-blur-xl">
            <Radio size={16} className="text-emerald-500 animate-pulse" />
            <p className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] italic">
              Encrypted Secure Line Established With Central Command
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Detail Modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selected && (
          <NotificationDetailModal notification={selected} onClose={closeDetail} />
        )}
      </AnimatePresence>
    </>
  );
};

// ─── Detail Modal ─────────────────────────────────────────────────────────────
const NotificationDetailModal = ({ notification: n, onClose }) => {
  const meta     = getMeta(n.type);
  const IconComp = meta.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 24 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Colour header */}
        <div className={`${meta.color} p-7 flex items-center justify-between`}>
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
              <IconComp size={30} className="text-white" />
            </div>
            <div>
              <p className="text-white/70 text-xs font-black uppercase tracking-widest">{meta.label} Notification</p>
              <h2 className="text-white text-2xl font-black italic uppercase leading-tight">
                {n.title || "Inbound Intelligence"}
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors text-white">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 space-y-5">
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${n.is_read ? "bg-gray-100 text-gray-500" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
              {n.is_read ? "✓ Read" : "● Unread"}
            </span>
            <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${meta.light}`}>
              {meta.label}
            </span>
          </div>

          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Message</p>
            <p className="text-gray-700 font-semibold leading-relaxed text-base">{n.message}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Received</p>
              <p className="text-sm font-black text-gray-700">
                {new Date(n.created_at).toLocaleString(undefined, { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Reference</p>
              <p className="text-sm font-black text-gray-700 font-mono">TR-{n.id.toString().padStart(4, "0")}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-5 py-4 bg-emerald-50 rounded-2xl border border-emerald-100">
            <CheckCircle size={16} className="text-emerald-500 shrink-0" />
            <p className="text-sm text-emerald-700 font-bold">This notification has been automatically marked as read.</p>
          </div>

          <button onClick={onClose}
            className="w-full py-4 rounded-2xl bg-gray-900 text-white text-sm font-black uppercase tracking-widest hover:bg-gray-700 transition-colors">
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Notifications;
