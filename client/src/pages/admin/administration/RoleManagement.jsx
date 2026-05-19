import React, { useState, useEffect, useRef } from 'react';
import Tabs from '../../../components/button/Tabs';
import { Navbar } from '../../../components/admin/AdminNavBar';
import AdminService from '../../../services/admin-api-service/AdminService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const RoleManagement = () => {
  const { getRolesData, postRolesData, putRolesData, deleteRolesData } = AdminService();
  
  const [activeTab, setActiveTab] = useState('roles');
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingRole, setViewingRole] = useState(null);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    type: 'success', // 'success', 'error', 'info'
    title: '',
    message: ''
  });
  const [formData, setFormData] = useState({
    role: '',
    description: '',
    permissions: {}
  });
  
  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 5
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    role: ''
  });

  // Valid role options from the enum (excluding Super Admin for frontend)
  const roleOptions = [
    'Admin', 
    'Mentor',
    'Accountant',
    'Intern',
    'Career advisor',
    'Placement coordinator',
    'Front office staff'
  ];

  // Notification helper functions
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

  const tabOptions = [
    { value: "roles", label: "Roles" },
    { value: "newRole", label: "New Role" }
  ];

   const headData = "Role Management"

  // Permission structure matching the schema
  const permissionCategories = [
    {
      key: 'studentManagement',
      title: 'Student Management',
      permissions: [
        { key: 'addStudent', label: 'Add Student' },
        { key: 'viewStudent', label: 'View Student' },
        { key: 'editStudent', label: 'Edit Student' },
        { key: 'deleteStudent', label: 'Delete Student' }
      ]
    },
    {
      key: 'mentorManagement',
      title: 'Mentor Management',
      permissions: [
        { key: 'addMentor', label: 'Add Mentor' },
        { key: 'viewMentor', label: 'View Mentor' },
        { key: 'editMentor', label: 'Edit Mentor' },
        { key: 'deleteMentor', label: 'Delete Mentor' }
      ]
    },
    {
      key: 'courseManagement',
      title: 'Course Management',
      permissions: [
        { key: 'addCourse', label: 'Add Course' },
        { key: 'viewCourse', label: 'View Course' },
        { key: 'editCourse', label: 'Edit Course' },
        { key: 'deleteCourse', label: 'Delete Course' }
      ]
    },
    {
      key: 'categoryManagement',
      title: 'Category Management',
      permissions: [
        { key: 'addCategory', label: 'Add Category' },
        { key: 'viewCategory', label: 'View Category' },
        { key: 'editCategory', label: 'Edit Category' },
        { key: 'deleteCategory', label: 'Delete Category' }
      ]
    },
    {
      key: 'moduleManagement',
      title: 'Module Management',
      permissions: [
        { key: 'addModule', label: 'Add Module' },
        { key: 'viewModule', label: 'View Module' },
        { key: 'editModule', label: 'Edit Module' },
        { key: 'deleteModule', label: 'Delete Module' }
      ]
    },
    {
      key: 'topicManagement',
      title: 'Topic Management',
      permissions: [
        { key: 'addTopic', label: 'Add Topic' },
        { key: 'viewTopic', label: 'View Topic' },
        { key: 'editTopic', label: 'Edit Topic' },
        { key: 'deleteTopic', label: 'Delete Topic' }
      ]
    },
    {
      key: 'taskManagement',
      title: 'Task Management',
      permissions: [
        { key: 'addTask', label: 'Add Task' },
        { key: 'viewTask', label: 'View Task' },
        { key: 'editTask', label: 'Edit Task' },
        { key: 'deleteTask', label: 'Delete Task' }
      ]
    },
    {
      key: 'weeklySchedule',
      title: 'Weekly Schedule',
      permissions: [
        { key: 'addSchedule', label: 'Add Schedule' },
        { key: 'viewSchedule', label: 'View Schedule' },
        { key: 'editSchedule', label: 'Edit Schedule' },
        { key: 'deleteSchedule', label: 'Delete Schedule' }
      ]
    },
    {
      key: 'scheduleTiming',
      title: 'Schedule Timing',
      permissions: [
        { key: 'addTiming', label: 'Add Timing' },
        { key: 'viewTiming', label: 'View Timing' },
        { key: 'editTiming', label: 'Edit Timing' },
        { key: 'deleteTiming', label: 'Delete Timing' }
      ]
    },
    {
      key: 'staticPage',
      title: 'Static Page',
      permissions: [
        { key: 'addPage', label: 'Add Page' },
        { key: 'viewPage', label: 'View Page' },
        { key: 'editPage', label: 'Edit Page' },
        { key: 'deletePage', label: 'Delete Page' }
      ]
    }
  ];

  // API functions
  const fetchRoles = async (page = 1, search = '', role = '') => {
    try {
      setLoading(true);
      
      // Build query parameters
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      });
      
      if (search) queryParams.append('search', search);
      if (role) queryParams.append('role', role);
      
      const response = await getRolesData(queryParams.toString());
      setRoles(response.data);
      
      // Update pagination state
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all roles for export (no pagination)
  const fetchAllRoles = async () => {
    try {
      // Fetch with a very high limit to get all roles
      const queryParams = new URLSearchParams({
        page: '1',
        limit: '10000' // High limit to get all roles
      });
      
      const response = await getRolesData(queryParams.toString());
      return response.data || [];
    } catch (error) {
      console.error('Error fetching all roles:', error);
      showNotification('error', 'Error', 'Failed to fetch roles for export');
      return [];
    }
  };

  // Export roles to CSV
  const exportRolesToCSV = async () => {
    try {
      setLoading(true);
      showNotification('info', 'Exporting', 'Preparing export...');
      
      // Fetch all roles
      const allRoles = await fetchAllRoles();
      
      if (allRoles.length === 0) {
        showNotification('error', 'Export Failed', 'No roles found to export');
        return;
      }

      // Prepare CSV headers
      const headers = [
        'Role Name',
        'Description',
        'Status',
        'Created Date',
        'Updated Date',
        'Student Management - Add',
        'Student Management - View',
        'Student Management - Edit',
        'Student Management - Delete',
        'Mentor Management - Add',
        'Mentor Management - View',
        'Mentor Management - Edit',
        'Mentor Management - Delete',
        'Course Management - Add',
        'Course Management - View',
        'Course Management - Edit',
        'Course Management - Delete',
        'Category Management - Add',
        'Category Management - View',
        'Category Management - Edit',
        'Category Management - Delete',
        'Module Management - Add',
        'Module Management - View',
        'Module Management - Edit',
        'Module Management - Delete',
        'Topic Management - Add',
        'Topic Management - View',
        'Topic Management - Edit',
        'Topic Management - Delete',
        'Task Management - Add',
        'Task Management - View',
        'Task Management - Edit',
        'Task Management - Delete',
        'Weekly Schedule - Add',
        'Weekly Schedule - View',
        'Weekly Schedule - Edit',
        'Weekly Schedule - Delete',
        'Schedule Timing - Add',
        'Schedule Timing - View',
        'Schedule Timing - Edit',
        'Schedule Timing - Delete',
        'Static Page - Add',
        'Static Page - View',
        'Static Page - Edit',
        'Static Page - Delete'
      ];

      // Prepare CSV rows
      const rows = allRoles.map(role => {
        const permissions = role.permissions || {};
        
        const formatDate = (dateString) => {
          if (!dateString) return 'N/A';
          return new Date(dateString).toLocaleDateString('en-GB');
        };

        const getPermissionValue = (categoryKey, permissionKey) => {
          const categoryPerms = permissions[categoryKey] || {};
          return categoryPerms[permissionKey] ? 'Yes' : 'No';
        };

        return [
          role.role || 'N/A',
          role.description || 'N/A',
          role.isActive ? 'Active' : 'Inactive',
          formatDate(role.createdAt),
          formatDate(role.updatedAt),
          getPermissionValue('studentManagement', 'addStudent'),
          getPermissionValue('studentManagement', 'viewStudent'),
          getPermissionValue('studentManagement', 'editStudent'),
          getPermissionValue('studentManagement', 'deleteStudent'),
          getPermissionValue('mentorManagement', 'addMentor'),
          getPermissionValue('mentorManagement', 'viewMentor'),
          getPermissionValue('mentorManagement', 'editMentor'),
          getPermissionValue('mentorManagement', 'deleteMentor'),
          getPermissionValue('courseManagement', 'addCourse'),
          getPermissionValue('courseManagement', 'viewCourse'),
          getPermissionValue('courseManagement', 'editCourse'),
          getPermissionValue('courseManagement', 'deleteCourse'),
          getPermissionValue('categoryManagement', 'addCategory'),
          getPermissionValue('categoryManagement', 'viewCategory'),
          getPermissionValue('categoryManagement', 'editCategory'),
          getPermissionValue('categoryManagement', 'deleteCategory'),
          getPermissionValue('moduleManagement', 'addModule'),
          getPermissionValue('moduleManagement', 'viewModule'),
          getPermissionValue('moduleManagement', 'editModule'),
          getPermissionValue('moduleManagement', 'deleteModule'),
          getPermissionValue('topicManagement', 'addTopic'),
          getPermissionValue('topicManagement', 'viewTopic'),
          getPermissionValue('topicManagement', 'editTopic'),
          getPermissionValue('topicManagement', 'deleteTopic'),
          getPermissionValue('taskManagement', 'addTask'),
          getPermissionValue('taskManagement', 'viewTask'),
          getPermissionValue('taskManagement', 'editTask'),
          getPermissionValue('taskManagement', 'deleteTask'),
          getPermissionValue('weeklySchedule', 'addSchedule'),
          getPermissionValue('weeklySchedule', 'viewSchedule'),
          getPermissionValue('weeklySchedule', 'editSchedule'),
          getPermissionValue('weeklySchedule', 'deleteSchedule'),
          getPermissionValue('scheduleTiming', 'addTiming'),
          getPermissionValue('scheduleTiming', 'viewTiming'),
          getPermissionValue('scheduleTiming', 'editTiming'),
          getPermissionValue('scheduleTiming', 'deleteTiming'),
          getPermissionValue('staticPage', 'addPage'),
          getPermissionValue('staticPage', 'viewPage'),
          getPermissionValue('staticPage', 'editPage'),
          getPermissionValue('staticPage', 'deletePage')
        ];
      });

      // Convert to CSV format
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => {
          // Escape commas and quotes in cell content
          const cellStr = String(cell || '').replace(/"/g, '""');
          return `"${cellStr}"`;
        }).join(','))
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `roles_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showNotification('success', 'Export Successful', `Exported ${allRoles.length} roles successfully`);
    } catch (error) {
      console.error('Error exporting roles:', error);
      showNotification('error', 'Export Failed', 'Failed to export roles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Export roles to PDF
  const exportRolesToPDF = async () => {
    try {
      setLoading(true);
      showNotification('info', 'Exporting', 'Preparing PDF export...');
      
      // Fetch all roles
      const allRoles = await fetchAllRoles();
      
      if (allRoles.length === 0) {
        showNotification('error', 'Export Failed', 'No roles found to export');
        return;
      }

      // Create new PDF document
      const doc = new jsPDF('portrait', 'mm', 'a4');
      
      const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-GB');
      };

      // Add title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(247, 147, 30); // Orange color
      doc.text('Roles Management Report', 14, 20);
      
      // Reset text color
      doc.setTextColor(0, 0, 0);

      // Add export date and total count
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Exported on: ${new Date().toLocaleDateString('en-GB')}`, 14, 30);
      doc.text(`Total Roles: ${allRoles.length}`, 14, 35);

      // Prepare table data with only basic role information
      const tableData = allRoles.map(role => [
        role.role || 'N/A',
        role.description || 'No description',
        role.isActive ? 'Active' : 'Inactive',
        formatDate(role.createdAt)
      ]);

      // Add table to PDF
      autoTable(doc, {
        startY: 45,
        head: [['Role Name', 'Description', 'Status', 'Created Date']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [247, 147, 30],
          textColor: 255,
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 50, halign: 'left' }, // Role Name
          1: { cellWidth: 80, halign: 'left' }, // Description
          2: { cellWidth: 30, halign: 'center' }, // Status
          3: { cellWidth: 40, halign: 'center' }  // Created Date
        },
        styles: {
          fontSize: 10,
          cellPadding: 4,
          overflow: 'linebreak'
        },
        margin: { left: 14, right: 14 }
      });

      // Add page number
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(128, 128, 128);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() - 30, doc.internal.pageSize.getHeight() - 10);
      }

      // Save the PDF
      doc.save(`roles_export_${new Date().toISOString().split('T')[0]}.pdf`);
      
      showNotification('success', 'Export Successful', `Exported ${allRoles.length} roles to PDF successfully`);
    } catch (error) {
      console.error('Error exporting roles to PDF:', error);
      showNotification('error', 'Export Failed', 'Failed to export roles to PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createRole = async (data) => {
    try {
      setLoading(true);
      const response = await postRolesData(data);
      await fetchRoles(pagination.currentPage, searchTerm, filters.role); // Refresh the list
      showNotification('success', 'Success', 'Role created successfully!');
      return response;
    } catch (error) {
      console.error('Error creating role:', error);
      showNotification('error', 'Error', error.response?.data?.message || 'Error creating role. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (id, data) => {
    try {
      setLoading(true);
      const response = await putRolesData(id, data);
      await fetchRoles(pagination.currentPage, searchTerm, filters.role); // Refresh the list
      showNotification('success', 'Success', 'Role updated successfully!');
      return response;
    } catch (error) {
      console.error('Error updating role:', error);
      showNotification('error', 'Error', error.response?.data?.message || 'Error updating role. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteRole = async (id) => {
    try {
      setLoading(true);
      const response = await deleteRolesData(id);
      await fetchRoles(pagination.currentPage, searchTerm, filters.role); // Refresh the list
      setShowDeleteModal(false);
      setRoleToDelete(null);
      showNotification('success', 'Success', 'Role deleted successfully!');
      return response;
    } catch (error) {
      console.error('Error deleting role:', error);
      showNotification('error', 'Error', error.response?.data?.message || 'Error deleting role. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Handle view role
  const handleViewRole = (role) => {
    setViewingRole(role);
    setShowViewModal(true);
  };

  // Close view modal
  const closeViewModal = () => {
    setShowViewModal(false);
    setViewingRole(null);
  };

  // Handle delete confirmation
  const handleDeleteClick = (role) => {
    setRoleToDelete(role);
    setShowDeleteModal(true);
  };

  // Handle delete confirmation
  const confirmDelete = () => {
    if (roleToDelete) {
      deleteRole(roleToDelete._id);
    }
  };

  // Handle delete cancellation
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setRoleToDelete(null);
  };

  // Edit role function
  const editRole = (role) => {
    setEditingRole(role);
    setFormData({
      role: role.role,
      description: role.description || '',
      permissions: role.permissions || initializePermissions()
    });
    setActiveTab('newRole');
  };

  // Cancel edit mode
  const cancelEdit = () => {
    setEditingRole(null);
    setFormData({
      role: '',
      description: '',
      permissions: initializePermissions()
    });
    setActiveTab('roles');
  };

  // Initialize permissions structure
  const initializePermissions = () => {
    const permissions = {};
    permissionCategories.forEach(category => {
      permissions[category.key] = {};
      category.permissions.forEach(permission => {
        permissions[category.key][permission.key] = false;
      });
    });
    return permissions;
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle permission changes
  const handlePermissionChange = (categoryKey, permissionKey, value) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [categoryKey]: {
          ...prev.permissions[categoryKey],
          [permissionKey]: value
        }
      }
    }));
  };

  // Handle category toggle (all permissions in a category)
  const handleCategoryToggle = (categoryKey, value) => {
    const category = permissionCategories.find(cat => cat.key === categoryKey);
    if (category) {
      const updatedPermissions = { ...formData.permissions };
      updatedPermissions[categoryKey] = {};
      category.permissions.forEach(permission => {
        updatedPermissions[categoryKey][permission.key] = value;
      });
      setFormData(prev => ({
        ...prev,
        permissions: updatedPermissions
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSubmit = {
        ...formData,
        permissions: formData.permissions
      };
      
      if (editingRole) {
        // Update existing role
        await updateRole(editingRole._id, dataToSubmit);
      } else {
        // Create new role
        await createRole(dataToSubmit);
      }
      
      // Reset form and go back to roles tab
      setFormData({
        role: '',
        description: '',
        permissions: initializePermissions()
      });
      setEditingRole(null);
      setActiveTab('roles');
    } catch (error) {
      console.error('Error submitting form:', error);
      // Error notification is already handled in the API functions
    }
  };

  // Pagination handlers
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
      fetchRoles(newPage, searchTerm, filters.role);
    }
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Load roles on component mount
  useEffect(() => {
    fetchRoles(pagination.currentPage, searchTerm, filters.role);
    setFormData(prev => ({
      ...prev,
      permissions: initializePermissions()
    }));
  }, []);

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExportDropdown && !event.target.closest('.export-dropdown')) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportDropdown]);

  const isFirstRender = useRef(true);

  // Handle search and filter changes with debounce
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timeoutId = setTimeout(() => {
      fetchRoles(1, searchTerm, filters.role);
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filters]);

  const renderRolesTable = () => (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6">
        <div className="flex-1 sm:mr-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search Roles"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 text-black pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
            value={filters.role}
            onChange={(e) => handleFilterChange('role', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">All Roles</option>
            {roleOptions.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          <div className="relative export-dropdown">
            <button 
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-white text-gray-600 rounded-md font-medium border border-gray-300 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
              {loading ? 'Exporting...' : 'Export'}
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
            
            {showExportDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowExportDropdown(false);
                      exportRolesToCSV();
                    }}
                    disabled={loading}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    Export as CSV
                  </button>
                  <button
                    onClick={() => {
                      setShowExportDropdown(false);
                      exportRolesToPDF();
                    }}
                    disabled={loading}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                    </svg>
                    Export as PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      ) : roles.length === 0 ? (
        <div className="flex items-center justify-center p-12">
          <p className="text-gray-500 text-lg">
            {searchTerm || filters.role ? 'No roles found matching your search.' : 'No roles available. Please add roles to view them here.'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {roles.map((role, index) => (
                  <tr key={role._id}>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{role.role}</td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{role.description || 'No description'}</td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        role.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {role.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(role.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleViewRole(role)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Role Details"
                        >
                          View
                        </button>
                        <button 
                          onClick={() => editRole(role)}
                          className="text-orange-600 hover:text-orange-900"
                          title="Edit Role"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(role)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Role"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {roles.map((role, index) => (
              <div key={role._id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{role.role}</h3>
                    <p className="text-sm text-gray-500 mt-1">{role.description || 'No description'}</p>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ml-2 ${
                    role.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {role.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm text-gray-600 mb-3">
                  <span>Created: {new Date(role.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200">
                  <button 
                    onClick={() => handleViewRole(role)}
                    className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                  >
                    View
                  </button>
                  <button 
                    onClick={() => editRole(role)}
                    className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 rounded-md hover:bg-orange-100 transition-colors"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteClick(role)}
                    className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

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
              className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors duration-200 flex items-center ${
                pagination.hasPrevPage && !loading
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
              className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors duration-200 flex items-center ${
                pagination.hasNextPage && !loading
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
    </div>
  );

  const renderNewRoleForm = () => (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
          {editingRole ? 'Edit Role' : 'Create New Role'}
        </h2>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          {editingRole ? `Editing role: ${editingRole.role}` : 'Set permissions for a specific role'}
        </p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Role</label>
            <div className="relative">
              <input 
                type="text"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                placeholder="Enter Role Name"
                className="block w-full px-4 py-2 text-black bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
                disabled={editingRole} // Disable role change when editing
              />
              {editingRole && (
                <p className="text-sm text-gray-500 mt-1">Role cannot be changed when editing</p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">Description</label>
            <input 
              type="text" 
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter Description" 
              className="w-full px-4 py-2 text-black border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" 
            />
          </div>
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">All Permissions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {permissionCategories.map((category) => {
            const categoryPermissions = formData.permissions[category.key] || {};
            const allChecked = category.permissions.every(permission => categoryPermissions[permission.key]);
            const someChecked = category.permissions.some(permission => categoryPermissions[permission.key]);
            
            return (
              <div key={category.key} className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-800 font-semibold">{category.title}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={allChecked}
                      onChange={(e) => handleCategoryToggle(category.key, e.target.checked)}
                    />
                    <div className={`w-11 h-6 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                      allChecked ? 'bg-orange-500' : someChecked ? 'bg-orange-300' : 'bg-gray-200'
                    }`}></div>
                  </label>
                </div>
                <div className="space-y-2">
                  {category.permissions.map((permission) => (
                    <div key={permission.key} className="flex items-center">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
                        checked={categoryPermissions[permission.key] || false}
                        onChange={(e) => handlePermissionChange(category.key, permission.key, e.target.checked)}
                      />
                      <label className="ml-2 text-sm text-gray-700">{permission.label}</label>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 mt-6 sm:mt-8">
          <button 
            type="button"
            onClick={editingRole ? cancelEdit : () => setActiveTab('roles')}
            className="w-full sm:w-auto px-4 sm:px-6 py-2 border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-100 transition-colors duration-200"
          >
            {editingRole ? 'Cancel Edit' : 'Cancel'}
          </button>
          <button 
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-orange-500 text-white rounded-md font-medium shadow-md hover:bg-orange-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading 
              ? (editingRole ? 'Updating...' : 'Creating...') 
              : (editingRole ? 'Update Role' : 'Create Role')
            }
          </button>
        </div>
      </form>
    </div>
  );

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

  // Delete Confirmation Modal Component
  const DeleteConfirmationModal = () => {
    if (!showDeleteModal || !roleToDelete) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Delete Role</h3>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete the role <span className="font-semibold text-gray-900">"{roleToDelete.role}"</span>?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                This action cannot be undone and will permanently remove all permissions associated with this role.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={cancelDelete}
                disabled={loading}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={loading}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
    {/* Content Tabs & Actions */}
    <Navbar headData={headData} activeTab={activeTab} />

    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6">
    {/* <div className="flex space-x-2">
      <button
        onClick={() => setActiveTab('roles')}
        className={`px-4 py-2 rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
          activeTab === 'roles'
            ? 'bg-orange-500 text-white shadow-md hover:bg-orange-600'
            : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
        }`}
      >
        Roles
      </button>
      <button
        onClick={() => setActiveTab('newRole')}
        className={`px-4 py-2 rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
          activeTab === 'newRole'
            ? 'bg-orange-500 text-white shadow-md hover:bg-orange-600'
            : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
        }`}
      >
        New Role
      </button>
    </div> */}

    <Tabs tabs={tabOptions} activeTab={activeTab} setActiveTab={setActiveTab} />

    {activeTab === 'roles' && (
      <div className="flex space-x-2">
        {/* <button 
          onClick={() => {
            setEditingRole(null);
            setFormData({
              role: '',
              description: '',
              permissions: initializePermissions()
            });
            setActiveTab('newRole');
          }}
          className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-md font-medium shadow-md hover:bg-orange-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          New Role
        </button> */}
      </div>
    )}
    
  </div>

  {/* Conditional Rendering */}
  {activeTab === 'roles' ? renderRolesTable() : renderNewRoleForm()}

  {/* Notification Modal */}
  <NotificationModal />

  {/* View Role Details Modal */}
  {showViewModal && viewingRole && (
    <>
      <style>{`
        @media print {
          @page {
            margin: 0;
          }
          body * {
            visibility: hidden;
          }
          .print-modal-content, .print-modal-content * {
            visibility: visible;
          }
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
          }
          .print-modal-content .print-hide {
            display: none !important;
          }
          .print-modal-content .print-full-width {
            width: 100% !important;
            max-width: 100% !important;
          }
        }
      `}</style>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 print:block print:bg-white print:opacity-100 print:p-0">
        <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto print-modal-content">
        {/* Modal Header */}
        <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-200 print:px-4 print:py-4 print-full-width">
          <div className="flex justify-between items-start gap-4">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 break-words">{viewingRole.role}</h1>
            <button 
              onClick={closeViewModal}
              className="flex items-center gap-1 text-sm border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors print-hide flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
              </svg>
              <span className="hidden sm:inline">Back</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="px-4 sm:px-8 py-4 sm:py-6 print:px-4 print:py-4 print-full-width">
          <div className="flex flex-col md:flex-row gap-6 sm:gap-10 print:flex-col print:gap-4">
            {/* Left Column - Role Details */}
            <div className="flex-1 space-y-6 print:flex-none print-full-width">
              {/* Basic Details */}
              <div>
                <h2 className="text-[#f7931e] font-semibold mb-4 text-lg italic">
                  Role Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 text-xs sm:text-sm print:grid-cols-2 print-full-width">
                  <p className="leading-6"><span className="font-semibold text-gray-900">Role Name:</span> <span className="text-gray-600">{viewingRole.role || 'N/A'}</span></p>
                  <p className="leading-6">
                    <span className="font-semibold text-gray-900">Status:</span>{" "}
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      viewingRole.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {viewingRole.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                  <p className="col-span-2 leading-6">
                    <span className="font-semibold text-gray-900">Description:</span>{" "}
                    <span className="text-gray-600">{viewingRole.description || 'No description provided'}</span>
                  </p>
                  <p className="leading-6"><span className="font-semibold text-gray-900">Created Date:</span> <span className="text-gray-600">{viewingRole.createdAt ? new Date(viewingRole.createdAt).toLocaleDateString('en-GB').replace(/\//g, ' / ') : 'N/A'}</span></p>
                  <p className="leading-6"><span className="font-semibold text-gray-900">Updated Date:</span> <span className="text-gray-600">{viewingRole.updatedAt ? new Date(viewingRole.updatedAt).toLocaleDateString('en-GB').replace(/\//g, ' / ') : 'N/A'}</span></p>
                </div>
              </div>

              {/* Permissions Section */}
              <div>
                <h2 className="text-[#f7931e] font-semibold mb-4 text-lg italic">
                  Permissions ({permissionCategories.reduce((total, category) => {
                    const categoryPermissions = viewingRole.permissions?.[category.key] || {};
                    const categoryCount = category.permissions.filter(p => categoryPermissions[p.key]).length;
                    return total + categoryCount;
                  }, 0)} of {permissionCategories.reduce((total, category) => total + category.permissions.length, 0)})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 print:grid-cols-1 print-full-width">
                  {permissionCategories.map((category) => {
                    const categoryPermissions = viewingRole.permissions?.[category.key] || {};
                    const hasAnyPermission = category.permissions.some(p => categoryPermissions[p.key]);
                    
                    if (!hasAnyPermission) return null;
                    
                    return (
                      <div key={category.key} className="bg-gray-50 p-4 rounded-lg border border-gray-200 print-full-width print:p-3 print:mb-3">
                        <div className="flex justify-between items-center mb-3 print:mb-2">
                          <span className="text-gray-800 font-semibold text-sm">{category.title}</span>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            category.permissions.every(p => categoryPermissions[p.key])
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {category.permissions.filter(p => categoryPermissions[p.key]).length} / {category.permissions.length}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {category.permissions.map((permission) => {
                            const hasPermission = categoryPermissions[permission.key];
                            return (
                              <div key={permission.key} className="flex items-center">
                                {hasPermission ? (
                                  <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4 text-gray-300 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                  </svg>
                                )}
                                <span className={`text-xs ${hasPermission ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                                  {permission.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* No Permissions Message */}
                {permissionCategories.every(category => {
                  const categoryPermissions = viewingRole.permissions?.[category.key] || {};
                  return !category.permissions.some(p => categoryPermissions[p.key]);
                }) && (
                  <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No permissions assigned</h3>
                    <p className="mt-1 text-sm text-gray-500">This role doesn't have any permissions assigned yet.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Role Icon */}
            <div className="flex flex-col items-center print-hide">
              <div className="w-32 h-32 sm:w-48 sm:h-48 rounded-full overflow-hidden mb-4">
                <div className="w-full h-full rounded-full bg-orange-100 flex items-center justify-center">
                  <span className="text-orange-500 text-4xl sm:text-6xl font-medium">
                    {viewingRole.role?.charAt(0)?.toUpperCase() || 'R'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-8 py-4 sm:py-6 border-t border-gray-200 print-hide">
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <button 
              onClick={() => {
                closeViewModal();
                editRole(viewingRole);
              }}
              className="w-full sm:w-auto bg-gray-100 border border-gray-300 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Edit Role
            </button>
            <button
              onClick={() => window.print()}
              className="w-full sm:w-auto bg-[#f7931e] text-white px-5 py-2 rounded-lg hover:bg-[#e67c00] transition-colors"
            >
              Print
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  )}

  {/* Delete Confirmation Modal */}
  <DeleteConfirmationModal />

  </>

  );
};


