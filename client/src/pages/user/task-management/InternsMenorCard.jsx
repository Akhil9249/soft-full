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
            <div className="min-h-screen bg-gray-50/50 text-gray-700 p-3.5 sm:p-6 font-sans rounded-2xl space-y-4 sm:space-y-6 mb-6">
                {/* Header Section */}
                <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3.5 sm:gap-6 min-w-0">
                        <div className="w-14 h-14 sm:w-20 sm:h-20 shrink-0 aspect-square bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-xl sm:text-3xl font-bold text-white shadow-md sm:shadow-lg">
                            {internDetails?.fullName
                                ? internDetails.fullName.split(' ').map(n => n[0]).join('').toUpperCase()
                                : '...'}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-1.5 sm:mb-2.5 truncate">{internDetails?.fullName || 'Loading...'}</h1>
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-indigo-50 text-indigo-600 text-[11px] sm:text-xs font-bold rounded-full border border-indigo-100">FULL TIME</span>
                                <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-teal-50 text-teal-600 text-[11px] sm:text-xs font-bold rounded-full border border-teal-100">{internDetails?.batch || 'BATCH'}</span>
                                <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-gray-50 text-gray-600 text-[11px] sm:text-xs font-bold rounded-full border border-gray-150">{internDetails?.admissionNumber || 'STU-001'}</span>
                                {internDetails?.course?.courseName && (
                                    <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-purple-50 text-purple-600 text-[11px] sm:text-xs font-bold rounded-full border border-purple-100">{internDetails.course.courseName}</span>
                                )}
                            </div>
                        </div>
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

                {/* Mobile Card View (Below md) */}
                <div className="block md:hidden space-y-3.5">
                    {loading ? (
                        <div className="bg-white rounded-2xl p-6 text-center text-gray-500 border border-gray-150 shadow-xs">
                            Loading your evaluation details...
                        </div>
                    ) : mentorCards.length > 0 ? (
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
                                </div>
                            ));
                        })()
                    ) : (
                        <div className="bg-white rounded-2xl p-6 text-center text-gray-500 border border-gray-150 shadow-xs">
                            No evaluation details are currently available for you.
                        </div>
                    )}
                </div>
            </div>
        </div>
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

export default InternsMenorCard;