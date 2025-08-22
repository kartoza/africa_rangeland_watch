// src/store/userIndicatorSlice.ts
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';


export interface VisParams {
  minValue: number;
  maxValue: number;
  colors: string[];
  opacity: number;
}

export interface UserIndicatorFormData {
  id?: number;
  sessionId?: string;
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
  inputLayerId?: string;

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
}

const initialState: UserIndicatorState = {
  formData: {
    name: '',
    description: '',
    analysisTypes: [],
    temporalResolutions: [],
    geeAssetID: '',
    geeAssetType: null,
    uploadedInputLayerName: '',
    uploadedInputLayerId: '',
    inputLayerId: '',
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
        endDate
      };
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    resetForm(state) {
      state.formData = initialState.formData;
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
  resetForm
} = userIndicatorSlice.actions;

export default userIndicatorSlice.reducer;
