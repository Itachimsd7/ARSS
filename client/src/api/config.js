import axiosInstance from './axiosInstance.js'

export const configAPI = {
  getRequirements: async () => {
    const res = await axiosInstance.get('/config/requirements')
    return res.data
  },
  updateRequirements: async (data) => {
    const res = await axiosInstance.put('/config/requirements', data)
    return res.data
  },
}
