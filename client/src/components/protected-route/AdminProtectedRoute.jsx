import { Navigate, Outlet } from "react-router-dom";
import AdminLayout from "../layout/admin-layout/AdminLayout";
import useAuth from "../../hooks/useAuth";

const AdminProtectedRoute = () => {
  const { auth } = useAuth();
  const token = localStorage.getItem("accessToken");
  // console.log("auth", auth);

  // if (!token && auth.role !== "admin") {
  //     return <Navigate to="/login" />;
  // }
  if (!token) {
      return <Navigate to="/login" />;
  }

  // if (token && auth.role !== "Super Admin") {
  //     return <Navigate to="/login" />;
  // }
  // if (token && auth.role !== "Admin" && auth.role !== "Mentor") {
  //     return <Navigate to="/login" />;
  // }

  {/* <Outlet />; */ }

  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );

};

export default AdminProtectedRoute;
