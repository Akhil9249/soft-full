import React, { useState, useEffect } from 'react';
import { Navbar } from '../../../components/admin/AdminNavBar';
import AdminService from '../../../services/admin-api-service/AdminService';
import { ChevronDown, Check, X, Eye } from 'lucide-react';

// Component to render Status badge with specific colors
const StatusBadge = ({ status }) => {
  let colorClass;
  const lowerStatus = status?.toLowerCase();
  switch (lowerStatus) {
    case 'approved':
      colorClass = 'text-green-600 bg-green-100 border-green-300';
      break;
    case 'rejected':
      colorClass = 'text-red-600 bg-red-100 border-red-300';
      break;
    case 'pending':
    default:
      colorClass = 'text-blue-600 bg-blue-100 border-blue-300';
      break;
  }

  return (
    <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium border uppercase ${colorClass}`}>
      {status}
    </span>
  );
};

const LeaveRequest = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // AdminService for fetching data
  const {
    getBranchesData,
    getCoursesData,
    getTimingsData,
    getDaysCombinationsData,
    getAllBatchesData,
    getAllLeaveRequests,
    updateLeaveRequestStatus
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

  // Fetch leave requests from backend
  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAllLeaveRequests();
      if (res?.success && res.data) {
        setRequests(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch leave requests:', err);
      setError('Failed to load leave requests from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

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

  // Handler for approving or rejecting leave requests
  const handleStatusChange = async (id, newStatus) => {
    try {
      let rejectionReason = '';
      if (newStatus === 'REJECTED') {
        rejectionReason = prompt('Please enter the reason for rejection:') || '';
        if (rejectionReason.trim() === '') {
          alert('Rejection reason is required.');
          return;
        }
      }

      const res = await updateLeaveRequestStatus(id, { status: newStatus, rejectionReason });
      if (res?.success) {
        fetchLeaveRequests();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      alert(err.response?.data?.message || 'Failed to update leave request status.');
    }
  };

  // Handler for view action
  const handleView = (request) => {
    let details = `Leave Request Details:
-----------------------------
Name: ${request.user?.fullName || request.user?.name || 'N/A'}
Type: ${request.leaveType}
Dates: ${formatDate(request.startDate)} to ${formatDate(request.endDate)} (${request.totalDays} days)
Reason: ${request.reason}
Status: ${request.status}`;

    if (request.status === 'REJECTED' && request.rejectionReason) {
      details += `\nRejection Reason: ${request.rejectionReason}`;
    }
    if (request.reviewedBy) {
      details += `\nReviewed By: ${request.reviewedBy?.fullName || request.reviewedBy?.name || 'N/A'}`;
    }

    alert(details);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB'); // DD/MM/YYYY
  };

  // Client-side filtering
  const filteredRequests = requests.filter((req) => {
    // 1. Branch Filter
    if (selectedBranch && req.branch?._id !== selectedBranch && req.branch !== selectedBranch) {
      return false;
    }

    // 2. Course Filter
    if (selectedCourse && req.user?.course !== selectedCourse && req.user?.course?._id !== selectedCourse) {
      return false;
    }

    // 3. Timing Filter
    if (selectedTiming) {
      const userTime = req.user?.time;
      if (Array.isArray(userTime)) {
        if (!userTime.some(t => t === selectedTiming || t?._id === selectedTiming)) {
          return false;
        }
      } else if (userTime !== selectedTiming && userTime?._id !== selectedTiming) {
        return false;
      }
    }

    // 4. Month Filter
    if (selectedMonth) {
      const reqDate = req.startDate ? new Date(req.startDate) : null;
      if (reqDate) {
        const monthStr = String(reqDate.getMonth() + 1).padStart(2, '0');
        if (monthStr !== selectedMonth) {
          return false;
        }
      } else {
        return false;
      }
    }

    // 5. Year Filter
    if (selectedYear) {
      const reqDate = req.startDate ? new Date(req.startDate) : null;
      if (reqDate) {
        const yearStr = reqDate.getFullYear().toString();
        if (yearStr !== selectedYear) {
          return false;
        }
      } else {
        return false;
      }
    }

    return true;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);

  // Icon for View/Eye
  const ViewIcon = () => (
    <Eye className="w-5 h-5" />
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
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-500">
                    Loading leave requests...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-red-500 font-medium">
                    {error}
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-500">
                    No leave requests found.
                  </td>
                </tr>
              ) : (
                currentItems.map((request) => {
                  const batchStr = request.user?.batch || 'N/A';
                  const hasSlash = batchStr.includes('/');
                  return (
                    <tr key={request._id} className="border-b last:border-b-0 border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-800">
                          {request.user?.fullName || request.user?.name || 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500">
                        <div className="font-medium">{hasSlash ? `${batchStr.split('/')[0]}/` : batchStr}</div>
                        {hasSlash && <div className="text-[10px] text-gray-400">{batchStr.split('/')[1]}</div>}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{request.reason}</td>
                      <td className="py-3 px-4 text-sm text-red-500">{request.totalDays}</td>
                      <td className="py-3 px-4 text-sm font-medium text-red-500 whitespace-nowrap">
                        {request.totalDays > 1 ? (
                          <>
                            {formatDate(request.startDate)}
                            <span className="text-gray-400"> || </span>
                            {formatDate(request.endDate)}
                          </>
                        ) : formatDate(request.startDate)}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={request.status} />
                      </td>
                      <td className="py-3 px-4 flex justify-center items-center space-x-3 text-gray-500">
                        <button
                          onClick={() => handleView(request)}
                          className="text-gray-500 hover:text-blue-600 p-1 rounded-full hover:bg-blue-50 transition-colors"
                          title="View Details"
                        >
                          <ViewIcon />
                        </button>
                        {request.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(request._id, 'APPROVED')}
                              className="text-green-500 hover:text-green-700 p-1 rounded-full hover:bg-green-50 transition-colors"
                              title="Approve Leave"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleStatusChange(request._id, 'REJECTED')}
                              className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                              title="Reject Leave"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-end items-center mt-6">
          <span className="text-sm text-gray-600 mr-4">
            {filteredRequests.length > 0 ? indexOfFirstItem + 1 : 0}-
            {Math.min(indexOfLastItem, filteredRequests.length)} of {filteredRequests.length}
          </span>
          <div className="flex space-x-2">
            <button
              disabled={currentPage === 1}
              className="p-2 border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
              </svg>
            </button>
            <button
              disabled={currentPage * itemsPerPage >= filteredRequests.length}
              className="p-2 border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
          </div>
        </div>

      </div>
    </>
  );
}

export default LeaveRequest