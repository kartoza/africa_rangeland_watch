import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface EarthRangerState {
  selectedEventTypes: string[];
}

const initialState: EarthRangerState = {
  selectedEventTypes: [],
};

const earthRangerSlice = createSlice({
  name: 'earthRanger',
  initialState,
  reducers: {
    setSelectedEventTypes(state, action: PayloadAction<string[]>) {
      state.selectedEventTypes = action.payload;
    },
  },
});

export const { setSelectedEventTypes } = earthRangerSlice.actions;
export default earthRangerSlice.reducer;
