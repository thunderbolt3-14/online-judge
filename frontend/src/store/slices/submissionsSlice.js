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
    current: null, // the submission being tracked after a fresh submit
    status: 'idle',
    error: null,
  },
  reducers: {
    clearCurrentSubmission: (state) => { state.current = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createSubmission.pending, (state) => { state.status = 'loading'; })
      .addCase(createSubmission.fulfilled, (state, action) => { state.status = 'idle'; state.current = action.payload; })
      .addCase(createSubmission.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload; })
      .addCase(fetchSubmission.fulfilled, (state, action) => { state.current = action.payload; });
  },
});

export const { clearCurrentSubmission } = submissionsSlice.actions;
export default submissionsSlice.reducer;