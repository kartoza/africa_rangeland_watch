// store/layerSlice.ts
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { DataState } from './common';

export interface Layer {
  id: string;
  name: string;
  url: string;
  type: 'raster' | 'vector';
  group: 'baseline' | 'near-real-time' | 'user-defined';
  metadata?: {
    minValue: number;
    maxValue: number;
    unit?: string;
    colors: string[];
  },
  style?: object;
}
  
interface LayerState extends DataState {
    layers: Layer[];
}

const initialLayerState: LayerState = {
    layers: [],
    loading: false,
    error: null,
};


export const fetchLayers = createAsyncThunk(
    'layer/fetchLayers',
    async () => {
      const response = await axios.get('/frontend-api/layer/');
      return response.data;
    }
);

export const layerSlice = createSlice({
    name: 'layer',
    initialState: initialLayerState,
    reducers: {
      clearError(state) {
        state.error = null;
      },
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
    }  
});
  
export const { clearError } = layerSlice.actions;

export default layerSlice.reducer;