import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { DashboardMetrics, SystemHealth, PerformanceMetrics } from '../../types';
import apiService from '../../services/api';

interface DashboardState {
  metrics: DashboardMetrics | null;
  systemHealth: SystemHealth | null;
  performanceMetrics: PerformanceMetrics[];
  isLoading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  metrics: null,
  systemHealth: null,
  performanceMetrics: [],
  isLoading: false,
  error: null,
};

export const fetchDashboardMetrics = createAsyncThunk(
  'dashboard/fetchMetrics',
  async () => {
    return await apiService.getMetrics();
  }
);

export const fetchSystemHealth = createAsyncThunk(
  'dashboard/fetchSystemHealth',
  async () => {
    return await apiService.getSystemHealth();
  }
);

export const fetchPerformanceMetrics = createAsyncThunk(
  'dashboard/fetchPerformanceMetrics',
  async () => {
    return await apiService.getSystemInfo();
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardMetrics.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchDashboardMetrics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.metrics = action.payload;
      })
      .addCase(fetchDashboardMetrics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch metrics';
      })
      .addCase(fetchSystemHealth.fulfilled, (state, action) => {
        state.systemHealth = action.payload;
      })
      .addCase(fetchPerformanceMetrics.fulfilled, (state, action) => {
        state.performanceMetrics = action.payload;
      });
  },
});

export const { clearError } = dashboardSlice.actions;
export default dashboardSlice.reducer; 