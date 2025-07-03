import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { QueueStatus, QueueJob } from '../../types';
import apiService from '../../services/api';

interface QueueState {
  queues: QueueStatus[];
  jobs: QueueJob[];
  total: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: QueueState = {
  queues: [],
  jobs: [],
  total: 0,
  isLoading: false,
  error: null,
};

export const fetchQueueStatus = createAsyncThunk(
  'queue/fetchStatus',
  async () => {
    return await apiService.getQueueStatus();
  }
);



const queueSlice = createSlice({
  name: 'queue',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQueueStatus.fulfilled, (state, action) => {
        state.queues = action.payload;
      });
  },
});

export const { clearError } = queueSlice.actions;
export default queueSlice.reducer; 