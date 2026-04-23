import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface EarthRangerState {
  selectedEventTypes: string[];
  isLayerVisible: boolean;
}

const initialState: EarthRangerState = {
  selectedEventTypes: [],
  isLayerVisible: false,
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
  },
});

export const { setSelectedEventTypes, setEarthRangerVisible } = earthRangerSlice.actions;
export default earthRangerSlice.reducer;
