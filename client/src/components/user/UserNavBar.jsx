import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { RxPerson } from "react-icons/rx";
import useAuth from "../../hooks/useAuth";
import { useAppDispatch } from "../../redux/hooks";
import { logoutUser, clearCredentials } from "../../redux/slices/authSlice";
import UserService from "../../services/user-api-service/UserService";

import {
  BellRing,
  Settings,
  User,
  LayoutDashboard,
  Users,
  Book,
  FileText,
  Calendar,
  LogOut,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  SquarePen,
  Download,
  X,
  Send,
  Menu
} from 'lucide-react';

const Icon = ({ path, className, viewBox = "0 0 24 24" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox={viewBox} xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={path}></path>
  </svg>
);

const Sidebar = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuth();
  const { auth } = useAuth();
  // console.log("Auth object:", auth);
  // console.log("User role:", auth?.role);
  const dispatch = useAppDispatch();
  const userService = UserService();

  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      const res = await userService.getUnreadNotificationsCount();
      if (res && typeof res.count === "number") {
        setUnreadCount(res.count);
      }
    } catch (err) {
      console.error("Failed to fetch unread notifications count:", err);
    }
  };

  useEffect(() => {
    if (auth?.accessToken) {
      fetchUnreadCount();

      const handleNotificationUpdate = () => {
        fetchUnreadCount();
      };

      window.addEventListener("new-fcm-notification", handleNotificationUpdate);
      window.addEventListener("notification-marked-read", handleNotificationUpdate);

      const intervalId = setInterval(fetchUnreadCount, 30000);

      return () => {
        window.removeEventListener("new-fcm-notification", handleNotificationUpdate);
        window.removeEventListener("notification-marked-read", handleNotificationUpdate);
        clearInterval(intervalId);
      };
    }
  }, [auth?.accessToken]);

  console.log("Auth object:", auth);

  // const [isOpen, setIsOpen] = useState(false);
  // const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  // Track active navigation item
  const [activeNavItem, setActiveNavItem] = useState('');

  // Handle navigation item click
  const handleNavItemClick = (itemPath) => {
    setActiveNavItem(itemPath);
    // Close mobile menu when a link is clicked
    if (setIsMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  // Automatically set active navigation item based on current URL
  useEffect(() => {
    setActiveNavItem(location.pathname);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      // Clear localStorage
      localStorage.removeItem("accessToken");
      localStorage.removeItem("role");
      localStorage.removeItem("profileImage");
      localStorage.removeItem("name");

      // Clear Context API auth state
      setAuth({});

      // Clear Redux auth state
      dispatch(clearCredentials());

      // Navigate to login page
      navigate("/login");

      // Optional: Show success message
      console.log("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      // Even if there's an error, still clear local data and redirect
      localStorage.clear();
      setAuth({});
      dispatch(clearCredentials());
      navigate("/login");
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen && setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static
        w-64 bg-white p-6 shadow-md flex flex-col justify-between rounded-r-xl h-screen overflow-hidden z-50
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="overflow-y-auto flex-1 scrollbar-hide">
          <div className="flex items-center mb-8">
            <svg
              className="w-8 h-8 text-orange-500 mr-2"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15L4 12l6-5 6 5-6 5z" />
            </svg>
            <span className="text-xl font-bold text-gray-800">Softroniics</span>
          </div>
          <nav className="space-y-4">
            {/* My Attendance */}
            <Link
              to="/student/attendance-dashboard"
              onClick={() => handleNavItemClick('/student/attendance-dashboard')}
              className={`flex items-center font-medium p-2 rounded-lg transition-colors duration-200 ${activeNavItem === '/student/attendance-dashboard'
                  ? 'bg-orange-100 text-orange-600 font-semibold'
                  : 'text-gray-600 hover:text-orange-500 hover:bg-gray-100'
                }`}
            >
              <Calendar className="w-5 h-5 mr-3" />
              My Attendance
            </Link>

            {/* Leave Request */}
            <Link
              to="/student/leave-request"
              onClick={() => handleNavItemClick('/student/leave-request')}
              className={`flex items-center font-medium p-2 rounded-lg transition-colors duration-200 ${activeNavItem === '/student/leave-request'
                  ? 'bg-orange-100 text-orange-600 font-semibold'
                  : 'text-gray-600 hover:text-orange-500 hover:bg-gray-100'
                }`}
            >
              <Send className="w-5 h-5 mr-3" />
              Leave Request
            </Link>

            {/* Task Submission */}
            <Link
              to="/student/task-submission"
              onClick={() => handleNavItemClick('/student/task-submission')}
              className={`flex items-center font-medium p-2 rounded-lg transition-colors duration-200 ${activeNavItem === '/student/task-submission'
                  ? 'bg-orange-100 text-orange-600 font-semibold'
                  : 'text-gray-600 hover:text-orange-500 hover:bg-gray-100'
                }`}
            >
              <SquarePen className="w-5 h-5 mr-3" />
              Task Submission
            </Link>

            {/* Material List */}
            <Link
              to="/student/material"
              onClick={() => handleNavItemClick('/student/material')}
              className={`flex items-center font-medium p-2 rounded-lg transition-colors duration-200 ${activeNavItem === '/student/material'
                  ? 'bg-orange-100 text-orange-600 font-semibold'
                  : 'text-gray-600 hover:text-orange-500 hover:bg-gray-100'
                }`}
            >
              <Book className="w-5 h-5 mr-3" />
              Material List
            </Link>

            {/* Weekly Schedule */}
            <Link
              to="/student/weekly-schedule"
              onClick={() => handleNavItemClick('/student/weekly-schedule')}
              className={`flex items-center font-medium p-2 rounded-lg transition-colors duration-200 ${activeNavItem === '/student/weekly-schedule'
                  ? 'bg-orange-100 text-orange-600 font-semibold'
                  : 'text-gray-600 hover:text-orange-500 hover:bg-gray-100'
                }`}
            >
              <Calendar className="w-5 h-5 mr-3" />
              Weekly Schedule
            </Link>

            {/* My Card / Evaluation Card */}
            <Link
              to="/student/menor-card"
              onClick={() => handleNavItemClick('/student/menor-card')}
              className={`flex items-center font-medium p-2 rounded-lg transition-colors duration-200 ${activeNavItem === '/student/menor-card'
                  ? 'bg-orange-100 text-orange-600 font-semibold'
                  : 'text-gray-600 hover:text-orange-500 hover:bg-gray-100'
                }`}
            >
              <FileText className="w-5 h-5 mr-3" />
              My Card
            </Link>

            {/* Notifications */}
            <Link
              to="/student/notification"
              onClick={() => handleNavItemClick('/student/notification')}
              className={`flex items-center justify-between font-medium p-2 rounded-lg transition-colors duration-200 ${activeNavItem === '/student/notification'
                  ? 'bg-orange-100 text-orange-600 font-semibold'
                  : 'text-gray-600 hover:text-orange-500 hover:bg-gray-100'
                }`}
            >
              <div className="flex items-center">
                <BellRing className="w-5 h-5 mr-3" />
                <span>Notifications</span>
              </div>
              {unreadCount > 0 && (
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-extrabold text-white bg-red-500 rounded-full animate-pulse shadow-sm">
                  {unreadCount}
                </span>
              )}
            </Link>
          </nav>
        </div>

        <div className="mt-8 flex-shrink-0 pt-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center text-red-500 font-medium p-2 rounded-lg transition-colors duration-200 hover:bg-red-50 hover:text-red-600 w-full text-left"
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            Log Out
          </button>
        </div>

        {/* Mobile Close Button */}
        <button
          onClick={() => setIsMobileMenuOpen && setIsMobileMenuOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </aside>
    </>
  );
};

export default Sidebar;

const Navbar = ({ headData, activeTab, children }) => {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const dispatch = useAppDispatch();

  // Get user data from localStorage
  const userName = localStorage.getItem("name") || "User";
  const userRole = localStorage.getItem("role") || "Admin";
  const userImage = localStorage.getItem("profileImage");

  const handleLogout = async () => {
    try {
      // Clear localStorage
      localStorage.removeItem("accessToken");
      localStorage.removeItem("role");
      localStorage.removeItem("profileImage");
      localStorage.removeItem("name");

      // Clear Context API auth state
      setAuth({});

      // Clear Redux auth state
      dispatch(clearCredentials());

      // Navigate to login page
      navigate("/login");

      console.log("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      // Even if there's an error, still clear local data and redirect
      localStorage.clear();
      setAuth({});
      dispatch(clearCredentials());
      navigate("/login");
    }
  };

  return (
    <div className="sticky top-0 -mt-3 pt-3 pb-3 z-30 bg-gray-100 -mx-3 px-3 mb-6 border-b border-gray-200">
      <header className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${children ? 'mb-4' : ''}`}>
        <div className="flex flex-col">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">{headData}</h1>
          <p className="text-xs sm:text-sm text-gray-500">{headData} &gt; {activeTab}</p>
        </div>
        <div className="flex items-center space-x-4 border border-gray-600 rounded-md p-2 w-full sm:w-auto">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
              {userImage ? (
                <img
                  src={userImage}
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <RxPerson />
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-gray-800">{userName}</span>
              <span className="text-sm text-gray-500">{userRole}</span>
            </div>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
};

export { Navbar };


