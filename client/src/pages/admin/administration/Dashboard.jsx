import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Users,
  Layers,
  Award,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  Bell,
  Search,
  MoreVertical,
  BarChart2,
  Calendar,
  FileText,
  BookMarked,
  X
} from 'lucide-react';
import AdminService from '../../../services/admin-api-service/AdminService';
import useAuth from '../../../hooks/useAuth';

const PAGES_LIST = [
  { name: 'Dashboard', path: '/dashboard', category: 'General' },
  { name: 'Staff Management', path: '/staff-management', category: 'Administration' },
  { name: 'Student Management', path: '/student-management', category: 'Administration' },
  { name: 'Courses', path: '/courses', category: 'Course Management' },
  { name: 'Category', path: '/category', category: 'Course Management' },
  { name: 'Modules', path: '/modules', category: 'Syllabus Management' },
  { name: 'Topics', path: '/topics', category: 'Syllabus Management' },
  { name: 'Batches', path: '/batches', category: 'Schedule' },
  { name: 'Weekly Schedule', path: '/weekly-schedule', category: 'Schedule' },
  { name: 'Mentor Batches', path: '/mentor-batches', category: 'Schedule' },
  { name: 'Timings', path: '/timings', category: 'Schedule' },
  { name: 'Task Management', path: '/task-management', category: 'Task Management' },
  { name: 'Material', path: '/material', category: 'Task Management' },
  { name: 'Student Attendance', path: '/student-attendance', category: 'Attendance' },
  { name: 'Leave Request', path: '/leave-request', category: 'Attendance' },
  { name: 'Attendance Report', path: '/temp', category: 'Attendance' },
  { name: 'Static Pages', path: '/static-pages', category: 'Settings' },
  { name: 'Notifications', path: '/notification', category: 'Settings' },
  { name: 'Branch', path: '/branch', category: 'Settings' }
];

import dataScienceImg from '../../../assets/dashboard/DATA SCIENCE.jpg';
import dataAnalyticsImg from '../../../assets/dashboard/DATA ANALYTICS.jpeg';
import aiEngineeringImg from '../../../assets/dashboard/DATA SCIENCE & AI ENGINEERING.jpg';
import flutterImg from '../../../assets/dashboard/FLUTTER.png';

// Helper to get image for course based on name or index
const getCourseImage = (course, index = 0) => {
  if (course?.courseImage) return course.courseImage;
  if (course?.image) return course.image;
  if (course?.thumbnail) return course.thumbnail;

  const name = (course?.courseName || course?.title || '').toLowerCase();

  if (name.includes('ai') || name.includes('artificial') || name.includes('machine') || index === 2) {
    return aiEngineeringImg;
  }
  if (name.includes('analytic') || index === 1) {
    return dataAnalyticsImg;
  }
  if (name.includes('science') || index === 0) {
    return dataScienceImg;
  }
  if (name.includes('flutter') || name.includes('mobile') || index === 3) {
    return flutterImg;
  }
  return dataScienceImg;
};

// Component to render course thumbnail with image
const CourseThumbnail = ({ course, index }) => {
  const imgSrc = getCourseImage(course, index);
  const isFlutter = imgSrc === flutterImg;

  return (
    <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-slate-50 border border-slate-100/90 flex-shrink-0 overflow-hidden shadow-xs group-hover:shadow-sm transition">
      <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-xs text-[10px] font-bold text-gray-700 px-2 py-0.5 rounded-full shadow-2xs z-10">
        {course.courseType || 'Regular'}
      </span>
      <img
        src={imgSrc}
        alt={course.courseName || course.title || 'Course'}
        className={`w-full h-full ${
          isFlutter ? 'object-contain p-2 bg-white' : 'object-cover'
        } group-hover:scale-105 transition-transform duration-300`}
      />
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { auth, setAuth } = useAuth();
  const { getCoursesData, getInternsData, getBatchesData, getStaffData, getUserProfile } = AdminService();

  const [permissions, setPermissions] = useState(() => {
    try {
      const saved = localStorage.getItem("permissions");
      return saved ? JSON.parse(saved) : (auth?.permissions || null);
    } catch {
      return null;
    }
  });

  const userRole = (auth?.role || localStorage.getItem("role") || "").toLowerCase().trim();
  const isSuperAdminOrAdmin = ["super admin", "admin", "branch admin"].includes(userRole);

  const [statsData, setStatsData] = useState({ courses: 0, interns: 0, batches: 0, staff: 0 });
  const [recentCourses, setRecentCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courseFilter, setCourseFilter] = useState('All');

  // Track access permissions for dashboard sections
  const [access, setAccess] = useState({
    courses: true,
    batches: true,
    interns: true,
    staff: true
  });

  // Modal State
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef(null);

  // Fetch permissions if not already present in state/localStorage for staff
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!isSuperAdminOrAdmin && !permissions && token) {
      getUserProfile()
        .then((res) => {
          const userPerms = res?.data?.user?.permissions;
          if (userPerms) {
            setPermissions(userPerms);
            localStorage.setItem("permissions", JSON.stringify(userPerms));
            setAuth((prev) => ({ ...prev, permissions: userPerms }));
          }
        })
        .catch((err) => {
          console.error("Error fetching user permissions in Dashboard:", err);
        });
    }
  }, [isSuperAdminOrAdmin, permissions, setAuth]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredPages = PAGES_LIST.filter(page => {
    if (!isSuperAdminOrAdmin && permissions) {
      if (page.path === '/staff-management' && (!access.staff || !permissions?.mentorManagement?.viewMentor)) return false;
      if (page.path === '/student-management' && (!access.interns || !permissions?.studentManagement?.viewStudent)) return false;
      if (page.path === '/courses' && (!access.courses || !permissions?.courseManagement?.viewCourse)) return false;
      if (page.path === '/batches' && (!access.batches || !permissions?.batchManagement?.viewBatch)) return false;
      if (page.path === '/mentor-batches' && (!access.batches || !permissions?.batchManagement?.viewBatch)) return false;
      if (page.path === '/student-attendance' && (!access.interns || !permissions?.studentManagement?.viewStudent)) return false;
      if (page.path === '/temp' && (!access.interns || !permissions?.studentManagement?.viewStudent)) return false;
      if (page.path === '/category' && !permissions?.categoryManagement?.viewCategory) return false;
      if (page.path === '/modules' && !permissions?.moduleManagement?.viewModule) return false;
      if (page.path === '/topics' && !permissions?.topicManagement?.viewTopic) return false;
      if (page.path === '/weekly-schedule' && !permissions?.weeklySchedule?.viewSchedule) return false;
      if (page.path === '/timings' && !permissions?.scheduleTiming?.viewTiming) return false;
      if (page.path === '/task-management' && !permissions?.taskManagement?.viewTask) return false;
      if (page.path === '/material' && !permissions?.materialManagement?.viewMaterial) return false;
      if (page.path === '/leave-request' && !permissions?.leaveRequest?.viewLeave) return false;
      if (page.path === '/static-pages' && !permissions?.staticPage?.viewPage) return false;
      if (page.path === '/branch') return false;
    }
    return (
      page.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleViewDetails = (course) => {
    setSelectedCourse(course);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCourse(null);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const canFetchCourses = isSuperAdminOrAdmin || (permissions ? Boolean(permissions?.courseManagement?.viewCourse) : true);
        const canFetchBatches = isSuperAdminOrAdmin || (permissions ? Boolean(permissions?.batchManagement?.viewBatch) : true);
        const canFetchInterns = isSuperAdminOrAdmin || (permissions ? Boolean(permissions?.studentManagement?.viewStudent) : true);
        const canFetchStaff = isSuperAdminOrAdmin || (permissions ? Boolean(permissions?.mentorManagement?.viewMentor) : true);

        // Fetch each endpoint independently so a blocked 403 doesn't abort courses or batches
        const [coursesRes, batchesRes, internsRes, staffRes] = await Promise.all([
          canFetchCourses
            ? getCoursesData().catch((err) => {
                console.warn("Courses fetch blocked or failed:", err?.response?.status || err.message);
                return null;
              })
            : Promise.resolve(null),
          canFetchBatches
            ? getBatchesData().catch((err) => {
                console.warn("Batches fetch blocked or failed:", err?.response?.status || err.message);
                return null;
              })
            : Promise.resolve(null),
          canFetchInterns
            ? getInternsData().catch((err) => {
                console.warn("Interns fetch blocked or failed:", err?.response?.status || err.message);
                return null;
              })
            : Promise.resolve(null),
          canFetchStaff
            ? getStaffData().catch((err) => {
                console.warn("Staff fetch blocked or failed:", err?.response?.status || err.message);
                return null;
              })
            : Promise.resolve(null)
        ]);

        const courses = coursesRes?.data || [];
        const batches = batchesRes?.data || [];
        const interns = internsRes?.data || [];
        const staff = staffRes?.data || [];

        const coursesCount = (canFetchCourses && coursesRes) ? (coursesRes?.pagination?.totalCount ?? (Array.isArray(courses) ? courses.length : 0)) : 0;
        const batchesCount = (canFetchBatches && batchesRes) ? (batchesRes?.pagination?.totalCount ?? (Array.isArray(batches) ? batches.length : 0)) : 0;
        const internsCount = (canFetchInterns && internsRes) ? (internsRes?.pagination?.totalCount ?? (Array.isArray(interns) ? interns.length : 0)) : 0;
        const staffCount = (canFetchStaff && staffRes) ? (staffRes?.pagination?.totalCount ?? (Array.isArray(staff) ? staff.length : 0)) : 0;

        setStatsData({
          courses: coursesCount,
          batches: batchesCount,
          interns: internsCount,
          staff: staffCount
        });

        if (Array.isArray(courses)) {
          setRecentCourses(courses.slice(0, 4));
        }

        setAccess({
          courses: canFetchCourses && coursesRes !== null,
          batches: canFetchBatches && batchesRes !== null,
          interns: canFetchInterns && internsRes !== null,
          staff: canFetchStaff && staffRes !== null
        });
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [permissions, isSuperAdminOrAdmin]);

  return (
    <div className="min-h-screen bg-[#f8fafd] text-gray-800 font-sans p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* 1. TOP HEADER / GREETING BANNER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="flex flex-wrap items-baseline gap-2">
                <span className="text-xl sm:text-2xl lg:text-3xl font-medium text-slate-500">
                  Welcome back,
                </span>
                <span className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 inline-flex items-center">
                  Softronii
                  <svg
                    className="inline-block h-[0.78em] w-auto ml-1"
                    viewBox="530 0 111 98"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fill="#231f20"
                      d="m533.84,8.89l34.88,37.52c1.41,1.52,1.41,3.88-.02,5.39l-34.76,36.86c-2.37,2.52-.59,6.65,2.87,6.65h16.14c1.13,0,2.21-.49,2.96-1.34l37.41-42.54c1.32-1.51,1.31-3.77-.04-5.25l-38.69-42.62c-.75-.82-1.81-1.29-2.92-1.29h-14.94c-3.44,0-5.23,4.1-2.89,6.63Z"
                    />
                    <path
                      fill="#ff6f3c"
                      d="m592.65,29.07l10.42,10.87c1.35,1.41,3.6,1.4,4.94,0l30.32-31.89c2.07-2.18.53-5.77-2.48-5.77h-20.29c-.92,0-1.81.37-2.45,1.03l-20.45,21.02c-1.28,1.32-1.29,3.42-.02,4.75Z"
                    />
                    <path
                      fill="#ff6f3c"
                      d="m593.97,67.64l10.42-10.87c1.35-1.41,3.6-1.4,4.94,0l30.32,31.89c2.07,2.18.53,5.77-2.48,5.77h-20.29c-.92,0-1.81-.37-2.45-1.03l-20.45-21.02c-1.28-1.32-1.29-3.42-.02-4.75Z"
                    />
                  </svg>
                </span>
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 font-medium mt-1">
              Manage courses, interns, staff, and daily operations efficiently from one place.
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Elegant Search Bar */}
            <div className="relative w-full sm:w-80" ref={searchRef}>
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search pages, courses, or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200/80 rounded-full text-xs sm:text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all shadow-xs"
              />

              {isSearchFocused && (
                <div className="absolute right-0 top-full mt-2 w-full bg-white border border-gray-200 rounded-2xl shadow-xl z-50 p-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 pb-2 pt-1 border-b border-gray-100 flex items-center justify-between">
                    <span>Quick Navigation</span>
                    <span className="text-[9px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-semibold font-mono">
                      {filteredPages.length} result(s)
                    </span>
                  </div>
                  {filteredPages.length > 0 ? (
                    <div className="mt-1.5 space-y-0.5 max-h-60 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                      {filteredPages.map((page) => (
                        <button
                          key={page.path}
                          onClick={() => {
                            navigate(page.path);
                            setIsSearchFocused(false);
                          }}
                          className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors flex items-center justify-between group"
                        >
                          <span className="truncate pr-2">{page.name}</span>
                          <span className="text-[9px] font-bold bg-gray-50 text-gray-400 px-2 py-0.5 rounded-md uppercase group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors shrink-0">
                            {page.category}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-xs text-gray-400 font-medium italic">
                      No matching pages found.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Notification Button */}
            <button
              onClick={() => navigate('/notification')}
              className="relative p-2.5 bg-white border border-gray-200/80 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition shadow-xs flex-shrink-0"
              title="Notifications"
            >
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </button>
          </div>
        </header>

        {/* 2. STATS GRID (All 4 Cards Always Displayed) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Total Courses */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs relative overflow-hidden flex items-center min-h-[105px] hover:shadow-md transition">
            <div className="flex items-center gap-3.5 z-10">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-orange-100 text-orange-500 flex items-center justify-center shrink-0">
                <BookOpen size={24} />
              </div>
              <div>
                <p className="text-xs sm:text-[13px] font-semibold text-slate-500">Total Courses</p>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight mt-0.5">
                  {access.courses ? statsData.courses : 0}
                </p>
                <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                  {access.courses ? "+2 this month" : "0 this month"}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                if (access.courses) navigate('/courses');
              }}
              disabled={!access.courses}
              className={`absolute top-3.5 right-3.5 w-7 h-7 rounded-full border border-slate-100 bg-white flex items-center justify-center shadow-xs transition z-20 ${
                access.courses
                  ? 'text-slate-600 hover:text-orange-500 hover:border-orange-200 cursor-pointer'
                  : 'text-slate-300 opacity-60 cursor-not-allowed'
              }`}
              title={access.courses ? "View Courses" : "Access Restricted"}
            >
              <ArrowRight size={13} strokeWidth={2.2} />
            </button>
          </div>

          {/* Card 2: Total Interns */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs relative overflow-hidden flex items-center min-h-[105px] hover:shadow-md transition">
            <div className="flex items-center gap-3.5 z-10">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-orange-100 text-orange-500 flex items-center justify-center shrink-0">
                <Users size={24} />
              </div>
              <div>
                <p className="text-xs sm:text-[13px] font-semibold text-slate-500">Total Interns</p>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight mt-0.5">
                  {access.interns ? statsData.interns : 0}
                </p>
                <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                  {access.interns ? "+3 this month" : "0 this month"}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                if (access.interns) navigate('/student-management');
              }}
              disabled={!access.interns}
              className={`absolute top-3.5 right-3.5 w-7 h-7 rounded-full border border-slate-100 bg-white flex items-center justify-center shadow-xs transition z-20 ${
                access.interns
                  ? 'text-slate-600 hover:text-orange-500 hover:border-orange-200 cursor-pointer'
                  : 'text-slate-300 opacity-60 cursor-not-allowed'
              }`}
              title={access.interns ? "View Interns" : "Access Restricted"}
            >
              <ArrowRight size={13} strokeWidth={2.2} />
            </button>
          </div>

          {/* Card 3: Active Batches */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs relative overflow-hidden flex items-center min-h-[105px] hover:shadow-md transition">
            <div className="flex items-center gap-3.5 z-10">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-orange-100 text-orange-500 flex items-center justify-center shrink-0">
                <Layers size={24} />
              </div>
              <div>
                <p className="text-xs sm:text-[13px] font-semibold text-slate-500">Active Batches</p>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight mt-0.5">
                  {access.batches ? statsData.batches : 0}
                </p>
                <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                  {access.batches ? "2 ongoing" : "0 ongoing"}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                if (access.batches) navigate('/batches');
              }}
              disabled={!access.batches}
              className={`absolute top-3.5 right-3.5 w-7 h-7 rounded-full border border-slate-100 bg-white flex items-center justify-center shadow-xs transition z-20 ${
                access.batches
                  ? 'text-slate-600 hover:text-orange-500 hover:border-orange-200 cursor-pointer'
                  : 'text-slate-300 opacity-60 cursor-not-allowed'
              }`}
              title={access.batches ? "View Batches" : "Access Restricted"}
            >
              <ArrowRight size={13} strokeWidth={2.2} />
            </button>
          </div>

          {/* Card 4: Total Staff */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs relative overflow-hidden flex items-center min-h-[105px] hover:shadow-md transition">
            <div className="flex items-center gap-3.5 z-10">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-orange-100 text-orange-500 flex items-center justify-center shrink-0">
                <Users size={24} />
              </div>
              <div>
                <p className="text-xs sm:text-[13px] font-semibold text-slate-500">Total Staff</p>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight mt-0.5">
                  {access.staff ? statsData.staff : 0}
                </p>
                <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                  {access.staff ? "+1 this month" : "0 this month"}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                if (access.staff) navigate('/staff-management');
              }}
              disabled={!access.staff}
              className={`absolute top-3.5 right-3.5 w-7 h-7 rounded-full border border-slate-100 bg-white flex items-center justify-center shadow-xs transition z-20 ${
                access.staff
                  ? 'text-slate-600 hover:text-orange-500 hover:border-orange-200 cursor-pointer'
                  : 'text-slate-300 opacity-60 cursor-not-allowed'
              }`}
              title={access.staff ? "View Staff" : "Access Restricted"}
            >
              <ArrowRight size={13} strokeWidth={2.2} />
            </button>
          </div>
        </section>

        {/* 3. MAIN DASHBOARD CONTENT (2 COLUMNS) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Latest Courses (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Header row with filter pills */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Latest Courses</h2>

              <div className="flex items-center gap-3">
                {/* Filter Pills */}
                <div className="flex items-center bg-gray-100/70 p-1 rounded-full text-xs">
                  {['All', 'Popular', 'Ongoing', 'Upcoming'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setCourseFilter(tab)}
                      className={`px-3.5 py-1 rounded-full font-semibold transition-all ${
                        courseFilter === tab
                          ? 'bg-orange-500 text-white shadow-xs'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* See All Button */}
                <button
                  onClick={() => navigate('/courses')}
                  className="border border-orange-200/80 rounded-full px-3.5 py-1.5 text-xs font-semibold text-orange-600 hover:bg-orange-50 transition flex items-center gap-1 shadow-2xs"
                >
                  See all <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Courses 2x2 Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {loading ? (
                <div className="col-span-2 text-center text-gray-400 py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
                  <p className="text-xs">Loading courses...</p>
                </div>
              ) : !access.courses ? (
                <div className="col-span-2 text-center text-gray-400 py-16 bg-white rounded-2xl border border-gray-100">
                  <BookOpen size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm font-medium">Course viewing is restricted for your role.</p>
                </div>
              ) : recentCourses.length === 0 ? (
                <div className="col-span-2 text-center text-gray-400 py-16 bg-white rounded-2xl border border-gray-100">
                  <BookOpen size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm font-medium">No courses available.</p>
                </div>
              ) : (
                recentCourses.map((course, idx) => (
                  <div
                    key={course._id || course.id || idx}
                    className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-md transition flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex gap-4 items-start">
                        {/* 3D Course Thumbnail */}
                        <CourseThumbnail course={course} index={idx} />

                        {/* Course Details Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium text-gray-400 truncate">
                              Duration: {course.duration || '6 Months'}
                            </span>
                            <button
                              onClick={() => handleViewDetails(course)}
                              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-50 transition"
                              title="Options"
                            >
                              <MoreVertical size={15} />
                            </button>
                          </div>

                          <h3 className="text-sm font-bold text-gray-900 mt-1 uppercase tracking-tight line-clamp-1 group-hover:text-orange-600 transition-colors">
                            {course.courseName || course.title}
                          </h3>

                          <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                            {course.description || course.overview || 'Learn in-depth concepts, practical implementations, and real-world projects.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Footer Metrics & CTA */}
                    <div className="flex items-center justify-between mt-5 pt-3.5 border-t border-gray-50">
                      <div className="flex items-center gap-4">
                        {/* Modules */}
                        <div className="flex items-center gap-2">
                          <Layers size={14} className="text-gray-400 flex-shrink-0" />
                          <div>
                            <span className="text-gray-400 block text-[10px] font-medium leading-none">Modules</span>
                            <span className="font-bold text-gray-800 text-xs mt-0.5 block leading-none">
                              {course.totalModules || (course.modules?.length) || 0}
                            </span>
                          </div>
                        </div>

                        {/* Enrolled */}
                        <div className="flex items-center gap-2">
                          <Users size={14} className="text-gray-400 flex-shrink-0" />
                          <div>
                            <span className="text-gray-400 block text-[10px] font-medium leading-none">Enrolled</span>
                            <span className="font-bold text-gray-800 text-xs mt-0.5 block leading-none">
                              {course.enrolledCount || 0}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* View Details Button */}
                      <button
                        onClick={() => handleViewDetails(course)}
                        className="bg-orange-50 hover:bg-orange-500 hover:text-white text-orange-600 text-xs font-semibold px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-2xs"
                      >
                        View Details <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Weekly Activity & Upcoming Test Banner (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">

            {/* 1. Weekly Activity Card */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <BarChart2 size={18} className="text-orange-500" />
                  <h3 className="text-sm sm:text-base font-bold text-gray-900">Weekly Activity</h3>
                </div>
                <div className="border border-gray-200 rounded-lg px-2.5 py-1 text-xs text-gray-600 font-medium flex items-center gap-1 bg-white hover:bg-gray-50 cursor-pointer shadow-2xs">
                  <span>This Week</span>
                  <ChevronDown size={14} className="text-gray-400" />
                </div>
              </div>

              {/* Day Progress Bars */}
              <div className="space-y-3">
                {[
                  { day: 'Mon', hours: '2.5h', width: '52%' },
                  { day: 'Tue', hours: '1.2h', width: '28%' },
                  { day: 'Wed', hours: '4.0h', width: '85%' },
                  { day: 'Thu', hours: '0.5h', width: '12%' },
                  { day: 'Fri', hours: '3.1h', width: '68%' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1">
                    <span className="text-gray-500 font-medium w-8">{item.day}</span>
                    <div className="flex-1 bg-gray-100 h-2.5 rounded-full overflow-hidden mx-3">
                      <div
                        className="bg-gradient-to-r from-orange-400 to-orange-500 h-full rounded-full transition-all duration-500"
                        style={{ width: item.width }}
                      ></div>
                    </div>
                    <span className="text-gray-600 font-semibold w-8 text-right">{item.hours}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Upcoming Test Banner */}
            <div className="bg-gradient-to-br from-[#f97316] via-[#fb923c] via-35% to-[#fef08a] text-white p-6 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
              {/* Soft ambient luminous wash that smoothly decreases darkness from top-left to bottom-right */}
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-white/20 pointer-events-none"></div>
              <div className="absolute -right-6 -bottom-6 w-48 h-48 bg-white/30 rounded-full blur-2xl pointer-events-none"></div>

              <div className="relative z-10 max-w-[210px]">
                {/* Top Badge */}
                <div className="flex items-center gap-2">
                  <Calendar size={15} className="text-white/95" />
                  <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-xs shadow-2xs">
                    UPCOMING TEST
                  </span>
                </div>

                <h4 className="text-base sm:text-lg font-bold text-white mt-3 leading-snug drop-shadow-xs">
                  MERN Stack Capstone Architecture
                </h4>

                <div className="space-y-1.5 mt-3 text-xs text-white/90 font-medium">
                  <div className="flex items-center gap-2">
                    <Calendar size={13} className="text-white/90" />
                    <span>Due: May 25th at 11:59 PM</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText size={13} className="text-white/90" />
                    <span>Final Assessment</span>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/task-management')}
                  className="mt-5 bg-white text-orange-600 font-bold px-4 py-2 rounded-xl text-xs hover:bg-orange-50 transition shadow-xs inline-flex items-center gap-1.5"
                >
                  Prepare Now <ArrowRight size={13} />
                </button>
              </div>

              {/* 3D Notepad & Alarm Clock Graphic on Right */}
              <div className="absolute right-3 bottom-4 pointer-events-none z-10">
                <svg viewBox="0 0 110 110" className="w-24 h-24">
                  {/* Notepad */}
                  <rect x="25" y="15" width="55" height="75" rx="8" fill="#ffffff" />
                  <line x1="35" y1="30" x2="65" y2="30" stroke="#f97316" strokeWidth="3" strokeLinecap="round" />
                  <line x1="35" y1="42" x2="60" y2="42" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="35" y1="52" x2="65" y2="52" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="35" y1="62" x2="55" y2="62" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
                  {/* Alarm clock */}
                  <circle cx="78" cy="74" r="16" fill="#1e1b4b" stroke="#ffffff" strokeWidth="2.5" />
                  <path d="M78 65 L78 74 L84 74" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="70" cy="58" r="3" fill="#cbd5e1" />
                  <circle cx="86" cy="58" r="3" fill="#cbd5e1" />
                </svg>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* COURSE DETAILS MODAL */}
      {isModalOpen && selectedCourse && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 transition-opacity duration-300">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transform scale-100 transition-transform duration-300">
            {/* Modal Header */}
            <div className="relative h-36 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 p-6 flex items-end overflow-hidden">
              {getCourseImage(selectedCourse) && (
                <img
                  src={getCourseImage(selectedCourse)}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-overlay pointer-events-none"
                />
              )}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-md transition-all z-10"
              >
                <X size={20} />
              </button>
              <div className="text-white w-full relative z-10">
                <span className="bg-white/20 backdrop-blur-md text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider mb-2 inline-block shadow-sm">
                  {selectedCourse.courseType || 'Course'}
                </span>
                <h2 className="text-2xl font-bold leading-tight drop-shadow-sm truncate" title={selectedCourse.courseName}>
                  {selectedCourse.courseName || 'Course Details'}
                </h2>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-400 font-medium uppercase">Duration</p>
                  <p className="text-sm font-bold text-slate-800 mt-1">{selectedCourse.duration || 'N/A'}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-400 font-medium uppercase">Fee</p>
                  <p className="text-sm font-bold text-slate-800 mt-1">₹{selectedCourse.courseFee || 0}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-400 font-medium uppercase">Category</p>
                  <p className="text-sm font-bold text-slate-800 mt-1 truncate" title={selectedCourse.category?.categoryName}>
                    {selectedCourse.category?.categoryName || 'N/A'}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-400 font-medium uppercase">Modules</p>
                  <p className="text-sm font-bold text-slate-800 mt-1">{selectedCourse.totalModules || 0}</p>
                </div>
              </div>

              {/* Modules List */}
              <div>
                <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <BookMarked size={18} className="text-orange-500" />
                  Course Curriculum
                </h3>
                {selectedCourse.modules && selectedCourse.modules.length > 0 ? (
                  <div className="space-y-3">
                    {selectedCourse.modules.map((mod, idx) => (
                      <div
                        key={mod._id || idx}
                        className="flex items-start justify-between p-3 rounded-xl border border-slate-100 hover:border-orange-200 hover:bg-orange-50/50 transition-colors group"
                      >
                        <div className="flex gap-3 items-center">
                          <div className="bg-orange-100 text-orange-600 font-bold w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm group-hover:text-orange-600 transition-colors">
                              {mod.moduleName}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {mod.totalTopics || 0} Topics included
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-6 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                    <p className="text-sm text-slate-500">No modules have been added to this course yet.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 p-4 bg-slate-50 flex justify-end">
              <button
                onClick={closeModal}
                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-100 transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
