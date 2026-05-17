# Redux Toolkit Setup

This directory contains the Redux Toolkit setup for the application with organized slices, selectors, and utilities.

## Structure

```
redux/
├── store.js                 # Redux store configuration
├── hooks.js                 # Typed Redux hooks
├── selectors.js             # Reusable selectors
├── ReduxProvider.jsx        # Redux Provider component
├── slices/
│   ├── authSlice.js         # Authentication state
│   ├── uiSlice.js           # UI state (modals, loading, etc.)
│   └── dataSlice.js         # Application data state
└── examples/
    └── ReduxUsageExample.jsx # Usage examples
```

## Features

### 🔐 Authentication (authSlice)
- User login/logout
- Token management
- Role and permissions
- Profile management
- Automatic token storage

### 🎨 UI State (uiSlice)
- Sidebar toggle
- Loading states
- Notifications system
- Modal management
- Pagination state
- Search and filters
- Theme management

### 📊 Data Management (dataSlice)
- Centralized data storage
- Async data fetching
- Loading states per resource
- Error handling
- Cache management
- CRUD operations

## Usage

### 1. Setup Provider

Wrap your app with the Redux Provider:

```jsx
import ReduxProvider from './redux/ReduxProvider';
import { store } from './redux/store';

function App() {
  return (
    <ReduxProvider>
      <YourApp />
    </ReduxProvider>
  );
}
```

### 2. Using Hooks

```jsx
import { useAppDispatch, useAppSelector } from './redux/hooks';
import { selectUser, selectIsAuthenticated } from './redux/selectors';
import { loginUser } from './redux/slices/authSlice';

function MyComponent() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const handleLogin = async (credentials) => {
    try {
      await dispatch(loginUser(credentials)).unwrap();
      // Login successful
    } catch (error) {
      // Handle error
    }
  };

  return (
    <div>
      {isAuthenticated ? `Welcome ${user?.fullName}` : 'Please login'}
    </div>
  );
}
```

### 3. Data Fetching

```jsx
import { useAppDispatch, useAppSelector } from './redux/hooks';
import { selectInterns, selectInternsLoading } from './redux/selectors';
import { fetchInterns } from './redux/slices/dataSlice';

function InternsList() {
  const dispatch = useAppDispatch();
  const interns = useAppSelector(selectInterns);
  const loading = useAppSelector(selectInternsLoading);

  useEffect(() => {
    dispatch(fetchInterns('page=1&limit=10'));
  }, [dispatch]);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {interns.map(intern => (
        <div key={intern._id}>{intern.fullName}</div>
      ))}
    </div>
  );
}
```

### 4. UI State Management

```jsx
import { useAppDispatch, useAppSelector } from './redux/hooks';
import { selectSidebarOpen, selectNotifications } from './redux/selectors';
import { toggleSidebar, addNotification } from './redux/slices/uiSlice';

function Header() {
  const dispatch = useAppDispatch();
  const sidebarOpen = useAppSelector(selectSidebarOpen);
  const notifications = useAppSelector(selectNotifications);

  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };

  const showNotification = () => {
    dispatch(addNotification({
      type: 'success',
      title: 'Success',
      message: 'Operation completed successfully!'
    }));
  };

  return (
    <header>
      <button onClick={handleToggleSidebar}>
        {sidebarOpen ? 'Close' : 'Open'} Sidebar
      </button>
      <button onClick={showNotification}>
        Show Notification
      </button>
    </header>
  );
}
```

## Available Actions

### Auth Actions
- `loginUser(credentials)` - Login user
- `registerUser(userData)` - Register user
- `logoutUser()` - Logout user
- `fetchUserProfile()` - Fetch user profile
- `setCredentials(payload)` - Set user credentials
- `clearCredentials()` - Clear user credentials

### UI Actions
- `toggleSidebar()` - Toggle sidebar
- `setActiveTab(tab)` - Set active tab
- `setGlobalLoading(loading)` - Set global loading
- `addNotification(notification)` - Add notification
- `removeNotification(id)` - Remove notification
- `openDeleteModal(config)` - Open delete modal
- `closeDeleteModal()` - Close delete modal
- `setPagination(pagination)` - Set pagination
- `setSearchTerm(term)` - Set search term
- `setFilters(filters)` - Set filters

### Data Actions
- `fetchInterns(params)` - Fetch interns
- `fetchStaff(params)` - Fetch staff
- `fetchBatches(params)` - Fetch batches
- `fetchCourses(params)` - Fetch courses
- `fetchCategories(params)` - Fetch categories
- `fetchModules(params)` - Fetch modules
- `fetchTopics(params)` - Fetch topics
- `fetchTasks(params)` - Fetch tasks
- `fetchMaterials(params)` - Fetch materials
- `fetchBranches()` - Fetch branches
- `fetchRoles(params)` - Fetch roles
- `updateIntern(intern)` - Update intern
- `removeIntern(id)` - Remove intern
- `clearAllData()` - Clear all data

## Selectors

### Auth Selectors
- `selectUser` - Get current user
- `selectIsAuthenticated` - Check if authenticated
- `selectUserRole` - Get user role
- `selectUserPermissions` - Get user permissions
- `selectAuthLoading` - Get auth loading state
- `selectAuthError` - Get auth error

### UI Selectors
- `selectSidebarOpen` - Get sidebar state
- `selectActiveTab` - Get active tab
- `selectGlobalLoading` - Get global loading
- `selectNotifications` - Get notifications
- `selectModals` - Get modal states
- `selectPagination` - Get pagination state
- `selectSearchTerm` - Get search term
- `selectFilters` - Get filters

### Data Selectors
- `selectInterns` - Get interns data
- `selectStaff` - Get staff data
- `selectBatches` - Get batches data
- `selectCourses` - Get courses data
- `selectCategories` - Get categories data
- `selectModules` - Get modules data
- `selectTopics` - Get topics data
- `selectTasks` - Get tasks data
- `selectMaterials` - Get materials data
- `selectBranches` - Get branches data
- `selectRoles` - Get roles data

## Best Practices

1. **Use selectors** instead of accessing state directly
2. **Use typed hooks** (`useAppDispatch`, `useAppSelector`)
3. **Handle loading states** properly
4. **Clear errors** when starting new operations
5. **Use async thunks** for API calls
6. **Normalize data** when possible
7. **Use selectors for derived state**

## Migration from Context API

If you're migrating from Context API:

1. Replace `useContext` with `useAppSelector`
2. Replace context actions with Redux actions
3. Move API calls to async thunks
4. Use selectors for computed values
5. Update component imports

## Performance Tips

1. **Memoize selectors** for expensive computations
2. **Use `createSelector`** for derived state
3. **Split large slices** into smaller ones
4. **Use `RTK Query`** for complex data fetching
5. **Implement proper error boundaries**

## Debugging

Use Redux DevTools Extension for debugging:
- Time-travel debugging
- Action replay
- State inspection
- Performance monitoring
