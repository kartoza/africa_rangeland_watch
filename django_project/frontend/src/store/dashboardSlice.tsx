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

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    dashboards: [] as DashboardData[],
    owners: [],
    loading: false,
    error: null as string | null,
    dashboardCreated: false,
    dashboardUpdated: false,
  },
  reducers: {
    resetDashboardUpdated: (state) => {
      state.dashboardUpdated = false;
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
        state.dashboards.push(action.payload);
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
      });
  },
});

export const { resetDashboardUpdated } = dashboardSlice.actions;

export default dashboardSlice.reducer;
