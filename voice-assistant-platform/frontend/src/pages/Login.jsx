import { useState } from 'react'
import useAuth from '../hooks/useAuth'

export default function Login(){const [u,setU]=useState('admin');const [p,setP]=useState('admin'); const {login}=useAuth(); return <div><h2>Login</h2><input value={u} onChange={e=>setU(e.target.value)}/><input type='password' value={p} onChange={e=>setP(e.target.value)}/><button onClick={()=>login(u,p)}>Login</button></div>}
