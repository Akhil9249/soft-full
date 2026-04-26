import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Check, X, ChevronDown, CalendarDays } from 'lucide-react';
import AdminService from '../../../services/admin-api-service/AdminService';
import Tabs from '../../../components/button/Tabs';

// --- Mock Data ---
const mockAttendanceData = [
  { admNo: '1111', name: 'John Abraham', attendance: [1, 1, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0] },
  { admNo: '1112', name: 'Alice Smith', attendance: [1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
  { admNo: '1113', name: 'Bob Johnson', attendance: [0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1] },
  { admNo: '1114', name: 'Emily Davis', attendance: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0] },
  { admNo: '1115', name: 'Michael Lee', attendance: [1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1] },
];

const tabOptions = [
  { value: "Student Attendance", label: "Student Attendance" },
  { value: "Report", label: "Report" },
];

const AttendanceIcon = ({ status }) => {
  // status: 1 = Present (Green Check), 0 = Absent (Red X), -1 = Not Marked (Blank/Default)
  if (status === 1) {
    return <Check className="text-green-600 w-3 h-3 sm:w-4 sm:h-4" />;
  }
  if (status === 0) {
    return <X className="text-red-500 w-3 h-3 sm:w-4 sm:h-4" />;
  }
  return <div className="w-3 h-3 sm:w-4 sm:h-4 text-gray-300"></div>; // Blank for Not Marked
};

const AttendanceTable = ({ data, monthData }) => {
  // Generate days based on the month data or fallback to data length
  const daysInMonth = monthData?.daysInMonth || (data.length > 0 ? Math.max(...data.map(item => item.attendance.length)) : 31);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="overflow-x-auto -mx-2 sm:mx-0">
      <table className="min-w-auto divide-y divide-gray-200">
        {/* Table Header */}
        <thead className="bg-white sticky top-0 z-10">
          <tr>
            {/* Fixed Name/Adm. No. columns */}
            <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[4rem] sm:min-w-[5rem] sticky left-0 bg-white">
              Adm. No.
            </th><th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[8rem] sm:min-w-[12rem] sticky left-16 sm:left-20 bg-white shadow-inner">
              Student Info
            </th>{/* Scrollable Day columns */}
            {days.map(day => (
              <th
                key={day}
                scope="col"
                className="px-1 sm:px-2 py-2 sm:py-3 text-center text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[2rem] sm:min-w-[2.5rem]"
              >
                {day}
              </th>
            ))}<th scope="col" className="min-w-[2rem] sm:min-w-[4rem]"></th>
          </tr>
          <tr className="border-b border-gray-300">
            <td colSpan={2} className="p-0 border-r border-gray-200 sticky left-0 bg-white"></td><td colSpan={days.length} className="p-0"></td><td className="p-0"></td>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="bg-white divide-y divide-gray-100 text-xs sm:text-sm">
          {data.map((student, index) => (
            <tr key={`${student._id}_${index}`} className="hover:bg-yellow-50/50 transition duration-150 ease-in-out">
              {/* Fixed Name/Adm. No. cells */}
              <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-gray-900 font-medium sticky left-0 bg-white z-10 text-[10px] sm:text-sm">
                {student._id.slice(-4)}
              </td><td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-gray-800 sticky left-16 sm:left-20 bg-white z-10 shadow-inner text-[10px] sm:text-sm">
                <div className="font-semibold">{student.fullName}</div>
                <div className="text-[9px] sm:text-xs text-gray-500 mt-0.5"><span className="font-medium text-amber-600">Mentor:</span> {student.mentorName}</div>
              </td>{/* Scrollable Attendance Cells */}
              {days.map(dayIndex => (
                <td key={dayIndex} className="px-1 sm:px-2 py-3 sm:py-4 whitespace-nowrap text-center">
                  <AttendanceIcon status={student.attendance[dayIndex - 1]} />
                </td>
              ))}<td className="min-w-[2rem] sm:min-w-[4rem]"></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const AttendanceKey = () => (
  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
    <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Attendance</h2>
    <span className="flex items-center space-x-1.5">
      <Check className="text-green-600 w-3 h-3 sm:w-4 sm:h-4" />
      <span>Present</span>
    </span>
    <span className="flex items-center space-x-1.5">
      <X className="text-red-500 w-3 h-3 sm:w-4 sm:h-4" />
      <span>Absent</span>
    </span>
    <span className="flex items-center space-x-1.5">
      <div className="w-3 h-3 sm:w-4 sm:h-4 border border-gray-300 rounded-sm"></div>
      <span>Blank - Not Marked</span>
    </span>
  </div>
);

// --- Main App Component ---
const Report = ({ activeTab, setActiveTab }) => {
  // const [activeTab, setActiveTab] = useState('attendance');

  // AdminService for fetching data
  const {
    getBranchesData,
    getCoursesData,
    getInternsAttendanceByMonth,
    getTimingsData,
    getDaysCombinationsData,
    getAllBatchesData
  } = AdminService();

  // State for branches
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [branchesLoading, setBranchesLoading] = useState(false);

  // State for courses
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [coursesLoading, setCoursesLoading] = useState(false);

  // State for timings
  const [allTimings, setAllTimings] = useState([]);
  const [timings, setTimings] = useState([]);
  const [selectedTiming, setSelectedTiming] = useState('');
  const [timingsLoading, setTimingsLoading] = useState(false);

  // State for days combinations
  const [allDaysCombinations, setAllDaysCombinations] = useState([]);
  const [daysCombinations, setDaysCombinations] = useState([]);
  const [selectedDaysCombination, setSelectedDaysCombination] = useState('');
  const [daysCombLoading, setDaysCombLoading] = useState(false);

  // Batches for filtering
  const [allBatches, setAllBatches] = useState([]);

  // Year State
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  // State for month selection
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // State for attendance data
  const [attendanceData, setAttendanceData] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState('');
  const [monthData, setMonthData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch branches from backend
  const fetchBranches = async () => {
    try {
      setBranchesLoading(true);
      const response = await getBranchesData();

      if (response?.data) {
        setBranches(response.data);
        console.log('Branches loaded:', response.data.length, 'branches available');
      }
    } catch (err) {
      console.error('Failed to load branches:', err);
    } finally {
      setBranchesLoading(false);
    }
  };

  // Fetch courses from backend
  const fetchCourses = async () => {
    try {
      setCoursesLoading(true);
      const response = await getCoursesData();

      if (response?.data) {
        setCourses(response.data);
      }
    } catch (err) {
      console.error('Failed to load courses:', err);
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

  // Fetch attendance data for selected month
  const fetchAttendanceData = async (month, year, branchId = null, courseId = null, daysId = null, timingId = null) => {
    try {
      setAttendanceLoading(true);
      setAttendanceError('');

      if (!month || !year) {
        setAttendanceData([]);
        return;
      }

      // Use the new month-based API
      const response = await getInternsAttendanceByMonth(
        parseInt(month),
        parseInt(year),
        branchId,
        courseId,
        daysId,
        timingId
      );

      if (response?.data) {
        console.log('Response:', response.data.data);
        // Process the data to match the table format
        const processedData = response.data.data.map(intern => ({
          _id: intern._id,
          fullName: intern.fullName,
          email: intern.email,
          role: intern.role,
          branchName: intern.branchName,
          courseName: intern.courseName,
          mentorName: intern.mentorName,
          attendance: intern.attendance.map(dayAttendance => {
            if (dayAttendance === null) {
              return -1; // Not marked
            } else if (dayAttendance.status === true) {
              return 1; // Present
            } else if (dayAttendance.status === false) {
              return 0; // Absent
            }
            return -1; // Default to not marked
          })
        }));

        setAttendanceData(processedData);
        setMonthData(response.monthData);
        setSummary(response.summary);
        console.log('Processed attendance data:', processedData.length, 'interns');
        console.log('Month data:', response.monthData);
        console.log('Summary:', response.summary);
      } else {
        setAttendanceData([]);
        console.log('No attendance data found for the selected month');
      }

    } catch (err) {
      console.error('Failed to load attendance data:', err);
      setAttendanceError('Failed to load attendance data');
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    fetchBranches();
    fetchCourses();
    fetchTimings();
    fetchDaysAndBatches();
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

  // Fetch attendance data when month, branch, or course changes
  useEffect(() => {
    if (selectedMonth && selectedYear) {
      fetchAttendanceData(
        selectedMonth,
        selectedYear,
        selectedBranch || null,
        selectedCourse || null,
        selectedDaysCombination || null,
        selectedTiming || null
      );
    }
  }, [selectedMonth, selectedYear, selectedBranch, selectedCourse, selectedDaysCombination, selectedTiming]);

  const filteredAttendanceData = attendanceData.filter(student => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return student.fullName?.toLowerCase().includes(term) || 
           student._id?.slice(-4).includes(term);
  });

  const handleExport = async () => {
    if (!filteredAttendanceData || filteredAttendanceData.length === 0) return;
    try {
      setExporting(true);
      const doc = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();

      // Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(247, 147, 30);
      const title = 'Monthly Attendance Report';
      doc.text(title, (pageWidth - doc.getTextWidth(title)) / 2, 15);

      // Meta
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const metaLeft = `Month: ${selectedMonth || 'N/A'}`;
      const metaMid = `Branch: ${branches.find(b => b._id === selectedBranch)?.branchName || 'All'}`;
      const metaRight = `Course: ${courses.find(c => c._id === selectedCourse)?.courseName || 'All'}`;
      doc.text(metaLeft, 10, 22);
      doc.text(metaMid, (pageWidth - doc.getTextWidth(metaMid)) / 2, 22);
      const rightX = pageWidth - 10 - doc.getTextWidth(metaRight);
      doc.text(metaRight, rightX, 22);
      const exportedOn = `Exported on: ${new Date().toLocaleDateString('en-GB')}`;
      doc.text(exportedOn, (pageWidth - doc.getTextWidth(exportedOn)) / 2, 27);

      const daysInMonth = monthData?.daysInMonth || Math.max(...attendanceData.map(s => s.attendance?.length || 0), 31);

      // Build header: Adm No, Student Info, Day 1..N
      const head = [['Adm No', 'Student Info', ...Array.from({ length: daysInMonth }, (_, i) => String(i + 1))]];

      // Body rows
      const body = filteredAttendanceData.map(s => {
        const statuses = Array.from({ length: daysInMonth }, (_, i) => {
          const v = s.attendance?.[i];
          if (v === 1) return 'P';
          if (v === 0) return 'A';
          return '-';
        });
        const studentInfo = `${s.fullName || 'N/A'}\nMentor: ${s.mentorName || 'Unknown'}`;
        return [s._id?.slice(-4) || 'N/A', studentInfo, ...statuses];
      });

      autoTable(doc, {
        startY: 35,
        head,
        body,
        theme: 'striped',
        headStyles: { fillColor: [247, 147, 30], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak', lineWidth: 0.1 },
        columnStyles: {
          0: { cellWidth: 18, halign: 'center' },
          1: { cellWidth: 40, halign: 'left' }
          // day columns auto width
        },
        margin: { left: 10, right: 10 },
        tableWidth: 'auto'
      });

      // Page numbers
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(128, 128, 128);
        const text = `Page ${i} of ${pageCount}`;
        doc.text(text, (pageWidth - doc.getTextWidth(text)) / 2, doc.internal.pageSize.getHeight() - 8);
      }

      doc.save(`attendance_${selectedMonth || 'all'}_${new Date().toISOString().split('T')[0]}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen max-w-[1250px]  font-inter">
      {/* Global Header / Breadcrumb */}

      <Tabs tabs={tabOptions} activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Card */}
      <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-xl border border-gray-100 mt-4">

        {/* Top Filters and Tabs */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center  gap-4 mb-4">

          {/* Tabs */}
          <div className="flex rounded-lg overflow-hidden shadow-md">

          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search intern..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="appearance-none block w-full sm:w-48 bg-white border border-gray-300 rounded-lg py-2 pl-4 pr-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition shadow-sm text-sm"
              />
            </div>

            {/* Branch Dropdown */}
            <div className="relative">
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                disabled={branchesLoading}
                className="appearance-none block w-full bg-white border border-gray-300 rounded-lg py-2 pl-4 pr-10 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition shadow-sm text-sm"
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
              <ChevronDown className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 w-5 h-5 text-gray-400" />
            </div>

            {/* Course Dropdown */}
            <div className="relative">
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                disabled={coursesLoading}
                className="appearance-none block w-full bg-white border border-gray-300 rounded-lg py-2 pl-4 pr-10 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition shadow-sm text-sm"
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
              <ChevronDown className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 w-5 h-5 text-gray-400" />
            </div>

            {/* Timing Dropdown */}
            <div className="relative">
              <select
                value={selectedTiming}
                onChange={(e) => setSelectedTiming(e.target.value)}
                disabled={timingsLoading}
                className="appearance-none block w-full bg-white border border-gray-300 rounded-lg py-2 pl-4 pr-10 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition shadow-sm text-sm"
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
              <ChevronDown className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 w-5 h-5 text-gray-400" />
            </div>

            {/* Days Combination Dropdown */}
            <div className="relative">
              <select
                value={selectedDaysCombination}
                onChange={(e) => setSelectedDaysCombination(e.target.value)}
                disabled={daysCombLoading}
                className="appearance-none block w-full bg-white border border-gray-300 rounded-lg py-2 pl-4 pr-10 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition shadow-sm text-sm"
              >
                <option value="">
                  {daysCombLoading ? 'Loading days...' : 'All Days'}
                </option>
                {daysCombinations.map((day) => (
                  <option key={day._id} value={day._id}>
                    {day.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 w-5 h-5 text-gray-400" />
            </div>

            {/* Year Dropdown */}
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="appearance-none block w-full bg-white border border-gray-300 rounded-lg py-2 pl-4 pr-10 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition shadow-sm text-sm"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 w-5 h-5 text-gray-400" />
            </div>

            {/* Month Dropdown */}
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="appearance-none block w-full bg-white border border-gray-300 rounded-lg py-2 pl-4 pr-10 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition shadow-sm text-sm"
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
              <ChevronDown className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 w-5 h-5 text-gray-400" />
            </div>
            <button
              onClick={handleExport}
              disabled={attendanceLoading || exporting || filteredAttendanceData.length === 0}
              className="flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? 'Exporting...' : 'Export PDF'}
            </button>

            {/* Date Picker Icon Placeholder */}
            {/* <button className="flex items-center justify-center p-3 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition shadow-sm">
                <CalendarDays className="w-5 h-5" />
            </button> */}
          </div>
        </div>

        {/* Attendance Key / Legend */}
        {activeTab === 'attendance' && <AttendanceKey />}

        {/* Summary Statistics */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
            <div className="p-3 sm:p-4 bg-white rounded-lg sm:rounded-xl shadow-sm flex flex-col justify-center items-center">
              <div className="text-[10px] sm:text-xs font-semibold text-gray-500 mb-1">Total Interns</div>
              <div className="text-xl sm:text-2xl font-extrabold text-gray-800">
                {summary.totalInterns}
              </div>
            </div>
            <div className="p-3 sm:p-4 bg-white rounded-lg sm:rounded-xl shadow-sm flex flex-col justify-center items-center">
              <div className="text-[10px] sm:text-xs font-semibold text-gray-500 mb-1">Present</div>
              <div className="text-xl sm:text-2xl font-extrabold text-green-600">
                {summary.presentCount}
              </div>
            </div>
            <div className="p-3 sm:p-4 bg-white rounded-lg sm:rounded-xl shadow-sm flex flex-col justify-center items-center">
              <div className="text-[10px] sm:text-xs font-semibold text-gray-500 mb-1">Absent</div>
              <div className="text-xl sm:text-2xl font-extrabold text-red-500">
                {summary.absentCount}
              </div>
            </div>
            <div className="p-3 sm:p-4 bg-white rounded-lg sm:rounded-xl shadow-sm flex flex-col justify-center items-center">
              <div className="text-[10px] sm:text-xs font-semibold text-gray-500 mb-1">Not Marked</div>
              <div className="text-xl sm:text-2xl font-extrabold text-gray-500">
                {summary.notMarkedCount}
              </div>
            </div>
          </div>
        )}

        {/* Attendance Grid/Table */}
        {attendanceLoading ? (
          <div className="text-center py-6 sm:py-8">
            <div className="text-xs sm:text-sm text-gray-500">Loading attendance data...</div>
          </div>
        ) : attendanceError ? (
          <div className="text-center py-6 sm:py-8">
            <div className="text-xs sm:text-sm text-red-500">{attendanceError}</div>
          </div>
        ) : filteredAttendanceData.length > 0 ? (
          <AttendanceTable data={filteredAttendanceData} monthData={monthData} />
        ) : searchTerm && attendanceData.length > 0 ? (
          <div className="text-center py-6 sm:py-8 bg-gray-50 border border-gray-200 rounded-lg px-4">
            <div className="text-xs sm:text-sm text-gray-600 font-medium">No interns found matching "{searchTerm}"</div>
          </div>
        ) : selectedMonth ? (
          <div className="text-center py-6 sm:py-8 bg-yellow-50 border border-yellow-200 rounded-lg px-4">
            <div className="text-xs sm:text-sm text-yellow-800 font-medium">No attendance records found for the selected month</div>
            <div className="text-xs sm:text-sm text-yellow-600 mt-1">Try selecting a different month or check if attendance has been marked</div>
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8 bg-gray-50 border border-gray-200 rounded-lg px-4">
            <div className="text-xs sm:text-sm text-gray-600 font-medium">Select a month to view attendance records</div>
          </div>
        )}

        {/* Report View Placeholder */}
        {activeTab === 'report' && (
          <div className="p-6 sm:p-8 lg:p-10 text-center bg-gray-50 rounded-lg sm:rounded-xl border border-gray-200">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">Report View</h3>
            <p className="text-xs sm:text-sm text-gray-500">
              A detailed summary report would be displayed here, aggregating the attendance data.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Report;