import React, { useEffect } from "react";
import UserLayout from "../layout/user-layout/UserLayout";
import { Navigate, Outlet, useLocation  } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

const DefaultProtectedRoute = () => {
    const location = useLocation(); // 🔹 Add this to track URL changes
    const { auth } = useAuth();

    const token = localStorage.getItem("accessToken");
    const role = localStorage.getItem("role")?.toLowerCase();
    if (token) {
        if (role === 'intern') {
            return <Navigate to="/student/attendance-dashboard" replace />;
        }
        return <Navigate to="/dashboard" replace />;
    }


    return (

            <Outlet />
    );
};

export default DefaultProtectedRoute;