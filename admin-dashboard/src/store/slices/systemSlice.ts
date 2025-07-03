import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { SystemConfig } from '../../types';
import apiService from '../../services/api';

interface SystemState {
  config: SystemConfig | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: SystemState = {
  config: null,
  isLoading: false,
  error: null,
};

export const fetchSystemConfig = createAsyncThunk(
  'system/fetchConfig',
  async () => {
    return await apiService.getSystemInfo();
  }
);

export const updateSystemConfig = createAsyncThunk(
  'system/updateConfig',
  async (config: Partial<SystemConfig>) => {
    return await apiService.getSystemInfo();
  }
);

const systemSlice = createSlice({
  name: 'system',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSystemConfig.fulfilled, (state, action) => {
        state.config = action.payload;
      })
      .addCase(updateSystemConfig.fulfilled, (state, action) => {
        state.config = action.payload;
      });
  },
});

export const { clearError } = systemSlice.actions;
export default systemSlice.reducer; 