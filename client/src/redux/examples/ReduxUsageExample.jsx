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

const ReduxUsageExample = () => {
  const dispatch = useAppDispatch();
  
  // Selectors
  const interns = useAppSelector(selectInterns);
  const loading = useAppSelector(selectInternsLoading);
  const error = useAppSelector(selectInternsError);
  const pagination = useAppSelector(selectPagination);
  const searchTerm = useAppSelector(selectSearchTerm);
  const filters = useAppSelector(selectFilters);

  // Effects
  useEffect(() => {
    // Build query parameters
    const queryParams = new URLSearchParams({
      page: pagination.currentPage.toString(),
      limit: pagination.limit.toString()
    });
    
    if (searchTerm) queryParams.append('search', searchTerm);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.branch) queryParams.append('branch', filters.branch);
    
    // Fetch data
    dispatch(fetchInterns(queryParams.toString()));
  }, [dispatch, pagination.currentPage, searchTerm, filters]);

  // Event handlers
  const handleSearch = (value) => {
    dispatch(setSearchTerm(value));
  };

  const handleFilterChange = (filterType, value) => {
    dispatch(setFilters({ [filterType]: value }));
  };

  const handlePageChange = (newPage) => {
    dispatch(setPagination({ currentPage: newPage }));
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h2>Redux Usage Example</h2>
      
      {/* Search */}
      <input
        type="text"
        placeholder="Search interns..."
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
      />
      
      {/* Filters */}
      <select
        value={filters.status || ''}
        onChange={(e) => handleFilterChange('status', e.target.value)}
      >
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
      
      {/* Data */}
      <div>
        <h3>Interns ({interns.length})</h3>
        {interns.map(intern => (
          <div key={intern._id}>
            {intern.fullName} - {intern.email}
          </div>
        ))}
      </div>
      
      {/* Pagination */}
      <div>
        <button 
          onClick={() => handlePageChange(pagination.currentPage - 1)}
          disabled={!pagination.hasPrevPage}
        >
          Previous
        </button>
        
        <span>
          Page {pagination.currentPage} of {pagination.totalPages}
        </span>
        
        <button 
          onClick={() => handlePageChange(pagination.currentPage + 1)}
          disabled={!pagination.hasNextPage}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ReduxUsageExample;
