// Auth selectors
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectToken = (state) => state.auth.token;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectUserRole = (state) => state.auth.role;
export const selectUserPermissions = (state) => state.auth.permissions;
export const selectAuthLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;

// UI selectors
export const selectUI = (state) => state.ui;
export const selectSidebarOpen = (state) => state.ui.sidebarOpen;
export const selectActiveTab = (state) => state.ui.activeTab;
export const selectGlobalLoading = (state) => state.ui.globalLoading;
export const selectPageLoading = (state) => state.ui.pageLoading;
export const selectNotifications = (state) => state.ui.notifications;
export const selectModals = (state) => state.ui.modals;
export const selectPagination = (state) => state.ui.pagination;
export const selectSearchTerm = (state) => state.ui.searchTerm;
export const selectFilters = (state) => state.ui.filters;
export const selectTheme = (state) => state.ui.theme;
export const selectIsMobile = (state) => state.ui.isMobile;

// Data selectors
export const selectData = (state) => state.data;

// Interns
export const selectInterns = (state) => state.data.interns;
export const selectInternsLoading = (state) => state.data.loading.interns;
export const selectInternsError = (state) => state.data.errors.interns;

// Staff
export const selectStaff = (state) => state.data.staff;
export const selectStaffLoading = (state) => state.data.loading.staff;
export const selectStaffError = (state) => state.data.errors.staff;

// Batches
export const selectBatches = (state) => state.data.batches;
export const selectBatchesLoading = (state) => state.data.loading.batches;
export const selectBatchesError = (state) => state.data.errors.batches;

// Courses
export const selectCourses = (state) => state.data.courses;
export const selectCoursesLoading = (state) => state.data.loading.courses;
export const selectCoursesError = (state) => state.data.errors.courses;

// Categories
export const selectCategories = (state) => state.data.categories;
export const selectCategoriesLoading = (state) => state.data.loading.categories;
export const selectCategoriesError = (state) => state.data.errors.categories;

// Modules
export const selectModules = (state) => state.data.modules;
export const selectModulesLoading = (state) => state.data.loading.modules;
export const selectModulesError = (state) => state.data.errors.modules;

// Topics
export const selectTopics = (state) => state.data.topics;
export const selectTopicsLoading = (state) => state.data.loading.topics;
export const selectTopicsError = (state) => state.data.errors.topics;

// Tasks
export const selectTasks = (state) => state.data.tasks;
export const selectTasksLoading = (state) => state.data.loading.tasks;
export const selectTasksError = (state) => state.data.errors.tasks;

// Materials
export const selectMaterials = (state) => state.data.materials;
export const selectMaterialsLoading = (state) => state.data.loading.materials;
export const selectMaterialsError = (state) => state.data.errors.materials;

// Branches
export const selectBranches = (state) => state.data.branches;
export const selectBranchesLoading = (state) => state.data.loading.branches;
export const selectBranchesError = (state) => state.data.errors.branches;

// Roles
export const selectRoles = (state) => state.data.roles;
export const selectRolesLoading = (state) => state.data.loading.roles;
export const selectRolesError = (state) => state.data.errors.roles;

// Combined selectors
export const selectLoading = (state) => ({
  interns: state.data.loading.interns,
  staff: state.data.loading.staff,
  batches: state.data.loading.batches,
  courses: state.data.loading.courses,
  categories: state.data.loading.categories,
  modules: state.data.loading.modules,
  topics: state.data.loading.topics,
  tasks: state.data.loading.tasks,
  materials: state.data.loading.materials,
  branches: state.data.loading.branches,
  roles: state.data.loading.roles,
});

export const selectErrors = (state) => state.data.errors;

// Permission selectors
export const selectHasPermission = (permission) => (state) => {
  const permissions = selectUserPermissions(state);
  return permissions.includes(permission);
};

export const selectHasRole = (role) => (state) => {
  const userRole = selectUserRole(state);
  return userRole === role;
};

export const selectIsAdmin = (state) => {
  const userRole = selectUserRole(state);
  return userRole === 'admin' || userRole === 'superadmin';
};

export const selectIsSuperAdmin = (state) => {
  const userRole = selectUserRole(state);
  return userRole === 'superadmin';
};
