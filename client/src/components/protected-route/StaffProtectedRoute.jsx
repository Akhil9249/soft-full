import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import AdminService from "../../services/admin-api-service/AdminService";

const StaffProtectedRoute = () => {
  const { auth, setAuth } = useAuth();
  const { getUserProfile } = AdminService();
  const token = localStorage.getItem("accessToken");
  const role = (localStorage.getItem("role") || auth?.role || "").toLowerCase().trim();

  const [permissions, setPermissions] = useState(() => {
    try {
      const saved = localStorage.getItem("permissions");
      return saved ? JSON.parse(saved) : (auth?.permissions || null);
    } catch {
      return null;
    }
  });

  const isSuperAdminOrAdmin = ["super admin", "admin", "branch admin"].includes(role);
  const [checking, setChecking] = useState(!isSuperAdminOrAdmin && !permissions && Boolean(token));

  useEffect(() => {
    if (!isSuperAdminOrAdmin && !permissions && token) {
      getUserProfile().then((res) => {
        const userPerms = res?.data?.user?.permissions;
        if (userPerms) {
          setPermissions(userPerms);
          localStorage.setItem("permissions", JSON.stringify(userPerms));
          setAuth((prev) => ({ ...prev, permissions: userPerms }));
        }
      }).catch((err) => {
        console.error("Error checking staff permissions in protected route:", err);
      }).finally(() => {
        setChecking(false);
      });
    }
  }, [isSuperAdminOrAdmin, permissions, token, setAuth]);

  if (!token || role === "intern") {
    return <Navigate to="/login" replace />;
  }

  if (isSuperAdminOrAdmin) {
    return <Outlet />;
  }

  if (checking) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const hasStaffPermission = Boolean(
    permissions?.mentorManagement?.viewMentor ||
    permissions?.mentorManagement?.addMentor ||
    permissions?.mentorManagement?.editMentor ||
    permissions?.mentorManagement?.deleteMentor
  );

  if (!hasStaffPermission) {
    return <Navigate to="/student-management" replace />;
  }

  return <Outlet />;
};

export default StaffProtectedRoute;
