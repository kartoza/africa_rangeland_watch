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

export interface Indicator {
  name: string;
  variable: string;
  source: string;
  analysis_types: string[];
  temporal_resolutions: string[];
}

export interface CustomGeomSelection {
  reference_layer: object;
  reference_layer_id: string | number;
}

export interface TrendsEarthCredentials {
  email: string;
  /** Password is only sent to the API on save — never stored in Redux. */
  password?: string;
}

export interface TrendsEarthSettingResponse {
  id: number;
  email: string;
  has_credentials: boolean;
  created_at: string;
  updated_at: string;
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
  indicators: Indicator[]; // this is from API response
  trendsEarthConfigured: boolean;
  trendsEarthEmail: string | null;
  trendsEarthLoading: boolean;
  trendsEarthError: string | null;
  ldnTaskId: number | null;
  droughtTaskId: number | null;
  urbanizationTaskId: number | null;
  populationTaskId: number | null;
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
  analysisTaskStartTime: null,
  indicators: [],
  trendsEarthConfigured: false,
  trendsEarthEmail: null,
  trendsEarthLoading: false,
  trendsEarthError: null,
  ldnTaskId: null,
  droughtTaskId: null,
  urbanizationTaskId: null,
  populationTaskId: null,
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

export const fetchAnalysisIndicator = createAsyncThunk(
  'analysis/indicator',
  async () => {
      const response = await axios.get('/frontend-api/indicator/');
      return response.data;
    }
);

/** Fetch stored Trends.Earth credentials status for the current user. */
export const fetchTrendsEarthSettings = createAsyncThunk(
  'analysis/fetchTrendsEarthSettings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get<TrendsEarthSettingResponse>(
        '/api/trends-earth/settings/'
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Not configured — treat as empty, not an error.
        return null;
      }
      return rejectWithValue({
        message: getErrorMessage(
          error,
          'Failed to fetch Trends.Earth settings'
        ),
      });
    }
  }
);

/** Save (create or update) Trends.Earth credentials. */
export const saveTrendsEarthSettings = createAsyncThunk(
  'analysis/saveTrendsEarthSettings',
  async (credentials: TrendsEarthCredentials, { rejectWithValue }) => {
    try {
      setCSRFToken();
      const response = await axios.post<TrendsEarthSettingResponse>(
        '/api/trends-earth/settings/',
        credentials
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue({
        message: getErrorMessage(
          error,
          'Failed to save Trends.Earth credentials'
        ),
      });
    }
  }
);

/** Delete stored Trends.Earth credentials. */
export const deleteTrendsEarthSettings = createAsyncThunk(
  'analysis/deleteTrendsEarthSettings',
  async (_, { rejectWithValue }) => {
    try {
      setCSRFToken();
      await axios.delete('/api/trends-earth/settings/delete/');
      return true;
    } catch (error: any) {
      return rejectWithValue({
        message: getErrorMessage(
          error,
          'Failed to delete Trends.Earth credentials'
        ),
      });
    }
  }
);

export interface SubmitTeJobPayload {
  location_ids: number[];
}

export interface SubmitTeLdnPayload extends SubmitTeJobPayload {
  year_initial?: number;
  year_final?: number;
}

export interface SubmitTeDroughtPayload extends SubmitTeJobPayload {
  year_initial?: number;
  year_final?: number;
}

export interface SubmitTeUrbanizationPayload extends SubmitTeJobPayload {
  un_adju?: boolean;
  isi_thr?: number;
  ntl_thr?: number;
  wat_thr?: number;
  cap_ope?: number;
  pct_suburban?: number;
  pct_urban?: number;
}

export interface SubmitTePopulationPayload extends SubmitTeJobPayload {
  year_initial: number;
  year_final: number;
}

export interface SubmitTeJobResponse {
  job_id: number;
}

/** Submit a Trends.Earth LDN (SDG 15.3.1) job. */
export const submitLdnJob = createAsyncThunk(
  'analysis/submitLdnJob',
  async (payload: SubmitTeLdnPayload, { rejectWithValue }) => {
    try {
      setCSRFToken();
      const response = await axios.post<SubmitTeJobResponse>(
        '/api/trends-earth/submit/ldn/',
        payload
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue({
        message: getErrorMessage(error, 'Failed to submit LDN job'),
      });
    }
  }
);

/** Submit a Trends.Earth drought vulnerability job. */
export const submitDroughtJob = createAsyncThunk(
  'analysis/submitDroughtJob',
  async (payload: SubmitTeDroughtPayload, { rejectWithValue }) => {
    try {
      setCSRFToken();
      const response = await axios.post<SubmitTeJobResponse>(
        '/api/trends-earth/submit/drought/',
        payload
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue({
        message: getErrorMessage(error, 'Failed to submit drought job'),
      });
    }
  }
);

/** Submit a Trends.Earth SDG 11.3.1 urbanization job. */
export const submitUrbanizationJob = createAsyncThunk(
  'analysis/submitUrbanizationJob',
  async (payload: SubmitTeUrbanizationPayload, { rejectWithValue }) => {
    try {
      setCSRFToken();
      const response = await axios.post<SubmitTeJobResponse>(
        '/api/trends-earth/submit/urbanization/',
        payload
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue({
        message: getErrorMessage(
          error,
          'Failed to submit urbanization job'
        ),
      });
    }
  }
);

/** Submit a Trends.Earth population (GPW) job. */
export const submitPopulationJob = createAsyncThunk(
  'analysis/submitPopulationJob',
  async (payload: SubmitTePopulationPayload, { rejectWithValue }) => {
    try {
      setCSRFToken();
      const response = await axios.post<SubmitTeJobResponse>(
        '/api/trends-earth/submit/population/',
        payload
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue({
        message: getErrorMessage(
          error,
          'Failed to submit population job'
        ),
      });
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
    toggleAnalysisLandscapeCommunity(state, action: PayloadAction<Community>) {
      const value = action.payload
      // check if community.featureId is already in locations
      const locations = state.analysisData.locations || [];
      const index = locations.findIndex((location) => location.communityFeatureId === value.featureId);
      if (index > -1) {
        // remove the location
        locations.splice(index, 1);
      } else {
        // add the community to locations
        locations.push({
          lat: value?.latitude,
          lon: value?.longitude,
          community: value?.id ? '' + value?.id : null,
          communityName: value?.name ? value?.name : null,
          communityFeatureId: value?.featureId ? value?.featureId : null
        })
      }
      // update the state with the new locations
      state.analysisData = {
        ...state.analysisData,
        locations: locations,
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
    },
    clearTrendsEarthError(state) {
      state.trendsEarthError = null;
    },
    clearLdnTaskId(state) {
      state.ldnTaskId = null;
    },
    clearDroughtTaskId(state) {
      state.droughtTaskId = null;
    },
    clearUrbanizationTaskId(state) {
      state.urbanizationTaskId = null;
    },
    clearPopulationTaskId(state) {
      state.populationTaskId = null;
    },
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
          if (data.analysisType === 'Spatial' && (data.locations === null || data.locations.length === 0)) {
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
          if (data.analysisType === 'Spatial' && (data.locations === null || data.locations.length === 0)) {
            state.referenceLayerDiff = {
              ...action.payload.results.spatial.results,
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
      })
      .addCase(fetchAnalysisIndicator.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchAnalysisIndicator.fulfilled, (state, action: PayloadAction<Indicator[]>) => {
        state.indicators = action.payload;
      })
      .addCase(fetchAnalysisIndicator.rejected, (state, action) => {
        state.error = parseError(action);
        state.indicators = null;
      })
      // Trends.Earth settings
      .addCase(fetchTrendsEarthSettings.pending, (state) => {
        state.trendsEarthLoading = true;
        state.trendsEarthError = null;
      })
      .addCase(
        fetchTrendsEarthSettings.fulfilled,
        (state, action: PayloadAction<TrendsEarthSettingResponse | null>) => {
          state.trendsEarthLoading = false;
          if (action.payload) {
            state.trendsEarthConfigured = action.payload.has_credentials;
            state.trendsEarthEmail = action.payload.email;
          } else {
            state.trendsEarthConfigured = false;
            state.trendsEarthEmail = null;
          }
        }
      )
      .addCase(fetchTrendsEarthSettings.rejected, (state, action) => {
        state.trendsEarthLoading = false;
        state.trendsEarthError = parseError(action);
      })
      .addCase(saveTrendsEarthSettings.pending, (state) => {
        state.trendsEarthLoading = true;
        state.trendsEarthError = null;
      })
      .addCase(
        saveTrendsEarthSettings.fulfilled,
        (state, action: PayloadAction<TrendsEarthSettingResponse>) => {
          state.trendsEarthLoading = false;
          state.trendsEarthConfigured = action.payload.has_credentials;
          state.trendsEarthEmail = action.payload.email;
        }
      )
      .addCase(saveTrendsEarthSettings.rejected, (state, action) => {
        state.trendsEarthLoading = false;
        state.trendsEarthError = parseError(action);
      })
      .addCase(deleteTrendsEarthSettings.pending, (state) => {
        state.trendsEarthLoading = true;
        state.trendsEarthError = null;
      })
      .addCase(deleteTrendsEarthSettings.fulfilled, (state) => {
        state.trendsEarthLoading = false;
        state.trendsEarthConfigured = false;
        state.trendsEarthEmail = null;
      })
      .addCase(deleteTrendsEarthSettings.rejected, (state, action) => {
        state.trendsEarthLoading = false;
        state.trendsEarthError = parseError(action);
      })
      // Persist submitted TE job IDs in Redux so polling survives navigation
      .addCase(submitLdnJob.fulfilled, (state, action) => {
        state.ldnTaskId = action.payload.job_id;
      })
      .addCase(submitDroughtJob.fulfilled, (state, action) => {
        state.droughtTaskId = action.payload.job_id;
      })
      .addCase(submitUrbanizationJob.fulfilled, (state, action) => {
        state.urbanizationTaskId = action.payload.job_id;
      })
      .addCase(submitPopulationJob.fulfilled, (state, action) => {
        state.populationTaskId = action.payload.job_id;
      });
  }
});

export const {
  clearError, resetAnalysisResult, setAnalysis,
  setAnalysisCustomGeom,
  setMaxWaitAnalysisReached, toggleAnalysisLandscapeCommunity,
  clearTrendsEarthError,
  clearLdnTaskId,
  clearDroughtTaskId,
  clearUrbanizationTaskId,
  clearPopulationTaskId,
} = analysisSlice.actions;

export default analysisSlice.reducer;