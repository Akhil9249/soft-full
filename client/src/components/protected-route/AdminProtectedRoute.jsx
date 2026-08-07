import { Navigate, Outlet } from "react-router-dom";
import AdminLayout from "../layout/admin-layout/AdminLayout";
import useAuth from "../../hooks/useAuth";

const AdminProtectedRoute = () => {
  const { auth } = useAuth();
  const token = localStorage.getItem("accessToken");
  const role = localStorage.getItem("role");

  if (!token || role?.toLowerCase() === "intern") {
      return <Navigate to="/login" replace />;
  }

  {/* <Outlet />; */ }

  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );

};

export default AdminProtectedRoute;
