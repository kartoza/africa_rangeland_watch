import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

interface FeedbackState {
  loading: boolean;
  error: string | null;
  success: boolean;
  message: string | null;
}

const initialState: FeedbackState = {
  loading: false,
  error: null,
  success: false,
  message: null,
};

// Async thunk for submitting feedback
export const submitFeedback = createAsyncThunk(
  'feedback/submit',
  async (message: string, { rejectWithValue }) => {
    try {
      const response = await axios.post('/feedback-api/feedback/', { message });
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        // Handle validation errors from backend
        if (error.response.data.message) {
          return rejectWithValue({ message: error.response.data.message });
        }
        // Handle field-specific errors
        const errorMessage = error.response.data.message?.[0] || 
                           Object.values(error.response.data)[0] ||
                           'Failed to submit feedback. Please try again.';
        return rejectWithValue({ message: errorMessage });
      }
      return rejectWithValue({ message: 'Failed to submit feedback. Please try again.' });
    }
  }
);

const feedbackSlice = createSlice({
  name: 'feedback',
  initialState,
  reducers: {
    resetFeedbackState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitFeedback.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
        state.message = null;
      })
      .addCase(submitFeedback.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.success = true;
        state.message = action.payload.message || 'Feedback submitted successfully!';
        state.error = null;
      })
      .addCase(submitFeedback.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload?.message || 'An error occurred while submitting feedback.';
        state.message = null;
      });
  },
});

export const { resetFeedbackState } = feedbackSlice.actions;
export default feedbackSlice.reducer;
