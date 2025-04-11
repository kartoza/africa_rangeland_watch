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
import { Types } from '../components/Map/fixtures/analysis';
import { Community } from './landscapeSlice';
import { ErrorResponse, getErrorMessage } from '../utils/api';

export const REFERENCE_LAYER_DIFF_ID = 'spatial_rel_diff'

export interface Analysis {
  id: string;
  data: AnalysisData;
  results: any;
}

export interface CustomGeomSelection {
  reference_layer: object;
  reference_layer_id: string | number;
}

interface AnalysisAPIResult {
  data?: AnalysisData;
  results?: any;
  task_id?: number | null;
  status: null | 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  error?: string;
  is_cached?: boolean;
}


interface AnalysisState extends DataState {
  analysis: Analysis | null; // this is from API response
  saveAnalysisFlag: boolean;
  referenceLayerDiff?: Layer;
  analysisData: AnalysisData; // migrate from state
  analysisTaskId?: number | null;
  analysisTaskStatus?: string;
  analysisTaskStartTime?: number | null;
}

const initialAnalysisState: AnalysisState = {
  analysis: null,
  saveAnalysisFlag: false,
  loading: false,
  error: null,
  referenceLayerDiff: null,
  analysisData: { analysisType: Types.BASELINE },
  analysisTaskId: null,
  analysisTaskStatus: null,
  analysisTaskStartTime: null
};


export const doAnalysis = createAsyncThunk(
  'analysis/soAnalysis',
  async (data: AnalysisData, {rejectWithValue}) => {
    try {
      setCSRFToken();
      const response = await axios.post('/frontend-api/analysis/', data);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        // Extract error JSON from the response
        return rejectWithValue({
          message: getErrorMessage(error, 'Failed to perform analysis'),
        });
      } else if (error.request) {
        // No response from server
        return rejectWithValue({ message: 'No response from server' });
      } else {
        // Something else happened (setup issue, etc.)
        return rejectWithValue({ message: error.message });
      }
    }    
  }
);

// Async thunk to fetch analysis processing status
export const fetchAnalysisStatus = createAsyncThunk(
  'analysis/analysisStatus',
  async ({taskId}: {taskId: number}, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.get(`/frontend-api/analysis/task/${taskId}/`);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        // Extract error JSON from the response
        return rejectWithValue({
          message: getErrorMessage(error, 'Failed to perform analysis'),
        });
      } else if (error.request) {
        // No response from server
        return rejectWithValue({ message: 'No response from server' });
      } else {
        // Something else happened (setup issue, etc.)
        return rejectWithValue({ message: error.message });
      }
    }
  }
);

// try to parse the error
const parseError = (action: any): string => {
  let error = 'An error occurred during the analysis.';

  // If rejectWithValue was used, payload is defined
  if (action.payload) {
    error = (action.payload as ErrorResponse).message;
  } else if (action.error.message) {
    error = action.error.message;
  }

  return error;
}

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
    },
    setAnalysis(state, action: PayloadAction<AnalysisData>) {
      state.analysisData = action.payload
    },
    setAnalysisLandscapeCommunity(state, action: PayloadAction<Community>) {
      const value = action.payload
      state.analysisData = {
        ...state.analysisData,
        community: value?.id ? '' + value?.id : null,
        latitude: value?.latitude ? value?.latitude : null,
        longitude: value?.longitude ? value?.longitude : null,
        communityName: value?.name ? value?.name : null,
        communityFeatureId: value?.featureId ? value?.featureId : null,
        custom_geom: null,
        userDefinedFeatureId: null,
        userDefinedFeatureName: null
      }
    },
    setAnalysisCustomGeom(state, action: PayloadAction<CustomGeomSelection>) {
      state.analysisData = {
        ...state.analysisData,
        reference_layer: action.payload.reference_layer,
        reference_layer_id: action.payload.reference_layer_id
      }
    },
    setMaxWaitAnalysisReached(state, action: PayloadAction) {
      state.loading = false;
      state.saveAnalysisFlag = false;
      state.error = 'Analysis task timed out.';
      state.analysisTaskStatus = 'FAILED';
      state.analysisTaskId = null;
      state.analysis = null;
      state.referenceLayerDiff = null;
      state.analysisTaskStartTime = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(doAnalysis.pending, (state) => {
        state.error = null;
        state.loading = true;
      })
      .addCase(doAnalysis.fulfilled, (state, action: PayloadAction<AnalysisAPIResult>) => {
        state.analysisTaskId = action.payload.task_id;
        state.analysisTaskStatus = action.payload.status;
        state.error = action.payload.error;
        if (action.payload.is_cached && action.payload.results) {
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
            state.analysis = {
              ...state.analysis,
              data: action.payload.data,
              results: action.payload.results
            }
          }
        }
        if (state.analysisTaskId) {
          state.analysisTaskStartTime = Math.floor(Date.now() / 1000);
        }
      })
      .addCase(doAnalysis.rejected, (state, action) => {
        state.loading = false;
        state.saveAnalysisFlag = false;
        state.error = parseError(action);
        state.analysisTaskStatus = 'FAILED';
        state.analysisTaskId = null;
        state.analysis = null;
        state.referenceLayerDiff = null;
        state.analysisTaskStartTime = null;
      }).addCase(fetchAnalysisStatus.fulfilled, (state, action: PayloadAction<AnalysisAPIResult>) => {
        state.analysisTaskId = action.payload.task_id;
        state.analysisTaskStatus = action.payload.status;
        state.error = action.payload.error;
        if (action.payload.status === 'COMPLETED') {
          state.loading = false;
          state.analysisTaskStartTime = null;
          // check if result is from spatial reference layer diff
          const data = action.payload.data;
          state.saveAnalysisFlag = true;
          if (data.analysisType === 'Spatial' && data.latitude === null && data.longitude === null) {
            state.referenceLayerDiff = {
              ...action.payload.results,
              id: REFERENCE_LAYER_DIFF_ID
            }
          } else {
            state.analysis = {
              ...state.analysis,
              data: action.payload.data,
              results: action.payload.results
            }
          }
        } else if (action.payload.status === 'FAILED') {
          state.loading = false;
          state.analysisTaskStartTime = null;
        }
      })
      .addCase(fetchAnalysisStatus.rejected, (state, action) => {
        state.error = parseError(action);
        state.analysisTaskStatus = 'FAILED';
        state.loading = false;
        state.saveAnalysisFlag = false;
        state.analysisTaskId = null;
        state.analysis = null;
        state.referenceLayerDiff = null;
        state.analysisTaskStartTime = null;
      });
  }
});

export const {
  clearError, resetAnalysisResult, setAnalysis,
  setAnalysisLandscapeCommunity, setAnalysisCustomGeom,
  setMaxWaitAnalysisReached
} = analysisSlice.actions;

export default analysisSlice.reducer;