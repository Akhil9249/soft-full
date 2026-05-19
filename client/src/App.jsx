import { useState } from "react";
import "./App.css";
import Login from "./pages/register-login/Login";
import { Route, Routes } from "react-router-dom";
// import Register from "./pages/register-login/Register";
// import UserProtectedRoute from "./components/protected-route/UserProtectedRoute";
import DefaultProtectedRoute from "./components/protected-route/DefaultProtectedRoute";
import AdminProtectedRoute from "./components/protected-route/AdminProtectedRoute";

// import Dashboard from "./pages/admin/dashboard";
// import AddRole from "./pages/admin/addrole";
import { RoleManagement } from "./pages/admin/administration/RoleManagement";
import { StaffManagement } from "./pages/admin/administration/StaffManagement";
import { StudentManagement } from "./pages/admin/administration/StudentManagement";
import { Courses } from "./pages/admin/course-management/Courses";
import { Category } from "./pages/admin/course-management/Category";
import { Modules } from "./pages/admin/syllabus-management/Modules";
import { Topics } from "./pages/admin/syllabus-management/Topics";
import { TaskManagement } from "./pages/admin/task-management/TaskManagement";
import { Batches } from "./pages/admin/schedule/Batches";
import { WeeklySchedule } from "./pages/admin/schedule/WeeklySchedule";
import { MentorBatches } from "./pages/admin/schedule/MentorBatches";
import { StaticPages } from "./pages/admin/settings/StaticPages";
import { Timings } from "./pages/admin/schedule/Timings";
import { Notification } from "./pages/admin/settings/Notification";
import { Branch } from "./pages/admin/settings/Branch";
import { StudentAttendance } from "./pages/admin/attendance/studentAttendance";
import SuperAdminProtectedRoute from "./components/protected-route/SuperAdminProtectedRoute";
import Material from "./pages/admin/task-management/Material";
import LeaveRequest from "./pages/admin/attendance/LeaveRequest";
import AppTemp from "./pages/admin/attendance/Report";
import MenorCard from "./pages/admin/administration/MenorCard";
import Dashboard from "./pages/admin/administration/Dashboard";



function App() {

  return (

    <Routes>

      <Route element={<DefaultProtectedRoute />}>
        {/* <Route path="/register" element={<Register />} /> */}
        <Route path="/login" element={<Login />} />
      </Route>

      <Route element={<AdminProtectedRoute />}>
      
        <Route element={<SuperAdminProtectedRoute />} >
          <Route path="/" element={<RoleManagement />} />
          <Route path="/staff-management" element={<StaffManagement />} />
        </Route>

        <Route path="/dashboard" element={<Dashboard />} /> 
        <Route path="/menor-card" element={<MenorCard />} />
        <Route path="/student-management" element={<StudentManagement />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/category" element={<Category />} />
        <Route path="/modules" element={<Modules />} />
        <Route path="/topics" element={<Topics />} />
        <Route path="/task-management" element={<TaskManagement />} />
        <Route path="/material" element={<Material />} />
        <Route path="/student-attendance" element={<StudentAttendance />} />
        <Route path="/temp" element={<AppTemp />} />
        <Route path="/leave-request" element={<LeaveRequest />} />
        <Route path="/batches" element={<Batches />} />
        <Route path="/weekly-schedule" element={<WeeklySchedule />} />
        <Route path="/mentor-batches" element={<MentorBatches />} />
        <Route path="/static-pages" element={<StaticPages />} />
        <Route path="/timings" element={<Timings />} />
        <Route path="/notification" element={<Notification />} />
        <Route path="/branch" element={<Branch />} />
      </Route>
    </Routes>

  );
}

export default App;
