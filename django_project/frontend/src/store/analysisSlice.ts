// store/landscapeSlice.ts
import {
  createAsyncThunk,
  createSlice,
  PayloadAction
} from '@reduxjs/toolkit';
import axios from 'axios';

import { DataState } from './common';
import { AnalysisData } from "../components/Map/DataTypes";
import { setCSRFToken } from "../utils/csrfUtils";


export interface Analysis {
  id: number;
  name: string;
  bbox: number[];
  zoom: number;
  urls: {
    [key: string]: string;
  };
}

interface AnalysisState extends DataState {
  analysis: Analysis;
}

const initialAnalysisState: AnalysisState = {
  analysis: null,
  loading: false,
  error: null
};


export const doAnalysis = createAsyncThunk(
  'analysis/soAnalysis',
  async (data: AnalysisData) => {
    setCSRFToken();
    const response = await axios.post('/frontend-api/analysis/', data);
    return response.data;
  }
);

export const analysisSlice = createSlice({
  name: 'analysis',
  initialState: initialAnalysisState,
  reducers: {
    clearError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(doAnalysis.pending, (state) => {
        state.loading = true;
      })
      .addCase(doAnalysis.fulfilled, (state, action: PayloadAction<Analysis>) => {
        state.loading = false;
        state.analysis = action.payload;
      })
      .addCase(doAnalysis.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'An error occurred while fetching landscapes';
      })
  }
});

export const {
  clearError
} = analysisSlice.actions;

export default analysisSlice.reducer;