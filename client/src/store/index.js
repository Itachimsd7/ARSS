import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice.js'
import candidatesReducer from './slices/candidatesSlice.js'
import configReducer from './slices/configSlice.js'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    candidates: candidatesReducer,
    config: configReducer,
  },
})
