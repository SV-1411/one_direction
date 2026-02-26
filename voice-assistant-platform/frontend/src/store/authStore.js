import { create } from 'zustand'

export const useAuthStore = create((set)=>({
  accessToken: localStorage.getItem('accessToken'),
  user: null,
  setAuth: ({access_token,user})=>{ localStorage.setItem('accessToken', access_token); set({accessToken:access_token,user}) },
  logout: ()=>{ localStorage.removeItem('accessToken'); set({accessToken:null,user:null}) }
}))
