import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchProblems = createAsyncThunk('problems/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/problems');
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch problems');
  }
});

export const fetchProblemByCode = createAsyncThunk('problems/fetchOne', async (code, { rejectWithValue }) => {
  try {
    const res = await api.get(`/problems/${code}`);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch problem');
  }
});

const problemsSlice = createSlice({
  name: 'problems',
  initialState: {
    list: [],
    current: null, // { problem, sampleTestCases }
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProblems.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchProblems.fulfilled, (state, action) => { state.status = 'idle'; state.list = action.payload; })
      .addCase(fetchProblems.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload; })
      .addCase(fetchProblemByCode.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchProblemByCode.fulfilled, (state, action) => { state.status = 'idle'; state.current = action.payload; })
      .addCase(fetchProblemByCode.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload; });
  },
});

export default problemsSlice.reducer;