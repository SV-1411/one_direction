import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const client = axios.create({ baseURL: '/' })

client.interceptors.request.use((config)=>{
  const token = useAuthStore.getState().accessToken
  if(token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use((r)=>r, async (error)=>{
  if(error.response?.status===401){
    useAuthStore.getState().logout()
  }
  return Promise.reject(error)
})

export default client
