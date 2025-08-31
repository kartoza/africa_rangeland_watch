// src/store/userIndicatorSlice.ts
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';


export interface FileWithId extends File {
  id: string;
  deleteUrl?: string;
  uploadItemID?: number;
}

export interface UploadProgress {
  [fileId: string]: number;
}

export interface UploadStatus {
  [fileId: string]: 'pending' | 'uploading' | 'completed' | 'error' | 'paused';
}

interface UploadSession {
  sessionUrl: string;
  uploadedBytes: number;
  totalBytes: number;
  retryCount: number;
}


export interface VisParams {
  minValue: number;
  maxValue: number;
  colors: string[];
  opacity: number;
}

export interface UploadedFile {
  uploadItemID: number;
  fileName: string;
  fileSize: number;
  startDate?: string;
  endDate?: string;
}

export interface SignedUrlResponse {
  signedUrl: string;
  sessionID: string;
  uploadItemID: number;
  deleteUrl?: string;
}

export interface UserIndicatorFormData {
  id?: number;
  sessionID?: string;
  name: string;
  description?: string;
  analysisTypes: string[];
  temporalResolutions: string[];
  // asset info
  geeAssetID?: string;
  geeAssetType?: 'image' | 'image_collection';
  startDate?: string;
  endDate?: string;

  uploadedInputLayerName?: string;
  uploadedInputLayerId?: string;

  // config
  bands: string[];
  selectedBand: string;
  reducer: string;

  // visParams
  minValue?: number;
  maxValue?: number;
  colors?: string[];
  opacity?: number;

  // createdAt
  createdDate?: string;

  // uploaded files
  files?: UploadedFile[];
};

// Payload for updating formData
export interface UpdateFieldPayload {
  field: keyof UserIndicatorFormData;
  value: string | boolean | string[] | number;
  isCheckbox?: boolean;
  isChecked?: boolean;
}
export interface UpdateBandsPayload {
  bands: string[];
  geeAssetType: 'image' | 'image_collection';
  startDate?: string;
  endDate?: string;
  files?: UploadedFile[];
}

export const REDUCER_VALUE_LIST = [
  "mean",
  "sum",
  "median",
  "mode",
  "min",
  "max"
]

// State for storing data
interface UserIndicatorState {
  formData: UserIndicatorFormData;
  data: UserIndicatorFormData[];
  loading: boolean;
  error: string | null;
  uploadedFiles: FileWithId[];
  uploadProgress: UploadProgress;
  uploadStatus: UploadStatus;
}

const initialState: UserIndicatorState = {
  formData: {
    name: '',
    sessionID: '',
    description: '',
    analysisTypes: [],
    temporalResolutions: [],
    geeAssetID: '',
    geeAssetType: null,
    uploadedInputLayerName: '',
    uploadedInputLayerId: '',
    bands: [],
    selectedBand: '',
    reducer: '',
    minValue: 0,
    maxValue: 100,
    colors: ['#f9837b', '#fffcb9', '#fffcb9', '#32c2c8'],
    opacity: 1,
  },
  data: [],
  loading: false,
  error: null,
  uploadedFiles: [],
  uploadProgress: {},
  uploadStatus: {}
};

// Async thunk for fetching user indicator data
export const fetchUserIndicator = createAsyncThunk(
  'user-indicator/fetchUserIndicator',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/frontend-api/user-indicator/');

      let results: UserIndicatorFormData[] = response.data.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        analysisTypes: item.analysis_types,
        temporalResolutions: item.temporal_resolutions,
        geeAssetType: item.gee_asset_type,
        bands: [] as string[],
        selectedBand: item.selected_band,
        createdDate: item.created_date,
      }));

      return results;
    } catch (error) {
      return rejectWithValue('Error fetching user indicator data');
    }
  }
);


const userIndicatorSlice = createSlice({
  name: 'userIndicator',
  initialState,
  reducers: {
    setFormField(state, action: PayloadAction<UpdateFieldPayload>) {
      const { field, value, isCheckbox, isChecked } = action.payload;
      if (isCheckbox) {
        const updatedValue: string[] = isChecked === true
          ? [...(state.formData[field] as string[]), value as string]
          : (state.formData[field] as string[]).filter(m => m !== value);
        state.formData = {
          ...state.formData,
          [field]: updatedValue
        }
      } else {
        state.formData = {
          ...state.formData,
          [field]: value
        };
      }
    },
    setBandsData(state, action: PayloadAction<UpdateBandsPayload>) {
      const { bands, geeAssetType, startDate, endDate } = action.payload;
      const selectedBand = bands && bands.length > 0 ? bands[0] : '';
      const reducer = REDUCER_VALUE_LIST[0];
      state.formData = {
        ...state.formData,
        bands,
        selectedBand,
        reducer,
        geeAssetType,
        startDate,
        endDate,
        files: action.payload.files || []
      };
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    resetForm(state) {
      state.formData = initialState.formData;
    },
    setSessionID(state, action: PayloadAction<string>) {
      state.formData = {
        ...state.formData,
        sessionID: action.payload
      }
    },
    startUpload(state, action: PayloadAction<string>) {
      state.uploadStatus = {
        ...state.uploadStatus,
        [action.payload]: 'uploading'
      }
      state.uploadProgress = {
        ...state.uploadProgress,
        [action.payload]: 0
      }
    },
    setUploadProgress(state, action: PayloadAction<{ fileId: string; progress: number }>) {
      state.uploadProgress = {
        ...state.uploadProgress,
        [action.payload.fileId]: action.payload.progress
      }
    },
    setFileAttributes(state, action: PayloadAction<{ fileId: string; deleteUrl?: string; uploadItemID?: number }>) {
      const { fileId, deleteUrl, uploadItemID } = action.payload;
      state.uploadedFiles = state.uploadedFiles.map(file => {
        if (file.id === fileId) {
          file.deleteUrl = deleteUrl;
          file.uploadItemID = uploadItemID;
        }
        return file;
      });
    },
    setUploadCompleted(state, action: PayloadAction<string>) {
      state.uploadStatus = {
        ...state.uploadStatus,
        [action.payload]: 'completed'
      }
    },
    setUploadError(state, action: PayloadAction<string>) {
      state.uploadStatus = {
        ...state.uploadStatus,
        [action.payload]: 'error'
      }
    },
    removeFile(state, action: PayloadAction<number>) {
      const index = action.payload;
      const file = state.uploadedFiles[index];

      state.uploadedFiles = state.uploadedFiles.filter((_, i) => i !== index);
      const newProgress = {...state.uploadProgress};
      delete newProgress[file.id];
      state.uploadProgress = newProgress;

      const newStatus = {...state.uploadStatus};
      delete newStatus[file.id];
      state.uploadStatus = newStatus;

      if (state.formData.bands.length > 0) {
        // reinit the bands and files
        state.formData = {
          ...state.formData,
          bands: [],
          files: [],
          geeAssetType: null,
          startDate: null,
          endDate: null
        }
      }
    },
    addFiles(state, action: PayloadAction<FileWithId[]>) {
      state.uploadedFiles = [
        ...state.uploadedFiles,
        ...action.payload
      ];

      if (state.formData.bands.length > 0) {
        // reinit the bands and files
        state.formData = {
          ...state.formData,
          bands: [],
          files: [],
          geeAssetType: null,
          startDate: null,
          endDate: null
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserIndicator.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.data = [];
      })
      .addCase(fetchUserIndicator.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchUserIndicator.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
    },
});

// Export the actions
export const {
  setFormField,
  setBandsData,
  setLoading,
  resetForm,
  setSessionID,
  removeFile,
  startUpload,
  setUploadProgress,
  setFileAttributes,
  setUploadCompleted,
  setUploadError,
  addFiles
} = userIndicatorSlice.actions;

export default userIndicatorSlice.reducer;
