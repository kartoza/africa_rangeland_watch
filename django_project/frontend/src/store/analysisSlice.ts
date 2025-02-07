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
import { Layer } from './layerSlice';

export const REFERENCE_LAYER_DIFF_ID = 'spatial_rel_diff'

export interface Analysis {
  id: string;
  data: AnalysisData;
  results: any;
}

interface AnalysisState extends DataState {
  analysis: Analysis | null;
  saveAnalysisFlag: boolean;
  referenceLayerDiff?: Layer;
}

const initialAnalysisState: AnalysisState = {
  analysis: null,
  saveAnalysisFlag: false,
  loading: false,
  error: null,
  referenceLayerDiff: null
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
    },
    resetAnalysisResult(state, action: PayloadAction<string>) {
      state.analysis = null;
      state.saveAnalysisFlag = false;
      if (action.payload) {
        if (action.payload !== 'Spatial') {
          state.referenceLayerDiff = null;
        } 
      } else {
        state.referenceLayerDiff = null;
      }      
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(doAnalysis.pending, (state) => {
        state.error = null;
        state.loading = true;
      })
      .addCase(doAnalysis.fulfilled, (state, action: PayloadAction<Analysis>) => {
        state.loading = false;
        // check if result is from spatial reference layer diff
        const data = action.payload.data;
        state.saveAnalysisFlag = true;
        if (data.analysisType === 'Spatial' && data.latitude === null && data.longitude === null) {
          state.referenceLayerDiff = {
            ...action.payload.results,
            id: REFERENCE_LAYER_DIFF_ID
          }
        } else {
          state.analysis = action.payload;
        }
      })
      .addCase(doAnalysis.rejected, (state, action) => {
        state.loading = false;
        state.saveAnalysisFlag = false;
        state.error = action.error.message || 'An error occurred while fetching landscapes';
      })
  }
});

export const {
  clearError, resetAnalysisResult
} = analysisSlice.actions;

export default analysisSlice.reducer;