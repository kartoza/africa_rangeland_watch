import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { DataState } from './common';

interface Layer {
  id: string;
  uuid: string;
  name: string;
  url: string;
  type: 'raster' | 'vector';
  group: 'baseline' | 'near-real-time' | 'user-defined';
  metadata?: {
    minValue: number;
    maxValue: number;
    unit?: string;
    colors: string[];
    opacity: number;
  };
  style?: object;
  data_provider?: string;
  created_at?: string;
  updated_at?: string;
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
    const response = await axios.get('/frontend-api/layer/');
    return response.data;
  }
);

const layerSlice = createSlice({
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
      });
  }
});

export const { clearError, setSelectedNrtLayer } = layerSlice.actions;

export default layerSlice.reducer;
