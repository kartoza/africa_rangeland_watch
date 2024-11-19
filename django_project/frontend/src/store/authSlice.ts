import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { AppDispatch, RootState } from '.';

interface User {
  username: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.loading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.loading = false;
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, setUser } = authSlice.actions;

// Login action
export const loginUser = (email: string, password: string) => async (dispatch: AppDispatch) => {
  dispatch(loginStart());

  try {
    const csrfToken = document.cookie.split(';').find(cookie => cookie.trim().startsWith('csrftoken='));

    if (csrfToken) {
      const token = csrfToken.split('=')[1];
      axios.defaults.headers['X-CSRFToken'] = token;
    }
    
    const response = await axios.post('/auth/login/', {
      email,
      password,
    });

    const token = response.data.key;
    localStorage.setItem('auth_token', token);
    axios.defaults.headers['Authorization'] = `Token ${token}`;

    dispatch(loginSuccess({ user: response.data.user, token }));
  } catch (error) {
    dispatch(loginFailure(error.response?.data?.non_field_errors[0] || 'Error logging in'));
  }
};

// Check if the user is logged in by checking the token in localStorage
export const checkLoginStatus = () => async (dispatch: AppDispatch) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    axios.defaults.headers['Authorization'] = `Token ${token}`;

    try {
      const response = await axios.get('/api/auth/check-token/');
      dispatch(loginSuccess({
        user: response.data.user,
        token: token,
      }));
    } catch (error) {
      dispatch(logout());
    }
  } else {
    dispatch(logout());
  }
};

// Logout action
export const logoutUser = () => (dispatch: AppDispatch) => {
  localStorage.removeItem('auth_token');
  axios.defaults.headers['Authorization'] = '';
  dispatch(logout());
};

// Action to request password reset
export const resetPasswordRequest = (email: string) => async (dispatch: AppDispatch) => {
  dispatch(loginStart());

  try {
    await axios.post('/auth/password-reset/', { email });
    dispatch(loginSuccess({ user: null, token: null }));
  } catch (error) {
    dispatch(loginFailure(error.response?.data?.non_field_errors[0] || 'Error sending password reset email'));
  }
};

// Action to confirm password reset with new password
export const resetPasswordConfirm = (uid: string, token: string, newPassword: string) => async (dispatch: AppDispatch) => {
  dispatch(loginStart());

  try {
    const response = await axios.post('/auth/password-reset/confirm/', {
      uid,
      token,
      new_password: newPassword,
    });

    dispatch(loginSuccess({ user: null, token: response.data.key }));
  } catch (error) {
    dispatch(loginFailure(error.response?.data?.non_field_errors[0] || 'Error resetting password'));
  }
};


// Register user action (with email verification)
export const registerUser = (email: string, password: string, repeatPassword: string) => async (dispatch: AppDispatch) => {
  dispatch(loginStart());

  try {
    const response = await axios.post('/auth/registration/', {
      email,
      password1: password,
      password2: repeatPassword,
    });

    // If successful, dispatch success and show message
    dispatch(loginSuccess({ user: null, token: null }));

  } catch (error) {
    // Handle different error cases
    if (error.response) {
      const { data } = error.response;
      const errorMessages = [];

      if (data?.non_field_errors) {
        errorMessages.push(data.non_field_errors[0]);
      }

      if (data?.password1) {
        errorMessages.push(...data.password1); 
      }

      if (data?.password2) {
        errorMessages.push(...data.password2);
      }

      if (data?.email) {
        errorMessages.push(...data.email); 
      }

      dispatch(loginFailure(errorMessages.join(' ')));
    } else {
      dispatch(loginFailure('An unexpected error occurred during registration.'));
    }
  }
};



export const selectIsLoggedIn = (state: RootState) => !!state.auth.token;
export const selectAuthLoading = (state: RootState) => state.auth.loading;
export const selectUserEmail = (state: RootState) => state.auth.user?.email;

export default authSlice.reducer;
