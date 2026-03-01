import React, { useEffect, useState, useCallback } from 'react';
import AdminGlassLayout from '../components/layout/AdminGlassLayout';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import PageHeader from '../components/ui/PageHeader';
import GlassCard from '../components/ui/GlassCard';
import { UserPlus, Search, Shield, Trash2, Mail, ArrowRight, GraduationCap } from 'lucide-react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../utils/errorHelpers';

const AdminUsers = () => {
  const role = localStorage.getItem('userRole');
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [q, setQ] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Academic Data
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [courses, setCourses] = useState([]);

  const [confirmDelete, setConfirmDelete] = useState({ open: false, userId: null });
  const [changeRoleModal, setChangeRoleModal] = useState({ open: false, userId: null, role: 'student' });
  const [assignModal, setAssignModal] = useState({ open: false, userId: null, name: '', role: '', deptId: '', courseId: '', semester: 1 });
  const [userDetailsModal, setUserDetailsModal] = useState({ open: false, user: null });

  const userModalDefault = {
    open: false, id: null, name: '', email: '', role: 'student', password: '',
    department_id: '', program_id: '', course_id: '', batch: '', current_semester: 1
  };
  const [userModal, setUserModal] = useState(userModalDefault);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, page_size: pageSize };
      if (q) params.q = q;
      if (filterRole) params.role = filterRole;
      const res = await API.get('/admin/users', { params });
      const data = res.data;
      setUsers(Array.isArray(data) ? data : data.items || []);
      setTotalUsers(data.total || (Array.isArray(data) ? data.length : 0));
    } catch {
      toast.error("User synchronization failed");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, q, filterRole]);

  const fetchAcademicData = useCallback(async () => {
    try {
      const results = await Promise.allSettled([
        API.get('/v1/academic-structure/departments?page=1&page_size=100'),
        API.get('/v1/academic-structure/programs'),
        API.get('/v1/academic-structure/courses')
      ]);
      const deptRes = results[0], progRes = results[1], v1CourseRes = results[2];
      if (deptRes.status === 'fulfilled') setDepartments(deptRes.value.data?.items || []);

      const progs = progRes.status === 'fulfilled' ? (progRes.value.data || []) : [];
      setPrograms(progs);

      const v1courses = v1CourseRes.status === 'fulfilled' ? (v1CourseRes.value.data || []) : [];
      if (progs.length && v1courses.length) {
        const programById = Object.fromEntries(progs.map(p => [p.id, p]));
        const synthesized = v1courses
          .map(c => {
            const p = programById[c.program_id];
            return p ? {
              id: c.id,
              department_id: p.department_id,
              name: c.title || c.name,
              status: 'active',
              total_semesters: p.duration_years ? p.duration_years * 2 : undefined
            } : null;
          })
          .filter(Boolean);
        setCourses(synthesized);
      } else if (progs.length) {
        const synthesized = progs.map(p => ({
          id: p.id,
          department_id: p.department_id,
          name: p.name,
          status: 'active',
          total_semesters: p.duration_years ? p.duration_years * 2 : undefined
        }));
        setCourses(synthesized);
      } else {
        setCourses([]);
      }
    } catch { }
  }, []);

  useEffect(() => {
    if (role === 'admin') {
      fetchUsers();
      fetchAcademicData();
    }
  }, [role, fetchUsers, fetchAcademicData]);

  const handleSaveUser = async () => {
    try {
      if (!userModal.name || !userModal.email || (!userModal.id && !userModal.password)) {
        return toast.error("Incomplete identity profile");
      }

      const payload = { 
        ...userModal,
        department_id: userModal.department_id || null,
        program_id: userModal.program_id || null,
        course_id: userModal.course_id || null,
        current_semester: userModal.current_semester || null
      };

      if (payload.id) {
        delete payload.password; // Don't update password through this modal for now
        await API.put(`/admin/users/${payload.id}`, payload);
        toast.success("Identity updated");
      } else {
        await API.post('/admin/users', payload);
        toast.success("User integrated successfully");
      }
      setUserModal(userModalDefault);
      fetchUsers();
    } catch (err) {
      toast.error(getErrorMessage(err, "Operation failed"));
    }
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/admin/delete-user/${confirmDelete.userId}`);
      toast.success("Identity purged");
      setConfirmDelete({ open: false, userId: null });
      fetchUsers();
    } catch {
      toast.error("Purge failed");
    }
  };

   const handleChangeRole = async () => {
    try {
      await API.patch(`/admin/change-role/${changeRoleModal.userId}`, { role: changeRoleModal.role });
      toast.success("Identity reclassified");
      setChangeRoleModal({ open: false, userId: null, role: 'student' });
      fetchUsers();
    } catch {
      toast.error("Reclassification failed");
    }
  };

  const handleApproveStatus = async (user) => {
    const loadToast = toast.loading(`Activating ${user.name}...`);
    try {
      await API.patch(`/admin/activate-user/${user.id}`);
      toast.success("Identity verified and activated", { id: loadToast });
      fetchUsers();
    } catch (err) {
      toast.error(getErrorMessage(err, "Activation failed"), { id: loadToast });
    }
  };

  const handleAssign = async () => {
    try {
      if (assignModal.role === 'student') {
        await API.put(`/academic/students/${assignModal.userId}/assign-course`, {
          department_id: parseInt(assignModal.deptId),
          course_id: parseInt(assignModal.courseId),
          semester: parseInt(assignModal.semester)
        });
      } else {
        await API.put(`/academic/faculty/${assignModal.userId}/assign?department_id=${assignModal.deptId}&course_id=${assignModal.courseId}`);
      }
      toast.success("Academic placement finalized");
      setAssignModal({ ...assignModal, open: false });
      fetchUsers();
    } catch {
      toast.error("Placement protocol failed");
    }
  };

  // Derived: courses under selected department, fallback to all if none found
  const filteredCoursesForAssign = React.useMemo(() => {
    const depIdNum = parseInt(assignModal.deptId);
    const scoped = courses.filter(c => !assignModal.deptId || c.department_id === depIdNum);
    return scoped.length ? scoped : courses;
  }, [courses, assignModal.deptId]);

  const handlePromote = async (userId) => {
    try {
      await API.put(`/academic/students/${userId}/promote`);
      toast.success("Student promoted to next semester");
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Promotion failed");
    }
  };

  return (
    <AdminGlassLayout>
      <div className="space-y-8 pb-12">
        <PageHeader title="Identity Governance" subtitle="Manage access protocols, roles, and administrative lifecycle">
          <div className="flex flex-wrap items-center gap-4 mt-4 lg:mt-0">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name or email..."
                className="pl-12 pr-6 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 outline-none w-72 md:w-80 shadow-sm transition-all"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-6 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-600 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 outline-none min-w-[140px] shadow-sm appearance-none"
            >
              <option value="">All Streams</option>
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="admin">Admin</option>
            </select>
            <Button onClick={() => setUserModal({ ...userModalDefault, open: true })} className="bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 rounded-2xl px-6 font-black flex items-center gap-2">
              <UserPlus size={18} /> New User
            </Button>
          </div>
        </PageHeader>

        {loading ? (
          <div className="grid gap-4">
            {[...Array(pageSize)].map((_, i) => (
              <div key={i} className="h-16 bg-white/50 border border-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <GlassCard className="p-0 overflow-hidden shadow-xl shadow-gray-200/40 border-gray-100">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border-collapse">
                <thead className="bg-gray-50/80 border-b border-gray-100">
                  <tr>
                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">User Identity</th>
                    <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Classification</th>
                    <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Access Index</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-8 py-32 text-center text-gray-400">
                        No identities match current filter
                      </td>
                    </tr>
                  ) : (
                    users.map((u, idx) => (
                      <tr
                        key={u.id}
                        className="hover:bg-emerald-50/30 transition-colors group cursor-pointer"
                        onClick={() => setUserDetailsModal({ open: true, user: u })}
                      >
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-sm group-hover:scale-110 transition-transform">
                              {u.name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <p className="text-gray-800 font-bold leading-none mb-1">{u.name}</p>
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">
                                  <Mail size={10} />
                                  {u.email}
                                </div>
                                {(u.department_name || u.course_name) && (
                                  <div className="flex items-center gap-2 mt-1">
                                    {u.department_name && (
                                      <span className="text-[9px] px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-md font-black uppercase tracking-tighter border border-indigo-100/50">
                                        {u.department_name}
                                      </span>
                                    )}
                                    {u.course_name && (
                                      <span className="text-[9px] px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-md font-black uppercase tracking-tighter border border-emerald-100/50">
                                        {u.course_name} {u.current_semester ? `(SEM ${u.current_semester})` : ''}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <Badge variant={u.role}>{u.role}</Badge>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <Badge variant={u.status === 'active' ? 'active' : 'inactive'}>{u.status}</Badge>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {(u.role === 'student' || u.role === 'faculty') && (
                              <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setAssignModal({ open: true, userId: u.id, name: u.name, role: u.role, deptId: u.department_id || '', courseId: u.course_id || '', semester: u.current_semester || 1 }); }} className="p-2 hover:bg-white rounded-xl text-emerald-600">
                                <GraduationCap size={18} />
                              </Button>
                            )}
                            {u.role === 'student' && u.course_id && (
                              <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handlePromote(u.id); }} className="p-2 hover:bg-white rounded-xl text-teal-600">
                                <ArrowRight size={18} />
                              </Button>
                            )}
                            {u.status === 'inactive' && (
                              <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleApproveStatus(u); }} className="p-2 hover:bg-emerald-50 rounded-xl text-emerald-600 bg-emerald-50/50">
                                <Shield className="fill-emerald-600/10" size={18} />
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setChangeRoleModal({ open: true, userId: u.id, role: u.role }); }} className="p-2 hover:bg-white rounded-xl text-indigo-500">
                              <Shield size={18} />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setConfirmDelete({ open: false, userId: u.id }); }} className="p-2 hover:bg-white rounded-xl text-red-500">
                              <Trash2 size={18} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-8 py-6 bg-gray-50/40 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rows per stream</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                  className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  {[5, 10, 20, 50].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-[11px] font-bold text-gray-400">
                  PART {page} <span className="mx-1">OF</span> {Math.ceil(totalUsers / pageSize) || 1}
                </p>
                <div className="flex gap-2">
                  <Button variant="ghost" className="p-2 bg-white border border-gray-100 rounded-xl disabled:opacity-30" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    Prev
                  </Button>
                  <Button variant="ghost" className="p-2 bg-white border border-gray-100 rounded-xl disabled:opacity-30" onClick={() => setPage(p => p + 1)} disabled={page * pageSize >= totalUsers}>
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </GlassCard>
        )}

        <Modal
          open={confirmDelete.open}
          title="Archive Purge"
          onClose={() => setConfirmDelete({ open: false, userId: null })}
          actions={<Button onClick={handleDelete} className="bg-red-600 hover:bg-red-500 px-8 font-black rounded-2xl">Confirm Purge</Button>}
        >
          <p className="text-gray-500 leading-relaxed">Are you absolutely sure you wish to permanently purge this identity? This protocol is irreversible and will remove all associated governance links.</p>
        </Modal>

        <Modal
          open={userModal.open}
          title={userModal.id ? "Edit Academic Identity" : "New Identity Integration"}
          onClose={() => setUserModal(userModalDefault)}
          actions={<Button onClick={handleSaveUser} className="bg-emerald-600 hover:bg-emerald-500 px-8 font-black rounded-2xl">Finalize</Button>}
        >
          <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1 pr-2 custom-scrollbar">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Full Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-gray-300 font-medium"
                  placeholder="Legal Name"
                  value={userModal.name}
                  onChange={e => setUserModal({ ...userModal, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Email Address</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-gray-300 font-medium"
                  placeholder="Academic Email"
                  value={userModal.email}
                  onChange={e => setUserModal({ ...userModal, email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">User Role</label>
                <select
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl font-bold"
                  value={userModal.role}
                  onChange={e => setUserModal({ ...userModal, role: e.target.value })}
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              {!userModal.id && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Password</label>
                  <input
                    type="password"
                    placeholder="Secure Password"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none"
                    value={userModal.password}
                    onChange={e => setUserModal({ ...userModal, password: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-4 mt-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-3">Academic Structure Assignment</p>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Department</label>
                    <select
                      className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-2xl font-bold text-gray-700"
                      value={userModal.department_id || ''}
                      onChange={e => setUserModal({ ...userModal, department_id: e.target.value ? parseInt(e.target.value) : '' })}
                    >
                      <option value="">None</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Academic Stream</label>
                    <select
                      className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-2xl font-bold text-gray-700"
                      value={userModal.program_id || ''}
                      onChange={e => setUserModal({ ...userModal, program_id: e.target.value ? parseInt(e.target.value) : '' })}
                      disabled={!userModal.department_id}
                    >
                      <option value="">None</option>
                      {programs.filter(p => !userModal.department_id || p.department_id === userModal.department_id).map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Batch Selection (A-J)</label>
                    <select
                      className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-2xl font-bold text-gray-700"
                      value={userModal.batch || ''}
                      onChange={e => setUserModal({ ...userModal, batch: e.target.value })}
                    >
                      <option value="">None</option>
                      {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].map(b => (
                        <option key={b} value={b}>Batch {b}</option>
                      ))}
                    </select>
                  </div>
                  {userModal.role === 'student' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Current Semester</label>
                      <input
                        type="number"
                        className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-2xl font-bold text-gray-700"
                        value={userModal.current_semester || 1}
                        min="1" max="10"
                        onChange={e => setUserModal({ ...userModal, current_semester: parseInt(e.target.value) })}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Modal>

        <Modal
          open={changeRoleModal.open}
          title="Perms Modification"
          onClose={() => setChangeRoleModal({ open: false, userId: null, role: 'student' })}
          actions={<Button onClick={handleChangeRole} className="bg-indigo-600 hover:bg-indigo-500 px-8 font-black rounded-2xl">Modify Perms</Button>}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Reclassify this identity within the academic hierarchy. This will immediately update their access level.</p>
            <select
              className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={changeRoleModal.role}
              onChange={e => setChangeRoleModal({ ...changeRoleModal, role: e.target.value })}
            >
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
        </Modal>



        <Modal
          open={assignModal.open}
          title={`Academic Placement: ${assignModal.name}`}
          onClose={() => setAssignModal({ ...assignModal, open: false })}
          actions={<Button onClick={handleAssign} className="bg-emerald-600 rounded-2xl px-10 font-black">Finalize Placement</Button>}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Assigned Department</label>
              <select
                value={assignModal.deptId}
                onChange={e => setAssignModal({ ...assignModal, deptId: parseInt(e.target.value) || '' })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 font-bold"
              >
                <option value="">Select Department...</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Linked Academic Stream (Course)</label>
              <select
                value={assignModal.courseId}
                onChange={e => setAssignModal({ ...assignModal, courseId: parseInt(e.target.value) || '' })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 font-bold"
              >
                <option value="">Select Stream...</option>
                {filteredCoursesForAssign.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {assignModal.role === 'student' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Current Active Semester</label>
                <input
                  type="number"
                  value={assignModal.semester}
                  onChange={e => setAssignModal({ ...assignModal, semester: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 font-bold"
                  min="1"
                  max="10"
                />
              </div>
            )}

            <p className="text-[10px] text-gray-400 italic mt-4">
              * Assigning a department and stream is mandatory for project and task participation.
            </p>
          </div>
        </Modal>

        <Modal
          open={userDetailsModal.open}
          title="User Profile Detail"
          onClose={() => setUserDetailsModal({ open: false, user: null })}
          actions={
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  const u = userDetailsModal.user;
                  setUserDetailsModal({ open: false, user: null });
                  setUserModal({
                    open: true,
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    role: u.role,
                    department_id: u.department_id || '',
                    program_id: u.program_id || '',
                    batch: u.batch || '',
                    current_semester: u.current_semester || 1
                  });
                }}
                className="bg-indigo-600 rounded-2xl px-6 font-black"
              >
                Full Profile Edit
              </Button>
              <Button
                onClick={() => {
                  const u = userDetailsModal.user;
                  setUserDetailsModal({ open: false, user: null });
                  if (u.role === 'student' || u.role === 'faculty') {
                    setAssignModal({ open: true, userId: u.id, name: u.name, role: u.role, deptId: u.department_id || '', courseId: u.course_id || '', semester: u.current_semester || 1 });
                  }
                }}
                className="bg-emerald-600 rounded-2xl px-6 font-black"
              >
                Quick Placement
              </Button>
            </div>
          }
        >
          {userDetailsModal.user && (
            <div className="space-y-6">
              <div className="flex items-center gap-6 p-6 bg-gray-50 rounded-3xl border border-gray-100 shadow-inner">
                <div className="w-20 h-20 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-indigo-600/20">
                  {userDetailsModal.user.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-800 leading-tight">{userDetailsModal.user.name}</h3>
                  <p className="text-sm font-bold text-gray-400 mt-1">{userDetailsModal.user.email}</p>
                  <div className="flex gap-2 mt-3">
                    <Badge variant={userDetailsModal.user.role}>{userDetailsModal.user.role}</Badge>
                    <Badge variant={userDetailsModal.user.status === 'active' ? 'active' : 'inactive'}>{userDetailsModal.user.status}</Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between shadow-sm">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Department</span>
                  <span className="text-sm font-bold text-gray-700">{userDetailsModal.user.department_name || 'Not Linked'}</span>
                </div>
                <div className="p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between shadow-sm">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Academic Stream</span>
                  <span className="text-sm font-bold text-gray-700">{userDetailsModal.user.program_name || 'Not Linked'}</span>
                </div>
                <div className="p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between shadow-sm">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Batch Selection</span>
                  <span className="text-sm font-bold text-gray-700">{userDetailsModal.user.batch ? `Batch ${userDetailsModal.user.batch}` : 'Not Linked'}</span>
                </div>
                {userDetailsModal.user.role === 'student' && (
                  <div className="p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between shadow-sm">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Current Semester</span>
                    <span className="text-sm font-bold text-gray-700">{userDetailsModal.user.current_semester || 'N/A'}</span>
                  </div>
                )}
                <div className="p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between shadow-sm">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Governance ID</span>
                  <span className="text-xs font-mono text-gray-400">#{userDetailsModal.user.id}</span>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminGlassLayout>
  );
};

export default AdminUsers;
