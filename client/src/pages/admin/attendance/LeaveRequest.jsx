import React, { useState, useEffect } from 'react';
import { Navbar } from '../../../components/admin/AdminNavBar';
import AdminService from '../../../services/admin-api-service/AdminService';
import { ChevronDown, Check, X, Eye, FileText, Upload } from 'lucide-react';
import Tabs from "../../../components/button/Tabs";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  const [activeTab, setActiveTab] = useState('leaveList');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [notification, setNotification] = useState({
    show: false,
    type: 'success', // 'success', 'error', 'info'
    title: '',
    message: ''
  });

  const showNotification = (type, title, message) => {
    setNotification({
      show: true,
      type,
      title,
      message
    });
  };

  const hideNotification = () => {
    setNotification({
      show: false,
      type: 'success',
      title: '',
      message: ''
    });
  };

  // Detailed Modal for viewing details
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingLeave, setViewingLeave] = useState(null);

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewingLeave(null);
  };

  // Custom action modal state
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState(null); // 'APPROVE' or 'REJECT'
  const [actionTarget, setActionTarget] = useState(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  const triggerApprove = (request) => {
    setActionType('APPROVE');
    setActionTarget(request);
    setRejectionReasonInput('');
    setShowActionModal(true);
  };

  const triggerReject = (request) => {
    setActionType('REJECT');
    setActionTarget(request);
    setRejectionReasonInput('');
    setShowActionModal(true);
  };

  // Form state
  const [formData, setFormData] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // AdminService for fetching data
  const {
    getBranchesData,
    getCoursesData,
    getTimingsData,
    getDaysCombinationsData,
    getAllBatchesData,
    getAllLeaveRequests,
    updateLeaveRequestStatus,
    postLeaveRequest
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

  const [searchTerm, setSearchTerm] = useState('');

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

        const [branchRes, courseRes, timeRes, daysRes] = await Promise.all([
          getBranchesData().catch(() => null),
          getCoursesData().catch(() => null),
          getTimingsData().catch(() => null),
          getDaysCombinationsData().catch(() => null)
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

  const handleConfirmAction = async () => {
    if (!actionTarget) return;

    if (actionType === 'REJECT' && !rejectionReasonInput.trim()) {
      showNotification('error', 'Validation Error', 'Please enter a rejection reason.');
      return;
    }

    try {
      setLoading(true);
      setShowActionModal(false);
      
      const payload = {
        status: actionType === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        rejectionReason: actionType === 'REJECT' ? rejectionReasonInput : undefined
      };

      const res = await updateLeaveRequestStatus(actionTarget._id, payload);
      if (res?.success) {
        showNotification('success', 'Success', `Leave request ${payload.status.toLowerCase()} successfully.`);
        fetchLeaveRequests();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      showNotification('error', 'Error', err.response?.data?.message || 'Failed to update leave request status.');
    } finally {
      setLoading(false);
      setActionTarget(null);
      setActionType(null);
      setRejectionReasonInput('');
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!formData.leaveType || !formData.startDate || !formData.endDate || !formData.reason) {
      showNotification('error', 'Validation Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const res = await postLeaveRequest({
        leaveType: formData.leaveType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason,
        attachments: []
      });

      if (res?.success) {
        showNotification('success', 'Success', 'Leave request submitted successfully.');
        fetchLeaveRequests();
        setActiveTab('leaveList');
        setFormData({ leaveType: '', startDate: '', endDate: '', reason: '' });
      }
    } catch (err) {
      console.error('Failed to submit leave request:', err);
      showNotification('error', 'Submission Failed', err.response?.data?.message || 'Failed to submit leave request.');
    } finally {
      setLoading(false);
    }
  };

  // Handler for view action
  const handleView = (request) => {
    setViewingLeave(request);
    setShowViewModal(true);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB'); // DD/MM/YYYY
  };

  // Client-side filtering
  const filteredRequests = requests.filter((req) => {
    // 1. Search Term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const userName = (req.user?.fullName || req.user?.name || '').toLowerCase();
      const userEmail = (req.user?.email || '').toLowerCase();
      const userBatch = (req.user?.batch || '').toLowerCase();
      if (!userName.includes(search) && !userEmail.includes(search) && !userBatch.includes(search)) {
        return false;
      }
    }

    // 2. Branch Filter
    if (selectedBranch && req.branch?._id !== selectedBranch && req.branch !== selectedBranch) {
      return false;
    }

    // 3. Course Filter
    if (selectedCourse && req.user?.course !== selectedCourse && req.user?.course?._id !== selectedCourse) {
      return false;
    }

    // 4. Timing Filter
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

    // 5. Month Filter
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

    // 6. Year Filter
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

  const handlePageChange = (newPage) => {
    const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      showNotification('info', 'Exporting', 'Preparing PDF export...');
      
      if (filteredRequests.length === 0) {
        showNotification('error', 'Export Failed', 'No leave requests found matching filters.');
        return;
      }

      const doc = new jsPDF('portrait', 'mm', 'a4');
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(247, 147, 30); // Orange color
      doc.text('Leave Requests Report', 14, 20);
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Exported on: ${new Date().toLocaleDateString('en-GB')}`, 14, 30);
      doc.text(`Filtered Count: ${filteredRequests.length}`, 14, 35);

      const tableData = filteredRequests.map(req => [
        req.user?.fullName || req.user?.name || 'N/A',
        req.user?.batch || 'N/A',
        req.leaveType || 'N/A',
        `${formatDate(req.startDate)} - ${formatDate(req.endDate)}`,
        req.totalDays || 0,
        req.reason || 'N/A',
        req.status || 'N/A'
      ]);

      autoTable(doc, {
        startY: 45,
        head: [['Name', 'Batch', 'Type', 'Dates', 'Days', 'Reason', 'Status']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [247, 147, 30],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9
        },
        styles: {
          fontSize: 8,
          cellPadding: 3,
          overflow: 'linebreak',
          lineWidth: 0.1
        },
        margin: { left: 10, right: 10 },
        tableWidth: 'auto'
      });

      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() - 30, doc.internal.pageSize.getHeight() - 10);
      }

      doc.save(`leave_requests_export_${new Date().toISOString().split('T')[0]}.pdf`);
      showNotification('success', 'Export Successful', `Exported ${filteredRequests.length} requests successfully`);
    } catch (error) {
      console.error('Export error:', error);
      showNotification('error', 'Export Failed', 'Failed to export leave requests.');
    } finally {
      setLoading(false);
    }
  };

  const ViewIcon = () => (
    <Eye className="w-5 h-5" />
  );

  const headData = "Leave Requests";

  const tabOptions = [
    { value: "leaveList", label: "Leave Requests" },
    { value: "applyLeave", label: "Apply Leave" }
  ];

  const renderLeaveList = () => (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md flex-grow">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6">
        <div className="flex-1 sm:mr-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search Leave Requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path>
              </svg>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2 sm:space-y-0">
          <select 
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            disabled={branchesLoading}
            className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">All Branches</option>
            {branches.map(branch => (
              <option key={branch._id} value={branch._id}>{branch.branchName}</option>
            ))}
          </select>
          <select 
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            disabled={coursesLoading}
            className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">All Courses</option>
            {courses.map(course => (
              <option key={course._id} value={course._id}>{course.courseName}</option>
            ))}
          </select>
          <select 
            value={selectedTiming}
            onChange={(e) => setSelectedTiming(e.target.value)}
            disabled={timingsLoading}
            className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">All Timings</option>
            {timings.map(t => (
              <option key={t._id} value={t._id}>{t.timeSlot}</option>
            ))}
          </select>
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <button 
            onClick={handleExport}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-white text-gray-600 rounded-md font-medium border border-gray-300 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            {loading ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>

      {/* Loading & Errors */}
      {loading && requests.length === 0 ? (
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading leave requests...</p>
          </div>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="flex items-center justify-center p-12">
          <p className="text-gray-500 text-lg">
            No leave requests found matching filters.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider flex justify-center">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentItems.map((request) => {
                  const batchStr = request.user?.batch || 'N/A';
                  const hasSlash = batchStr.includes('/');
                  return (
                    <tr key={request._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                              <span className="text-orange-600 font-medium text-sm">
                                {(request.user?.fullName || request.user?.name || 'S').charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{request.user?.fullName || request.user?.name || 'N/A'}</div>
                            <div className="text-xs text-gray-500">{request.user?.email || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{hasSlash ? `${batchStr.split('/')[0]}/` : batchStr}</div>
                        {hasSlash && <div className="text-[10px] text-gray-400">{batchStr.split('/')[1]}</div>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={request.leaveType}>
                        {request.leaveType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-500">
                        {request.totalDays}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {request.totalDays > 1 ? (
                          <>
                            {formatDate(request.startDate)}
                            <span className="text-gray-400"> || </span>
                            {formatDate(request.endDate)}
                          </>
                        ) : formatDate(request.startDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={request.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center flex justify-center">
                        <div className="flex items-center justify-center space-x-3">
                          <button 
                            onClick={() => handleView(request)}
                            className="text-blue-600 hover:text-blue-900 flex items-center"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4 mr-1" /> View
                          </button>
                          {request.status === 'PENDING' && (
                            <>
                              <button 
                                onClick={() => triggerApprove(request)}
                                className="text-green-600 hover:text-green-900 flex items-center"
                                title="Approve"
                              >
                                <Check className="w-4 h-4 mr-1" /> Approve
                              </button>
                              <button 
                                onClick={() => triggerReject(request)}
                                className="text-red-600 hover:text-red-900 flex items-center"
                                title="Reject"
                              >
                                <X className="w-4 h-4 mr-1" /> Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {currentItems.map((request) => {
              const batchStr = request.user?.batch || 'N/A';
              return (
                <div key={request._id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                        <span className="text-orange-600 font-medium text-sm">
                          {(request.user?.fullName || request.user?.name || 'S').charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {request.user?.fullName || request.user?.name || 'N/A'}
                      </h3>
                      <p className="text-xs text-gray-500 truncate">{request.user?.email || 'N/A'}</p>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>
                  <div className="space-y-2 text-xs text-gray-600 mb-3 border-t border-b border-gray-100 py-2">
                    <div><span className="font-medium">Batch:</span> {batchStr}</div>
                    <div><span className="font-medium">Leave Dates:</span> {request.totalDays > 1 ? `${formatDate(request.startDate)} to ${formatDate(request.endDate)}` : formatDate(request.startDate)}</div>
                    <div><span className="font-medium">Days:</span> <span className="font-semibold text-red-500">{request.totalDays}</span></div>
                    <div><span className="font-medium">Reason:</span> {request.reason}</div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button 
                      onClick={() => handleView(request)}
                      className="flex-1 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors flex items-center justify-center"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" /> View
                    </button>
                    {request.status === 'PENDING' && (
                      <>
                        <button 
                          onClick={() => triggerApprove(request)}
                          className="flex-1 py-1.5 text-xs font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100 transition-colors flex items-center justify-center"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" /> Approve
                        </button>
                        <button 
                          onClick={() => triggerReject(request)}
                          className="flex-1 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors flex items-center justify-center"
                        >
                          <X className="w-3.5 h-3.5 mr-1" /> Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {filteredRequests.length > itemsPerPage && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-4 py-3 bg-white border-t border-gray-200">
              <div className="flex items-center text-xs sm:text-sm text-gray-700">
                <span>
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredRequests.length)} of {filteredRequests.length} results
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  className={`px-3 py-1.5 text-xs font-medium rounded border flex items-center ${
                    currentPage !== 1 && !loading
                      ? 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                      : 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed'
                  }`}
                >
                  <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={indexOfLastItem >= filteredRequests.length || loading}
                  className={`px-3 py-1.5 text-xs font-medium rounded border flex items-center ${
                    indexOfLastItem < filteredRequests.length && !loading
                      ? 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                      : 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed'
                  }`}
                >
                  Next
                  <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderNewLeaveForm = () => (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md flex-grow">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Apply Leave Request</h2>
      
      <form onSubmit={handleApplyLeave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Leave Type Dropdown */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Leave Type <span className="text-red-500">*</span></label>
            <select 
              name="leaveType" 
              value={formData.leaveType} 
              onChange={handleInputChange} 
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Choose Leave Type</option>
              <option value="SICK">Sick Leave</option>
              <option value="PERSONAL">Personal Leave</option>
              <option value="MEDICAL">Medical Leave</option>
              <option value="FAMILY">Family Leave</option>
              <option value="EXAM">Exam Leave</option>
              <option value="EVENT">Event Leave</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Start Date <span className="text-red-500">*</span></label>
            <input 
              name="startDate" 
              value={formData.startDate} 
              onChange={handleInputChange} 
              type="date" 
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" 
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">End Date <span className="text-red-500">*</span></label>
            <input 
              name="endDate" 
              value={formData.endDate} 
              onChange={handleInputChange} 
              type="date" 
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" 
            />
          </div>

          {/* Reason */}
          <div className="md:col-span-2">
            <label className="block text-gray-700 font-medium mb-2">Reason <span className="text-red-500">*</span></label>
            <textarea 
              name="reason" 
              value={formData.reason} 
              onChange={handleInputChange} 
              placeholder="Enter details about your leave..."
              rows="4" 
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex gap-4 justify-end pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => {
              setActiveTab('leaveList');
              setFormData({ leaveType: '', startDate: '', endDate: '', reason: '' });
            }}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 text-sm font-medium text-white bg-[#f7931e] rounded-md hover:bg-[#e67c00] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Apply Leave'}
          </button>
        </div>
      </form>
    </div>
  );

  const NotificationModal = () => {
    if (!notification.show) return null;

    const getIcon = () => {
      switch (notification.type) {
        case 'success':
          return (
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          );
        case 'error':
          return (
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          );
        case 'info':
        default:
          return (
            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          );
      }
    };

    const getButtonColor = () => {
      switch (notification.type) {
        case 'success':
          return 'bg-green-600 hover:bg-green-700 focus:ring-green-500';
        case 'error':
          return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
        case 'info':
        default:
          return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">{getIcon()}</div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900">{notification.title}</h3>
            </div>
          </div>
          <div className="mb-6">
            <p className="text-sm text-gray-500">{notification.message}</p>
          </div>
          <div className="flex justify-end">
            <button
              onClick={hideNotification}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${getButtonColor()}`}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Navbar headData={headData} activeTab={activeTab} />

      <div className="mb-6">
        <Tabs tabs={tabOptions} activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* Conditional Rendering */}
      {activeTab === 'leaveList' ? renderLeaveList() : renderNewLeaveForm()}

      {/* Notification Modal */}
      <NotificationModal />

      {/* Action Modal (Confirm Approve / Input Rejection Reason) */}
      {showActionModal && actionTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-gray-100">
            {/* Header */}
            <div className={`px-6 py-4 border-b border-gray-100 flex items-center gap-3 ${actionType === 'APPROVE' ? 'bg-green-50' : 'bg-red-50'}`}>
              {actionType === 'APPROVE' ? (
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0">
                  <Check className="w-5 h-5" />
                </div>
              ) : (
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
                  <X className="w-5 h-5" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {actionType === 'APPROVE' ? 'Approve Leave Request' : 'Reject Leave Request'}
                </h3>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-4 space-y-4">
              <p className="text-sm text-gray-600">
                {actionType === 'APPROVE' ? (
                  <>Are you sure you want to approve the leave request for <strong className="text-gray-900">{actionTarget.user?.fullName || actionTarget.user?.name || 'N/A'}</strong>?</>
                ) : (
                  <>Please enter the reason for rejecting the leave request for <strong className="text-gray-900">{actionTarget.user?.fullName || actionTarget.user?.name || 'N/A'}</strong>:</>
                )}
              </p>

              {actionType !== 'APPROVE' && (
                <div>
                  <textarea
                    value={rejectionReasonInput}
                    onChange={(e) => setRejectionReasonInput(e.target.value)}
                    placeholder="Enter rejection reason..."
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm resize-none"
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowActionModal(false);
                  setActionTarget(null);
                  setActionType(null);
                  setRejectionReasonInput('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={loading}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  actionType === 'APPROVE' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {loading ? 'Processing...' : actionType === 'APPROVE' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Leave View Modal */}
      {showViewModal && viewingLeave && (
        <>
          <style>{`
            @media print {
              @page { margin: 0; }
              body * { visibility: hidden; }
              .print-modal-content, .print-modal-content * { visibility: visible; }
              .print-modal-content {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                max-width: 100% !important;
                margin: 0;
                padding: 0;
                box-shadow: none;
                border: none;
                background: white;
              }
              .print-modal-content .print-hide { display: none !important; }
              .print-modal-content .print-full-width { width: 100% !important; max-width: 100% !important; }
            }
          `}</style>
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 print:block print:bg-white print:opacity-100 print:p-0">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto print-modal-content">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200 print:px-4 print:py-4 print-full-width">
                <div className="flex justify-between items-start gap-4">
                  <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 break-words">
                    Leave Request: {viewingLeave.user?.fullName || viewingLeave.user?.name || 'N/A'}
                  </h1>
                  <button 
                    onClick={closeViewModal}
                    className="flex items-center text-black gap-1 text-sm border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors print-hide flex-shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                    <span>Back</span>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-6 print:px-4 print:py-4 print-full-width">
                <div className="space-y-6 print-full-width">
                  {/* Basic Details */}
                  <div>
                    <h2 className="text-[#f7931e] font-semibold mb-4 text-lg italic">
                      Applicant Details
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 text-xs sm:text-sm print:grid-cols-2 print-full-width">
                      <p className="leading-6"><span className="font-semibold text-gray-900">Name:</span> <span className="text-gray-600">{viewingLeave.user?.fullName || viewingLeave.user?.name || 'N/A'}</span></p>
                      <p className="leading-6"><span className="font-semibold text-gray-900">Email:</span> <span className="text-gray-600">{viewingLeave.user?.email || 'N/A'}</span></p>
                      <p className="leading-6"><span className="font-semibold text-gray-900">Batch:</span> <span className="text-gray-600">{viewingLeave.user?.batch || 'N/A'}</span></p>
                      <p className="leading-6"><span className="font-semibold text-gray-900">Branch:</span> <span className="text-gray-600">{viewingLeave.branch?.branchName || 'N/A'}</span></p>
                    </div>
                  </div>

                  {/* Leave Details */}
                  <div>
                    <h2 className="text-[#f7931e] font-semibold mb-4 text-lg italic">
                      Leave Details
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 text-xs sm:text-sm print:grid-cols-2 print-full-width">
                      <p className="leading-6"><span className="font-semibold text-gray-900">Leave Type:</span> <span className="text-gray-600">{viewingLeave.leaveType}</span></p>
                      <p className="leading-6"><span className="font-semibold text-gray-900">Duration:</span> <span className="text-gray-600">{viewingLeave.totalDays} Days</span></p>
                      <p className="leading-6"><span className="font-semibold text-gray-900">Start Date:</span> <span className="text-gray-600">{formatDate(viewingLeave.startDate)}</span></p>
                      <p className="leading-6"><span className="font-semibold text-gray-900">End Date:</span> <span className="text-gray-600">{formatDate(viewingLeave.endDate)}</span></p>
                      <p className="col-span-2 leading-6"><span className="font-semibold text-gray-900">Reason:</span> <span className="text-gray-600 block bg-gray-50 p-3 rounded mt-1 border border-gray-200">{viewingLeave.reason}</span></p>
                    </div>
                  </div>

                  {/* Review Details */}
                  <div>
                    <h2 className="text-[#f7931e] font-semibold mb-4 text-lg italic">
                      Approval & Review
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 text-xs sm:text-sm print:grid-cols-2 print-full-width">
                      <p className="leading-6">
                        <span className="font-semibold text-gray-900">Status:</span>{" "}
                        <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full uppercase ${
                          viewingLeave.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                          viewingLeave.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {viewingLeave.status}
                        </span>
                      </p>
                      {viewingLeave.reviewedBy && (
                        <p className="leading-6"><span className="font-semibold text-gray-900">Reviewed By:</span> <span className="text-gray-600">{viewingLeave.reviewedBy?.fullName || viewingLeave.reviewedBy?.name || 'N/A'}</span></p>
                      )}
                      {viewingLeave.reviewedAt && (
                        <p className="leading-6"><span className="font-semibold text-gray-900">Reviewed At:</span> <span className="text-gray-600">{formatDate(viewingLeave.reviewedAt)}</span></p>
                      )}
                      {viewingLeave.rejectionReason && (
                        <p className="col-span-2 leading-6"><span className="font-semibold text-gray-900">Rejection Reason:</span> <span className="text-red-600 block bg-red-50 p-3 rounded mt-1 border border-red-200">{viewingLeave.rejectionReason}</span></p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-200 print-hide flex justify-end gap-3">
                {viewingLeave.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => {
                        closeViewModal();
                        triggerApprove(viewingLeave);
                      }}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        closeViewModal();
                        triggerReject(viewingLeave);
                      }}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      Reject
                    </button>
                  </>
                )}
                <button
                  onClick={() => window.print()}
                  className="bg-[#f7931e] text-white px-4 py-2 rounded-lg hover:bg-[#e67c00] transition-colors text-sm font-medium"
                >
                  Print
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default LeaveRequest;