import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from '../../../components/admin/AdminNavBar';
import useAuth from '../../../hooks/useAuth';
import AdminService from '../../../services/admin-api-service/AdminService';

const MenorCard = () => {
    const { getInternByIdData, getMentorCardData, postMentorCardData, putMentorCardData } = AdminService();
    const { auth } = useAuth();
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
        if (!cards || !cards.length) return;

        const testCards = cards.filter(c => c.isTest);
        const avgTestScore = testCards.length
            ? Math.round(testCards.reduce((acc, c) => acc + (Number(c.test_marks) || 0), 0) / testCards.length)
            : 0;

        const projectCards = cards.filter(c => c.isProject);
        const avgProjectScore = projectCards.length
            ? Math.round(projectCards.reduce((acc, c) => acc + (Number(c.project_marks) || 0), 0) / projectCards.length)
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
            const intern = await getInternByIdData(internId);
            setInternDetails(intern?.data || intern);

            const cards = await getMentorCardData(internId);
            setMentorCards(cards);
            calculateStats(cards);
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

            <div className="min-h-screen bg-[#0f1117] text-gray-300 p-8 font-sans rounded-2xl">
                {/* Header Section */}
                <div className="bg-[#161b22] rounded-2xl p-8 mb-6 border border-gray-800 flex justify-between items-start">
                    <div className="flex gap-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                            {internDetails?.fullName
                                ? internDetails.fullName.split(' ').map(n => n[0]).join('').toUpperCase()
                                : '...'}
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-3">{internDetails?.fullName || 'Loading...'}</h1>
                            <div className="flex gap-2">
                                <span className="px-3 py-1 bg-[#1e2530] text-indigo-400 text-xs font-bold rounded-full border border-indigo-900/50">FULL TIME</span>
                                <span className="px-3 py-1 bg-[#1e2530] text-teal-400 text-xs font-bold rounded-full border border-teal-900/50">{internDetails?.batch || 'BATCH'}</span>
                                <span className="px-3 py-1 bg-[#1e2530] text-gray-400 text-xs font-bold rounded-full border border-gray-700">{internDetails?.admissionNumber || 'STU-001'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right flex flex-col justify-between items-end">
                        <button
                            onClick={handleAddNew}
                            className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Add Data
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mb-10">
                    <StatCard title="AVG TEST SCORE" value={stats.avgTestScore} total="100" color="border-teal-500" />
                    <StatCard title="AVG PROJECT SCORE" value={stats.avgProjectScore} total="100" color="border-purple-500" />
                    <StatCard title="ATTENDANCE" value={stats.attendancePercent} total="%" sub="Percentage" color="border-orange-500" />
                </div>

                {/* Table Section */}
                <div className="bg-[#161b22] rounded-2xl border border-gray-800 overflow-hidden">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse min-w-max">
                            <thead>
                                <tr className="text-[10px] text-gray-500 uppercase tracking-widest border-b border-gray-800">
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
                                            <tr key={idx} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors group">
                                                <td className="p-4 font-bold text-indigo-400 border-r border-gray-800">
                                                    W{row.week}
                                                </td>
                                                <td className="p-4 text-xs text-gray-400 whitespace-nowrap">
                                                    {row.startDate ? new Date(row.startDate).toLocaleDateString('en-GB') : '-'} <br/>
                                                    to <br/>
                                                    {row.endDate ? new Date(row.endDate).toLocaleDateString('en-GB') : '-'}
                                                </td>
                                                <td className="p-4 text-gray-200">{row.subject || '-'}</td>
                                                <td className="p-4 text-gray-200">{row.topic || '-'}</td>
                                                
                                                <td className="p-4">
                                                    {row.isTest && row.test_name ? (
                                                        <div>
                                                            <div className="text-xs text-gray-400 mb-1">{row.test_name}</div>
                                                            <ScoreBadge score={`${row.test_marks}/${row.test_total}`} color="bg-yellow-900/20 text-yellow-500 border-yellow-700/50" />
                                                        </div>
                                                    ) : <span className="text-gray-600">—</span>}
                                                </td>

                                                <td className="p-4">
                                                    {row.isProject && row.project_name ? (
                                                        <div>
                                                            <div className="text-xs text-gray-400 mb-1">{row.project_name}</div>
                                                            <ScoreBadge score={`${row.project_marks}/${row.project_total}`} color="bg-blue-900/20 text-blue-400 border-blue-700/50" />
                                                        </div>
                                                    ) : <span className="text-gray-600">—</span>}
                                                </td>

                                                <td className="p-4">
                                                    {row.isSoftSkill ? <span className="text-green-400">Yes</span> : <span className="text-gray-600">No</span>}
                                                </td>

                                                <td className="p-4">
                                                    {row.attend || 0} / {row.totalDays || 0}
                                                </td>

                                                <td className="p-4 font-bold text-indigo-400">
                                                    {row.mentorId?.fullName || '-'}
                                                </td>

                                                <td className="p-4 flex gap-2">
                                                    <button
                                                        onClick={() => handleEdit(row)}
                                                        className="flex items-center gap-2 px-3 py-1 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 rounded-lg border border-indigo-500/30 transition-all text-[10px] font-bold"
                                                        title="Edit Entry"
                                                    >
                                                        EDIT
                                                    </button>
                                                </td>
                                            </tr>
                                        ));
                                    })()
                                ) : (
                                    <tr>
                                        <td colSpan="9" className="p-10 text-center text-gray-500">No data available for this intern.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#161b22] border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b border-gray-800 flex justify-between items-center sticky top-0 bg-[#161b22] z-10">
                            <h2 className="text-2xl font-bold text-white">{editingCardId ? 'Edit Mentor Card Data' : 'Add Mentor Card Data'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">

                            {/* General */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Week Number</label>
                                    <input type="number" name="week" value={formData.week} onChange={handleInputChange} min="1" required className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 h-[42px]" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Subject (Module ID or text)</label>
                                    <input type="text" name="subject" value={formData.subject} onChange={handleInputChange} className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 h-[42px]" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Topic (Topic ID or text)</label>
                                    <input type="text" name="topic" value={formData.topic} onChange={handleInputChange} className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 h-[42px]" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Start Date</label>
                                    <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 h-[42px]" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">End Date</label>
                                    <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 h-[42px]" />
                                </div>
                            </div>

                            <hr className="border-gray-800" />

                            {/* Test Section */}
                            <div>
                                <label className="flex items-center text-white font-bold mb-3 cursor-pointer">
                                    <input type="checkbox" name="isTest" checked={formData.isTest} onChange={handleInputChange} className="mr-3 w-5 h-5 rounded border-gray-600 bg-[#0f1117] text-indigo-500 focus:ring-0 focus:ring-offset-0" />
                                    Include Test Evaluation
                                </label>
                                {formData.isTest && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-[#0f1117] rounded-xl border border-gray-800">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Test Name</label>
                                            <input type="text" name="test_name" value={formData.test_name} onChange={handleInputChange} className="w-full bg-[#161b22] border border-gray-700 rounded-lg px-4 py-2 text-white h-[42px]" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Test Marks</label>
                                            <input type="number" name="test_marks" value={formData.test_marks} onChange={handleInputChange} className="w-full bg-[#161b22] border border-gray-700 rounded-lg px-4 py-2 text-white h-[42px]" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Test Total</label>
                                            <input type="number" name="test_total" value={formData.test_total} onChange={handleInputChange} className="w-full bg-[#161b22] border border-gray-700 rounded-lg px-4 py-2 text-white h-[42px]" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <hr className="border-gray-800" />

                            {/* Project Section */}
                            <div>
                                <label className="flex items-center text-white font-bold mb-3 cursor-pointer">
                                    <input type="checkbox" name="isProject" checked={formData.isProject} onChange={handleInputChange} className="mr-3 w-5 h-5 rounded border-gray-600 bg-[#0f1117] text-indigo-500 focus:ring-0 focus:ring-offset-0" />
                                    Include Project Evaluation
                                </label>
                                {formData.isProject && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-[#0f1117] rounded-xl border border-gray-800">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Project Name</label>
                                            <input type="text" name="project_name" value={formData.project_name} onChange={handleInputChange} className="w-full bg-[#161b22] border border-gray-700 rounded-lg px-4 py-2 text-white h-[42px]" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Project Marks</label>
                                            <input type="number" name="project_marks" value={formData.project_marks} onChange={handleInputChange} className="w-full bg-[#161b22] border border-gray-700 rounded-lg px-4 py-2 text-white h-[42px]" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Project Total</label>
                                            <input type="number" name="project_total" value={formData.project_total} onChange={handleInputChange} className="w-full bg-[#161b22] border border-gray-700 rounded-lg px-4 py-2 text-white h-[42px]" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <hr className="border-gray-800" />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="flex items-center">
                                    <label className="flex items-center text-white font-bold cursor-pointer">
                                        <input type="checkbox" name="isSoftSkill" checked={formData.isSoftSkill} onChange={handleInputChange} className="mr-3 w-5 h-5 rounded border-gray-600 bg-[#0f1117] text-indigo-500 focus:ring-0 focus:ring-offset-0" />
                                        Soft Skill Covered
                                    </label>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Attend (Days Attended)</label>
                                    <input type="text" name="attend" value={formData.attend} onChange={handleInputChange} className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-4 py-2 text-white h-[42px]" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Total Days in Week</label>
                                    <input type="number" name="totalDays" value={formData.totalDays} onChange={handleInputChange} className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-4 py-2 text-white h-[42px]" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Mentor Note</label>
                                <textarea name="note" value={formData.note} onChange={handleInputChange} rows="3" className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"></textarea>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors font-medium">
                                    Cancel
                                </button>
                                <button type="submit" className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors font-medium">
                                    Save Data
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
    <div className={`bg-[#161b22] p-6 rounded-2xl border-b-4 ${color} border-x border-t border-gray-800`}>
        <p className="text-[10px] font-bold text-gray-500 tracking-widest mb-4 flex items-center gap-2">
            {title} {title.includes('SCORE') && <span className="bg-blue-600 text-white px-1 rounded-sm text-[8px]">SCORE</span>}
        </p>
        <div className="flex items-baseline gap-2 mb-2">
            <span className="text-4xl font-bold text-white">{value}</span>
            {total && <span className="text-gray-600 text-lg">{total === '%' ? '%' : `/ ${total}`}</span>}
        </div>
        {sub && <p className="text-xs text-gray-400 italic">{sub}</p>}
    </div>
);

const ScoreBadge = ({ score, color }) => (
    <div className={`px-3 py-1 rounded-lg flex items-center justify-center font-bold border transition-all ${color}`}>
        {score}
    </div>
);

export default MenorCard;