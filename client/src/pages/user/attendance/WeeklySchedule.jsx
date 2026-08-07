import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../../../components/user/UserNavBar';
import AdminService from '../../../services/admin-api-service/AdminService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  'sunday': 1,
  'monday': 2,
  'tuesday': 3,
  'wednesday': 4,
  'thursday': 5,
  'friday': 6,
  'saturday': 7
};

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 9999;
  const match = timeStr.trim().match(/^(\d{1,2})[:.](\d{2})\s*(AM|PM)?/i);
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

const WeeklySchedule = () => {
  const headData = "My Weekly Schedule";
  const activeTab = "Weekly Schedule";

  const defaultDates = getDefaultDates();
  const [startDate, setStartDate] = useState(defaultDates.startDate);
  const [endDate, setEndDate] = useState(defaultDates.endDate);

  const [internDetails, setInternDetails] = useState(null);
  const [allSchedules, setAllSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  const { getMyWeeklyScheduleData } = AdminService();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch weekly schedules and intern details in a single API call resolved by backend auth token
      const response = await getMyWeeklyScheduleData();
      const schedulesList = response.data?.schedules || [];
      const intern = response.data?.intern || null;

      setAllSchedules(schedulesList);
      setInternDetails(intern);

      // Dynamic date defaulting:
      // If there are schedules but none for the current week, default to the week of the most recent schedule
      if (schedulesList.length > 0) {
        const currentWeekDates = getDefaultDates();
        
        const getLocalYYYYMMDD = (dateStr) => {
          const date = new Date(dateStr);
          const offset = date.getTimezoneOffset();
          const localDate = new Date(date.getTime() - (offset * 60 * 1000));
          return localDate.toISOString().split('T')[0];
        };

        const hasCurrentWeekSchedule = schedulesList.some(s => {
          if (!s.startDate || !s.endDate) return false;
          const schedStart = getLocalYYYYMMDD(s.startDate);
          const schedEnd = getLocalYYYYMMDD(s.endDate);
          return schedStart >= currentWeekDates.startDate && schedEnd <= currentWeekDates.endDate;
        });

        if (!hasCurrentWeekSchedule) {
          const sorted = [...schedulesList].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
          const latestSched = sorted[0];
          setStartDate(getLocalYYYYMMDD(latestSched.startDate));
          setEndDate(getLocalYYYYMMDD(latestSched.endDate));
        }
      }
    } catch (err) {
      console.error('Error fetching student schedules:', err);
      setError(err.response?.data?.message || 'Failed to fetch weekly schedule');
    } finally {
      setLoading(false);
    }
  }, [getMyWeeklyScheduleData]);

  useEffect(() => {
    fetchData();
  }, []);

  const handleDateChange = (e) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);

    if (newStartDate) {
      const parts = newStartDate.split('-');
      const date = new Date(parts[0], parts[1] - 1, parts[2]);
      date.setDate(date.getDate() + 6);
      
      const getLocalYYYYMMDD = (d) => {
        const offset = d.getTimezoneOffset();
        const localDate = new Date(d.getTime() - (offset * 60 * 1000));
        return localDate.toISOString().split('T')[0];
      };
      
      setEndDate(getLocalYYYYMMDD(date));
    } else {
      setEndDate('');
    }
  };

  // Filter schedules for the selected week using local date string representation to avoid timezone shifts
  const filteredSchedules = allSchedules.filter(s => {
    if (!s.startDate || !s.endDate) return false;
    
    const getLocalYYYYMMDD = (dateStr) => {
      const date = new Date(dateStr);
      const offset = date.getTimezoneOffset();
      const localDate = new Date(date.getTime() - (offset * 60 * 1000));
      return localDate.toISOString().split('T')[0];
    };

    const schedStart = getLocalYYYYMMDD(s.startDate);
    const schedEnd = getLocalYYYYMMDD(s.endDate);
    
    return schedStart >= startDate && schedEnd <= endDate;
  });

  // Extract unique batches the intern belongs to
  const internBatches = (() => {
    const uniqueBatches = [];
    const seenIds = new Set();
    allSchedules.forEach(s => {
      const batches = s.schedule?.sub_details?.batch || [];
      batches.forEach(b => {
        if (b && !seenIds.has(b._id)) {
          seenIds.add(b._id);
          uniqueBatches.push(b);
        }
      });
    });
    return uniqueBatches;
  })();

  const getGroupedAndSortedSchedule = useCallback(() => {
    if (filteredSchedules.length === 0) return [];

    const groups = {};
    filteredSchedules.forEach(doc => {
      if (!doc.schedule) return;
      const sub = doc.schedule.sub_details;
      if (!sub) return;

      const dayName = (sub.day?.name || 'N/A').trim();
      const dayKey = dayName.toLowerCase();

      if (!groups[dayKey]) {
        groups[dayKey] = {
          dayName: dayName,
          slots: []
        };
      }

      const timeSlotStr = doc.schedule.time?.timeSlot || 'N/A';

      groups[dayKey].slots.push({
        timeSlot: timeSlotStr,
        subject: sub.subject?.moduleName || 'N/A',
        batches: sub.batch || [],
        note: sub.note || '',
        mentor: doc.mentor
      });
    });

    return Object.values(groups).map(group => {
      const sortedSlots = [...group.slots].sort((a, b) => {
        return parseTimeSlotToMinutes(a.timeSlot) - parseTimeSlotToMinutes(b.timeSlot);
      });

      return {
        dayName: group.dayName,
        slots: sortedSlots
      };
    }).sort((a, b) => {
      const orderA = DAYS_ORDER[a.dayName.toLowerCase()] || 8;
      const orderB = DAYS_ORDER[b.dayName.toLowerCase()] || 8;
      return orderA - orderB;
    });
  }, [filteredSchedules]);

  const scheduleDetails = getGroupedAndSortedSchedule();

  const handleExport = async () => {
    if (!internDetails) return;
    try {
      setExporting(true);
      const doc = new jsPDF('portrait', 'mm', 'a4');

      // Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(247, 147, 30);
      doc.text('My Weekly Schedule Report', 14, 20);

      // Student details
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Student Name: ${internDetails.fullName}`, 14, 28);
      doc.setFont('helvetica', 'normal');
      doc.text(`Email: ${internDetails.email}`, 14, 33);
      doc.text(`Course: ${internDetails.course?.courseName || 'N/A'}`, 14, 38);
      doc.text(`Branch: ${internDetails.branch?.branchName || 'N/A'}`, 14, 43);
      const formattedStartDate = startDate ? new Date(startDate).toLocaleDateString('en-GB') : 'N/A';
      const formattedEndDate = endDate ? new Date(endDate).toLocaleDateString('en-GB') : 'N/A';
      doc.text(`Schedule Week: ${formattedStartDate} to ${formattedEndDate}`, 14, 48);

      // Section 1: My Batches
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(247, 147, 30);
      doc.text('My Batches', 14, 58);

      const batchData = internBatches.map(b => [
        b?.batchName || 'N/A',
        b?.branchName || internDetails.branch?.branchName || 'N/A'
      ]);

      autoTable(doc, {
        startY: 61,
        head: [['Batch Name', 'Branch']],
        body: batchData,
        theme: 'striped',
        headStyles: { fillColor: [247, 147, 30], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' }
      });

      // Section 2: Weekly Schedule Timeline
      const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 12 : 75;
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(247, 147, 30);
      doc.text('Weekly Schedule Details', 14, finalY);

      const scheduleRows = [];
      scheduleDetails.forEach(dayGroup => {
        dayGroup.slots.forEach(slot => {
          scheduleRows.push([
            slot.timeSlot || 'N/A',
            dayGroup.dayName || 'N/A',
            slot.subject || 'N/A',
            slot.mentor?.fullName || 'N/A',
            slot.note || 'N/A'
          ]);
        });
      });

      autoTable(doc, {
        startY: finalY + 3,
        head: [['Time Slot', 'Day', 'Subject', 'Mentor', 'Note']],
        body: scheduleRows,
        theme: 'striped',
        headStyles: { fillColor: [40, 167, 69], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' }
      });

      doc.save(`my_schedule_${internDetails.fullName.replace(/\s+/g, '_')}.pdf`);
    } catch (e) {
      console.error('Export failed:', e);
      alert('Export failed: ' + (e.message || e));
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
              <span className="text-lg text-gray-600 font-medium">Loading weekly schedule...</span>
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
            <h3 className="text-xl font-bold text-gray-800 mb-2">Error Loading Schedule</h3>
            <p className="text-sm text-gray-600 mb-6">{error}</p>
            <button
              onClick={fetchData}
              className="px-6 py-2 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors shadow-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8 font-sans text-gray-800">
      <div className="max-w-[1250px] mx-auto space-y-6">
        <Navbar headData={headData} activeTab={activeTab} />

        {/* Date Selector Top Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm mb-6 min-w-0">
          <div className="flex items-center gap-3.5 flex-1 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 font-bold border border-orange-100 shadow-sm flex-shrink-0">
              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold text-slate-800 truncate">My Weekly Timeline</h3>
              <p className="text-xs text-slate-600 font-medium truncate">View class timings, subjects, and mentors for your batches</p>
            </div>
          </div>
          <div className="flex flex-row flex-wrap items-center gap-3 py-1 w-full md:w-auto md:justify-end">
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

            {internDetails && (
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center justify-center p-2.5 bg-white text-gray-700 rounded-xl border border-gray-200 hover:bg-gray-50 shadow-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 transition-colors flex-shrink-0"
                title="Export My Schedule to PDF"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Left Column: Profile Card & My Batches (span 5) */}
          <div className="lg:col-span-5 space-y-6">

            {/* Profile Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-orange-100/80 rounded-2xl flex items-center justify-center text-orange-600 shadow-sm border border-orange-100 flex-shrink-0">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <span className="inline-flex px-2.5 py-0.5 text-[10px] font-bold rounded-full mb-1.5 uppercase tracking-wider bg-orange-100 text-orange-800">
                    INTERN
                  </span>
                  <h4 className="text-lg font-bold text-slate-900 leading-tight truncate">{internDetails?.fullName}</h4>
                  <p className="text-xs text-slate-600 mt-1 font-medium truncate">{internDetails?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4.5">
                <div className="bg-slate-50/50 rounded-2xl p-4.5 text-center border border-slate-100">
                  <div className="text-2xl font-extrabold text-blue-600">{internBatches.length}</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">My Batches</div>
                </div>
                <div className="bg-slate-50/50 rounded-2xl p-4.5 text-center border border-slate-100">
                  <div className="text-2xl font-extrabold text-green-600">{scheduleDetails.length}</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Weekly Slots</div>
                </div>
              </div>
            </div>

            {/* My Batches List */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h4 className="text-sm font-bold text-slate-800">My Batches ({internBatches.length})</h4>
              </div>

              {internBatches.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm font-medium">
                  You are not assigned to any batches.
                </div>
              ) : (
                <div className="space-y-4">
                  {internBatches.map((batch) => (
                    <div
                      key={batch?._id}
                      className="group bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-blue-200/80 transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{batch?.batchName}</h5>
                      </div>
                      <div className="flex items-center space-x-2 text-[11px] text-slate-600 font-medium">
                        <span className="truncate">{batch?.branchName || internDetails?.branch?.branchName || 'N/A'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Weekly Schedule Timeline (span 7) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">

            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600 border border-green-100">
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="text-sm font-bold text-slate-800">Weekly Schedule Timeline</h4>
            </div>

            {scheduleDetails.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm font-medium">
                No classes scheduled for you during this week.
              </div>
            ) : (
              <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-green-50">
                {scheduleDetails.map((dayGroup, index) => (
                  <div key={index} className="relative pl-7 group">

                    {/* Timeline dot */}
                    <div className="absolute left-[7px] top-1.5 w-3.5 h-3.5 -translate-x-1/2 rounded-full bg-green-500 border-3 border-white shadow-sm group-hover:scale-110 transition-transform" />

                    <div className="bg-white border border-slate-200/70 rounded-2xl p-4.5 shadow-sm hover:shadow-md hover:border-green-200/80 transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-lg border border-green-100/60 shadow-sm uppercase tracking-wider">
                          {dayGroup?.dayName || 'N/A'}
                        </span>
                      </div>

                      <div className="space-y-3.5">
                        {(dayGroup?.slots || []).map((slotDetail, slotIndex) => (
                          <div key={slotIndex} className="bg-slate-50/50 rounded-xl p-3.5 border border-slate-100">
                            <div className="flex items-center justify-between mb-2">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100/60 shadow-sm">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {slotDetail?.timeSlot || 'N/A'}
                              </span>
                            </div>

                            {/* Subject */}
                            {slotDetail?.subject && slotDetail.subject !== 'N/A' && (
                              <div className="mt-2.5 flex items-center text-[11px] text-orange-700 font-semibold bg-orange-50/50 px-2.5 py-1.5 rounded-lg border border-orange-100/60 w-fit">
                                <svg className="w-3.5 h-3.5 mr-1.5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.433 9.496 5 8 5c-4 0-8 3-8 8s4 8 8 8c.94 0 1.841-.213 2.684-.606m3.56-5.894C15.687 7.159 15.589 8 15 8s-1.5-.5-1.5-.5V5a2 2 0 00-2-2h-2c-1.5 0-2 1-2 2v2.5" />
                                </svg>
                                <span>Subject: {slotDetail.subject}</span>
                              </div>
                            )}

                            {/* Mentor details */}
                            {slotDetail?.mentor?.fullName && (
                              <div className="mt-2 text-xs text-slate-600 font-medium flex items-center">
                                <span className="mr-1.5">👨‍🏫</span>
                                <span>Mentor: {slotDetail.mentor.fullName}</span>
                              </div>
                            )}

                            {/* Note */}
                            {slotDetail?.note && (
                              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-start gap-1.5 text-[11px] text-slate-700 bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                                <span className="text-orange-500 flex-shrink-0 mt-0.5">📝</span>
                                <span className="italic leading-relaxed whitespace-pre-wrap break-words">{slotDetail.note}</span>
                              </div>
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

      </div>
    </div>
  );
};

export default WeeklySchedule;