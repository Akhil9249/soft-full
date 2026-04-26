import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Navbar } from '../../../components/admin/AdminNavBar'
import AdminService from '../../../services/admin-api-service/AdminService'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export const MentorBatches = () => {
  const headData = "Mentor Batches";
  const activeTab = "Mentor Batches";

  const [mentorsWithBatches, setMentorsWithBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedMentors, setExpandedMentors] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [exporting, setExporting] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
    pageNumbers: [],
    displayInfo: { showing: '', total: 0, pageInfo: '' },
    limit: 5
  });

  const { getAllMentorsWithBatches, getBranchesData } = AdminService();

  const fetchMentorsWithBatches = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllMentorsWithBatches(page, pagination.limit);
      setMentorsWithBatches(response.data || []);
      if (response.pagination) setPagination(prev => ({ ...prev, ...response.pagination }));
    } catch (err) {
      console.error('Error fetching mentors with batches:', err);
      setError(err.response?.data?.message || 'Failed to fetch mentors with batches');
    } finally {
      setLoading(false);
    }
  }, [getAllMentorsWithBatches, pagination.limit]);

  useEffect(() => {
    fetchMentorsWithBatches(1);
  }, []); // Empty dependency array - only run once on mount

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchMentorsWithBatches(newPage);
    }
  };

  // Fetch branches for filter
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setBranchesLoading(true);
        const res = await getBranchesData();
        setBranches(Array.isArray(res?.data) ? res.data : []);
      } catch (err) {
        console.error('Error fetching branches:', err);
        setBranches([]);
      } finally {
        setBranchesLoading(false);
      }
    };
    fetchBranches();
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    fetchMentorsWithBatches();
  }, [fetchMentorsWithBatches]);

  const toggleMentorExpansion = (mentorId) => {
    setExpandedMentors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(mentorId)) {
        newSet.delete(mentorId);
      } else {
        newSet.add(mentorId);
      }
      return newSet;
    });
  };

  const getRoleBadgeColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'super admin':
        return 'bg-red-100 text-red-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      case 'mentor':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Compute filtered mentors based on search and branch
  const visibleMentors = mentorsWithBatches.filter((mentor) => {
    const matchesSearch = searchTerm
      ? (
          mentor.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          mentor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          mentor.batches?.some(b => b.batchName?.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      : true;

    if (!selectedBranchId) return matchesSearch;

    const selectedBranch = branches.find(b => b._id === selectedBranchId);
    const selectedBranchName = selectedBranch?.branchName;
    const matchesBranch = selectedBranchName
      ? mentor.batches?.some(b => b.branchName === selectedBranchName)
      : true;

    return matchesSearch && matchesBranch;
  });

  const handleExport = async () => {
    try {
      setExporting(true);
      // Fetch ALL mentors from backend (ignore current pagination)
      let allMentors = [];
      try {
        const res = await getAllMentorsWithBatches(1, 10000);
        allMentors = Array.isArray(res?.data) ? res.data : [];
      } catch (e) {
        // Fallback to current page data
        allMentors = mentorsWithBatches || [];
      }

      // Apply current client-side filters (search + branch) to the full set
      const filteredAllMentors = allMentors.filter((mentor) => {
        const matchesSearch = searchTerm
          ? (
              mentor.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              mentor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              mentor.batches?.some(b => b.batchName?.toLowerCase().includes(searchTerm.toLowerCase()))
            )
          : true;

        if (!selectedBranchId) return matchesSearch;

        const selectedBranch = branches.find(b => b._id === selectedBranchId);
        const selectedBranchName = selectedBranch?.branchName;
        const matchesBranch = selectedBranchName
          ? mentor.batches?.some(b => b.branchName === selectedBranchName)
          : true;

        return matchesSearch && matchesBranch;
      });

      const mentors = filteredAllMentors;
      if (!Array.isArray(mentors) || mentors.length === 0) {
        return; // nothing to export
      }

      const doc = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();

      // Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(247, 147, 30);
      const title = 'Mentor Batches Report';
      doc.text(title, (pageWidth - doc.getTextWidth(title)) / 2, 15);

      // Meta
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const exportedOn = `Exported on: ${new Date().toLocaleDateString('en-GB')}`;
      const totalText = `Total Mentors: ${mentors.length}`;
      doc.text(exportedOn, (pageWidth - doc.getTextWidth(exportedOn)) / 2, 22);
      doc.text(totalText, (pageWidth - doc.getTextWidth(totalText)) / 2, 27);

      const tableData = mentors.map(m => [
        m.fullName || 'N/A',
        m.email || 'N/A',
        m.role || 'N/A',
        (m.batches?.length || 0).toString(),
        (m.batches?.map(b => b.batchName).join(', ') || 'N/A'),
        (m.scheduleDetails?.length || 0).toString()
      ]);

      autoTable(doc, {
        startY: 35,
        head: [['Mentor', 'Email', 'Role', 'Batches', 'Batch Names', 'Schedule Slots']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [247, 147, 30], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 'auto', halign: 'left', fontSize: 8 },
          1: { cellWidth: 'auto', halign: 'left', fontSize: 8 },
          2: { cellWidth: 'auto', halign: 'left', fontSize: 8 },
          3: { cellWidth: 'auto', halign: 'center', fontSize: 8 },
          4: { cellWidth: 'auto', halign: 'left', fontSize: 8 },
          5: { cellWidth: 'auto', halign: 'center', fontSize: 8 }
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
        doc.text(text, (pageWidth - doc.getTextWidth(text)) / 2, doc.internal.pageSize.getHeight() - 8);
      }

      doc.save(`mentor_batches_export_${new Date().toISOString().split('T')[0]}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen max-w-[1250px]">
        <Navbar headData={headData} activeTab={activeTab} />
        <div className="p-4 sm:p-6">
          <div className="bg-white rounded-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-orange-500"></div>
              <span className="text-sm sm:text-lg text-gray-600 text-center">Loading mentors with batches...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <Navbar headData={headData} activeTab={activeTab} />
        <div className="p-4 sm:p-6">
          <div className="bg-white rounded-md shadow-lg p-4 sm:p-6 lg:p-8">
            <div className="text-center text-red-600">
              <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
              <h3 className="text-base sm:text-lg font-semibold mb-2">Error Loading Data</h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-4">{error}</p>
              <button
                onClick={handleRetry}
                className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar headData={headData} activeTab={activeTab} />
      
      <div className="w-full min-h-screen max-w-[1250px]">
        <div className="bg-white rounded-lg overflow-x-auto p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Mentor Batches</h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                View all mentors and their assigned batches
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <input
                  type="text"
                  placeholder="Search mentors or batches..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 sm:pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <svg className="w-3 h-3 sm:w-4 sm:h-4 absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 100 8 4 4 000-8zM2 8a6 6 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 012 8z" clipRule="evenodd"></path>
                </svg>
              </div>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="w-full sm:w-auto py-2 px-3 border border-gray-300 rounded-lg text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">{branchesLoading ? 'Loading branches...' : 'All Branches'}</option>
                {branches.map(branch => (
                  <option key={branch._id} value={branch._id}>{branch.branchName}</option>
                ))}
              </select>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center justify-center px-3 sm:px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 text-xs sm:text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                {exporting ? 'Exporting...' : 'Export'}
              </button>
              <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
                Total: {visibleMentors.length} mentors
              </div>
            </div>
          </div>

          {visibleMentors.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
              </svg>
              <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-2">No Mentors Found</h3>
              <p className="text-xs sm:text-sm text-gray-500 px-4">
                No mentors with assigned batches found. Please check if weekly schedules are configured.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mentor
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned Batches
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Schedule Details
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {visibleMentors.map((mentor) => (
                    <React.Fragment key={mentor._id}>
                      {/* Main Mentor Row */}
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-full flex items-center justify-center mr-2 sm:mr-4">
                              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                              </svg>
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm font-medium text-gray-900">{mentor.fullName}</div>
                              <div className="text-xs sm:text-sm text-gray-500">{mentor.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(mentor.role)}`}>
                            {mentor.role}
                          </span>
                        </td>
                        <td className="px-4 lg:px-6 py-4">
                          <div className="text-xs sm:text-sm text-gray-900">
                            {mentor.batches.length} batch{mentor.batches.length !== 1 ? 'es' : ''}
                          </div>
                          {mentor.batches.length > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              {mentor.batches.slice(0, 2).map(batch => batch.batchName).join(', ')}
                              {mentor.batches.length > 2 && ` +${mentor.batches.length - 2} more`}
                            </div>
                          )}
                        </td>
                        <td className="px-4 lg:px-6 py-4">
                          <div className="text-xs sm:text-sm text-gray-900">
                            {mentor.scheduleDetails.length} time slot{mentor.scheduleDetails.length !== 1 ? 's' : ''}
                          </div>
                          {mentor.scheduleDetails.length > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              {mentor.scheduleDetails.slice(0, 1).map(slot => slot.timeSlot).join(', ')}
                              {mentor.scheduleDetails.length > 1 && ` +${mentor.scheduleDetails.length - 1} more`}
                            </div>
                          )}
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                          <button
                            onClick={() => toggleMentorExpansion(mentor._id)}
                            className="text-orange-600 hover:text-orange-900 transition-colors"
                          >
                            {expandedMentors.has(mentor._id) ? 'Hide Details' : 'View Details'}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Details Row */}
                      {expandedMentors.has(mentor._id) && (
                        <tr>
                          <td colSpan="5" className="px-4 sm:px-6 py-4 bg-gray-50">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                              {/* Assigned Batches */}
                              <div>
                                <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                                  <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                                  </svg>
                                  Assigned Batches ({mentor.batches.length})
                                </h4>
                                {mentor.batches.length === 0 ? (
                                  <p className="text-gray-500 text-sm">No batches assigned</p>
                                ) : (
                                  <div className="space-y-2">
                                    {mentor.batches.map((batch) => (
                                      <div key={batch._id} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <h5 className="font-medium text-gray-800">{batch.batchName}</h5>
                                            <div className="flex items-center space-x-2 mt-1">
                                              <span className="text-xs text-gray-600">{batch.courseName}</span>
                                              <span className="text-xs text-gray-400">•</span>
                                              <span className="text-xs text-gray-600">{batch.branchName}</span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Schedule Details */}
                              <div>
                                <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                                  <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                  </svg>
                                  Schedule Details
                                </h4>
                                {mentor.scheduleDetails.length === 0 ? (
                                  <p className="text-gray-500 text-sm">No schedule details available</p>
                                ) : (
                                  <div className="space-y-3">
                                    {mentor.scheduleDetails.map((timeSlot, index) => (
                                      <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-3">
                                        <div className="font-medium text-gray-800 mb-2">{timeSlot.timeSlot}</div>
                                        <div className="space-y-2">
                                          {timeSlot.subDetails.map((subDetail, subIndex) => (
                                            <div key={subIndex} className="text-sm">
                                              <div className="flex items-center space-x-2">
                                                <span className="font-medium text-gray-700">{subDetail.days}</span>
                                                <span className="text-gray-400">•</span>
                                                <span className="text-gray-600">
                                                  {/* {subDetail.batches.length > 0 
                                                    ? (subDetail.subject || 'Subject not specified')
                                                    : 'No class assigned'
                                                  } */}
                                                  {subDetail.batches.length > 0 
                                                    ? 'Assigned Batches'
                                                    : 'No batches assigned'
                                                  }
                                                </span>
                                              </div>
                                              {subDetail.batches.length > 0 && (
                                                <div className="mt-1 text-xs text-gray-500">
                                                  Batches: {subDetail.batches.map(b => b.batchName).join(', ')}
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-2 sm:px-4 py-3 bg-white border-t border-gray-200">
                  <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
                    <span>
                      {pagination.displayInfo?.showing} of {pagination.displayInfo?.total} mentors
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={!pagination.hasPrevPage || loading}
                      className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md border transition-colors duration-200 flex items-center ${
                        pagination.hasPrevPage && !loading
                          ? 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                          : 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed'
                      }`}
                    >
                      Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {pagination.pageNumbers?.map((num) => (
                        <button
                          key={num}
                          onClick={() => handlePageChange(num)}
                          className={`px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                            pagination.currentPage === num
                              ? 'bg-orange-500 text-white'
                              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={!pagination.hasNextPage || loading}
                      className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md border transition-colors duration-200 flex items-center ${
                        pagination.hasNextPage && !loading
                          ? 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                          : 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {visibleMentors.map((mentor) => (
                <div key={mentor._id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center flex-1">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{mentor.fullName}</div>
                        <div className="text-xs text-gray-500 truncate">{mentor.email}</div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(mentor.role)} flex-shrink-0`}>
                      {mentor.role}
                    </span>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Assigned Batches:</span>
                      <span className="font-medium text-gray-900">{mentor.batches.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Schedule Slots:</span>
                      <span className="font-medium text-gray-900">{mentor.scheduleDetails.length}</span>
                    </div>
                  </div>

                  {expandedMentors.has(mentor._id) && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                      <div>
                        <h4 className="text-xs font-semibold text-gray-800 mb-2 flex items-center">
                          <svg className="w-3 h-3 mr-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                          </svg>
                          Assigned Batches ({mentor.batches.length})
                        </h4>
                        {mentor.batches.length === 0 ? (
                          <p className="text-xs text-gray-500">No batches assigned</p>
                        ) : (
                          <div className="space-y-2">
                            {mentor.batches.map((batch) => (
                              <div key={batch._id} className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                                <h5 className="text-xs font-medium text-gray-800">{batch.batchName}</h5>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-gray-600">{batch.courseName}</span>
                                  <span className="text-xs text-gray-400">•</span>
                                  <span className="text-xs text-gray-600">{batch.branchName}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold text-gray-800 mb-2 flex items-center">
                          <svg className="w-3 h-3 mr-1 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>
                          Schedule Details
                        </h4>
                        {mentor.scheduleDetails.length === 0 ? (
                          <p className="text-xs text-gray-500">No schedule details available</p>
                        ) : (
                          <div className="space-y-2">
                            {mentor.scheduleDetails.map((timeSlot, index) => (
                              <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-2">
                                <div className="text-xs font-medium text-gray-800 mb-1">{timeSlot.timeSlot}</div>
                                <div className="space-y-1">
                                  {timeSlot.subDetails.map((subDetail, subIndex) => (
                                    <div key={subIndex} className="text-xs">
                                      <div className="flex items-center gap-1">
                                        <span className="font-medium text-gray-700">{subDetail.days}</span>
                                        <span className="text-gray-400">•</span>
                                        <span className="text-gray-600">
                                          {subDetail.batches.length > 0 ? 'Assigned Batches' : 'No batches assigned'}
                                        </span>
                                      </div>
                                      {subDetail.batches.length > 0 && (
                                        <div className="mt-1 text-xs text-gray-500">
                                          Batches: {subDetail.batches.map(b => b.batchName).join(', ')}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => toggleMentorExpansion(mentor._id)}
                    className="w-full mt-3 text-xs font-medium text-orange-600 hover:text-orange-900 transition-colors py-2 border border-orange-200 rounded-lg hover:bg-orange-50"
                  >
                    {expandedMentors.has(mentor._id) ? 'Hide Details' : 'View Details'}
                  </button>
                </div>
              ))}

              {/* Pagination Controls for Mobile */}
              {pagination.totalPages > 1 && (
                <div className="flex flex-col items-center gap-4 mt-6 px-2 py-3 bg-white border-t border-gray-200">
                  <div className="text-xs text-gray-700 text-center">
                    <span>
                      {pagination.displayInfo?.showing} of {pagination.displayInfo?.total} mentors
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={!pagination.hasPrevPage || loading}
                      className={`px-3 py-2 text-xs font-medium rounded-md border transition-colors ${
                        pagination.hasPrevPage && !loading
                          ? 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                          : 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed'
                      }`}
                    >
                      Prev
                    </button>
                    <div className="flex items-center gap-1">
                      {pagination.pageNumbers?.map((num) => (
                        <button
                          key={num}
                          onClick={() => handlePageChange(num)}
                          className={`px-2 py-2 text-xs font-medium rounded-md transition-colors ${
                            pagination.currentPage === num
                              ? 'bg-orange-500 text-white'
                              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={!pagination.hasNextPage || loading}
                      className={`px-3 py-2 text-xs font-medium rounded-md border transition-colors ${
                        pagination.hasNextPage && !loading
                          ? 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                          : 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
          )}
        </div>
      </div>
    </div>
  )
}
