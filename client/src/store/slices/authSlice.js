import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authAPI } from '../../api/auth.js'

const savedToken = localStorage.getItem('arss_token')
const savedAdmin = JSON.parse(localStorage.getItem('arss_admin') || 'null')

export const loginAdmin = createAsyncThunk(
  'auth/loginAdmin',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      return await authAPI.login(email, password)
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Login failed')
    }
  }
)

export const verifyToken = createAsyncThunk(
  'auth/verifyToken',
  async (_, { rejectWithValue }) => {
    try {
      return await authAPI.me()
    } catch (err) {
      return rejectWithValue('Session expired')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: savedToken || null,
    admin: savedAdmin || null,
    loading: false,
    error: null,
  },
  reducers: {
    logout(state) {
      state.token = null
      state.admin = null
      state.error = null
      localStorage.removeItem('arss_token')
      localStorage.removeItem('arss_admin')
    },
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAdmin.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.loading = false
        state.token = action.payload.token
        state.admin = action.payload.admin
        localStorage.setItem('arss_token', action.payload.token)
        localStorage.setItem('arss_admin', JSON.stringify(action.payload.admin))
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(verifyToken.fulfilled, (state, action) => {
        state.admin = action.payload.admin
      })
      .addCase(verifyToken.rejected, (state) => {
        state.token = null
        state.admin = null
        localStorage.removeItem('arss_token')
        localStorage.removeItem('arss_admin')
      })
  },
})

export const { logout, clearError } = authSlice.actions
export default authSlice.reducer
