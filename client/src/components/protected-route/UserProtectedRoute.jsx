import React, { useEffect } from "react";
import UserLayout from "../layout/user-layout/UserLayout";
import { Navigate, Outlet, useLocation  } from "react-router-dom";

const UserProtectedRoute = () => {
    const location = useLocation(); // 🔹 Add this to track URL changes


    const token = localStorage.getItem("accessToken");
    const role = localStorage.getItem("role");

     useEffect(() => {
        console.log("Current path:", location.pathname);
        console.log("History length:", window.history.length);
        console.log("State:", window.history.state);
    }, [location]); // 🔹 Ensure location is tracked properly

    if (!token || role?.toLowerCase() !== "intern") {
        return <Navigate to="/login" replace />;
    }

    return (
        <UserLayout>
            <Outlet />
        </UserLayout>
    );
};

export default UserProtectedRoute;
