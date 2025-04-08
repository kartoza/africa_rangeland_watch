import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

interface AlertSetting {
  id: number;
  name: string;
  indicator: number;
  enable_alert: boolean;
  threshold_value: number;
}

interface AlertSettingState {
  alertSettings: AlertSetting[];
  loading: boolean;
  error: string | null;
}

const initialState: AlertSettingState = {
  alertSettings: [],
  loading: false,
  error: null,
};

// Fetch alert settings
export const fetchAlertSettings = createAsyncThunk("alertSettings/fetch", async () => {
  const response = await axios.get("/api/alert-settings/");
  return response.data;
});

// Create alert setting
export const createAlertSetting = createAsyncThunk(
  "alertSettings/create",
  async (data: Partial<AlertSetting>) => {
    const response = await axios.post("/api/alert-settings/", data);
    return response.data;
  }
);

// Delete alert setting
export const deleteAlertSetting = createAsyncThunk("alertSettings/delete", async (id: number) => {
  await axios.delete(`/api/alert-settings/${id}/`);
  return id;
});

const alertSettingSlice = createSlice({
  name: "alertSettings",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAlertSettings.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAlertSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.alertSettings = action.payload;
      })
      .addCase(fetchAlertSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to load alert settings";
      })
      .addCase(createAlertSetting.fulfilled, (state, action) => {
        state.alertSettings.push(action.payload);
      })
      .addCase(deleteAlertSetting.fulfilled, (state, action) => {
        state.alertSettings = state.alertSettings.filter((a) => a.id !== action.payload);
      });
  },
});

export default alertSettingSlice.reducer;
