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

interface AnalysisState extends DataState {
  analysis: Analysis | null; // this is from API response
  saveAnalysisFlag: boolean;
  referenceLayerDiff?: Layer;
  analysisData: AnalysisData; // migrate from state
}

const initialAnalysisState: AnalysisState = {
  analysis: null,
  saveAnalysisFlag: false,
  loading: false,
  error: null,
  referenceLayerDiff: null,
  analysisData: { analysisType: Types.BASELINE }
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
  clearError, resetAnalysisResult, setAnalysis, setAnalysisLandscapeCommunity, setAnalysisCustomGeom
} = analysisSlice.actions;

export default analysisSlice.reducer;