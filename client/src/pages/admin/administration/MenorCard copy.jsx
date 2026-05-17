

import React from 'react';
import { Navbar } from '../../../components/admin/AdminNavBar';

const MenorCard = () => {
  const weeklyData = [
    { week: 'W1', focus: 'DSA Basics + Python/Java', test: 72, project: null, softSkill: 36, attend: '20/20', total: 128, band: 'C', note: 'Good start, needs speed' },
    { week: 'W2', focus: 'DSA – Arrays & Recursion', test: 68, project: null, softSkill: 38, attend: '20/20', total: 126, band: 'C', note: 'Recursion struggles – flag', alert: true },
    { week: 'W3', focus: 'DBMS + SQL Basics', test: 80, project: 74, softSkill: 40, attend: '16/20', total: 210, band: 'B', note: 'Absent Mon/Tue' },
    { week: 'W4', focus: 'HTML, CSS, Bootstrap', test: 85, project: 82, softSkill: 42, attend: '20/20', total: 229, band: 'A', note: 'Strong UI instinct' },
    { week: 'W5', focus: 'JavaScript + TypeScript', test: 78, project: 80, softSkill: 40, attend: '20/20', total: 218, band: 'A', note: 'Async still unclear' },
  ];

  return (
    <>
    <Navbar headData="Menor Card" activeTab="Menor Card" />
   
    <div className="min-h-screen bg-[#0f1117] text-gray-300 p-8 font-sans">
      {/* Header Section */}
      <div className="bg-[#161b22] rounded-2xl p-8 mb-6 border border-gray-800 flex justify-between items-start">
        <div className="flex gap-6">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-lg">
            RK
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white mb-3">Ravi Kumar</h1>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-[#1e2530] text-indigo-400 text-xs font-bold rounded-full border border-indigo-900/50">FULL TIME</span>
              <span className="px-3 py-1 bg-[#1e2530] text-teal-400 text-xs font-bold rounded-full border border-teal-900/50">BATCH 2025-A</span>
              <span className="px-3 py-1 bg-[#1e2530] text-gray-400 text-xs font-bold rounded-full border border-gray-700">STU-001</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Program Duration</p>
          <p className="text-2xl font-bold text-white">16 Weeks · Full Stack</p>
          <p className="text-gray-500 text-sm">Jan 6 – Apr 26, 2025</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-10">
        <StatCard title="PROGRAM AVG SCORE" value="218" total="270" sub="Band A · Excellent" color="border-teal-500" />
        <StatCard title="BEST WEEK" value="245" total="270" sub="Week 9 · A+" color="border-cyan-500" />
        <StatCard title="SOFT SKILLS AVG" value="41" total="50" sub="Strong · improving" color="border-purple-500" />
        <StatCard title="ATTENDANCE" value="92" total="%" sub="7 weeks perfect" color="border-orange-500" />
      </div>

      {/* Band Key */}
      <div className="flex items-center gap-6 mb-8 text-xs font-bold tracking-wider">
        <span className="text-gray-500 uppercase">Band Key:</span>
        <div className="flex gap-4">
            <BandBadge label="A+" range="243–270" color="bg-teal-900/30 text-teal-400 border-teal-500" />
            <BandBadge label="A" range="216–242" color="bg-blue-900/30 text-blue-400 border-blue-500" />
            <BandBadge label="B" range="162–215" color="bg-yellow-900/30 text-yellow-500 border-yellow-600" />
            <BandBadge label="C" range="108–161" color="bg-orange-900/30 text-orange-500 border-orange-600" />
            <BandBadge label="D" range="<108" color="bg-red-900/30 text-red-500 border-red-600" />
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-[#161b22] rounded-2xl border border-gray-800 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[10px] text-gray-500 uppercase tracking-widest border-b border-gray-800">
              <th className="p-5">Week</th>
              <th className="p-5">IT Focus</th>
              <th className="p-5">Test <span className="text-gray-600">/100</span></th>
              <th className="p-5">Project <span className="text-gray-600">/100</span></th>
              <th className="p-5">Soft Skill <span className="text-gray-600">/50</span></th>
              <th className="p-5">Attend <span className="text-gray-600">/20</span></th>
              <th className="p-5">Total <span className="text-gray-600">/270</span></th>
              <th className="p-5">Band</th>
              <th className="p-5">Mentor Note</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {weeklyData.map((row, idx) => (
              <tr key={idx} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                <td className="p-5 font-bold text-indigo-400">{row.week}</td>
                <td className="p-5 text-gray-200 font-medium">{row.focus}</td>
                <td className="p-5"><ScoreBadge score={row.test} color="bg-yellow-900/20 text-yellow-500 border-yellow-700/50" /></td>
                <td className="p-5">{row.project ? <ScoreBadge score={row.project} color="bg-blue-900/20 text-blue-400 border-blue-700/50" /> : <div className="w-10 h-10 bg-gray-800/50 rounded-lg flex items-center justify-center text-gray-600">—</div>}</td>
                <td className="p-5"><ScoreBadge score={row.softSkill} color="bg-blue-900/20 text-blue-400 border-blue-700/50" /></td>
                <td className="p-5"><ScoreBadge score={row.attend} color="bg-teal-900/20 text-teal-400 border-teal-700/50" /></td>
                <td className="p-5 font-bold text-white border-b-2 border-blue-500/50">{row.total}<span className="text-gray-600 font-normal">/270</span></td>
                <td className="p-5"><div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold border ${row.band === 'A' ? 'bg-blue-900/30 text-blue-400 border-blue-500' : row.band === 'B' ? 'bg-yellow-900/30 text-yellow-500 border-yellow-600' : 'bg-orange-900/30 text-orange-500 border-orange-600'}`}>{row.band}</div></td>
                <td className="p-5">
                  <div className={`px-4 py-2 rounded-lg text-xs ${row.alert ? 'bg-red-900/20 text-red-400 border border-red-900/50' : 'bg-gray-800/50 text-gray-400'}`}>
                    {row.note}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
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
      <span className="text-gray-600 text-lg">/ {total}</span>
    </div>
    <p className="text-xs text-gray-400 italic">{sub}</p>
  </div>
);

const BandBadge = ({ label, range, color }) => (
  <div className="flex items-center gap-2">
    <div className={`w-8 h-6 rounded flex items-center justify-center border font-bold ${color}`}>{label}</div>
    <span className="text-gray-500 text-[10px]">{range}</span>
  </div>
);

const ScoreBadge = ({ score, color }) => (
  <div className={`w-12 h-10 rounded-lg flex items-center justify-center font-bold border transition-all hover:scale-105 ${color}`}>
    {score}
  </div>
);

export default MenorCard;