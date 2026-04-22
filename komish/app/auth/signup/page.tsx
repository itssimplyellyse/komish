'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function SignUp() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultRole = searchParams.get('role') || 'buyer'

  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: defaultRole })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.full_name, role: form.role } }
    })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/dashboard')
  }

  return (
    <div className="page-narrow">
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div className="section-label">Join Kōmish</div>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '10px' }}>Create your account</h1>
        <p style={{ color: 'var(--slate)', fontSize: '0.9rem' }}>Already have an account? <Link href="/auth/login" style={{ color: 'var(--clay)', fontWeight: 600 }}>Log in</Link></p>
      </div>

      {/* Role selector */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
        {['buyer', 'artist'].map(role => (
          <button key={role} onClick={() => setForm(f => ({ ...f, role }))}
            style={{
              padding: '20px', borderRadius: '12px', cursor: 'pointer',
              border: `2px solid ${form.role === role ? 'var(--clay)' : 'var(--mist)'}`,
              background: form.role === role ? 'rgba(200,96,42,0.05)' : 'white',
              transition: 'all 0.2s', fontFamily: "'DM Sans', sans-serif"
            }}>
            <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>{role === 'buyer' ? '🛍️' : '🎨'}</div>
            <div style={{ fontWeight: 700, marginBottom: '4px', textTransform: 'capitalize' }}>{role === 'buyer' ? "I'm a Buyer" : "I'm an Artist"}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--slate)' }}>
              {role === 'buyer' ? 'Post briefs & commission art' : 'Receive briefs & sell art'}
            </div>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="card">
        {error && <div className="alert alert-error">{error}</div>}
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input className="form-input" type="text" placeholder="Your full name" required
            value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" placeholder="your@email.com" required
            value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input className="form-input" type="password" placeholder="Min. 8 characters" required minLength={8}
            value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
        </div>
        <button type="submit" className="btn-primary" style={{ width: '100%', padding: '14px' }} disabled={loading}>
          {loading ? 'Creating account...' : `Join as ${form.role === 'buyer' ? 'a Buyer' : 'an Artist'}`}
        </button>
        <p style={{ fontSize: '0.75rem', color: 'var(--slate)', textAlign: 'center', marginTop: '14px' }}>
          By joining you agree to our Terms of Service and Privacy Policy.
        </p>
      </form>
    </div>
  )
}
