import React, { useState, useEffect } from 'react';
import { Navbar } from '../../../components/user/UserNavBar';
import UserService from '../../../services/user-api-service/UserService';
import { Eye, Calendar, Clock, AlertCircle } from 'lucide-react';
import Tabs from "../../../components/button/Tabs";

// Component to render Status badge with specific colors
const StatusBadge = ({ status }) => {
  let colorClass;
  const lowerStatus = status?.toLowerCase();
  switch (lowerStatus) {
    case 'approved':
      colorClass = 'text-green-600 bg-green-50 border-green-200';
      break;
    case 'rejected':
      colorClass = 'text-red-600 bg-red-50 border-red-200';
      break;
    case 'pending':
    default:
      colorClass = 'text-blue-600 bg-blue-50 border-blue-200';
      break;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border uppercase ${colorClass}`}>
      {status}
    </span>
  );
};

const LeaveRequest = () => {
  const [activeTab, setActiveTab] = useState('leaveList');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 5
  });

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

  // Form state
  const [formData, setFormData] = useState({
    leaveDurationType: 'SINGLE',
    leaveType: '',
    date: '',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const userService = UserService();

  // Fetch leave requests from backend (retrieve logged-in intern's own list)
  const fetchLeaveRequests = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      });
      const res = await userService.getMyLeaveRequests(queryParams.toString());
      if (res?.success && res.data) {
        setRequests(res.data);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      console.error('Failed to fetch leave requests:', err);
      setError('Failed to load leave requests from server.');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  // Pagination handlers
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
      fetchLeaveRequests(newPage);
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    const isSingle = formData.leaveDurationType === 'SINGLE';
    if (!formData.leaveType || !formData.reason || (isSingle ? !formData.date : (!formData.startDate || !formData.endDate))) {
      showNotification('error', 'Validation Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        leaveDurationType: formData.leaveDurationType,
        leaveType: formData.leaveType,
        reason: formData.reason,
        attachments: []
      };

      if (isSingle) {
        payload.date = formData.date;
      } else {
        payload.startDate = formData.startDate;
        payload.endDate = formData.endDate;
      }

      const res = await userService.postLeaveRequest(payload);

      if (res?.success) {
        showNotification('success', 'Success', 'Leave request submitted successfully.');
        fetchLeaveRequests(1);
        setActiveTab('leaveList');
        setFormData({ leaveDurationType: 'SINGLE', leaveType: '', date: '', startDate: '', endDate: '', reason: '' });
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

  const tabOptions = [
    { value: "leaveList", label: "Leave Requests" },
    { value: "applyLeave", label: "Apply Leave" }
  ];

  const renderLeaveList = () => (
    <div className="space-y-4">
      {/* Loading & Errors */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading leave requests...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center p-12 text-red-500">
          <AlertCircle className="w-6 h-6 mr-2" />
          <span>{error}</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 bg-gray-55/30 rounded-xl border border-dashed border-gray-300">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No leave requests</h3>
          <p className="mt-1 text-sm text-gray-500">You haven't submitted any leave requests yet.</p>
          <button
            onClick={() => setActiveTab('applyLeave')}
            className="mt-4 px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 transition-colors"
          >
            Apply Leave
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto border border-gray-150 rounded-lg shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Leave Type</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Days</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Leave Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((request) => (
                  <tr key={request._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {request.leaveType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-red-500">
                      {request.totalDays}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.leaveDurationType === 'MULTIPLE' || request.totalDays > 1 ? (
                        <>
                          {formatDate(request.startDate)}
                          <span className="text-gray-400"> to </span>
                          {formatDate(request.endDate)}
                        </>
                      ) : formatDate(request.date || request.startDate)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={request.reason}>
                      {request.reason}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                      <button 
                        onClick={() => handleView(request)}
                        className="text-orange-500 hover:text-orange-700 flex items-center justify-center mx-auto"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4 mr-1.5" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {requests.map((request) => (
              <div key={request._id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold text-gray-900">{request.leaveType}</span>
                  <StatusBadge status={request.status} />
                </div>
                <div className="space-y-2 text-xs text-gray-600 mb-3 border-t border-b border-gray-100 py-2">
                  <div>
                    <span className="font-medium text-gray-700">Leave Dates:</span>{' '}
                    {request.leaveDurationType === 'MULTIPLE' || request.totalDays > 1 ? `${formatDate(request.startDate)} to ${formatDate(request.endDate)}` : formatDate(request.date || request.startDate)}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Days:</span>{' '}
                    <span className="font-semibold text-red-500">{request.totalDays}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Reason:</span>{' '}
                    <p className="mt-0.5 text-gray-600 line-clamp-2">{request.reason}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleView(request)}
                  className="w-full py-1.5 text-xs font-medium text-orange-600 bg-orange-50 rounded-md hover:bg-orange-100 transition-colors flex items-center justify-center"
                >
                  <Eye className="w-3.5 h-3.5 mr-1" /> View Details
                </button>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-4 py-3 bg-white border-t border-gray-200">
              <div className="flex items-center text-xs sm:text-sm text-gray-700 text-center sm:text-left">
                <span>
                  Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount} results
                </span>
              </div>

              <div className="flex items-center space-x-2">
                {/* Previous Button */}
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrevPage || loading}
                  className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors duration-200 flex items-center ${pagination.hasPrevPage && !loading
                      ? 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                      : 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed'
                    }`}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  {loading ? 'Loading...' : 'Previous'}
                </button>

                {/* Current Page Info */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                </div>

                {/* Next Button */}
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage || loading}
                  className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors duration-200 flex items-center ${pagination.hasNextPage && !loading
                      ? 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                      : 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed'
                    }`}
                >
                  {loading ? 'Loading...' : 'Next'}
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    <div className="w-full bg-white p-2 sm:p-4">
      <form onSubmit={handleApplyLeave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Duration Type */}
          <div className="md:col-span-2">
            <label className="block text-gray-700 font-semibold text-sm mb-2">Duration Type <span className="text-red-500">*</span></label>
            <div className="flex gap-6">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="leaveDurationType"
                  value="SINGLE"
                  checked={formData.leaveDurationType === 'SINGLE'}
                  onChange={handleInputChange}
                  className="form-radio text-orange-500 focus:ring-orange-500 h-4 w-4"
                />
                <span className="ml-2 text-sm text-gray-700">Single Day</span>
              </label>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="leaveDurationType"
                  value="MULTIPLE"
                  checked={formData.leaveDurationType === 'MULTIPLE'}
                  onChange={handleInputChange}
                  className="form-radio text-orange-500 focus:ring-orange-500 h-4 w-4"
                />
                <span className="ml-2 text-sm text-gray-700">Multiple Days</span>
              </label>
            </div>
          </div>

          {/* Leave Type Dropdown */}
          <div className="md:col-span-2">
            <label className="block text-gray-700 font-semibold text-sm mb-2">Leave Type <span className="text-red-500">*</span></label>
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

          {formData.leaveDurationType === 'SINGLE' ? (
            <div className="md:col-span-2">
              <label className="block text-gray-700 font-semibold text-sm mb-2">Date <span className="text-red-500">*</span></label>
              <input 
                name="date" 
                value={formData.date} 
                onChange={handleInputChange} 
                type="date" 
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm" 
              />
            </div>
          ) : (
            <>
              {/* Start Date */}
              <div>
                <label className="block text-gray-700 font-semibold text-sm mb-2">Start Date <span className="text-red-500">*</span></label>
                <input 
                  name="startDate" 
                  value={formData.startDate} 
                  onChange={handleInputChange} 
                  type="date" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm" 
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-gray-700 font-semibold text-sm mb-2">End Date <span className="text-red-500">*</span></label>
                <input 
                  name="endDate" 
                  value={formData.endDate} 
                  onChange={handleInputChange} 
                  type="date" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm" 
                />
              </div>
            </>
          )}

          {/* Reason */}
          <div className="md:col-span-2">
            <label className="block text-gray-700 font-semibold text-sm mb-2">Reason <span className="text-red-500">*</span></label>
            <textarea 
              name="reason" 
              value={formData.reason} 
              onChange={handleInputChange} 
              placeholder="Enter details about your leave..."
              rows="4" 
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        <div className="flex gap-4 justify-end pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => {
              setActiveTab('leaveList');
              setFormData({ leaveDurationType: 'SINGLE', leaveType: '', date: '', startDate: '', endDate: '', reason: '' });
            }}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
    <div className="min-h-screen bg-gray-50/50 p-6 font-sans text-gray-800">
      <Navbar headData="Leave Requests" activeTab={activeTab === 'leaveList' ? 'My Leave Requests' : 'Apply Leave'}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="w-full sm:w-auto">
            <Tabs tabs={tabOptions} activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>
        </div>
      </Navbar>

      <div className="w-full bg-white rounded-xl shadow-2xl p-4 sm:p-6 lg:p-8">
        {/* Conditional Rendering */}
        {activeTab === 'leaveList' ? renderLeaveList() : renderNewLeaveForm()}
      </div>

      {/* Notification Modal */}
      <NotificationModal />

      {/* Detailed Leave View Modal */}
      {showViewModal && viewingLeave && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Leave Details
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Submitted on {formatDate(viewingLeave.createdAt)}
                </p>
              </div>
              <button 
                onClick={closeViewModal}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-6 space-y-6 text-sm text-gray-600 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold text-gray-800 block text-xs uppercase tracking-wider">Leave Type</span>
                  <span className="text-gray-600 mt-1 block">{viewingLeave.leaveType}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-800 block text-xs uppercase tracking-wider">Total Duration</span>
                  <span className="text-gray-600 mt-1 block font-semibold text-red-500">{viewingLeave.totalDays} {viewingLeave.totalDays > 1 ? 'Days' : 'Day'}</span>
                </div>
                {viewingLeave.leaveDurationType === 'SINGLE' ? (
                  <div className="sm:col-span-2">
                    <span className="font-semibold text-gray-800 block text-xs uppercase tracking-wider">Date</span>
                    <span className="text-gray-600 mt-1 block">{formatDate(viewingLeave.date || viewingLeave.startDate)}</span>
                  </div>
                ) : (
                  <>
                    <div>
                      <span className="font-semibold text-gray-800 block text-xs uppercase tracking-wider">Start Date</span>
                      <span className="text-gray-600 mt-1 block">{formatDate(viewingLeave.startDate)}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-800 block text-xs uppercase tracking-wider">End Date</span>
                      <span className="text-gray-600 mt-1 block">{formatDate(viewingLeave.endDate)}</span>
                    </div>
                  </>
                )}
              </div>

              <div>
                <span className="font-semibold text-gray-800 block text-xs uppercase tracking-wider mb-2">Reason</span>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200 leading-relaxed">
                  {viewingLeave.reason}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <span className="font-semibold text-gray-800 block text-xs uppercase tracking-wider mb-2">Status & Feedback</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div>
                    <StatusBadge status={viewingLeave.status} />
                  </div>
                  {viewingLeave.reviewedAt && (
                    <div className="text-xs text-gray-500">
                      Reviewed on {formatDate(viewingLeave.reviewedAt)}
                    </div>
                  )}
                </div>
                {viewingLeave.rejectionReason && (
                  <div className="mt-4">
                    <span className="font-semibold text-red-700 block text-xs uppercase tracking-wider mb-2">Rejection Reason</span>
                    <p className="text-red-600 bg-red-50 p-3 rounded-lg border border-red-200 leading-relaxed">
                      {viewingLeave.rejectionReason}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={closeViewModal}
                className="px-6 py-2 bg-gray-800 text-white text-sm font-semibold rounded-lg hover:bg-gray-900 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveRequest;