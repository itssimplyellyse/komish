'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

const FILTERS = ['All', 'Watercolour', 'Digital', 'Oil Paint', 'Portrait', 'Charcoal', 'Verified']

export default function Artists() {
  const [artists, setArtists] = useState<Profile[]>([])
  const [filter, setFilter] = useState('All')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [pitching, setPitching] = useState<string | null>(null)
  const [pitchMsg, setPitchMsg] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [{ data: a }, { data: { user } }] = await Promise.all([
        supabase.from('profiles').select('*, artist_tags(*)').eq('role', 'artist').order('created_at', { ascending: false }),
        supabase.auth.getUser()
      ])
      if (a) setArtists(a)
      if (user) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setProfile(prof)
      }
      setLoading(false)
    }
    load()
  }, [])

  const sendPitch = async (artistId: string) => {
    if (!profile) { window.location.href = '/auth/login'; return }
    if (profile.pitch_count >= profile.pitch_limit) {
      alert('You\'ve used all your free pitches this month. Upgrade to send more!'); return
    }
    const { error } = await supabase.from('pitches').insert({
      buyer_id: profile.id, artist_id: artistId, message: pitchMsg
    })
    if (!error) {
      await supabase.from('profiles').update({ pitch_count: profile.pitch_count + 1 }).eq('id', profile.id)
      setProfile(p => p ? { ...p, pitch_count: p.pitch_count + 1 } : p)
      setPitching(null); setPitchMsg('')
      alert('Pitch sent! The artist will respond within 48 hours.')
    }
  }

  const filtered = filter === 'All' ? artists
    : filter === 'Verified' ? artists.filter(a => a.verified)
    : artists.filter(a => (a as any).artist_tags?.some((t: any) => t.tag === filter))

  const pitchesLeft = profile ? profile.pitch_limit - profile.pitch_count : 5

  return (
    <div className="page">
      <div style={{ marginBottom: '40px' }}>
        <div className="section-label">Browse & Pitch</div>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Find your artist.</h1>
        <p style={{ color: 'var(--slate)' }}>Browse by style or medium. Love their work? Pitch your idea directly.</p>
      </div>

      {/* Pitch counter */}
      {profile?.role === 'buyer' && (
        <div style={{ background: 'var(--warm-white)', border: '1.5px solid var(--mist)', borderRadius: '12px', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {Array.from({ length: profile.pitch_limit }).map((_, i) => (
              <div key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: i < profile.pitch_count ? 'var(--clay)' : 'var(--mist)', transition: 'background 0.3s' }} />
            ))}
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--slate)' }}>
            <strong style={{ color: 'var(--ink)' }}>{profile.pitch_count} of {profile.pitch_limit}</strong> free pitches used this month
          </span>
          {pitchesLeft === 0 && (
            <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--clay)', fontWeight: 600, cursor: 'pointer' }}>
              Need more? Upgrade →
            </span>
          )}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '36px' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: '8px 18px', borderRadius: '24px', cursor: 'pointer',
              border: `1.5px solid ${filter === f ? 'var(--clay)' : 'var(--mist)'}`,
              background: filter === f ? 'var(--clay)' : 'white',
              color: filter === f ? 'white' : 'var(--slate)',
              fontSize: '0.82rem', fontWeight: 500, transition: 'all 0.15s',
              fontFamily: "'DM Sans', sans-serif"
            }}>{f}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px', color: 'var(--slate)' }}>Loading artists...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px' }}>
          <p style={{ color: 'var(--slate)', marginBottom: '20px' }}>No artists found. Be the first!</p>
          <Link href="/auth/signup?role=artist" className="btn-primary">Join as an Artist</Link>
        </div>
      ) : (
        <div className="grid-3">
          {filtered.map(artist => (
            <div key={artist.id} className="card">
              <Link href={`/artists/${artist.id}`} style={{ display: 'block' }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--mist)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0, overflow: 'hidden' }}>
                    {artist.avatar_url ? <img src={artist.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : '🎨'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: '2px' }}>
                      {artist.full_name}
                      {artist.verified && <span className="badge badge-verified" style={{ marginLeft: '8px', fontSize: '0.6rem' }}>✓</span>}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--slate)' }}>{artist.bio?.slice(0, 50) || 'Artist on Kōmish'}</div>
                  </div>
                </div>
                <div style={{ marginBottom: '14px' }}>
                  {(artist as any).artist_tags?.slice(0, 4).map((t: any) => <span key={t.id} className="tag">{t.tag}</span>)}
                </div>
                {artist.starting_price && (
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.82rem', color: 'var(--clay)', fontWeight: 600, marginBottom: '14px' }}>
                    From ${artist.starting_price} / commission
                  </div>
                )}
              </Link>

              {profile?.role === 'buyer' && (
                pitching === artist.id ? (
                  <div style={{ borderTop: '1px solid var(--mist)', paddingTop: '14px', marginTop: '4px' }}>
                    <textarea className="form-input" placeholder="Describe your idea briefly..." value={pitchMsg}
                      onChange={e => setPitchMsg(e.target.value)} style={{ height: '80px', marginBottom: '10px', fontSize: '0.85rem' }} />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => sendPitch(artist.id)} className="btn-primary" style={{ flex: 1, padding: '9px', fontSize: '0.82rem' }} disabled={!pitchMsg.trim()}>
                        Send Pitch
                      </button>
                      <button onClick={() => setPitching(null)} className="btn-secondary" style={{ padding: '9px 14px', fontSize: '0.82rem' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => { if (pitchesLeft > 0) setPitching(artist.id); else alert('No pitches left this month!') }}
                    style={{
                      width: '100%', padding: '9px', borderRadius: '8px', cursor: 'pointer',
                      background: pitchesLeft > 0 ? 'var(--ink)' : 'var(--mist)',
                      color: pitchesLeft > 0 ? 'white' : 'var(--slate)',
                      border: 'none', fontSize: '0.82rem', fontWeight: 600,
                      fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s'
                    }}>
                    {pitchesLeft > 0 ? 'Pitch Idea' : 'Upgrade to Pitch More'}
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
