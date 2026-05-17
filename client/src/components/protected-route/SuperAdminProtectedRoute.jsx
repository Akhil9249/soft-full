import React from 'react'
import { Navigate, Outlet } from "react-router-dom";
import AdminLayout from "../layout/admin-layout/AdminLayout";
import useAuth from "../../hooks/useAuth";

const SuperAdminProtectedRoute = () => {
    const { auth } = useAuth();
    const token = localStorage.getItem("accessToken");
    // console.log("auth", auth);
  

    if (token && (auth.role !== "super admin" && auth.role !== "admin")) {
        return <Navigate to="/student-management" />;
    }
  

  
    return (
    
        <Outlet />
     
    );
}

export default SuperAdminProtectedRoute