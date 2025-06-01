import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { Analysis } from './analysisSlice';

export interface Config {
  dashboardName?: string;
  preference?: string;
  chartType?: string | null;
}

export interface DashboardData {
  uuid?: string;
  title: string | null;
  created_by?: string | null;
  organisations?: string[];
  analysis_results?: Analysis[];
  groups?: number[];
  users?: number[];
  config: Config | null;
  privacy_type: "public" | "private" | "organisation" | "restricted";
  created_at?: string;
  updated_at?: string;
}

export interface FilterParams {
  searchTerm?: string;
  my_resources?: boolean;
  category?: string;
  keyword?: string;
  region?: string;
  my_organisations?: boolean;
  my_dashboards?: boolean;
  favorites?: boolean;
  datasets?: string[];
  maps?: boolean;
  owner?: string;
}

// Widget types
export type WidgetType = 'chart' | 'table' | 'map' | 'text';
export type GridSize = 1 | 2 | 3 | 4;
export type WidgetHeight = 'small' | 'medium' | 'large' | 'xlarge';

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  size: GridSize;
  height: WidgetHeight;
  data?: any; // AnalysisResult
  content?: string;
  description?: string;
  config?: any; // Additional configuration for the widget
  analysis_result_id?: string;
  last_updated?: string;
  order?: number; // For sorting widgets within a dashboard
}

// Height configurations
export const heightConfig = {
  small: { minH: '200px', maxH: '250px', rows: 1 },
  medium: { minH: '300px', maxH: '350px', rows: 2 },
  large: { minH: '400px', maxH: '450px', rows: 3 },
  xlarge: { minH: '500px', maxH: '550px', rows: 4 },
};

// Size constraints based on widget type
export const widgetConstraints = {
  chart: { 
    minWidth: 2 as GridSize,
    maxWidth: 4 as GridSize, 
    minHeight: 'medium' as WidgetHeight,
    maxHeight: 'xlarge' as WidgetHeight,
    recommendedHeight: 'medium' as WidgetHeight
  },
  table: { 
    minWidth: 2 as GridSize, 
    maxWidth: 4 as GridSize, 
    minHeight: 'medium' as WidgetHeight,
    maxHeight: 'xlarge' as WidgetHeight,
    recommendedHeight: 'large' as WidgetHeight
  },
  map: { 
    minWidth: 2 as GridSize, 
    maxWidth: 4 as GridSize, 
    minHeight: 'medium' as WidgetHeight,
    maxHeight: 'xlarge' as WidgetHeight,
    recommendedHeight: 'large' as WidgetHeight
  },
  text: { 
    minWidth: 1 as GridSize, 
    maxWidth: 4 as GridSize, 
    minHeight: 'small' as WidgetHeight,
    maxHeight: 'xlarge' as WidgetHeight,
    recommendedHeight: 'medium' as WidgetHeight
  },
};


export interface DashboardItem {
  uuid: string;
  title: string;
  last_updated: string;
  metadata: any;
  version: string;
  widgets: Widget[];
}

// Fetch dashboards
export const fetchDashboards = createAsyncThunk(
  'dashboard/fetchDashboards',
  async (filters: FilterParams, { rejectWithValue }) => {
    try {
      const response = await axios.get('dashboards/', { params: filters });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Error fetching dashboards");
    }
  }
);

// Create a dashboard
export const createDashboard = createAsyncThunk(
  "dashboard/createDashboard",
  async (dashboardData: DashboardData, { rejectWithValue }) => {
    try {
      const response = await axios.post("/dashboards/create/", dashboardData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Error creating dashboard");
    }
  }
);

// Update dashboard settings
export const updateDashboard = createAsyncThunk(
  "dashboard/updateDashboard",
  async ({ uuid, updates }: { uuid: string; updates: Partial<DashboardData> }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`/dashboards/${uuid}/update`, updates);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Error updating dashboard");
    }
  }
);


// Fetch dashboard owners
export const fetchDashboardOwners = createAsyncThunk(
  "dashboard/fetchOwners",
  async () => {
    try {
      const response = await axios.get('/dashboard-owners/');
      return response.data;
    } catch (error) {
      console.error('Error fetching owners:', error);
    }
  }
);

// Delete dashboard
export const deleteDashboard = createAsyncThunk(
  "dashboard/deleteDashboard",
  async (uuid: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/dashboards/${uuid}/`);
      return uuid;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Error deleting dashboard");
    }
  }
);

// Fetch dashboard by UUID
export const fetchDashboardByUuid = createAsyncThunk(
  "dashboard/fetchDashboardByUuid",
  async (uuid: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/dashboards/${uuid}/detail/`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Error fetching dashboard by UUID");
    }
  }
);

export const saveDashboardByUuid = createAsyncThunk(
  "dashboard/saveDashboardByUuid",
  async ({ uuid, data }: { uuid: string; data: any }, { rejectWithValue }) => {
  try {
    const response = await axios.post(`/dashboards/${uuid}/detail/`, data);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || "Error saving dashboard by UUID");
  }
});

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    dashboards: [] as DashboardData[],
    owners: [],
    loading: false,
    error: null as string | null,
    dashboardCreated: false,
    dashboardUpdated: false,
    currentDashboard: null as DashboardItem | null,
  },
  reducers: {
    resetDashboardUpdated: (state) => {
      state.dashboardUpdated = false;
    },
    clearDashboardCreated: (state) => {
      state.dashboardCreated = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboards.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.dashboardUpdated = false;
      })
      .addCase(fetchDashboards.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboards = action.payload;
        state.dashboardUpdated = false;
      })
      .addCase(fetchDashboards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.dashboardUpdated = false;
      })
      .addCase(createDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.dashboardCreated = false;
      })
      .addCase(createDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboardCreated = true;
      })
      .addCase(createDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.dashboardCreated = false;
      })
      .addCase(updateDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.dashboardUpdated = false;
      })
      .addCase(updateDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboardUpdated = true;

        // Find and update the specific dashboard
        const index = state.dashboards.findIndex((db) => db.uuid === action.payload.uuid);
        if (index !== -1) {
          state.dashboards[index] = action.payload;
        }
      })
      .addCase(updateDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.dashboardUpdated = false;
      })
      .addCase(fetchDashboardOwners.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardOwners.fulfilled, (state, action) => {
        state.loading = false;
        state.owners = action.payload;
      })
      .addCase(fetchDashboardOwners.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(deleteDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.dashboardUpdated = false;
      })
      .addCase(deleteDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboards = state.dashboards.filter((db) => db.uuid !== action.payload);
        state.dashboardUpdated = true;
      })
      .addCase(deleteDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.dashboardUpdated = false;
      })
      .addCase(fetchDashboardByUuid.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.currentDashboard = null;
      })
      .addCase(fetchDashboardByUuid.fulfilled, (state, action) => {
        state.loading = false;
        state.currentDashboard = action.payload;
      })
      .addCase(fetchDashboardByUuid.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.currentDashboard = null;
      })
      .addCase(saveDashboardByUuid.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveDashboardByUuid.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(saveDashboardByUuid.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetDashboardUpdated, clearDashboardCreated } = dashboardSlice.actions;

export default dashboardSlice.reducer;
