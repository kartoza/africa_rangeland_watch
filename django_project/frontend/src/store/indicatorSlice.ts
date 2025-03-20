import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

// Define the type for an indicator
interface Indicator {
  id: number;
  indicator: string;
  alert: boolean;
  alertTrigger: string;
  lastTriggered: string;
  threshold: number;
  anomalyDetectionAlert: boolean;
  email: boolean;
  platform: boolean;
}

// Define the initial state
interface IndicatorsState {
  indicators: Indicator[];
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: IndicatorsState = {
  indicators: [],
  loading: false,
  error: null,
};

// Async thunk to fetch indicators
export const fetchIndicators = createAsyncThunk<Indicator[]>(
  "indicators/fetchIndicators",
  async () => {
    const response = await fetch("/api/indicators"); // Adjust API endpoint
    if (!response.ok) {
      throw new Error("Failed to fetch indicators");
    }
    return await response.json();
  }
);

// Slice definition
const indicatorsSlice = createSlice({
  name: "indicators",
  initialState,
  reducers: {
    updateIndicator: (state, action: PayloadAction<Indicator>) => {
      const index = state.indicators.findIndex((ind) => ind.id === action.payload.id);
      if (index !== -1) {
        state.indicators[index] = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchIndicators.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchIndicators.fulfilled, (state, action) => {
        state.loading = false;
        state.indicators = action.payload;
      })
      .addCase(fetchIndicators.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Something went wrong";
      });
  },
});

// Export actions and reducer
export const { updateIndicator } = indicatorsSlice.actions;
export default indicatorsSlice.reducer;
