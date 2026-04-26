import React, { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom';
import { Navbar } from '../../../components/admin/AdminNavBar';
import Tabs from '../../../components/button/Tabs';
import AdminService from '../../../services/admin-api-service/AdminService';
import Report from './Report';

const headData = "Attendance"
const tabOptions = [
    { value: "Student Attendance", label: "Student Attendance" },
    { value: "Report", label: "Report" },
];

// --- MOCK ICON COMPONENTS (for single-file use) ---
const Zap = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>;
const User = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
const LogOut = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>;
const LayoutDashboard = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>;
const Settings = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.22a2 2 0 0 1-1.415 1.415L4.47 6.47a2 2 0 0 0-2.268.96l-.004.004a2 2 0 0 0 0 1.94l.206.356a2 2 0 0 1 1.415 1.415v.44a2 2 0 0 1-2 2v.22a2 2 0 0 0 2 2h.22a2 2 0 0 1 1.415 1.415l.356.206a2 2 0 0 0 .96 2.268l.004.004a2 2 0 0 0 1.94 0l.356-.206a2 2 0 0 1 1.415-1.415h.44a2 2 0 0 1 2 2v.22a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.22a2 2 0 0 1 1.415-1.415l.356-.206a2 2 0 0 0 .96-2.268l.004-.004a2 2 0 0 0 0-1.94l-.206-.356a2 2 0 0 1-1.415-1.415v-.44a2 2 0 0 1 2-2v-.22a2 2 0 0 0-2-2h-.22a2 2 0 0 1-1.415-1.415L17.53 6.47a2 2 0 0 0-2.268-.96l-.004-.004a2 2 0 0 0-1.94 0l-.356.206a2 2 0 0 1-1.415 1.415V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>;
const BookOpen = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 10V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5" /><path d="M6 15L2 22" /><path d="M18 15l4 7" /><path d="M12 2v20" /><path d="M12 2v20" /></svg>;
const FileText = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /></svg>;
const CheckSquare = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="m9 12 2 2 4-4" /></svg>;
const Calendar = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /></svg>;
const ChevronRight = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>;
const ChevronDown = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>;
// --- END MOCK ICON COMPONENTS ---



const customOrange = "bg-[#E99732]";
const customOrangeHover = "hover:bg-[#d98a2e]";

// Softronics Logo Component for Sidebar
const SidebarLogo = () => (
    <div className="flex items-center space-x-2 p-5 border-b border-gray-100 select-none">
        <Zap className="w-6 h-6 text-amber-600 rotate-45" fill="none" strokeWidth="3" />
        <span className="text-xl font-extrabold text-gray-800 tracking-tight">
            Softronics
        </span>
        <sup className="text-xs text-gray-800 font-semibold">&reg;</sup>
    </div>
);

// Sidebar Navigation Item
const NavItem = ({ icon: Icon, label, isActive, hasSubMenu, onClick }) => (
    <div
        className={`flex justify-between items-center py-3 px-5 text-sm font-medium cursor-pointer transition-all duration-150 ease-in-out ${isActive ? 'text-amber-600 border-l-4 border-amber-600 bg-amber-50' : 'text-gray-600 hover:bg-gray-100'
            }`}
        onClick={onClick}
    >
        <div className="flex items-center space-x-3">
            <Icon className="w-5 h-5" />
            <span>{label}</span>
        </div>
        {hasSubMenu && (
            <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'rotate-90' : ''}`} />
        )}
    </div>
);

// Main Sidebar Component
const Sidebar = ({ activeMenu, setActiveMenu }) => {
    const isAttendanceActive = activeMenu.startsWith('Attendance');
    const isScheduleActive = activeMenu.startsWith('Schedule');

    const handleMenuClick = (label) => {
        if (label === activeMenu) {
            setActiveMenu(''); // Collapse if already active
        } else {
            setActiveMenu(label);
        }
    };

    return (
        <div className="w-64 flex flex-col bg-white border-r border-gray-200">
            <SidebarLogo />
            <nav className="flex-grow pt-4">
                <NavItem icon={LayoutDashboard} label="Dashboard" isActive={activeMenu === 'Dashboard'} onClick={() => handleMenuClick('Dashboard')} />
                <NavItem icon={Settings} label="Administration" isActive={activeMenu === 'Administration'} hasSubMenu onClick={() => handleMenuClick('Administration')} />
                <NavItem icon={BookOpen} label="Course management" isActive={activeMenu === 'Course management'} hasSubMenu onClick={() => handleMenuClick('Course management')} />
                <NavItem icon={FileText} label="Syllabus Management" isActive={activeMenu === 'Syllabus Management'} hasSubMenu onClick={() => handleMenuClick('Syllabus Management')} />
                <NavItem icon={CheckSquare} label="Task Management" isActive={activeMenu === 'Task Management'} hasSubMenu onClick={() => handleMenuClick('Task Management')} />

                {/* Attendance Menu */}
                <NavItem
                    icon={Calendar}
                    label="Attendance"
                    isActive={isAttendanceActive}
                    hasSubMenu
                    onClick={() => handleMenuClick('Attendance')}
                />
                {isAttendanceActive && (
                    <div className="pl-12 text-sm space-y-2 py-2 text-gray-600">
                        <div className={`cursor-pointer hover:text-amber-600 ${activeMenu === 'Attendance:Student Attendance' ? 'font-semibold text-amber-600' : ''}`} onClick={() => setActiveMenu('Attendance:Student Attendance')}>Student Attendance</div>
                        <div className={`cursor-pointer hover:text-amber-600 ${activeMenu === 'Attendance:Leave Request' ? 'font-semibold text-amber-600' : ''}`} onClick={() => setActiveMenu('Attendance:Leave Request')}>Leave Request</div>
                    </div>
                )}

                {/* Schedule Menu */}
                <NavItem
                    icon={Calendar}
                    label="Schedule"
                    isActive={isScheduleActive}
                    hasSubMenu
                    onClick={() => handleMenuClick('Schedule')}
                />
                {isScheduleActive && (
                    <div className="pl-12 text-sm space-y-2 py-2 text-gray-600">
                        <div>Batches</div>
                        <div>Mentor's Batches</div>
                        <div>Timings</div>
                        <div>Weekly Schedule</div>
                    </div>
                )}
            </nav>

            {/* Log Out */}
            <div className="mt-auto py-4 border-t border-gray-100">
                <div className="flex items-center space-x-3 py-3 px-5 text-sm font-medium text-red-500 cursor-pointer hover:bg-red-50" onClick={() => console.log('Logging out...')}>
                    <LogOut className="w-5 h-5" />
                    <span>Log Out</span>
                </div>
            </div>
        </div>
    );
};

// Header Component
// const Header = () => (
//     <header className="flex justify-between items-center px-6 py-4 bg-white border-b border-gray-200">
//         <div className="text-sm text-gray-500">
//             <span className="font-semibold text-gray-800 text-xl">Attendance</span>
//             <div className="text-xs mt-1">Attendance &gt; Student Attendance</div>
//         </div>
//         <div className="flex items-center space-x-4">
//             <div className="flex items-center space-x-2 text-gray-700">
//                 <User className="w-8 h-8 p-1 bg-gray-100 rounded-full" />
//                 <div>
//                     <div className="font-semibold text-sm">Priyesh</div>
//                     <div className="text-xs text-gray-500">Super Admin</div>
//                 </div>
//             </div>
//         </div>
//     </header>
// );

// Status Card Component
const StatusCard = ({ label, value, colorClass }) => (
    <div className="p-3 sm:p-4 bg-white rounded-lg sm:rounded-xl shadow-sm flex flex-col justify-center items-center">
        <div className="text-[10px] sm:text-xs font-semibold text-gray-500 mb-1">{label}</div>
        <div className="text-2xl sm:text-3xl font-extrabold" style={{ color: colorClass }}>
            {value}
        </div>
    </div>
);

const ActionBar = ({ activeTab, setActiveTab, branches, selectedBranch, onBranchChange, branchesLoading, courses, selectedCourse, onCourseChange, coursesLoading, timings, selectedTiming, onTimingChange, timingsLoading, allDaysCombinations, daysCombinations, selectedDaysCombination, onDaysCombinationChange, daysCombLoading, selectedYear, onYearChange, years, selectedMonth, onMonthChange }) => {
    const todayDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return (
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4 sm:mb-6">
            <div className="flex space-x-3 w-full lg:w-auto">
                <Tabs tabs={tabOptions} activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 w-full lg:w-auto flex-wrap">
                {/* Branch Dropdown */}
                <select
                    value={selectedBranch}
                    onChange={onBranchChange}
                    disabled={branchesLoading}
                    className="w-full sm:w-auto px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-300 rounded-md bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                    <option value="">
                        {branchesLoading ? 'Loading branches...' : 'All Branches'}
                    </option>
                    {branches.map((branch) => (
                        <option key={branch._id} value={branch._id}>
                            {branch.branchName}
                        </option>
                    ))}
                </select>

                {/* Days Filter Dropdown */}
                <select
                    value={selectedDaysCombination}
                    onChange={onDaysCombinationChange}
                    disabled={daysCombLoading}
                    className="w-full sm:w-auto px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-300 rounded-md bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                    <option value="">
                        {daysCombLoading ? 'Loading days...' : 'All Days'}
                    </option>
                    {daysCombinations.map(day => (
                        <option key={day._id} value={day._id}>{day.name}</option>
                    ))}
                </select>

                {/* Courses Dropdown */}
                <select
                    value={selectedCourse}
                    onChange={onCourseChange}
                    disabled={coursesLoading}
                    className="w-full sm:w-auto px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-300 rounded-md bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                    <option value="">
                        {coursesLoading ? 'Loading courses...' : 'All Courses'}
                    </option>
                    {courses.map((course) => (
                        <option key={course._id} value={course._id}>
                            {course.courseName}
                        </option>
                    ))}
                </select>

                {/* Timings Dropdown */}
                <select
                    value={selectedTiming}
                    onChange={onTimingChange}
                    disabled={timingsLoading}
                    className="w-full sm:w-auto px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-300 rounded-md bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                    <option value="">
                        {timingsLoading ? 'Loading timings...' : 'All Timings'}
                    </option>
                    {timings.map((timing) => (
                        <option key={timing._id} value={timing._id}>
                            {timing.timeSlot}
                        </option>
                    ))}
                </select>

                {/* Year Dropdown */}
                <select
                    value={selectedYear}
                    onChange={onYearChange}
                    className="w-full sm:w-auto px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-300 rounded-md bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                    {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>

                {/* Month Dropdown */}
                <select
                    value={selectedMonth}
                    onChange={onMonthChange}
                    className="w-full sm:w-auto px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-300 rounded-md bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                    <option value="">All Months</option>
                    <option value="01">January</option>
                    <option value="02">February</option>
                    <option value="03">March</option>
                    <option value="04">April</option>
                    <option value="05">May</option>
                    <option value="06">June</option>
                    <option value="07">July</option>
                    <option value="08">August</option>
                    <option value="09">September</option>
                    <option value="10">October</option>
                    <option value="11">November</option>
                    <option value="12">December</option>
                </select>
            </div>
        </div>
    );
};

// Toggle Switch Component
const AttendanceToggle = ({ isPresent, onToggle, disabled = false }) => (
    <label className={`relative inline-flex items-center ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
        <input type="checkbox" checked={isPresent} onChange={onToggle} disabled={disabled} className="sr-only peer" />
        <div className={`w-11 h-6 rounded-full peer peer-focus:outline-none transition-colors duration-200 ${isPresent
                ? 'bg-green-500 after:translate-x-full peer-checked:bg-green-500'
                : 'bg-gray-300'
            } after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}
        ></div>
    </label>
);

// Attendance Table Row
const AttendanceRow = ({ attendance, isPresent, onToggle }) => (
    <div className="grid grid-cols-6 py-3 border-b border-gray-100 text-xs sm:text-sm items-center">
        <div className="font-medium text-gray-800 pl-2 sm:pl-4 truncate">{attendance.name}</div>
        <div className="text-gray-600 truncate text-[10px] sm:text-xs">{attendance.email || 'N/A'}</div>
        <div className="text-gray-600 truncate text-[10px] sm:text-xs pr-2">{attendance.courseName || 'N/A'}</div>
        <div className="flex items-center">
            {attendance.attendanceStatus === null ? (
                <span className="px-1.5 sm:px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                    Not Created
                </span>
            ) : (
                <span className={`px-1.5 sm:px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium ${attendance.attendanceStatus
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                    {attendance.attendanceStatus ? 'Present' : 'Absent'}
                </span>
            )}
        </div>
        {/* Mentor Card Link */}
        <div className="flex items-center text-sm">
            <Link to={`/menor-card?internId=${attendance.id}`} className="text-orange-600 hover:text-orange-800 underline font-medium text-[10px] sm:text-xs">
                View Card
            </Link>
        </div>
        <div className="flex justify-end pr-2 sm:pr-4">
            <AttendanceToggle isPresent={isPresent} onToggle={onToggle} disabled={attendance.attendanceStatus === null} />
        </div>
    </div>
);


const AttendanceContent = ({ activeTab, setActiveTab }) => {
    const {
        createDailyAttendanceForAllInterns,
        updateSingleInternAttendance,
        getInternsAttendanceData,
        getInternsByAttendanceDate,
        getBranchesData,
        getCoursesData,
        getTimingsData,
        getDaysCombinationsData,
        getAllBatchesData
    } = AdminService();

    // State for attendance data from backend
    const [attendanceRecords, setAttendanceRecords] = useState([]); // Attendance records for display
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [attendance, setAttendance] = useState({});
    const [selectedDate, setSelectedDate] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });
    const [currentDate, setCurrentDate] = useState(new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }));

    // State for branches
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(''); // Empty string means "All Branches"
    const [branchesLoading, setBranchesLoading] = useState(false);

    // State for days combination filter
    const [allDaysCombinations, setAllDaysCombinations] = useState([]);
    const [daysCombinations, setDaysCombinations] = useState([]);
    const [selectedDaysCombination, setSelectedDaysCombination] = useState('');
    const [daysCombLoading, setDaysCombLoading] = useState(false);

    // Batches for filtering
    const [allBatches, setAllBatches] = useState([]);

    // Year and Month Data
    const currentYear = new Date().getFullYear();
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
    const [selectedYear, setSelectedYear] = useState(currentYear.toString());
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);

    // State for courses
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(''); // Empty string means "All Courses"
    const [coursesLoading, setCoursesLoading] = useState(false);

    // State for timings
    const [allTimings, setAllTimings] = useState([]);
    const [timings, setTimings] = useState([]);
    const [selectedTiming, setSelectedTiming] = useState(''); // Empty string means "All Timings"
    const [timingsLoading, setTimingsLoading] = useState(false);

    // State for pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    // State for full dataset counts (not paginated)
    const [allAttendanceRecords, setAllAttendanceRecords] = useState([]); // Full dataset
    const [totalPresent, setTotalPresent] = useState(0); // Total present from full dataset
    const [totalAbsent, setTotalAbsent] = useState(0); // Total absent from full dataset

    console.log("allAttendanceRecords===", allAttendanceRecords);

    // Fetch branches from backend
    const fetchBranches = async () => {
        try {
            setBranchesLoading(true);
            const response = await getBranchesData();
            // console.log('Branches response:', response);

            if (response?.data) {
                setBranches(response.data);
                // Keep selectedBranch as empty string to show "All Branches" by default
                // console.log('Branches loaded:', response.data.length, 'branches available');
            }
        } catch (err) {
            console.error('Failed to load branches:', err);
            setError('Failed to load branches');
        } finally {
            setBranchesLoading(false);
        }
    };

    // Fetch courses from backend
    const fetchCourses = async () => {
        try {
            setCoursesLoading(true);
            const response = await getCoursesData();
            console.log('Courses response:', response);

            if (response?.data) {
                setCourses(response.data);
                console.log('Courses loaded:', response.data.length, 'courses available');
            }
        } catch (err) {
            console.error('Failed to load courses:', err);
            setError('Failed to load courses');
        } finally {
            setCoursesLoading(false);
        }
    };

    // Fetch timings from backend
    const fetchTimings = async () => {
        try {
            setTimingsLoading(true);
            const response = await getTimingsData();
            if (response?.data) {
                setAllTimings(response.data);
                setTimings(response.data);
            }
        } catch (err) {
            console.error('Failed to load timings:', err);
            setError('Failed to load timings');
        } finally {
            setTimingsLoading(false);
        }
    };

    // Fetch days combinations and batches
    const fetchDaysAndBatches = async () => {
        try {
            setDaysCombLoading(true);
            const [daysRes, batchesRes] = await Promise.all([
                getDaysCombinationsData(),
                getAllBatchesData()
            ]);
            if (daysRes?.data) setAllDaysCombinations(daysRes.data);
            if (batchesRes?.data) setAllBatches(batchesRes.data);
        } catch (err) {
            console.error('Failed to load days combinations or batches:', err);
        } finally {
            setDaysCombLoading(false);
        }
    };

    // Fetch attendance data for selected date and filters
    const fetchAttendanceForDate = async (date, branchId = null, daysId = null, courseId = null, timingId = null, page = 1) => {
        try {
            const response = await getInternsByAttendanceDate(date, branchId, daysId, courseId, timingId);
            console.log('Interns with attendance for date:', date, 'branch:', branchId, 'days:', daysId, 'course:', courseId, 'timing:', timingId, response);

            if (response?.data?.data && response.data.data.length > 0) {
                // Transform the response data to match our expected format
                const transformedInterns = response.data.data.map(record => ({
                    id: record._id,
                    name: record.fullName,
                    email: record.email,
                    mentor: record.role || 'Intern',
                    courseName: record.courseName,
                    branchId: record.branchId || record.branch?._id,
                    branchName: record.branchName || record.branch?.branchName,
                    attendanceStatus: record.attendanceStatus,
                    attendanceId: record.attendanceId,
                    checkInTime: record.checkInTime,
                    checkOutTime: record.checkOutTime,
                    totalHours: record.totalHours,
                    remarks: record.remarks
                }));

                // Store full dataset for total counts
                setAllAttendanceRecords(transformedInterns);

                // Calculate total present and absent from full dataset
                const totalPresentCount = transformedInterns.filter(record => record.attendanceStatus === true).length;
                const totalAbsentCount = transformedInterns.filter(record => record.attendanceStatus === false).length;
                setTotalPresent(totalPresentCount);
                setTotalAbsent(totalAbsentCount);

                // Calculate pagination
                const totalRecords = transformedInterns.length;
                const totalPages = Math.ceil(totalRecords / itemsPerPage);
                const startIndex = (page - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;
                const paginatedRecords = transformedInterns.slice(startIndex, endIndex);

                setAttendanceRecords(paginatedRecords);
                setTotalRecords(totalRecords);
                setTotalPages(totalPages);
                setCurrentPage(page);

                // Update attendance state with the selected date's data
                const attendanceMap = {};
                paginatedRecords.forEach(record => {
                    attendanceMap[record.id] = record.attendanceStatus;
                });
                setAttendance(attendanceMap);

                // console.log('Filtered interns for display:', paginatedRecords);
            } else {
                // If no attendance data for the selected date, show empty list
                console.log('No attendance data found for date:', date, 'branch:', branchId);
                setAttendanceRecords([]);
                setAllAttendanceRecords([]);
                setAttendance({});
                setTotalRecords(0);
                setTotalPages(1);
                setCurrentPage(1);
                setTotalPresent(0);
                setTotalAbsent(0);
            }
        } catch (err) {
            console.error('Failed to load attendance for date:', err);
            // On error, show empty list
            setAttendanceRecords([]);
            setAllAttendanceRecords([]);
            setAttendance({});
            setTotalRecords(0);
            setTotalPages(1);
            setCurrentPage(1);
            setTotalPresent(0);
            setTotalAbsent(0);
        }
    };

    // Create daily attendance records for all ongoing interns
    const createDailyAttendance = async () => {
        try {
            setLoading(true);
            await createDailyAttendanceForAllInterns(
                selectedBranch || null,
                selectedCourse || null,
                selectedDaysCombination || null,
                selectedTiming || null,
                selectedDate
            );
            console.log('Daily attendance created successfully');
            await fetchAttendanceForDate(selectedDate, selectedBranch || null, selectedDaysCombination || null, selectedCourse || null, selectedTiming || null, 1); // Refresh attendance for selected date and branch
        } catch (err) {
            console.error('Failed to create daily attendance:', err);
            setError('Failed to create daily attendance');
        } finally {
            setLoading(false);
        }
    };

    // Update single intern attendance
    const updateAttendance = async (internId, status) => {
        try {
            // You'll need to get the current user ID (markedBy) from your auth context
            const markedBy = "current_user_id"; // Replace with actual user ID

            const response = await updateSingleInternAttendance({
                internId,
                date: selectedDate,
                status,
                markedBy,
                remarks: `Updated via UI - ${status ? 'Present' : 'Absent'}`
            });

            // Update local state after successful backend update
            if (response?.data) {
                // Update the attendance state for the specific intern
                setAttendance(prev => ({
                    ...prev,
                    [internId]: status
                }));

                // Update the full dataset with the new status
                setAllAttendanceRecords(prev =>
                    prev.map(record =>
                        record.id === internId
                            ? { ...record, attendanceStatus: status }
                            : record
                    )
                );

                // Recalculate total present and absent counts
                const updatedRecords = allAttendanceRecords.map(record =>
                    record.id === internId
                        ? { ...record, attendanceStatus: status }
                        : record
                );

                const newTotalPresent = updatedRecords.filter(record => record.attendanceStatus === true).length;
                const newTotalAbsent = updatedRecords.filter(record => record.attendanceStatus === false).length;

                setTotalPresent(newTotalPresent);
                setTotalAbsent(newTotalAbsent);

                // Update the paginated records if the updated record is on the current page
                setAttendanceRecords(prev =>
                    prev.map(record =>
                        record.id === internId
                            ? { ...record, attendanceStatus: status }
                            : record
                    )
                );

                console.log(`Attendance updated for intern ${internId}: ${status ? 'Present' : 'Absent'}`);
            }
        } catch (err) {
            console.error('Failed to update attendance:', err);
            setError('Failed to update attendance');
        }
    };

    // Load data when component mounts
    useEffect(() => {
        fetchBranches();
        fetchCourses();
        fetchTimings();
        fetchDaysAndBatches();
        fetchAttendanceForDate(selectedDate, selectedBranch || null, selectedDaysCombination || null, selectedCourse || null, selectedTiming || null, 1);
    }, []);

    // Update combinations when branch changes
    useEffect(() => {
        if (selectedBranch) {
            const branch = branches.find(b => b._id === selectedBranch);
            const branchDayCombIds = new Set();
            if (branch && branch.days) {
                branch.days.forEach(d => branchDayCombIds.add(typeof d === 'object' ? d._id.toString() : d.toString()));
            }
            const filtered = allDaysCombinations.filter(d => branchDayCombIds.has(d._id.toString()));
            setDaysCombinations(filtered);
            
            const filteredTimings = allTimings.filter(t => t.branch?._id === selectedBranch || t.branch === selectedBranch);
            setTimings(filteredTimings);
        } else {
            setDaysCombinations(allDaysCombinations);
            setTimings(allTimings);
        }
    }, [selectedBranch, branches, allDaysCombinations, allTimings]);

    // Update currentDate when selectedDate changes
    useEffect(() => {
        const dateObj = new Date(selectedDate);
        const formattedDate = dateObj.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        setCurrentDate(formattedDate);
    }, [selectedDate]);

    const handleToggle = async (studentId) => {
        const newStatus = !attendance[studentId];
        setAttendance(prev => ({
            ...prev,
            [studentId]: newStatus,
        }));

        // Update attendance in backend
        await updateAttendance(studentId, newStatus);
    };

    // Handle branch selection
    const handleBranchChange = async (e) => {
        const branchId = e.target.value;
        setSelectedBranch(branchId);
        setCurrentPage(1); // Reset to first page when filter changes

        // Fetch attendance records for the selected filters
        await fetchAttendanceForDate(selectedDate, branchId || null, selectedDaysCombination || null, selectedCourse || null, selectedTiming || null, 1);
    };

    // Handle days combination filter selection
    const handleDaysCombinationChange = async (e) => {
        const daysId = e.target.value;
        setSelectedDaysCombination(daysId);
        setCurrentPage(1); // Reset to first page when filter changes

        // Fetch attendance records for the selected filters
        await fetchAttendanceForDate(selectedDate, selectedBranch || null, daysId || null, selectedCourse || null, selectedTiming || null, 1);
    };

    // Handle course selection
    const handleCourseChange = async (e) => {
        const courseId = e.target.value;
        setSelectedCourse(courseId);
        setCurrentPage(1); // Reset to first page when filter changes

        // Fetch attendance records for the selected filters
        await fetchAttendanceForDate(selectedDate, selectedBranch || null, selectedDaysCombination || null, courseId || null, selectedTiming || null, 1);
    };

    // Handle timing selection
    const handleTimingChange = async (e) => {
        const timingId = e.target.value;
        setSelectedTiming(timingId);
        setCurrentPage(1); // Reset to first page when filter changes

        // Fetch attendance records for the selected filters
        await fetchAttendanceForDate(selectedDate, selectedBranch || null, selectedDaysCombination || null, selectedCourse || null, timingId || null, 1);
    };

    const handleYearChange = async (e) => {
        const year = e.target.value;
        setSelectedYear(year);
        // Sync with month or not? Right now we just set state.
    };

    const handleMonthChange = async (e) => {
        const month = e.target.value;
        setSelectedMonth(month);
    };

    // Pagination handlers
    const handlePageChange = async (page) => {
        setCurrentPage(page);
        await fetchAttendanceForDate(selectedDate, selectedBranch || null, selectedDaysCombination || null, selectedCourse || null, selectedTiming || null, page);
    };

    const handleItemsPerPageChange = (e) => {
        const newItemsPerPage = parseInt(e.target.value);
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1); // Reset to first page when changing items per page
        // Re-fetch with new pagination settings
        fetchAttendanceForDate(selectedDate, selectedBranch || null, selectedDaysCombination || null, selectedCourse || null, selectedTiming || null, 1);
    };

    // Total present and absent are now calculated from full dataset in fetchAttendanceForDate

    const todayDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });


    return (
        <div className="px-2 sm:px-4 lg:px-6">
            <ActionBar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                branches={branches}
                selectedBranch={selectedBranch}
                onBranchChange={handleBranchChange}
                branchesLoading={branchesLoading}
                allDaysCombinations={allDaysCombinations}
                daysCombinations={daysCombinations}
                selectedDaysCombination={selectedDaysCombination}
                onDaysCombinationChange={handleDaysCombinationChange}
                daysCombLoading={daysCombLoading}
                courses={courses}
                selectedCourse={selectedCourse}
                onCourseChange={handleCourseChange}
                coursesLoading={coursesLoading}
                timings={timings}
                selectedTiming={selectedTiming}
                onTimingChange={handleTimingChange}
                timingsLoading={timingsLoading}
                selectedYear={selectedYear}
                onYearChange={handleYearChange}
                years={years}
                selectedMonth={selectedMonth}
                onMonthChange={handleMonthChange}
            />

            {/* Create Daily Attendance Button */}
            <div className="mb-4 sm:mb-6 flex justify-end">
                <div className="flex space-x-3">
                    <button
                        onClick={() => setShowConfirmModal(true)}
                        disabled={loading}
                        className={`px-3 sm:px-4 py-2 text-xs sm:text-sm text-white font-semibold rounded-lg ${customOrange} ${customOrangeHover} shadow-md disabled:opacity-50`}
                    >
                        {loading ? 'Creating...' : 'Create Daily Attendance'}
                    </button>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-5 sm:p-6 text-center transform transition-all duration-300 scale-100">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 mb-4">
                            <Zap className="h-6 w-6 text-amber-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Create Attendance</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Are you sure you want to create daily attendance records for the selected date?
                        </p>
                        <div className="flex justify-center flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setShowConfirmModal(false);
                                    createDailyAttendance();
                                }}
                                className={`px-4 py-2 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors ${customOrange} ${customOrangeHover}`}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="text-center py-6 sm:py-8">
                    <div className="text-xs sm:text-sm text-gray-500">Loading interns...</div>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="text-center py-6 sm:py-8">
                    <div className="text-xs sm:text-sm text-red-500">{error}</div>
                </div>
            )}

            {/* Content */}
            {!loading && (
                <>
                    {/* Branch Filter Info */}
                    {/* <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <span className="text-gray-600 font-medium">Showing:</span>
                                <span className="text-gray-800 font-semibold">
                                    {selectedBranch 
                                        ? branches.find(branch => branch._id === selectedBranch)?.branchName || 'Unknown Branch'
                                        : 'All Branches'
                                    }
                                </span>
                            </div>
                            <div className="text-gray-600 text-sm">
                                {attendanceRecords.length} attendance records
                            </div>
                        </div>
                    </div> */}

                    {/* Status Cards */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
                        <StatusCard label="Total Records" value={totalRecords < 10 ? `0${totalRecords}` : totalRecords} colorClass="#000" />
                        <StatusCard label="Total Present" value={totalPresent < 10 ? `0${totalPresent}` : totalPresent} colorClass="#10B981" />
                        <StatusCard label="Total Absent" value={totalAbsent < 10 ? `0${totalAbsent}` : totalAbsent} colorClass="#EF4444" />
                    </div>

                    {/* No attendance records message */}
                    {attendanceRecords.length === 0 && (
                        <div className="text-center py-6 sm:py-8 bg-yellow-50 border border-yellow-200 rounded-lg px-4">
                            <div className="text-xs sm:text-sm text-yellow-800 font-medium">No attendance records found for the selected date</div>
                            <div className="text-xs sm:text-sm text-yellow-600 mt-1">Try selecting a different date or create daily attendance records</div>
                        </div>
                    )}

                    {/* Attendance Table Section */}
                    <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 border-b border-gray-100 pb-3 sm:pb-4">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900">Attendance</h3>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center text-gray-600 gap-2 sm:gap-3 w-full sm:w-auto">
                                <span className="text-xs sm:text-sm text-gray-500">Selected Date:</span>
                                <span className="text-xs sm:text-sm font-medium text-gray-800">{currentDate}</span>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => {
                                        const newDate = e.target.value;
                                        setSelectedDate(newDate);

                                        // Convert the selected date to the display format (DD/MM/YYYY)
                                        const dateObj = new Date(newDate);
                                        const formattedDate = dateObj.toLocaleDateString('en-GB', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric'
                                        });
                                        setCurrentDate(formattedDate);

                                        // Fetch attendance for the new date with all selected filters
                                        fetchAttendanceForDate(newDate, selectedBranch || null, selectedDaysCombination || null, selectedCourse || null, selectedTiming || null, 1);
                                    }}
                                    className="w-full sm:w-auto px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
                                />
                            </div>
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            {/* Table Header */}
                            <div className="grid grid-cols-6 pb-3 border-b-2 border-gray-200 font-semibold text-gray-700 text-xs sm:text-sm sticky top-0 bg-white">
                                <div className="pl-2 sm:pl-4">Intern Name</div>
                                <div>Email</div>
                                <div className="pr-2">Course</div>
                                <div>Status</div>
                                <div>Mentor Card</div>
                                <div className="text-right pr-2 sm:pr-4">Actions</div>
                            </div>

                            {/* Table Body */}
                            <div className="divide-y divide-gray-50">
                                {attendanceRecords.map((attendanceRecord) => (
                                    <AttendanceRow
                                        key={attendanceRecord.id}
                                        attendance={attendanceRecord}
                                        isPresent={attendance[attendanceRecord.id]}
                                        onToggle={() => handleToggle(attendanceRecord.id)}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-3">
                            {attendanceRecords.map((attendanceRecord) => (
                                <div key={attendanceRecord.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-gray-900 truncate">{attendanceRecord.name}</div>
                                            <div className="text-xs text-gray-500 truncate">{attendanceRecord.email || 'N/A'}</div>
                                        </div>
                                        {attendanceRecord.attendanceStatus === null ? (
                                            <span className="px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 bg-gray-100 text-gray-800 border border-gray-200">
                                                Not Created
                                            </span>
                                        ) : (
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${attendanceRecord.attendanceStatus
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                }`}>
                                                {attendanceRecord.attendanceStatus ? 'Present' : 'Absent'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 gap-2 text-xs text-gray-600 mb-3">
                                        <div>
                                            <span className="font-medium">Course:</span> {attendanceRecord.courseName || 'N/A'}
                                        </div>
                                        <div>
                                            <span className="font-medium">Mentor Card:</span> <Link to={`/menor-card?internId=${attendanceRecord.id}`} className="text-orange-600 hover:text-orange-800 underline">View Card</Link>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                                        <span className="text-xs text-gray-600">Toggle Status:</span>
                                        <AttendanceToggle
                                            isPresent={attendance[attendanceRecord.id]}
                                            onToggle={() => handleToggle(attendanceRecord.id)}
                                            disabled={attendanceRecord.attendanceStatus === null}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination Controls */}
                        {totalRecords > 0 && (
                            <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalRecords)} of {totalRecords} records
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>

                                    <div className="flex gap-1">
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let pageNum;
                                            if (totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (currentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNum = totalPages - 4 + i;
                                            } else {
                                                pageNum = currentPage - 2 + i;
                                            }

                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className={`px-2 sm:px-3 py-1 text-xs sm:text-sm border rounded ${currentPage === pageNum
                                                            ? 'bg-amber-500 text-white border-amber-500'
                                                            : 'border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Save Button */}
                        {/* <div className="mt-8 flex justify-end">
                    <button className={`px-8 py-3 text-white font-semibold rounded-lg ${customOrange} ${customOrangeHover} shadow-md`}>
                        Save
                    </button>
                </div> */}
                    </div>
                </>
            )}
        </div>
    );
};



export const StudentAttendance = () => {
    // State to manage active sidebar menu item
    const [activeMenu, setActiveMenu] = useState('Attendance:Student Attendance');
    const [activeTab, setActiveTab] = useState('Student Attendance');

    return (
        <div >

            <Navbar headData={headData} activeTab={activeTab} />

            <main className="flex-1 overflow-y-auto">
                {activeTab === 'Student Attendance' ? <AttendanceContent activeTab={activeTab} setActiveTab={setActiveTab} /> : <Report activeTab={activeTab} setActiveTab={setActiveTab} />}
            </main>
            {/* </div> */}
        </div>
    )
}

// export default studentAttendance