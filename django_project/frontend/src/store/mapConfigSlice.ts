// store/mapConfigSlice.ts
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

import { DataState } from './common';

interface MapConfig {
    initial_bound: [number, number, number, number];
}

interface MapConfigState extends DataState {
    mapConfig: MapConfig;
    mapInitiated: boolean;
}

const initialMapConfigState: MapConfigState = {
    mapConfig: null,
    mapInitiated:false,
    loading: false,
    error: null,
};

export const fetchMapConfig = createAsyncThunk(
    'map/fetchMapConfig',
    async () => {
      const response = await axios.get('/frontend-api/map-config/');
      return response.data;
    }
);

const mapConfigSlice = createSlice({
    name: 'mapConfig',
    initialState: initialMapConfigState,
    reducers: {
      clearError(state) {
        state.error = null;
      },
      mapInitated(state) {
        state.mapInitiated = true;
      },
    },
    extraReducers: (builder) => {
      builder
        .addCase(fetchMapConfig.pending, (state) => {
          state.loading = true;
        })
        .addCase(fetchMapConfig.fulfilled, (state, action: PayloadAction<MapConfig>) => {
          state.loading = false;
          state.mapConfig = action.payload;
        })
        .addCase(fetchMapConfig.rejected, (state, action) => {
          state.loading = false;
          state.error = action.error.message || 'An error occurred while fetching map config';
        })
    }
});

export const { clearError, mapInitated } = mapConfigSlice.actions;

export default mapConfigSlice.reducer;