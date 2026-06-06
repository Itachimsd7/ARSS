import axiosInstance from './axiosInstance.js'

export const authAPI = {
  login: async (email, password) => {
    const res = await axiosInstance.post('/auth/admin/login', { email, password })
    return res.data
  },
  me: async () => {
    const res = await axiosInstance.get('/auth/admin/me')
    return res.data
  },
  logout: async () => {
    const res = await axiosInstance.post('/auth/admin/logout')
    return res.data
  },
}
