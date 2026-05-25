import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Navbar } from '../../../components/admin/AdminNavBar'
import AdminService from '../../../services/admin-api-service/AdminService'
import useAuth from '../../../hooks/useAuth'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const getDefaultDates = () => {
  const today = new Date();
  const day = today.getDay();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - day);

  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);

  const getLocalYYYYMMDD = (date) => {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  };

  return { startDate: getLocalYYYYMMDD(sunday), endDate: getLocalYYYYMMDD(saturday) };
};

const DAYS_ORDER = {
  'monday': 1,
  'tuesday': 2,
  'wednesday': 3,
  'thursday': 4,
  'friday': 5,
  'saturday': 6,
  'sunday': 7
};

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 9999;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return 9999;
  
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3]?.toUpperCase();
  
  if (ampm) {
    if (ampm === 'PM' && hours !== 12) {
      hours += 12;
    } else if (ampm === 'AM' && hours === 12) {
      hours = 0;
    }
  }
  return hours * 60 + minutes;
};

const parseTimeSlotToMinutes = (timeSlotStr) => {
  if (!timeSlotStr) return 9999;
  const parts = timeSlotStr.split(/[-–to]/);
  const startTimeStr = parts[0]?.trim();
  return parseTimeToMinutes(startTimeStr);
};

export const MentorBatches = () => {
  const headData = "Mentor Batches";
  const activeTab = "Mentor Batches";
  const location = useLocation();
  const searchMentor = location.state?.searchMentor;

  const { auth } = useAuth();
  const userRole = auth?.role || localStorage.getItem('role') || '';
  const userId = auth?.id || localStorage.getItem('userId') || '';
  const userName = auth?.name || localStorage.getItem('name') || '';

  const defaultDates = getDefaultDates();
  const [startDate, setStartDate] = useState(defaultDates.startDate);
  const [endDate, setEndDate] = useState(defaultDates.endDate);

  const [allMentors, setAllMentors] = useState([]);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredBatchInfo, setHoveredBatchInfo] = useState(null);
  const [exporting, setExporting] = useState(false);

  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');

  const { getAllMentorsWithBatches, getBranchesData } = AdminService();
  const navigate = useNavigate();
  const hoverTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await getBranchesData();
        const branchesData = response?.data || response || [];
        setBranches(Array.isArray(branchesData) ? branchesData : []);
      } catch (err) {
        console.error('Error fetching branches:', err);
      }
    };
    fetchBranches();
  }, []);

  const selectedMentorRef = useRef(selectedMentor);
  useEffect(() => {
    selectedMentorRef.current = selectedMentor;
  }, [selectedMentor]);

  const handleDateChange = (e) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);

    if (newStartDate) {
      const date = new Date(newStartDate);
      date.setDate(date.getDate() + 6);

      // Format to YYYY-MM-DD for input compatibility
      const endDateString = date.toISOString().split('T')[0];
      setEndDate(endDateString);
    } else {
      setEndDate('');
    }
  };

  const fetchAllMentors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all mentors in one call (using high limit), filtering by branch
      const response = await getAllMentorsWithBatches(1, 10000, startDate, endDate, selectedBranch);
      let mentorList = response.data || [];
      
      if (userRole?.toLowerCase() === 'mentor') {
        mentorList = mentorList.filter(
          m => m._id === userId || m.fullName?.toLowerCase() === userName?.toLowerCase()
        );
      }
      setAllMentors(mentorList);

      let initialMentor = null;

      // Try to preserve the selected mentor if possible
      const currentSelected = selectedMentorRef.current;
      if (currentSelected) {
        initialMentor = mentorList.find(m => m._id === currentSelected._id);
      }

      if (!initialMentor && searchMentor) {
        initialMentor = mentorList.find(
          m => m.fullName?.toLowerCase() === searchMentor.toLowerCase()
        );
      }

      // Default to first mentor if not specified or not found
      if (!initialMentor && mentorList.length > 0) {
        initialMentor = mentorList[0];
      }

      setSelectedMentor(initialMentor);
    } catch (err) {
      console.error('Error fetching mentors:', err);
      setError(err.response?.data?.message || 'Failed to fetch mentors schedule');
    } finally {
      setLoading(false);
    }
  }, [searchMentor, startDate, endDate, selectedBranch, userRole, userId, userName]);

  useEffect(() => {
    fetchAllMentors();
  }, [fetchAllMentors]);

  const getGroupedAndSortedSchedule = useCallback(() => {
    const rawSchedules = selectedMentor?.scheduleDetails || [];
    if (rawSchedules.length === 0) return [];

    // Group by timeSlot
    const groups = {};
    rawSchedules.forEach(slot => {
      const timeSlotKey = (slot.timeSlot || 'N/A').trim();
      if (!groups[timeSlotKey]) {
        groups[timeSlotKey] = {
          timeSlot: timeSlotKey,
          subDetailsMap: {}
        };
      }

      (slot.subDetails || []).forEach(sub => {
        const dayName = (sub.day?.name || 'N/A').trim();
        const dayKey = dayName.toLowerCase();
        
        if (!groups[timeSlotKey].subDetailsMap[dayKey]) {
          groups[timeSlotKey].subDetailsMap[dayKey] = {
            day: { name: dayName },
            batches: [],
            branch: sub.branch,
            subject: sub.subject
          };
        }

        if (sub.batches && Array.isArray(sub.batches)) {
          groups[timeSlotKey].subDetailsMap[dayKey].batches.push(...sub.batches);
        }
      });
    });

    // Format groups into array, sort days, and sort timeSlots
    return Object.values(groups).map(group => {
      const subDetails = Object.values(group.subDetailsMap).map(sub => {
        // Deduplicate batches by _id or batchName
        const uniqueBatches = [];
        const seenIds = new Set();
        sub.batches.forEach(b => {
          const id = b?._id || b?.batchName;
          if (id && !seenIds.has(id)) {
            seenIds.add(id);
            uniqueBatches.push(b);
          }
        });
        return {
          ...sub,
          batches: uniqueBatches
        };
      }).sort((a, b) => {
        const orderA = DAYS_ORDER[a.day?.name?.toLowerCase()] || 8;
        const orderB = DAYS_ORDER[b.day?.name?.toLowerCase()] || 8;
        return orderA - orderB;
      });

      return {
        timeSlot: group.timeSlot,
        subDetails
      };
    }).sort((a, b) => {
      return parseTimeSlotToMinutes(a.timeSlot) - parseTimeSlotToMinutes(b.timeSlot);
    });
  }, [selectedMentor]);

  const scheduleDetails = getGroupedAndSortedSchedule();


  const handleBatchHover = (e, batch) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    if (batch) {
      setHoveredBatchInfo({
        batch: batch,
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
    }
  };

  const handleBatchLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredBatchInfo(null);
    }, 200);
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

  const handleExport = async () => {
    if (!selectedMentor) return;
    try {
      setExporting(true);
      const doc = new jsPDF('portrait', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();

      // Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(247, 147, 30);
      const title = 'Mentor Schedule Report';
      doc.text(title, 14, 20);

      // Mentor details
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Mentor: ${selectedMentor.fullName}`, 14, 28);
      doc.setFont('helvetica', 'normal');
      doc.text(`Email: ${selectedMentor.email}`, 14, 33);
      doc.text(`Role: ${selectedMentor.role || 'Mentor'}`, 14, 38);
      const formattedStartDate = startDate ? new Date(startDate).toLocaleDateString('en-GB') : 'N/A';
      const formattedEndDate = endDate ? new Date(endDate).toLocaleDateString('en-GB') : 'N/A';
      doc.text(`Schedule Week: ${formattedStartDate} to ${formattedEndDate}`, 14, 43);
      doc.text(`Report Date: ${new Date().toLocaleDateString('en-GB')}`, 14, 48);

      // Section 1: Assigned Batches
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(247, 147, 30);
      doc.text('Assigned Batches', 14, 58);

      const batchData = (selectedMentor.batches || []).map(b => [
        b.batchName || 'N/A',
        b.courseName || 'N/A',
        b.branchName || 'N/A',
        b.dayCombination || 'N/A',
        (b.interns?.length || 0).toString()
      ]);

      autoTable(doc, {
        startY: 61,
        head: [['Batch Name', 'Course', 'Branch', 'Days', 'Interns Count']],
        body: batchData,
        theme: 'striped',
        headStyles: { fillColor: [247, 147, 30], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' }
      });

      // Section 2: Weekly Schedule Slots
      const finalY = doc.lastAutoTable.finalY + 12;
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(247, 147, 30);
      doc.text('Weekly Schedule Details', 14, finalY);

      // Flat schedule list for tabular report
      const scheduleRows = [];
      (scheduleDetails || []).forEach(slot => {
        (slot.subDetails || []).forEach(sub => {
          scheduleRows.push([
            slot.timeSlot || 'N/A',
            sub.day?.name || 'N/A',
            sub.batches?.length > 0 ? sub.batches.map(b => b.batchName).join(', ') : 'No batches assigned'
          ]);
        });
      });

      autoTable(doc, {
        startY: finalY + 3,
        head: [['Time Slot', 'Days', 'Assigned Batches']],
        body: scheduleRows,
        theme: 'striped',
        headStyles: { fillColor: [40, 167, 69], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' }
      });

      doc.save(`mentor_schedule_${selectedMentor.fullName.replace(/\s+/g, '_')}.pdf`);
    } catch (e) {
      console.error('Export failed:', e);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar headData={headData} activeTab={activeTab} />
        <div className="p-4 sm:p-6 max-w-[1250px] mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
              <span className="text-lg text-gray-600 font-medium">Loading mentor schedule details...</span>
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
        <div className="p-4 sm:p-6 max-w-[1250px] mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md mx-auto">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Error Loading Data</h3>
            <p className="text-sm text-gray-600 mb-6">{error}</p>
            <button
              onClick={fetchAllMentors}
              className="px-6 py-2 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors shadow-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const batches = selectedMentor?.batches || [];

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      <Navbar headData={headData} activeTab={activeTab} />

      <div className="p-4 sm:p-6 lg:p-8 max-w-[1250px] mx-auto">

        {/* Mentor Selector Top Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm mb-6 min-w-0">
          <div className="flex items-center gap-3.5 flex-1 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 font-bold border border-orange-100 shadow-sm flex-shrink-0">
              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold text-gray-800 truncate">
                {userRole?.toLowerCase() === 'mentor' ? 'My Schedule' : 'Select Mentor Schedule'}
              </h3>
              <p className="text-xs text-gray-500 font-medium truncate">
                {userRole?.toLowerCase() === 'mentor'
                  ? 'View your weekly schedule, assigned batches, and time slots'
                  : 'Choose a mentor to view assigned batches, days, and time slots'}
              </p>
            </div>
          </div>
          <div className="flex flex-row items-center gap-3 flex-nowrap overflow-x-auto scrollbar-hide py-1 w-full md:w-auto md:justify-end flex-shrink-0">
            {/* Date Range Selector */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <input
                type="date"
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm hover:border-gray-300 transition-colors cursor-pointer flex-shrink-0 min-w-[135px]"
                value={startDate}
                onChange={handleDateChange}
              />
              {endDate && (
                <span className="text-xs text-gray-600 font-bold bg-orange-50/60 text-orange-700 px-3 py-2 rounded-xl border border-orange-100/60 shadow-sm whitespace-nowrap flex-shrink-0">
                  To: {new Date(endDate).toLocaleDateString('en-GB')}
                </span>
              )}
            </div>

            {/* Branch Selector */}
            {userRole?.toLowerCase() !== 'mentor' && (
              <select
                value={selectedBranch}
                onChange={(e) => {
                  setSelectedBranch(e.target.value);
                }}
                className="min-w-[180px] px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer shadow-sm hover:border-gray-300 transition-colors flex-shrink-0"
              >
                <option value="">All Branches</option>
                {branches.map(b => (
                  <option key={b._id} value={b._id}>{b.branchName}</option>
                ))}
              </select>
            )}

            {userRole?.toLowerCase() !== 'mentor' && (
              <select
                value={selectedMentor?._id || ''}
                onChange={(e) => {
                  const mentor = allMentors.find(m => m._id === e.target.value);
                  setSelectedMentor(mentor || null);
                }}
                className="min-w-[260px] px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer shadow-sm hover:border-gray-300 transition-colors flex-shrink-0"
              >
                {allMentors.map(m => (
                  <option key={m._id} value={m._id}>{m.fullName}</option>
                ))}
              </select>
            )}
            {selectedMentor && (
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center justify-center p-2.5 bg-white text-gray-700 rounded-xl border border-gray-200 hover:bg-gray-50 shadow-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 transition-colors flex-shrink-0"
                title="Export Mentor Schedule to PDF"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Selected Mentor Detail Dashboard */}
        {!selectedMentor ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-gray-200/80 shadow-sm">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {userRole?.toLowerCase() === 'mentor' ? 'No Assigned Schedules' : 'No Mentors Configured'}
            </h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              {userRole?.toLowerCase() === 'mentor'
                ? 'You do not have any active weekly schedules or batch assignments currently defined.'
                : 'There are no mentors with active schedules or batch assignments currently defined.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* Left Column: Profile Card & Assigned Batches (span 5) */}
            <div className="lg:col-span-5 space-y-6">

              {/* Profile Card */}
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-orange-100/80 rounded-2xl flex items-center justify-center text-orange-600 shadow-sm border border-orange-100 flex-shrink-0">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <span className={`inline-flex px-2.5 py-0.5 text-[10px] font-bold rounded-full mb-1.5 uppercase tracking-wider ${getRoleBadgeColor(selectedMentor.role)}`}>
                      {selectedMentor.role || 'Mentor'}
                    </span>
                    <h4 className="text-lg font-bold text-gray-900 leading-tight truncate">{selectedMentor.fullName}</h4>
                    <p className="text-xs text-gray-500 mt-1 font-medium truncate">{selectedMentor.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4.5">
                  <div className="bg-gray-50/50 rounded-2xl p-4.5 text-center border border-gray-100">
                    <div className="text-2xl font-extrabold text-blue-600">{batches.length}</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">Assigned Batches</div>
                  </div>
                  <div className="bg-gray-50/50 rounded-2xl p-4.5 text-center border border-gray-100">
                    <div className="text-2xl font-extrabold text-green-600">{scheduleDetails.length}</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">Schedule Slots</div>
                  </div>
                </div>
              </div>

              {/* Assigned Batches List */}
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-bold text-gray-800">Assigned Batches ({batches.length})</h4>
                </div>

                {batches.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm font-medium">
                    No batches assigned to this mentor.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {batches.map((batch) => (
                      <div
                        key={batch?._id}
                        className="group bg-white border border-gray-200/80 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-blue-200/80 transition-all relative cursor-help"
                        onMouseEnter={(e) => handleBatchHover(e, batch)}
                        onMouseLeave={handleBatchLeave}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-sm font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{batch?.batchName}</h5>
                          {batch?.dayCombination && batch?.dayCombination !== 'N/A' && (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded-full font-bold border border-blue-100">
                              {batch?.dayCombination}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-[11px] text-gray-500 font-medium">
                          <span className="truncate max-w-[150px]">{batch?.courseName}</span>
                          <span>•</span>
                          <span className="truncate">{batch?.branchName}</span>
                        </div>

                        {/* Hover hint */}
                        <div className="absolute right-3.5 bottom-3.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[9px] text-gray-400 flex items-center gap-1 font-bold">
                            <svg className="w-3.5 h-3.5 text-blue-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Hover to view interns
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Right Column: Weekly Schedule Timeline (span 7) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6">

              <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600 border border-green-100">
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className="text-sm font-bold text-gray-800">Weekly Schedule Timeline</h4>
              </div>

              {scheduleDetails.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm font-medium">
                  No schedule slots assigned to this mentor.
                </div>
              ) : (
                <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-green-50">
                  {scheduleDetails.map((timeSlot, index) => (
                    <div key={index} className="relative pl-7 group">

                      {/* Timeline dot */}
                      <div className="absolute left-[7px] top-1.5 w-3.5 h-3.5 -translate-x-1/2 rounded-full bg-green-500 border-3 border-white shadow-sm group-hover:scale-110 transition-transform" />

                      <div className="bg-white border border-gray-200/70 rounded-2xl p-4.5 shadow-sm hover:shadow-md hover:border-green-200/80 transition-all">
                        <div className="flex items-center justify-between mb-4">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-lg border border-green-100/60 shadow-sm">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {timeSlot?.timeSlot || 'N/A'}
                          </span>
                        </div>

                        <div className="space-y-3.5">
                          {(timeSlot?.subDetails || []).map((subDetail, subIndex) => (
                            <div key={subIndex} className="bg-gray-50/50 rounded-xl p-3.5 border border-gray-100">
                              <div className="flex items-center justify-between mb-2">
                                <span className="inline-flex items-center px-2 py-0.5 bg-gray-200 text-gray-800 text-[10px] font-bold rounded-md uppercase tracking-wider">
                                  {subDetail?.day?.name || 'N/A'}
                                </span>
                                <span className={`text-[11px] font-bold ${subDetail?.batches?.length > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                                  {subDetail?.batches?.length > 0 ? `${subDetail.batches.length} Batch(es) Active` : 'No Batches'}
                                </span>
                              </div>

                              {subDetail?.batches?.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {subDetail.batches.map((b, bIdx) => (
                                    <span
                                      key={b?._id || bIdx}
                                      className="px-2.5 py-1 bg-blue-50/50 border border-blue-100/70 text-blue-700 text-xs font-semibold rounded-lg hover:bg-blue-100/80 transition-colors"
                                    >
                                      {b?.batchName || 'N/A'}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-gray-400/80 italic font-medium">No active batches assigned to this slot</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}

            </div>

          </div>
        )}

      </div>

      {/* Interactive Hover Batch Modal (Same as original popup) */}
      {hoveredBatchInfo && (
        <div
          className="fixed z-[100] bg-white border border-gray-200/80 rounded-2xl shadow-xl p-4 w-68 text-gray-800 pointer-events-auto transform -translate-x-1/2 -translate-y-full border-t-4 border-t-blue-500 animate-fade-in"
          style={{
            top: `${hoveredBatchInfo.y - 12}px`,
            left: `${hoveredBatchInfo.x}px`,
          }}
          onMouseEnter={() => {
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current);
              hoverTimeoutRef.current = null;
            }
          }}
          onMouseLeave={handleBatchLeave}
        >
          <h4 className="font-extrabold border-b border-gray-100 pb-2.5 mb-2.5 text-xs text-blue-600 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="truncate">{hoveredBatchInfo.batch.batchName} Interns</span>
            <span className="ml-auto px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded-full font-bold border border-blue-100">
              {hoveredBatchInfo.batch.interns?.length || 0}
            </span>
          </h4>
          <div className="max-h-48 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
            {hoveredBatchInfo.batch.interns?.length > 0 ? (
              <ul className="space-y-2">
                {hoveredBatchInfo.batch.interns.map((intern, idx) => (
                  <li key={intern._id || idx} className="flex items-center gap-2.5 py-1 border-b border-gray-50 last:border-0">
                    <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-bold border border-blue-100 flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span
                        onClick={() => navigate(`/menor-card?internId=${intern._id}`)}
                        className="font-semibold text-gray-800 block leading-tight truncate hover:text-blue-600 hover:underline cursor-pointer transition-colors"
                        title={`Go to ${intern.fullName}'s Mentor Card`}
                      >
                        {intern.fullName}
                      </span>
                      {intern.courseName ? (
                        <span className="text-[9px] text-gray-400 block mt-0.5 truncate">{intern.courseName}</span>
                      ) : (
                        <span className="text-[9px] text-gray-400 block mt-0.5 italic">No course assigned</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-gray-400/80">
                <svg className="w-8 h-8 mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-xs font-semibold italic">No interns registered.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
