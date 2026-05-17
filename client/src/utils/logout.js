import { useNavigate } from 'react-router-dom';

/**
 * Utility function to handle logout functionality
 * Clears all authentication data and redirects to login page
 */
export const handleLogout = (navigate, setAuth, dispatch) => {
  try {
    // Clear localStorage
    localStorage.removeItem("accessToken");
    localStorage.removeItem("role");
    localStorage.removeItem("profileImage");
    localStorage.removeItem("name");
    
    // Clear Context API auth state
    if (setAuth) {
      setAuth({});
    }
    
    // Clear Redux auth state
    if (dispatch) {
      dispatch({ type: 'auth/clearCredentials' });
    }
    
    // Navigate to login page
    if (navigate) {
      navigate("/login");
    }
    
    console.log("Logged out successfully");
    return true;
  } catch (error) {
    console.error("Logout error:", error);
    // Even if there's an error, still clear local data and redirect
    localStorage.clear();
    if (setAuth) setAuth({});
    if (dispatch) dispatch({ type: 'auth/clearCredentials' });
    if (navigate) navigate("/login");
    return false;
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem("accessToken");
  const role = localStorage.getItem("role");
  return !!(token && role);
};

/**
 * Get current user data from localStorage
 */
export const getCurrentUser = () => {
  return {
    name: localStorage.getItem("name") || "User",
    role: localStorage.getItem("role") || "Admin",
    image: localStorage.getItem("profileImage") || null,
    token: localStorage.getItem("accessToken") || null
  };
};

/**
 * Clear all authentication data
 */
export const clearAuthData = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("role");
  localStorage.removeItem("profileImage");
  localStorage.removeItem("name");
};
