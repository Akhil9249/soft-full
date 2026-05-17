import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { axiosPrivate } from '../../axios';

// Initial state
const initialState = {
  // Users/Interns
  interns: [],
  staff: [],
  mentors: [],
  
  // Administration
  roles: [],
  privileges: [],
  
  // Course Management
  categories: [],
  courses: [],
  modules: [],
  topics: [],
  
  // Schedule
  batches: [],
  timings: [],
  weeklySchedules: [],
  
  // Task Management
  tasks: [],
  materials: [],
  
  // Settings
  branches: [],
  notifications: [],
  staticPages: [],
  
  // Loading states
  loading: {
    interns: false,
    staff: false,
    mentors: false,
    roles: false,
    privileges: false,
    categories: false,
    courses: false,
    modules: false,
    topics: false,
    batches: false,
    timings: false,
    weeklySchedules: false,
    tasks: false,
    materials: false,
    branches: false,
    notifications: false,
    staticPages: false,
  },
  
  // Errors
  errors: {},
  
  // Cache timestamps
  cache: {},
};

// Async thunks for data fetching
export const fetchInterns = createAsyncThunk(
  'data/fetchInterns',
  async (params = '', { rejectWithValue }) => {
    try {
      const url = params ? `/api/intern?${params}` : '/api/intern';
      const response = await axiosPrivate.get(url);
      return { data: response.data.data, pagination: response.data.pagination };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch interns');
    }
  }
);

export const fetchStaff = createAsyncThunk(
  'data/fetchStaff',
  async (params = '', { rejectWithValue }) => {
    try {
      const url = params ? `/api/staff?${params}` : '/api/staff';
      const response = await axiosPrivate.get(url);
      return { data: response.data.data, pagination: response.data.pagination };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch staff');
    }
  }
);

export const fetchBatches = createAsyncThunk(
  'data/fetchBatches',
  async (params = '', { rejectWithValue }) => {
    try {
      const url = params ? `/api/batches?${params}` : '/api/batches';
      const response = await axiosPrivate.get(url);
      return { data: response.data.data, pagination: response.data.pagination };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch batches');
    }
  }
);

export const fetchCourses = createAsyncThunk(
  'data/fetchCourses',
  async (params = '', { rejectWithValue }) => {
    try {
      const url = params ? `/api/course?${params}` : '/api/course';
      const response = await axiosPrivate.get(url);
      return { data: response.data.data, pagination: response.data.pagination };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch courses');
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'data/fetchCategories',
  async (params = '', { rejectWithValue }) => {
    try {
      const url = params ? `/api/category?${params}` : '/api/category';
      const response = await axiosPrivate.get(url);
      return { data: response.data.data, pagination: response.data.pagination };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch categories');
    }
  }
);

export const fetchModules = createAsyncThunk(
  'data/fetchModules',
  async (params = '', { rejectWithValue }) => {
    try {
      const url = params ? `/api/module?${params}` : '/api/module';
      const response = await axiosPrivate.get(url);
      return { data: response.data.data, pagination: response.data.pagination };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch modules');
    }
  }
);

export const fetchTopics = createAsyncThunk(
  'data/fetchTopics',
  async (params = '', { rejectWithValue }) => {
    try {
      const url = params ? `/api/topics?${params}` : '/api/topics';
      const response = await axiosPrivate.get(url);
      return { data: response.data.data, pagination: response.data.pagination };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch topics');
    }
  }
);

export const fetchTasks = createAsyncThunk(
  'data/fetchTasks',
  async (params = '', { rejectWithValue }) => {
    try {
      const url = params ? `/api/tasks?${params}` : '/api/tasks';
      const response = await axiosPrivate.get(url);
      return { data: response.data.data, pagination: response.data.pagination };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tasks');
    }
  }
);

export const fetchMaterials = createAsyncThunk(
  'data/fetchMaterials',
  async (params = '', { rejectWithValue }) => {
    try {
      const url = params ? `/api/materials?${params}` : '/api/materials';
      const response = await axiosPrivate.get(url);
      return { data: response.data.data, pagination: response.data.pagination };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch materials');
    }
  }
);

export const fetchBranches = createAsyncThunk(
  'data/fetchBranches',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosPrivate.get('/api/branches');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch branches');
    }
  }
);

export const fetchRoles = createAsyncThunk(
  'data/fetchRoles',
  async (params = '', { rejectWithValue }) => {
    try {
      const url = params ? `/api/privileges?${params}` : '/api/privileges';
      const response = await axiosPrivate.get(url);
      return { data: response.data.data, pagination: response.data.pagination };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch roles');
    }
  }
);

// Data slice
const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    // Clear specific data
    clearInterns: (state) => {
      state.interns = [];
    },
    clearStaff: (state) => {
      state.staff = [];
    },
    clearBatches: (state) => {
      state.batches = [];
    },
    clearCourses: (state) => {
      state.courses = [];
    },
    clearCategories: (state) => {
      state.categories = [];
    },
    clearModules: (state) => {
      state.modules = [];
    },
    clearTopics: (state) => {
      state.topics = [];
    },
    clearTasks: (state) => {
      state.tasks = [];
    },
    clearMaterials: (state) => {
      state.materials = [];
    },
    clearRoles: (state) => {
      state.roles = [];
    },
    
    // Clear all data
    clearAllData: (state) => {
      return { ...initialState };
    },
    
    // Clear errors
    clearError: (state, action) => {
      if (action.payload) {
        delete state.errors[action.payload];
      } else {
        state.errors = {};
      }
    },
    
    // Update specific item
    updateIntern: (state, action) => {
      const index = state.interns.findIndex(intern => intern._id === action.payload._id);
      if (index !== -1) {
        state.interns[index] = action.payload;
      }
    },
    updateStaff: (state, action) => {
      const index = state.staff.findIndex(staff => staff._id === action.payload._id);
      if (index !== -1) {
        state.staff[index] = action.payload;
      }
    },
    updateBatch: (state, action) => {
      const index = state.batches.findIndex(batch => batch._id === action.payload._id);
      if (index !== -1) {
        state.batches[index] = action.payload;
      }
    },
    updateCourse: (state, action) => {
      const index = state.courses.findIndex(course => course._id === action.payload._id);
      if (index !== -1) {
        state.courses[index] = action.payload;
      }
    },
    updateTask: (state, action) => {
      const index = state.tasks.findIndex(task => task._id === action.payload._id);
      if (index !== -1) {
        state.tasks[index] = action.payload;
      }
    },
    
    // Remove specific item
    removeIntern: (state, action) => {
      state.interns = state.interns.filter(intern => intern._id !== action.payload);
    },
    removeStaff: (state, action) => {
      state.staff = state.staff.filter(staff => staff._id !== action.payload);
    },
    removeBatch: (state, action) => {
      state.batches = state.batches.filter(batch => batch._id !== action.payload);
    },
    removeCourse: (state, action) => {
      state.courses = state.courses.filter(course => course._id !== action.payload);
    },
    removeTask: (state, action) => {
      state.tasks = state.tasks.filter(task => task._id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Interns
      .addCase(fetchInterns.pending, (state) => {
        state.loading.interns = true;
        delete state.errors.interns;
      })
      .addCase(fetchInterns.fulfilled, (state, action) => {
        state.loading.interns = false;
        state.interns = action.payload.data;
        state.cache.interns = Date.now();
      })
      .addCase(fetchInterns.rejected, (state, action) => {
        state.loading.interns = false;
        state.errors.interns = action.payload;
      })
      
      // Staff
      .addCase(fetchStaff.pending, (state) => {
        state.loading.staff = true;
        delete state.errors.staff;
      })
      .addCase(fetchStaff.fulfilled, (state, action) => {
        state.loading.staff = false;
        state.staff = action.payload.data;
        state.cache.staff = Date.now();
      })
      .addCase(fetchStaff.rejected, (state, action) => {
        state.loading.staff = false;
        state.errors.staff = action.payload;
      })
      
      // Batches
      .addCase(fetchBatches.pending, (state) => {
        state.loading.batches = true;
        delete state.errors.batches;
      })
      .addCase(fetchBatches.fulfilled, (state, action) => {
        state.loading.batches = false;
        state.batches = action.payload.data;
        state.cache.batches = Date.now();
      })
      .addCase(fetchBatches.rejected, (state, action) => {
        state.loading.batches = false;
        state.errors.batches = action.payload;
      })
      
      // Courses
      .addCase(fetchCourses.pending, (state) => {
        state.loading.courses = true;
        delete state.errors.courses;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.loading.courses = false;
        state.courses = action.payload.data;
        state.cache.courses = Date.now();
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.loading.courses = false;
        state.errors.courses = action.payload;
      })
      
      // Categories
      .addCase(fetchCategories.pending, (state) => {
        state.loading.categories = true;
        delete state.errors.categories;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading.categories = false;
        state.categories = action.payload.data;
        state.cache.categories = Date.now();
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading.categories = false;
        state.errors.categories = action.payload;
      })
      
      // Modules
      .addCase(fetchModules.pending, (state) => {
        state.loading.modules = true;
        delete state.errors.modules;
      })
      .addCase(fetchModules.fulfilled, (state, action) => {
        state.loading.modules = false;
        state.modules = action.payload.data;
        state.cache.modules = Date.now();
      })
      .addCase(fetchModules.rejected, (state, action) => {
        state.loading.modules = false;
        state.errors.modules = action.payload;
      })
      
      // Topics
      .addCase(fetchTopics.pending, (state) => {
        state.loading.topics = true;
        delete state.errors.topics;
      })
      .addCase(fetchTopics.fulfilled, (state, action) => {
        state.loading.topics = false;
        state.topics = action.payload.data;
        state.cache.topics = Date.now();
      })
      .addCase(fetchTopics.rejected, (state, action) => {
        state.loading.topics = false;
        state.errors.topics = action.payload;
      })
      
      // Tasks
      .addCase(fetchTasks.pending, (state) => {
        state.loading.tasks = true;
        delete state.errors.tasks;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading.tasks = false;
        state.tasks = action.payload.data;
        state.cache.tasks = Date.now();
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading.tasks = false;
        state.errors.tasks = action.payload;
      })
      
      // Materials
      .addCase(fetchMaterials.pending, (state) => {
        state.loading.materials = true;
        delete state.errors.materials;
      })
      .addCase(fetchMaterials.fulfilled, (state, action) => {
        state.loading.materials = false;
        state.materials = action.payload.data;
        state.cache.materials = Date.now();
      })
      .addCase(fetchMaterials.rejected, (state, action) => {
        state.loading.materials = false;
        state.errors.materials = action.payload;
      })
      
      // Branches
      .addCase(fetchBranches.pending, (state) => {
        state.loading.branches = true;
        delete state.errors.branches;
      })
      .addCase(fetchBranches.fulfilled, (state, action) => {
        state.loading.branches = false;
        state.branches = action.payload;
        state.cache.branches = Date.now();
      })
      .addCase(fetchBranches.rejected, (state, action) => {
        state.loading.branches = false;
        state.errors.branches = action.payload;
      })
      
      // Roles
      .addCase(fetchRoles.pending, (state) => {
        state.loading.roles = true;
        delete state.errors.roles;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.loading.roles = false;
        state.roles = action.payload.data;
        state.cache.roles = Date.now();
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.loading.roles = false;
        state.errors.roles = action.payload;
      });
  },
});

export const {
  // Clear data
  clearInterns,
  clearStaff,
  clearBatches,
  clearCourses,
  clearCategories,
  clearModules,
  clearTopics,
  clearTasks,
  clearMaterials,
  clearRoles,
  clearAllData,
  
  // Clear errors
  clearError,
  
  // Update items
  updateIntern,
  updateStaff,
  updateBatch,
  updateCourse,
  updateTask,
  
  // Remove items
  removeIntern,
  removeStaff,
  removeBatch,
  removeCourse,
  removeTask,
} = dataSlice.actions;

export default dataSlice.reducer;
