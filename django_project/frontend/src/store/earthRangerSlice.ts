import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface EarthRangerState {
  selectedEventTypes: string[];
  isLayerVisible: boolean;
  startDate: string | null;
  endDate: string | null;
  landscapeId: number | null;
  communityIds: number[];
}

const initialState: EarthRangerState = {
  selectedEventTypes: [],
  isLayerVisible: false,
  startDate: null,
  endDate: null,
  landscapeId: null,
  communityIds: [],
};

const earthRangerSlice = createSlice({
  name: 'earthRanger',
  initialState,
  reducers: {
    setSelectedEventTypes(state, action: PayloadAction<string[]>) {
      state.selectedEventTypes = action.payload;
    },
    setEarthRangerVisible(state, action: PayloadAction<boolean>) {
      state.isLayerVisible = action.payload;
    },
    setEarthRangerDateRange(state, action: PayloadAction<{ startDate: string | null; endDate: string | null }>) {
      state.startDate = action.payload.startDate;
      state.endDate = action.payload.endDate;
    },
    setEarthRangerLocation(state, action: PayloadAction<{ landscapeId: number | null; communityIds: number[] }>) {
      state.landscapeId = action.payload.landscapeId;
      state.communityIds = action.payload.communityIds;
    },
  },
});

export const { setSelectedEventTypes, setEarthRangerVisible, setEarthRangerDateRange, setEarthRangerLocation } = earthRangerSlice.actions;
export default earthRangerSlice.reducer;
