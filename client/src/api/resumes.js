import axiosInstance from './axiosInstance.js'

export const resumeAPI = {
  upload: async (file, onUploadProgress) => {
    const formData = new FormData()
    formData.append('resume', file)
    const res = await axiosInstance.post('/resumes/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    })
    return res.data
  },
  getById: async (id) => {
    const res = await axiosInstance.get(`/resumes/${id}`)
    return res.data
  },
}
