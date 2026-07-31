import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const createSubmission = createAsyncThunk('submissions/create', async (submissionData, { rejectWithValue }) => {
  try {
    const res = await api.post('/submissions', submissionData);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Submission failed');
  }
});

export const fetchSubmission = createAsyncThunk('submissions/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const res = await api.get(`/submissions/${id}`);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch submission');
  }
});

const submissionsSlice = createSlice({
  name: 'submissions',
  initialState: {
    current: null,
    status: 'idle',
    error: null,
  },
  reducers: {
    clearCurrentSubmission: (state) => { state.current = null; },
    submissionUpdated: (state, action) => {
      if (state.current && state.current._id === action.payload.submissionId) {
        state.current.status = action.payload.status;
        state.current.executionTimeMs = action.payload.executionTimeMs;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createSubmission.pending, (state) => { state.status = 'loading'; })
      .addCase(createSubmission.fulfilled, (state, action) => { state.status = 'idle'; state.current = action.payload; })
      .addCase(createSubmission.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload; })
      .addCase(fetchSubmission.fulfilled, (state, action) => { state.current = action.payload; });
  },
});

export const { clearCurrentSubmission, submissionUpdated } = submissionsSlice.actions;
export default submissionsSlice.reducer;