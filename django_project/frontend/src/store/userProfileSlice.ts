import axios from 'axios';
const API_URL = '/api/profile/';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { setCSRFToken } from '../utils/csrfUtils';

interface UserProfileState {
  profile: {
    first_name: string;
    last_name: string;
    email: string;
    organisations: string[];
    user: string;
    country: string;
    user_role: string;
    is_support_staff: boolean;
    profile_image?: string;
  } | null;
  loading: boolean;
  error: string | null;
  updateSuccess: boolean;
}

const initialState: UserProfileState = {
  profile: null,
  loading: false,
  error: null,
  updateSuccess: false,
};


interface PasswordData {
  oldPassword: string;
  newPassword: string;
}


// Fetch user profile from the backend
export const fetchUserProfile = async () => {
  try {
    setCSRFToken();
    const token = localStorage.getItem('auth_token');
    const response = await axios.get(API_URL, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch profile');
  }
};

// Update user profile with data
export const updateUserProfile = async (data: any) => {
  try {
    setCSRFToken();
    const response = await axios.patch(`${API_URL}update/`, data, {
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to update profile');
  }
};

export const updateProfileImage = createAsyncThunk(
  'userProfile/updateProfileImage',
  async (formData: FormData, { rejectWithValue }) => {
    try {
      setCSRFToken();
      const token = localStorage.getItem('auth_token');
      const response = await axios.put('/api/profile/image/', formData, {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.image;
    } catch (error) {
      return rejectWithValue('Error updating profile image');
    }
  }
);


// Define the async thunk with proper typing
export const updatePassword = createAsyncThunk<
  any,
  PasswordData
>(
  'user/updatePassword',
  async (passwordData: PasswordData, { rejectWithValue }) => {
    try {
      setCSRFToken();
      const response = await axios.put('/api/profile/password/', passwordData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Error updating password');
    }
  }
);

// Async thunk to fetch the user profile
export const getUserProfile = createAsyncThunk(
  'userProfile/getUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchUserProfile();
      return data;
    } catch (error) {
      return rejectWithValue('Failed to fetch profile');
    }
  }
);

// Async thunk to update the user profile
export const updateProfile = createAsyncThunk(
  'userProfile/updateProfile',
  async (profileData: any, { rejectWithValue }) => {
    try {
      const data = await updateUserProfile(profileData);
      return data;
    } catch (error) {
      return rejectWithValue('Failed to update profile');
    }
  }
);

export const resetUpdateSuccess = () => ({
  type: 'userProfile/resetUpdateSuccess',
});

const userProfileSlice = createSlice({
  name: 'userProfile',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Handle fetch profile actions
      .addCase(getUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(getUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Handle update profile actions
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.updateSuccess = false;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
        state.updateSuccess = true;
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.updateSuccess = false;
      })
      // Handle profile image update
      .addCase(updateProfileImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfileImage.fulfilled, (state, action) => {
        state.loading = false;
        // Update the profile image in the state
        // if (state.profile) {
        //   state.profile.profile_image = action.payload;
        // }
        state.error = null;
      })
      .addCase(updateProfileImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.updateSuccess = false;
      })
      .addCase('userProfile/resetUpdateSuccess', (state) => {
        state.updateSuccess = false;
      });
  },
});

export default userProfileSlice.reducer;
