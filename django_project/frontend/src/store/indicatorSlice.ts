import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { setCSRFToken } from "../utils/csrfUtils";

// Define the type for Alert Settings
interface AlertSetting {
  id: number;
  name: string;
  indicator: number;
  enable_alert: boolean;
  last_alert: string;
  threshold_comparison: number;
  threshold_value: number;
  anomaly_detection_alert: boolean;
  email_alert: boolean;
  in_app_alert: boolean;
  created_at: string;
  updated_at: string;
  user: number;
}

// Define the type for an Indicator
interface Indicator {
  id: number;
  name: string;
  alert_settings: AlertSetting[];
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
    const response = await fetch("/api/indicators");
    if (!response.ok) {
      throw new Error("Failed to fetch indicators");
    }
    const data = await response.json();
    return data.results; // Extract `results` array from response
  }
);

// Async thunk to update the alert setting
export const updateAlertSettingAPI = createAsyncThunk(
  "indicators/updateAlertSettingAPI",
  async (payload: { indicatorId: number; alertSettingId: number; updates: Partial<AlertSetting> }) => {
    setCSRFToken();  // Make sure this sets the CSRF token as necessary.
    
    // If you need to retrieve the token from localStorage
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error("Authorization token is missing");
    }

    // Perform the update request
    const response = await fetch(`/api/alert-settings/${payload.alertSettingId}/`, {
      method: "PATCH", // Using PATCH for partial updates
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${token}`, // Ensure token is sent for auth
      },
      body: JSON.stringify(payload.updates),  // Send the updated data
    });

    if (!response.ok) {
      throw new Error("Failed to update alert setting");
    }

    // Parse and return the response
    const data = await response.json();
    return data;
  }
);


// Slice definition
const indicatorsSlice = createSlice({
  name: "indicators",
  initialState,
  reducers: {
    updateAlertSetting: (state, action: PayloadAction<{ indicatorId: number; alertSettingId: number; updates: Partial<AlertSetting> }>) => {
      const { indicatorId, alertSettingId, updates } = action.payload;
      const indicator = state.indicators.find(ind => ind.id === indicatorId);
      if (indicator) {
        const alertSetting = indicator.alert_settings.find(alert => alert.id === alertSettingId);
        if (alertSetting) {
          Object.assign(alertSetting, updates);
        }
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
      })
      .addCase(updateAlertSettingAPI.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAlertSettingAPI.fulfilled, (state, action) => {
        state.loading = false;
        const updatedAlertSetting = action.payload;
        // Find the updated alert setting in the state and update it
        const indicator = state.indicators.find(ind => ind.id === updatedAlertSetting.indicator);
        if (indicator) {
          const alertSetting = indicator.alert_settings.find(alert => alert.id === updatedAlertSetting.id);
          if (alertSetting) {
            Object.assign(alertSetting, updatedAlertSetting);
          }
        }
      })
      .addCase(updateAlertSettingAPI.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Something went wrong";
      });
  },
});

// Export actions and reducer
export const { updateAlertSetting } = indicatorsSlice.actions;
export default indicatorsSlice.reducer;
