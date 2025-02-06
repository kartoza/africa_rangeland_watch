// src/store/analysisSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Initial state for storing analysis data
interface AnalysisState {
  data: any[];
  loading: boolean;
  savedAnalysisFlag: boolean;
  analysisDeleted: boolean;
  error: string | null;
}

// Initial state definition
const initialState: AnalysisState = {
  data: [],
  loading: false,
  savedAnalysisFlag: false,
  analysisDeleted: false,
  error: null,
};

// Async thunk for fetching analysis data
export const fetchAnalysis = createAsyncThunk(
  'analysis/fetchAnalysis',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/user_analysis_results/fetch_analysis_results/');
      return response.data;
    } catch (error) {
      return rejectWithValue('Error fetching analysis results');
    }
  }
);

export const deleteAnalysis = createAsyncThunk(
  'analysis/deleteAnalysis',
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/user_analysis_results/${id}/`);
      return id; // Return the deleted ID to remove it from the state
    } catch (error) {
      return rejectWithValue('Error deleting analysis');
    }
  }
);

// Async thunk for saving analysis data
export const saveAnalysis = createAsyncThunk(
  'analysis/saveAnalysis',
  async (data: any, { rejectWithValue }) => {
    try {
      const payload = {
        analysis_results: data,
      };
      const response = await axios.post('/user_analysis_results/save_analysis_results/', payload);
      return response.data;
    } catch (error) {
      return rejectWithValue('Error saving analysis results');
    }
  }
);

// Redux slice for managing analysis state
const userAnalysisSlice = createSlice({
  name: 'analysis',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnalysis.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAnalysis.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchAnalysis.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(saveAnalysis.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.savedAnalysisFlag = false;
      })
      .addCase(saveAnalysis.fulfilled, (state, action) => {
        state.loading = false;
        state.data.push(action.payload);
        state.savedAnalysisFlag = true;
      })
      .addCase(saveAnalysis.rejected, (state, action) => {
        state.loading = false;
        state.savedAnalysisFlag = false;
        state.error = action.payload as string;
      })
      .addCase(deleteAnalysis.fulfilled, (state, action) => {
        state.data = state.data.filter((item) => item.id !== action.payload);
        state.analysisDeleted = true;
      })
      .addCase(deleteAnalysis.rejected, (state, action) => {
        state.error = action.payload as string;
        state.analysisDeleted = false
      });
  },
});

// Export the actions, though we don't have any reducers in this case
export const { } = userAnalysisSlice.actions;

export default userAnalysisSlice.reducer;
