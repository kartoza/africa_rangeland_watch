// store/landscapeSlice.ts
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

import { DataState } from './common';

export interface Landscape {
  id: number;
  name: string;
  bbox: number[];
  zoom: number;
  urls: {
    [key: string]: string;
  };
}
  
interface LandscapeState extends DataState {
    landscapes: Landscape[];
    selected: Landscape;
}

const initialLandscapeState: LandscapeState = {
    landscapes: [],
    loading: false,
    error: null,
    selected: null
};


export const fetchLandscapes = createAsyncThunk(
    'landscape/fetchLandscapes',
    async () => {
      const response = await axios.get('/frontend-api/landscape/');
      return response.data;
    }
);

export const landscapeSlice = createSlice({
    name: 'landscape',
    initialState: initialLandscapeState,
    reducers: {
      clearError(state) {
        state.error = null;
      },
      setSelectedLandscape(state, action: PayloadAction<number>) {
        state.selected = state.landscapes.find((item) => item.id === action.payload) || null;
      },
      clearSelectedLandscape(state) {
        state.selected = null;
      }
    },
    extraReducers: (builder) => {
      builder
        .addCase(fetchLandscapes.pending, (state) => {
          state.loading = true;
        })
        .addCase(fetchLandscapes.fulfilled, (state, action: PayloadAction<Landscape[]>) => {
          state.loading = false;
          state.landscapes = action.payload;
        })
        .addCase(fetchLandscapes.rejected, (state, action) => {
          state.loading = false;
          state.error = action.error.message || 'An error occurred while fetching landscapes';
        })
    }  
});
  
export const { 
  clearError,
  setSelectedLandscape,
  clearSelectedLandscape
} = landscapeSlice.actions;

export default landscapeSlice.reducer;