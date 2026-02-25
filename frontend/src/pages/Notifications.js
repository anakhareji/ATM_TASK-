import React, { useEffect, useState } from "react";
import API from "../api/axios";
import AdminNotifications from "./AdminNotifications";
import GlassCard from "../components/ui/GlassCard";
import Button from "../components/ui/Button";
import { Bell } from "lucide-react";

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
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role !== "admin") {
      fetchItems();
    }
  }, [role]);

  if (role === 'admin') {
    return <AdminNotifications />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">Notifications</h1>
          <p className="text-gray-500 font-medium">Deadline reminders, task updates, event announcements</p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 animate-pulse text-emerald-600 font-bold">Loading notifications...</div>
      ) : (
        <div className="space-y-4 max-w-4xl">
          {items.map(n => (
            <GlassCard key={n.id} className={`flex items-start justify-between gap-6 ${!n.is_read ? 'border-l-4 border-emerald-500 bg-emerald-50' : ''}`}>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gray-50 text-gray-500 rounded-2xl">
                  <Bell size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{n.title || 'Notification'}</h3>
                  <p className="text-sm text-gray-600">{n.message}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase mt-2">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                {!n.is_read && (
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      try {
                        await API.patch(`/notifications/${n.id}/read`);
                        fetchItems();
                      } catch {}
                    }}
                  >
                    Mark Read
                  </Button>
                )}
                <Button
                  variant="secondary"
                  onClick={async () => {
                    try {
                      await API.delete(`/notifications/${n.id}`);
                      fetchItems();
                    } catch {}
                  }}
                >
                  Dismiss
                </Button>
              </div>
            </GlassCard>
          ))}
          {items.length === 0 && (
            <div className="text-center py-12 text-gray-400">No notifications</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;
