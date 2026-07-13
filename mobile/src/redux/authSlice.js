import { createSlice } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const initialState = {
  user: null,
  token: null,
  role: 'renter',
  isAuthenticated: false,
  isLoading: true, // Thêm cờ isLoading để chờ check AsyncStorage
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    restoreToken: (state, action) => {
      state.token = action.payload.token;
      state.role = action.payload.role || 'renter';
      state.user = action.payload.user;
      state.isAuthenticated = !!action.payload.token;
      state.isLoading = false;
    },
    loginSuccess: (state, action) => {
      state.token = action.payload.token;
      state.role = action.payload.role;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      AsyncStorage.setItem('token', action.payload.token);
      AsyncStorage.setItem('role', action.payload.role);
      AsyncStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    logout: (state) => {
      state.token = null;
      state.role = 'renter';
      state.user = null;
      state.isAuthenticated = false;
      AsyncStorage.removeItem('token');
      AsyncStorage.removeItem('role');
      AsyncStorage.removeItem('user');
    },
    updateProfile: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      AsyncStorage.setItem('user', JSON.stringify(state.user));
    }
  }
});

export const { restoreToken, loginSuccess, logout, updateProfile } = authSlice.actions;
export default authSlice.reducer;
