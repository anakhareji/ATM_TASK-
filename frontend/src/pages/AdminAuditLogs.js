import React, { useEffect, useState } from 'react';
import AdminGlassLayout from '../components/layout/AdminGlassLayout';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import PageHeader from '../components/ui/PageHeader';
import API from '../api/axios';
import { Search, Filter, User, Database, Download, History, Shield } from 'lucide-react';
import { format } from 'date-fns';

const AdminAuditLogs = () => {
  const role = localStorage.getItem('userRole');
  const [logs, setLogs] = useState([]);
  const [action, setAction] = useState('');
  const [limit, setLimit] = useState(50);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = { limit };
      if (action) params.action = action;

      // Attempt to get user map for better readability
      let userMap = {};
      try {
        const userRes = await API.get('/admin/users', { params: { page_size: 100 } });
        userMap = (userRes.data.items || []).reduce((acc, u) => ({ ...acc, [u.id]: u.name }), {});
      } catch (e) {
        console.warn("Could not fetch user map for audit logs");
      }

      const logRes = await API.get('/admin/audit-logs', { params });
      const logsWithNames = (logRes.data || []).map(l => ({
        ...l,
        user_name: userMap[l.user_id] || `User #${l.user_id}`
      }));
      setLogs(logsWithNames);
    } catch {
      setError('Failed to synchronize infrastructure audit records');
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action) => {
    const a = action.toLowerCase();
    if (a.includes('delete')) return 'bg-red-50 text-red-600 border-red-100';
    if (a.includes('activate') || a.includes('approve')) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    if (a.includes('deactivate')) return 'bg-amber-50 text-amber-600 border-amber-100';
    if (a.includes('role')) return 'bg-indigo-50 text-indigo-600 border-indigo-100';
    return 'bg-blue-50 text-blue-600 border-blue-100';
  };

  const exportLogs = () => {
    const csv = [
      ['Action', 'Entity', 'User', 'Timestamp'],
      ...logs.map(l => [l.action, l.entity_type, l.user_name, l.timestamp])
    ].map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
    link.download = `audit_report_${format(new Date(), 'yyyyMMdd')}.csv`;
    link.click();
  };

  useEffect(() => {
    if (role === 'admin') fetchLogs();
  }, [action, limit, role]);

  return (
    <AdminGlassLayout>
      <div className="space-y-8 pb-12">
        <PageHeader
          title="Infrastructure Audit"
          subtitle="Immutable record of administrative operations and security events"
        >
          <div className="flex flex-wrap gap-4 mt-4 lg:mt-0">
            <div className="relative group">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={16} />
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="pl-12 pr-10 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 outline-none w-64 appearance-none shadow-sm transition-all"
              >
                <option value="">All Governance Events</option>
                <optgroup label="Access Control">
                  <option value="activate_user">Activate User</option>
                  <option value="deactivate_user">Deactivate User</option>
                  <option value="delete_user">Delete User</option>
                  <option value="change_role">Change Permissions</option>
                </optgroup>
                <optgroup label="Approvals">
                  <option value="approve_faculty">Faculty Approval</option>
                  <option value="approve_recommendation">Student Integration</option>
                </optgroup>
              </select>
            </div>
            <Button variant="ghost" onClick={exportLogs} className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-2xl px-6 py-2.5 font-bold text-gray-600">
              <Download size={18} /> Export
            </Button>
            <Button onClick={fetchLogs} className="bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 rounded-2xl px-8 font-black">
              Refresh
            </Button>
          </div>
        </PageHeader>

        {loading ? (
          <div className="grid gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-16 bg-white/50 border border-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <GlassCard className="border-red-100 bg-red-50/50 text-center py-12">
            <Shield size={48} className="mx-auto text-red-300 mb-4" />
            <p className="text-red-700 font-bold">{error}</p>
          </GlassCard>
        ) : (
          <GlassCard className="p-0 overflow-hidden shadow-xl shadow-gray-200/50">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border-collapse">
                <thead className="bg-gray-50/80 border-b border-gray-100">
                  <tr>
                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Security Event</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Target Entity</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Initiated By</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Time Index</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-8 py-32 text-center">
                        <Database size={64} className="mx-auto mb-6 text-gray-200" />
                        <h3 className="text-xl font-bold text-gray-400">Chronicle Empty</h3>
                        <p className="text-gray-400 text-xs max-w-xs mx-auto mt-2">No infrastructure events match your current filter parameters.</p>
                      </td>
                    </tr>
                  ) : (
                    logs.map((l, idx) => (
                      <tr key={l.id} className="hover:bg-emerald-50/30 transition-colors group">
                        <td className="px-8 py-5">
                          <div className={`inline-flex items-center px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider ${getActionColor(l.action)}`}>
                            {l.action.replace(/_/g, ' ')}
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <span className="text-gray-800 font-bold capitalize">{l.entity_type}</span>
                            <span className="text-xs font-black text-gray-300">ID {l.entity_id}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-emerald-600 font-black text-xs shadow-sm">
                              {l.user_name?.[0]?.toUpperCase()}
                            </div>
                            <span className="text-gray-700 font-medium">{l.user_name}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right font-medium text-gray-400 text-xs">
                          {format(new Date(l.timestamp), 'MMM dd, yyyy • HH:mm:ss')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {logs.length >= limit && (
              <div className="p-8 border-t border-gray-100 flex justify-center bg-gray-50/30">
                <Button variant="ghost" onClick={() => setLimit((l) => l + 50)} className="text-gray-500 hover:text-emerald-600 font-bold text-xs uppercase tracking-widest px-12">
                  Load Older Records
                </Button>
              </div>
            )}
          </GlassCard>
        )}
      </div>
    </AdminGlassLayout>
  );
};

export default AdminAuditLogs;
