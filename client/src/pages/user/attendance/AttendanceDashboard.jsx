import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Download, Filter, RotateCcw, Calendar as CalendarIcon,
  CheckCircle2, Clock, Percent, Table, CalendarDays, MoreHorizontal,
  ChevronLeft, ChevronRight, FileText, Bell, MoreVertical, Pin, Tag,
  ChevronUp, ChevronDown
} from 'lucide-react';

const monthsList = [
  { name: 'January', value: '1' },
  { name: 'February', value: '2' },
  { name: 'March', value: '3' },
  { name: 'April', value: '4' },
  { name: 'May', value: '5' },
  { name: 'June', value: '6' },
  { name: 'July', value: '7' },
  { name: 'August', value: '8' },
  { name: 'September', value: '9' },
  { name: 'October', value: '10' },
  { name: 'November', value: '11' },
  { name: 'December', value: '12' }
];
import UserService from '../../../services/user-api-service/UserService';
import { Navbar } from '../../../components/user/UserNavBar';

const StatusBadge = ({ status }) => {
  const styles = {
    Present: 'bg-green-100 text-green-800 border-green-200',
    Absent: 'bg-red-100 text-red-800 border-red-200',
    Late: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
      {status}
    </span>
  );
};

export default function AttendanceDashboard() {
  const { getMyAttendanceData } = UserService();
  const [attendance, setAttendance] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [summary, setSummary] = useState({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    attendancePercentage: '0.00'
  });
  const [loading, setLoading] = useState(false);

  const currentDate = new Date();
  const currentMonth = (currentDate.getMonth() + 1).toString();
  const currentYear = currentDate.getFullYear().toString();

  // Filters State
  const [filters, setFilters] = useState({
    mentor: '',
    month: currentMonth,
    year: currentYear
  });

  const [activeFilters, setActiveFilters] = useState({
    mentor: '',
    month: currentMonth,
    year: currentYear
  });

  const fetchAttendance = async (filterParams = {}) => {
    setLoading(true);
    try {
      const response = await getMyAttendanceData(filterParams);
      if (response && response.data) {
        setAttendance(response.data.data || []);
        setSummary(response.data.summary || {
          totalDays: 0,
          presentDays: 0,
          absentDays: 0,
          attendancePercentage: '0.00'
        });
        // Only set mentors list if we don't have them yet, or when not filtering
        if (mentors.length === 0 || (!filterParams.mentor && !filterParams.month && !filterParams.year)) {
          setMentors(response.data.mentors || []);
        }
      }
    } catch (error) {
      console.error('Error fetching student attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance(filters);
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    setActiveFilters(filters);
    fetchAttendance(filters);
  };

  const handleResetFilters = () => {
    const reset = { mentor: '', month: currentMonth, year: currentYear };
    setFilters(reset);
    setActiveFilters(reset);
    fetchAttendance(reset);
  };

  const getDayName = (dateStr) => {
    if (!dateStr) return '';
    const dateObj = new Date(dateStr);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dateObj.getDay()];
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${month}/${day}/${year}`;
  };

  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const handleYearChange = (dir) => {
    const newYear = (parseInt(filters.year || new Date().getFullYear()) + dir).toString();
    const updatedFilters = { ...filters, year: newYear };
    setFilters(updatedFilters);
    setActiveFilters(updatedFilters);
    fetchAttendance(updatedFilters);
  };

  const handleMonthClick = (monthVal) => {
    const updatedFilters = { ...filters, month: monthVal };
    setFilters(updatedFilters);
    setActiveFilters(updatedFilters);
    fetchAttendance(updatedFilters);
  };

  const handleMonthChange = (dir) => {
    let currentM = parseInt(filters.month || (new Date().getMonth() + 1));
    currentM += dir;
    if (currentM < 1) {
      currentM = 12;
    } else if (currentM > 12) {
      currentM = 1;
    }
    const updatedFilters = { ...filters, month: currentM.toString() };
    setFilters(updatedFilters);
    setActiveFilters(updatedFilters);
    fetchAttendance(updatedFilters);
  };

  const handleMentorFilterChange = (e) => {
    const { value } = e.target;
    const updatedFilters = { ...filters, mentor: value };
    setFilters(updatedFilters);
    setActiveFilters(updatedFilters);
    fetchAttendance(updatedFilters);
  };

  const getSidebarMonths = (activeMonthVal) => {
    const activeIdx = parseInt(activeMonthVal || (new Date().getMonth() + 1)) - 1; // 0-11
    const list = [];
    for (let i = -2; i <= 2; i++) {
      let idx = activeIdx + i;
      if (idx < 0) idx += 12;
      if (idx > 11) idx -= 12;
      list.push(monthsList[idx]);
    }
    return list;
  };

  const getCalendarDays = (monthVal, yearVal) => {
    const M = parseInt(monthVal) || (new Date().getMonth() + 1);
    const Y = parseInt(yearVal) || new Date().getFullYear();

    const firstDayInstance = new Date(Y, M - 1, 1);
    const startDayOfWeek = firstDayInstance.getDay();

    const numDaysInMonth = new Date(Y, M, 0).getDate();
    const numDaysInPrevMonth = new Date(Y, M - 1, 0).getDate();

    const days = [];

    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: (numDaysInPrevMonth - i).toString(),
        type: 'prev',
        dateStr: ''
      });
    }

    for (let d = 1; d <= numDaysInMonth; d++) {
      const dateStr = `${Y}-${String(M).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        date: d.toString(),
        type: 'current',
        dateStr: dateStr
      });
    }

    const totalCells = days.length > 35 ? 42 : 35;
    const nextMonthPadding = totalCells - days.length;
    for (let i = 1; i <= nextMonthPadding; i++) {
      days.push({
        date: i.toString(),
        type: 'next',
        dateStr: ''
      });
    }

    return days;
  };

  const renderCalendarDay = (day, index) => {
    let wrapperClass = "w-full h-12 flex justify-center items-center relative text-sm rounded-xl hover:bg-gray-50 transition-colors duration-200";
    let innerClass = "flex justify-center items-center w-8 h-8 rounded-full transition-all duration-200 z-10";
    let textClass = "text-gray-700 font-semibold";
    let tooltip = "";
    let style = {};

    if (day.type === 'prev' || day.type === 'next') {
      textClass = "text-gray-300 font-medium";
      return (
        <div key={`empty-${index}`} className="w-full h-12 flex justify-center items-center text-sm">
          <span className={textClass}>{day.date}</span>
        </div>
      );
    }

    const dayRecords = attendance.filter(r => r.date === day.dateStr);

    if (dayRecords.length > 0) {
      // Map statuses to colors
      const colors = dayRecords.map(r => r.status === true ? '#22c55e' : '#ef4444');

      if (colors.length === 1) {
        // Single session - solid background
        const isPresent = dayRecords[0].status === true;
        if (isPresent) {
          innerClass += " bg-[#22c55e] text-white ring-4 ring-green-100 shadow-[0_4px_12px_rgba(34,197,94,0.35)] scale-110";
        } else {
          innerClass += " bg-[#ef4444] text-white ring-4 ring-red-100 shadow-[0_4px_12px_rgba(239,68,68,0.35)] scale-110";
        }
        textClass = "text-white font-bold";
        tooltip = `Date: ${formatDate(day.dateStr)} | Status: ${isPresent ? 'Present' : 'Absent'} | Mentor: ${dayRecords[0].mentor?.fullName || 'N/A'}`;
      } else {
        // Multiple sessions - partitioned background
        const percentageStep = 100 / colors.length;
        const gradientStops = colors.map((color, idx) => {
          const start = (idx * percentageStep).toFixed(1);
          const end = ((idx + 1) * percentageStep).toFixed(1);
          return `${color} ${start}% ${end}%`;
        });

        style = {
          background: `conic-gradient(${gradientStops.join(', ')})`,
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)'
        };

        // Add shadow and ring styles to make it look premium
        innerClass += " text-white ring-4 ring-gray-100 shadow-md scale-110";
        textClass = "text-white font-bold";

        tooltip = `Date: ${formatDate(day.dateStr)} | ` + dayRecords.map((r, i) => `Session ${i + 1}: ${r.status ? 'Present' : 'Absent'} (Mentor: ${r.mentor?.fullName || 'N/A'})`).join(' / ');
      }

      return (
        <div
          key={day.dateStr}
          className={wrapperClass}
          title={tooltip}
        >
          <div className={innerClass} style={style}>
            <span className={textClass}>{day.date}</span>
          </div>
        </div>
      );
    }

    return (
      <div
        key={day.dateStr}
        className={wrapperClass}
      >
        <div className={innerClass}>
          <span className={textClass}>{day.date}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 font-sans text-gray-800">
      <div className="max-w-7xl mx-auto space-y-6">
        <Navbar headData="Attendance" activeTab="Attendance Details">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          </div>
        </Navbar>



        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white py-3 px-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
              <CalendarDays size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Days</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{summary.totalDays}</p>
              <p className="text-xs text-gray-400">Days</p>
            </div>
          </div>
          <div className="bg-white py-3 px-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="bg-green-50 p-3 rounded-lg text-green-600">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Present Days</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{summary.presentDays}</p>
              <p className="text-xs text-gray-400">Days</p>
            </div>
          </div>
          <div className="bg-white py-3 px-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="bg-red-50 p-3 rounded-lg text-red-500">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Absent Days</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{summary.absentDays}</p>
              <p className="text-xs text-gray-400">Days</p>
            </div>
          </div>
          <div className="bg-white py-3 px-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="bg-yellow-50 p-3 rounded-lg text-yellow-600">
              <Percent size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Attendance</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{summary.attendancePercentage}%</p>
              <p className="text-xs text-gray-400">Overall</p>
            </div>
          </div>
        </div>



        {/* Calendar Widget Container (styled like the screenshot) */}
        <div className="bg-[#f4f5fa] rounded-[32px] shadow-xl overflow-hidden flex flex-col md:flex-row border border-gray-200/50 min-h-[600px]">

          {/* Left Sidebar inside the widget */}
          <div className="w-full md:w-[260px] pt-10 pb-6 px-10 flex flex-col justify-start">
            <h3 className="text-lg font-bold mb-10 tracking-wide text-gray-900">Calendar</h3>

            {/* Year Switcher */}
            <div className="flex items-center justify-between mb-8 text-gray-400">
              <ChevronLeft
                className="w-4 h-4 cursor-pointer hover:text-gray-800 transition"
                onClick={() => handleYearChange(-1)}
              />
              <span className="font-bold text-base text-gray-800">{filters.year || new Date().getFullYear()}</span>
              <ChevronRight
                className="w-4 h-4 cursor-pointer hover:text-gray-800 transition"
                onClick={() => handleYearChange(1)}
              />
            </div>

            {/* Month List with Top/Bottom Arrows */}
            <div className="flex flex-col items-center space-y-4 pl-2 mt-4">
              <ChevronUp
                className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-800 transition"
                onClick={() => handleMonthChange(-1)}
              />
              <div className="flex flex-col space-y-6 text-center">
                {getSidebarMonths(filters.month).map((m) => {
                  const isActive = filters.month === m.value;
                  return (
                    <span
                      key={m.value}
                      onClick={() => handleMonthClick(m.value)}
                      className={`cursor-pointer transition-all duration-200 ${isActive
                        ? 'text-gray-800 text-[20px] font-bold'
                        : 'text-gray-400 font-medium text-sm hover:text-gray-600'
                        }`}
                    >
                      {m.name}
                    </span>
                  );
                })}
              </div>
              <ChevronDown
                className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-800 transition"
                onClick={() => handleMonthChange(1)}
              />
            </div>
          </div>

          {/* Right Main Content Area (curved border overlapping sidebar) */}
          <div className="flex-1 bg-white rounded-t-[40px] md:rounded-t-none md:rounded-l-[45px] shadow-[-10px_0_30px_rgba(0,0,0,0.02)] p-10 flex flex-col relative min-h-[500px]">

            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-gray-900">
                {monthsList[parseInt(filters.month) - 1]?.name || 'Attendance'} {filters.year}
              </h2>
              <div className="relative w-[180px] sm:w-[220px]">
                <select
                  name="mentor"
                  value={filters.mentor}
                  onChange={handleMentorFilterChange}
                  className="w-full appearance-none border border-gray-200 rounded-xl pl-3 pr-8 py-2.5 text-xs font-semibold outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-gray-650 bg-white shadow-sm cursor-pointer"
                >
                  <option value="">All Mentors</option>
                  {mentors.map(m => (
                    <option key={m._id} value={m._id}>{m.fullName}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Calendar Grid Container */}
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-2"></div>
                <p className="text-xs text-gray-500">Loading attendance data...</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  {/* Days of Week Header */}
                  <div className="grid grid-cols-7 mb-4 text-center">
                    {daysOfWeek.map((day, idx) => (
                      <div key={idx} className="text-xs font-bold text-[#5c7aff] tracking-wider py-1">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-y-3">
                    {getCalendarDays(filters.month, filters.year).map((day, index) => renderCalendarDay(day, index))}
                  </div>
                </div>

                {/* Footer Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mt-12 pt-6 border-t border-gray-100 gap-4">
                  <div>
                    <p className="text-sm text-gray-400 font-medium leading-relaxed">
                      This month you have {summary.totalDays} attendance logs
                      Present: {summary.presentDays} days | Absent: {summary.absentDays} days
                    </p>
                  </div>

                  {/* Floating Action Buttons */}
                  {/* <div className="flex space-x-4">
                    <button 
                      onClick={() => window.print()}
                      className="w-12 h-12 bg-[#ff7ce3] text-white rounded-full flex items-center justify-center shadow-[0_8px_20px_rgba(255,124,227,0.4)] hover:bg-pink-500 transition-colors"
                      title="Print Report"
                    >
                      <Pin className="w-5 h-5 fill-current" />
                    </button>
                    <Link 
                      to="/student/leave-request"
                      className="w-12 h-12 bg-[#5c7aff] text-white rounded-full flex items-center justify-center shadow-[0_8px_20px_rgba(92,122,255,0.4)] hover:bg-indigo-600 transition-colors"
                      title="Request Leave"
                    >
                      <Tag className="w-5 h-5 transform rotate-45" />
                    </Link>
                  </div> */}
                </div>
              </div>
            )}
          </div>

          {/* Footer & Pagination */}
          {/* <div className="p-5 border-t border-gray-100 flex justify-between items-center text-sm">
            <span className="text-gray-500">Showing 1 to {attendance.length} of {attendance.length} records</span>
          </div> */}

        </div>
      </div>
    </div>
  );
}