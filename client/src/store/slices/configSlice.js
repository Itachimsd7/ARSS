import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { configAPI } from '../../api/config.js'

export const fetchConfig = createAsyncThunk(
  'config/fetch',
  async (_, { rejectWithValue }) => {
    try {
      return await configAPI.getRequirements()
    } catch (err) {
      return rejectWithValue('Failed to load config')
    }
  }
)

export const saveConfig = createAsyncThunk(
  'config/save',
  async (configData, { rejectWithValue }) => {
    try {
      return await configAPI.updateRequirements(configData)
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to save config')
    }
  }
)

const configSlice = createSlice({
  name: 'config',
  initialState: {
    data: null,
    loading: false,
    saving: false,
    error: null,
    saved: false,
  },
  reducers: {
    clearSaved(state) { state.saved = false },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConfig.pending, (state) => { state.loading = true })
      .addCase(fetchConfig.fulfilled, (state, action) => {
        state.loading = false
        state.data = action.payload.data
      })
      .addCase(fetchConfig.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(saveConfig.pending, (state) => { state.saving = true; state.saved = false })
      .addCase(saveConfig.fulfilled, (state, action) => {
        state.saving = false
        state.data = action.payload.data
        state.saved = true
      })
      .addCase(saveConfig.rejected, (state, action) => {
        state.saving = false
        state.error = action.payload
      })
  },
})

export const { clearSaved } = configSlice.actions
export default configSlice.reducer
