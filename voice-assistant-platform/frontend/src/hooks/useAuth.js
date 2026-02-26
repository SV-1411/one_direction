import client from '../api/client'
import { useAuthStore } from '../store/authStore'

export default function useAuth(){
  const setAuth = useAuthStore((s)=>s.setAuth)
  const login = async (username,password)=>{ const {data}=await client.post('/api/auth/login',{username,password}); setAuth({access_token:data.access_token,user:{username}}) }
  return { login }
}
