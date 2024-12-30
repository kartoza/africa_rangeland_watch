import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { fetchLayers } from './layerSlice';


interface UploadState {
  file: File | null;
  uploadProgress: number;
  processingProgress: number;
  status: 'idle' | 'uploading' | 'processing' | 'success' | 'failed';
  error: string | null;
  inputLayerId: string | null;
  layerId: string | null;
  uploadId: string | null;
  processingNote: string | null;
}

const initialState: UploadState = {
  file: null,
  uploadProgress: 0,
  processingProgress: 0,
  status: 'idle',
  error: null,
  inputLayerId: null,
  layerId: null,
  uploadId: null,
  processingNote: null
};

// Async thunk for uploading a file
export const uploadFile = createAsyncThunk(
  'upload/file',
  async (file: File, { dispatch, rejectWithValue }) => {
    dispatch(setUploadStarted(file));
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/frontend-api/upload-layer/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (event) => {
          const progress = Math.round((event.loaded * 100) / event.total);
          dispatch(setUploadProgress(progress));
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Upload failed');
    }
  }
);

// Async thunk to fetch background processing status
export const fetchProcessingStatus = createAsyncThunk(
  'upload/fetchStatus',
  async ({layerId, uploadId}: {layerId: string, uploadId: string}, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/layer/${layerId}/layer-upload/${uploadId}/`);
      
      if (response.data && response.data['status'] === 'Success') {
        dispatch(fetchLayers())
      }

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Failed to fetch status');
    }
  }
);

const uploadSlice = createSlice({
  name: 'upload',
  initialState,
  reducers: {
    setUploadStarted: (state, action: PayloadAction<File>) => {
        state.file = action.payload;
        state.status = 'uploading';
        state.uploadProgress = 0;
    },
    setUploadProgress: (state, action: PayloadAction<number>) => {
        state.uploadProgress = action.payload;
    },
    resetState: (state) => {
      state.file = null;
      state.uploadProgress = 0;
      state.processingProgress = 0;
      state.status = 'idle';
      state.error = null;
      state.inputLayerId = null;
      state.layerId = null;
      state.uploadId = null;
      state.processingNote = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadFile.pending, (state) => {
        state.status = 'uploading';
        state.uploadProgress = 0;
        state.error = null;
      })
      .addCase(uploadFile.fulfilled, (state, action: PayloadAction<{ id: string, layer_id: string, upload_id: string  }>) => {
        state.status = 'processing';
        state.error = null;
        state.processingProgress = 0;
        state.inputLayerId = action.payload.id;
        state.layerId = action.payload.layer_id;
        state.uploadId = action.payload.upload_id;
      })
      .addCase(uploadFile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      .addCase(fetchProcessingStatus.fulfilled, (state, action: PayloadAction<{ progress: number; status: string; note: string }>) => {
        state.processingProgress = action.payload.progress;
        if (action.payload.status === 'Success') {
          state.status = 'success';
        } else if (action.payload.status === 'Failed') {
            state.status = 'failed';
            state.error = action.payload.note;
        }
        state.processingNote = action.payload.note;
      })
      .addCase(fetchProcessingStatus.rejected, (state, action) => {
        state.error = action.payload as string;
        state.status = 'failed';
      });
  },
});

export const { setUploadStarted, setUploadProgress, resetState } = uploadSlice.actions;
export default uploadSlice.reducer;