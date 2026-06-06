import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { adminAPI } from '../../api/admin.js'

export const fetchCandidates = createAsyncThunk(
  'candidates/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      return await adminAPI.getCandidates(params)
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch candidates')
    }
  }
)

export const fetchStats = createAsyncThunk(
  'candidates/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      return await adminAPI.getStats()
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch stats')
    }
  }
)

export const updateCandidateStatus = createAsyncThunk(
  'candidates/updateStatus',
  async ({ id, status, adminNotes }, { rejectWithValue }) => {
    try {
      return await adminAPI.updateStatus(id, status, adminNotes)
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update status')
    }
  }
)

export const deleteCandidate = createAsyncThunk(
  'candidates/delete',
  async (id, { rejectWithValue }) => {
    try {
      await adminAPI.deleteCandidate(id)
      return id
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete')
    }
  }
)

const candidatesSlice = createSlice({
  name: 'candidates',
  initialState: {
    list: [],
    pagination: { total: 0, page: 1, limit: 10, pages: 1 },
    stats: null,
    loading: false,
    statsLoading: false,
    error: null,
    selectedCandidate: null,
  },
  reducers: {
    setSelectedCandidate(state, action) {
      state.selectedCandidate = action.payload
    },
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCandidates.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchCandidates.fulfilled, (state, action) => {
        state.loading = false
        state.list = action.payload.data
        state.pagination = action.payload.pagination
      })
      .addCase(fetchCandidates.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(fetchStats.pending, (state) => { state.statsLoading = true })
      .addCase(fetchStats.fulfilled, (state, action) => {
        state.statsLoading = false
        state.stats = action.payload.data
      })
      .addCase(fetchStats.rejected, (state) => { state.statsLoading = false })
      .addCase(updateCandidateStatus.fulfilled, (state, action) => {
        const updated = action.payload.data
        const idx = state.list.findIndex((c) => c._id === updated._id)
        if (idx !== -1) state.list[idx] = updated
        if (state.selectedCandidate?._id === updated._id) {
          state.selectedCandidate = updated
        }
      })
      .addCase(deleteCandidate.fulfilled, (state, action) => {
        state.list = state.list.filter((c) => c._id !== action.payload)
        if (state.selectedCandidate?._id === action.payload) {
          state.selectedCandidate = null
        }
      })
  },
})

export const { setSelectedCandidate, clearError } = candidatesSlice.actions
export default candidatesSlice.reducer
