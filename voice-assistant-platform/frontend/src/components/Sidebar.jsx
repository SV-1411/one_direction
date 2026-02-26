import { Link } from 'react-router-dom'
export default function Sidebar(){return <nav style={{width:180,display:'flex',flexDirection:'column',gap:8,padding:8}}><Link to='/'>Dashboard</Link><Link to='/voice'>Voice</Link><Link to='/analytics'>Analytics</Link><Link to='/transcripts'>Transcripts</Link><Link to='/fraud-alerts'>Fraud</Link><Link to='/settings'>Settings</Link></nav>}
