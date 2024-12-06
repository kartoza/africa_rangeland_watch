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
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
  isAuthenticated: false,
};



const setCSRFToken = () => {
  const csrfToken = document.cookie.split(';').find((cookie) => cookie.trim().startsWith('csrftoken='));
  if (csrfToken) {
    const token = csrfToken.split('=')[1];
    axios.defaults.headers['X-CSRFToken'] = token;
  } else {
    console.warn('CSRF token not found.');
  }
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
      state.isAuthenticated = true;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.loading = false;
      state.error = null;
      state.isAuthenticated = false;
    },
    setAuthenticationStatus: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload;
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
    setCSRFToken();
    
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


export const checkLoginStatus = () => async (dispatch: AppDispatch) => {
  const token = localStorage.getItem('auth_token');

  // First, try to authenticate using the token
  if (token) {
    axios.defaults.headers['Authorization'] = `Token ${token}`;

    try {
      const response = await axios.get('/api/auth/check-token/');
      dispatch(loginSuccess({
        user: response.data.user,
        token: token,
      }));
      return;
    } catch (error) {
      console.warn("Token validation failed, falling back to user info check.");
    }
  }

  // Fallback: Check user info if the token validation fails
  try {
    setCSRFToken();
    const response = await axios.post("/api/user-info/", {
      credentials: "include",
    });

    if (response.data.is_authenticated) {
      dispatch(authSlice.actions.setAuthenticationStatus(true));

    } else {
      dispatch(authSlice.actions.setAuthenticationStatus(false));
      dispatch(logout());
    }
  } catch (error) {
    console.error("User info validation failed:", error);
    dispatch(authSlice.actions.setAuthenticationStatus(false));
    dispatch(logout());
  }
};




// Logout action
export const logoutUser = () => async (dispatch: AppDispatch) => {
  localStorage.removeItem('auth_token');
  axios.defaults.headers['Authorization'] = '';
  await axios.post('/api/logout/', {}, { withCredentials: true });
  dispatch(logout());
  window.location.href = '/';
};

// Action to request password reset
export const resetPasswordRequest = (email: string) => async (dispatch: AppDispatch) => {
  dispatch(loginStart());

  try {
    setCSRFToken();
    await axios.post('/password-reset/', { email });
    dispatch(loginSuccess({ user: null, token: null }));
  } catch (error) {
    const errorMessage = error.response?.data?.error || 'Error sending password reset email';
    dispatch(loginFailure(errorMessage));
  }
};



// Action to confirm password reset with new password
export const resetPasswordConfirm = (uid: string, token: string, newPassword: string) => async (dispatch: AppDispatch) => {
  dispatch(loginStart());

  try {
    setCSRFToken();
    const url = `/password-reset/confirm/${uid}/${token}/`;

    const response = await axios.post(url, {
      new_password: newPassword,
    });

    if (response.data?.message) {
      dispatch(loginFailure(response.data.message));
    }
    else {
      dispatch(loginFailure(response.data?.error));
    }
  } catch (error) {
    console.log(error)
    dispatch(loginFailure(error.response?.data?.error || 'Error resetting password'));
  }
};



export const registerUser = (email: string, password: string, repeatPassword: string) => async (dispatch: AppDispatch) => {
  dispatch(loginStart());

  const errorMessages = [];

  if (password !== repeatPassword) {
    errorMessages.push("Passwords do not match.");
  }

  if (password.length < 6) {
    errorMessages.push("Password must be at least 6 characters.");
  }

  if (errorMessages.length > 0) {
    dispatch(loginFailure(errorMessages.join(' ')));
    return;
  }

  try {
    setCSRFToken();
    const response = await axios.post('/registration/', {
      email,
      password1: password,
      password2: repeatPassword
    });
    

    if (response.data?.errors) {
      dispatch(loginFailure(response.data.errors.join(' ')));
    }else if (response.data?.message) {
      dispatch(loginSuccess({ user: null, token: null }));
      errorMessages.push("Verification email sent.")
      dispatch(loginFailure(errorMessages.join(' ')));
    }

  } catch (error) {
    if (error.response) {
      const { data, status } = error.response;
      
      if (status === 400 && data?.errors) {
        dispatch(loginFailure(data.errors.join(' ')));
      } else {
        dispatch(loginFailure('An unexpected error occurred during registration.'));
      }
    } else {
      dispatch(loginFailure('An unexpected error occurred during registration.'));
    }
  }
};






export const selectIsLoggedIn = (state: RootState) =>
  !!state.auth.token || state.auth.isAuthenticated;
export const selectAuthLoading = (state: RootState) => state.auth.loading;
export const selectUserEmail = (state: RootState) => state.auth.user?.email;

export default authSlice.reducer;
