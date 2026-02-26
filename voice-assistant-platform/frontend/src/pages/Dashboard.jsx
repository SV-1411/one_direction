import { useEffect, useState } from 'react'
import client from '../api/client'

export default function Dashboard(){const [d,setD]=useState(null); useEffect(()=>{client.get('/api/analytics/dashboard').then(r=>setD(r.data)).catch(()=>{})},[]); return <div><h2>Dashboard</h2><pre>{JSON.stringify(d,null,2)}</pre></div>}
