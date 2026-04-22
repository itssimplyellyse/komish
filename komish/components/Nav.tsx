'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

export default function Nav() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const router = useRouter()

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setProfile(data)
      }
    }
    getProfile()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => getProfile())
    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    router.push('/')
  }

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '18px 48px',
      background: 'rgba(250,247,242,0.92)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--mist)'
    }}>
      <Link href="/" style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.7rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
        Kō<span style={{ color: 'var(--clay)' }}>mish</span>
      </Link>

      <div style={{ display: 'flex', gap: '28px', alignItems: 'center' }}>
        <Link href="/briefs" style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--slate)' }}>Browse Briefs</Link>
        <Link href="/artists" style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--slate)' }}>Browse Artists</Link>

        {profile ? (
          <>
            <Link href="/dashboard" style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--slate)' }}>Dashboard</Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--slate)' }}>
                {profile.full_name?.split(' ')[0]}
              </span>
              <button onClick={signOut} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>
                Sign Out
              </button>
            </div>
          </>
        ) : (
          <>
            <Link href="/auth/login" style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--slate)' }}>Log In</Link>
            <Link href="/auth/signup" className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.85rem' }}>
              Join Free
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
