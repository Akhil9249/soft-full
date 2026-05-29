import React, { useState, useEffect } from 'react'
import { Navbar } from '../../../components/admin/AdminNavBar';
import AdminService from '../../../services/admin-api-service/AdminService';
import { IoEyeOutline } from "react-icons/io5";

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

export const WeeklySchedule = () => {

  const [activeTab, setActiveTab] = useState('weekly-schedule');
  const [batches, setBatches] = useState([]);
  const [allBatches, setAllBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [draggingItem, setDraggingItem] = useState(null);
  const [warning, setWarning] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('info');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingScheduleId, setDeletingScheduleId] = useState(null);

  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneTargetDate, setCloneTargetDate] = useState('');
  const [cloningSchedules, setCloningSchedules] = useState(false);

  const [showRemoveBatchModal, setShowRemoveBatchModal] = useState(false);
  const [removingBatchInfo, setRemovingBatchInfo] = useState(null);

  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingNoteScheduleId, setEditingNoteScheduleId] = useState(null);
  const [noteModalTarget, setNoteModalTarget] = useState(null);
  const [noteValue, setNoteValue] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  
  const [hoveredBatchInfo, setHoveredBatchInfo] = useState(null);
  const [hoveredNoteInfo, setHoveredNoteInfo] = useState(null);

  const [weeklySchedules, setWeeklySchedules] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [allMentors, setAllMentors] = useState([]);
  const [modules, setModules] = useState([]);
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [topics, setTopics] = useState([]);
  const [timings, setTimings] = useState([]);
  const [dayCombinations, setDayCombinations] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const defaultDates = getDefaultDates();
  const [startDate, setStartDate] = useState(defaultDates.startDate);
  const [endDate, setEndDate] = useState(defaultDates.endDate);
  const { getBatchesData, getAllBatchesData, getWeeklySchedulesData, postWeeklySchedulesData, putWeeklySchedulesData, deleteWeeklySchedulesData, deleteWeeklyScheduleDocument, getAllActiveStaffData, getModulesData, getTopicsData, updateWeeklyScheduleSubject, updateWeeklyScheduleNote, getBranchesData, getTimingsData, getDaysCombinationsData } = AdminService();

  const showModalMessage = (message, type = 'info') => {
    setModalMessage(message);
    setModalType(type);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalMessage('');
    setModalType('info');
  };

  const getWeekRange = (dateString) => {
    const dateObj = new Date(dateString);
    const day = dateObj.getDay();
    
    const sunday = new Date(dateObj);
    sunday.setDate(dateObj.getDate() - day);
    
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);

    const getLocalYYYYMMDD = (date) => {
      const offset = date.getTimezoneOffset();
      const localDate = new Date(date.getTime() - (offset * 60 * 1000));
      return localDate.toISOString().split('T')[0];
    };

    return { 
      startDate: getLocalYYYYMMDD(sunday), 
      endDate: getLocalYYYYMMDD(saturday) 
    };
  };

  const openCloneModal = () => {
    if (startDate) {
      const nextWeekDate = new Date(startDate);
      nextWeekDate.setDate(nextWeekDate.getDate() + 7);
      setCloneTargetDate(nextWeekDate.toISOString().split('T')[0]);
    } else {
      const today = new Date();
      setCloneTargetDate(today.toISOString().split('T')[0]);
    }
    setShowCloneModal(true);
  };

  const handleCloneSchedule = async () => {
    if (!cloneTargetDate) {
      showModalMessage('Please select a target date first!', 'warning');
      return;
    }

    if (weeklySchedules.length === 0) {
      showModalMessage('The current week has no schedule blocks to clone!', 'warning');
      return;
    }

    const { startDate: targetStart, endDate: targetEnd } = getWeekRange(cloneTargetDate);

    try {
      setCloningSchedules(true);

      // Create new schedule objects
      const clonePromises = weeklySchedules.map(async (scheduleDoc) => {
        const batchIds = scheduleDoc.schedule?.sub_details?.batch?.map(b => b._id) || [];
        
        const newScheduleData = {
          startDate: targetStart,
          endDate: targetEnd,
          mentor: scheduleDoc.mentor?._id,
          schedule: {
            time: scheduleDoc.schedule?.time?._id,
            sub_details: {
              day: scheduleDoc.schedule?.sub_details?.day?._id,
              branch: scheduleDoc.schedule?.sub_details?.branch?._id || selectedBranch,
              subject: scheduleDoc.schedule?.sub_details?.subject?._id || null,
              batch: batchIds
            }
          }
        };

        return postWeeklySchedulesData(newScheduleData);
      });

      await Promise.all(clonePromises);
      showToastMessage('Schedule successfully cloned to the target week!', 'success');
      setShowCloneModal(false);
      
      // Navigate to the target cloned week
      setStartDate(targetStart);
      setEndDate(targetEnd);
    } catch (err) {
      console.error('Failed to clone weekly schedules:', err);
      showModalMessage('Failed to clone schedule blocks to the target week.', 'error');
    } finally {
      setCloningSchedules(false);
    }
  };

  const showToastMessage = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      setToastMessage('');
      setToastType('success');
    }, 3000);
  };

  const closeToast = () => {
    setShowToast(false);
    setToastMessage('');
    setToastType('success');
  };

  const headData = "Batch Management";

  const fetchBatches = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getAllBatchesData();
      setAllBatches(res.data || []);
      setBatches(res.data || []);
    } catch (err) {
      console.error('Failed to load batches:', err);
      setError('Failed to load batches');
      showModalMessage('Failed to load batches. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      setBranchesLoading(true);
      const res = await getBranchesData();
      const fetchedBranches = Array.isArray(res?.data) ? res.data : [];
      setBranches(fetchedBranches);
      if (fetchedBranches.length > 0) {
        const calicutBranch = fetchedBranches.find(b => b.branchName.toLowerCase().includes('calicut'));
        if (calicutBranch) {
          setSelectedBranch(calicutBranch._id);
        } else {
          setSelectedBranch(fetchedBranches[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to load branches:', err);
      setBranches([]);
    } finally {
      setBranchesLoading(false);
    }
  };

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

  const fetchDayCombinations = async () => {
    try {
      const res = await getDaysCombinationsData();
      setDayCombinations(res.data || []);
    } catch (err) {
      console.error('Failed to load day combinations:', err);
    }
  };

  const searchBatches = (searchValue) => {
    setSearchTerm(searchValue);
  };

  const isBatchAssigned = (batchId) => {
    return weeklySchedules.some(schedule =>
      schedule.schedule?.sub_details?.batch?.some(batch => batch._id === batchId)
    );
  };

  const fetchMentors = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getAllActiveStaffData();
      const mentorStaff = res.data?.filter(staff => staff.role?.role === 'mentor') || [];
      const transformedMentors = mentorStaff.map(staff => ({
        _id: staff._id,
        name: staff.fullName,
        branch: staff.branch,
        time: staff.time || []
      }));
      setAllMentors(transformedMentors);
      setMentors(transformedMentors);
    } catch (err) {
      console.error('Failed to load mentors:', err);
      setError('Failed to load mentors');
      showModalMessage('Failed to load mentors. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklySchedules = async () => {
    try {
      console.log('Fetching weekly schedules...');
      setLoading(true);
      setError('');
      // Even if dates/branch are empty, passing them will return all or filter dynamically.
      const res = await getWeeklySchedulesData(startDate, endDate, selectedBranch);
      setWeeklySchedules(res.data || []);
    } catch (err) {
      console.error('Failed to load weekly schedules:', err);
      setError('Failed to load weekly schedules');
      showModalMessage('Failed to load weekly schedules. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchModules = async () => {
    try {
      const res = await getModulesData();
      setModules(res.data || []);
    } catch (err) {
      console.error('Failed to load modules:', err);
    }
  };

  const fetchTopics = async () => {
    try {
      const res = await getTopicsData();
      setTopics(res.data || []);
    } catch (err) {
      console.error('Failed to load topics:', err);
    }
  };

  useEffect(() => {
    fetchWeeklySchedules();
  }, [startDate, endDate, selectedBranch]);

  useEffect(() => {
    let filteredBatches = allBatches;
    let filteredMentors = allMentors;

    if (selectedBranch) {
      filteredBatches = allBatches.filter(batch => {
        const branchId = typeof batch.branch === 'object' && batch.branch !== null ? batch.branch._id : batch.branch;
        return branchId === selectedBranch;
      });

      filteredMentors = allMentors.filter(mentor => {
        const branchId = typeof mentor.branch === 'object' && mentor.branch !== null ? mentor.branch._id : mentor.branch;
        return branchId === selectedBranch;
      });
    }

    if (searchTerm.trim()) {
      filteredBatches = filteredBatches.filter(batch =>
        batch.batchName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setBatches(filteredBatches);
    setMentors(filteredMentors);
  }, [selectedBranch, allBatches, allMentors, searchTerm]);

  useEffect(() => {
    fetchBatches();
    fetchBranches();
    fetchTimings();
    fetchDayCombinations();
    fetchMentors();
    fetchModules();
    fetchTopics();
  }, []);

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

  const handleDragStart = (batch) => {
    const dragItem = {
      id: batch._id || batch,
      name: batch.batchName || batch,
      color: 'bg-blue-500'
    };
    setDraggingItem(dragItem);
  };

  const openNoteModal = (scheduleId, currentNote, targetInfo = null) => {
    setHoveredNoteInfo(null);
    setEditingNoteScheduleId(scheduleId);
    setNoteModalTarget(targetInfo);
    setNoteValue(currentNote || '');
    setShowNoteModal(true);
  };

  const closeNoteModal = () => {
    setShowNoteModal(false);
    setEditingNoteScheduleId(null);
    setNoteModalTarget(null);
    setNoteValue('');
  };

  const handleSaveNote = async () => {
    if (!editingNoteScheduleId && !noteModalTarget) return;
    try {
      setSavingNote(true);
      if (editingNoteScheduleId) {
        const response = await updateWeeklyScheduleNote(editingNoteScheduleId, { note: noteValue });
        const message = response?.message || 'Note updated successfully!';
        showToastMessage(message, 'success');
      } else {
        const { mentor, timeSlot, dayCombo } = noteModalTarget;
        if (!selectedBranch) {
          showModalMessage('Please select a branch first to add notes!', 'warning');
          return;
        }
        if (!startDate || !endDate) {
          showModalMessage('Please select a start date first to add notes!', 'warning');
          return;
        }
        const newScheduleData = {
          startDate,
          endDate,
          mentor: mentor._id,
          schedule: {
            time: timeSlot._id,
            sub_details: {
              day: dayCombo._id,
              branch: selectedBranch,
              note: noteValue,
              batch: []
            }
          }
        };
        await postWeeklySchedulesData(newScheduleData);
        showToastMessage('Schedule created with note successfully!', 'success');
      }
      await fetchWeeklySchedules();
      closeNoteModal();
    } catch (err) {
      console.error('Failed to save schedule note:', err);
      showModalMessage('Failed to save note. Please try again.', 'error');
    } finally {
      setSavingNote(false);
    }
  };

  const handleRemoveBatchClick = (scheduleId, batchId, batchName) => {
    setRemovingBatchInfo({ scheduleId, batchId, batchName });
    setShowRemoveBatchModal(true);
  };

  const confirmRemoveBatch = async () => {
    if (!removingBatchInfo) return;
    const { scheduleId, batchId } = removingBatchInfo;

    try {
      const response = await deleteWeeklySchedulesData(scheduleId, { batchId });
      const message = response?.message || 'Batch successfully removed from schedule!';
      showToastMessage(message, 'success');
      await fetchWeeklySchedules();
      setShowRemoveBatchModal(false);
      setRemovingBatchInfo(null);
    } catch (error) {
      console.error('Error removing batch from schedule:', error);
      showModalMessage('Failed to remove batch from schedule. Please try again.', 'error');
      setShowRemoveBatchModal(false);
      setRemovingBatchInfo(null);
    }
  };

  const cancelRemoveBatch = () => {
    setShowRemoveBatchModal(false);
    setRemovingBatchInfo(null);
  };

  const handleDeleteScheduleClick = (scheduleId) => {
    setDeletingScheduleId(scheduleId);
    setShowDeleteModal(true);
  };

  const confirmDeleteSchedule = async () => {
    if (!deletingScheduleId) return;

    try {
      const response = await deleteWeeklyScheduleDocument(deletingScheduleId);
      showToastMessage('Schedule document successfully deleted!', 'success');
      await fetchWeeklySchedules();
      setShowDeleteModal(false);
      setDeletingScheduleId(null);
    } catch (error) {
      console.error('Error deleting schedule document:', error);
      setError('Failed to delete schedule document');
      showModalMessage('Failed to delete schedule document. Please try again.', 'error');
      setShowDeleteModal(false);
      setDeletingScheduleId(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeletingScheduleId(null);
  };

  const handleBatchHover = (e, batchId) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const batchObj = typeof batchId === 'object' ? batchId : { _id: batchId };
    const fullBatch = allBatches.find(b => b._id === batchObj._id);
    if (fullBatch) {
      setHoveredBatchInfo({
        batch: fullBatch,
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
    }
  };

  const handleBatchLeave = () => {
    setHoveredBatchInfo(null);
  };

  const handleNoteHover = (e, note) => {
    if (!note) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredNoteInfo({
      note,
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  };

  const handleNoteLeave = () => {
    setHoveredNoteInfo(null);
  };

  const handleSubjectChange = async (scheduleId, newSubject) => {
    try {
      const response = await updateWeeklyScheduleSubject(scheduleId, {
        subject: newSubject
      });
      showToastMessage('Subject updated successfully!', 'success');
      await fetchWeeklySchedules();
    } catch (error) {
      console.error('Error updating subject:', error);
      setError('Failed to update subject');
      showModalMessage('Failed to update subject. Please try again.', 'error');
    }
  };

  const handleCreateSubjectOnly = async (mentor, timeSlot, targetDaysName, newSubject) => {
    if (!selectedBranch) {
      showModalMessage('Please select a branch first to assign subjects!', 'warning');
      return;
    }
    if (!startDate || !endDate) {
      showModalMessage('Please select a start date first to assign weeks!', 'warning');
      return;
    }
    const currentBranch = branches.find(b => b._id === selectedBranch);
    const branchDayCombinations = currentBranch?.days || [];
    const dayCombo = branchDayCombinations.find(dc => dc.name === targetDaysName);
    if (!dayCombo) {
      showModalMessage(`Day combination ${targetDaysName} not found!`, 'warning');
      return;
    }
    try {
      const newScheduleData = {
        startDate,
        endDate,
        mentor: mentor._id,
        schedule: {
          time: timeSlot._id,
          sub_details: {
            day: dayCombo._id,
            branch: selectedBranch,
            subject: newSubject,
            batch: []
          }
        }
      };
      await postWeeklySchedulesData(newScheduleData);
      showToastMessage('Subject saved to new schedule!', 'success');
      await fetchWeeklySchedules();
    } catch (err) {
      console.error('Failed to create subject in new schedule', err);
      showModalMessage('Failed to create schedule block for subject.', 'error');
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setWarning('');

    if (draggingItem) {
      try {
        const row = e.target.closest('tr');
        const cell = e.target.closest('td');

        const rowData = row.getAttribute('data-mentor-slot');
        if (!rowData || !cell) {
          showModalMessage('Unable to identify mentor and slot!', 'warning');
          setDraggingItem(null);
          return;
        }

        const [mentorIndex, slotIndex] = rowData.split('-').map(Number);
        const dataZoneId = cell.getAttribute('data-zone-id');

        if (!dataZoneId) {
          showModalMessage('Invalid drop zone!', 'warning');
          setDraggingItem(null);
          return;
        }

        const [, , dayComboId] = dataZoneId.split('-');
        const currentBranch = branches.find(b => b._id === selectedBranch);
        const branchDayCombinations = currentBranch?.days || [];
        const dayCombo = branchDayCombinations.find(dc => dc._id === dayComboId);

        if (!dayCombo) {
          showModalMessage('Invalid drop zone! Could not determine day combination.', 'warning');
          setDraggingItem(null);
          return;
        }

        if (!selectedBranch) {
          showModalMessage('Please select a branch first from the top right!', 'warning');
          setDraggingItem(null);
          return;
        }

        if (!startDate || !endDate) {
          showModalMessage('Please select a start date first!', 'warning');
          setDraggingItem(null);
          return;
        }

        const mentor = mentors[mentorIndex];
        let mentorTimings = [];
        if (mentor.time && mentor.time.length > 0) {
            mentorTimings = timings.filter(t => 
                mentor.time.some(mt => String(mt._id || mt) === String(t._id))
            );
        }
        const timeSlot = mentorTimings[slotIndex];
        const targetDaysName = dayCombo.name;

        // Find existing schedule for this mentor, time slot, day, and branch
        let mentorSchedule = weeklySchedules.find(ws =>
          ws.mentor?._id === mentor._id &&
          ws.schedule?.time?._id === timeSlot._id &&
          ws.schedule?.sub_details?.day?._id === dayCombo._id &&
          ws.schedule?.sub_details?.branch?._id === selectedBranch
        );

        // Check if the same batch is already assigned to a different mentor at the same time and day
        const batchConflict = weeklySchedules.some(schedule => {
          if (schedule.mentor?._id === mentor._id) return false;
          // Check if this schedule has the same time slot and day combination
          if (schedule.schedule?.time?._id === timeSlot._id && schedule.schedule?.sub_details?.day?._id === dayCombo._id) {
            return schedule.schedule?.sub_details?.batch?.some(batch => batch._id === draggingItem.id);
          }
          return false;
        });

        if (batchConflict) {
          showModalMessage(`This batch is already assigned to another mentor at the same time on ${targetDaysName} days!`, 'warning');
          setDraggingItem(null);
          return;
        }

        if (!mentorSchedule) {
          try {
            const newScheduleData = {
              startDate,
              endDate,
              mentor: mentor._id,
              schedule: {
                time: timeSlot._id,
                sub_details: {
                  day: dayCombo._id,
                  branch: selectedBranch,
                  batch: [draggingItem.id]
                }
              }
            };
            await postWeeklySchedulesData(newScheduleData);
            showToastMessage('Batch successfully added to schedule!', 'success');
            await fetchWeeklySchedules();
            setDraggingItem(null);
            return;
          } catch (err) {
            console.error('Failed to create new schedule block', err);
            showModalMessage('Failed to create schedule block.', 'error');
            setDraggingItem(null);
            return;
          }
        }

        // Check if batch already exists in this slot
        if (mentorSchedule.schedule?.sub_details?.batch?.some(batch => batch._id === draggingItem.id)) {
          showModalMessage('This batch is already assigned to this slot!', 'warning');
          setDraggingItem(null);
          return;
        }

        const response = await putWeeklySchedulesData(mentorSchedule._id, {
          batchId: draggingItem.id
        });

        showToastMessage('Batch successfully added to schedule!', 'success');
        await fetchWeeklySchedules();

      } catch (error) {
        console.error('Error adding batch to database:', error);
        setError('Failed to add batch to schedule');
        showModalMessage('Failed to add batch to schedule. Please try again.', 'error');
      }
      setDraggingItem(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const Icon = ({ path, className, viewBox = "0 0 24 24" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox={viewBox} xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={path}></path>
    </svg>
  );

  const Toast = () => {
    if (!showToast) return null;

    const getToastIcon = () => {
      switch (toastType) {
        case 'success':
          return (
            <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 1 1 18 0z" />
            </svg>
          );
        case 'error':
          return (
            <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          );
        case 'warning':
          return (
            <svg className="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          );
        case 'info':
        default:
          return (
            <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 1 1 18 0z" />
            </svg>
          );
      }
    };

    const getToastBgColor = () => {
      switch (toastType) {
        case 'success':
          return 'bg-green-50 border-green-200';
        case 'error':
          return 'bg-red-50 border-red-200';
        case 'warning':
          return 'bg-yellow-50 border-yellow-200';
        case 'info':
        default:
          return 'bg-blue-50 border-blue-200';
      }
    };

    return (
      <div className="fixed top-4 right-2 sm:right-4 z-50 transform transition-all duration-300 ease-in-out animate-pulse max-w-[calc(100vw-1rem)] sm:max-w-sm">
        <div className={`w-full ${getToastBgColor()} border rounded-lg p-3 sm:p-4 flex items-center space-x-2 sm:space-x-3`}>
          <div className="flex-shrink-0">
            {getToastIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{toastMessage}</p>
          </div>
          <div className="flex-shrink-0">
            <button
              onClick={closeToast}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
            >
              <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const Modal = () => {
    if (!showModal) return null;

    const getIcon = () => {
      switch (modalType) {
        case 'success':
          return (
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 1 1 18 0z" />
            </svg>
          );
        case 'error':
          return (
            <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          );
        case 'warning':
          return (
            <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          );
        case 'info':
        default:
          return (
            <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 1 1 18 0z" />
            </svg>
          );
      }
    };

    const getButtonColor = () => {
      switch (modalType) {
        case 'success':
          return 'bg-green-600 hover:bg-green-700 focus:ring-green-500';
        case 'error':
          return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
        case 'warning':
          return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500';
        case 'info':
        default:
          return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
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
                <h3 className="text-base sm:text-lg font-medium text-gray-900">
                  {modalType === 'success' && 'Success'}
                  {modalType === 'error' && 'Error'}
                  {modalType === 'warning' && 'Warning'}
                  {modalType === 'info' && 'Information'}
                </h3>
              </div>
            </div>

            <div className="mb-4 sm:mb-6">
              <p className="text-xs sm:text-sm text-gray-500">{modalMessage}</p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={closeModal}
                className={`w-full sm:w-auto px-4 py-2 text-xs sm:text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${getButtonColor()}`}
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
    // Derive valid dayCombinations and timings based on selected branch
    const currentBranch = branches.find(b => b._id === selectedBranch);
    const displayedDayCombinations = currentBranch ? currentBranch.days : [];
    const displayedTimings = currentBranch ? currentBranch.time : [];

    return (
      <div className="h-screen bg-gray-100 font-sans flex flex-col overflow-hidden">
        <Navbar headData={headData} activeTab={activeTab} />
        <div className="flex-1 flex flex-col lg:flex-row space-y-4 sm:space-y-6 lg:space-y-0 lg:space-x-6 overflow-y-auto p-2 sm:p-4 lg:p-6">
          <div className="w-full lg:w-1/6 bg-white p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-sm flex flex-col h-auto lg:h-full max-h-[400px] lg:max-h-none">
            <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-4">Batch's</h3>
            <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">Drag batches to the weekly live schedule (classes.)</p>
            <div className="relative mb-3 sm:mb-4">
              <input
                type="text"
                placeholder="Search Batch"
                value={searchTerm}
                onChange={(e) => searchBatches(e.target.value)}
                className="w-full pl-8 sm:pl-10 pr-8 sm:pr-10 py-2 text-sm sm:text-base border border-gray-300 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500"
              />
              <Icon path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" className="w-4 h-4 sm:w-5 sm:h-5 absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              {searchTerm && (
                <button
                  onClick={() => searchBatches('')}
                  className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <Icon path="M6 18L18 6M6 6l12 12" className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              )}
            </div>
            <div
              className="space-y-2 overflow-y-auto flex-1 batches-container"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {loading ? (
                <p className="text-center text-xs sm:text-sm text-gray-500 py-4">Loading batches...</p>
              ) : error ? (
                <p className="text-center text-xs sm:text-sm text-red-500 py-4">{error}</p>
              ) : batches.length === 0 ? (
                <p className="text-center text-xs sm:text-sm text-gray-500 py-4">No batches available</p>
              ) : (
                batches.map((batch, index) => {
                  const isAssigned = isBatchAssigned(batch._id);
                  return (
                    <div
                      key={batch._id || index}
                      draggable
                      onDragStart={() => handleDragStart(batch)}
                      onMouseEnter={(e) => handleBatchHover(e, batch._id)}
                      onMouseLeave={handleBatchLeave}
                      className={`flex justify-between items-center p-2 sm:p-3 rounded-lg border cursor-grab hover:bg-gray-100 transition-colors text-xs sm:text-sm ${isAssigned
                          ? 'bg-green-100 border-green-200'
                          : 'bg-gray-50 border-gray-200'
                        }`}
                    >
                      <span className={isAssigned ? 'text-green-700' : 'text-gray-700'}>
                        {batch.batchName || batch}
                      </span>
                      <IoEyeOutline className={`${isAssigned ? 'text-green-500' : 'text-gray-500'} w-4 h-4 sm:w-5 sm:h-5`} />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex-1 bg-white p-4 sm:p-6 rounded-lg sm:rounded-xl flex flex-col h-full min-w-0">

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold">Weekly Schedule</h2>
                <p className="text-xs sm:text-sm text-gray-500">Assign batches to timings</p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2 sm:space-x-2">
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full sm:w-auto p-2 text-sm border border-gray-300 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">{branchesLoading ? 'Loading branches...' : 'Choose Branch'}</option>
                  {branches.map(branch => (
                    <option key={branch._id} value={branch._id}>{branch.branchName}</option>
                  ))}
                </select>
                {/* <select className="w-full sm:w-auto p-2 text-sm border border-gray-300 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500">
                  <option>Alternative</option>
                  <option>Regular</option>
                  <option>Special</option>
                  <option>Custom</option>
                  <option>Weekend</option>
                </select> */}
                <div className="flex items-center space-x-2">
                  <input
                    type="date"
                    className="w-full sm:w-auto p-2 text-sm border border-gray-300 rounded-lg shadow-sm"
                    value={startDate}
                    onChange={handleDateChange}
                  />
                  {endDate && (
                    <span className="text-sm text-gray-600 font-medium bg-gray-100 px-3 py-2 rounded-lg border border-gray-200">
                      To: {new Date(endDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <button className="flex items-center justify-center space-x-2 py-2 px-3 sm:px-4 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50">
                  {/* <Icon path="M4 16v1a3 3 0 00 6h16a3 3 0 00-6v-1m-4-4l-4 4m0 0l-4-4m4 4V4" className="w-4 h-4 sm:w-5 sm:h-5" /> */}
                  <span className="text-xs sm:text-sm">Export</span>
                </button>
                <button
                  onClick={openCloneModal}
                  className="flex items-center justify-center space-x-2 py-2 px-3 sm:px-4 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition shadow-sm"
                >
                  <Icon path="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-xs sm:text-sm font-semibold">Add Next Schedule</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 flex-1 -mx-2 sm:mx-0">
              <table className="min-w-full">
                <thead className="bg-orange-500 text-white">
                  <tr>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium uppercase tracking-wider sticky left-0 bg-orange-500 z-20 w-[120px] min-w-[120px] sm:w-[150px] sm:min-w-[150px]">Mentors</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium uppercase tracking-wider sticky left-[120px] sm:left-[150px] bg-orange-500 z-20 w-[100px] min-w-[100px] sm:w-[120px] sm:min-w-[120px] border-r border-orange-400 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.2)]">Time</th>
                    {displayedDayCombinations.map((dayCombo) => (
                      <React.Fragment key={dayCombo._id}>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left w-[150px] min-w-[150px] max-w-[150px] text-[10px] sm:text-xs font-medium uppercase tracking-wider">{dayCombo.name}</th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left w-[150px] min-w-[150px] text-[10px] sm:text-xs font-medium uppercase tracking-wider">Subject</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mentors.map((mentor, mentorIndex) => {
                    let mentorTimings = [];
                    if (mentor.time && mentor.time.length > 0) {
                        mentorTimings = timings.filter(t => 
                            mentor.time.some(mt => String(mt._id || mt) === String(t._id))
                        );
                    }
                    
                    if (mentorTimings.length === 0) {
                        return (
                            <tr key={mentorIndex}>
                                <td className="px-2 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900 border-r border-gray-200 sticky left-0 bg-gray-50 z-10 w-[120px] min-w-[120px] sm:w-[150px] sm:min-w-[150px] truncate max-w-[120px] sm:max-w-[150px]" title={mentor.name}>
                                    {mentor.name}
                                </td>
                                <td className="px-2 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 border-r border-gray-200 italic sticky left-[120px] sm:left-[150px] bg-gray-50 z-10 w-[100px] min-w-[100px] sm:w-[120px] sm:min-w-[120px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                    -
                                </td>
                                <td className="px-2 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 border-r border-gray-200 italic" colSpan={displayedDayCombinations.length * 2}>
                                    No timings assigned to this mentor
                                </td>
                            </tr>
                        );
                    }

                    return (
                    <React.Fragment key={mentorIndex}>
                      {mentorTimings.map((timeSlot, slotIndex) => {
                        return (
                          <tr key={`${mentorIndex}-${slotIndex}`} data-mentor-slot={`${mentorIndex}-${slotIndex}`}>
                            {slotIndex === 0 && (
                              <td rowSpan={mentorTimings.length} className="px-2 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900 border-r border-gray-200 align-top sticky left-0 bg-white z-10 w-[120px] min-w-[120px] sm:w-[150px] sm:min-w-[150px] truncate max-w-[120px] sm:max-w-[150px]" title={mentor.name}>
                                {mentor.name}
                              </td>
                            )}
                            <td className="px-2 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 border-r border-gray-200 sticky left-[120px] sm:left-[150px] bg-white z-10 w-[100px] min-w-[100px] sm:w-[120px] sm:min-w-[120px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                              {timeSlot.timeSlot}
                            </td>

                            {displayedDayCombinations.map((dayCombo, dcIndex) => {
                              const currentSchedule = weeklySchedules.find(ws =>
                                ws.mentor?._id === mentor._id &&
                                ws.schedule?.time?._id === timeSlot._id &&
                                ws.schedule?.sub_details?.day?._id === dayCombo._id &&
                                (!selectedBranch || ws.schedule?.sub_details?.branch?._id === selectedBranch)
                              );

                              const batches = currentSchedule?.schedule?.sub_details?.batch || [];
                              const subject = currentSchedule?.schedule?.sub_details?.subject || '';

                              return (
                                <React.Fragment key={dayCombo._id}>
                                  <td
                                    className="px-2 sm:px-4 py-3 sm:py-4 w-[150px] min-w-[150px] max-w-[150px] text-xs sm:text-sm text-gray-500 relative group drop-zone min-h-[50px] sm:min-h-[60px] border-2 border-dashed border-gray-200 hover:border-orange-300 transition-colors"
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    data-zone-id={`${mentorIndex}-${slotIndex}-${dayCombo._id}`}
                                  >
                                    {/* Batches */}
                                    {batches.length === 0 ? (
                                      <div className="flex flex-col items-center justify-center space-y-1 py-1">
                                        <span className="text-[10px] sm:text-xs text-gray-400">No batches assigned</span>
                                        {!currentSchedule?.schedule?.sub_details?.note && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (currentSchedule) {
                                                openNoteModal(currentSchedule._id, currentSchedule.schedule?.sub_details?.note || '');
                                              } else {
                                                openNoteModal(null, '', { mentor, timeSlot, dayCombo });
                                              }
                                            }}
                                            className="text-gray-400 hover:text-orange-500 transition-colors duration-200 mt-1 flex items-center space-x-1"
                                            title="Add Note"
                                          >
                                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            <span className="text-[10px]">Add Note</span>
                                          </button>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="space-y-1">
                                        {batches.map((batch, index) => (
                                          <div
                                            key={batch._id || index}
                                            onMouseEnter={(e) => handleBatchHover(e, batch._id)}
                                            onMouseLeave={handleBatchLeave}
                                            className={`text-white p-1.5 sm:p-2 rounded-md sm:rounded-lg shadow-md transition-all duration-200 text-[10px] sm:text-xs w-full flex items-center justify-between ${dcIndex % 2 === 0 ? 'bg-blue-500' : 'bg-green-500'}`}
                                          >
                                            <span className="truncate">{batch.batchName}</span>
                                            <button
                                              onClick={() => handleRemoveBatchClick(currentSchedule._id, batch._id, batch.batchName)}
                                              className="bg-red-600 text-white rounded-full w-3 h-3 sm:w-4 sm:h-4 flex items-center justify-center font-bold text-[10px] sm:text-xs leading-none transition-transform duration-200 hover:scale-110 flex-shrink-0 ml-1"
                                            >
                                              &times;
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {currentSchedule && (batches.length > 0 || currentSchedule.schedule?.sub_details?.note) && (
                                      <div className="mt-2 pt-1 border-t border-gray-100 flex items-center justify-between text-[10px] sm:text-xs">
                                        <div
                                          className={`text-gray-500 truncate max-w-[80%] ${currentSchedule.schedule?.sub_details?.note ? 'cursor-help font-medium' : ''}`}
                                          onMouseEnter={(e) => handleNoteHover(e, currentSchedule.schedule?.sub_details?.note)}
                                          onMouseLeave={handleNoteLeave}
                                        >
                                          {currentSchedule.schedule?.sub_details?.note ? (
                                            <span className="italic font-medium">
                                              📝 {currentSchedule.schedule.sub_details.note}
                                            </span>
                                          ) : (
                                            <span className="text-gray-300">Add note...</span>
                                          )}
                                        </div>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openNoteModal(currentSchedule._id, currentSchedule.schedule?.sub_details?.note || '');
                                          }}
                                          className="text-orange-500 hover:text-orange-600 font-medium transition ml-1"
                                        >
                                          Edit
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-2 sm:px-4 py-3 sm:py-4 w-[150px] min-w-[150px] whitespace-nowrap text-xs sm:text-sm text-gray-500 border-r border-gray-200">
                                    {/* Subject */}
                                    <select
                                      className="p-1 border border-gray-300 rounded-md shadow-sm text-[10px] sm:text-xs w-full"
                                      value={typeof subject === 'object' ? subject?._id : subject}
                                      onChange={(e) => {
                                        if (currentSchedule) {
                                          handleSubjectChange(currentSchedule._id, e.target.value)
                                        } else {
                                          handleCreateSubjectOnly(mentor, timeSlot, dayCombo.name, e.target.value)
                                        }
                                      }}
                                    >
                                      <option value="">Choose Subject</option>
                                      {modules.map(module => (
                                        <option key={module._id} value={module._id}>
                                          {module.moduleName}
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                </React.Fragment>
                              );
                            })}
                          </tr>
                        )
                      })}
                    </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <Toast />
        <Modal />

        {/* Hover Batch Modal */}
        {hoveredBatchInfo && (
          <div
            className="fixed z-[100] bg-white border border-gray-200 rounded-lg shadow-xl p-4 w-56 text-gray-800 pointer-events-none transform -translate-x-1/2 -translate-y-full"
            style={{
              top: `${hoveredBatchInfo.y - 10}px`,
              left: `${hoveredBatchInfo.x}px`,
            }}
          >
            <h4 className="font-bold border-b pb-2 mb-2 text-sm text-orange-600">{hoveredBatchInfo.batch.batchName} Interns</h4>
            <div className="max-h-48 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
              {hoveredBatchInfo.batch.interns?.length > 0 ? (
                <ul className="space-y-1">
                  {hoveredBatchInfo.batch.interns.map((intern, idx) => (
                    <li key={intern._id || idx} className="text-xs py-1 border-b border-gray-100 last:border-0">
                      <span className="font-medium text-gray-700">{intern.fullName}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-500 italic">No interns in this batch.</p>
              )}
            </div>
          </div>
        )}

        {/* Hover Note Modal */}
        {hoveredNoteInfo && (
          <div
            className="fixed z-[100] bg-white border border-gray-200 rounded-lg shadow-xl p-4 w-64 text-gray-800 pointer-events-none transform -translate-x-1/2 -translate-y-full"
            style={{
              top: `${hoveredNoteInfo.y - 10}px`,
              left: `${hoveredNoteInfo.x}px`,
            }}
          >
            <div className="flex items-center space-x-2 border-b pb-2 mb-2 text-orange-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <h4 className="font-bold text-xs sm:text-sm">Schedule Note</h4>
            </div>
            <p className="text-xs text-gray-600 font-medium whitespace-pre-wrap leading-relaxed break-words">
              {hoveredNoteInfo.note}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <style>
        {`
          .batches-container::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>
      <Toast />
      <Modal />
      {renderContent()}

      {/* Clone Confirmation Modal */}
      {showCloneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => !cloningSchedules && setShowCloneModal(false)}></div>
          <div className="relative bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all w-full max-w-md">
            <div className="bg-white px-6 pt-6 pb-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-orange-100">
                  <Icon path="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" className="w-5 h-5 text-orange-600" />
                </div>
                <h3 className="text-lg leading-6 font-semibold text-gray-900" id="modal-title">
                  Add Next Schedule
                </h3>
              </div>
              <div className="mt-2 space-y-4">
                <p className="text-sm text-gray-500">
                  This will clone the current week's schedule ({new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}) to a target week containing the date you select below.
                </p>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-600 uppercase">Select Target Date</label>
                  <input
                    type="date"
                    disabled={cloningSchedules}
                    className="w-full p-2.5 text-sm border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                    value={cloneTargetDate}
                    onChange={(e) => setCloneTargetDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end items-center gap-3 border-t border-gray-100">
              <button
                type="button"
                disabled={cloningSchedules}
                className="inline-flex justify-center items-center rounded-lg border border-gray-300 px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none transition disabled:opacity-50"
                onClick={() => setShowCloneModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={cloningSchedules || !cloneTargetDate}
                className="inline-flex justify-center items-center rounded-lg border border-transparent px-4 py-2 bg-orange-500 text-sm font-medium text-white hover:bg-orange-600 focus:outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleCloneSchedule}
              >
                {cloningSchedules ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating...
                  </>
                ) : (
                  'Create Schedule'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Batch Confirmation Modal */}
      {showRemoveBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={cancelRemoveBatch}></div>
          <div className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all w-full max-w-lg">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-semibold text-gray-900" id="modal-title">
                    Remove Batch from Schedule
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to remove the batch <strong className="text-gray-900">"{removingBatchInfo?.batchName}"</strong> from this schedule slot?
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-end items-center gap-3">
              <button
                type="button"
                className="inline-flex justify-center items-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none transition sm:text-sm h-fit"
                onClick={cancelRemoveBatch}
              >
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none transition sm:text-sm h-fit"
                onClick={confirmRemoveBatch}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note Editing Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => !savingNote && closeNoteModal()}></div>
          <div className="relative bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all w-full max-w-md">
            <div className="bg-white px-6 pt-6 pb-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-orange-100">
                  <svg className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h3 className="text-lg leading-6 font-semibold text-gray-900" id="modal-title">
                  Edit Schedule Note
                </h3>
              </div>
              <div className="mt-2 space-y-3">
                <p className="text-sm text-gray-500">
                  Add a note to this weekly schedule box (e.g. batch instructions, mentor changes, or topics coverage reminder).
                </p>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-600 uppercase">Note details</label>
                  <textarea
                    disabled={savingNote}
                    rows={4}
                    className="w-full p-2.5 text-sm border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition resize-none"
                    placeholder="Enter notes for this schedule..."
                    value={noteValue}
                    onChange={(e) => setNoteValue(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end items-center gap-3 border-t border-gray-100">
              <button
                type="button"
                disabled={savingNote}
                className="inline-flex justify-center items-center rounded-lg border border-gray-300 px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none transition disabled:opacity-50"
                onClick={closeNoteModal}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingNote}
                className="inline-flex justify-center items-center rounded-lg border border-transparent px-4 py-2 bg-orange-500 text-sm font-medium text-white hover:bg-orange-600 focus:outline-none transition disabled:opacity-50"
                onClick={handleSaveNote}
              >
                {savingNote ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={cancelDelete}></div>
          <div className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all w-full max-w-lg">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Delete Schedule
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this schedule document? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-end items-center gap-3">
                <button
                  type="button"
                  className="inline-flex justify-center items-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm h-fit"
                  onClick={cancelDelete}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm h-fit"
                  onClick={confirmDeleteSchedule}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
      )}
    </>
  )
}
