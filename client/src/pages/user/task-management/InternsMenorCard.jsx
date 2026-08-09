import React, { useState, useEffect } from 'react';
import { Navbar } from '../../../components/user/UserNavBar';
import AdminService from '../../../services/admin-api-service/AdminService';

const InternsMenorCard = () => {
    const { getMyMentorCardData } = AdminService();

    const [internDetails, setInternDetails] = useState(null);
    const [mentorCards, setMentorCards] = useState([]);
    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState({
        avgTestScore: 0,
        avgProjectScore: 0,
        attendancePercent: 0
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
        setLoading(true);
        try {
            const response = await getMyMentorCardData();
            const cards = response.data?.cards || [];
            const intern = response.data?.intern || null;

            setInternDetails(intern);
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
    }, []);

    return (
        <div className="px-3">
            <Navbar headData="My Evaluation Card" activeTab="My Card" />
            <div className="min-h-screen bg-gray-50/50 text-gray-700 p-6 font-sans rounded-2xl space-y-6 mb-6">
                {/* Header Section */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex justify-between items-start">
                    <div className="flex gap-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                            {internDetails?.fullName
                                ? internDetails.fullName.split(' ').map(n => n[0]).join('').toUpperCase()
                                : '...'}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-3">{internDetails?.fullName || 'Loading...'}</h1>
                            <div className="flex flex-wrap gap-2">
                                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full border border-indigo-100">FULL TIME</span>
                                <span className="px-3 py-1 bg-teal-50 text-teal-600 text-xs font-bold rounded-full border border-teal-100">{internDetails?.batch || 'BATCH'}</span>
                                <span className="px-3 py-1 bg-gray-50 text-gray-600 text-xs font-bold rounded-full border border-gray-150">{internDetails?.admissionNumber || 'STU-001'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                    <StatCard title="AVG TEST SCORE" value={stats.avgTestScore} total="100" color="border-teal-500" />
                    <StatCard title="AVG PROJECT SCORE" value={stats.avgProjectScore} total="100" color="border-purple-500" />
                    <StatCard title="ATTENDANCE" value={stats.attendancePercent} total="%" sub="Percentage" color="border-orange-500" />
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
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
                                    <th className="p-4">Notes</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {loading ? (
                                    <tr>
                                        <td colSpan="10" className="p-10 text-center text-gray-500">Loading your evaluation details...</td>
                                    </tr>
                                ) : mentorCards.length > 0 ? (
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

                                                <td className="p-4 max-w-xs truncate" title={row.note || ''}>
                                                    {row.note ? (
                                                        <span className="text-gray-600 text-xs italic whitespace-pre-wrap">{row.note}</span>
                                                    ) : (
                                                        <span className="text-gray-400">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ));
                                    })()
                                ) : (
                                    <tr>
                                        <td colSpan="10" className="p-10 text-center text-gray-500">No evaluation details are currently available for you.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, total, sub, color }) => (
    <div className={`bg-white p-6 rounded-2xl border-b-4 ${color} border-x border-t border-gray-150 shadow-sm`}>
        <p className="text-[10px] font-bold text-gray-400 tracking-widest mb-4 flex items-center gap-2">
            {title} {title.includes('SCORE') && <span className="bg-indigo-600 text-white px-1 rounded-sm text-[8px]">SCORE</span>}
        </p>
        <div className="flex items-baseline gap-2 mb-2">
            <span className="text-4xl font-bold text-gray-900">{value}</span>
            {total && <span className="text-gray-400 text-lg">{total === '%' ? '%' : `/ ${total}`}</span>}
        </div>
        {sub && <p className="text-xs text-gray-550 italic">{sub}</p>}
    </div>
);

const ScoreBadge = ({ score, color }) => (
    <div className={`px-3 py-1 rounded-lg flex items-center justify-center font-bold border transition-all ${color}`}>
        {score}
    </div>
);

export default InternsMenorCard;