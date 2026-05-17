import React, { useState, useEffect } from 'react'
import { Navbar } from '../../../components/admin/AdminNavBar';
import Tabs from '../../../components/button/Tabs';
import AdminService from '../../../services/admin-api-service/AdminService';

// A single component for all SVG icons to improve code reusability and readability
const Icon = ({ path, className, viewBox = "0 0 24 24" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox={viewBox} xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={path}></path>
    </svg>
  );

export const Branch = () => {
    const [activeTab, setActiveTab] = useState('branches');
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState({
        branchName: '',
        location: ''
    });
    
    // View modal state
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewingBranch, setViewingBranch] = useState(null);
    
    // Edit mode state
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingBranch, setEditingBranch] = useState(null);
    
    const { getBranchesData, postBranchesData, putBranchesData } = AdminService();
    const headData = "Branch Management"

    const tabOptions = [
        { value: "branches", label: "Branches" },
        { value: "newBranch", label: "New Branch" }
    ];

    // Fetch all branches
    const fetchBranches = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await getBranchesData();
            // Handle different response structures
            const branchesData = response?.data || response || [];
            // Ensure branchesData is an array
            setBranches(Array.isArray(branchesData) ? branchesData : []);
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to load branches');
            setBranches([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    };

    // Create or update branch
    const handleSubmitBranch = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!formData.branchName.trim() || !formData.location.trim()) {
            setError('Branch name and location are required');
            return;
        }

        try {
            setLoading(true);
            if (isEditMode && editingBranch) {
                // Update existing branch
                await putBranchesData(editingBranch._id, formData);
                setSuccess('Branch updated successfully!');
            } else {
                // Create new branch
                await postBranchesData(formData);
                setSuccess('Branch created successfully!');
            }
            setFormData({ branchName: '', location: '' });
            setIsEditMode(false);
            setEditingBranch(null);
            await fetchBranches(); // Refresh the list
            setActiveTab('branches'); // Switch to branches tab
        } catch (err) {
            setError(err?.response?.data?.message || (isEditMode ? 'Failed to update branch' : 'Failed to create branch'));
        } finally {
            setLoading(false);
        }
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle cancel button
    const handleCancel = () => {
        setFormData({ branchName: '', location: '' });
        setError('');
        setSuccess('');
        setIsEditMode(false);
        setEditingBranch(null);
        setActiveTab('branches');
    };

    // Handle edit branch
    const handleEditBranch = (branch) => {
        setEditingBranch(branch);
        setIsEditMode(true);
        setFormData({
            branchName: branch.branchName || '',
            location: branch.location || ''
        });
        setError('');
        setSuccess('');
        setActiveTab('newBranch'); // Switch to form tab
        setShowViewModal(false); // Close view modal if open
    };

    // Handle view branch
    const handleViewBranch = (branch) => {
        setViewingBranch(branch);
        setShowViewModal(true);
    };

    // Close view modal
    const closeViewModal = () => {
        setShowViewModal(false);
        setViewingBranch(null);
    };

    // Load branches when component mounts
    useEffect(() => {
        fetchBranches();
    }, []);

    // Clear messages when switching tabs
    useEffect(() => {
        setError('');
        setSuccess('');
    }, [activeTab]);
          
  return (
    <>
       <Navbar headData={headData} activeTab={activeTab} />

       <div className="mb-6">
            <Tabs tabs={tabOptions} activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>

    <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl shadow-lg">
    {activeTab === 'branches' ? (
      <div>
        {/* Error and Success Messages */}
        {error && (
          <div className="p-2 sm:p-3 mb-3 sm:mb-4 text-xs sm:text-sm text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="p-2 sm:p-3 mb-3 sm:mb-4 text-xs sm:text-sm text-green-700 bg-green-100 rounded-lg">
            {success}
          </div>
        )}

        {/* Export Button */}
        <div className="flex justify-end mb-3 sm:mb-4">
          <button className="flex items-center space-x-2 py-2 px-3 sm:px-4 rounded-lg bg-white border border-gray-300 text-gray-700 text-xs sm:text-sm font-medium hover:bg-gray-50">
            <Icon path="M4 16v1a3 3 000 6h16a3 3 000-6v-1m-4-4l-4 4m0 0l-4-4m4 4V4" className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Export</span>
          </button>
        </div>

        {/* Branches Table */}
        {loading ? (
          <div className="flex items-center justify-center h-64 sm:h-96 py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-xs sm:text-sm text-gray-500">Loading branches...</p>
            </div>
          </div>
        ) : branches.length === 0 ? (
          <div className="flex items-center justify-center h-64 sm:h-96 border border-gray-200 rounded-lg bg-gray-50 p-4">
            <p className="text-xs sm:text-sm text-gray-500 text-center">No branch data available. Please add a new branch to view them here.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto rounded-lg">
              <table className="min-w-full bg-white rounded-lg shadow-md">
                <thead>
                  <tr className="bg-gray-100 text-left text-gray-600 font-semibold uppercase text-xs sm:text-sm">
                    <th className="py-3 px-3 lg:px-4 rounded-tl-lg">#</th>
                    <th className="py-3 px-3 lg:px-4">Branch Name</th>
                    <th className="py-3 px-3 lg:px-4">Location</th>
                    <th className="py-3 px-3 lg:px-4">Status</th>
                    <th className="py-3 px-3 lg:px-4">Created</th>
                    <th className="py-3 px-3 lg:px-4 rounded-tr-lg">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(branches) && branches.map((branch, index) => (
                    <tr key={branch._id} className="border-b last:border-b-0 border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-3 lg:px-4 text-xs sm:text-sm">{index + 1}</td>
                      <td className="py-3 px-3 lg:px-4 font-medium text-xs sm:text-sm">{branch.branchName}</td>
                      <td className="py-3 px-3 lg:px-4 text-xs sm:text-sm">{branch.location}</td>
                      <td className="py-3 px-3 lg:px-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium ${
                          branch.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {branch.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-3 lg:px-4 text-xs sm:text-sm text-gray-600">
                        {new Date(branch.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 lg:px-4">
                        <div className="flex flex-wrap gap-1 sm:gap-2">
                          <button 
                            onClick={() => handleViewBranch(branch)}
                            className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium hover:underline px-1"
                            title="View branch details"
                          >
                            View
                          </button>
                          <button 
                            onClick={() => handleEditBranch(branch)}
                            className="text-orange-600 hover:text-orange-800 text-xs sm:text-sm font-medium hover:underline px-1"
                            title="Edit branch"
                          >
                            Edit
                          </button>
                          <button className="text-red-600 hover:text-red-800 text-xs sm:text-sm font-medium hover:underline px-1">
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
            <div className="md:hidden space-y-3">
              {Array.isArray(branches) && branches.map((branch, index) => (
                <div key={branch._id} className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center mb-2">
                        <span className="text-xs sm:text-sm font-medium text-gray-500 mr-2">#{index + 1}</span>
                        <h3 className="text-sm sm:text-base font-medium text-gray-900 truncate">{branch.branchName}</h3>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 mb-2">{branch.location}</p>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium ${
                          branch.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {branch.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(branch.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 pt-2 border-t border-gray-200">
                    <button 
                      onClick={() => handleViewBranch(branch)}
                      className="w-full text-xs sm:text-sm text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded font-medium transition-colors"
                    >
                      View
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => handleEditBranch(branch)}
                        className="text-xs sm:text-sm text-orange-600 hover:text-orange-800 bg-orange-50 hover:bg-orange-100 px-3 py-2 rounded font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <button className="text-xs sm:text-sm text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-2 rounded font-medium transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    ) : (
      <div>
        {/* Error and Success Messages */}
        {error && (
          <div className="p-2 sm:p-3 mb-3 sm:mb-4 text-xs sm:text-sm text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="p-2 sm:p-3 mb-3 sm:mb-4 text-xs sm:text-sm text-green-700 bg-green-100 rounded-lg">
            {success}
          </div>
        )}

        <div className="mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-medium text-gray-900">
            {isEditMode ? `Edit Branch - ${editingBranch?.branchName}` : 'Create New Branch'}
          </h3>
        </div>

        <form onSubmit={handleSubmitBranch}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Branch Name</label>
              <input 
                type="text" 
                name="branchName"
                value={formData.branchName}
                onChange={handleInputChange}
                placeholder="Enter branch name" 
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 sm:p-3 text-xs sm:text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500" 
                required
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Location</label>
              <input 
                type="text" 
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Enter branch location" 
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 sm:p-3 text-xs sm:text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500" 
                required
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
            <button 
              type="button"
              onClick={handleCancel}
              className="w-full sm:w-auto py-2 sm:py-3 px-4 sm:px-6 rounded-lg text-xs sm:text-sm text-red-500 border border-red-500 hover:bg-red-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto py-2 sm:py-3 px-4 sm:px-6 rounded-lg text-xs sm:text-sm text-white bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading 
                ? (isEditMode ? 'Updating...' : 'Creating...') 
                : (isEditMode ? 'Update Branch' : 'Create Branch')
              }
            </button>
          </div>
        </form>
      </div>
    )}
  </div>

  {/* View Branch Modal */}
  {showViewModal && viewingBranch && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
          <div className="flex justify-between items-start gap-3">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 flex-1 min-w-0">Branch Details</h1>
            <button 
              onClick={closeViewModal}
              className="flex items-center gap-1 text-xs sm:text-sm border border-gray-300 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
              <span className="hidden sm:inline">Close</span>
            </button>
          </div>
        </div>
        
        <div className="px-4 sm:px-6 py-4 sm:py-5">
          {/* Branch Icon/Header */}
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-orange-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 sm:w-12 sm:h-12 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
            </div>
          </div>

          {/* Branch Details */}
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-1">Branch Name</p>
                  <p className="text-sm sm:text-base text-gray-900 font-medium">{viewingBranch.branchName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-1">Location</p>
                  <p className="text-sm sm:text-base text-gray-900 font-medium">{viewingBranch.location || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-1">Status</p>
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                    viewingBranch.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {viewingBranch.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-1">Created Date</p>
                  <p className="text-sm sm:text-base text-gray-900">
                    {viewingBranch.createdAt 
                      ? new Date(viewingBranch.createdAt).toLocaleDateString('en-GB', { 
                          day: '2-digit', 
                          month: 'short', 
                          year: 'numeric' 
                        })
                      : 'N/A'}
                  </p>
                </div>
                {viewingBranch.updatedAt && (
                  <div className="sm:col-span-2">
                    <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-1">Last Updated</p>
                    <p className="text-sm sm:text-base text-gray-900">
                      {new Date(viewingBranch.updatedAt).toLocaleDateString('en-GB', { 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
            <button 
              onClick={closeViewModal}
              className="w-full sm:w-auto bg-gray-100 border border-gray-300 text-gray-700 px-4 py-2 text-xs sm:text-sm rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
            <button 
              onClick={() => {
                closeViewModal();
                handleEditBranch(viewingBranch);
              }}
              className="w-full sm:w-auto bg-orange-500 text-white px-4 py-2 text-xs sm:text-sm rounded-lg hover:bg-orange-600 transition-colors"
            >
              Edit Branch
            </button>
          </div>
        </div>
      </div>
    </div>
  )}
  </>
  )
}
