// src/store/userIndicatorSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';


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
  variableName: string;
  description?: string;
  analysisTypes: string[];
  temporalResolutions: string[];
  geeAssetID?: string;
  uploadedInputLayerName?: string;
  uploadedInputLayerId?: string;
  inputLayerId?: string;
  bands: string[];
  selectedBand: string;
  reducer: string;
  // visParams
  minValue?: number;
  maxValue?: number;
  colors?: string[];
  opacity?: number;
};

export interface UpdateFieldPayload {
  field: keyof UserIndicatorFormData;
  value: string | boolean | string[];
  isCheckbox?: boolean;
  isChecked?: boolean;
}

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
    variableName: '',
    description: '',
    analysisTypes: [],
    temporalResolutions: [],
    geeAssetID: '',
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
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
  },
});

// Export the actions
export const {
  setFormField,
  setLoading
} = userIndicatorSlice.actions;

export default userIndicatorSlice.reducer;
