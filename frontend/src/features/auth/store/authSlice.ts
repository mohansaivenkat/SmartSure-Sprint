import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../../store';

interface User {
  id?: string;
  name?: string;
  email?: string;
  role: 'ADMIN' | 'CUSTOMER';
  token?: string;
  phone?: string;
  address?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const getUserFromStorage = (): User | null => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

const initialState: AuthState = {
  user: getUserFromStorage(),
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
    loginSuccess: (state, action: PayloadAction<User>) => {
      state.loading = false;
      state.user = action.payload;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, clearError } = authSlice.actions;

export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectIsAdmin = (state: RootState) => state.auth.user?.role === 'ADMIN';
export const selectIsCustomer = (state: RootState) => state.auth.user?.role === 'CUSTOMER';
export const selectAuthLoading = (state: RootState) => state.auth.loading;

export default authSlice.reducer;
