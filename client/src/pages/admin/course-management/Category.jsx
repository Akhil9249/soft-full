import React, { useEffect, useState, useRef } from 'react'
import Tabs from '../../../components/button/Tabs';
import { Navbar } from '../../../components/admin/AdminNavBar';
import useAxiosPrivate from '../../../hooks/useAxiosPrivate';
import AdminService from '../../../services/admin-api-service/AdminService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const Category = () => {
  const [activeTab, setActiveTab] = useState('category-list');
  // const axiosPrivate = useAxiosPrivate();
  const { getCategoriesData, putCategoriesData, postCategoriesData, getBranchesData, deleteCategoriesData } = AdminService();
  const [categories, setCategories] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [courses, setCourses] = useState([]);
  const [newCourse, setNewCourse] = useState({ courseName: '', description: '' });
  const [editingCategory, setEditingCategory] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [notification, setNotification] = useState({
    show: false,
    type: 'success', // 'success', 'error', 'info'
    title: '',
    message: ''
  });
  
  // Add view modal state
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingCategory, setViewingCategory] = useState(null);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 5
  });
  const [filters, setFilters] = useState({
    branch: ''
  });

  const headData = "Category Management"

  const tabOptions = [
    { value: "category-list", label: "Category List" },
    { value: "new-category", label: isEditMode ? "Edit Category" : "New Category" }
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

  const handleExport = async () => {
    try {
      setLoading(true);
      setError('');

      const queryParams = new URLSearchParams({ page: '1', limit: '10000' });
      if (filters.branch) queryParams.append('branch', filters.branch);
      if (searchTerm) queryParams.append('search', searchTerm);

      const res = await getCategoriesData(queryParams.toString());
      const allCategories = res?.data || [];
      if (!Array.isArray(allCategories) || allCategories.length === 0) {
        showNotification('error', 'Export Failed', 'No categories found to export');
        return;
      }

      const doc = new jsPDF('portrait', 'mm', 'a4');

      // Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(247, 147, 30);
      const title = 'Categories Report';
      const pageWidth = doc.internal.pageSize.getWidth();
      const titleWidth = doc.getTextWidth(title);
      doc.text(title, (pageWidth - titleWidth) / 2, 20);

      // Meta
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const exportedOn = `Exported on: ${new Date().toLocaleDateString('en-GB')}`;
      const totalText = `Total Categories: ${allCategories.length}`;
      const exportedOnWidth = doc.getTextWidth(exportedOn);
      const totalWidth = doc.getTextWidth(totalText);
      doc.text(exportedOn, (pageWidth - exportedOnWidth) / 2, 30);
      doc.text(totalText, (pageWidth - totalWidth) / 2, 35);

      // Table data
      const tableData = allCategories.map(cat => [
        cat.categoryName || 'N/A',
        cat.branch || 'N/A',
        Array.isArray(cat.courses) ? cat.courses.length : (cat.totalCourses ?? 0),
        cat.createdAt ? new Date(cat.createdAt).toLocaleDateString('en-GB') : 'N/A'
      ]);

      autoTable(doc, {
        startY: 45,
        head: [['Category Name', 'Branch', 'Total Courses', 'Created']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [247, 147, 30], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 'auto', halign: 'left', fontSize: 8 },
          1: { cellWidth: 'auto', halign: 'left', fontSize: 8 },
          2: { cellWidth: 'auto', halign: 'center', fontSize: 8 },
          3: { cellWidth: 'auto', halign: 'center', fontSize: 8 }
        },
        styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak', lineWidth: 0.1 },
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
        const textWidth = doc.getTextWidth(text);
        doc.text(text, (pageWidth - textWidth) / 2, doc.internal.pageSize.getHeight() - 10);
      }

      doc.save(`categories_export_${new Date().toISOString().split('T')[0]}.pdf`);
      showNotification('success', 'Export Successful', `Exported ${allCategories.length} categories to PDF successfully`);
    } catch (err) {
      console.error('Categories export error:', err);
      showNotification('error', 'Export Failed', 'Failed to export categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async (page = 1, search = '', branch = '') => {
    try {
      setLoading(true);
      setError('');
      
      // Build query parameters
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      });
      
      if (search) queryParams.append('search', search);
      if (branch) queryParams.append('branch', branch);
      
      const res = await getCategoriesData(queryParams.toString());
      setCategories(res?.data || []);
      
      // Update pagination state
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      setBranchesLoading(true);
      // const res = await axiosPrivate.get('http://localhost:3000/api/branches');
      const res = await getBranchesData();
      setBranches(res?.data || []);
    } catch (err) {
      console.error('Failed to load branches:', err);
      console.error('Error details:', err.response?.data);
      // Set default branches if API fails
      setBranches([
        { _id: '1', branchName: 'Choose Branch' },
        { _id: '2', branchName: 'Computer Science' },
        { _id: '3', branchName: 'Electrical Engineering' },
        { _id: '4', branchName: 'Mechanical Engineering' },
        { _id: '5', branchName: 'Data Science' },
        { _id: '6', branchName: 'Software Development' }
      ]);
    } finally {
      setBranchesLoading(false);
    }
  };

  // Pagination handlers
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
      fetchCategories(newPage, searchTerm, filters.branch);
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

  useEffect(() => {
    fetchCategories(pagination.currentPage, searchTerm, filters.branch);
    fetchBranches();
  }, []);

  const isFirstRender = useRef(true);

  // Handle search and filter changes with debounce
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timeoutId = setTimeout(() => {
      fetchCategories(1, searchTerm, filters.branch);
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filters]);

  // Clear messages when switching tabs
  useEffect(() => {
    setError('');
    setSuccess('');
  }, [activeTab]);

  // No client-side filtering needed - server handles it

  // Debug: Log branches whenever they change
  useEffect(() => {
    console.log('Branches state updated:', branches);
  }, [branches]);

  const addCourse = () => {
    if (newCourse.courseName.trim()) {
      setCourses([...courses, { ...newCourse }]);
      setNewCourse({ courseName: '', description: '' });
    }
  };

  const removeCourse = (index) => {
    setCourses(courses.filter((_, i) => i !== index));
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setIsEditMode(true);
    setFormData({
      categoryName: category.categoryName || "",
      branch: category.branch || "",
    });
    setCourses(category.courses || []);
    setActiveTab('new-category');
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setIsEditMode(false);
    setFormData({});
    setCourses([]);
    setActiveTab('category-list');
  };

  const handleDeleteCategory = (category) => {
    setDeletingCategory(category);
    setShowDeleteModal(true);
  };

  const handleViewCategory = (category) => {
    setViewingCategory(category);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewingCategory(null);
  };

  const confirmDeleteCategory = async () => {
    if (!deletingCategory) return;
    
    try {
      setLoading(true);
      setError('');
      const res = await deleteCategoriesData(deletingCategory._id);
      showNotification('success', 'Success', 'Category deleted successfully.');
      await fetchCategories(pagination.currentPage, searchTerm, filters.branch);
      setShowDeleteModal(false);
      setDeletingCategory(null);
    } catch (err) {
      showNotification('error', 'Error', err?.response?.data?.message || 'Failed to delete category');
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeletingCategory(null);
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setError('');
    const formDataObj = new FormData(e.currentTarget);

    const payload = {
      categoryName: formDataObj.get('categoryName') || undefined,
      branch: formDataObj.get('branch') || undefined,
      courses: courses
    };

    try {
      setLoading(true);
      let res;
      if (isEditMode && editingCategory) {
        // Update existing category
        res = await putCategoriesData(editingCategory._id, payload);
        showNotification('success', 'Success', 'Category updated successfully.');
      } else {
        // Create new category
        res = await postCategoriesData(payload);
        showNotification('success', 'Success', 'Category created successfully.');
      }
      
      // refresh list and switch tab
      await fetchCategories(pagination.currentPage, searchTerm, filters.branch);
      setActiveTab('category-list');
      setEditingCategory(null);
      setIsEditMode(false);
      setFormData({});
      setCourses([]);
      // e.currentTarget.reset();
    } catch (err) {
      showNotification('error', 'Error', err?.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} category`);
    } finally {
      setLoading(false);
    }
  };

  const ExportIcon = () => (
    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0006 0v-1m-4-4l4-4m0 0l4 4m-4-4v12"></path></svg>
  );

  console.log(branches, "branches");

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

  return (
    <>
      <Navbar headData={headData} activeTab={activeTab} />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="w-full sm:w-auto">
          <Tabs tabs={tabOptions} activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>

        <div className="flex justify-end w-full sm:w-auto">
          <button onClick={handleExport} disabled={loading} className="flex items-center px-4 py-2 bg-white text-gray-600 rounded-md font-medium border border-gray-300 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            {loading ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-lg ">



        {/* Tab content */}
        {activeTab === 'category-list' ? (
          <div id="category-list-content" className="p-4 sm:p-6">

            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6">
              <div className="flex-1 sm:mr-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search Categories"
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
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
                  value={filters.branch}
                  onChange={(e) => handleFilterChange('branch', e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">All Branches</option>
                  {branches.map(branch => (
                    <option key={branch._id} value={branch.branchName}>
                      {branch.branchName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Categories Table */}
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading categories...</p>
                </div>
              </div>
            ) : categories.length === 0 ? (
              <div className="flex items-center justify-center p-12">
                <p className="text-gray-500 text-lg">
                  {searchTerm || filters.branch ? 'No categories found matching your search.' : 'No categories available. Please add categories to view them here.'}
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
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category Name</th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Courses</th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {categories.map((category, idx) => (
                        <tr key={category._id || idx} className="hover:bg-gray-50">
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{idx + 1}</td>
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                                  <span className="text-orange-600 font-medium text-sm">
                                    {category.categoryName?.charAt(0)?.toUpperCase() || 'C'}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{category.categoryName}</div>
                                <div className="text-sm text-gray-500">ID: {category._id?.slice(-6) || 'N/A'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {category.branch}
                            </span>
                          </td>
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              {category.totalCourses || 0}
                            </span>
                          </td>
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {category.createdAt ? new Date(category.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => handleViewCategory(category)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                View
                              </button>
                              <button 
                                onClick={() => handleEditCategory(category)}
                                className="text-orange-600 hover:text-orange-900"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleDeleteCategory(category)}
                                className="text-red-600 hover:text-red-900"
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
                  {categories.map((category, idx) => (
                    <div key={category._id || idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-shrink-0 h-12 w-12">
                          <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                            <span className="text-orange-600 font-medium text-base">
                              {category.categoryName?.charAt(0)?.toUpperCase() || 'C'}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-gray-900 truncate">{category.categoryName}</h3>
                          <p className="text-xs text-gray-500">ID: {category._id?.slice(-6) || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Branch:</span>
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {category.branch}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Total Courses:</span>
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            {category.totalCourses || 0}
                          </span>
                        </div>
                        <div><span className="font-medium">Created:</span> {category.createdAt ? new Date(category.createdAt).toLocaleDateString() : 'N/A'}</div>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200">
                        <button 
                          onClick={() => handleViewCategory(category)}
                          className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                        >
                          View
                        </button>
                        <button 
                          onClick={() => handleEditCategory(category)}
                          className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 rounded-md hover:bg-orange-100 transition-colors"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteCategory(category)}
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
        ) : (
          <div id="new-category-content">
            <form onSubmit={handleCreateCategory} className="space-y-6 p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">
                {isEditMode ? `Edit Category - ${editingCategory?.categoryName}` : 'Create New Category'}
              </h2>
              <h3 className="text-base sm:text-lg font-medium text-gray-900">Category Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category Name</label>
                  <input 
                    name="categoryName" 
                    type="text" 
                    placeholder="Enter Category Name" 
                    value={formData.categoryName || ''}
                    onChange={(e) => setFormData(prev => ({...prev, categoryName: e.target.value}))}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Courses</label>
                  <input type="number" value={courses.length} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500" disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Branch</label>
                  <select
                    name="branch"
                    value={formData.branch || ''}
                    onChange={(e) => setFormData(prev => ({...prev, branch: e.target.value}))}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                    required
                    disabled={branchesLoading}
                  >
                    {branchesLoading ? (
                      <option>Loading branches...</option>
                    ) : (
                      branches.map(branch => (
                        <option key={branch._id} value={branch.branchName}>
                          {branch.branchName}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* <h3 className="text-lg font-medium text-gray-900 mt-8">Add Courses</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Course Name</label>
                <input 
                  type="text" 
                  value={newCourse.courseName}
                  onChange={(e) => setNewCourse({...newCourse, courseName: e.target.value})}
                  placeholder="Enter Course Name" 
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <input 
                  type="text" 
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                  placeholder="Enter Description" 
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500" 
                />
              </div>
            </div>
            <button 
              type="button" 
              onClick={addCourse}
              className="mb-4 py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Add Course
            </button> */}

              <h3 className="text-base sm:text-lg font-medium text-gray-900 mt-6 sm:mt-8">Added Courses</h3>
              <div className="rounded-lg border border-gray-300 p-3 sm:p-4">
                {loading ? (
                  <div className="text-center py-6">
                    <div className="inline-flex items-center px-3 py-2 text-sm font-medium text-orange-600 bg-orange-100 rounded-full border border-orange-200">
                      <svg className="animate-spin w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                      </svg>
                      Loading courses...
                    </div>
                  </div>
                ) : courses.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-gray-100 rounded-full border border-gray-200">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                      </svg>
                      No courses added yet
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {courses.map((course, index) => (
                        <div key={index} className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-full border border-blue-200 hover:bg-blue-200 transition-colors">
                          <span className="mr-2">{course.courseName}</span>
                          <button
                            type="button"
                            onClick={() => removeCourse(index)}
                            className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    {/* {courses.length > 0 && (
                      <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-md">
                        Total: {courses.length} course{courses.length !== 1 ? 's' : ''} added
                      </div>
                    )} */}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 mt-6 sm:mt-8">
                <button 
                  type="button" 
                  onClick={handleCancelEdit}
                  className="w-full sm:w-auto py-2 px-4 sm:px-6 rounded-lg bg-white border border-gray-300 font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="w-full sm:w-auto py-2 px-4 sm:px-6 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 disabled:opacity-60">
                  {loading 
                    ? (isEditMode ? 'Updating...' : 'Creating...') 
                    : (isEditMode ? 'Update Category' : 'Create Category')
                  }
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
      
      {/* Notification Modal */}
      <NotificationModal />
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Delete Category</h3>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete the category <strong>"{deletingCategory?.categoryName}"</strong>? 
                This action cannot be undone.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={cancelDelete}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteCategory}
                disabled={loading}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Category Details Modal */}
      {showViewModal && viewingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-start gap-4">
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900 break-words">{viewingCategory.categoryName}</h1>
                <button 
                  onClick={closeViewModal}
                  className="flex items-center gap-1 text-sm border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                  </svg>
                  <span className="hidden sm:inline">Close</span>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-4 sm:px-6 py-4 sm:py-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 text-xs sm:text-sm">
                <p className="leading-6"><span className="font-semibold text-gray-900">Category Name:</span> <span className="text-gray-600">{viewingCategory.categoryName || 'N/A'}</span></p>
                <p className="leading-6"><span className="font-semibold text-gray-900">Branch:</span> <span className="text-gray-600">{viewingCategory.branch || 'N/A'}</span></p>
                <p className="leading-6"><span className="font-semibold text-gray-900">Total Courses:</span> <span className="text-gray-600">{Array.isArray(viewingCategory.courses) ? viewingCategory.courses.length : (viewingCategory.totalCourses || 0)}</span></p>
                <p className="leading-6"><span className="font-semibold text-gray-900">Created:</span> <span className="text-gray-600">{viewingCategory.createdAt ? new Date(viewingCategory.createdAt).toLocaleDateString('en-GB') : 'N/A'}</span></p>
              </div>

              {/* Courses List */}
              <div className="mt-4 sm:mt-5">
                <h2 className="text-[#f7931e] font-semibold mb-3 text-sm sm:text-base italic">Courses</h2>
                {Array.isArray(viewingCategory.courses) && viewingCategory.courses.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {viewingCategory.courses.map((course, idx) => (
                      <span key={idx} className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full border border-blue-200">
                        {course.courseName || course}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-gray-500">No courses available for this category.</p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 sm:px-6 py-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button 
                  onClick={closeViewModal}
                  className="w-full sm:w-auto bg-gray-100 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
                <button 
                  onClick={() => {
                    closeViewModal();
                    handleEditCategory(viewingCategory);
                  }}
                  className="w-full sm:w-auto bg-[#f7931e] text-white px-4 py-2 rounded-lg hover:bg-[#e67c00] transition-colors"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
