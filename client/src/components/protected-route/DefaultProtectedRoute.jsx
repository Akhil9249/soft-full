import React, { useEffect } from "react";
import UserLayout from "../layout/user-layout/UserLayout";
import { Navigate, Outlet, useLocation  } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

const DefaultProtectedRoute = () => {
    const location = useLocation(); // 🔹 Add this to track URL changes
    const { auth } = useAuth();

    const token = localStorage.getItem("accessToken");
    if (token) {
        return <Navigate to="/" />;
    }


    return (

            <Outlet />
    );
};

export default DefaultProtectedRoute;