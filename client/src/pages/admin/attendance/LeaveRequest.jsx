import React, { useState, useEffect } from 'react';
import { Navbar } from '../../../components/admin/AdminNavBar';
import AdminService from '../../../services/admin-api-service/AdminService';
import { ChevronDown } from 'lucide-react';

const mockLeaveRequests = [
  {
    id: 1,
    name: 'John Abraham',
    batch: 'ui/ UX_JUN_RG_BI_2025',
    reason: 'Function',
    noOfDays: 1,
    leaveDate: '22/02/2025',
    status: 'Pending',
  },
  {
    id: 2,
    name: 'John Abraham',
    batch: 'ui/ UX_JUN_RG_BI_2025',
    reason: 'Exam',
    noOfDays: 1,
    leaveDate: '22/02/2025',
    status: 'Approved',
  },
  {
    id: 3,
    name: 'John Abraham',
    batch: 'ui/ UX_JUN_RG_BI_2025',
    reason: 'Family Function',
    noOfDays: 2,
    leaveDate: '22/02/2025 || 23/02/2025',
    status: 'Rejected',
  },
  {
    id: 4,
    name: 'John Abraham',
    batch: 'ui/ UX_JUN_RG_BI_2025',
    reason: 'Travel',
    noOfDays: 1,
    leaveDate: '22/02/2025',
    status: 'Approved',
  },
  {
    id: 5,
    name: 'John Abraham',
    batch: 'ui/',
    reason: 'Others',
    noOfDays: 3,
    leaveDate: '22/02/2025',
    status: 'Approved',
  },
];

// Component to render Status badge with specific colors
const StatusBadge = ({ status }) => {
  let colorClass;
  switch (status) {
    case 'Approved':
      colorClass = 'text-green-600 bg-green-100 border-green-300';
      break;
    case 'Rejected':
      colorClass = 'text-red-600 bg-red-100 border-red-300';
      break;
    case 'Pending':
    default:
      colorClass = 'text-blue-600 bg-blue-100 border-blue-300';
      break;
  }

  return (
    <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
      {status}
    </span>
  );
};

const LeaveRequest = () => {
  const [requests, setRequests] = useState(mockLeaveRequests);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Mocking 10 items per page based on the screenshot

  // AdminService for fetching data
  const {
    getBranchesData,
    getCoursesData,
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

  // Fetch filters from backend
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        setBranchesLoading(true);
        setCoursesLoading(true);
        setTimingsLoading(true);
        setDaysCombLoading(true);

        const [branchRes, courseRes, timeRes, daysRes, batchesRes] = await Promise.all([
          getBranchesData().catch(() => null),
          getCoursesData().catch(() => null),
          getTimingsData().catch(() => null),
          getDaysCombinationsData().catch(() => null),
          getAllBatchesData().catch(() => null)
        ]);

        if (branchRes?.data) setBranches(branchRes.data);
        if (courseRes?.data) setCourses(courseRes.data);
        if (timeRes?.data) {
          setAllTimings(timeRes.data);
          setTimings(timeRes.data);
        }
        if (daysRes?.data) {
          setAllDaysCombinations(daysRes.data);
          setDaysCombinations(daysRes.data);
        }
        if (batchesRes?.data) setAllBatches(batchesRes.data);

      } catch (err) {
        console.error('Failed to load filters:', err);
      } finally {
        setBranchesLoading(false);
        setCoursesLoading(false);
        setTimingsLoading(false);
        setDaysCombLoading(false);
      }
    };
    fetchFilters();
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


  // Handler for delete action (mock)
  const handleDelete = (id) => {
    // In a real app, this would be an API call
    console.log(`Deleting request with ID: ${id}`);
    setRequests(requests.filter(req => req.id !== id));
  };

  // Handler for view action (mock)
  const handleView = (id) => {
    // In a real app, this would open a modal or new view
    console.log(`Viewing details for request with ID: ${id}`);
  };

  // Icon for View/Eye
  const ViewIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
    </svg>
  );

  // Icon for Delete/Trash
  const DeleteIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
    </svg>
  );

  // Icon for Export
  const ExportIcon = () => (
    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
    </svg>
  );

  return (
    <>
      <Navbar headData="Leave Request" activeTab="Leave Request" />

      <div className="w-full  bg-white rounded-xl shadow-2xl p-6 sm:p-8">


        <h1 className="text-3xl font-bold text-gray-900 mb-6">Leave Request</h1>

        {/* Filter and Action Bar */}
        <div className="flex flex-wrap gap-3 mb-8 items-center justify-start lg:justify-end">

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

          {/* Export Button */}
          <button className="flex items-center py-2 px-4 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors shadow-sm">
            Export <ExportIcon />
          </button>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-600 font-semibold uppercase text-xs sm:text-sm border-b border-gray-200">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Batch</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">No of Days</th>
                <th className="py-3 px-4">Leave Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id} className="border-b last:border-b-0 border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-800">{request.name}</div>
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-500">
                    <div className="font-medium">{request.batch.split('/')[0]}/</div>
                    <div className="text-[10px] text-gray-400">{request.batch.split('/')[1]}</div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{request.reason}</td>
                  <td className="py-3 px-4 text-sm text-red-500">{request.noOfDays}</td>
                  <td className="py-3 px-4 text-sm font-medium text-red-500 whitespace-nowrap">
                    {request.leaveDate.includes('||') ? (
                      <>
                        {request.leaveDate.split(' || ')[0]}
                        <span className='text-gray-400'> || </span>
                        {request.leaveDate.split(' || ')[1]}
                      </>
                    ) : request.leaveDate}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={request.status} />
                  </td>
                  <td className="py-3 px-4 flex justify-center space-x-3 text-gray-500">
                    <button
                      onClick={() => handleView(request.id)}
                      className="text-gray-500 hover:text-blue-600 p-1 rounded-full hover:bg-blue-50 transition-colors"
                      title="View Details"
                    >
                      <ViewIcon />
                    </button>
                    <button
                      onClick={() => handleDelete(request.id)}
                      className="text-gray-500 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition-colors"
                      title="Delete Request"
                    >
                      <DeleteIcon />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-end items-center mt-6">
          <span className="text-sm text-gray-600 mr-4">
            1 of 10
          </span>
          <div className="flex space-x-2">
            <button
              disabled={currentPage === 1}
              className="p-2 border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            </button>
            <button
              disabled={currentPage * itemsPerPage >= requests.length}
              className="p-2 border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </button>
          </div>
        </div>

      </div>
    </>
  );
}

export default LeaveRequest