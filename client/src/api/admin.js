import axiosInstance from './axiosInstance.js'

export const adminAPI = {
  getStats: async () => {
    const res = await axiosInstance.get('/admin/stats')
    return res.data
  },
  getCandidates: async (params = {}) => {
    const res = await axiosInstance.get('/admin/candidates', { params })
    return res.data
  },
  getCandidate: async (id) => {
    const res = await axiosInstance.get(`/admin/candidates/${id}`)
    return res.data
  },
  updateStatus: async (id, status, adminNotes) => {
    const res = await axiosInstance.patch(`/admin/candidates/${id}/status`, { status, adminNotes })
    return res.data
  },
  updateNotes: async (id, adminNotes) => {
    const res = await axiosInstance.patch(`/admin/candidates/${id}/notes`, { adminNotes })
    return res.data
  },
  deleteCandidate: async (id) => {
    const res = await axiosInstance.delete(`/admin/candidates/${id}`)
    return res.data
  },
  getDownloadUrl: (id) => `/api/admin/candidates/${id}/download`,
}
