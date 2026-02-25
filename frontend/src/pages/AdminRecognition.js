import React, { useEffect, useState } from 'react';
import AdminGlassLayout from '../components/layout/AdminGlassLayout';
import API from '../api/axios';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Award, CheckCircle, XCircle, Search, ShieldCheck } from 'lucide-react';

const AdminRecognition = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState('');
  const [yearId, setYearId] = useState('');
  const [report, setReport] = useState(null);
  const [issuing, setIssuing] = useState(false);
  const [badgeType, setBadgeType] = useState('gold');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [weights, setWeights] = useState({
    weight_task_completion: 0.3,
    weight_avg_score: 0.5,
    weight_group_contribution: 0.1,
    weight_event_participation: 0.1,
  });
  const [savingWeights, setSavingWeights] = useState(false);
  const [recent, setRecent] = useState([]);

  const loadStats = async () => {
    try {
      const res = await API.get('/v1/admin/certifications/stats');
      setStats(res.data);
      const w = await API.get('/admin/settings');
      setWeights(prev => ({
        weight_task_completion: parseFloat(w.data.weight_task_completion ?? prev.weight_task_completion),
        weight_avg_score: parseFloat(w.data.weight_avg_score ?? prev.weight_avg_score),
        weight_group_contribution: parseFloat(w.data.weight_group_contribution ?? prev.weight_group_contribution),
        weight_event_participation: parseFloat(w.data.weight_event_participation ?? prev.weight_event_participation),
      }));
      const r = await API.get('/v1/admin/certifications/recent');
      setRecent(r.data || []);
    } catch {
      toast.error('Failed to load recognition stats');
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async () => {
    if (!studentId) return toast.error('Enter student ID');
    setReport(null);
    try {
      const res = await API.get(`/v1/admin/student-performance/${studentId}`, { params: yearId ? { academic_year_id: yearId } : {} });
      setReport(res.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to fetch performance');
    }
  };

  const issueBadge = async () => {
    if (!report) return;
    setIssuing(true);
    try {
      await API.post('/v1/admin/certifications/issue', { student_id: report.student_id, academic_year_id: yearId || null, badge_type: badgeType });
      toast.success('Badge issued');
      setConfirmOpen(false);
      loadStats();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Issue failed');
    } finally {
      setIssuing(false);
    }
  };

  useEffect(() => { loadStats(); }, []);

  return (
    <AdminGlassLayout>
      <div className="space-y-8 pb-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
              <Award size={20} />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 leading-tight">Achievement & Recognition</h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Certification Review Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-3 py-2">
              <Search size={16} className="text-gray-400" />
              <input value={studentId} onChange={e => setStudentId(e.target.value)} placeholder="Student ID" className="outline-none text-sm w-28" />
              <input value={yearId} onChange={e => setYearId(e.target.value)} placeholder="Year ID" className="outline-none text-sm w-20 border-l border-gray-100 pl-2" />
              <button onClick={fetchReport} className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-black">Fetch</button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-28 bg-white border border-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl border border-gray-100 p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Certifications</p>
              <p className="text-3xl font-black text-gray-800">{stats.total_certifications}</p>
            </div>
            <div className="bg-white rounded-3xl border border-gray-100 p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Distribution</p>
              <p className="text-sm font-bold text-gray-700">Gold {stats.distribution.gold} / Silver {stats.distribution.silver} / Bronze {stats.distribution.bronze} / Participation {stats.distribution.participation}</p>
            </div>
            <div className="bg-white rounded-3xl border border-gray-100 p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Top Students</p>
              <ul className="text-sm font-bold text-gray-700 space-y-1">
                {(stats.top_students || []).map((t, i) => <li key={i} className="flex items-center justify-between"><span>{t.name}</span><span className="text-gray-500">{t.performance_score}</span></li>)}
              </ul>
            </div>
            <div className="bg-white rounded-3xl border border-gray-100 p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Actions</p>
              <button onClick={() => setBadgeType('gold')} className={`px-3 py-1.5 rounded-xl text-xs font-black mr-2 ${badgeType==='gold'?'bg-amber-500 text-white':'bg-gray-100 text-gray-600'}`}>Gold</button>
              <button onClick={() => setBadgeType('silver')} className={`px-3 py-1.5 rounded-xl text-xs font-black mr-2 ${badgeType==='silver'?'bg-gray-500 text-white':'bg-gray-100 text-gray-600'}`}>Silver</button>
              <button onClick={() => setBadgeType('bronze')} className={`px-3 py-1.5 rounded-xl text-xs font-black mr-2 ${badgeType==='bronze'?'bg-orange-500 text-white':'bg-gray-100 text-gray-600'}`}>Bronze</button>
              <button onClick={() => setBadgeType('participation')} className={`px-3 py-1.5 rounded-xl text-xs font-black ${badgeType==='participation'?'bg-emerald-500 text-white':'bg-gray-100 text-gray-600'}`}>Participation</button>
            </div>
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-3xl border border-gray-100 p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Scoring Weights</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Task Completion</label>
                  <input type="number" step="0.01" min="0" max="1" value={weights.weight_task_completion} onChange={e=>setWeights(w=>({...w, weight_task_completion: parseFloat(e.target.value||0)}))} className="w-full px-3 py-2 rounded-xl border border-gray-200 mt-1" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Avg Score</label>
                  <input type="number" step="0.01" min="0" max="1" value={weights.weight_avg_score} onChange={e=>setWeights(w=>({...w, weight_avg_score: parseFloat(e.target.value||0)}))} className="w-full px-3 py-2 rounded-xl border border-gray-200 mt-1" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Group Contribution</label>
                  <input type="number" step="0.01" min="0" max="1" value={weights.weight_group_contribution} onChange={e=>setWeights(w=>({...w, weight_group_contribution: parseFloat(e.target.value||0)}))} className="w-full px-3 py-2 rounded-xl border border-gray-200 mt-1" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Event Participation</label>
                  <input type="number" step="0.01" min="0" max="1" value={weights.weight_event_participation} onChange={e=>setWeights(w=>({...w, weight_event_participation: parseFloat(e.target.value||0)}))} className="w-full px-3 py-2 rounded-xl border border-gray-200 mt-1" />
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <p className="text-xs font-bold text-gray-500">Sum: {(weights.weight_task_completion + weights.weight_avg_score + weights.weight_group_contribution + weights.weight_event_participation).toFixed(2)}</p>
                <button
                  disabled={savingWeights}
                  onClick={async ()=>{
                    setSavingWeights(true);
                    try {
                      await API.post('/admin/settings', {
                        weight_task_completion: weights.weight_task_completion,
                        weight_avg_score: weights.weight_avg_score,
                        weight_group_contribution: weights.weight_group_contribution,
                        weight_event_participation: weights.weight_event_participation
                      });
                      toast.success('Weights updated');
                    } catch {
                      toast.error('Failed to update weights');
                    } finally {
                      setSavingWeights(false);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-black"
                >
                  {savingWeights ? 'Saving...' : 'Save Weights'}
                </button>
              </div>
            </div>
          </div>
        )}

        {report && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-white rounded-3xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Student</p>
                  <p className="text-lg font-black text-gray-900">ID #{report.student_id}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${report.eligibility_status==='eligible'?'bg-emerald-50 text-emerald-600 border border-emerald-100':'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                  {report.eligibility_status==='eligible' ? <CheckCircle size={12} /> : <ShieldCheck size={12} />}
                  {report.eligibility_status}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-gray-50">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Completion Rate</p>
                  <p className="text-xl font-black text-gray-900">{report.completion_rate}%</p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Average Score</p>
                  <p className="text-xl font-black text-gray-900">{report.avg_score}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Group Contribution</p>
                  <p className="text-xl font-black text-gray-900">{report.group_contribution}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Events</p>
                  <p className="text-xl font-black text-gray-900">{report.event_participation}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Performance Score</p>
                  <p className="text-xl font-black text-gray-900">{report.performance_score}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Recommended</p>
                  <p className="text-xl font-black text-indigo-600 font-black">{report.recommended_badge || '—'}</p>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-end gap-3">
                <button onClick={() => setConfirmOpen(true)} className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-black">Approve Badge</button>
                <button onClick={async () => { await API.post('/v1/admin/certifications/reject', { certification_id: report.certification_id || 0 }); toast.success('Marked as rejected'); }} className="px-6 py-2.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-sm font-black">Reject</button>
                <button onClick={async () => { await API.post('/v1/admin/certifications/request-revaluation', { student_id: report.student_id }); toast.success('Re-evaluation requested'); }} className="px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-white text-sm font-black">Request Re-evaluation</button>
              </div>
            </div>
          </motion.div>
        )}

        {confirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setConfirmOpen(false)} />
            <div className="relative bg-white rounded-3xl border border-gray-100 w-full max-w-md p-6">
              <p className="text-lg font-black text-gray-900 mb-2">Confirm Issuance</p>
              <p className="text-sm text-gray-500 mb-4">Issue a {badgeType} badge to student #{report?.student_id}.</p>
              <div className="flex items-center justify-end gap-3">
                <button onClick={() => setConfirmOpen(false)} className="px-5 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-600">Cancel</button>
                <button disabled={issuing} onClick={issueBadge} className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-black">{issuing ? 'Issuing...' : 'Confirm'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
        {recent && recent.length > 0 && (
          <div className="bg-white rounded-3xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Recent Issued Badges</p>
              <div className="text-xs text-gray-500 font-bold">Showing {recent.length}</div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border-collapse">
                <thead className="bg-gray-50/80 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Certificate</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Student</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Badge</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Score</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Issued</th>
                    <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
                  {recent.map(row => (
                    <tr key={row.id} className="group hover:bg-emerald-50/30 transition-colors">
                      <td className="px-4 py-3 font-bold text-gray-800">#{row.id}</td>
                      <td className="px-4 py-3">
                        <div className="text-gray-800 font-bold">{row.student_name}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{row.student_email}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-bold">{row.badge_type}</td>
                      <td className="px-4 py-3 text-gray-700 font-bold">{row.performance_score}</td>
                      <td className="px-4 py-3 text-gray-500">{new Date(row.issue_date).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={async () => {
                            try {
                              const res = await API.get(`/v1/admin/certifications/${row.id}/export`, { responseType: 'blob' });
                              const blob = new Blob([res.data], { type: 'application/pdf' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `certificate_${row.id}.pdf`;
                              document.body.appendChild(a);
                              a.click();
                              a.remove();
                              URL.revokeObjectURL(url);
                            } catch {
                              toast.error('Export failed');
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-black"
                        >
                          Export PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

    </AdminGlassLayout>
  );
};


export default AdminRecognition;
