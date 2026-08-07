import React, { useState, useEffect } from 'react';
import AdminService from '../../../services/admin-api-service/AdminService';
import UserService from '../../../services/user-api-service/UserService';
import { Navbar } from '../../../components/user/UserNavBar';
import Tabs from '../../../components/button/Tabs';

export const TaskSubmission = () => {
  const [activeTab, setActiveTab] = useState('tasks-list');
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [modules, setModules] = useState([]);

  // Pagination states
  const [tasksPagination, setTasksPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 5
  });

  const [submissionsPagination, setSubmissionsPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 5
  });

  const tabOptions = [
    { value: 'tasks-list', label: 'Assigned Tasks' },
    { value: 'submissions-list', label: 'My Submissions' }
  ];

  const handleTabChange = (value) => {
    setViewingSubmission(null);
    setActiveTab(value);
  };
  const [loading, setLoading] = useState(false);
  const [myTasksLoading, setMyTasksLoading] = useState(false);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    task: '',
    module: '',
    status: 'Submitted',
    submissionText: '',
    githubRepo: '',
    liveDemo: '',
    totalMarks: '',
    dueDate: '',
    achievedMarks: '',
    feedback: '',
    reviewedBy: '',
    reviewedDate: ''
  });
  
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [viewingSubmission, setViewingSubmission] = useState(null);

  // Notification Toast state
  const [notification, setNotification] = useState({
    show: false,
    type: 'success',
    title: '',
    message: ''
  });

  const { getModulesData } = AdminService();
  const {
    getMyTasksData,
    getMySubmissionsData,
    postTaskSubmissionData,
    downloadSubmissionAttachment
  } = UserService();

  const showNotification = (type, title, message) => {
    setNotification({
      show: true,
      type,
      title,
      message
    });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  const fetchTasks = async (page = 1) => {
    try {
      setMyTasksLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: tasksPagination.limit.toString()
      });
      const res = await getMyTasksData(queryParams.toString());
      setTasks(res?.data || []);
      if (res?.pagination) {
        setTasksPagination(res.pagination);
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
      showNotification('error', 'Error', 'Failed to retrieve tasks');
    } finally {
      setMyTasksLoading(false);
    }
  };

  const fetchSubmissions = async (page = 1) => {
    try {
      setSubmissionsLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: submissionsPagination.limit.toString()
      });
      const res = await getMySubmissionsData(queryParams.toString());
      setSubmissions(res?.data || []);
      if (res?.pagination) {
        setSubmissionsPagination(res.pagination);
      }
    } catch (err) {
      console.error('Failed to load submissions:', err);
      showNotification('error', 'Error', 'Failed to retrieve submissions');
    } finally {
      setSubmissionsLoading(false);
    }
  };

  // Fetch student's assigned tasks and submissions
  const loadData = async () => {
    try {
      setMyTasksLoading(true);
      setSubmissionsLoading(true);
      
      await Promise.all([
        fetchTasks(1),
        fetchSubmissions(1)
      ]);

      // Fetch modules for lookup if needed
      const modulesRes = await getModulesData('page=1&limit=10000');
      setModules(modulesRes?.data || []);
    } catch (err) {
      console.error('Failed to load lookup data:', err);
      showNotification('error', 'Error', 'Failed to retrieve task data');
    } finally {
      setMyTasksLoading(false);
      setSubmissionsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTasksPageChange = (newPage) => {
    if (newPage >= 1 && newPage <= tasksPagination.totalPages) {
      setTasksPagination(prev => ({ ...prev, currentPage: newPage }));
      fetchTasks(newPage);
    }
  };

  const handleSubmissionsPageChange = (newPage) => {
    if (newPage >= 1 && newPage <= submissionsPagination.totalPages) {
      setSubmissionsPagination(prev => ({ ...prev, currentPage: newPage }));
      fetchSubmissions(newPage);
    }
  };

  // Handle task selection to auto-populate module/marks/due date
  const handleFormTaskChange = (taskId) => {
    const taskObj = tasks.find(t => t._id === taskId);
    if (taskObj) {
      setFormData(prev => ({
        ...prev,
        task: taskId,
        module: taskObj.module || '',
        totalMarks: taskObj.totalMarks || 0,
        dueDate: taskObj.dueDate ? new Date(taskObj.dueDate).toISOString().split('T')[0] : ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        task: taskId,
        module: '',
        totalMarks: '',
        dueDate: ''
      }));
    }
  };

  const handleStartSubmission = (task) => {
    setViewingSubmission(null);
    setSelectedFiles([]);
    setFormData({
      task: task._id,
      module: task.module || '',
      status: 'Submitted',
      submissionText: '',
      githubRepo: '',
      liveDemo: '',
      totalMarks: task.totalMarks || 0,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      achievedMarks: '',
      feedback: '',
      reviewedBy: '',
      reviewedDate: ''
    });
    setActiveTab('submission-form');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleDownload = async (submissionId, originalName, index = 0) => {
    try {
      const response = await downloadSubmissionAttachment(submissionId, index);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', originalName || 'submission_attachment.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      showNotification('error', 'Download Failed', 'Could not download attachment file');
    }
  };

  // Inspect existing submission (read-only view matching form layout)
  const handleViewClick = (submission) => {
    setViewingSubmission(submission);
    const taskObj = submission.task || {};
    const graderObj = submission.gradedBy || {};
    
    setFormData({
      task: taskObj._id || '',
      module: taskObj.module || '',
      status: submission.status || 'Submitted',
      submissionText: submission.submissionText || '',
      githubRepo: submission.githubRepository || submission.githubRepo || '',
      liveDemo: submission.liveDemoUrl || submission.liveDemo || '',
      totalMarks: taskObj.totalMarks || '',
      dueDate: taskObj.dueDate ? new Date(taskObj.dueDate).toISOString().split('T')[0] : '',
      achievedMarks: submission.status === 'Graded' ? submission.achievedMarks : '',
      feedback: submission.feedback || '',
      reviewedBy: graderObj.fullName || '',
      reviewedDate: submission.gradedAt ? new Date(submission.gradedAt).toISOString().split('T')[0] : ''
    });
    
    setActiveTab('submission-form');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (viewingSubmission) return; // Prevent edits when viewing

    setLoading(true);
    try {
      const payload = new FormData();
      payload.append('task', formData.task);
      payload.append('submissionText', formData.submissionText);
      payload.append('githubRepo', formData.githubRepo);
      payload.append('liveDemo', formData.liveDemo);
      if (selectedFiles && selectedFiles.length > 0) {
        selectedFiles.forEach(file => {
          payload.append('attachments', file);
        });
      }
      
      await postTaskSubmissionData(payload);
      showNotification('success', 'Submitted Successfully', 'Your task submission has been uploaded.');
      
      // Reset and reload
      handleCancel();
      await loadData();
    } catch (err) {
      console.error('Submission error:', err);
      showNotification('error', 'Submission Failed', err.response?.data?.message || 'Failed to submit task');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      task: '',
      module: '',
      status: 'Submitted',
      submissionText: '',
      githubRepo: '',
      liveDemo: '',
      totalMarks: '',
      dueDate: '',
      achievedMarks: '',
      feedback: '',
      reviewedBy: '',
      reviewedDate: ''
    });
    setSelectedFiles([]);
    setViewingSubmission(null);
    setActiveTab('submissions-list');
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 font-sans text-gray-800">
      {/* Toast Notification */}
      {notification.show && (
        <div className="fixed top-6 right-6 z-50 flex items-center p-4 w-full max-w-xs text-gray-700 bg-white rounded-lg shadow-lg border border-gray-100">
          <div className={`inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg ${
            notification.type === 'success' ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'
          }`}>
            {notification.type === 'success' ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
            )}
          </div>
          <div className="ml-3 text-sm font-normal">
            <span className="mb-1 text-sm font-semibold text-gray-900 block">{notification.title}</span>
            <span className="text-xs text-gray-500 block">{notification.message}</span>
          </div>
        </div>
      )}

      <Navbar headData="Task" activeTab="Task Submission">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="w-full sm:w-auto">
            <Tabs tabs={tabOptions} activeTab={activeTab} setActiveTab={handleTabChange} />
          </div>
        </div>
      </Navbar>

      {/* Main Container */}
      <div className="w-full bg-white rounded-xl shadow-2xl p-4 sm:p-6 lg:p-8">
          {activeTab === 'tasks-list' ? (
            <div className="space-y-6">
              {/* Assigned Tasks Table */}
              {myTasksLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-sm text-gray-500 font-medium">Loading tasks...</p>
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-16 bg-gray-50/30 rounded-xl border border-dashed border-gray-300">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="mt-4 text-sm font-semibold text-gray-900">No tasks assigned</h3>
                  <p className="mt-1 text-sm text-gray-500">You currently have no tasks assigned to you.</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="min-w-full divide-y divide-gray-200 text-left">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                          <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                          <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Task Type</th>
                          <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Module</th>
                          <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Mentor</th>
                          <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Due Date</th>
                          <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {tasks.map((task, idx) => (
                          <tr key={task._id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{idx + 1}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-gray-900">{task.title}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                {task.taskType}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                                {task.module}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                              {task.assignedMentor?.fullName || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                              {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleStartSubmission(task)}
                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors"
                              >
                                Submit Task
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-4">
                    {tasks.map((task, idx) => (
                      <div key={task._id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h3 className="text-base font-semibold text-gray-900 mb-2">{task.title}</h3>
                        <div className="space-y-1 text-sm text-gray-600 mb-3">
                          <div><span className="font-medium">Type:</span> {task.taskType}</div>
                          <div><span className="font-medium">Module:</span> {task.module}</div>
                          <div><span className="font-medium">Mentor:</span> {task.assignedMentor?.fullName || 'N/A'}</div>
                          <div><span className="font-medium">Due Date:</span> {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</div>
                        </div>
                        <button
                          onClick={() => handleStartSubmission(task)}
                          className="w-full text-center text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg border border-blue-200 transition-colors font-medium text-sm"
                        >
                          Submit Task
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {tasksPagination.totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-4 py-3 bg-white border-t border-gray-200">
                      <div className="flex items-center text-xs sm:text-sm text-gray-700 text-center sm:text-left">
                        <span>
                          Showing {((tasksPagination.currentPage - 1) * tasksPagination.limit) + 1} to {Math.min(tasksPagination.currentPage * tasksPagination.limit, tasksPagination.totalCount)} of {tasksPagination.totalCount} results
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Previous Button */}
                        <button
                          onClick={() => handleTasksPageChange(tasksPagination.currentPage - 1)}
                          disabled={!tasksPagination.hasPrevPage || myTasksLoading}
                          className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors duration-200 flex items-center ${tasksPagination.hasPrevPage && !myTasksLoading
                              ? 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                              : 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed'
                            }`}
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                          </svg>
                          {myTasksLoading ? 'Loading...' : 'Previous'}
                        </button>

                        {/* Current Page Info */}
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">
                            Page {tasksPagination.currentPage} of {tasksPagination.totalPages}
                          </span>
                        </div>

                        {/* Next Button */}
                        <button
                          onClick={() => handleTasksPageChange(tasksPagination.currentPage + 1)}
                          disabled={!tasksPagination.hasNextPage || myTasksLoading}
                          className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors duration-200 flex items-center ${tasksPagination.hasNextPage && !myTasksLoading
                              ? 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                              : 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed'
                            }`}
                        >
                          {myTasksLoading ? 'Loading...' : 'Next'}
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
          ) : activeTab === 'submissions-list' ? (
            <div className="space-y-6">
              {/* Submissions Table */}
              {submissionsLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-sm text-gray-500 font-medium">Loading submissions...</p>
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-16 bg-gray-50/30 rounded-xl border border-dashed border-gray-300">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="mt-4 text-sm font-semibold text-gray-900">No submissions yet</h3>
                  <p className="mt-1 text-sm text-gray-500">You haven't submitted any tasks yet. Go to "Assigned Tasks" and click "Submit Task" to start.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="min-w-full divide-y divide-gray-200 text-left">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Task Title</th>
                          <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Submitted Date</th>
                          <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Marks Obtained</th>
                          <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {submissions.map((sub) => (
                          <tr key={sub._id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-gray-900">{sub.task?.title || 'Untitled Task'}</div>
                              <div className="text-xs text-gray-500">{sub.task?.module || 'General'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(sub.createdAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {sub.status === 'Graded' ? (
                                <span className="text-green-700 font-semibold">{sub.achievedMarks}</span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                              <span className="text-gray-400 font-normal"> / {sub.task?.totalMarks || 0}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-semibold border ${
                                sub.status === 'Graded'
                                  ? 'bg-green-50 text-green-700 border-green-200'
                                  : sub.status === 'Rejected'
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}>
                                {sub.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleViewClick(sub)}
                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors mr-2"
                              >
                                View Submission
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {submissionsPagination.totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-4 py-3 bg-white border-t border-gray-200">
                      <div className="flex items-center text-xs sm:text-sm text-gray-700 text-center sm:text-left">
                        <span>
                          Showing {((submissionsPagination.currentPage - 1) * submissionsPagination.limit) + 1} to {Math.min(submissionsPagination.currentPage * submissionsPagination.limit, submissionsPagination.totalCount)} of {submissionsPagination.totalCount} results
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Previous Button */}
                        <button
                          onClick={() => handleSubmissionsPageChange(submissionsPagination.currentPage - 1)}
                          disabled={!submissionsPagination.hasPrevPage || submissionsLoading}
                          className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors duration-200 flex items-center ${submissionsPagination.hasPrevPage && !submissionsLoading
                              ? 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                              : 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed'
                            }`}
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                          </svg>
                          {submissionsLoading ? 'Loading...' : 'Previous'}
                        </button>

                        {/* Current Page Info */}
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">
                            Page {submissionsPagination.currentPage} of {submissionsPagination.totalPages}
                          </span>
                        </div>

                        {/* Next Button */}
                        <button
                          onClick={() => handleSubmissionsPageChange(submissionsPagination.currentPage + 1)}
                          disabled={!submissionsPagination.hasNextPage || submissionsLoading}
                          className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors duration-200 flex items-center ${submissionsPagination.hasNextPage && !submissionsLoading
                              ? 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                              : 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed'
                            }`}
                        >
                          {submissionsLoading ? 'Loading...' : 'Next'}
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
          ) : (
            /* Tab: Submission Form */
            <div className="bg-white rounded-lg p-2 max-w-6xl mx-auto">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Row 1 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-800 mb-2">Task Title</label>
                    <select
                      name="task"
                      value={formData.task}
                      onChange={(e) => handleFormTaskChange(e.target.value)}
                      disabled
                      required
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-500 bg-gray-50 focus:outline-none cursor-not-allowed appearance-none"
                    >
                      <option value="">Choose Task</option>
                      {tasks.map(task => (
                        <option key={task._id} value={task._id}>{task.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-800 mb-2">Module</label>
                    <select
                      name="module"
                      value={formData.module}
                      disabled
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-500 bg-gray-50 focus:outline-none cursor-not-allowed appearance-none"
                    >
                      <option value="">Choose Module</option>
                      {modules.map(mod => (
                        <option key={mod._id} value={mod.moduleName}>{mod.moduleName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-800 mb-2">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      disabled
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-500 bg-gray-50 focus:outline-none cursor-not-allowed appearance-none"
                    >
                      <option value="Submitted">Submitted</option>
                      <option value="Graded">Graded</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-800 mb-2">Submitted By</label>
                    <input
                      type="text"
                      disabled
                      value={viewingSubmission ? (viewingSubmission.intern?.fullName || 'Me') : 'Me'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-500 bg-gray-50 focus:outline-none cursor-not-allowed"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-800 mb-2">Submitted Date</label>
                    <input
                      type="date"
                      disabled
                      value={viewingSubmission?.createdAt ? new Date(viewingSubmission.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-500 bg-gray-50 focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-800 mb-2">Due Date</label>
                    <input
                      type="date"
                      disabled
                      value={formData.dueDate || ''}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-500 bg-gray-50 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Row 3 - Submission Description */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-800 mb-2">Submission Description</label>
                  <textarea
                    rows="4"
                    name="submissionText"
                    value={formData.submissionText}
                    onChange={handleInputChange}
                    disabled={!!viewingSubmission}
                    required
                    placeholder="Enter your submission description"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-y disabled:bg-gray-50"
                  ></textarea>
                </div>

                {/* Row 4 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-800 mb-2">GitHub Repository</label>
                    <input
                      type="text"
                      name="githubRepo"
                      value={formData.githubRepo}
                      onChange={handleInputChange}
                      disabled={!!viewingSubmission}
                      placeholder="Enter GitHub repository link"
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-800 mb-2">Live Demo URL (Optional)</label>
                    <input
                      type="url"
                      name="liveDemo"
                      value={formData.liveDemo}
                      onChange={handleInputChange}
                      disabled={!!viewingSubmission}
                      placeholder="Enter live demo URL"
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-800 mb-2">Total Marks</label>
                    <input
                      type="text"
                      name="totalMarks"
                      value={formData.totalMarks}
                      disabled
                      placeholder="Total marks"
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-500 bg-gray-50 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Row 5 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-800 mb-2">Attachments <span className="text-gray-500 font-normal">(Optional - ZIP/PNG/PDF only)</span></label>
                    {viewingSubmission ? (
                      <div className="flex flex-col gap-2">
                        {Array.isArray(viewingSubmission.attachments) && viewingSubmission.attachments.length > 0 ? (
                          viewingSubmission.attachments.map((att, idx) => (
                            <div key={idx} className="px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 flex items-center justify-between">
                              <span className="truncate">{att ? att.split('/').pop() : `Attachment ${idx + 1}`}</span>
                              {att && (
                                <button
                                  type="button"
                                  onClick={() => handleDownload(viewingSubmission._id, att.split('/').pop(), idx)}
                                  className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
                                >
                                  Download
                                </button>
                              )}
                            </div>
                          ))
                        ) : typeof viewingSubmission.attachments === 'string' && viewingSubmission.attachments ? (
                          <div className="px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 flex items-center justify-between">
                            <span className="truncate">{viewingSubmission.attachments.split('/').pop()}</span>
                            <button
                              type="button"
                              onClick={() => handleDownload(viewingSubmission._id, viewingSubmission.attachments.split('/').pop())}
                              className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
                            >
                              Download
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm p-2 bg-gray-50 border border-gray-300 rounded-md block">No files uploaded</span>
                        )}
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="file"
                          id="file-upload"
                          className="hidden"
                          accept=".zip,.png,.pdf"
                          multiple
                          onChange={handleFileChange}
                        />
                        <label
                          htmlFor="file-upload"
                          className="flex items-center justify-between w-full px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 focus-within:ring-1 focus-within:ring-blue-500"
                        >
                          <span className="text-gray-500 text-sm truncate">
                            {selectedFiles.length > 0
                              ? `${selectedFiles.length} file(s) selected`
                              : 'Upload Attachments'}
                          </span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                        </label>
                        {selectedFiles.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {selectedFiles.map((file, fIdx) => {
                              const objectUrl = URL.createObjectURL(file);
                              const isImage = file.type.startsWith('image/');
                              const isPdf = file.type === 'application/pdf';
                              
                              return (
                                <div key={fIdx} className="p-3 bg-gray-50 border border-dashed border-gray-300 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all duration-200">
                                  <div className="flex items-center gap-3 w-full sm:w-auto min-w-0">
                                    {/* File Icon */}
                                    <div className="p-2 bg-orange-100 rounded-lg text-orange-600 flex-shrink-0">
                                      {isImage ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                      ) : isPdf ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                      ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                      )}
                                    </div>
                                    {/* File Info */}
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-semibold text-gray-900 truncate">{file.name}</p>
                                      <p className="text-xs text-gray-500 font-medium">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {/* Action Buttons */}
                                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start">
                                    {(isImage || isPdf) && (
                                      <a
                                        href={objectUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-2.5 py-1.5 text-xs font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-md border border-orange-200 transition-colors flex items-center gap-1"
                                      >
                                        Preview
                                      </a>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== fIdx))}
                                      className="px-2.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-md border border-red-200 transition-colors flex items-center gap-1"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-800 mb-2">Achieved Marks</label>
                    <input
                      type="text"
                      name="achievedMarks"
                      value={formData.achievedMarks}
                      disabled
                      placeholder="N/A"
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-500 bg-gray-50 focus:outline-none cursor-not-allowed"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-800 mb-2">Feedback</label>
                    <input
                      type="text"
                      name="feedback"
                      value={formData.feedback}
                      disabled
                      placeholder="No feedback yet"
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-500 bg-gray-50 focus:outline-none cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Row 6 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6">
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-800 mb-2">Submission Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      disabled
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-500 bg-gray-50 focus:outline-none cursor-not-allowed appearance-none"
                    >
                      <option value="Submitted">Submitted</option>
                      <option value="Graded">Graded</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-800 mb-2">Reviewed By</label>
                    <input
                      type="text"
                      name="reviewedBy"
                      value={formData.reviewedBy}
                      disabled
                      placeholder="Not reviewed yet"
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-500 bg-gray-50 focus:outline-none cursor-not-allowed"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-800 mb-2">Reviewed Date</label>
                    <input
                      type="date"
                      name="reviewedDate"
                      value={formData.reviewedDate}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-500 bg-gray-50 focus:outline-none cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                  >
                    Cancel
                  </button>
                  {!viewingSubmission && (
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? 'Processing...' : 'Submit'}
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
  );
};
