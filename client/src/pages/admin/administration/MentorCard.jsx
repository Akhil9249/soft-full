import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Navbar } from '../../../components/admin/AdminNavBar';
import useAuth from '../../../hooks/useAuth';
import AdminService from '../../../services/admin-api-service/AdminService';

const MenorCard = () => {
    const { getInternByIdData, getMentorCardData, postMentorCardData, putMentorCardData } = AdminService();
    const { auth } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const internId = queryParams.get('internId');

    const [internDetails, setInternDetails] = useState(null);
    const [mentorCards, setMentorCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCardId, setEditingCardId] = useState(null);

    const [stats, setStats] = useState({
        avgTestScore: 0,
        avgProjectScore: 0,
        attendancePercent: 0
    });

    const [formData, setFormData] = useState({
        week: 1,
        startDate: '',
        endDate: '',
        subject: '',
        topic: '',
        isTest: false,
        test_name: '',
        test_marks: 0,
        test_total: 100,
        isProject: false,
        project_name: '',
        project_marks: 0,
        project_total: 100,
        isSoftSkill: false,
        totalDays: 0,
        attend: '',
        note: ''
    });

    const calculateStats = (cards) => {
        if (!cards || !cards.length) {
            setStats({
                avgTestScore: 0,
                avgProjectScore: 0,
                attendancePercent: 0
            });
            return;
        }

        const testCards = cards.filter(c => c.isTest);
        const avgTestScore = testCards.length
            ? Math.round(testCards.reduce((acc, c) => {
                const total = Number(c.test_total) > 0 ? Number(c.test_total) : 100;
                const marks = Number(c.test_marks) || 0;
                return acc + (marks / total) * 100;
            }, 0) / testCards.length)
            : 0;

        const projectCards = cards.filter(c => c.isProject);
        const avgProjectScore = projectCards.length
            ? Math.round(projectCards.reduce((acc, c) => {
                const total = Number(c.project_total) > 0 ? Number(c.project_total) : 100;
                const marks = Number(c.project_marks) || 0;
                return acc + (marks / total) * 100;
            }, 0) / projectCards.length)
            : 0;

        // Attendance parsing
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
            avgTestScore,
            avgProjectScore,
            attendancePercent
        });
    };

    const fetchInternAndCards = async () => {
        if (!internId) return;
        setLoading(true);
        try {
            const response = await getMentorCardData(internId);
            const cards = response?.data?.cards || [];
            const intern = response?.data?.intern;

            setMentorCards(cards);
            calculateStats(cards);

            if (intern) {
                setInternDetails(intern);
            } else {
                const fallbackIntern = await getInternByIdData(internId);
                setInternDetails(fallbackIntern?.data || fallbackIntern);
            }
        } catch (error) {
            console.error("Error fetching mentor card data:", error);
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

    const handleEdit = (card) => {
        setEditingCardId(card._id);
        setFormData({
            week: card.week || 1,
            startDate: card.startDate ? new Date(card.startDate).toISOString().split('T')[0] : '',
            endDate: card.endDate ? new Date(card.endDate).toISOString().split('T')[0] : '',
            subject: card.subject?._id || card.subject || '', // handle populated object
            topic: card.topic?._id || card.topic || '', // handle populated object
            isTest: card.isTest || false,
            test_name: card.test_name || '',
            test_marks: card.test_marks || 0,
            test_total: card.test_total || 100,
            isProject: card.isProject || false,
            project_name: card.project_name || '',
            project_marks: card.project_marks || 0,
            project_total: card.project_total || 100,
            isSoftSkill: card.isSoftSkill || false,
            totalDays: card.totalDays || 0,
            attend: card.attend || '',
            note: card.note || ''
        });
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setEditingCardId(null);
        setFormData({
            week: 1,
            startDate: '',
            endDate: '',
            subject: '',
            topic: '',
            isTest: false,
            test_name: '',
            test_marks: 0,
            test_total: 100,
            isProject: false,
            project_name: '',
            project_marks: 0,
            project_total: 100,
            isSoftSkill: false,
            totalDays: 0,
            attend: '',
            note: ''
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!internId) {
            alert("Intern ID is missing. Please navigate to this page from the student list.");
            return;
        }

        if (!formData.week) {
            alert("Please select a week.");
            return;
        }

        const submissionData = {
            ...formData,
            internId: internId
        };

        // Convert empty subject/topic to undefined to avoid ObjectId casting errors
        if (!submissionData.subject) delete submissionData.subject;
        if (!submissionData.topic) delete submissionData.topic;

        try {
            if (editingCardId) {
                await putMentorCardData(editingCardId, submissionData);
            } else {
                await postMentorCardData(submissionData);
            }
            setIsModalOpen(false);
            setEditingCardId(null);
            fetchInternAndCards();
        } catch (error) {
            console.error("Error saving mentor card:", error);
            alert(error?.response?.data?.message || "Error saving data");
        }
    };

    return (
        <>
            <Navbar headData={internDetails?.fullName ? `${internDetails.fullName}'s Card` : "Menor Card"} activeTab="Menor Card" />

            <div className="min-h-screen bg-gray-50/50 text-gray-700 p-3.5 sm:p-6 font-sans rounded-2xl">
                {/* Header Section */}
                <div className="bg-white rounded-2xl p-4 sm:p-6 mb-6 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 sm:gap-6 min-w-0">
                        <div className="w-14 h-14 sm:w-20 sm:h-20 shrink-0 aspect-square bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-xl sm:text-3xl font-bold text-white shadow-md sm:shadow-lg">
                            {internDetails?.fullName
                                ? internDetails.fullName.split(' ').map(n => n[0]).join('').toUpperCase()
                                : '...'}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-1.5 sm:mb-2 truncate">{internDetails?.fullName || 'Loading...'}</h1>
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-indigo-50 text-indigo-600 text-[11px] sm:text-xs font-bold rounded-full border border-indigo-100">FULL TIME</span>
                                <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-teal-50 text-teal-600 text-[11px] sm:text-xs font-bold rounded-full border border-teal-100">{internDetails?.batch || 'BATCH'}</span>
                                <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-gray-50 text-gray-600 text-[11px] sm:text-xs font-bold rounded-full border border-gray-150">{internDetails?.admissionNumber || 'STU-001'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                        <button
                            onClick={() => navigate(`/monthly-menor-card?internId=${internId}`)}
                            className="whitespace-nowrap flex-1 sm:flex-none justify-center bg-white hover:bg-gray-50 text-indigo-600 border border-indigo-200 font-bold py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg flex items-center transition-all shadow-xs text-xs sm:text-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 shrink-0 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>Monthly Card</span>
                        </button>
                        <button
                            onClick={handleAddNew}
                            className="whitespace-nowrap flex-1 sm:flex-none justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg flex items-center transition-colors shadow-xs text-xs sm:text-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            <span>Add Data</span>
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 mb-6">
                    <StatCard title="AVG TEST SCORE" value={stats.avgTestScore} total="100" color="border-teal-500" className="col-span-2 md:col-span-1" />
                    <StatCard title="AVG PROJECT SCORE" value={stats.avgProjectScore} total="100" color="border-purple-500" />
                    <StatCard title="ATTENDANCE" value={stats.attendancePercent} total="%" sub="Percentage" color="border-orange-500" />
                </div>

                {/* Evaluations Section: Table on Desktop (md+), Cards on Mobile (< md) */}
                
                {/* Desktop Table View (md and above) */}
                <div className="hidden md:block bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse min-w-max">
                            <thead>
                                <tr className="text-[10px] text-gray-400 uppercase tracking-widest border-b border-gray-150 bg-gray-50/50">
                                    <th className="p-4">Week</th>
                                    <th className="p-4">Dates</th>
                                    <th className="p-4">Subject</th>
                                    <th className="p-4">Topic</th>
                                    <th className="p-4">Test</th>
                                    <th className="p-4">Project</th>
                                    <th className="p-4">Soft Skill</th>
                                    <th className="p-4">Attendance</th>
                                    <th className="p-4">Mentor</th>
                                    <th className="p-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {mentorCards.length > 0 ? (
                                    (() => {
                                        const sortedCards = [...mentorCards].sort((a, b) => Number(a.week) - Number(b.week));
                                        return sortedCards.map((row, idx) => (
                                            <tr key={idx} className="border-b border-gray-150 hover:bg-gray-50/50 transition-colors group">
                                                <td className="p-4 font-bold text-indigo-600 border-r border-gray-150">
                                                    W{row.week}
                                                </td>
                                                <td className="p-4 text-xs text-gray-500 whitespace-nowrap">
                                                    {row.startDate ? new Date(row.startDate).toLocaleDateString('en-GB') : '-'} <br />
                                                    to <br />
                                                    {row.endDate ? new Date(row.endDate).toLocaleDateString('en-GB') : '-'}
                                                </td>
                                                <td className="p-4 text-gray-800 font-medium">{row.subject || '-'}</td>
                                                <td className="p-4 text-gray-800">{row.topic || '-'}</td>

                                                <td className="p-4">
                                                    {row.isTest && row.test_name ? (
                                                        <div>
                                                            <div className="text-xs text-gray-500 mb-1">{row.test_name}</div>
                                                            <ScoreBadge score={`${row.test_marks}/${row.test_total}`} color="bg-yellow-50 text-yellow-600 border border-yellow-200/50" />
                                                        </div>
                                                    ) : <span className="text-gray-400">—</span>}
                                                </td>

                                                <td className="p-4">
                                                    {row.isProject && row.project_name ? (
                                                        <div>
                                                            <div className="text-xs text-gray-500 mb-1">{row.project_name}</div>
                                                            <ScoreBadge score={`${row.project_marks}/${row.project_total}`} color="bg-blue-50 text-blue-600 border border-blue-200/50" />
                                                        </div>
                                                    ) : <span className="text-gray-400">—</span>}
                                                </td>

                                                <td className="p-4 font-semibold">
                                                    {row.isSoftSkill ? <span className="text-green-600">Yes</span> : <span className="text-gray-400">No</span>}
                                                </td>

                                                <td className="p-4 text-gray-700">
                                                    {row.attend || 0} / {row.totalDays || 0}
                                                </td>

                                                <td className="p-4 font-semibold text-indigo-600">
                                                    {row.mentorId?.fullName || '-'}
                                                </td>

                                                <td className="p-4 align-middle">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleEdit(row)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50/70 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 border border-indigo-200 hover:border-indigo-300 rounded-lg shadow-xs hover:shadow-sm transition-all text-xs font-semibold tracking-wide active:scale-95"
                                                            title="Edit Entry"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                            </svg>
                                                            <span>Edit</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ));
                                    })()
                                ) : (
                                    <tr>
                                        <td colSpan="10" className="p-10 text-center text-gray-500">No data available for this intern.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile Card View (Below md) */}
                <div className="block md:hidden space-y-3.5">
                    {mentorCards.length > 0 ? (
                        (() => {
                            const sortedCards = [...mentorCards].sort((a, b) => Number(a.week) - Number(b.week));
                            return sortedCards.map((row, idx) => (
                                <div
                                    key={row._id || idx}
                                    className="bg-white rounded-2xl p-4 border border-gray-150 shadow-xs space-y-3"
                                >
                                    {/* Top Row: Week Badge & Dates */}
                                    <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 font-extrabold text-sm rounded-lg border border-indigo-100">
                                                W{row.week}
                                            </span>
                                            <span className="text-xs font-semibold text-gray-700">Week {row.week}</span>
                                        </div>
                                        <div className="text-[11px] text-gray-500 font-medium text-right">
                                            {row.startDate ? new Date(row.startDate).toLocaleDateString('en-GB') : '-'}
                                            {' to '}
                                            {row.endDate ? new Date(row.endDate).toLocaleDateString('en-GB') : '-'}
                                        </div>
                                    </div>

                                    {/* Subject & Topic */}
                                    <div>
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Subject & Topic</div>
                                        <div className="text-sm font-bold text-gray-900 mt-0.5">{row.subject || '-'}</div>
                                        {row.topic && <div className="text-xs text-gray-600 mt-0.5">{row.topic}</div>}
                                    </div>

                                    {/* Scores: Test & Project */}
                                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                                        {/* Test */}
                                        <div className="bg-gray-50/70 p-2.5 rounded-xl border border-gray-150/70">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Test</span>
                                            {row.isTest && row.test_name ? (
                                                <div>
                                                    <div className="text-xs text-gray-700 font-medium truncate mb-1" title={row.test_name}>{row.test_name}</div>
                                                    <ScoreBadge score={`${row.test_marks}/${row.test_total}`} color="bg-yellow-50 text-yellow-700 border border-yellow-200/50" />
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400">—</span>
                                            )}
                                        </div>

                                        {/* Project */}
                                        <div className="bg-gray-50/70 p-2.5 rounded-xl border border-gray-150/70">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Project</span>
                                            {row.isProject && row.project_name ? (
                                                <div>
                                                    <div className="text-xs text-gray-700 font-medium truncate mb-1" title={row.project_name}>{row.project_name}</div>
                                                    <ScoreBadge score={`${row.project_marks}/${row.project_total}`} color="bg-blue-50 text-blue-700 border border-blue-200/50" />
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400">—</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Soft Skill & Attendance */}
                                    <div className="grid grid-cols-2 gap-2.5 text-xs pt-1">
                                        <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50/50 border border-gray-100">
                                            <span className="text-gray-500 font-medium">Soft Skill:</span>
                                            <span className={`font-bold ${row.isSoftSkill ? 'text-green-600' : 'text-gray-400'}`}>
                                                {row.isSoftSkill ? 'Yes' : 'No'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50/50 border border-gray-100">
                                            <span className="text-gray-500 font-medium">Attendance:</span>
                                            <span className="font-bold text-gray-900">{row.attend || 0} / {row.totalDays || 0}</span>
                                        </div>
                                    </div>

                                    {/* Mentor & Note */}
                                    {(row.mentorId?.fullName || row.note) && (
                                        <div className="pt-2 border-t border-gray-100 text-xs space-y-1">
                                            {row.mentorId?.fullName && (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-gray-400 font-medium">Mentor:</span>
                                                    <span className="font-semibold text-indigo-600">{row.mentorId.fullName}</span>
                                                </div>
                                            )}
                                            {row.note && (
                                                <div className="bg-amber-50/60 p-2.5 rounded-lg border border-amber-100/60 text-gray-700 italic text-[11px] mt-1">
                                                    <span className="font-semibold not-italic text-amber-800">Note: </span>
                                                    {row.note}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="pt-2.5 border-t border-gray-100 flex items-center justify-end">
                                        <button
                                            onClick={() => handleEdit(row)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50/70 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 border border-indigo-200 hover:border-indigo-300 rounded-lg shadow-xs transition-all text-xs font-semibold active:scale-95"
                                            title="Edit Entry"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                            <span>Edit</span>
                                        </button>
                                    </div>
                                </div>
                            ));
                        })()
                    ) : (
                        <div className="bg-white rounded-2xl p-6 text-center text-gray-500 border border-gray-150 shadow-xs">
                            No data available for this intern.
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-gray-150 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide shadow-2xl">
                        <div className="p-6 border-b border-gray-150 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h2 className="text-2xl font-bold text-gray-900">{editingCardId ? 'Edit Mentor Card Data' : 'Add Mentor Card Data'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">

                            {/* General */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Week Number</label>
                                    <input type="number" name="week" value={formData.week} onChange={handleInputChange} min="1" required className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:border-indigo-500 h-[42px]" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Subject (Module ID or text)</label>
                                    <input type="text" name="subject" value={formData.subject} onChange={handleInputChange} className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:border-indigo-500 h-[42px]" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Topic (Topic ID or text)</label>
                                    <input type="text" name="topic" value={formData.topic} onChange={handleInputChange} className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:border-indigo-500 h-[42px]" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Start Date</label>
                                    <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:border-indigo-500 h-[42px]" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">End Date</label>
                                    <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:border-indigo-500 h-[42px]" />
                                </div>
                            </div>

                            <hr className="border-gray-150" />

                            {/* Test Section */}
                            <div>
                                <label className="flex items-center text-gray-800 font-bold mb-3 cursor-pointer">
                                    <input type="checkbox" name="isTest" checked={formData.isTest} onChange={handleInputChange} className="mr-3 w-5 h-5 rounded border-gray-300 bg-white text-indigo-600 focus:ring-0 focus:ring-offset-0" />
                                    Include Test Evaluation
                                </label>
                                {formData.isTest && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-150">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">Test Name</label>
                                            <input type="text" name="test_name" value={formData.test_name} onChange={handleInputChange} className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-gray-800 h-[42px]" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">Test Marks</label>
                                            <input type="number" name="test_marks" value={formData.test_marks} onChange={handleInputChange} className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-gray-800 h-[42px]" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">Test Total</label>
                                            <input type="number" name="test_total" value={formData.test_total} onChange={handleInputChange} className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-gray-800 h-[42px]" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <hr className="border-gray-150" />

                            {/* Project Section */}
                            <div>
                                <label className="flex items-center text-gray-800 font-bold mb-3 cursor-pointer">
                                    <input type="checkbox" name="isProject" checked={formData.isProject} onChange={handleInputChange} className="mr-3 w-5 h-5 rounded border-gray-300 bg-white text-indigo-600 focus:ring-0 focus:ring-offset-0" />
                                    Include Project Evaluation
                                </label>
                                {formData.isProject && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-150">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">Project Name</label>
                                            <input type="text" name="project_name" value={formData.project_name} onChange={handleInputChange} className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-gray-800 h-[42px]" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">Project Marks</label>
                                            <input type="number" name="project_marks" value={formData.project_marks} onChange={handleInputChange} className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-gray-800 h-[42px]" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">Project Total</label>
                                            <input type="number" name="project_total" value={formData.project_total} onChange={handleInputChange} className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-gray-800 h-[42px]" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <hr className="border-gray-150" />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="flex items-center">
                                    <label className="flex items-center text-gray-800 font-bold cursor-pointer">
                                        <input type="checkbox" name="isSoftSkill" checked={formData.isSoftSkill} onChange={handleInputChange} className="mr-3 w-5 h-5 rounded border-gray-300 bg-white text-indigo-600 focus:ring-0 focus:ring-offset-0" />
                                        Soft Skill Covered
                                    </label>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Attend (Days Attended)</label>
                                    <input type="text" name="attend" value={formData.attend} onChange={handleInputChange} className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-gray-800 h-[42px]" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Total Days in Week</label>
                                    <input type="number" name="totalDays" value={formData.totalDays} onChange={handleInputChange} className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-gray-800 h-[42px]" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Mentor Note</label>
                                <textarea name="note" value={formData.note} onChange={handleInputChange} rows="3" className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:border-indigo-500 transition-colors"></textarea>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-150">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors font-medium">
                                    Cancel
                                </button>
                                <button type="submit" className="whitespace-nowrap shrink-0 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors font-medium">
                                    Save 
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

const StatCard = ({ title, value, total, sub, color, className = "" }) => (
    <div className={`bg-white px-4 py-3 sm:py-3.5 rounded-xl border-b-[3px] ${color} border-x border-t border-gray-150 shadow-xs hover:shadow-sm transition-all ${className}`}>
        <p className="text-[9.5px] sm:text-[10px] font-bold text-gray-400 tracking-wider mb-1.5 flex items-center justify-between gap-1">
            <span className="truncate">{title}</span>
            {title.includes('SCORE') && <span className="bg-indigo-600 text-white px-1.5 py-0.5 rounded text-[8px] font-semibold shrink-0">SCORE</span>}
        </p>
        <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">{value}</span>
            {total && <span className="text-gray-400 text-sm font-semibold">{total === '%' ? '%' : `/ ${total}`}</span>}
        </div>
        {sub && <p className="text-[10.5px] text-gray-400 italic mt-0.5">{sub}</p>}
    </div>
);

const ScoreBadge = ({ score, color }) => (
    <div className={`px-3 py-1 rounded-lg flex items-center justify-center font-bold border transition-all ${color}`}>
        {score}
    </div>
);

export default MenorCard;