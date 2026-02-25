import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Layers, Calendar, User } from 'lucide-react';
import API from '../api/axios';
import GlassCard from '../components/ui/GlassCard';
import { staggerContainer, cardEntrance } from '../utils/motionVariants';

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
          const res = await API.get(`/groups/project/${pid}`);
          return [pid, res.data];
        })
      );
      const map = {};
      entries.forEach(([pid, data]) => { map[pid] = data; });
      setGroupsByProject(map);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">My Groups</h1>
          <p className="text-gray-500 font-medium">Group membership and assigned tasks</p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 animate-pulse text-emerald-600 font-bold">Loading groups...</div>
      ) : (
        <div className="space-y-6">
          {groupTasks.map((task) => {
            const groups = groupsByProject[task.project_id] || [];
            const thisGroup = groups.find(g => g.id === task.group_id);
            return (
              <motion.div key={task.id} variants={cardEntrance}>
                <GlassCard>
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-gray-50 text-gray-500 rounded-2xl">
                        <Layers size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800">Task: {task.title}</h3>
                        <p className="text-sm text-gray-500 font-medium">{task.description}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mt-1">
                          <Calendar size={12} /> {new Date(task.deadline).toLocaleDateString()} • Max {task.max_marks}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Project</p>
                      <p className="text-sm font-medium text-gray-600">#{task.project_id}</p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Group Members</p>
                    <div className="flex flex-wrap gap-3">
                      {thisGroup?.members?.length ? (
                        thisGroup.members.map((m, idx) => (
                          <div
                            key={`${m.student_id}-${idx}`}
                            className="px-3 py-1 rounded-full bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold flex items-center gap-2"
                          >
                            <User size={14} className="text-gray-400" />
                            Student #{m.student_id}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-400 italic">Members not available</p>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
          {groupTasks.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <Users className="mx-auto mb-4" />
              No group tasks assigned
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default StudentGroups;
