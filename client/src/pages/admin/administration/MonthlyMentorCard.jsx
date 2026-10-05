import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Navbar } from '../../../components/admin/AdminNavBar';
import useAuth from '../../../hooks/useAuth';
import AdminService from '../../../services/admin-api-service/AdminService';

const MonthlyMenorCard = () => {
    const { 
        getInternByIdData, 
        getMonthlyCardData, 
        postMonthlyCardData, 
        putMonthlyCardData, 
        deleteMonthlyCardData 
    } = AdminService();
    const { auth } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const internId = queryParams.get('internId');

    const [internDetails, setInternDetails] = useState(null);
    const [monthlyCards, setMonthlyCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCardId, setEditingCardId] = useState(null);

    const [stats, setStats] = useState({
        avgTechnical: 0,
        avgAptitude: 0,
        avgLogical: 0,
        avgCommunication: 0,
        attendancePercent: 0
    });

    const [formData, setFormData] = useState({
        month: 1,
        isAptitude: false,
        aptitude: '',
        aptitude_marks: 0,
        aptitude_total: 100,
        isLogical: false,
        logical: '',
        logical_marks: 0,
        logical_total: 100,
        isTechnical: false,
        technical: '',
        technical_marks: 0,
        technical_total: 100,
        isCommunication: false,
        communication: '',
        communication_marks: 0,
        communication_total: 100,
        totalDays: 0,
        attend: '',
        note: ''
    });

    const calculateStats = (cards) => {
        if (!cards || !cards.length) {
            setStats({
                avgTechnical: 0,
                avgAptitude: 0,
                avgLogical: 0,
                avgCommunication: 0,
                attendancePercent: 0
            });
            return;
        }

        const techCards = cards.filter(c => c.isTechnical && c.technical_total > 0);
        const avgTechnical = techCards.length
            ? Math.round(techCards.reduce((acc, c) => acc + (Number(c.technical_marks) || 0), 0) / techCards.length)
            : 0;

        const aptCards = cards.filter(c => c.isAptitude && c.aptitude_total > 0);
        const avgAptitude = aptCards.length
            ? Math.round(aptCards.reduce((acc, c) => acc + (Number(c.aptitude_marks) || 0), 0) / aptCards.length)
            : 0;

        const logCards = cards.filter(c => c.isLogical && c.logical_total > 0);
        const avgLogical = logCards.length
            ? Math.round(logCards.reduce((acc, c) => acc + (Number(c.logical_marks) || 0), 0) / logCards.length)
            : 0;

        const commCards = cards.filter(c => c.isCommunication && c.communication_total > 0);
        const avgCommunication = commCards.length
            ? Math.round(commCards.reduce((acc, c) => acc + (Number(c.communication_marks) || 0), 0) / commCards.length)
            : 0;

        let totalAttended = 0;
        let totalPossible = 0;
        cards.forEach(c => {
            const attendVal = Number(c.attend) || 0;
            const possibleVal = Number(c.totalDays) || 0;
            if (possibleVal > 0) {
                totalAttended += attendVal;
                totalPossible += possibleVal;
            }
        });
        const attendancePercent = totalPossible > 0 ? Math.round((totalAttended / totalPossible) * 100) : 0;

        setStats({
            avgTechnical,
            avgAptitude,
            avgLogical,
            avgCommunication,
            attendancePercent
        });
    };

    const fetchInternAndCards = async () => {
        if (!internId) return;
        setLoading(true);
        try {
            const response = await getMonthlyCardData(internId);
            const cards = response?.data?.cards || [];
            const intern = response?.data?.intern;

            setMonthlyCards(cards);
            calculateStats(cards);

            if (intern) {
                setInternDetails(intern);
            } else {
                const fallbackIntern = await getInternByIdData(internId);
                setInternDetails(fallbackIntern?.data || fallbackIntern);
            }
        } catch (error) {
            console.error("Error fetching monthly mentor card data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInternAndCards();
    }, [internId]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleAddNew = () => {
        setEditingCardId(null);
        setFormData({
            month: (monthlyCards.length > 0 ? Math.max(...monthlyCards.map(c => Number(c.month) || 0)) + 1 : 1),
            isAptitude: false,
            aptitude: '',
            aptitude_marks: 0,
            aptitude_total: 100,
            isLogical: false,
            logical: '',
            logical_marks: 0,
            logical_total: 100,
            isTechnical: false,
            technical: '',
            technical_marks: 0,
            technical_total: 100,
            isCommunication: false,
            communication: '',
            communication_marks: 0,
            communication_total: 100,
            totalDays: 0,
            attend: '',
            note: ''
        });
        setIsModalOpen(true);
    };

    const handleEdit = (card) => {
        setEditingCardId(card._id);
        setFormData({
            month: card.month || 1,
            isAptitude: card.isAptitude || false,
            aptitude: card.aptitude || '',
            aptitude_marks: card.aptitude_marks ?? 0,
            aptitude_total: card.aptitude_total ?? 100,
            isLogical: card.isLogical || false,
            logical: card.logical || '',
            logical_marks: card.logical_marks ?? 0,
            logical_total: card.logical_total ?? 100,
            isTechnical: card.isTechnical || false,
            technical: card.technical || '',
            technical_marks: card.technical_marks ?? 0,
            technical_total: card.technical_total ?? 100,
            isCommunication: card.isCommunication || false,
            communication: card.communication || '',
            communication_marks: card.communication_marks ?? 0,
            communication_total: card.communication_total ?? 100,
            totalDays: card.totalDays ?? 0,
            attend: card.attend || '',
            note: card.note || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (cardId) => {
        if (!window.confirm("Are you sure you want to delete this monthly mentor card entry?")) return;
        try {
            await deleteMonthlyCardData(cardId);
            fetchInternAndCards();
        } catch (error) {
            console.error("Error deleting monthly card:", error);
            alert(error?.response?.data?.message || "Failed to delete monthly card");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!internId) {
            alert("Intern ID is missing. Please navigate to this page from the student list.");
            return;
        }

        if (!formData.month) {
            alert("Please provide a valid month number.");
            return;
        }

        const submissionData = {
            ...formData,
            month: Number(formData.month),
            aptitude_marks: Number(formData.aptitude_marks) || 0,
            aptitude_total: Number(formData.aptitude_total) || 0,
            logical_marks: Number(formData.logical_marks) || 0,
            logical_total: Number(formData.logical_total) || 0,
            technical_marks: Number(formData.technical_marks) || 0,
            technical_total: Number(formData.technical_total) || 0,
            communication_marks: Number(formData.communication_marks) || 0,
            communication_total: Number(formData.communication_total) || 0,
            totalDays: Number(formData.totalDays) || 0,
            internId: internId
        };

        try {
            if (editingCardId) {
                await putMonthlyCardData(editingCardId, submissionData);
            } else {
                await postMonthlyCardData(submissionData);
            }
            setIsModalOpen(false);
            setEditingCardId(null);
            fetchInternAndCards();
        } catch (error) {
            console.error("Error saving monthly mentor card:", error);
            alert(error?.response?.data?.message || "Error saving monthly card data");
        }
    };

    return (
        <>
            <Navbar headData={internDetails?.fullName ? `${internDetails.fullName}'s Monthly Card` : "Monthly Mentor Card"} activeTab="Monthly Mentor Card" />

            <div className="min-h-screen bg-gray-50/50 text-gray-700 p-6 font-sans rounded-2xl">
                {/* Header Section */}
                <div className="bg-white rounded-2xl p-6 mb-6 border border-gray-100 shadow-sm flex justify-between items-start">
                    <div className="flex gap-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                            {internDetails?.fullName
                                ? internDetails.fullName.split(' ').map(n => n[0]).join('').toUpperCase()
                                : '...'}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-3">{internDetails?.fullName || 'Loading...'}</h1>
                            <div className="flex flex-wrap gap-2">
                                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full border border-indigo-100">
                                    {internDetails?.course?.courseName || 'COURSE'}
                                </span>
                                <span className="px-3 py-1 bg-teal-50 text-teal-600 text-xs font-bold rounded-full border border-teal-100">
                                    {internDetails?.batch?.batchName || internDetails?.batch || 'BATCH'}
                                </span>
                                <span className="px-3 py-1 bg-gray-50 text-gray-600 text-xs font-bold rounded-full border border-gray-150">
                                    {internDetails?.regNo || internDetails?.admissionNumber || 'STU-001'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                        <button
                            onClick={() => navigate(`/menor-card?internId=${internId}`)}
                            className="bg-white hover:bg-gray-50 text-indigo-600 border border-indigo-200 font-bold py-2.5 px-4 rounded-lg flex items-center transition-all shadow-sm text-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Weekly Card
                        </button>
                        <button
                            onClick={handleAddNew}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-lg flex items-center transition-colors shadow-sm text-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Add Monthly Data
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                    <StatCard title="AVG TECHNICAL" value={stats.avgTechnical} total="100" color="border-indigo-500" />
                    <StatCard title="AVG APTITUDE" value={stats.avgAptitude} total="100" color="border-teal-500" />
                    <StatCard title="AVG LOGICAL" value={stats.avgLogical} total="100" color="border-purple-500" />
                    <StatCard title="AVG COMMUNICATION" value={stats.avgCommunication} total="100" color="border-blue-500" />
                    <StatCard title="ATTENDANCE" value={stats.attendancePercent} total="%" sub="Overall" color="border-orange-500" />
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse min-w-max">
                            <thead>
                                <tr className="text-[10px] text-gray-400 uppercase tracking-widest border-b border-gray-150 bg-gray-50/50">
                                    <th className="p-4">Month</th>
                                    <th className="p-4">Aptitude</th>
                                    <th className="p-4">Logical</th>
                                    <th className="p-4">Technical</th>
                                    <th className="p-4">Communication</th>
                                    <th className="p-4">Attendance</th>
                                    <th className="p-4">Mentor Note</th>
                                    <th className="p-4">Mentor</th>
                                    <th className="p-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {monthlyCards.length > 0 ? (
                                    (() => {
                                        const sortedCards = [...monthlyCards].sort((a, b) => Number(a.month) - Number(b.month));
                                        return sortedCards.map((row, idx) => (
                                            <tr key={row._id || idx} className="border-b border-gray-150 hover:bg-gray-50/50 transition-colors group">
                                                <td className="p-4 font-bold text-indigo-600 border-r border-gray-150 whitespace-nowrap">
                                                    Month {row.month}
                                                </td>

                                                {/* Aptitude */}
                                                <td className="p-4">
                                                    {row.isAptitude ? (
                                                        <div>
                                                            {row.aptitude && <div className="text-xs text-gray-500 mb-1 max-w-[150px] truncate" title={row.aptitude}>{row.aptitude}</div>}
                                                            <ScoreBadge score={`${row.aptitude_marks ?? 0}/${row.aptitude_total ?? 100}`} color="bg-teal-50 text-teal-700 border border-teal-200/50" />
                                                        </div>
                                                    ) : <span className="text-gray-400">—</span>}
                                                </td>

                                                {/* Logical */}
                                                <td className="p-4">
                                                    {row.isLogical ? (
                                                        <div>
                                                            {row.logical && <div className="text-xs text-gray-500 mb-1 max-w-[150px] truncate" title={row.logical}>{row.logical}</div>}
                                                            <ScoreBadge score={`${row.logical_marks ?? 0}/${row.logical_total ?? 100}`} color="bg-purple-50 text-purple-700 border border-purple-200/50" />
                                                        </div>
                                                    ) : <span className="text-gray-400">—</span>}
                                                </td>

                                                {/* Technical */}
                                                <td className="p-4">
                                                    {row.isTechnical ? (
                                                        <div>
                                                            {row.technical && <div className="text-xs text-gray-500 mb-1 max-w-[150px] truncate" title={row.technical}>{row.technical}</div>}
                                                            <ScoreBadge score={`${row.technical_marks ?? 0}/${row.technical_total ?? 100}`} color="bg-indigo-50 text-indigo-700 border border-indigo-200/50" />
                                                        </div>
                                                    ) : <span className="text-gray-400">—</span>}
                                                </td>

                                                {/* Communication */}
                                                <td className="p-4">
                                                    {row.isCommunication ? (
                                                        <div>
                                                            {row.communication && <div className="text-xs text-gray-500 mb-1 max-w-[150px] truncate" title={row.communication}>{row.communication}</div>}
                                                            <ScoreBadge score={`${row.communication_marks ?? 0}/${row.communication_total ?? 100}`} color="bg-blue-50 text-blue-700 border border-blue-200/50" />
                                                        </div>
                                                    ) : <span className="text-gray-400">—</span>}
                                                </td>

                                                {/* Attendance */}
                                                <td className="p-4 text-gray-700 whitespace-nowrap">
                                                    <span className="font-semibold text-gray-900">{row.attend || 0}</span> / {row.totalDays || 0} Days
                                                </td>

                                                {/* Note */}
                                                <td className="p-4 text-gray-600 max-w-[200px] truncate" title={row.note}>
                                                    {row.note || <span className="text-gray-400">—</span>}
                                                </td>

                                                {/* Mentor */}
                                                <td className="p-4 font-semibold text-indigo-600 whitespace-nowrap">
                                                    {row.mentorId?.fullName || '-'}
                                                </td>

                                                {/* Actions */}
                                                <td className="p-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleEdit(row)}
                                                            className="px-3 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-all text-[10px] font-bold"
                                                            title="Edit Entry"
                                                        >
                                                            EDIT
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(row._id)}
                                                            className="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg border border-red-200 transition-all text-[10px] font-bold"
                                                            title="Delete Entry"
                                                        >
                                                            DELETE
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ));
                                    })()
                                ) : (
                                    <tr>
                                        <td colSpan="9" className="p-10 text-center text-gray-500">
                                            {loading ? 'Loading data...' : 'No monthly card data available for this intern.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Add / Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-gray-150 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] shadow-2xl">
                        <div className="p-6 border-b border-gray-150 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {editingCardId ? 'Edit Monthly Mentor Card' : 'Add Monthly Mentor Card'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors text-xl font-bold">
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">

                            {/* Month & Attendance Header */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Month Number</label>
                                    <input 
                                        type="number" 
                                        name="month" 
                                        value={formData.month} 
                                        onChange={handleInputChange} 
                                        min="1" 
                                        required 
                                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:border-indigo-500 h-[42px]" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Days Attended</label>
                                    <input 
                                        type="text" 
                                        name="attend" 
                                        value={formData.attend} 
                                        onChange={handleInputChange} 
                                        placeholder="e.g. 22"
                                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:border-indigo-500 h-[42px]" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Total Days in Month</label>
                                    <input 
                                        type="number" 
                                        name="totalDays" 
                                        value={formData.totalDays} 
                                        onChange={handleInputChange} 
                                        min="0"
                                        placeholder="e.g. 26"
                                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:border-indigo-500 h-[42px]" 
                                    />
                                </div>
                            </div>

                            {/* 1. Aptitude Section */}
                            <div className="border border-gray-200 rounded-xl p-4">
                                <label className="flex items-center text-gray-800 font-bold mb-2 cursor-pointer select-none">
                                    <input 
                                        type="checkbox" 
                                        name="isAptitude" 
                                        checked={formData.isAptitude} 
                                        onChange={handleInputChange} 
                                        className="mr-3 w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-0 focus:ring-offset-0" 
                                    />
                                    Include Aptitude Evaluation
                                </label>
                                {formData.isAptitude && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 pt-3 border-t border-gray-150">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Topic / Description</label>
                                            <input 
                                                type="text" 
                                                name="aptitude" 
                                                value={formData.aptitude} 
                                                onChange={handleInputChange} 
                                                placeholder="Aptitude topic / test"
                                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800 text-sm h-[40px]" 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Marks Obtained</label>
                                            <input 
                                                type="number" 
                                                name="aptitude_marks" 
                                                value={formData.aptitude_marks} 
                                                onChange={handleInputChange} 
                                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800 text-sm h-[40px]" 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Total Marks</label>
                                            <input 
                                                type="number" 
                                                name="aptitude_total" 
                                                value={formData.aptitude_total} 
                                                onChange={handleInputChange} 
                                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800 text-sm h-[40px]" 
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 2. Logical Section */}
                            <div className="border border-gray-200 rounded-xl p-4">
                                <label className="flex items-center text-gray-800 font-bold mb-2 cursor-pointer select-none">
                                    <input 
                                        type="checkbox" 
                                        name="isLogical" 
                                        checked={formData.isLogical} 
                                        onChange={handleInputChange} 
                                        className="mr-3 w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-0 focus:ring-offset-0" 
                                    />
                                    Include Logical Reasoning Evaluation
                                </label>
                                {formData.isLogical && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 pt-3 border-t border-gray-150">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Topic / Description</label>
                                            <input 
                                                type="text" 
                                                name="logical" 
                                                value={formData.logical} 
                                                onChange={handleInputChange} 
                                                placeholder="Logical reasoning topic / test"
                                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800 text-sm h-[40px]" 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Marks Obtained</label>
                                            <input 
                                                type="number" 
                                                name="logical_marks" 
                                                value={formData.logical_marks} 
                                                onChange={handleInputChange} 
                                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800 text-sm h-[40px]" 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Total Marks</label>
                                            <input 
                                                type="number" 
                                                name="logical_total" 
                                                value={formData.logical_total} 
                                                onChange={handleInputChange} 
                                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800 text-sm h-[40px]" 
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 3. Technical Section */}
                            <div className="border border-gray-200 rounded-xl p-4">
                                <label className="flex items-center text-gray-800 font-bold mb-2 cursor-pointer select-none">
                                    <input 
                                        type="checkbox" 
                                        name="isTechnical" 
                                        checked={formData.isTechnical} 
                                        onChange={handleInputChange} 
                                        className="mr-3 w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-0 focus:ring-offset-0" 
                                    />
                                    Include Technical Evaluation
                                </label>
                                {formData.isTechnical && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 pt-3 border-t border-gray-150">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Topic / Description</label>
                                            <input 
                                                type="text" 
                                                name="technical" 
                                                value={formData.technical} 
                                                onChange={handleInputChange} 
                                                placeholder="Technical topic / test"
                                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800 text-sm h-[40px]" 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Marks Obtained</label>
                                            <input 
                                                type="number" 
                                                name="technical_marks" 
                                                value={formData.technical_marks} 
                                                onChange={handleInputChange} 
                                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800 text-sm h-[40px]" 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Total Marks</label>
                                            <input 
                                                type="number" 
                                                name="technical_total" 
                                                value={formData.technical_total} 
                                                onChange={handleInputChange} 
                                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800 text-sm h-[40px]" 
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 4. Communication Section */}
                            <div className="border border-gray-200 rounded-xl p-4">
                                <label className="flex items-center text-gray-800 font-bold mb-2 cursor-pointer select-none">
                                    <input 
                                        type="checkbox" 
                                        name="isCommunication" 
                                        checked={formData.isCommunication} 
                                        onChange={handleInputChange} 
                                        className="mr-3 w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-0 focus:ring-offset-0" 
                                    />
                                    Include Communication Evaluation
                                </label>
                                {formData.isCommunication && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 pt-3 border-t border-gray-150">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Topic / Description</label>
                                            <input 
                                                type="text" 
                                                name="communication" 
                                                value={formData.communication} 
                                                onChange={handleInputChange} 
                                                placeholder="Communication topic / presentation"
                                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800 text-sm h-[40px]" 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Marks Obtained</label>
                                            <input 
                                                type="number" 
                                                name="communication_marks" 
                                                value={formData.communication_marks} 
                                                onChange={handleInputChange} 
                                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800 text-sm h-[40px]" 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Total Marks</label>
                                            <input 
                                                type="number" 
                                                name="communication_total" 
                                                value={formData.communication_total} 
                                                onChange={handleInputChange} 
                                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800 text-sm h-[40px]" 
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Note Section */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Mentor Note & Feedback</label>
                                <textarea 
                                    name="note" 
                                    value={formData.note} 
                                    onChange={handleInputChange} 
                                    rows="3" 
                                    placeholder="Enter overall monthly performance review and recommendations..."
                                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-150">
                                <button 
                                    type="button" 
                                    onClick={() => setIsModalOpen(false)} 
                                    className="px-5 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors font-medium text-sm"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors font-medium text-sm shadow-sm"
                                >
                                    Save Monthly Data
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

const StatCard = ({ title, value, total, sub, color }) => (
    <div className={`bg-white p-5 rounded-2xl border-b-4 ${color} border-x border-t border-gray-150 shadow-sm flex flex-col justify-between`}>
        <p className="text-[10px] font-bold text-gray-400 tracking-wider mb-2 flex items-center justify-between">
            <span>{title}</span>
            {title.includes('AVG') && <span className="bg-indigo-100 text-indigo-700 font-semibold px-1.5 py-0.5 rounded text-[9px]">AVG</span>}
        </p>
        <div className="flex items-baseline gap-1 mb-1">
            <span className="text-3xl font-bold text-gray-900">{value}</span>
            {total && <span className="text-gray-400 text-sm font-semibold">{total === '%' ? '%' : `/ ${total}`}</span>}
        </div>
        {sub && <p className="text-[11px] text-gray-400 italic">{sub}</p>}
    </div>
);

const ScoreBadge = ({ score, color }) => (
    <div className={`px-2.5 py-0.5 rounded-md inline-flex items-center justify-center font-bold text-xs border ${color}`}>
        {score}
    </div>
);

export default MonthlyMenorCard;