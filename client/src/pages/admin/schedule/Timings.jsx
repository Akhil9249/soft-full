import React, { useState, useEffect } from 'react'

import { X, Edit2 } from 'lucide-react';
import { Navbar } from '../../../components/admin/AdminNavBar';
import Tabs from '../../../components/button/Tabs';   
import AdminService from '../../../services/admin-api-service/AdminService';

export const Timings = () => {

  const [activeTab, setActiveTab] = useState('timings');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [branches, setBranches] = useState([]);
  const [timings, setTimings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [deletingTiming, setDeletingTiming] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingTiming, setEditingTiming] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ start: '', end: '', branch: '' });
  
  const { getBranchesData, getTimingsData, postTimingsData, deleteTimingsData, putTimingsData } = AdminService();
  const headData = "Settings"

  const tabOptions = [
    { value: "timings", label: "Timings" },
    { value: "new-timing", label: "New Timing" }
  ];

  const fetchBranches = async () => {
    try {
      console.log("fetchBranches");
      
      setLoading(true);
      setError('');
      // const res = await axiosPrivate.get('http://localhost:3000/api/branches');
      const res = await getBranchesData();
      console.log("branches==",res.data);
      
      setBranches(res.data || []);
    } catch (err) {
      console.error('Failed to load branches:', err);
      setError('Failed to load branches');
      // Set default branches if API fails
      setBranches([
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimings = async () => {
    try {
      setLoading(true);
      setError('');
      // const res = await axiosPrivate.get('http://localhost:3000/api/timings');
      const res = await getTimingsData();
      console.log("timings==", res.data);
      setTimings(res.data || []);
    } catch (err) {
      console.error('Failed to load timings:', err);
      setError('Failed to load timings');
      setTimings([]);
    } finally {
      setLoading(false);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    fetchBranches();
    fetchTimings();
  }, []);

  // Filter timings based on selected branch
  const filteredTimings = selectedBranch 
    ? timings.filter(timing => {
        if (typeof timing.branch === 'object' && timing.branch) {
          return timing.branch._id === selectedBranch;
        }
        return timing.branch === selectedBranch;
      })
    : timings;

  // Handle delete timing
  const handleDeleteTiming = (timing) => {
    setDeletingTiming(timing);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingTiming) return;

    try {
      setLoading(true);
      // await axiosPrivate.delete(`http://localhost:3000/api/timings/${deletingTiming._id}`);
      await deleteTimingsData(deletingTiming._id);
      setSuccess('Timing deleted successfully.');
      await fetchTimings();
      setShowDeleteModal(false);
      setDeletingTiming(null);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete timing');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setDeletingTiming(null);
  };

  const convertTo24Hour = (time12h) => {
    if (!time12h) return '';
    const parts = time12h.trim().split(' ');
    if (parts.length !== 2) return '';
    const [time, modifier] = parts;
    let [hours, minutes] = time.split(':');
    if (hours === '12') hours = '00';
    if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  };

  const formatTime = (timeStr) => {
    let [hours, minutes] = timeStr.split(':');
    let ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  };

  const handleEditClick = (timing) => {
    const [start, end] = timing.timeSlot.split(' - ');
    setEditForm({
      start: convertTo24Hour(start),
      end: convertTo24Hour(end),
      branch: typeof timing.branch === 'object' ? timing.branch?._id : timing.branch
    });
    setEditingTiming(timing);
    setShowEditModal(true);
  };

  const handleUpdateTiming = async () => {
    if (!editForm.start || !editForm.end || !editForm.branch) {
      setError('Please provide start time, end time, and select a branch');
      return;
    }
    const updatedTimeSlot = `${formatTime(editForm.start)} - ${formatTime(editForm.end)}`;
    try {
      setLoading(true);
      await putTimingsData(editingTiming._id, {
        timeSlot: updatedTimeSlot,
        branch: editForm.branch
      });
      setSuccess('Timing updated successfully!');
      setShowEditModal(false);
      setEditingTiming(null);
      await fetchTimings();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update timing');
    } finally {
      setLoading(false);
    }
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingTiming(null);
    setEditForm({ start: '', end: '', branch: '' });
  };


  const AddedTimings = () => {
    return (
      <div className="mt-4 sm:mt-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">Added Timings</h3>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:space-x-4 w-full sm:w-auto">
            <label className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">Filter by Branch:</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">All Branches</option>
              {branches.map(branch => (
                <option key={branch._id} value={branch._id}>
                  {branch.branchName}
                </option>
              ))}
            </select>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center p-6 sm:p-8">
            <p className="text-sm sm:text-base text-gray-500">Loading timings...</p>
          </div>
        ) : filteredTimings.length === 0 ? (
          <div className="flex items-center justify-center p-6 sm:p-8">
            <p className="text-xs sm:text-sm text-gray-500 text-center">
              {selectedBranch 
                ? 'No timings found for the selected branch.' 
                : 'No timings available. Please add timings to view them here.'
              }
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3 sm:gap-4">
            {filteredTimings.map((timing, index) => (
              <div
                key={timing._id || index}
                className="bg-gray-200 text-gray-700 px-3 sm:px-4 py-2 rounded-full flex items-center gap-2 sm:space-x-2 text-xs sm:text-sm"
              >
                <span className="font-medium">{timing.timeSlot}</span>
                {/* <span className="text-xs sm:text-sm text-gray-500 border-r border-gray-300 pr-2 mr-1">
                  {typeof timing.branch === 'object' && timing.branch 
                    ? timing.branch.branchName 
                    : 'Unknown Branch'
                  }
                </span> */}
                <Edit2
                  className="w-4 h-4 text-gray-500 cursor-pointer hover:text-blue-500 flex-shrink-0"
                  onClick={() => handleEditClick(timing)}
                />
                <X 
                  className="w-4 h-4 text-gray-500 cursor-pointer hover:text-red-500 flex-shrink-0" 
                  onClick={() => handleDeleteTiming(timing)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  
  const handleCreateTiming = async () => {
    setError('');
    setSuccess('');

    // Get form data
    const startTimeInput = document.getElementById('start-time');
    const endTimeInput = document.getElementById('end-time');
    const branchNameSelect = document.getElementById('branch-name');
    
    const startTime = startTimeInput?.value;
    const endTime = endTimeInput?.value;
    const branchId = branchNameSelect?.value;

    if (!startTime || !endTime || !branchId) {
      setError('Please provide start time, end time, and select a branch');
      return;
    }

    const timeSlot = `${formatTime(startTime)} - ${formatTime(endTime)}`;

    try {
      setLoading(true);
      const response = await postTimingsData({
        branch: branchId,
        timeSlot: timeSlot
      });
      setSuccess('Timing created successfully!');
      // Reset form
      if (startTimeInput) startTimeInput.value = '';
      if (endTimeInput) endTimeInput.value = '';
      if (branchNameSelect) branchNameSelect.value = '';
      // Refresh timings list
      await fetchTimings();
      setActiveTab('timings'); // Switch to timings tab
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create timing');
    } finally {
      setLoading(false);
    }
  };

    // Function to handle form cancellation
    const handleCancel = () => {
      setError('');
      setSuccess('');
      setActiveTab('timings');
    };

    // Component for the "Timings" list view
    const TimingsView = () => (
      <div className="p-4 sm:p-6 lg:p-8 bg-white rounded-xl sm:rounded-2xl lg:rounded-3xl h-full shadow-lg">
        {/* Error and Success Messages */}
        {error && (
          <div className="p-3 mb-4 text-xs sm:text-sm text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 mb-4 text-xs sm:text-sm text-green-700 bg-green-100 rounded-lg">
            {success}
          </div>
        )}
        <AddedTimings />
      </div>
    );

      // Component for the "New Timing" form view
  const NewTimingForm = () => (
    <div className="p-4 sm:p-6 lg:p-8 bg-white rounded-xl sm:rounded-2xl lg:rounded-3xl h-full shadow-lg">
      {/* Error and Success Messages */}
      {error && (
        <div className="p-3 mb-4 text-xs sm:text-sm text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 mb-4 text-xs sm:text-sm text-green-700 bg-green-100 rounded-lg">
          {success}
        </div>
      )}
      <div className="space-y-4 sm:space-y-6">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900">Timings Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="flex flex-col">
            <label htmlFor="start-time" className="text-xs sm:text-sm text-gray-600 mb-2">
              Start Time
            </label>
            <input
              type="time"
              id="start-time"
              className="p-2 sm:p-3 bg-gray-100 text-gray-800 rounded-lg sm:rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F9A825] appearance-none text-sm sm:text-base"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="end-time" className="text-xs sm:text-sm text-gray-600 mb-2">
              End Time
            </label>
            <input
              type="time"
              id="end-time"
              className="p-2 sm:p-3 bg-gray-100 text-gray-800 rounded-lg sm:rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F9A825] appearance-none text-sm sm:text-base"
            />
          </div>
           <div className="flex flex-col">
             <label htmlFor="branch-name" className="text-xs sm:text-sm text-gray-600 mb-2">
               Branch Name
             </label>
               <select
                 id="branch-name"
                 className="p-2 sm:p-3 bg-gray-100 text-gray-800 rounded-lg sm:rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F9A825] appearance-none text-sm sm:text-base"
               >
                 <option value="">Choose Branch</option>
                 {loading ? (
                   <option disabled>Loading branches...</option>
                 ) : branches.length === 0 ? (
                   <option disabled>No branches available</option>
                 ) : (
                   branches.map((branch) => (
                     <option key={branch._id} value={branch._id}>
                       {branch.branchName}
                     </option>
                   ))
                 )}
               </select>
           </div>
        </div>
      </div>

      <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
        <button
          onClick={handleCancel}
          className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base text-gray-700 font-medium rounded-lg sm:rounded-xl border border-gray-300 hover:bg-gray-200 transition-colors duration-200"
        >
          Cancel
        </button>
         <button
           onClick={handleCreateTiming}
           disabled={loading}
           className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base text-white font-medium bg-[#F9A825] rounded-lg sm:rounded-xl hover:bg-[#e8931f] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
         >
           {loading ? 'Creating...' : 'Create Timing'}
         </button>
      </div>
    </div>
  );

  return (
    <>
    <Navbar headData={headData} activeTab={activeTab} />
      <div className="mb-4 sm:mb-6">
        <Tabs tabs={tabOptions} activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
      <div className="flex-1">
              {activeTab === 'timings' && <TimingsView />}
              {activeTab === 'new-timing' && <NewTimingForm />}
            </div>

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
                <h3 className="text-base sm:text-lg font-medium text-gray-900">Delete Timing</h3>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-xs sm:text-sm text-gray-500">
                Are you sure you want to delete the timing <strong>"{deletingTiming?.timeSlot}"</strong>?
                This action cannot be undone.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={handleCancelDelete}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={loading}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Timing Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Edit Timing</h3>
            
            <div className="space-y-4">
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">Start Time</label>
                <input
                  type="time"
                  value={editForm.start}
                  onChange={(e) => setEditForm(prev => ({ ...prev, start: e.target.value }))}
                  className="p-2 bg-gray-100 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">End Time</label>
                <input
                  type="time"
                  value={editForm.end}
                  onChange={(e) => setEditForm(prev => ({ ...prev, end: e.target.value }))}
                  className="p-2 bg-gray-100 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">Branch Name</label>
                <select
                  value={editForm.branch}
                  onChange={(e) => setEditForm(prev => ({ ...prev, branch: e.target.value }))}
                  className="p-2 bg-gray-100 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:outline-none"
                >
                  <option value="">Choose Branch</option>
                  {branches.map((branch) => (
                    <option key={branch._id} value={branch._id}>
                      {branch.branchName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={closeEditModal}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateTiming}
                disabled={loading}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-orange-500 border border-transparent rounded-md hover:bg-orange-600 focus:outline-none disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
      </>
  )
}
