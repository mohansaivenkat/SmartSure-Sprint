import { createSlice } from '@reduxjs/toolkit';
import type { RootState } from './index';

interface ThemeState {
  darkMode: boolean;
}

const getInitialTheme = (): boolean => {
  try {
    const stored = localStorage.getItem('theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
};

const initialState: ThemeState = {
  darkMode: getInitialTheme(),
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.darkMode = !state.darkMode;
    },
    setTheme: (state, action) => {
      state.darkMode = action.payload;
    }
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export const selectDarkMode = (state: RootState) => state.theme.darkMode;

export default themeSlice.reducer;
