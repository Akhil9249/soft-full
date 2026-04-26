import { createSlice } from '@reduxjs/toolkit';

// Initial state
const initialState = {
  // Navigation
  sidebarOpen: true,
  activeTab: 'dashboard',
  
  // Loading states
  globalLoading: false,
  pageLoading: false,
  
  // Notifications
  notifications: [],
  
  // Modals
  modals: {
    deleteModal: {
      isOpen: false,
      title: '',
      message: '',
      onConfirm: null,
      onCancel: null,
    },
    confirmModal: {
      isOpen: false,
      title: '',
      message: '',
      onConfirm: null,
      onCancel: null,
    },
  },
  
  // Pagination
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 10,
  },
  
  // Search and filters
  searchTerm: '',
  filters: {},
  
  // Theme
  theme: 'light',
  
  // Mobile
  isMobile: false,
};

// UI slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Sidebar
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    
    // Active tab
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    
    // Loading states
    setGlobalLoading: (state, action) => {
      state.globalLoading = action.payload;
    },
    setPageLoading: (state, action) => {
      state.pageLoading = action.payload;
    },
    
    // Notifications
    addNotification: (state, action) => {
      const notification = {
        id: Date.now(),
        type: action.payload.type || 'info',
        title: action.payload.title || '',
        message: action.payload.message || '',
        duration: action.payload.duration || 5000,
        ...action.payload,
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    
    // Modals
    openDeleteModal: (state, action) => {
      state.modals.deleteModal = {
        isOpen: true,
        title: action.payload.title || 'Confirm Delete',
        message: action.payload.message || 'Are you sure you want to delete this item?',
        onConfirm: action.payload.onConfirm,
        onCancel: action.payload.onCancel,
      };
    },
    closeDeleteModal: (state) => {
      state.modals.deleteModal = {
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        onCancel: null,
      };
    },
    openConfirmModal: (state, action) => {
      state.modals.confirmModal = {
        isOpen: true,
        title: action.payload.title || 'Confirm Action',
        message: action.payload.message || 'Are you sure you want to proceed?',
        onConfirm: action.payload.onConfirm,
        onCancel: action.payload.onCancel,
      };
    },
    closeConfirmModal: (state) => {
      state.modals.confirmModal = {
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        onCancel: null,
      };
    },
    
    // Pagination
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    resetPagination: (state) => {
      state.pagination = {
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        hasNextPage: false,
        hasPrevPage: false,
        limit: 10,
      };
    },
    
    // Search and filters
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    clearSearchAndFilters: (state) => {
      state.searchTerm = '';
      state.filters = {};
    },
    
    // Theme
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
    },
    
    // Mobile
    setIsMobile: (state, action) => {
      state.isMobile = action.payload;
    },
    
    // Reset UI state
    resetUI: (state) => {
      return { ...initialState };
    },
  },
});

export const {
  // Sidebar
  toggleSidebar,
  setSidebarOpen,
  
  // Active tab
  setActiveTab,
  
  // Loading states
  setGlobalLoading,
  setPageLoading,
  
  // Notifications
  addNotification,
  removeNotification,
  clearNotifications,
  
  // Modals
  openDeleteModal,
  closeDeleteModal,
  openConfirmModal,
  closeConfirmModal,
  
  // Pagination
  setPagination,
  resetPagination,
  
  // Search and filters
  setSearchTerm,
  setFilters,
  clearFilters,
  clearSearchAndFilters,
  
  // Theme
  setTheme,
  
  // Mobile
  setIsMobile,
  
  // Reset
  resetUI,
} = uiSlice.actions;

export default uiSlice.reducer;
