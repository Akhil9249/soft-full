import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { RxPerson } from "react-icons/rx";
import useAuth from "../../hooks/useAuth";
import { useAppDispatch } from "../../redux/hooks";
import { logoutUser, clearCredentials } from "../../redux/slices/authSlice";

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

  console.log("Auth object:", auth);
  
  // const [isOpen, setIsOpen] = useState(false);
  // const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [openSections, setOpenSections] = useState({
    administration: true,
    course: false,
    syllabus: false,
    task: false,
    schedule: false,
    attendance: false,
    settings: false,
  });

  // Track active navigation item
  const [activeNavItem, setActiveNavItem] = useState('');

  const toggleSection = (section) => {
    setOpenSections(prevState => ({
      ...prevState,
      [section]: !prevState[section],
    }));
  };

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
        w-64 bg-white p-6 shadow-md flex flex-col justify-between rounded-r-2xl h-screen overflow-hidden z-50
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
          <span className="text-xl font-bold text-gray-800">Softronics</span>
        </div>
        <nav className="space-y-4">
          <a href="#" className="flex items-center text-gray-600 hover:text-orange-500 font-medium p-2 rounded-lg transition-colors duration-200">
            {/* <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7-8v8m14-8v8"></path></svg> */}
            <LayoutDashboard className="w-5 h-5 mr-3" />
            
            
            Dashboard
          </a>

          <div className={`font-medium ${openSections.administration ? 'text-orange-500' : 'text-gray-600'}`}>
            <div onClick={() => toggleSection('administration')} className="flex items-center cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200">
              {/* <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h6z"></path></svg> */}
              <Users className="w-5 h-5 mr-3" />
              Administration
              <svg className={`ml-auto w-4 h-4 transform transition-transform duration-200 ${openSections.administration ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
              </svg>
            </div>
            {openSections.administration && (
              <ul className="pl-8 mt-2 space-y-2 text-sm text-gray-500">
                {/* Role Management - Only for Super Admin */}
                {auth?.role?.toLowerCase() === "super admin" && (
                  <li>
                    <Link 
                      to="/" 
                      onClick={() => handleNavItemClick('/')}
                      className={`block py-1 px-2 rounded-md transition-colors duration-200 ${
                        activeNavItem === '/' 
                          ? 'bg-orange-100 text-orange-600 font-semibold' 
                          : ' font-semibold hover:bg-orange-50 hover:text-orange-600'
                      }`}
                    >
                      Role Management
                    </Link>
                  </li>
                )}
                
                {/* Staff Management - Only for Super Admin and Admin */}
                {(auth?.role?.toLowerCase() === "super admin" || auth?.role?.toLowerCase() === "admin") && (
                  <li>
                      <Link 
                        to="/staff-management" 
                        onClick={() => handleNavItemClick('/staff-management')}
                        className={`block py-1 px-2 rounded-md transition-colors duration-200 ${
                          activeNavItem === '/staff-management' 
                            ? 'bg-orange-100 text-orange-600 font-semibold' 
                            : 'hover:text-orange-500 hover:bg-orange-50'
                        }`}
                      >
                        Staff Management
                      </Link>
                    </li>
                )}
                
                {/* Intern Management - Available for all roles */}
                <li>
                  <Link 
                    to="/student-management" 
                    onClick={() => handleNavItemClick('/student-management')}
                    className={`block py-1 px-2 rounded-md transition-colors duration-200 ${
                      activeNavItem === '/student-management' 
                        ? 'bg-orange-100 text-orange-600 font-semibold' 
                        : 'hover:text-orange-500 hover:bg-orange-50'
                    }`}
                  >
                    Intern Management
                  </Link>
                </li>
              </ul>
            )}
          </div>

          <div className={`font-medium ${openSections.course ? 'text-orange-500' : 'text-gray-600'}`}>
            <div onClick={() => toggleSection('course')} className="flex items-center cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200">
              {/* <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h6z"></path></svg> */}
              <Book className="w-5 h-5 mr-3" />
              Course management
              <svg className={`ml-auto w-4 h-4 transform transition-transform duration-200 ${openSections.course ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
              </svg>
            </div>
            {openSections.course && (
              <ul className="pl-8 mt-2 space-y-2 text-sm text-gray-500">
                <li>
                  <Link 
                    to="/category" 
                    onClick={() => handleNavItemClick('/category')}
                    className={`block py-1 px-2 rounded-md transition-colors duration-200 ${
                      activeNavItem === '/category' 
                        ? 'bg-orange-100 text-orange-600 font-semibold' 
                        : 'hover:text-orange-500 hover:bg-orange-50'
                    }`}
                  >
                    Categories
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/courses" 
                    onClick={() => handleNavItemClick('/courses')}
                    className={`block py-1 px-2 rounded-md transition-colors duration-200 ${
                      activeNavItem === '/courses' 
                        ? 'bg-orange-100 text-orange-600 font-semibold' 
                        : 'hover:text-orange-500 hover:bg-orange-50'
                    }`}
                  >
                    Courses
                  </Link>
                </li>
              </ul>
            )}
          </div>

          <div className={`font-medium ${openSections.syllabus ? 'text-orange-500' : 'text-gray-600'}`}>
            <div onClick={() => toggleSection('syllabus')} className="flex items-center cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200">
              {/* <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h6z"></path></svg> */}
              <FileText className="w-5 h-5 mr-3" />

              Syllabus Management
              <svg className={`ml-auto w-4 h-4 transform transition-transform duration-200 ${openSections.syllabus ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
              </svg>
            </div>
            {openSections.syllabus && (
              <ul className="pl-8 mt-2 space-y-2 text-sm text-gray-500">
                <li>
                  <Link 
                    to="/modules" 
                    onClick={() => handleNavItemClick('/modules')}
                    className={`block py-1 px-2 rounded-md transition-colors duration-200 ${
                      activeNavItem === '/modules' 
                        ? 'bg-orange-100 text-orange-600 font-semibold' 
                        : 'hover:text-orange-500 hover:bg-orange-50'
                    }`}
                  >
                    Modules
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/topics" 
                    onClick={() => handleNavItemClick('/topics')}
                    className={`block py-1 px-2 rounded-md transition-colors duration-200 ${
                      activeNavItem === '/topics' 
                        ? 'bg-orange-100 text-orange-600 font-semibold' 
                        : 'hover:text-orange-500 hover:bg-orange-50'
                    }`}
                  >
                    Topics
                  </Link>
                </li>
              </ul>
            )}
          </div>

          <div className={`font-medium ${openSections.task ? 'text-orange-500' : 'text-gray-600'}`}>
            <div onClick={() => toggleSection('task')} className="flex items-center cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200">
              <SquarePen className="w-5 h-5 mr-3" />
              Task Management
              <svg className={`ml-auto w-4 h-4 transform transition-transform duration-200 ${openSections.task ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
              </svg>
            </div>
            {openSections.task && (
              <ul className="pl-8 mt-2 space-y-2 text-sm text-gray-500">
                <li>
                  <Link 
                    to="/task-management" 
                    onClick={() => handleNavItemClick('/task-management')}
                    className={`block py-1 px-2 rounded-md transition-colors duration-200 ${
                      activeNavItem === '/task-management' 
                        ? 'bg-orange-100 text-orange-600 font-semibold' 
                        : 'hover:text-orange-500 hover:bg-orange-50'
                    }`}
                  >
                    Task
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/material" 
                    onClick={() => handleNavItemClick('/material')}
                    className={`block py-1 px-2 rounded-md transition-colors duration-200 ${
                      activeNavItem === '/material' 
                        ? 'bg-orange-100 text-orange-600 font-semibold' 
                        : 'hover:text-orange-500 hover:bg-orange-50'
                    }`}
                  >
                    Material
                  </Link>
                </li>
              </ul>
            )}
          </div>

          <div className={`font-medium ${openSections.schedule ? 'text-orange-500' : 'text-gray-600'}`}>
            <div onClick={() => toggleSection('schedule')} className="flex items-center cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200">
              {/* <Icon path="M12 6V4m0 2a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h6z" className="w-5 h-5 mr-3" /> */}
              <Calendar className="w-5 h-5 mr-3" />

              Schedule
              <svg className={`ml-auto w-4 h-4 transform transition-transform duration-200 ${openSections.schedule ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
              </svg>
            </div>
            {openSections.schedule && (
              <ul className="pl-8 mt-2 space-y-2 text-sm text-gray-500">
                <li>
                  <Link 
                    to="/batches" 
                    onClick={() => handleNavItemClick('/batches')}
                    className={`block py-1 px-2 rounded-md transition-colors duration-200 ${
                      activeNavItem === '/batches' 
                        ? 'bg-orange-100 text-orange-600 font-semibold' 
                        : 'hover:text-orange-500 hover:bg-orange-50'
                    }`}
                  >
                    Batches
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/timings" 
                    onClick={() => handleNavItemClick('/timings')}
                    className={`block py-1 px-2 rounded-md transition-colors duration-200 ${
                      activeNavItem === '/timings' 
                        ? 'bg-orange-100 text-orange-600 font-semibold' 
                        : 'hover:text-orange-500 hover:bg-orange-50'
                    }`}
                  >
                    Timings
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/weekly-schedule" 
                    onClick={() => handleNavItemClick('/weekly-schedule')}
                    className={`block py-1 px-2 rounded-md transition-colors duration-200 ${
                      activeNavItem === '/weekly-schedule' 
                        ? 'bg-orange-100 text-orange-600 font-semibold' 
                        : 'hover:text-orange-500 hover:bg-orange-50'
                    }`}
                  >
                    Weekly Schedule
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/mentor-batches" 
                    onClick={() => handleNavItemClick('/mentor-batches')}
                    className={`block py-1 px-2 rounded-md transition-colors duration-200 ${
                      activeNavItem === '/mentor-batches' 
                        ? 'bg-orange-100 text-orange-600 font-semibold' 
                        : 'hover:text-orange-500 hover:bg-orange-50'
                    }`}
                  >
                    Mentor Batches
                  </Link>
                </li>
              </ul>
            )}
          </div>

          <div className={`font-medium ${openSections.attendance ? 'text-orange-500' : 'text-gray-600'}`}>
            <div onClick={() => toggleSection('attendance')} className="flex items-center cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200">
              <Calendar className="w-5 h-5 mr-3" />
              Attendance
              <svg className={`ml-auto w-4 h-4 transform transition-transform duration-200 ${openSections.attendance ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
              </svg>
            </div>
            {openSections.attendance && (
              <ul className="pl-8 mt-2 space-y-2 text-sm text-gray-500">
                <li>
                  <Link 
                    to="/student-attendance" 
                    onClick={() => handleNavItemClick('/student-attendance')}
                    className={`block py-1 px-2 rounded-md transition-colors duration-200 ${
                      activeNavItem === '/student-attendance' 
                        ? 'bg-orange-100 text-orange-600 font-semibold' 
                        : 'hover:text-orange-500 hover:bg-orange-50'
                    }`}
                  >
                    Student Attendance
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/leave-request" 
                    onClick={() => handleNavItemClick('/leave-request')}
                    className={`block py-1 px-2 rounded-md transition-colors duration-200 ${
                      activeNavItem === '/leave-request' 
                        ? 'bg-orange-100 text-orange-600 font-semibold' 
                        : 'hover:text-orange-500 hover:bg-orange-50'
                    }`}
                  >
                    Leave Request
                  </Link>
                </li>
              </ul>
            )}
          </div>

          <div className={`font-medium ${openSections.settings ? 'text-orange-500' : 'text-gray-600'}`}>
            <div onClick={() => toggleSection('settings')} className="flex items-center cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200">
              {/* <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h6z"></path></svg> */}
              <Settings className="w-5 h-5 mr-3" />

              Settings
              <svg className={`ml-auto w-4 h-4 transform transition-transform duration-200 ${openSections.settings ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
              </svg>
            </div>
            {openSections.settings && (
              <ul className="pl-8 mt-2 space-y-2 text-sm text-gray-500">
                <li>
                  <Link 
                    to="/static-pages" 
                    onClick={() => handleNavItemClick('/static-pages')}
                    className={`block py-1 px-2 rounded-md transition-colors duration-200 ${
                      activeNavItem === '/static-pages' 
                        ? 'bg-orange-100 text-orange-600 font-semibold' 
                        : 'hover:text-orange-500 hover:bg-orange-50'
                    }`}
                  >
                    Static Page
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/notification" 
                    onClick={() => handleNavItemClick('/notification')}
                    className={`block py-1 px-2 rounded-md transition-colors duration-200 ${
                      activeNavItem === '/notification' 
                        ? 'bg-orange-100 text-orange-600 font-semibold' 
                        : 'hover:text-orange-500 hover:bg-orange-50'
                    }`}
                  >
                    Notification
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/branch" 
                    onClick={() => handleNavItemClick('/branch')}
                    className={`block py-1 px-2 rounded-md transition-colors duration-200 ${
                      activeNavItem === '/branch' 
                        ? 'bg-orange-100 text-orange-600 font-semibold' 
                        : 'hover:text-orange-500 hover:bg-orange-50'
                    }`}
                  >
                    Branch
                  </Link>
                </li>
              </ul>
            )}
          </div>

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

const Navbar = ({headData , activeTab}) => {
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
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
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
  );
};

export { Navbar }; 
