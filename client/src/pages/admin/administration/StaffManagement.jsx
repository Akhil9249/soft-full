// import React from 'react'

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from '../../../hooks/useAuth';
import api from "../../../axios";
import Tabs from "../../../components/button/Tabs";
import { Navbar } from "../../../components/admin/AdminNavBar";
import AdminService from "../../../services/admin-api-service/AdminService";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const StaffManagement = () => {
    const navigate = useNavigate();
    const { getStaffData,putStaffData,postStaffData,getBranchesData,deleteStaffData,getRolesData,getTimingsData } = AdminService();


    const [activeTab, setActiveTab] = useState('staffList');
    const { auth } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [staff, setStaff] = useState([]);
    const [branches, setBranches] = useState([]);
    const [roles, setRoles] = useState([]);
    const [rolesLoading, setRolesLoading] = useState(false);
    const [timings, setTimings] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingStaff, setEditingStaff] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingStaff, setDeletingStaff] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [viewingStaff, setViewingStaff] = useState(null);
    const [notification, setNotification] = useState({
        show: false,
        type: 'success', // 'success', 'error', 'info'
        title: '',
        message: ''
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
    const [filters, setFilters] = useState({
        department: '',
        employmentStatus: '',
        branch: ''
    });
    const [formData, setFormData] = useState({
        // Basic Details
        fullName: "",
        dateOfBirth: "",
        gender: "",
        email: "",
        staffPhoneNumber: "",
        staffWhatsAppNumber: "",
        staffPermanentAddress: "",
        district: "",
        state: "",
        photo: null, // Will store File object

        // Professional Details
        department: "",
        branch: "",
        role: "",
        yearsOfExperience: "",
        dateOfJoining: "",
        employmentStatus: "",
        resignationDate: "",
        resume: null, // Will store File object
        remarks: "",

        // Login & Access
        officialEmail: "",
        password: "",
        confirmPassword: "",
        isMentor: false,
        time: [],
    });
    const [openSections, setOpenSections] = useState({
        administration: true,
        course: false,
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

    const headData = "Staff Management"

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

    // Fetch staff from backend
    const fetchStaff = async (page = 1, search = '', department = '', employmentStatus = '', branch = '') => {
        try {
            setLoading(true);
            setError('');
            
            // Build query parameters
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: pagination.limit.toString()
            });
            
            if (search) queryParams.append('search', search);
            if (department) queryParams.append('department', department);
            if (employmentStatus) queryParams.append('employmentStatus', employmentStatus);
            if (branch) queryParams.append('branch', branch);
            
            const res = await getStaffData(queryParams.toString());
            // Handle different response structures
            const staffData = res.data?.data || res.data || [];
            setStaff(Array.isArray(staffData) ? staffData : []);
            
            // Update pagination state
            if (res.pagination) {
                setPagination(res.pagination);
            }
        } catch (err) {
            console.error('Failed to load staff:', err);
            setError('Failed to load staff');
            setStaff([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch branches from backend
    const fetchBranches = async () => {
        try {
            // const res = await api.get('http://localhost:3000/api/branches');
            const res = await getBranchesData();
            // Handle different response structures
            const branchesData = res.data?.data || res.data || [];
            setBranches(Array.isArray(branchesData) ? branchesData : []);
        } catch (err) {
            console.error('Failed to load branches:', err);
            setBranches([]);
        }
    };

    // Fetch roles from backend
    const fetchRoles = async () => {
        try {
            setRolesLoading(true);
            const res = await getRolesData('all');
            // Handle different response structures
            const rolesData = res.data?.data || res.data || [];
            setRoles(Array.isArray(rolesData) ? rolesData : []);
            
        } catch (err) {
            console.error('Failed to load roles:', err);
            setRoles([]);
        } finally {
            setRolesLoading(false);
        }
    };

    // Fetch timings from backend
    const fetchTimings = async () => {
        try {
            const res = await getTimingsData();
            const timingsData = res.data?.data || res.data || [];
            setTimings(Array.isArray(timingsData) ? timingsData : []);
        } catch (err) {
            console.error('Failed to load timings:', err);
            setTimings([]);
        }
    };

    // Pagination handlers
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, currentPage: newPage }));
            fetchStaff(newPage, searchTerm, filters.department, filters.employmentStatus, filters.branch);
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

    // Load staff and branches when component mounts
    useEffect(() => {
        fetchStaff(pagination.currentPage, searchTerm, filters.department, filters.employmentStatus, filters.branch);
        fetchBranches();
        fetchRoles();
        fetchTimings();
    }, []);

    // Cleanup object URLs for photo preview
    useEffect(() => {
        return () => {
            if (photoPreview && photoPreview.startsWith('blob:')) {
                URL.revokeObjectURL(photoPreview);
            }
        };
    }, [photoPreview]);

    const isFirstRender = useRef(true);

    // Handle search and filter changes with debounce
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timeoutId = setTimeout(() => {
            fetchStaff(1, searchTerm, filters.department, filters.employmentStatus, filters.branch);
        }, 500); // 500ms debounce

        return () => clearTimeout(timeoutId);
    }, [searchTerm, filters]);

    // Clear messages when switching tabs
    useEffect(() => {
        setError('');
        setSuccess('');
    }, [activeTab]);

    // No client-side filtering needed - server handles it

    const tabOptions = [
        { value: "staffList", label: "Staff List" },
        { value: "newStaff", label: isEditMode ? "Edit Staff" : "New Staff" }
    ];

    const departments = ['Choose Department', 'UI/UX', 'Sales', 'Front office','Mern','Flutter','Python','Accounting','Digital Marketing'];
    const employmentStatus = ['Choose Employment Status', 'Active', 'Inactive'];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const resetMessages = () => {
        setError("");
        setSuccess("");
    };

    // Helper function to format date for input field
    const formatDateForInput = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "";
        return date.toISOString().split('T')[0];
    };

    const handleEditStaff = (staffMember) => {
        setEditingStaff(staffMember);
        setIsEditMode(true);
        setFormData({
            fullName: staffMember.fullName || "",
            dateOfBirth: formatDateForInput(staffMember.dateOfBirth),
            gender: staffMember.gender || "",
            email: staffMember.email || "",
            staffPhoneNumber: staffMember.staffPhoneNumber || "",
            staffWhatsAppNumber: staffMember.staffWhatsAppNumber || "",
            staffPermanentAddress: staffMember.staffPermanentAddress || "",
            district: staffMember.district || "",
            state: staffMember.state || "",
            photo: staffMember.photo || null, // Keep existing URL if available
            department: staffMember.department || "",
            branch: staffMember.branch?._id || staffMember.branch || "",
            role: staffMember.role?._id || staffMember.role || "",
            yearsOfExperience: staffMember.yearsOfExperience || "",
            dateOfJoining: formatDateForInput(staffMember.dateOfJoining),
            employmentStatus: staffMember.employmentStatus || "",
            resignationDate: formatDateForInput(staffMember.resignationDate),
            resume: staffMember.resume || null, // Keep existing URL if available
            remarks: staffMember.remarks || "",
            officialEmail: staffMember.officialEmail || "",
            password: "",
            confirmPassword: "",
            isMentor: staffMember.isMentor || false,
            time: staffMember.time?.map(t => typeof t === 'object' ? t._id : t) || [],
        });
        setPhotoPreview(staffMember.photo || null);
        setActiveTab('newStaff');
    };

    const handleCancelEdit = () => {
        setEditingStaff(null);
        setIsEditMode(false);
        setFormData({
            fullName: "",
            dateOfBirth: "",
            gender: "",
            email: "",
            staffPhoneNumber: "",
            staffWhatsAppNumber: "",
            staffPermanentAddress: "",
            district: "",
            state: "",
            photo: null,
            department: "",
            branch: "",
            role: "",
            yearsOfExperience: "",
            dateOfJoining: "",
            employmentStatus: "",
            resignationDate: "",
            resume: null,
            remarks: "",
            officialEmail: "",
            password: "",
            confirmPassword: "",
            isMentor: false,
            time: [],
        });
        setPhotoPreview(null);
        setActiveTab('staffList');
    };

    const handleDeleteStaff = (staffMember) => {
        setDeletingStaff(staffMember);
        setShowDeleteModal(true);
    };

    const handleViewStaff = (staffMember) => {
        setViewingStaff(staffMember);
        setShowViewModal(true);
    };

    const closeViewModal = () => {
        setShowViewModal(false);
        setViewingStaff(null);
    };

    const handleExport = async () => {
        try {
            setLoading(true);
            showNotification('info', 'Exporting', 'Preparing PDF export...');
            
            // Fetch all staff for export (no pagination)
            const queryParams = new URLSearchParams({
                page: '1',
                limit: '10000' // High limit to get all staff
            });
            
            const res = await getStaffData(queryParams.toString());
            const allStaff = res.data?.data || res.data || [];
            
            if (allStaff.length === 0) {
                showNotification('error', 'Export Failed', 'No staff found to export');
                return;
            }

            // Create new PDF document
            const doc = new jsPDF('portrait', 'mm', 'a4');
            
            // Add title
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(247, 147, 30); // Orange color
            doc.text('Staff Management Report', 14, 20);
            
            // Reset text color
            doc.setTextColor(0, 0, 0);

            // Add export date and total count
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Exported on: ${new Date().toLocaleDateString('en-GB')}`, 14, 30);
            doc.text(`Total Staff: ${allStaff.length}`, 14, 35);

            // Prepare table data with only specified columns
            const tableData = allStaff.map(staffMember => [
                staffMember.fullName || 'N/A',
                staffMember.email || 'N/A',
                staffMember.department || 'N/A',
                staffMember.role?.role || 'N/A',
                staffMember.branch?.branchName || 'N/A',
                staffMember.employmentStatus || 'N/A'
            ]);

            // Add table to PDF
            autoTable(doc, {
                startY: 45,
                head: [['Name', 'Email', 'Department', 'Role', 'Branch', 'Status']],
                body: tableData,
                theme: 'striped',
                headStyles: {
                    fillColor: [247, 147, 30],
                    textColor: 255,
                    fontStyle: 'bold',
                    fontSize: 9
                },
                columnStyles: {
                    0: { cellWidth: 'auto', halign: 'left', fontSize: 8 }, // Name
                    1: { cellWidth: 'auto', halign: 'left', fontSize: 8 }, // Email
                    2: { cellWidth: 'auto', halign: 'left', fontSize: 8 }, // Department
                    3: { cellWidth: 'auto', halign: 'left', fontSize: 8 }, // Role
                    4: { cellWidth: 'auto', halign: 'left', fontSize: 8 }, // Branch
                    5: { cellWidth: 'auto', halign: 'center', fontSize: 8 } // Status
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
            doc.save(`staff_export_${new Date().toISOString().split('T')[0]}.pdf`);
            
            showNotification('success', 'Export Successful', `Exported ${allStaff.length} staff to PDF successfully`);
        } catch (error) {
            console.error('Export error:', error);
            showNotification('error', 'Export Failed', 'Failed to export staff data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const confirmDeleteStaff = async () => {
        if (!deletingStaff) return;
        
        try {
            setLoading(true);
            setError('');
            const res = await deleteStaffData(deletingStaff._id);
            showNotification('success', 'Success', 'Staff deleted successfully.');
            await fetchStaff(pagination.currentPage, searchTerm, filters.department, filters.employmentStatus, filters.branch);
            setShowDeleteModal(false);
            setDeletingStaff(null);
        } catch (err) {
            showNotification('error', 'Error', err?.response?.data?.message || 'Failed to delete staff');
        } finally {
            setLoading(false);
        }
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setDeletingStaff(null);
    };

    const handleCreateStaff = async (e) => {
        e.preventDefault();
        resetMessages();

        // Basic validation - only check password matching if password is provided
        if (formData.password && formData.password.trim() !== '' && formData.password !== formData.confirmPassword) {
            showNotification('error', 'Validation Error', 'Passwords do not match.');
            return;
        }

        // Different validation for create vs edit
        const requiredFields = isEditMode 
            ? [
                'fullName', 'dateOfBirth', 'gender', 'email', 'staffPhoneNumber',
                'department', 'branch', 'dateOfJoining', 'employmentStatus',
                'officialEmail'
              ]
            : [
                'fullName', 'dateOfBirth', 'gender', 'email', 'staffPhoneNumber',
                'department', 'branch', 'dateOfJoining', 'employmentStatus',
                'officialEmail', 'password'
              ];

        const missing = requiredFields.filter((f) => !String(formData[f] || '').trim());
        if (missing.length) {
            showNotification('error', 'Validation Error', `Please fill required fields: ${missing.join(', ')}`);
            return;
        }

        // Build FormData for file uploads
        const payload = new FormData();
        
        // Add text fields
        payload.append('fullName', formData.fullName);
        if (formData.dateOfBirth) payload.append('dateOfBirth', formData.dateOfBirth);
        payload.append('gender', formData.gender);
        payload.append('email', formData.email);
        payload.append('staffPhoneNumber', formData.staffPhoneNumber);
        if (formData.staffWhatsAppNumber) payload.append('staffWhatsAppNumber', formData.staffWhatsAppNumber);
        if (formData.staffPermanentAddress) payload.append('staffPermanentAddress', formData.staffPermanentAddress);
        if (formData.district) payload.append('district', formData.district);
        if (formData.state) payload.append('state', formData.state);
        payload.append('department', formData.department);
        payload.append('branch', formData.branch);
        payload.append('role', formData.role);
        payload.append('yearsOfExperience', formData.yearsOfExperience ? Number(formData.yearsOfExperience) : 0);
        if (formData.dateOfJoining) payload.append('dateOfJoining', formData.dateOfJoining);
        payload.append('employmentStatus', formData.employmentStatus);
        if (formData.resignationDate) payload.append('resignationDate', formData.resignationDate);
        if (formData.remarks) payload.append('remarks', formData.remarks);
        payload.append('officialEmail', formData.officialEmail);
        
        // Add files only if they are File objects (new uploads)
        if (formData.photo instanceof File) {
            payload.append('photo', formData.photo);
        } else if (formData.photo && typeof formData.photo === 'string') {
            // If it's a string (existing URL), pass it as a field
            payload.append('photo', formData.photo);
        }
        
        if (formData.resume instanceof File) {
            payload.append('resume', formData.resume);
        } else if (formData.resume && typeof formData.resume === 'string') {
            // If it's a string (existing URL), pass it as a field
            payload.append('resume', formData.resume);
        }
        
        // Only include password if it's provided (for new staff or password updates)
        if (formData.password && formData.password.trim() !== '') {
            payload.append('password', formData.password);
        }
        
        payload.append('isMentor', formData.isMentor);
        if (formData.time && formData.time.length > 0) {
            payload.append('time', JSON.stringify(formData.time));
        }

        try {
            setLoading(true);
            let res;
            if (isEditMode && editingStaff) {
                // Update existing staff
                res = await putStaffData(editingStaff._id, payload);
                showNotification('success', 'Success', 'Staff updated successfully.');
            } else {
                // Create new staff
                res = await postStaffData(payload);
                showNotification('success', 'Success', 'Staff created successfully.');
            }
            
            // Refresh staff list
            await fetchStaff(pagination.currentPage, searchTerm, filters.department, filters.employmentStatus, filters.branch);
            // Switch tab and reset form
            setActiveTab('staffList');
            setEditingStaff(null);
            setIsEditMode(false);
            setFormData({
                fullName: "",
                dateOfBirth: "",
                gender: "",
                email: "",
                staffPhoneNumber: "",
                staffWhatsAppNumber: "",
                staffPermanentAddress: "",
                district: "",
                state: "",
                photo: null,
                department: "",
                branch: "",
                role: "",
                yearsOfExperience: "",
                dateOfJoining: "",
                employmentStatus: "",
                resignationDate: "",
                resume: null,
                remarks: "",
                officialEmail: "",
                password: "",
                confirmPassword: "",
                isMentor: false,
                time: [],
            });
            setPhotoPreview(null);
        } catch (err) {
            console.error('Staff operation error:', err);
            console.error('Error response:', err?.response?.data);
            const msg = err?.response?.data?.message || err?.message || `Failed to ${isEditMode ? 'update' : 'create'} staff`;
            showNotification('error', 'Error', msg);
        } finally {
            setLoading(false);
        }
    };

    const renderStaffList = () => (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md flex-grow">

            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6">
                <div className="flex-1 sm:mr-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search Staff"
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
                        value={filters.department}
                        onChange={(e) => handleFilterChange('department', e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                        <option value="">All Departments</option>
                        {departments.slice(1).map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                    {auth?.role?.toLowerCase() === 'super admin' && (
                        <select 
                            value={filters.branch}
                            onChange={(e) => handleFilterChange('branch', e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                            <option value="">All Branches</option>
                            {branches.map(branch => (
                                <option key={branch._id} value={branch._id}>{branch.branchName}</option>
                            ))}
                        </select>
                    )}
                    <select 
                        value={filters.employmentStatus}
                        onChange={(e) => handleFilterChange('employmentStatus', e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                        <option value="">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Pause">Pause</option>    
                        <option value="Inactive">Inactive</option>
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

            {/* Staff Table */}
            {loading ? (
                <div className="flex items-center justify-center p-12">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading staff...</p>
                    </div>
                </div>
            ) : staff.length === 0 ? (
                <div className="flex items-center justify-center p-12">
                    <p className="text-gray-500 text-lg">
                        {searchTerm || filters.department || filters.employmentStatus ? 'No staff found matching your search.' : 'No staff available. Please add staff to view them here.'}
                    </p>
                </div>
            ) : (
                <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-4 lg:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Batches</th>
                                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider flex justify-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {staff.map((staffMember) => (
                                    <tr key={staffMember._id} className="hover:bg-gray-50">
                                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                                                        <span className="text-orange-600 font-medium text-sm">
                                                            {staffMember.fullName?.charAt(0)?.toUpperCase() || 'S'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{staffMember.fullName}</div>
                                                    <div className="text-sm text-gray-500">{staffMember.staffPhoneNumber}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{staffMember.email}</div>
                                            <div className="text-sm text-gray-500">{staffMember.officialEmail}</div>
                                        </td>
                                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{staffMember.department}</td>
                                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{staffMember.role?.role || 'N/A'}</td>
                                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{staffMember.branch?.branchName || 'N/A'}</td>
                                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                staffMember.employmentStatus === 'Active' 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {staffMember.employmentStatus}
                                            </span>
                                        </td>
                                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                            {staffMember.isMentor ? (
                                                <button 
                                                    onClick={() => navigate('/mentor-batches', { state: { searchMentor: staffMember.fullName } })}
                                                    className="inline-flex items-center px-3 py-1 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded-md text-xs font-medium transition-colors"
                                                    title="View Mentor Batches"
                                                >
                                                    View Batches
                                                </button>
                                            ) : (
                                                <span className="text-gray-400 text-xs italic">N/A</span>
                                            )}
                                        </td>
                                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium flex justify-center">
                                            <div className="flex space-x-2">
                                                <button 
                                                    onClick={() => handleViewStaff(staffMember)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="View Details"
                                                >
                                                    View
                                                </button>
                                                <button 
                                                    onClick={() => handleEditStaff(staffMember)}
                                                    className="text-orange-600 hover:text-orange-900"
                                                    title="Edit Staff"
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteStaff(staffMember)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Delete Staff"
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
                        {staff.map((staffMember) => (
                            <div key={staffMember._id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="flex-shrink-0 h-12 w-12">
                                        <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                                            <span className="text-orange-600 font-medium text-base">
                                                {staffMember.fullName?.charAt(0)?.toUpperCase() || 'S'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base font-semibold text-gray-900 truncate">{staffMember.fullName}</h3>
                                        <p className="text-sm text-gray-500">{staffMember.staffPhoneNumber}</p>
                                        <p className="text-xs text-gray-500 truncate">{staffMember.email}</p>
                                    </div>
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${
                                        staffMember.employmentStatus === 'Active' 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {staffMember.employmentStatus}
                                    </span>
                                </div>
                                <div className="space-y-2 text-sm text-gray-600 mb-3">
                                    <div><span className="font-medium">Department:</span> {staffMember.department || 'N/A'}</div>
                                    <div><span className="font-medium">Role:</span> {staffMember.role?.role || 'N/A'}</div>
                                    <div><span className="font-medium">Branch:</span> {staffMember.branch?.branchName || 'N/A'}</div>
                                </div>
                                <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200">
                                    <button 
                                        onClick={() => handleViewStaff(staffMember)}
                                        className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                                    >
                                        View
                                    </button>
                                    <button 
                                        onClick={() => handleEditStaff(staffMember)}
                                        className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 rounded-md hover:bg-orange-100 transition-colors"
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteStaff(staffMember)}
                                        className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                                    >
                                        Delete
                                    </button>
                                    {staffMember.isMentor && (
                                        <button 
                                            onClick={() => navigate('/mentor-batches', { state: { searchMentor: staffMember.fullName } })}
                                            className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-[#f7931e] bg-orange-50 rounded-md hover:bg-orange-100 transition-colors"
                                        >
                                            Batches
                                        </button>
                                    )}
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

    const renderNewStaffForm = () => (
        <form onSubmit={handleCreateStaff} className="bg-white p-4 sm:p-6 rounded-lg shadow-md flex-grow">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">
                {isEditMode ? `Edit Staff - ${editingStaff?.fullName}` : 'Create New Staff'}
            </h2>
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Basic Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div>
                    <label className="block text-gray-700 font-medium mb-2">Full Name</label>
                    <input name="fullName" value={formData.fullName} onChange={handleInputChange} type="text" placeholder="Enter full name" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                </div>
                <div>
                    <label className="block text-gray-700 font-medium mb-2">Date of Birth</label>
                    <input name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} type="date" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                </div>
                <div>
                    <label className="block text-gray-700 font-medium mb-2">Gender</label>
                    <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                        <option value="">Choose Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div>
                    <label className="block text-gray-700 font-medium mb-2">Email Address</label>
                    <input name="email" value={formData.email} onChange={handleInputChange} type="email" placeholder="Enter Email Address" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                </div>
                <div>
                    <label className="block text-gray-700 font-medium mb-2">Staff Phone Number</label>
                    <input name="staffPhoneNumber" value={formData.staffPhoneNumber} onChange={handleInputChange} type="tel" placeholder="Enter Staff Phone Number" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                </div>
                <div>
                    <label className="block text-gray-700 font-medium mb-2">Staff WhatsApp Number</label>
                    <input name="staffWhatsAppNumber" value={formData.staffWhatsAppNumber} onChange={handleInputChange} type="tel" placeholder="Enter Staff WhatsApp Number" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                </div>
                <div>
                    <label className="block text-gray-700 font-medium mb-2">Staff Permanent Address</label>
                    <input name="staffPermanentAddress" value={formData.staffPermanentAddress} onChange={handleInputChange} type="text" placeholder="Enter Staff Permanent Address" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                </div>
                <div>
                    <label className="block text-gray-700 font-medium mb-2">District</label>
                    <input name="district" value={formData.district} onChange={handleInputChange} type="text" placeholder="Enter Staff District" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                </div>
                <div>
                    <label className="block text-gray-700 font-medium mb-2">State</label>
                    <input name="state" value={formData.state} onChange={handleInputChange} type="text" placeholder="Enter Staff State" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                </div>
                <div>
                    <label className="block text-gray-700 font-medium mb-2">Photo <span className="text-gray-400">(Photo format: JPG/PNG only)</span></label>
                    <div className="relative flex items-center w-full px-4 py-2 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-transparent bg-white">
                        <span className="text-gray-500 flex-1 truncate pr-2">
                            {formData.photo instanceof File 
                                ? formData.photo.name 
                                : formData.photo && typeof formData.photo === 'string' 
                                    ? 'Existing photo (click to change)' 
                                    : 'Upload Photo'}
                        </span>
                        <input 
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    // Validate file type
                                    if (!file.type.match('image/(jpeg|jpg|png)')) {
                                        showNotification('error', 'Validation Error', 'Please upload only JPG or PNG images');
                                        e.target.value = ''; // Reset input to allow retry
                                        return;
                                    }
                                    setFormData((p) => ({ ...p, photo: file }));
                                    setPhotoPreview(URL.createObjectURL(file));
                                    setError(''); // Clear any previous errors
                                }
                            }} 
                            type="file" 
                            accept="image/jpeg,image/jpg,image/png"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            id="photo-upload"
                            name="photo"
                        />
                        <div className="pointer-events-none flex-shrink-0">
                            <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zm3-4a1 1 0 011-1h6a1 1 0 011 1v2a1 1 0 01-1 1H7a1 1 0 01-1-1v-2z" clipRule="evenodd"></path>
                            </svg>
                        </div>
                    </div>
                    {photoPreview && (
                        <div className="mt-3 relative w-32 h-32 group">
                            <img 
                                src={photoPreview} 
                                alt="Profile Preview" 
                                className="w-full h-full object-cover rounded-md border border-gray-200"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    setFormData(p => ({ ...p, photo: null }));
                                    setPhotoPreview(null);
                                }}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                title="Remove photo"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Professional Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div>
                    <label className="block text-gray-700 font-medium mb-2">Department</label>
                    <select name="department" value={formData.department} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                        {departments.map((dept) => <option key={dept} value={dept === 'Choose Department' ? '' : dept}>{dept}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-gray-700 font-medium mb-2">Type of Employee</label>
                    <select name="role" value={formData.role} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" disabled={rolesLoading}>
                        <option value="">Choose Role</option>
                        {rolesLoading ? (
                            <option>Loading roles...</option>
                        ) : (
                            roles.map((role) => (
                                <option key={role._id} value={role._id}>
                                    {role.role}
                                </option>
                            ))
                        )}
                    </select>
                </div>
                <div>
                    <label className="block text-gray-700 font-medium mb-2">Branch</label>
                    <select name="branch" value={formData.branch} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                        <option value="">Choose Branch</option>
                        {branches.map((branch) => (
                            <option key={branch._id} value={branch._id}>
                                {branch.branchName}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-gray-700 font-medium mb-2">Years of Experience</label>
                    <input name="yearsOfExperience" value={formData.yearsOfExperience} onChange={handleInputChange} type="number" min="0" placeholder="Enter years of experience" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                </div>
                <div>
                    <label className="block text-gray-700 font-medium mb-2">Date of Joining</label>
                    <input name="dateOfJoining" value={formData.dateOfJoining} onChange={handleInputChange} type="date" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                </div>
                <div>
                    <label className="block text-gray-700 font-medium mb-2">Employment Status</label>
                    <select name="employmentStatus" value={formData.employmentStatus} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                        {employmentStatus.map((status) => <option key={status} value={status === 'Choose Employment Status' ? '' : status}>{status}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-gray-700 font-medium mb-2">Resignation Date <span className="text-gray-400">(Only If Inactive)</span></label>
                    <input name="resignationDate" value={formData.resignationDate} onChange={handleInputChange} type="date" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                </div>
                <div>
                    <label className="block text-gray-700 font-medium mb-2">Resume <span className="text-gray-400">(Upload PDF only Max 5MB)</span></label>
                    <div className="relative flex items-center w-full px-4 py-2 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-transparent bg-white">
                        <span className="text-gray-500 flex-1 truncate pr-2">
                            {formData.resume instanceof File 
                                ? formData.resume.name 
                                : formData.resume && typeof formData.resume === 'string' 
                                    ? 'Existing resume (click to change)' 
                                    : 'Upload resume'}
                        </span>
                        <input 
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    // Validate file type
                                    if (file.type !== 'application/pdf') {
                                        showNotification('error', 'Validation Error', 'Please upload only PDF files');
                                        e.target.value = ''; // Reset input to allow retry
                                        return;
                                    }
                                    // Validate file size (5MB = 5 * 1024 * 1024 bytes)
                                    if (file.size > 5 * 1024 * 1024) {
                                        showNotification('error', 'Validation Error', 'File size must be less than 5MB');
                                        e.target.value = ''; // Reset input to allow retry
                                        return;
                                    }
                                    setFormData((p) => ({ ...p, resume: file }));
                                    setError(''); // Clear any previous errors
                                }
                            }} 
                            type="file" 
                            accept="application/pdf"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                            id="resume-upload"
                            name="resume"
                        />
                        <div className="pointer-events-none flex-shrink-0">
                            <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zm3-4a1 1 0 011-1h6a1 1 0 011 1v2a1 1 0 01-1 1H7a1 1 0 01-1-1v-2z" clipRule="evenodd"></path>
                            </svg>
                        </div>
                    </div>
                </div>
                <div>
                {/* <div className="md:col-span-2"> */}
                    <label className="block text-gray-700 font-medium mb-2">Remarks/Notes <span className="text-gray-400">(Optional)</span></label>
                    <input name="remarks" value={formData.remarks} onChange={handleInputChange} type="text" placeholder="Enter Any Remarks or notes" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                </div>
            </div>

            {/* Mentor Timings Section */}
            <div className="mb-6 sm:mb-8">
                <div className="flex items-center mb-4">
                    <input 
                        type="checkbox" 
                        id="isMentor" 
                        name="isMentor" 
                        checked={formData.isMentor}
                        onChange={(e) => setFormData(prev => ({ ...prev, isMentor: e.target.checked }))}
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded" 
                    />
                    <label htmlFor="isMentor" className="ml-2 block text-gray-700 font-medium">
                        Enable Mentor Role
                    </label>
                </div>
                
                {formData.isMentor && (
                    <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Side: Dropdown */}
                            <div>
                                <label className="block text-gray-700 font-medium mb-2">Select Timings</label>
                                <select
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                                    onChange={(e) => {
                                        const selectedId = e.target.value;
                                        if (selectedId && !formData.time.includes(selectedId)) {
                                            setFormData(prev => ({
                                                ...prev,
                                                time: [...prev.time, selectedId]
                                            }));
                                        }
                                        e.target.value = ""; // reset dropdown after selection
                                    }}
                                    defaultValue=""
                                >
                                    <option value="" disabled>-- Select a Timing --</option>
                                    {timings.filter(t => !formData.time.includes(t._id)).map(t => (
                                        <option key={t._id} value={t._id}>{t.timeSlot}</option>
                                    ))}
                                </select>
                                {timings.length === 0 && (
                                    <p className="text-sm text-gray-500 mt-2">No timings available. Please add timings in the system.</p>
                                )}
                            </div>
                            
                            {/* Right Side: Selected Timings */}
                            <div>
                                <label className="block text-gray-700 font-medium mb-2">Selected Timings</label>
                                <div className="flex flex-wrap gap-2">
                                    {formData.time.length === 0 ? (
                                        <p className="text-sm text-gray-500 italic mt-2">No timings selected yet.</p>
                                    ) : (
                                        formData.time.map(id => {
                                            const timingObj = timings.find(t => t._id === id);
                                            return (
                                                <div key={id} className="flex items-center bg-orange-100 text-orange-800 px-3 py-1.5 rounded-full text-sm font-medium border border-orange-200">
                                                    <span>{timingObj ? timingObj.timeSlot : "Unknown Timing"}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                time: prev.time.filter(tId => tId !== id)
                                                            }));
                                                        }}
                                                        className="ml-2 text-orange-500 hover:text-orange-900 focus:outline-none flex-shrink-0"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Login & Access</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div>
                    <label className="block text-gray-700 font-medium mb-2">Staff's Official Email Address</label>
                    <input name="officialEmail" value={formData.officialEmail} onChange={handleInputChange} type="email" placeholder="Enter Staff's Official Email Address" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                </div>
                <div>
                    <label className="block text-gray-700 font-medium mb-2">
                        {isEditMode ? 'Update Password' : 'Create Password'}
                        {isEditMode && <span className="text-red-400 text-[12px] ml-1">(Leave blank to keep current password)</span>}
                    </label>
                    <input 
                        name="password" 
                        value={formData.password} 
                        onChange={handleInputChange} 
                        type="password" 
                        placeholder={isEditMode ? "Enter new password (optional)" : "Create A Password"} 
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" 
                    />
                </div>
                <div>
                    <label className="block text-gray-700 font-medium mb-2">
                        {isEditMode ? 'Confirm New Password' : 'Confirm Password'}
                        {isEditMode && <span className="text-red-400 text-[12px] ml-1">(Only if updating password)</span>}
                    </label>
                    <input 
                        name="confirmPassword" 
                        value={formData.confirmPassword} 
                        onChange={handleInputChange} 
                        type="password" 
                        placeholder={isEditMode ? "Re-enter new password (optional)" : "Re-Enter The Password"} 
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" 
                    />
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
                        : (isEditMode ? 'Update Staff' : 'Create Staff')
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

    return (
        <div>

            <Navbar headData={headData} activeTab={activeTab} />

            <div className="mb-6">
                <Tabs tabs={tabOptions} activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>

            {/* Conditional Rendering */}
            {activeTab === 'staffList' ? renderStaffList() : renderNewStaffForm()}

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
                                <h3 className="text-lg font-medium text-gray-900">Delete Staff</h3>
                            </div>
                        </div>
                        <div className="mb-4">
                            <p className="text-sm text-gray-500">
                                Are you sure you want to delete the staff <strong>"{deletingStaff?.fullName}"</strong>? 
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
                                onClick={confirmDeleteStaff}
                                disabled={loading}
                                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Staff Details Modal */}
            {showViewModal && viewingStaff && (
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
                                background: white;
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
                                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 break-words">{viewingStaff.fullName}</h1>
                                <button 
                                    onClick={closeViewModal}
                                    className="flex items-center text-black gap-1 text-sm border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors print-hide flex-shrink-0"
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
                            <div className="flex flex-col md:flex-row gap-6 sm:gap-10 print:flex-col print:gap-4 print-full-width">
                                {/* Left Column - Details */}
                                <div className="flex-1 space-y-6 print:flex-none print-full-width">
                                    {/* Basic Details */}
                                    <div>
                                        <h2 className="text-[#f7931e] font-semibold mb-4 text-lg italic">
                                            Basic Details
                                        </h2>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 text-xs sm:text-sm print:grid-cols-2 print-full-width">
                                            <p className="leading-6"><span className="font-semibold text-gray-900">Full Name:</span> <span className="text-gray-600">{viewingStaff.fullName || 'N/A'}</span></p>
                                            <p className="leading-6"><span className="font-semibold text-gray-900">Date of Birth:</span> <span className="text-gray-600">{viewingStaff.dateOfBirth ? new Date(viewingStaff.dateOfBirth).toLocaleDateString('en-GB').replace(/\//g, ' / ') : 'N/A'}</span></p>
                                            <p className="leading-6"><span className="font-semibold text-gray-900">Gender:</span> <span className="text-gray-600">{viewingStaff.gender || 'N/A'}</span></p>
                                            <p className="leading-6"><span className="font-semibold text-gray-900">Email Address:</span> <span className="text-gray-600">{viewingStaff.email || 'N/A'}</span></p>
                                            <p className="leading-6"><span className="font-semibold text-gray-900">Staff Phone Number:</span> <span className="text-gray-600">{viewingStaff.staffPhoneNumber || 'N/A'}</span></p>
                                            <p className="leading-6"><span className="font-semibold text-gray-900">Staff WhatsApp Number:</span> <span className="text-gray-600">{viewingStaff.staffWhatsAppNumber || 'N/A'}</span></p>
                                            <p className="col-span-2 leading-6"><span className="font-semibold text-gray-900">Staff Permanent Address:</span> <span className="text-gray-600">{viewingStaff.staffPermanentAddress || 'N/A'}</span></p>
                                            <p className="leading-6"><span className="font-semibold text-gray-900">District:</span> <span className="text-gray-600">{viewingStaff.district || 'N/A'}</span></p>
                                            <p className="leading-6"><span className="font-semibold text-gray-900">State:</span> <span className="text-gray-600">{viewingStaff.state || 'N/A'}</span></p>
                                        </div>
                                    </div>

                                    {/* Professional Details */}
                                    <div>
                                        <h2 className="text-[#f7931e] font-semibold mb-4 text-lg italic">
                                            Professional Details
                                        </h2>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 text-xs sm:text-sm print:grid-cols-2 print-full-width">
                                            <p className="leading-6"><span className="font-semibold text-gray-900">ID:</span> <span className="text-gray-600">{viewingStaff._id?.slice(-4) || 'N/A'}</span></p>
                                            <p className="leading-6"><span className="font-semibold text-gray-900">Department:</span> <span className="text-gray-600">{viewingStaff.department || 'N/A'}</span></p>
                                            <p className="leading-6"><span className="font-semibold text-gray-900">Branch:</span> <span className="text-gray-600">{viewingStaff.branch?.branchName || 'N/A'}</span></p>
                                            <p className="leading-6"><span className="font-semibold text-gray-900">Role:</span> <span className="text-gray-600">{viewingStaff.role?.role || 'N/A'}</span></p>
                                            <p className="leading-6"><span className="font-semibold text-gray-900">Years of Experience:</span> <span className="text-gray-600">{viewingStaff.yearsOfExperience || 'N/A'}</span></p>
                                            <p className="leading-6"><span className="font-semibold text-gray-900">Date of Joining:</span> <span className="text-gray-600">{viewingStaff.dateOfJoining ? new Date(viewingStaff.dateOfJoining).toLocaleDateString('en-GB').replace(/\//g, ' / ') : 'N/A'}</span></p>
                                            {viewingStaff.resignationDate && (
                                                <p className="leading-6"><span className="font-semibold text-gray-900">Resignation Date (Only if Inactive):</span> <span className="text-gray-600">{new Date(viewingStaff.resignationDate).toLocaleDateString('en-GB').replace(/\//g, ' / ')}</span></p>
                                            )}
                                            <p className="leading-6">
                                                <span className="font-semibold text-gray-900">Employment Status:</span>{" "}
                                                <span className="text-blue-600 font-medium">{viewingStaff.employmentStatus || 'N/A'}</span>
                                            </p>
                                            {viewingStaff.remarks && (
                                                <p className="col-span-2 leading-6">
                                                    <span className="font-semibold text-gray-900">Remarks/Notes (Optional):</span>{" "}
                                                    <span className="text-gray-600">{viewingStaff.remarks}</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column - Profile Image */}
                                <div className="flex flex-col items-center print-hide">
                                    <div className="w-32 h-32 sm:w-48 sm:h-48 rounded-full overflow-hidden mb-4">
                                        {viewingStaff.photo ? (
                                            <img
                                                src={viewingStaff.photo}
                                                alt={viewingStaff.fullName}
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
                                                <span className="text-gray-500 text-3xl sm:text-4xl font-medium">
                                                    {viewingStaff.fullName?.charAt(0)?.toUpperCase() || 'S'}
                                                </span>
                                            </div>
                                        )}
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
                                        handleEditStaff(viewingStaff);
                                    }}
                                    className="w-full sm:w-auto bg-gray-100 border border-gray-300 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Edit
                                </button>
                                {viewingStaff.isMentor && (
                                    <button
                                        onClick={() => {
                                            closeViewModal();
                                            navigate('/mentor-batches', { state: { searchMentor: viewingStaff.fullName } });
                                        }}
                                        className="w-full sm:w-auto bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        View Batches
                                    </button>
                                )}
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

        </div>
    )
}

// export default StaffManagement