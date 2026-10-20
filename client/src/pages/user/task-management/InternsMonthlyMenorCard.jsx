import React, { useState, useEffect } from 'react';
import { Navbar } from '../../../components/user/UserNavBar';
import UserService from '../../../services/user-api-service/UserService';

const InternsMonthlyMenorCard = () => {
    const { getMyMonthlyCardData } = UserService();

    const [internDetails, setInternDetails] = useState(null);
    const [monthlyCards, setMonthlyCards] = useState([]);
    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState({
        avgTechnical: 0,
        avgAptitude: 0,
        avgLogical: 0,
        avgCommunication: 0,
        attendancePercent: 0
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

    const fetchMonthlyCards = async () => {
        setLoading(true);
        try {
            const response = await getMyMonthlyCardData();
            const cards = response?.data?.cards || [];
            const intern = response?.data?.intern || null;

            setInternDetails(intern);
            setMonthlyCards(cards);
            calculateStats(cards);
        } catch (error) {
            console.error("Error fetching monthly mentor card data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMonthlyCards();
    }, []);

    return (
        <div className="px-3">
            <Navbar headData="My Monthly Evaluation" activeTab="Monthly Card" />
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
                                {internDetails?.course?.courseName && (
                                    <span className="px-3 py-1 bg-purple-50 text-purple-600 text-xs font-bold rounded-full border border-purple-100">{internDetails.course.courseName}</span>
                                )}
                            </div>
                        </div>
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
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {loading ? (
                                    <tr>
                                        <td colSpan="8" className="p-10 text-center text-gray-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3"></div>
                                                <span>Loading your monthly evaluation details...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : monthlyCards.length > 0 ? (
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
                                            </tr>
                                        ));
                                    })()
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="p-10 text-center text-gray-500">
                                            No monthly evaluation details are currently available for you.
                                        </td>
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
    <div className={`bg-white px-3.5 py-4 sm:px-4 sm:py-5 rounded-2xl border-b-4 ${color} border-x border-t border-gray-150 shadow-sm flex flex-col justify-between`}>
        <div className="text-[9.5px] 2xl:text-[10px] font-bold text-gray-400 tracking-wide mb-2 flex items-center justify-between gap-1 whitespace-nowrap min-w-0">
            <span className="whitespace-nowrap">{title}</span>
            {title.includes('AVG') && <span className="bg-indigo-100 text-indigo-700 font-semibold px-1.5 py-0.5 rounded text-[8.5px] shrink-0">AVG</span>}
        </div>
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

export default InternsMonthlyMenorCard;
