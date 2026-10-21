import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Percent,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Users,
  BarChart2
} from 'lucide-react';
import UserService from '../../../services/user-api-service/UserService';
import { Navbar } from '../../../components/user/UserNavBar';

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

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${month}/${day}/${year}`;
  };

  const isTodayDate = (dateStr) => {
    if (!dateStr) return false;
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return dateStr === `${y}-${m}-${d}`;
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
    let currentY = parseInt(filters.year || new Date().getFullYear());
    currentM += dir;
    if (currentM < 1) {
      currentM = 12;
      currentY -= 1;
    } else if (currentM > 12) {
      currentM = 1;
      currentY += 1;
    }
    const updatedFilters = { ...filters, month: currentM.toString(), year: currentY.toString() };
    setFilters(updatedFilters);
    setActiveFilters(updatedFilters);
    fetchAttendance(updatedFilters);
  };

  const handleTodayClick = () => {
    const now = new Date();
    const m = (now.getMonth() + 1).toString();
    const y = now.getFullYear().toString();
    const updatedFilters = { ...filters, month: m, year: y };
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
      let idx = (activeIdx + i) % 12;
      if (idx < 0) idx += 12;
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
    // Adjacent month padding days
    if (day.type === 'prev' || day.type === 'next') {
      return (
        <div
          key={`pad-${index}`}
          className="min-h-[58px] sm:min-h-[64px] border border-gray-100/70 rounded-xl p-1 flex flex-col items-center justify-center bg-gray-50/30"
        >
          <span className="text-gray-300 font-normal text-xs sm:text-sm">{day.date}</span>
        </div>
      );
    }

    const dayRecords = attendance.filter(r => r.date === day.dateStr);

    // If attendance record exists
    if (dayRecords.length > 0) {
      const colors = dayRecords.map(r => r.status === true ? '#10b981' : '#f43f5e');
      const isPresent = dayRecords[0].status === true;
      const isSingle = colors.length === 1;

      let tooltip = "";
      if (isSingle) {
        tooltip = `Date: ${formatDate(day.dateStr)} | Status: ${isPresent ? 'Present' : 'Absent'} | Mentor: ${dayRecords[0].mentor?.fullName || 'N/A'}`;
      } else {
        tooltip = `Date: ${formatDate(day.dateStr)} | ` + dayRecords.map((r, i) => `Session ${i + 1}: ${r.status ? 'Present' : 'Absent'} (${r.mentor?.fullName || 'N/A'})`).join(' / ');
      }

      if (isSingle) {
        return (
          <div
            key={day.dateStr}
            title={tooltip}
            className="min-h-[58px] sm:min-h-[64px] border border-gray-100 rounded-xl p-1 flex flex-col items-center justify-center relative hover:border-gray-200 hover:shadow-xs transition bg-white"
          >
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full text-white font-bold text-xs sm:text-sm flex items-center justify-center shadow-xs transition-transform hover:scale-105 ${
                isPresent ? 'bg-[#10b981]' : 'bg-[#f43f5e]'
              }`}
            >
              {day.date}
            </div>
            <span
              className={`w-1.5 h-1.5 rounded-full mt-1 ${
                isPresent ? 'bg-[#10b981]' : 'bg-[#f43f5e]'
              }`}
            />
          </div>
        );
      } else {
        const percentageStep = 100 / colors.length;
        const gradientStops = colors.map((color, idx) => {
          const start = (idx * percentageStep).toFixed(1);
          const end = ((idx + 1) * percentageStep).toFixed(1);
          return `${color} ${start}% ${end}%`;
        });

        const conicStyle = {
          background: `conic-gradient(${gradientStops.join(', ')})`
        };

        return (
          <div
            key={day.dateStr}
            title={tooltip}
            className="min-h-[58px] sm:min-h-[64px] border border-gray-100 rounded-xl p-1 flex flex-col items-center justify-center relative hover:border-gray-200 hover:shadow-xs transition bg-white"
          >
            <div
              style={conicStyle}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full text-white font-bold text-xs sm:text-sm flex items-center justify-center shadow-xs transition-transform hover:scale-105"
            >
              {day.date}
            </div>
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] mt-1" />
          </div>
        );
      }
    }

    // Today without attendance record
    if (isTodayDate(day.dateStr)) {
      return (
        <div
          key={day.dateStr}
          title={`Today: ${formatDate(day.dateStr)} (No record)`}
          className="min-h-[58px] sm:min-h-[64px] border border-blue-200 rounded-xl p-1 flex flex-col items-center justify-center relative hover:border-blue-300 transition bg-blue-50/20"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#3b82f6] text-white font-bold text-xs sm:text-sm flex items-center justify-center shadow-xs">
            {day.date}
          </div>
          <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] mt-1" />
        </div>
      );
    }

    // Default unmarked day
    return (
      <div
        key={day.dateStr}
        className="min-h-[58px] sm:min-h-[64px] border border-gray-100 rounded-xl p-1 flex flex-col items-center justify-center relative hover:bg-gray-50/70 transition bg-white"
      >
        <span className="text-gray-700 font-medium text-xs sm:text-sm">{day.date}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] p-4 sm:p-6 font-sans text-gray-800">
      <div className="max-w-7xl mx-auto space-y-6">
        <Navbar headData="Student Attendance" activeTab="Attendance Details" />

        {/* Top Metric Cards (Compact & Clean: 2 per row below md, 4 on md+) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Total Days */}
          <div className="bg-white rounded-2xl p-3 sm:p-4 border border-gray-100 shadow-sm flex items-center gap-2.5 sm:gap-3.5 hover:shadow-md transition-shadow min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-[#eff4ff] text-[#3b82f6] flex items-center justify-center flex-shrink-0">
              <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-medium text-gray-500 truncate">Total Days</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 leading-tight mt-0.5">
                {summary.totalDays}
              </p>
              <p className="text-[10px] sm:text-[11px] text-gray-400 font-medium">Days</p>
            </div>
          </div>

          {/* Card 2: Present Days */}
          <div className="bg-white rounded-2xl p-3 sm:p-4 border border-gray-100 shadow-sm flex items-center gap-2.5 sm:gap-3.5 hover:shadow-md transition-shadow min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-[#ecfdf3] text-[#10b981] flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-medium text-gray-500 truncate">Present Days</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 leading-tight mt-0.5">
                {summary.presentDays}
              </p>
              <p className="text-[10px] sm:text-[11px] text-gray-400 font-medium">Days</p>
            </div>
          </div>

          {/* Card 3: Absent Days */}
          <div className="bg-white rounded-2xl p-3 sm:p-4 border border-gray-100 shadow-sm flex items-center gap-2.5 sm:gap-3.5 hover:shadow-md transition-shadow min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-[#fef3f2] text-[#f43f5e] flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-medium text-gray-500 truncate">Absent Days</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 leading-tight mt-0.5">
                {summary.absentDays}
              </p>
              <p className="text-[10px] sm:text-[11px] text-gray-400 font-medium">Days</p>
            </div>
          </div>

          {/* Card 4: Attendance */}
          <div className="bg-white rounded-2xl p-3 sm:p-4 border border-gray-100 shadow-sm flex items-center gap-2.5 sm:gap-3.5 hover:shadow-md transition-shadow min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-[#fef8e7] text-[#f59e0b] flex items-center justify-center flex-shrink-0">
              <Percent className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-medium text-gray-500 truncate">Attendance</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 leading-tight mt-0.5 truncate">
                {summary.attendancePercentage}%
              </p>
              <p className="text-[10px] sm:text-[11px] text-gray-400 font-medium">Overall</p>
            </div>
          </div>
        </div>


        {/* Main Content Layout (Unified Card) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Calendar Sidebar */}
            <div className="lg:col-span-3 flex flex-col">
              <h3 className="text-lg font-bold text-gray-900 tracking-tight mb-6">Calendar</h3>

              {/* Year Switcher */}
              <div className="flex items-center justify-between px-2 mb-6 text-gray-500">
                <button
                  type="button"
                  onClick={() => handleYearChange(-1)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                  title="Previous Year"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="font-bold text-base text-gray-800">{filters.year || new Date().getFullYear()}</span>
                <button
                  type="button"
                  onClick={() => handleYearChange(1)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                  title="Next Year"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Months List */}
              <div className="flex flex-col space-y-2">
                {getSidebarMonths(filters.month).map((m, idx) => {
                  const isActive = filters.month === m.value;
                  const isOuter = idx === 0 || idx === 4;
                  const visibilityClass = isOuter ? 'hidden md:flex' : 'flex';

                  if (isActive) {
                    return (
                      <div
                        key={m.value}
                        onClick={() => handleMonthClick(m.value)}
                        className={`bg-blue-600 text-white rounded-xl px-4 py-2.5 ${visibilityClass} items-center justify-between shadow-sm cursor-pointer transition select-none`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-2.5 h-2.5 rounded-full bg-white flex-shrink-0" />
                          <span className="text-sm font-semibold">{m.name}</span>
                        </div>
                        <ChevronRight size={16} className="text-white flex-shrink-0" />
                      </div>
                    );
                  }
                  return (
                    <div
                      key={m.value}
                      onClick={() => handleMonthClick(m.value)}
                      className={`${visibilityClass} items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition select-none`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                      <span className="text-sm font-medium">{m.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Center: Main Calendar Grid Area */}
            <div className="lg:col-span-6 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                  {monthsList[parseInt(filters.month) - 1]?.name || ''} {filters.year}
                </h2>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleMonthChange(-1)}
                    className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition shadow-xs cursor-pointer"
                    title="Previous Month"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={handleTodayClick}
                    className="px-3.5 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition shadow-xs cursor-pointer"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMonthChange(1)}
                    className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition shadow-xs cursor-pointer"
                    title="Next Month"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Calendar Grid Container */}
              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center py-24">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                  <p className="text-xs text-gray-500">Loading attendance data...</p>
                </div>
              ) : (
                <div className="flex-1">
                  {/* Days of Week Header */}
                  <div className="grid grid-cols-7 mb-2 text-center">
                    {daysOfWeek.map((day, idx) => (
                      <div
                        key={idx}
                        className={`text-xs font-bold tracking-wider py-1.5 ${
                          idx === 0
                            ? 'text-rose-500'
                            : idx === 6
                            ? 'text-blue-600'
                            : 'text-gray-700'
                        }`}
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                    {getCalendarDays(filters.month, filters.year).map((day, index) =>
                      renderCalendarDay(day, index)
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Sidebar Widgets */}
            <div className="lg:col-span-3 flex flex-col gap-5">
              {/* Mentor Filter Dropdown */}
              <div className="relative bg-white border border-gray-200 rounded-xl px-3.5 py-2 shadow-xs flex items-center hover:border-gray-300 transition h-[36px] sm:h-[40px] mb-1">
                <Users size={16} className="text-gray-500 mr-2.5 flex-shrink-0" />
                <select
                  name="mentor"
                  value={filters.mentor}
                  onChange={handleMentorFilterChange}
                  className="w-full appearance-none bg-transparent text-xs font-semibold text-gray-700 outline-none cursor-pointer pr-6"
                >
                  <option value="">All Mentors</option>
                  {mentors.map(m => (
                    <option key={m._id} value={m._id}>{m.fullName}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="text-gray-400 absolute right-3 pointer-events-none" />
              </div>

              {/* Attendance Legend Card */}
              <div className="bg-[#fcfdfd] rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs">
                <h3 className="text-sm font-bold text-gray-900 mb-3.5">Attendance Legend</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="w-3.5 h-3.5 rounded-full bg-[#10b981] flex-shrink-0" />
                    <span className="text-xs font-medium text-gray-600">Present</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-3.5 h-3.5 rounded-full bg-[#f43f5e] flex-shrink-0" />
                    <span className="text-xs font-medium text-gray-600">Absent</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-3.5 h-3.5 rounded-full bg-[#3b82f6] flex-shrink-0" />
                    <span className="text-xs font-medium text-gray-600">Today</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-gray-200 bg-gray-50 flex-shrink-0" />
                    <span className="text-xs font-medium text-gray-600">Other Day</span>
                  </div>
                </div>
              </div>

              {/* Monthly Summary Card */}
              <div className="bg-[#fcfdfd] rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs">
                <div className="flex items-center gap-2 mb-3.5">
                  <BarChart2 size={16} className="text-blue-600 flex-shrink-0" />
                  <h3 className="text-sm font-bold text-gray-900">Monthly Summary</h3>
                </div>
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 font-medium">Total Days</span>
                    <span className="text-gray-900 font-bold">{summary.totalDays}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 font-medium">Present Days</span>
                    <span className="text-gray-900 font-bold">{summary.presentDays}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 font-medium">Absent Days</span>
                    <span className="text-gray-900 font-bold">{summary.absentDays}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 font-medium">Attendance</span>
                    <span className="text-gray-900 font-bold">{summary.attendancePercentage}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}