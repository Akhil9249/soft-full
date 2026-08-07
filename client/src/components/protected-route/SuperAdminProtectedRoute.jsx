import React from 'react'
import { Navigate, Outlet } from "react-router-dom";
import AdminLayout from "../layout/admin-layout/AdminLayout";
import useAuth from "../../hooks/useAuth";

const SuperAdminProtectedRoute = () => {
    const { auth } = useAuth();
    const token = localStorage.getItem("accessToken");
    const role = localStorage.getItem("role");
  
    if (!token || role?.toLowerCase() === "intern") {
        return <Navigate to="/login" replace />;
    }

    if (token && (role?.toLowerCase() !== "super admin" && role?.toLowerCase() !== "admin")) {
        return <Navigate to="/student-management" replace />;
    }
  

  
    return (
    
        <Outlet />
     
    );
}

export default SuperAdminProtectedRoute