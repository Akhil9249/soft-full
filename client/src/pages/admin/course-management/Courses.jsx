import React, { useEffect, useState } from 'react'
import Tabs from '../../../components/button/Tabs';
import { Navbar } from '../../../components/admin/AdminNavBar';
import useAxiosPrivate from '../../../hooks/useAxiosPrivate';
import AdminService from '../../../services/admin-api-service/AdminService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const Courses = () => {
  // const axiosPrivate = useAxiosPrivate();

  const { getCategoriesData, getCoursesData, postCoursesData, putCoursesData, deleteCoursesData } = AdminService();  


  const [activeTab, setActiveTab] = useState('courses');
  const [activeSubModule, setActiveSubModule] = useState('courseManagement');
  const [openSections, setOpenSections] = useState({
    administration: false,
    course: true,
    syllabus: false,
    task: false,
    schedule: false,
    settings: false,
  });

  const toggleSection = (section) => {
    setOpenSections(prevState => ({
      ...prevState,
      [section]: !prevState[section],
    }));
  };

  const headData = "Course Management"

  const departments = ['Choose Department', 'Computer Science', 'Electrical Engineering', 'Mechanical Engineering'];
  const branches = ['Choose Branch', 'Software Development', 'Data Science', 'Embedded Systems'];
  const employmentStatus = ['Choose Employment Status', 'Full-time', 'Part-time', 'Contract'];
  const courses = ['Choose Course', 'Web Development', 'Mobile App Development', 'Cybersecurity'];
  const batches = ['Choose Batch', 'Batch 1', 'Batch 2', 'Batch 3'];
  const courseStatus = ['Choose Course Status', 'Active', 'Inactive', 'Completed'];
  const syllabusStatus = ['Choose Syllabus Status', 'Pending', 'In Progress', 'Completed'];
  const placementStatus = ['Choose Placement Status', 'Placed', 'Not Placed'];
  const roles = ['Choose Role', 'super admin', 'admin', 'mentor', 'intern'];
  const durations = ['3 Months', '6 Months', '1 Year'];
  const courseTypes = ['Regular', 'Offer', 'Online'];
  const [categories, setCategories] = useState([]);
  const [courseList, setCourseList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [success, setSuccess] = useState('');
  const [editingCourse, setEditingCourse] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    syllabusFile: null
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingCourse, setDeletingCourse] = useState(null);
  const [notification, setNotification] = useState({
    show: false,
    type: 'success', // 'success', 'error', 'info'
    title: '',
    message: ''
  });
  
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingCourse, setViewingCourse] = useState(null);
  
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
    category: '',
    courseType: ''
  });

  const tabOptions = [
    { value: "courses", label: "Courses" },
    { value: "newCourse", label: isEditMode ? "Edit Course" : "New Course" }
  ];

  console.log("categories==", categories);

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

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError('');
      // const res = await axiosPrivate.get('http://localhost:3000/api/category');
      const res = await getCategoriesData();
      console.log("categories==", res);

      setCategories(res?.data || []);
      // setCategories(res);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async (page = 1, search = '', category = '', courseType = '') => {
    try {
      setLoading(true);
      setError('');
      
      // Build query parameters
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      });
      
      if (search) queryParams.append('search', search);
      if (category) queryParams.append('category', category);
      if (courseType) queryParams.append('courseType', courseType);
      
      const res = await getCoursesData(queryParams.toString());
      setCourseList(res?.data || []);
      
      // Update pagination state
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  // Pagination handlers
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
      fetchCourses(newPage, searchTerm, filters.category, filters.courseType);
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
    fetchCategories();
    fetchCourses(pagination.currentPage, searchTerm, filters.category, filters.courseType);
  }, []);

  // Handle search and filter changes with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchCourses(1, searchTerm, filters.category, filters.courseType);
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filters]);

  // Clear messages when switching tabs
  useEffect(() => {
    setError('');
    setSuccess('');
  }, [activeTab]);

  // No client-side filtering needed - server handles it

  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setIsEditMode(true);
    setFormData({
      courseName: course.courseName || "",
      duration: course.duration || "",
      category: typeof course.category === 'object' ? course.category._id : course.category || "",
      courseType: course.courseType || "",
      courseFee: course.courseFee || "",
      syllabusFile: course.syllabusFile || null,
    });
    setActiveTab('newCourse');
  };

  const handleCancelEdit = () => {
    setEditingCourse(null);
    setIsEditMode(false);
    setFormData({
      syllabusFile: null
    });
    setActiveTab('courses');
  };

  const handleDeleteCourse = (course) => {
    setDeletingCourse(course);
    setShowDeleteModal(true);
  };

  const handleViewCourse = (course) => {
    setViewingCourse(course);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewingCourse(null);
  };

  const confirmDeleteCourse = async () => {
    if (!deletingCourse) return;
    
    try {
      setLoading(true);
      setError('');
      const res = await deleteCoursesData(deletingCourse._id);
      showNotification('success', 'Success', 'Course deleted successfully.');
      await fetchCourses(pagination.currentPage, searchTerm, filters.category, filters.courseType);
      setShowDeleteModal(false);
      setDeletingCourse(null);
    } catch (err) {
      showNotification('error', 'Error', err?.response?.data?.message || 'Failed to delete course');
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeletingCourse(null);
  };

  const [permissions, setPermissions] = useState({
    studentManagement: {
      addStudent: false,
      viewStudent: false,
      editStudent: false,
      deleteStudent: false,
    },
    mentorManagement: {
      addMentor: false,
      viewMentor: false,
      editMentor: false,
      deleteMentor: false,
    },
    courseManagement: {
      addCourse: false,
      viewCourse: false,
      editCourse: false,
      deleteCourse: false,
    },
    categoryManagement: {
      addCategory: false,
      viewCategory: false,
      editCategory: false,
      deleteCategory: false,
    },
    moduleManagement: {
      addModule: false,
      viewModule: false,
      editModule: false,
      deleteModule: false,
    },
    topicManagement: {
      addTopic: false,
      viewTopic: false,
      editTopic: false,
      deleteTopic: false,
    },
    taskManagement: {
      addTask: false,
      viewTask: false,
      editTask: false,
      deleteTask: false,
    },
    weeklySchedule: {
      addSchedule: false,
      viewSchedule: false,
      editSchedule: false,
      deleteSchedule: false,
    },
    scheduleTiming: {
      addTiming: false,
      viewTiming: false,
      editTiming: false,
      deleteTiming: false,
    },
    staticPage: {
      addPage: false,
      viewPage: false,
      editPage: false,
      deletePage: false,
    },
  });

  const handlePermissionChange = (section, permission) => {
    setPermissions(prevState => ({
      ...prevState,
      [section]: {
        ...prevState[section],
        [permission]: !prevState[section][permission],
      },
    }));
  };

  const allPermissionsAreOn = (section) => {
    return Object.values(permissions[section]).every(Boolean);
  };

  const handleToggleAll = (section) => {
    const areAllOn = allPermissionsAreOn(section);
    const newPermissions = Object.fromEntries(
      Object.keys(permissions[section]).map(key => [key, !areAllOn])
    );
    setPermissions(prevState => ({
      ...prevState,
      [section]: newPermissions,
    }));
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      setError('');

      const queryParams = new URLSearchParams({ page: '1', limit: '10000' });
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.courseType) queryParams.append('courseType', filters.courseType);
      if (searchTerm) queryParams.append('search', searchTerm);

      const res = await getCoursesData(queryParams.toString());
      const allCourses = res?.data || [];
      if (!Array.isArray(allCourses) || allCourses.length === 0) {
        showNotification('error', 'Export Failed', 'No courses found to export');
        return;
      }

      const doc = new jsPDF('portrait', 'mm', 'a4');

      // Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(247, 147, 30);
      const title = 'Courses Report';
      const pageWidth = doc.internal.pageSize.getWidth();
      const titleWidth = doc.getTextWidth(title);
      doc.text(title, (pageWidth - titleWidth) / 2, 20);

      // Meta
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const exportedOn = `Exported on: ${new Date().toLocaleDateString('en-GB')}`;
      const totalText = `Total Courses: ${allCourses.length}`;
      const exportedOnWidth = doc.getTextWidth(exportedOn);
      const totalWidth = doc.getTextWidth(totalText);
      doc.text(exportedOn, (pageWidth - exportedOnWidth) / 2, 30);
      doc.text(totalText, (pageWidth - totalWidth) / 2, 35);

      // Fee formatter (handles strings with symbols/commas)
      const formatFee = (fee) => {
        if (fee === null || fee === undefined || fee === '') return 'N/A';
        const numeric = typeof fee === 'number' ? fee : parseFloat(String(fee).toString().replace(/[^0-9.-]/g, ''));
        if (Number.isNaN(numeric)) return 'N/A';
        return `${numeric.toLocaleString('en-IN')}`; // no currency symbol, no quotes
      };

      // Table data
      const tableData = allCourses.map(c => [
        c.courseName || 'N/A',
        c.duration || 'N/A',
        (typeof c.category === 'object' && c.category ? c.category.categoryName : c.category) || 'N/A',
        c.courseType || 'N/A',
        formatFee(c.courseFee),
        c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-GB') : 'N/A'
      ]);

      autoTable(doc, {
        startY: 45,
        head: [['Course Name', 'Duration', 'Category', 'Type', 'Fee', 'Created']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [247, 147, 30], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 'auto', halign: 'left', fontSize: 8 },
          1: { cellWidth: 'auto', halign: 'left', fontSize: 8 },
          2: { cellWidth: 'auto', halign: 'left', fontSize: 8 },
          3: { cellWidth: 'auto', halign: 'left', fontSize: 8 },
          4: { cellWidth: 'auto', halign: 'left', fontSize: 8 },
          5: { cellWidth: 'auto', halign: 'center', fontSize: 8 },
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

      doc.save(`courses_export_${new Date().toISOString().split('T')[0]}.pdf`);
      showNotification('success', 'Export Successful', `Exported ${allCourses.length} courses to PDF successfully`);
    } catch (err) {
      console.error('Courses export error:', err);
      showNotification('error', 'Export Failed', 'Failed to export courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStudentsList = () => (
    <div className="bg-white p-6 rounded-lg shadow-md flex-grow">
      <div className="flex justify-between items-center mb-6">
        <div className="flex-1 mr-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search Students"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path>
              </svg>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <select className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent">
            <option>Filter</option>
          </select>
          <button className="flex items-center px-4 py-2 bg-white text-gray-600 rounded-md font-medium border border-gray-300 hover:bg-gray-50 transition-all duration-200">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            Export
          </button>
        </div>
      </div>
      <div className="flex items-center justify-center p-12">
        <p className="text-gray-500 text-lg">No data available. Please add students to view them here</p>
      </div>
    </div>
  );

  const renderNewStudentForm = () => (
    <div className="bg-white p-6 rounded-lg shadow-md flex-grow">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div>
          <label className="block text-gray-700 font-medium mb-2">Full Name</label>
          <input type="text" placeholder="Enter full name" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Date of Birth</label>
          <input type="date" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Gender</label>
          <select className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent">
            <option>Choose Gender</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Email Address</label>
          <input type="email" placeholder="Enter Email Address" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Student Phone Number</label>
          <input type="tel" placeholder="Enter Student Phone Number" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Student WhatsApp Number</label>
          <input type="tel" placeholder="Enter Student WhatsApp Number" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Guardian's Name</label>
          <input type="text" placeholder="Enter Student Guardian's Name" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Father's Name</label>
          <input type="text" placeholder="Enter Student Father's Name" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Student Permanent Address</label>
          <input type="text" placeholder="Enter Student Permanent Address" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Mother's Name</label>
          <input type="text" placeholder="Enter Student Mother's Name" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Guardians/Parent Phone Number <span className="text-gray-400">(Optional)</span></label>
          <input type="tel" placeholder="Enter Guardians/Parent Phone Number" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">District</label>
          <input type="text" placeholder="Enter Student District" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">State</label>
          <input type="text" placeholder="Enter Student State" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Photo <span className="text-gray-400">(Photo format: JPG/PNG only)</span></label>
          <div className="flex items-center w-full px-4 py-2 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-transparent">
            <span className="text-gray-500 flex-1">Upload Photo</span>
            <input type="file" className="sr-only" id="photo-upload" />
            <label htmlFor="photo-upload" className="cursor-pointer text-gray-500 hover:text-orange-500">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zm3-4a1 1 0 011-1h6a1 1 0 011 1v2a1 1 0 01-1 1H7a1 1 0 01-1-1v-2z" clipRule="evenodd"></path>
              </svg>
            </label>
          </div>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-800 mb-4">Academic Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div>
          <label className="block text-gray-700 font-medium mb-2">Course</label>
          <select className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent">
            {courses.map(course => <option key={course}>{course}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Branch</label>
          <select className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent">
            {branches.map(branch => <option key={branch}>{branch}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Course Started Date</label>
          <input type="date" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Completion Date</label>
          <input type="date" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Batch</label>
          <select className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent">
            {batches.map(batch => <option key={batch}>{batch}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Course Status</label>
          <select className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent">
            {courseStatus.map(status => <option key={status}>{status}</option>)}
          </select>
        </div>
        <div className="lg:col-span-2">
          <label className="block text-gray-700 font-medium mb-2">Remarks/Notes <span className="text-gray-400">(Optional)</span></label>
          <input type="text" placeholder="Enter Any Remarks or notes" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-800 mb-4">Student Syllabus</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div>
          <label className="block text-gray-700 font-medium mb-2">Student Syllabus Status</label>
          <select className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent">
            {syllabusStatus.map(status => <option key={status}>{status}</option>)}
          </select>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-800 mb-4">Placement Information <span className="text-gray-400">(Optional)</span></h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div>
          <label className="block text-gray-700 font-medium mb-2">Placement Status</label>
          <select className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent">
            {placementStatus.map(status => <option key={status}>{status}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">LinkedIn</label>
          <input type="text" placeholder="Enter LinkedIn Link" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Portfolio</label>
          <input type="text" placeholder="Enter Portfolio Link" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Company Name <span className="text-gray-400">(Only If Placed)</span></label>
          <input type="text" placeholder="Enter Company Name" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Job Role <span className="text-gray-400">(Only If Placed)</span></label>
          <input type="text" placeholder="Enter Job Role" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Resume <span className="text-gray-400">(Upload PDF only Max 5MB)</span></label>
          <div className="flex items-center w-full px-4 py-2 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-transparent">
            <span className="text-gray-500 flex-1">upload resume</span>
            <input type="file" className="sr-only" id="resume-upload" />
            <label htmlFor="resume-upload" className="cursor-pointer text-gray-500 hover:text-orange-500">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zm3-4a1 1 0 011-1h6a1 1 0 011 1v2a1 1 0 01-1 1H7a1 1 0 01-1-1v-2z" clipRule="evenodd"></path>
              </svg>
            </label>
          </div>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-800 mb-4">Login & Access</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div>
          <label className="block text-gray-700 font-medium mb-2">Student Email Address</label>
          <input type="email" placeholder="Enter Mentor Email Address" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Create Password</label>
          <input type="password" placeholder="Create A Password" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Confirm Password</label>
          <input type="password" placeholder="Re-Enter The Password" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
        </div>
      </div>
      <div className="flex justify-end mt-8 space-x-4">
        <button className="px-6 py-2 border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-100 transition-colors duration-200">
          Cancel
        </button>
        <button className="px-6 py-2 bg-orange-500 text-white rounded-md font-medium shadow-md hover:bg-orange-600 transition-colors duration-200">
          Create Student
        </button>
      </div>
    </div>
  );

  const renderRolesList = () => (
    <div className="bg-white p-6 rounded-lg shadow-md flex-grow">
      <div className="flex justify-between items-center mb-6">
        <div className="flex-1 mr-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search Role"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path>
              </svg>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <button className="flex items-center px-4 py-2 bg-white text-gray-600 rounded-md font-medium border border-gray-300 hover:bg-gray-50 transition-all duration-200">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            Export
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg shadow-md">
          <thead>
            <tr className="bg-gray-100 text-left text-gray-600 font-semibold uppercase text-sm">
              <th className="py-3 px-4 rounded-tl-lg">#</th>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Last Log In</th>
              <th className="py-3 px-4">Updated by</th>
              <th className="py-3 px-4 rounded-tr-lg">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b last:border-b-0 border-gray-200">
              <td className="py-3 px-4">1</td>
              <td className="py-3 px-4">Priyesh</td>
              <td className="py-3 px-4">Super Admin</td>
              <td className="py-3 px-4">Full access to all modules</td>
              <td className="py-3 px-4">priyesh@gmail.com</td>
              <td className="py-3 px-4">13/01/25<br />16:25:22</td>
              <td className="py-3 px-4">Administrator</td>
              <td className="py-3 px-4 flex space-x-2">
                <button className="text-gray-500 hover:text-orange-500 transition-colors duration-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.5a1.25 1.25 0 011.768 0l2.536 2.536a1.25 1.25 0 010 1.768L12.768 18.768a2 2 0 01-1.414.586H6.5a2 2 0 01-2-2v-5.5a2 2 0 01.586-1.414l6-6a2 2 0 012.828 0z"></path></svg>
                </button>
                <button className="text-gray-500 hover:text-red-500 transition-colors duration-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="flex justify-end items-center mt-4 text-gray-500 text-sm space-x-2">
        <span>1 of 1</span>
        <button className="p-1 rounded-md border border-gray-300 text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        <button className="p-1 rounded-md border border-gray-300">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
        </button>
      </div>
    </div>
  );

  const renderNewRoleForm = () => (
    <div className="bg-white p-6 rounded-lg shadow-md flex-grow">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div>
          <label className="block text-gray-700 font-medium mb-2">Role</label>
          <select className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent">
            {roles.map(role => <option key={role}>{role}</option>)}
          </select>
        </div>
        <div className="lg:col-span-2">
          <label className="block text-gray-700 font-medium mb-2">Description</label>
          <input type="text" placeholder="Enter Description" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">All Privilege's</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.keys(permissions).map(section => (
          <div key={section} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-gray-700 capitalize">{section.replace(/([A-Z])/g, ' $1').trim()}</h4>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={allPermissionsAreOn(section)}
                  onChange={() => handleToggleAll(section)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
              </label>
            </div>
            <ul className="space-y-2">
              {Object.keys(permissions[section]).map(permission => (
                <li key={permission} className="flex items-center justify-between text-gray-600">
                  <span className="text-sm">{permission.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={permissions[section][permission]}
                      onChange={() => handlePermissionChange(section, permission)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="flex justify-end mt-8 space-x-4">
        <button className="px-6 py-2 border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-100 transition-colors duration-200">
          Cancel
        </button>
        <button className="px-6 py-2 bg-orange-500 text-white rounded-md font-medium shadow-md hover:bg-orange-600 transition-colors duration-200">
          Create Role
        </button>
      </div>
    </div>
  );

  const renderCoursesList = () => (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md flex-grow">

      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6">
        <div className="flex-1 sm:mr-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search Courses"
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
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category._id} value={category._id}>
                {category.categoryName}
              </option>
            ))}
          </select>
          <select 
            value={filters.courseType}
            onChange={(e) => handleFilterChange('courseType', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            {courseTypes.map(type => (
              <option key={type} value={type}>{type}</option>
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

      {/* Courses Table */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading courses...</p>
          </div>
        </div>
      ) : courseList.length === 0 ? (
        <div className="flex items-center justify-center p-12">
          <p className="text-gray-500 text-lg">
            {searchTerm || filters.category || filters.courseType ? 'No courses found matching your search.' : 'No courses available. Please add courses to view them here.'}
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
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course Name</th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee</th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Syllabus</th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {courseList.map((course, idx) => (
                  <tr key={course._id || idx} className="hover:bg-gray-50">
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{idx + 1}</td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                            <span className="text-orange-600 font-medium text-sm">
                              {course.courseName?.charAt(0)?.toUpperCase() || 'C'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{course.courseName}</div>
                          <div className="text-sm text-gray-500">ID: {course._id?.slice(-6) || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {course.duration}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {typeof course.category === 'object' && course.category ? course.category.categoryName : course.category}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        course.courseType === 'Regular' 
                          ? 'bg-green-100 text-green-800' 
                          : course.courseType === 'Fast Track'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {course.courseType}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{course.courseFee?.toLocaleString() || '0'}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      {course.syllabusFile ? (
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"></path>
                          </svg>
                          <span className="text-sm text-red-600 font-medium">PDF</span>
                          <a 
                            href={course.syllabusFile} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="ml-2 text-blue-600 hover:text-blue-800 text-xs"
                          >
                            View
                          </a>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-full border border-gray-200">
                          No Syllabus
                        </span>
                      )}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {course.createdAt ? new Date(course.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleViewCourse(course)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                        <button 
                          onClick={() => handleEditCourse(course)}
                          className="text-orange-600 hover:text-orange-900"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteCourse(course)}
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
            {courseList.map((course, idx) => (
              <div key={course._id || idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-shrink-0 h-12 w-12">
                    <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                      <span className="text-orange-600 font-medium text-base">
                        {course.courseName?.charAt(0)?.toUpperCase() || 'C'}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-900 truncate">{course.courseName}</h3>
                    <p className="text-xs text-gray-500">ID: {course._id?.slice(-6) || 'N/A'}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">Duration:</span>
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {course.duration}
                    </span>
                  </div>
                  <div><span className="font-medium">Category:</span> {typeof course.category === 'object' && course.category ? course.category.categoryName : course.category || 'N/A'}</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">Type:</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      course.courseType === 'Regular' 
                        ? 'bg-green-100 text-green-800' 
                        : course.courseType === 'Fast Track'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {course.courseType}
                    </span>
                  </div>
                  <div><span className="font-medium">Fee:</span> ₹{course.courseFee?.toLocaleString() || '0'}</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">Syllabus:</span>
                    {course.syllabusFile ? (
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-red-600 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"></path>
                        </svg>
                        <a 
                          href={course.syllabusFile} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                          View PDF
                        </a>
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-full border border-gray-200">
                        No Syllabus
                      </span>
                    )}
                  </div>
                  <div><span className="font-medium">Created:</span> {course.createdAt ? new Date(course.createdAt).toLocaleDateString() : 'N/A'}</div>
                </div>
                <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200">
                  <button 
                    onClick={() => handleViewCourse(course)}
                    className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                  >
                    View
                  </button>
                  <button 
                    onClick={() => handleEditCourse(course)}
                    className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 rounded-md hover:bg-orange-100 transition-colors"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteCourse(course)}
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

  const renderNewCourseForm = () => (
    <form onSubmit={async (e) => {
      e.preventDefault();
      setError('');
      const formDataObj = new FormData(e.currentTarget);

      const courseName = formDataObj.get('courseName');
      const duration = formDataObj.get('duration');
      const category = formDataObj.get('category');
      const courseType = formDataObj.get('courseType');
      const courseFee = formDataObj.get('courseFee');

      // Validate required fields
      if (!courseName || !duration || !category || !courseType || !courseFee) {
        showNotification('error', 'Validation Error', 'All fields are required');
        return;
      }

      const payload = {
        courseName: courseName.trim(),
        duration: duration,
        category: category,
        courseType: courseType,
        courseFee: Number(courseFee),
        syllabusFile: formData.syllabusFile || null,
      };
      try {
        setLoading(true);
        let res;
        if (isEditMode && editingCourse) {
          // Update existing course
          res = await putCoursesData(editingCourse._id, payload);
          showNotification('success', 'Success', 'Course updated successfully.');
        } else {
          // Create new course
          res = await postCoursesData(payload);
          showNotification('success', 'Success', 'Course created successfully.');
        }
        
        await fetchCourses(pagination.currentPage, searchTerm, filters.category, filters.courseType);
        setActiveTab('courses');
        setEditingCourse(null);
        setIsEditMode(false);
        setFormData({
          syllabusFile: null
        });
        // e.currentTarget.reset();
      } catch (err) {
        showNotification('error', 'Error', err?.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} course`);
      } finally {
        setLoading(false);
      }
    }} className="bg-white p-4 sm:p-6 rounded-lg shadow-md flex-grow">
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">
        {isEditMode ? `Edit Course - ${editingCourse?.courseName}` : 'Create New Course'}
      </h2>
      <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Course Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div>
          <label className="block text-gray-700 font-medium mb-2">Course Name</label>
          <input 
            name="courseName" 
            type="text" 
            placeholder="Enter Course Name" 
            value={formData.courseName || ''}
            onChange={(e) => setFormData(prev => ({...prev, courseName: e.target.value}))}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" 
            required 
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Duration</label>
          <select 
            name="duration" 
            value={formData.duration || ''}
            onChange={(e) => setFormData(prev => ({...prev, duration: e.target.value}))}
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" 
            required
          >
            <option value="">Choose Duration</option>
            {durations.map(duration => <option key={duration} value={duration}>{duration}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Category Name</label>
          <select 
            name="category" 
            value={formData.category || ''}
            onChange={(e) => setFormData(prev => ({...prev, category: e.target.value}))}
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" 
            required
          >
            <option value="">Choose Category</option>
            {categories.map(c => <option key={c._id} value={c._id}>{c.categoryName}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Course Type</label>
          <select 
            name="courseType" 
            value={formData.courseType || ''}
            onChange={(e) => setFormData(prev => ({...prev, courseType: e.target.value}))}
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" 
            required
          >
            <option value="">Choose Course Type</option>
            {courseTypes.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Course Fee</label>
          <input 
            name="courseFee" 
            type="number" 
            placeholder="Enter Course Fee" 
            value={formData.courseFee || ''}
            onChange={(e) => setFormData(prev => ({...prev, courseFee: e.target.value}))}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" 
            required 
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Course Syllabus <span className="text-gray-400">(PDF only, Max 10MB)</span></label>
          <div className="flex items-center w-full px-4 py-2 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-transparent">
            <span className="text-gray-500 flex-1">
              {formData.syllabusFile ? formData.syllabusFile.name : 'Upload PDF Syllabus'}
            </span>
            <input 
              type="file" 
              name="syllabusFile"
              accept=".pdf"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  // Validate file type
                  if (file.type !== 'application/pdf') {
                    showNotification('error', 'Validation Error', 'Please upload only PDF files');
                    return;
                  }
                  // Validate file size (10MB = 10 * 1024 * 1024 bytes)
                  if (file.size > 10 * 1024 * 1024) {
                    showNotification('error', 'Validation Error', 'File size must be less than 10MB');
                    return;
                  }
                  setFormData(prev => ({...prev, syllabusFile: file}));
                  setError(''); // Clear any previous errors
                }
              }}
              className="sr-only" 
              id="syllabus-upload" 
            />
            <label htmlFor="syllabus-upload" className="cursor-pointer text-gray-500 hover:text-orange-500 transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zm3-4a1 1 0 011-1h6a1 1 0 011 1v2a1 1 0 01-1 1H7a1 1 0 01-1-1v-2z" clipRule="evenodd"></path>
              </svg>
            </label>
          </div>
          {formData.syllabusFile && (
            <div className="mt-2 flex items-center justify-between bg-green-50 border border-green-200 rounded-md px-3 py-2">
              <div className="flex items-center">
                <svg className="w-4 h-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"></path>
                </svg>
                <span className="text-sm text-green-800 font-medium">{formData.syllabusFile.name}</span>
                <span className="text-xs text-green-600 ml-2">
                  ({(formData.syllabusFile.size / (1024 * 1024)).toFixed(2)} MB)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({...prev, syllabusFile: null}))}
                className="text-red-500 hover:text-red-700 focus:outline-none"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 mt-6 sm:mt-8">
        <button 
          type="button"
          onClick={handleCancelEdit}
          className="w-full sm:w-auto px-4 sm:px-6 py-2 border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-100 transition-colors duration-200"
        >
          Cancel
        </button>
        <button type="submit" disabled={loading} className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-orange-500 text-white rounded-md font-medium shadow-md hover:bg-orange-600 transition-colors duration-200 disabled:opacity-60">
          {loading 
            ? (isEditMode ? 'Updating...' : 'Creating...') 
            : (isEditMode ? 'Update Course' : 'Create Course')
          }
        </button>
      </div>
    </form>
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

  const renderContent = () => {
    if (activeSubModule === 'studentManagement') {
      return (
        <div className="flex-1 p-8">
          <header className="flex justify-between items-center mb-6">
            <div className="flex flex-col">
              <h1 className="text-2xl font-semibold text-gray-800">Student Management</h1>
              <p className="text-sm text-gray-500">Administration &gt; Student Management</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex flex-col items-end">
                <span className="font-semibold text-gray-800">Priyesh</span>
                <span className="text-sm text-gray-500">Super Admin</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM10 12a7 7 0 100-14 7 7 0 000 14zM10 13a7 7 0 100-14 7 7 0 000 14z" />
                </svg>
              </div>
            </div>
          </header>
          <div className="flex space-x-2 mb-6">
            <button
              onClick={() => setActiveTab('studentsList')}
              className={`px-4 py-2 rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${activeTab === 'studentsList'
                  ? 'bg-orange-500 text-white shadow-md hover:bg-orange-600'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                }`}
            >
              Students List
            </button>
            <button
              onClick={() => setActiveTab('newStudent')}
              className={`px-4 py-2 rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${activeTab === 'newStudent'
                  ? 'bg-orange-500 text-white shadow-md hover:bg-orange-600'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                }`}
            >
              New Student
            </button>
          </div>
          {activeTab === 'studentsList' ? renderStudentsList() : renderNewStudentForm()}
        </div>
      );
    } else if (activeSubModule === 'roleManagement') {
      return (
        <div className="flex-1 p-8">
          <header className="flex justify-between items-center mb-6">
            <div className="flex flex-col">
              <h1 className="text-2xl font-semibold text-gray-800">Role Management</h1>
              <p className="text-sm text-gray-500">Administration &gt; Role Management &gt; Roles</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex flex-col items-end">
                <span className="font-semibold text-gray-800">Priyesh</span>
                <span className="text-sm text-gray-500">Super Admin</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM10 12a7 7 0 100-14 7 7 0 000 14zM10 13a7 7 0 100-14 7 7 0 000 14z" />
                </svg>
              </div>
            </div>
          </header>
          <div className="flex space-x-2 mb-6">
            <button
              onClick={() => setActiveTab('roles')}
              className={`px-4 py-2 rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${activeTab === 'roles'
                  ? 'bg-orange-500 text-white shadow-md hover:bg-orange-600'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                }`}
            >
              Roles
            </button>
            <button
              onClick={() => setActiveTab('newRole')}
              className={`px-4 py-2 rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${activeTab === 'newRole'
                  ? 'bg-orange-500 text-white shadow-md hover:bg-orange-600'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                }`}
            >
              New Role
            </button>
          </div>
          {activeTab === 'roles' ? renderRolesList() : renderNewRoleForm()}
        </div>
      );
    } else if (activeSubModule === 'courseManagement') {
      return (
        <div className="flex-1 ">

          <Navbar headData={headData} activeTab={activeTab} />


          <div className="mb-6">
            <Tabs tabs={tabOptions} activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>

          {activeTab === 'courses' ? renderCoursesList() : renderNewCourseForm()}
        </div>
      );
    }
    return null;
  };


  return (
    <>
      {renderContent()}
      
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
                <h3 className="text-lg font-medium text-gray-900">Delete Course</h3>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete the course <strong>"{deletingCourse?.courseName}"</strong>? 
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
                onClick={confirmDeleteCourse}
                disabled={loading}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Course Details Modal */}
      {showViewModal && viewingCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-start gap-4">
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900 break-words">{viewingCourse.courseName}</h1>
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
                <p className="leading-6"><span className="font-semibold text-gray-900">Course Name:</span> <span className="text-gray-600">{viewingCourse.courseName || 'N/A'}</span></p>
                <p className="leading-6"><span className="font-semibold text-gray-900">Duration:</span> <span className="text-gray-600">{viewingCourse.duration || 'N/A'}</span></p>
                <p className="leading-6"><span className="font-semibold text-gray-900">Category:</span> <span className="text-gray-600">{typeof viewingCourse.category === 'object' && viewingCourse.category ? viewingCourse.category.categoryName : viewingCourse.category || 'N/A'}</span></p>
                <p className="leading-6"><span className="font-semibold text-gray-900">Type:</span> <span className="text-gray-600">{viewingCourse.courseType || 'N/A'}</span></p>
                <p className="leading-6"><span className="font-semibold text-gray-900">Fee:</span> <span className="text-gray-600">{viewingCourse.courseFee ? `₹${Number(viewingCourse.courseFee).toLocaleString()}` : 'N/A'}</span></p>
                <p className="leading-6"><span className="font-semibold text-gray-900">Created:</span> <span className="text-gray-600">{viewingCourse.createdAt ? new Date(viewingCourse.createdAt).toLocaleDateString('en-GB') : 'N/A'}</span></p>
                <p className="leading-6"><span className="font-semibold text-gray-900">ID:</span> <span className="text-gray-600">{viewingCourse._id?.slice(-6) || 'N/A'}</span></p>
              </div>

              {/* Syllabus */}
              <div className="mt-4 sm:mt-5">
                <h2 className="text-[#f7931e] font-semibold mb-3 text-sm sm:text-base italic">Syllabus</h2>
                {viewingCourse.syllabusFile ? (
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"></path>
                    </svg>
                    <span className="text-xs sm:text-sm text-red-600 font-medium">PDF</span>
                    <a 
                      href={viewingCourse.syllabusFile} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-600 hover:text-blue-800 text-xs"
                    >
                      View
                    </a>
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-gray-500">No syllabus uploaded.</p>
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
                    handleEditCourse(viewingCourse);
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
