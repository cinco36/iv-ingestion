import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { FileInfo } from '../../types';
import apiService from '../../services/api';

interface FileState {
  files: FileInfo[];
  total: number;
  page: number;
  limit: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: FileState = {
  files: [],
  total: 0,
  page: 1,
  limit: 20,
  isLoading: false,
  error: null,
};

export const fetchFiles = createAsyncThunk(
  'files/fetchFiles',
  async () => {
    return await apiService.getFiles();
  }
);

export const uploadFile = createAsyncThunk(
  'files/uploadFile',
  async (file: File) => {
    return await apiService.uploadFile(file);
  }
);

const fileSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFiles.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchFiles.fulfilled, (state, action) => {
        state.isLoading = false;
        state.files = action.payload.files;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
      })
      .addCase(fetchFiles.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch files';
      })
      .addCase(uploadFile.fulfilled, (state, action) => {
        state.files.unshift(action.payload);
      });
  },
});

export const { clearError } = fileSlice.actions;
export default fileSlice.reducer; 