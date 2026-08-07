import React, { useState, useEffect } from 'react';
import { 
  Download, Filter, RotateCcw, Calendar as CalendarIcon, 
  CheckCircle2, Clock, Percent, Table, CalendarDays, MoreHorizontal 
} from 'lucide-react';
import UserService from '../../../services/user-api-service/UserService';
import { Navbar } from '../../../components/user/UserNavBar';

const StatusBadge = ({ status }) => {
  const styles = {
    Present: 'bg-green-100 text-green-800 border-green-200',
    Absent: 'bg-red-100 text-red-800 border-red-200',
    Late: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
      {status}
    </span>
  );
};

export default function AttendanceDashboard() {
  const { getMyAttendanceData } = UserService();
  const [attendance, setAttendance] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [summary, setSummary] = useState({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    attendancePercentage: '0.00'
  });
  const [loading, setLoading] = useState(false);

  // Filters State
  const [filters, setFilters] = useState({
    mentor: '',
    month: '',
    year: ''
  });

  const [activeFilters, setActiveFilters] = useState({
    mentor: '',
    month: '',
    year: ''
  });

  const fetchAttendance = async (filterParams = {}) => {
    setLoading(true);
    try {
      const response = await getMyAttendanceData(filterParams);
      if (response && response.data) {
        setAttendance(response.data.data || []);
        setSummary(response.data.summary || {
          totalDays: 0,
          presentDays: 0,
          absentDays: 0,
          attendancePercentage: '0.00'
        });
        // Only set mentors list if we are not filtering, or on initial load
        if (!filterParams.mentor && !filterParams.month && !filterParams.year) {
          setMentors(response.data.mentors || []);
        }
      }
    } catch (error) {
      console.error('Error fetching student attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    setActiveFilters(filters);
    fetchAttendance(filters);
  };

  const handleResetFilters = () => {
    const reset = { mentor: '', month: '', year: '' };
    setFilters(reset);
    setActiveFilters(reset);
    fetchAttendance(reset);
  };

  const getDayName = (dateStr) => {
    if (!dateStr) return '';
    const dateObj = new Date(dateStr);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dateObj.getDay()];
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${month}/${day}/${year}`;
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 font-sans text-gray-800">
      <div className="max-w-7xl mx-auto space-y-6">
        <Navbar headData="Attendance" activeTab="Attendance Details">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          </div>
        </Navbar>

        {/* Filters Section */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mentor</label>
            <select 
              name="mentor"
              value={filters.mentor}
              onChange={handleFilterChange}
              className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-gray-700 bg-white"
            >
              <option value="">All Mentors</option>
              {mentors.map(m => (
                <option key={m._id} value={m._id}>{m.fullName}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Month</label>
            <select 
              name="month"
              value={filters.month}
              onChange={handleFilterChange}
              className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-gray-700 bg-white"
            >
              <option value="">All Months</option>
              <option value="1">January</option>
              <option value="2">February</option>
              <option value="3">March</option>
              <option value="4">April</option>
              <option value="5">May</option>
              <option value="6">June</option>
              <option value="7">July</option>
              <option value="8">August</option>
              <option value="9">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Year</label>
            <select 
              name="year"
              value={filters.year}
              onChange={handleFilterChange}
              className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-gray-700 bg-white"
            >
              <option value="">All Years</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
              <option value="2028">2028</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleApplyFilters}
              className="flex items-center gap-2 bg-orange-500 text-white shadow-sm hover:bg-orange-600 px-4 py-2.5 text-sm font-medium rounded-lg transition-all"
            >
              <Filter size={16} /> Filter
            </button>
            <button 
              onClick={handleResetFilters}
              className="flex items-center gap-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 px-4 py-2.5 text-sm font-medium rounded-lg transition-all"
            >
              <RotateCcw size={16} /> Reset
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white py-3 px-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
              <CalendarDays size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Days</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{summary.totalDays}</p>
              <p className="text-xs text-gray-400">Days</p>
            </div>
          </div>
          <div className="bg-white py-3 px-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="bg-green-50 p-3 rounded-lg text-green-600">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Present Days</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{summary.presentDays}</p>
              <p className="text-xs text-gray-400">Days</p>
            </div>
          </div>
          <div className="bg-white py-3 px-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="bg-yellow-50 p-3 rounded-lg text-yellow-600">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Absent Days</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{summary.absentDays}</p>
              <p className="text-xs text-gray-400">Days</p>
            </div>
          </div>
          <div className="bg-white py-3 px-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="bg-red-50 p-3 rounded-lg text-red-500">
              <Percent size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Attendance</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{summary.attendancePercentage}%</p>
              <p className="text-xs text-gray-400">Overall</p>
            </div>
          </div>
        </div>

        {/* Data Table Section */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          
          {/* Table Header Controls */}
          {/* <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Attendance Records</h2>
            <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-200">
              <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-medium">
                <Table size={16} /> Table View
              </button>
              <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 px-4 py-1.5 rounded-md text-sm font-medium transition-colors">
                <CalendarIcon size={16} /> Calendar View
              </button>
            </div>
          </div> */}

          {/* Table Container */}
          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-2"></div>
                <p className="text-xs text-gray-500">Loading attendance data...</p>
              </div>
            ) : attendance.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-gray-500 font-medium">No attendance records found.</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="min-w-full divide-y divide-gray-200 text-left">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Day</th>
                        <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Mentor</th>
                        <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {attendance.map((row, index) => (
                        <tr key={row._id || index} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{formatDate(row.date)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-550 text-center">{getDayName(row.date)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{row.mentor?.fullName || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <StatusBadge status={row.status === true ? 'Present' : 'Absent'} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {attendance.map((row, index) => (
                    <div key={row._id || index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-gray-900">{formatDate(row.date)}</span>
                        <StatusBadge status={row.status === true ? 'Present' : 'Absent'} />
                      </div>
                      <div className="space-y-1 text-xs text-gray-600">
                        <div><span className="font-medium text-gray-700">Day:</span> {getDayName(row.date)}</div>
                        <div><span className="font-medium text-gray-700">Mentor:</span> {row.mentor?.fullName || 'N/A'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Footer & Pagination */}
          <div className="p-5 border-t border-gray-100 flex justify-between items-center text-sm">
            <span className="text-gray-500">Showing 1 to {attendance.length} of {attendance.length} records</span>
          </div>

        </div>
      </div>
    </div>
  );
}