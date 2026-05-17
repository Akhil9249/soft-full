import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { 
  selectInterns, 
  selectInternsLoading, 
  selectInternsError,
  selectPagination,
  selectSearchTerm,
  selectFilters
} from '../selectors';
import { fetchInterns } from '../slices/dataSlice';
import { setSearchTerm, setFilters, setPagination } from '../slices/uiSlice';

/**
 * Example of integrating Redux Toolkit into an existing component
 * This shows how to replace local state management with Redux
 */
const IntegrationExample = () => {
  const dispatch = useAppDispatch();
  
  // Redux selectors - replace useState with these
  const interns = useAppSelector(selectInterns);
  const loading = useAppSelector(selectInternsLoading);
  const error = useAppSelector(selectInternsError);
  const pagination = useAppSelector(selectPagination);
  const searchTerm = useAppSelector(selectSearchTerm);
  const filters = useAppSelector(selectFilters);

  // Load data on component mount and when dependencies change
  useEffect(() => {
    const loadData = async () => {
      // Build query parameters
      const queryParams = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.limit.toString()
      });
      
      if (searchTerm) queryParams.append('search', searchTerm);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.branch) queryParams.append('branch', filters.branch);
      
      // Dispatch async thunk
      dispatch(fetchInterns(queryParams.toString()));
    };

    loadData();
  }, [dispatch, pagination.currentPage, searchTerm, filters]);

  // Event handlers - dispatch actions instead of setState
  const handleSearch = (value) => {
    dispatch(setSearchTerm(value));
  };

  const handleFilterChange = (filterType, value) => {
    dispatch(setFilters({ [filterType]: value }));
  };

  const handlePageChange = (newPage) => {
    dispatch(setPagination({ currentPage: newPage }));
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        <span className="ml-2 text-gray-600">Loading interns...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">Error: {error}</div>
        <button 
          onClick={() => dispatch(fetchInterns())}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Redux Integration Example</h2>
      
      {/* Search and Filters */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex-1 mr-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search interns..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path>
              </svg>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={filters.branch || ''}
            onChange={(e) => handleFilterChange('branch', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">All Branches</option>
            <option value="branch1">Branch 1</option>
            <option value="branch2">Branch 2</option>
          </select>
        </div>
      </div>

      {/* Data Display */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Interns ({interns.length})
          </h3>
        </div>
        
        {interns.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500">
              {searchTerm || filters.status || filters.branch 
                ? 'No interns found matching your search.' 
                : 'No interns available.'
              }
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {interns.map(intern => (
              <div key={intern._id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {intern.fullName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {intern.email}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {intern.course?.courseName || 'No course'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
          <div className="flex items-center text-sm text-gray-700">
            <span>
              Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount} results
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrevPage}
              className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors duration-200 ${
                pagination.hasPrevPage
                  ? 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                  : 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed'
              }`}
            >
              Previous
            </button>
            
            <span className="text-sm text-gray-600">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage}
              className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors duration-200 ${
                pagination.hasNextPage
                  ? 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                  : 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegrationExample;
