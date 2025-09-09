import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { DataState } from './common';
import { setCSRFToken } from "../utils/csrfUtils";

export interface Layer {
  id: string;
  uuid: string;
  name: string;
  url: string;
  type: 'raster' | 'vector';
  group: 'baseline' | 'near-real-time' | 'user-defined' | 'spatial_analysis' | 'analysis_output';
  metadata?: {
    minValue: number;
    maxValue: number;
    unit?: string;
    colors: string[];
    opacity: number;
    attributeId?: string;
  };
  style?: object;
  data_provider?: string;
  created_at?: string;
  updated_at?: string;
  layer_id?: number;
  description?: string;
  layer_type?: string; // New tag for layer type
  is_owned?: boolean;
  created_by?: string;
}

interface LayerState extends DataState {
  layers: Layer[];
  selectedNrt: Layer | null;
}

const initialLayerState: LayerState = {
  layers: [],
  loading: false,
  error: null,
  selectedNrt: null
};

// Fetch user-defined layers
export const fetchUserDefinedLayers = createAsyncThunk(
  'layer/fetchUserDefinedLayers',
  async () => {
    const response = await fetch('/user-input-layers/');
    if (!response.ok) throw new Error('Failed to fetch layers');
    const data = await response.json();
    return data.grouped_layers['user-defined'] || [];
  }
);

// Fetch all layers
export const fetchLayers = createAsyncThunk(
  'layer/fetchLayers',
  async () => {
    setCSRFToken();
    const response = await axios.get('/frontend-api/layer/');
    return response.data;
  }
);

// Delete a layer
export const deleteLayer = createAsyncThunk(
  'layer/deleteLayer',
  async (uuid: string, { rejectWithValue }) => {
    try {
      setCSRFToken();
      await axios.delete(`/delete-layer/${uuid}/`);
      return uuid; // Return UUID to remove from state
    } catch (error) {
      return rejectWithValue("Failed to delete layer");
    }
  }
);

// Download a layer
export const downloadLayer = createAsyncThunk(
  'layer/downloadLayer',
  async (uuid: string, { rejectWithValue }) => {
    try {
      setCSRFToken();
      const response = await axios.get(`/download-layer/${uuid}/`, {
        responseType: 'blob', // Important for file downloads
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${uuid}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      return uuid;
    } catch (error) {
      return rejectWithValue("Failed to download layer");
    }
  }
);

export const layerSlice = createSlice({
  name: 'layer',
  initialState: initialLayerState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    setSelectedNrtLayer(state, action: PayloadAction<Layer>) {
      state.selectedNrt = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLayers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchLayers.fulfilled, (state, action: PayloadAction<Layer[]>) => {
        state.loading = false;
        state.layers = action.payload;
      })
      .addCase(fetchLayers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'An error occurred while fetching layers';
      })
      .addCase(fetchUserDefinedLayers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserDefinedLayers.fulfilled, (state, action: PayloadAction<Layer[]>) => {
        state.loading = false;
        state.layers = action.payload;
      })
      .addCase(fetchUserDefinedLayers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'An error occurred while fetching user-defined layers';
      })
      .addCase(deleteLayer.fulfilled, (state, action: PayloadAction<string>) => {
        state.layers = state.layers.filter(layer => layer.uuid !== action.payload);
      })
      .addCase(downloadLayer.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  }
});

export const { clearError, setSelectedNrtLayer } = layerSlice.actions;

export default layerSlice.reducer;
