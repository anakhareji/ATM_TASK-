import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import Landing from "../pages/Landing";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import Leaderboard from "../pages/Leaderboard";
import GradeChart from "../pages/GradeChart";
import NewsEvents from "../pages/NewsEvents";
import Notifications from "../pages/Notifications";
import ProtectedRoute from "../utils/ProtectedRoute";
import AppGlassLayout from "../components/layout/AppGlassLayout";
import AdminSaaSRoutes from "./AdminSaaSRoutes";
import Users from "../pages/Users";
import News from "../pages/News";
import Events from "../pages/Events";
import Audit from "../pages/Audit";
import AdminPerformance from "../pages/AdminPerformance";
import StudentTasks from "../pages/StudentTasks";
import StudentTodo from "../pages/StudentTodo";
import StudentGroups from "../pages/StudentGroups";
import StudentTimetable from "../pages/StudentTimetable";
import StudentApproval from "../pages/StudentApproval";
import AcademicStructure from "../pages/AcademicStructure";
import AdminProjects from "../pages/AdminProjects";
import AdminSubmissions from "../pages/AdminSubmissions";
import AdminRecognition from "../pages/AdminRecognition";
import AdminCampusPulse from "../pages/AdminCampusPulse";
import StudentEvaluation from "../pages/StudentEvaluation";

// Faculty Pages
import FacultyProjects from "../pages/FacultyProjects";
import FacultyTasks from "../pages/FacultyTasks";
import FacultyGroups from "../pages/FacultyGroups";
import FacultySubmissions from "../pages/FacultySubmissions";
import FacultyPlanner from "../pages/FacultyPlanner";
import FacultyStudents from "../pages/FacultyStudents";

const LayoutWrapper = () => {
  const role = (localStorage.getItem("userRole") || "").toLowerCase();

  // Admin pages provide their own AdminGlassLayout as specified in their components
  if (role === "admin") {
    return <Outlet />;
  }

  // Both Faculty and Student now use the Premium Glass Layout
  return (
    <AppGlassLayout>
      <Outlet />
    </AppGlassLayout>
  );
};

const TaskRoute = () => {
  const role = (localStorage.getItem("userRole") || "").toLowerCase();
  return role === 'faculty' ? <FacultyTasks /> : <StudentTasks />;
};

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes wrapped in Layout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<LayoutWrapper />}>
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Student Routes */}
            <Route path="/dashboard/leaderboard" element={<Leaderboard />} />
            <Route path="/dashboard/grades" element={<GradeChart />} />
            <Route path="/dashboard/notifications" element={<Notifications />} />
            {/* Task & Operations Routing */}
            <Route path="/dashboard/tasks" element={<TaskRoute />} />
            <Route path="/dashboard/my-tasks" element={<StudentTasks />} /> 

            <Route path="/dashboard/todo" element={<StudentTodo />} />
            <Route path="/dashboard/my-groups" element={<StudentGroups />} />
            <Route path="/dashboard/timetable" element={<StudentTimetable />} />

            {/* Faculty Routes */}
            <Route path="/dashboard/projects" element={<FacultyProjects />} />
            <Route path="/dashboard/groups" element={<FacultyGroups />} />
            <Route path="/dashboard/submissions" element={<FacultySubmissions />} />
            <Route path="/dashboard/planner" element={<FacultyPlanner />} />
            <Route path="/dashboard/students" element={<FacultyStudents />} />
            <Route path="/dashboard/news-events" element={<NewsEvents />} />

            {/* Admin Routes */}
            <Route path="/dashboard/users" element={<Users />} />
            <Route path="/dashboard/news" element={<News />} />
            <Route path="/dashboard/events" element={<Events />} />
            <Route path="/dashboard/audit" element={<Audit />} />
            <Route path="/dashboard/approvals" element={<StudentApproval />} />
            <Route path="/dashboard/projects-global" element={<AdminProjects />} />
            <Route path="/dashboard/submissions-global" element={<AdminSubmissions />} />
            <Route path="/dashboard/academic-structure" element={<AcademicStructure />} />
            <Route path="/dashboard/performance" element={<AdminPerformance />} />
            <Route path="/dashboard/recognition" element={<AdminRecognition />} />
            <Route path="/dashboard/campus-pulse" element={<AdminCampusPulse />} />
            <Route path="/dashboard/evaluate" element={<StudentEvaluation />} />
          </Route>
          <Route path="/admin/*" element={<AdminSaaSRoutes />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
