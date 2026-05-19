import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  GraduationCap, 
  Clock, 
  Award, 
  TrendingUp, 
  Play, 
  ChevronRight,
  Bell,
  Search,
  LayoutDashboard,
  BookMarked,
  Settings,
  LogOut,
  X
} from 'lucide-react';
import AdminService from '../../../services/admin-api-service/AdminService';

export default function Dashboard() {
  const navigate = useNavigate();
  const { getCoursesData, getInternsData, getBatchesData, getStaffData } = AdminService();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [statsData, setStatsData] = useState({ courses: 0, interns: 0, batches: 0, staff: 0 });
  const [recentCourses, setRecentCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      try {
        const [coursesRes, batchesRes, internsRes, staffRes] = await Promise.all([
           getCoursesData(),
           getBatchesData(),
           getInternsData(),
           getStaffData()
        ]);
        
        const courses = coursesRes?.data || [];
        const batches = batchesRes?.data || [];
        const interns = internsRes?.data || [];
        const staff = staffRes?.data || [];
        
        const coursesCount = coursesRes?.pagination?.totalCount || courses.length || 0;
        const batchesCount = batchesRes?.pagination?.totalCount || batches.length || 0;
        const internsCount = internsRes?.pagination?.totalCount || interns.length || 0;
        const staffCount = staffRes?.pagination?.totalCount || staff.length || 0;
        
        setStatsData({
          courses: coursesCount,
          batches: batchesCount,
          interns: internsCount,
          staff: staffCount
        });
        
        setRecentCourses(courses.slice(0, 4));
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = [
    { id: 1, label: 'Total Courses', value: statsData.courses, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 2, label: 'Total Interns', value: statsData.interns, icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 3, label: 'Active Batches', value: statsData.batches, icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: 4, label: 'Total Staff', value: statsData.staff, icon: Award, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50/50 text-slate-900 font-sans">
      


      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
        
        {/* 2. TOP BAR / HEADER */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 drop-shadow-sm pb-1">
              Welcome back, Softroniics !
            </h1>
            {/* <p className="text-sm text-slate-500 mt-1">Here is a glance at your learning progress today.</p> */}
          </div>
          
          <div className="flex items-center gap-4">
            {/* Elegant Search Bar */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search your courses..." 
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            {/* Notification Badge */}
            <button className="relative p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-600 rounded-full"></span>
            </button>
          </div>
        </header>

        {/* 3. STATS GRID */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => {
            const IconComponent = stat.icon;
            return (
              <div key={stat.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                  <IconComponent size={22} />
                </div>
              </div>
            );
          })}
        </section>

        {/* 4. MAIN DASHBOARD CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left/Middle Column: Courses & Progress */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Latest Courses</h2>
              <button onClick={() => navigate('/courses')} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                See all <ChevronRight size={16} />
              </button>
            </div>

            {/* Course Cards Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {loading ? (
                <div className="col-span-2 text-center text-slate-500 py-10">Loading courses...</div>
              ) : recentCourses.length === 0 ? (
                <div className="col-span-2 text-center text-slate-500 py-10">No courses available.</div>
              ) : recentCourses.map((course) => (
                <div key={course._id || course.id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
                  <div>
                    {/* Thumbnail */}
                    <div className="relative h-40 overflow-hidden bg-slate-100 flex items-center justify-center">
                      <BookOpen className="text-indigo-200 group-hover:scale-110 transition-transform duration-300" size={64} />
                      <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-xs font-semibold px-2.5 py-1 rounded-md text-slate-800 shadow-sm">
                        {course.courseType || 'Course'}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <p className="text-xs text-slate-400 font-medium">Duration: {course.duration || 'N/A'}</p>
                      <h3 className="text-sm md:text-base font-bold text-slate-800 mt-1 line-clamp-2 leading-snug">
                        {course.courseName || course.title}
                      </h3>
                    </div>
                  </div>

                  {/* Progress bar and CTA footer */}
                  <div className="p-5 pt-0">
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-xs font-semibold text-slate-500">
                        <span>Modules</span>
                        <span className="text-indigo-600">{course.totalModules || 0}</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleViewDetails(course)}
                      className="w-full py-2.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2">
                      <ChevronRight size={14} className="group-hover:text-white" />
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Mini Analytics / Study Goals */}
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900">Weekly Activity</h2>
            
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="text-emerald-500" size={18} />
                  <span className="text-sm font-semibold text-slate-700">On track this week</span>
                </div>
                <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">+12%</span>
              </div>

              {/* Minimalist Visual Bars representation for activity */}
              <div className="space-y-3">
                {[
                  { day: 'Mon', hours: '2.5h', percentage: 80 },
                  { day: 'Tue', hours: '1.2h', percentage: 40 },
                  { day: 'Wed', hours: '4.0h', percentage: 100 },
                  { day: 'Thu', hours: '0.5h', percentage: 15 },
                  { day: 'Fri', hours: '3.1h', percentage: 90 },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 text-xs font-medium">
                    <span className="w-8 text-slate-400">{item.day}</span>
                    <div className="flex-1 bg-slate-50 h-3 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full" 
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                    <span className="w-8 text-right text-slate-600 font-semibold">{item.hours}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Quiz/Deadline Reminder */}
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white p-5 rounded-2xl shadow-md relative overflow-hidden">
              <div className="relative z-10">
                <span className="bg-white/20 text-xs font-medium px-2.5 py-1 rounded-md uppercase tracking-wider">
                  Upcoming Test
                </span>
                <h3 className="font-bold text-lg mt-3">MERN Stack Capstone Architecture</h3>
                <p className="text-xs text-indigo-100 mt-1 opacity-90">Due: May 25th at 11:59 PM</p>
                <button className="mt-4 bg-white text-indigo-600 font-semibold px-4 py-2 rounded-xl text-xs hover:bg-indigo-50 transition-all shadow-sm">
                  Prepare Now
                </button>
              </div>
              {/* Decorative Background Blur */}
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
            </div>

          </div>

        </div>
      </main>

      {/* COURSE DETAILS MODAL */}
      {isModalOpen && selectedCourse && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-opacity duration-300">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transform scale-100 transition-transform duration-300">
            {/* Modal Header */}
            <div className="relative h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-6 flex items-end">
              <button 
                onClick={closeModal}
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-md transition-all"
              >
                <X size={20} />
              </button>
              <div className="text-white w-full">
                <span className="bg-white/20 backdrop-blur-md text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider mb-2 inline-block shadow-sm">
                  {selectedCourse.courseType || 'Course'}
                </span>
                <h2 className="text-2xl font-bold leading-tight drop-shadow-sm truncate" title={selectedCourse.courseName}>{selectedCourse.courseName || 'Course Details'}</h2>
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
                  <BookMarked size={18} className="text-indigo-500"/>
                  Course Curriculum
                </h3>
                {selectedCourse.modules && selectedCourse.modules.length > 0 ? (
                  <div className="space-y-3">
                    {selectedCourse.modules.map((mod, idx) => (
                      <div key={mod._id || idx} className="flex items-start justify-between p-3 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/50 transition-colors group">
                        <div className="flex gap-3 items-center">
                          <div className="bg-indigo-100 text-indigo-600 font-bold w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm group-hover:text-indigo-700 transition-colors">{mod.moduleName}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{mod.totalTopics || 0} Topics included</p>
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