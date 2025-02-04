import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export interface Config {
  dashboardName: string;
  preference: string;
  chartType?: string | null;
}

export interface DashboardData {
  uuid?: string;
  title: string | null;
  created_by?: string | null;
  organisations?: string[];
  analysis_results?: [];
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
      return rejectWithValue(error.response.data);
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
      return rejectWithValue(error.response?.data || "An error occurred");
    }
  }
);

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
    dashboards: [],
    owners: [],           // New variable to store dashboard owners
    loading: false,
    error: null,
    dashboardCreated: false, // Track dashboard creation status
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Handle fetchDashboardOwners async thunk states
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
      .addCase(fetchDashboards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboards.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboards = action.payload;
      })
      .addCase(fetchDashboards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
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
        state.error = action.error.message;
        state.dashboardCreated = false;
      });
  },
});

export default dashboardSlice.reducer;
