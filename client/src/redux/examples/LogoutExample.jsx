import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../hooks';
import { useAuth } from '../../hooks/useAuth';
import { handleLogout, isAuthenticated, getCurrentUser } from '../../utils/logout';

/**
 * Example component showing different ways to implement logout functionality
 */
const LogoutExample = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const dispatch = useAppDispatch();

  // Method 1: Using the utility function
  const handleLogoutUtility = () => {
    handleLogout(navigate, setAuth, dispatch);
  };

  // Method 2: Manual logout implementation
  const handleLogoutManual = async () => {
    try {
      // Clear localStorage
      localStorage.removeItem("accessToken");
      localStorage.removeItem("role");
      localStorage.removeItem("profileImage");
      localStorage.removeItem("name");
      
      // Clear Context API auth state
      setAuth({});
      
      // Clear Redux auth state
      dispatch({ type: 'auth/clearCredentials' });
      
      // Navigate to login page
      navigate("/login");
      
      console.log("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      // Even if there's an error, still clear local data and redirect
      localStorage.clear();
      setAuth({});
      dispatch({ type: 'auth/clearCredentials' });
      navigate("/login");
    }
  };

  // Check authentication status
  const isLoggedIn = isAuthenticated();
  const currentUser = getCurrentUser();

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Logout Example</h2>
      
      {/* User Info */}
      <div className="mb-4 p-3 bg-gray-50 rounded">
        <h3 className="font-semibold">Current User:</h3>
        <p>Name: {currentUser.name}</p>
        <p>Role: {currentUser.role}</p>
        <p>Authenticated: {isLoggedIn ? 'Yes' : 'No'}</p>
      </div>

      {/* Logout Buttons */}
      <div className="space-y-3">
        <button
          onClick={handleLogoutUtility}
          className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition-colors"
        >
          Logout (Utility Function)
        </button>
        
        <button
          onClick={handleLogoutManual}
          className="w-full bg-orange-500 text-white py-2 px-4 rounded hover:bg-orange-600 transition-colors"
        >
          Logout (Manual Implementation)
        </button>
      </div>

      {/* Usage Instructions */}
      <div className="mt-6 text-sm text-gray-600">
        <h4 className="font-semibold mb-2">Usage in your components:</h4>
        <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
{`import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../redux/hooks';
import { useAuth } from '../hooks/useAuth';
import { handleLogout } from '../utils/logout';

const MyComponent = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const dispatch = useAppDispatch();

  const handleLogoutClick = () => {
    handleLogout(navigate, setAuth, dispatch);
  };

  return (
    <button onClick={handleLogoutClick}>
      Logout
    </button>
  );
};`}
        </pre>
      </div>
    </div>
  );
};

export default LogoutExample;
