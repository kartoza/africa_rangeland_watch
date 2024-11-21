// store/baseMapSlice.ts
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

import { DataState } from './common';

export interface BaseMap {
  id: number;
  name: string;
  url: string;
  thumbnail?: string;
}
  
interface BaseMapState extends DataState {
    baseMaps: BaseMap[];
}

const initialBaseMapState: BaseMapState = {
    baseMaps: [],
    loading: false,
    error: null,
};


export const fetchBaseMaps = createAsyncThunk(
    'map/fetchBaseMaps',
    async () => {
      const response = await axios.get('/frontend-api/base_map/');
      return response.data;
    }
);

export const baseMapSlice = createSlice({
    name: 'baseMap',
    initialState: initialBaseMapState,
    reducers: {
      clearError(state) {
        state.error = null;
      }
    },
    extraReducers: (builder) => {
      builder
        .addCase(fetchBaseMaps.pending, (state) => {
          state.loading = true;
        })
        .addCase(fetchBaseMaps.fulfilled, (state, action: PayloadAction<BaseMap[]>) => {
          state.loading = false;
          state.baseMaps = action.payload;
        })
        .addCase(fetchBaseMaps.rejected, (state, action) => {
          state.loading = false;
          state.error = action.error.message || 'An error occurred while fetching base maps';
        })
    }  
});
  
export const {
  clearError
} = baseMapSlice.actions;

export default baseMapSlice.reducer;