'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Login() {
  const router = useRouter()
  const [form, setForm] = useState({ email:'', password:'' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword(form)
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/dashboard')
  }

  return (
    <div className="page-narrow">
      <div style={{textAlign:'center',marginBottom:'40px'}}>
        <div className="section-label">Welcome Back</div>
        <h1 style={{fontSize:'2.2rem',marginBottom:'10px'}}>Log in to Kōmish</h1>
        <p style={{color:'#4a5568',fontSize:'0.9rem'}}>No account? <a href="/auth/signup" style={{color:'#c8602a',fontWeight:600}}>Sign up free</a></p>
      </div>
      <form onSubmit={handleSubmit} className="card">
        {error && <div className="alert alert-error">{error}</div>}
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" required value={form.email} onChange={e => setForm(f => ({...f,email:e.target.value}))} />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input className="form-input" type="password" required value={form.password} onChange={e => setForm(f => ({...f,password:e.target.value}))} />
        </div>
        <button type="submit" className="btn-primary" style={{width:'100%',padding:'14px'}} disabled={loading}>
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>
    </div>
  )
}
