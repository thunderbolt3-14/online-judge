import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import problemsReducer from './slices/problemsSlice';
import submissionsReducer from './slices/submissionsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    problems: problemsReducer,
    submissions: submissionsReducer,
  },
});