import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../components/admin/Layout';
import Dashboard from '../pages/Dashboard';
import Users from '../pages/Users';
import StudentApproval from '../pages/StudentApproval';
import AcademicStructure from '../pages/AcademicStructure';
import AdminProjects from '../pages/AdminProjects';
import AdminSubmissions from '../pages/AdminSubmissions';
import AdminPerformance from '../pages/AdminPerformance';

const AdminSaaSRoutes = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/identity" element={<Users />} />
        <Route path="/approvals" element={<StudentApproval />} />
        <Route path="/structure" element={<AcademicStructure />} />
        <Route path="/projects" element={<AdminProjects />} />
        <Route path="/submissions" element={<AdminSubmissions />} />
        <Route path="/performance" element={<AdminPerformance />} />
      </Routes>
    </Layout>
  );
};

export default AdminSaaSRoutes;
