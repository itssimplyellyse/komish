'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Profile, Brief, Proposal, Pitch } from '@/types'

export default function Dashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [briefs, setBriefs] = useState<Brief[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [pitches, setPitches] = useState<Pitch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)

      if (prof?.role === 'buyer') {
        const [b, p] = await Promise.all([
          supabase.from('briefs').select('*, brief_tags(*)').eq('buyer_id', user.id).order('created_at', { ascending: false }),
          supabase.from('pitches').select('*, artist:profiles!pitches_artist_id_fkey(*)').eq('buyer_id', user.id).order('created_at', { ascending: false })
        ])
        if (b.data) setBriefs(b.data)
        if (p.data) setPitches(p.data)
      } else {
        const [p, pit] = await Promise.all([
          supabase.from('proposals').select('*, briefs(*, profiles(*))').eq('artist_id', user.id).order('created_at', { ascending: false }),
          supabase.from('pitches').select('*, buyer:profiles!pitches_buyer_id_fkey(*)').eq('artist_id', user.id).order('created_at', { ascending: false })
        ])
        if (p.data) setProposals(p.data)
        if (pit.data) setPitches(pit.data)
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="page" style={{ textAlign: 'center', paddingTop: '140px' }}>Loading...</div>
  if (!profile) return null

  return (
    <div className="page">
      <div style={{ marginBottom: '40px' }}>
        <div className="section-label">{profile.role === 'buyer' ? 'Buyer' : 'Artist'} Dashboard</div>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Welcome back, {profile.full_name?.split(' ')[0]} 👋</h1>
        <p style={{ color: 'var(--slate)' }}>
          {profile.role === 'buyer' ? 'Manage your briefs and pitches.' : 'Track your proposals and incoming pitches.'}
        </p>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '48px', flexWrap: 'wrap' }}>
        {profile.role === 'buyer' ? (
          <>
            <Link href="/briefs/new" className="btn-primary">+ Post a Brief</Link>
            <Link href="/artists" className="btn-secondary">Browse Artists</Link>
            <Link href={`/artists/${profile.id}/edit`} className="btn-outline">Edit Profile</Link>
          </>
        ) : (
          <>
            <Link href="/briefs" className="btn-primary">Browse Open Briefs</Link>
            <Link href={`/artists/${profile.id}`} className="btn-secondary">View My Profile</Link>
            <Link href={`/artists/${profile.id}/edit`} className="btn-outline">Edit Profile</Link>
          </>
        )}
      </div>

      {profile.role === 'buyer' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
          {/* Briefs */}
          <div>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '20px' }}>Your Briefs ({briefs.length})</h2>
            {briefs.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', color: 'var(--slate)', padding: '40px' }}>
                <p style={{ marginBottom: '16px' }}>No briefs yet.</p>
                <Link href="/briefs/new" className="btn-primary">Post Your First Brief</Link>
              </div>
            ) : briefs.map(brief => (
              <Link href={`/brief/${brief.id}`} key={brief.id} className="card" style={{ display: 'block', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: '6px' }}>{brief.title}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {brief.brief_tags?.slice(0, 3).map(t => <span key={t.id} className="tag" style={{ fontSize: '0.7rem' }}>{t.tag}</span>)}
                    </div>
                  </div>
                  <span className={`badge badge-${brief.status.replace('_', '-')}`}>{brief.status}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Pitches sent */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.3rem' }}>Direct Pitches ({pitches.length})</h2>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: 'var(--slate)' }}>
                {profile.pitch_count}/{profile.pitch_limit} used this month
              </span>
            </div>
            {pitches.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', color: 'var(--slate)', padding: '40px' }}>
                <p style={{ marginBottom: '16px' }}>No pitches sent yet.</p>
                <Link href="/artists" className="btn-outline">Browse Artists</Link>
              </div>
            ) : pitches.map(pitch => (
              <div key={pitch.id} className="card" style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 600 }}>{(pitch as any).artist?.full_name || 'Artist'}</div>
                  <span className={`badge ${pitch.status === 'accepted' ? 'badge-verified' : pitch.status === 'pending' ? 'badge-open' : 'badge-closed'}`}>
                    {pitch.status}
                  </span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--slate)', marginTop: '6px' }}>{pitch.message.slice(0, 80)}...</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
          {/* Proposals */}
          <div>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '20px' }}>Your Proposals ({proposals.length})</h2>
            {proposals.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', color: 'var(--slate)', padding: '40px' }}>
                <p style={{ marginBottom: '16px' }}>No proposals yet.</p>
                <Link href="/briefs" className="btn-primary">Browse Open Briefs</Link>
              </div>
            ) : proposals.map(proposal => (
              <div key={proposal.id} className="card" style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: '4px' }}>
                      {(proposal as any).briefs?.title || 'Brief'}
                    </div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.8rem', color: 'var(--clay)', fontWeight: 600 }}>
                      ${proposal.price} · {proposal.delivery_days} days
                    </div>
                  </div>
                  <span className={`badge ${proposal.status === 'accepted' ? 'badge-verified' : proposal.status === 'pending' ? 'badge-open' : 'badge-closed'}`}>
                    {proposal.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pitches received */}
          <div>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '20px' }}>Pitches Received ({pitches.length})</h2>
            {pitches.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', color: 'var(--slate)', padding: '40px' }}>
                <p>No pitches yet. Complete your profile to get discovered!</p>
              </div>
            ) : pitches.map(pitch => (
              <div key={pitch.id} className="card" style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 600 }}>{(pitch as any).buyer?.full_name || 'Buyer'}</div>
                  <span className={`badge ${pitch.status === 'accepted' ? 'badge-verified' : 'badge-open'}`}>{pitch.status}</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--slate)' }}>{pitch.message.slice(0, 100)}...</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
