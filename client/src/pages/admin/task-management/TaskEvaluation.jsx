import React, { useState, useEffect } from 'react';
import AdminService from '../../../services/admin-api-service/AdminService';
import Tabs from '../../../components/button/Tabs';
import { Navbar } from '../../../components/admin/AdminNavBar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const TaskEvaluation = () => {
  const [activeTab, setActiveTab] = useState('submissions-list');
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [interns, setInterns] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [modules, setModules] = useState([]);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    task: '',
    module: '',
    status: 'Submitted',
    intern: '',
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
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [editingSubmission, setEditingSubmission] = useState(null);

  // Notification Toast state
  const [notification, setNotification] = useState({
    show: false,
    type: 'success',
    title: '',
    message: ''
  });

  const {
    getTasksData,
    getInternsData,
    getStaffData,
    getModulesData,
    getTaskSubmissionsData,
    gradeSubmissionData,
    postTaskSubmissionData,
    downloadSubmissionAttachment
  } = AdminService();

  const userRole = localStorage.getItem("role")?.toLowerCase() || "";
  const currentUserId = localStorage.getItem("userId") || "";

  const tabOptions = [
    { value: 'submissions-list', label: 'Submissions List' },
    ...(editingSubmission ? [{ value: 'submission-form', label: 'Grade Submission' }] : [])
  ];

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };

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

  const handleExport = () => {
    if (submissions.length === 0) {
      showNotification('error', 'Export Failed', 'No submissions to export. Please select a task first.');
      return;
    }
    
    try {
      setLoading(true);
      const selectedTaskObj = tasks.find(t => t._id === selectedTask) || {};
      const taskTitle = selectedTaskObj.title || 'Task Submissions';
      
      const doc = new jsPDF('landscape', 'mm', 'a4');
      
      // Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(247, 147, 30);
      const title = `${taskTitle} - Submissions Report`;
      const pageWidth = doc.internal.pageSize.getWidth();
      const titleWidth = doc.getTextWidth(title);
      doc.text(title, (pageWidth - titleWidth) / 2, 15);
      
      // Meta
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const exportedOn = `Exported on: ${new Date().toLocaleDateString('en-GB')}`;
      const totalText = `Total Submissions: ${submissions.length}`;
      const exportedOnWidth = doc.getTextWidth(exportedOn);
      const totalWidth = doc.getTextWidth(totalText);
      doc.text(exportedOn, (pageWidth - exportedOnWidth) / 2, 22);
      doc.text(totalText, (pageWidth - totalWidth) / 2, 27);
      
      // Table Data
      const tableData = submissions.map(sub => [
        sub.intern?.fullName || 'N/A',
        sub.intern?.email || 'N/A',
        sub.githubRepo || 'N/A',
        sub.liveDemo || 'N/A',
        sub.status || 'N/A',
        sub.status === 'Graded' ? `${sub.achievedMarks} / ${sub.task?.totalMarks || 0}` : '-',
        sub.createdAt ? new Date(sub.createdAt).toLocaleDateString('en-GB') : 'N/A'
      ]);
      
      autoTable(doc, {
        startY: 35,
        head: [['Intern Name', 'Email', 'GitHub Repo', 'Live Demo', 'Status', 'Marks', 'Submitted At']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [247, 147, 30], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 'auto', halign: 'left', fontSize: 8 },
          1: { cellWidth: 'auto', halign: 'left', fontSize: 8 },
          2: { cellWidth: 'auto', halign: 'left', fontSize: 8 },
          3: { cellWidth: 'auto', halign: 'left', fontSize: 8 },
          4: { cellWidth: 'auto', halign: 'left', fontSize: 8 },
          5: { cellWidth: 'auto', halign: 'left', fontSize: 8 },
          6: { cellWidth: 'auto', halign: 'center', fontSize: 8 }
        },
        styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak', lineWidth: 0.1 },
        margin: { left: 10, right: 10 },
        tableWidth: 'auto'
      });
      
      // Page Numbers
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(128, 128, 128);
        const text = `Page ${i} of ${pageCount}`;
        const textWidth = doc.getTextWidth(text);
        doc.text(text, (pageWidth - textWidth) / 2, doc.internal.pageSize.getHeight() - 8);
      }
      
      doc.save(`submissions_export_${new Date().toISOString().split('T')[0]}.pdf`);
      showNotification('success', 'Export Successful', `Exported ${submissions.length} submissions to PDF successfully`);
    } catch (err) {
      console.error('Submissions export error:', err);
      showNotification('error', 'Export Failed', 'Failed to export submissions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Notification Modal Component
  const NotificationModal = () => {
    if (!notification.show) return null;

    const getIcon = () => {
      switch (notification.type) {
        case 'success':
          return (
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          );
        case 'error':
          return (
            <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          );
        case 'info':
          return (
            <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          );
        default:
          return null;
      }
    };

    const getButtonColor = () => {
      switch (notification.type) {
        case 'success':
          return 'bg-green-600 hover:bg-green-700 focus:ring-green-500';
        case 'error':
          return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
        case 'info':
          return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
        default:
          return 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500';
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-4 sm:p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                {getIcon()}
              </div>
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
      </div>
    );
  };

  // Load all initial lookup lists
  useEffect(() => {
    const loadLookups = async () => {
      try {
        setTasksLoading(true);
        // Fetch tasks
        const tasksRes = await getTasksData('page=1&limit=10000');
        setTasks(tasksRes?.data || []);
        
        // Fetch interns
        const internsRes = await getInternsData('page=1&limit=10000');
        setInterns(internsRes?.data || []);
        
        // Fetch mentors/staff
        const staffRes = await getStaffData('page=1&limit=10000');
        setMentors(staffRes?.data || []);

        // Fetch modules
        const modulesRes = await getModulesData('page=1&limit=10000');
        setModules(modulesRes?.data || []);
      } catch (err) {
        console.error('Failed to load form lookup data:', err);
        showNotification('error', 'Error', 'Failed to load lookup data');
      } finally {
        setTasksLoading(false);
      }
    };
    loadLookups();
  }, []);

  // Fetch submissions when a task is selected
  useEffect(() => {
    if (!selectedTask) {
      setSubmissions([]);
      return;
    }
    const fetchSubmissions = async () => {
      try {
        setSubmissionsLoading(true);
        const res = await getTaskSubmissionsData(selectedTask);
        setSubmissions(res?.data || []);
      } catch (err) {
        console.error('Failed to load submissions:', err);
        showNotification('error', 'Error', 'Failed to retrieve submissions for this task');
      } finally {
        setSubmissionsLoading(false);
      }
    };
    fetchSubmissions();
  }, [selectedTask]);

  // Handle task selection inside the form to auto-fill Module, Total Marks, etc.
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

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Trigger download of attachment
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

  // Select a submission for reviewing/grading
  const handleEditClick = (submission) => {
    setEditingSubmission(submission);
    
    // Auto populate the form fields
    let taskObj = submission.task || {};
    if (typeof taskObj === 'string') {
      taskObj = tasks.find(t => t._id === taskObj) || {};
    } else if (taskObj && taskObj._id) {
      taskObj = tasks.find(t => t._id === taskObj._id) || taskObj;
    } else if (selectedTask) {
      taskObj = tasks.find(t => t._id === selectedTask) || {};
    }

    const internObj = submission.intern || {};
    const graderObj = submission.gradedBy || {};
    
    setFormData({
      task: taskObj._id || '',
      module: taskObj.module || '',
      status: submission.status || 'Submitted',
      intern: internObj._id || '',
      submissionText: submission.submissionText || '',
      githubRepo: submission.githubRepository || submission.githubRepo || '',
      liveDemo: submission.liveDemoUrl || submission.liveDemo || '',
      totalMarks: taskObj.totalMarks || '',
      dueDate: taskObj.dueDate ? new Date(taskObj.dueDate).toISOString().split('T')[0] : '',
      achievedMarks: submission.achievedMarks || '',
      feedback: submission.feedback || '',
      reviewedBy: graderObj._id || currentUserId,
      reviewedDate: submission.gradedAt ? new Date(submission.gradedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    });
    
    setActiveTab('submission-form');
  };

  // Handle submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingSubmission) {
        // We are grading/updating an existing submission
        const patchData = {
          achievedMarks: Number(formData.achievedMarks),
          feedback: formData.feedback,
          status: formData.status
        };
        const res = await gradeSubmissionData(editingSubmission._id, patchData);
        showNotification('success', 'Graded Successfully', 'The submission status and marks have been updated.');
        
        // Refresh submissions
        if (selectedTask) {
          const subRes = await getTaskSubmissionsData(selectedTask);
          setSubmissions(subRes?.data || []);
        }
      } else {
        // We are creating a new submission (Intern context)
        const payload = new FormData();
        payload.append('task', formData.task);
        payload.append('submissionText', formData.submissionText);
        if (selectedFile) {
          payload.append('attachments', selectedFile);
        }
        
        await postTaskSubmissionData(payload);
        showNotification('success', 'Submitted Successfully', 'Your task submission has been uploaded.');
      }
      
      // Reset form
      setFormData({
        task: '',
        module: '',
        status: 'Submitted',
        intern: '',
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
      setSelectedFile(null);
      setEditingSubmission(null);
      setActiveTab('submissions-list');
    } catch (err) {
      console.error('Submission operation error:', err);
      showNotification('error', 'Operation Failed', err.response?.data?.message || 'Failed to complete submission action');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      task: '',
      module: '',
      status: 'Submitted',
      intern: '',
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
    setSelectedFile(null);
    setEditingSubmission(null);
    setActiveTab('submissions-list');
  };

  return (
    <>
      {/* Notification Modal */}
      <NotificationModal />

      <Navbar headData="Task Evaluation" activeTab={activeTab}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="w-full sm:w-auto">
            <Tabs tabs={tabOptions} activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>

          <div className="flex justify-end w-full sm:w-auto">
            <button onClick={handleExport} disabled={loading || submissions.length === 0} className="flex items-center px-4 py-2 bg-white text-gray-600 rounded-md font-medium border border-gray-300 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
              {loading ? 'Exporting...' : 'Export'}
            </button>
          </div>
        </div>
      </Navbar>

      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          {activeTab === 'submissions-list' ? (
            <div className="space-y-6">
              {/* Task Selector Card */}
              <div className="bg-gray-50 rounded-lg py-2.5 px-4 border border-gray-200/60 grid grid-cols-1 md:grid-cols-3 items-end gap-3">
                <div className="w-full">
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Filter by Module</label>
                  <select
                    value={selectedModule}
                    onChange={(e) => {
                      setSelectedModule(e.target.value);
                      setSelectedTask(''); // Reset selected task when module changes
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 h-[38px]"
                  >
                    <option value="">All Modules</option>
                    {modules.map(mod => (
                      <option key={mod._id} value={mod.moduleName}>{mod.moduleName}</option>
                    ))}
                  </select>
                </div>
                <div className="w-full">
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Select Task to View Submissions</label>
                  <select
                    value={selectedTask}
                    onChange={(e) => setSelectedTask(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 h-[38px]"
                  >
                    <option value="">Choose Task</option>
                    {(selectedModule 
                      ? tasks.filter(t => t.module === selectedModule) 
                      : tasks
                    ).map(task => (
                      <option key={task._id} value={task._id}>{task.title}</option>
                    ))}
                  </select>
                </div>
                <div className="w-full flex md:justify-end md:pb-1.5">
                  {selectedTask && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">
                      Total Submissions: {submissions.length}
                    </span>
                  )}
                </div>
              </div>

              {/* Submissions Table / Listing */}
              {!selectedTask ? (
                <div className="text-center py-16 bg-gray-50/30 rounded-xl border border-dashed border-gray-300">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="mt-4 text-sm font-semibold text-gray-900">No task selected</h3>
                  <p className="mt-1 text-sm text-gray-500">Please choose a task from the dropdown list above to load its submissions.</p>
                </div>
              ) : submissionsLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mb-4"></div>
                  <p className="text-sm text-gray-500 font-medium">Loading submissions...</p>
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-16 bg-gray-50/30 rounded-xl border border-dashed border-gray-300">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5M14 10h2" />
                  </svg>
                  <h3 className="mt-4 text-sm font-semibold text-gray-900">No submissions found</h3>
                  <p className="mt-1 text-sm text-gray-500">No interns have submitted tasks for this assignment yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="min-w-full divide-y divide-gray-200 text-left">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Intern</th>
                        <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Submission Date</th>
                        <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Attachment</th>
                        <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Marks</th>
                        <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {submissions.map((sub) => (
                        <tr key={sub._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-9 w-9 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold text-sm mr-3">
                                {sub.intern?.fullName?.charAt(0).toUpperCase() || 'I'}
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-900">{sub.intern?.fullName || 'Unknown Intern'}</div>
                                <div className="text-xs text-gray-500">{sub.intern?.email || ''}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(sub.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {sub.attachments ? (
                              <button
                                onClick={() => handleDownload(sub._id, sub.attachments.split('/').pop())}
                                className="inline-flex items-center text-orange-600 hover:text-orange-700 font-semibold gap-1 hover:underline"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download
                              </button>
                            ) : (
                              <span className="text-gray-400 italic">No File</span>
                            )}
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
                              onClick={() => handleEditClick(sub)}
                              className="text-orange-500 hover:text-orange-600 hover:bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200 transition-colors"
                            >
                              Grade / Review
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* Tab: Submission Form (Create or Edit/Grade) */
            <div className="bg-white rounded-lg p-2 max-w-6xl mx-auto">
              <h2 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">
                {editingSubmission ? `Review & Grade Submission for ${editingSubmission?.intern?.fullName || 'Intern'}` : 'Task Submission Form'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Row 1 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-2">Task Title</label>
                    <select
                      name="task"
                      value={formData.task}
                      onChange={(e) => handleFormTaskChange(e.target.value)}
                      disabled={!!editingSubmission}
                      required
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 disabled:bg-gray-50"
                    >
                      <option value="">Choose Task</option>
                      {tasks.map(task => (
                        <option key={task._id} value={task._id}>{task.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-2">Module</label>
                    <select
                      name="module"
                      value={formData.module}
                      onChange={handleInputChange}
                      disabled
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-505 bg-gray-50 focus:outline-none focus:ring-0 cursor-not-allowed"
                    >
                      <option value="">Choose Module</option>
                      {modules.map(mod => (
                        <option key={mod._id} value={mod.moduleName}>{mod.moduleName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-2">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
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
                    <label className="text-sm font-semibold text-gray-700 mb-2">Submitted By</label>
                    <select
                      name="intern"
                      value={formData.intern}
                      onChange={handleInputChange}
                      disabled={!!editingSubmission || userRole !== 'super admin'}
                      required
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 disabled:bg-gray-50"
                    >
                      <option value="">Choose Intern</option>
                      {interns.map(intern => (
                        <option key={intern._id} value={intern._id}>{intern.fullName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-2">Submitted Date</label>
                    <input
                      type="date"
                      disabled
                      value={editingSubmission?.createdAt ? new Date(editingSubmission.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-500 bg-gray-50 focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-2">Due Date</label>
                    <input
                      type="date"
                      disabled
                      value={formData.dueDate || ''}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-500 bg-gray-50 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Row 3 - Submission Description */}
                <div className="flex flex-col">
                  <label className="text-sm font-semibold text-gray-700 mb-2">Submission Description</label>
                  <textarea
                    rows="4"
                    name="submissionText"
                    value={formData.submissionText}
                    onChange={handleInputChange}
                    disabled={!!editingSubmission}
                    placeholder="Enter your submission description"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 disabled:bg-gray-50 resize-y"
                  ></textarea>
                </div>

                {/* Row 4 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-2">GitHub Repository</label>
                    <input
                      type="text"
                      name="githubRepo"
                      value={formData.githubRepo}
                      onChange={handleInputChange}
                      disabled={!!editingSubmission}
                      placeholder="Enter GitHub repository link"
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 disabled:bg-gray-50"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-2">Live Demo URL (Optional)</label>
                    <input
                      type="url"
                      name="liveDemo"
                      value={formData.liveDemo}
                      onChange={handleInputChange}
                      disabled={!!editingSubmission}
                      placeholder="Enter live demo URL"
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 disabled:bg-gray-50"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-2">Total Marks</label>
                    <input
                      type="text"
                      name="totalMarks"
                      value={formData.totalMarks}
                      disabled
                      placeholder="Total marks"
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-500 bg-gray-50 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Row 5 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-2">Attachment <span className="text-gray-400 font-normal">(Optional - ZIP/PNG/PDF only)</span></label>
                    {editingSubmission ? (
                      <div className="flex flex-col gap-2">
                        {Array.isArray(editingSubmission.attachments) && editingSubmission.attachments.length > 0 ? (
                          editingSubmission.attachments.map((att, idx) => (
                            <div key={idx} className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 flex items-center justify-between">
                              <span className="truncate">{att ? att.split('/').pop() : `Attachment ${idx + 1}`}</span>
                              {att && (
                                <button
                                  type="button"
                                  onClick={() => handleDownload(editingSubmission._id, att.split('/').pop(), idx)}
                                  className="text-orange-500 hover:text-orange-600 font-semibold text-sm"
                                >
                                  Download
                                </button>
                              )}
                            </div>
                          ))
                        ) : typeof editingSubmission.attachments === 'string' && editingSubmission.attachments ? (
                          <div className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 flex items-center justify-between">
                            <span className="truncate">{editingSubmission.attachments.split('/').pop()}</span>
                            <button
                              type="button"
                              onClick={() => handleDownload(editingSubmission._id, editingSubmission.attachments.split('/').pop())}
                              className="text-orange-500 hover:text-orange-600 font-semibold text-sm"
                            >
                              Download
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm p-2 bg-gray-50 border border-gray-300 rounded-lg block font-normal">No files uploaded</span>
                        )}
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="file"
                          id="file-upload"
                          className="hidden"
                          accept=".zip,.png,.pdf"
                          onChange={handleFileChange}
                        />
                        <label
                          htmlFor="file-upload"
                          className="flex items-center justify-between w-full px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 focus-within:ring-2 focus-within:ring-orange-500/20"
                        >
                          <span className="text-gray-500 text-sm truncate">{selectedFile ? selectedFile.name : 'Upload Attachment'}</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-2">Achieved Marks</label>
                    <input
                      type="number"
                      name="achievedMarks"
                      value={formData.achievedMarks}
                      onChange={handleInputChange}
                      placeholder="Enter achieved marks"
                      max={formData.totalMarks}
                      min={0}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-2">Feedback</label>
                    <input
                      type="text"
                      name="feedback"
                      value={formData.feedback}
                      onChange={handleInputChange}
                      placeholder="Enter feedback"
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* Row 6 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6">
                  <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-2">Reviewed By</label>
                    <select
                      name="reviewedBy"
                      value={formData.reviewedBy}
                      onChange={handleInputChange}
                      disabled
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-505 bg-gray-50 focus:outline-none cursor-not-allowed"
                    >
                      <option value="">Choose Mentor</option>
                      {mentors.map(mentor => (
                        <option key={mentor._id} value={mentor._id}>{mentor.fullName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-2">Reviewed Date</label>
                    <input
                      type="date"
                      name="reviewedDate"
                      value={formData.reviewedDate}
                      onChange={handleInputChange}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-500 bg-gray-50 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-8 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg focus:outline-none disabled:bg-orange-300 transition-colors"
                  >
                    {loading ? 'Processing...' : 'Submit'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </>
    );
  };
