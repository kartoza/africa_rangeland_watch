// src/features/dashboard/dashboardSlice.js
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


// Fetch dashboards
export const fetchDashboards = createAsyncThunk(
  'dashboard/fetchDashboards',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('dashboards/');
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
        const response = await axios.post("/dashboards/", dashboardData);
        return response.data;
      } catch (error) {
        return rejectWithValue(error.response?.data || "An error occurred");
      }
    }
  );

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    dashboards: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
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
        state.error = action.payload;
      })
      .addCase(createDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboards.push(action.payload);
      })
      .addCase(createDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default dashboardSlice.reducer;
