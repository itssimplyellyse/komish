'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Brief, Profile } from '@/types'

export default function Home() {
  const [recentBriefs, setRecentBriefs] = useState<Brief[]>([])
  const [topArtists, setTopArtists] = useState<Profile[]>([])
  const [stats, setStats] = useState({ briefs: 0, artists: 0 })

  useEffect(() => {
    const load = async () => {
      const [briefsRes, artistsRes] = await Promise.all([
        supabase.from('briefs').select('*, profiles(*), brief_tags(*)').eq('status', 'open').order('created_at', { ascending: false }).limit(3),
        supabase.from('profiles').select('*').eq('role', 'artist').limit(6),
      ])
      if (briefsRes.data) setRecentBriefs(briefsRes.data)
      if (artistsRes.data) setTopArtists(artistsRes.data)
      setStats({ briefs: briefsRes.data?.length || 0, artists: artistsRes.data?.length || 0 })
    }
    load()
  }, [])

  return (
    <div>
      {/* Hero */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '120px 80px 80px', background: 'linear-gradient(135deg, var(--canvas) 0%, var(--warm-white) 100%)' }}>
        <div style={{ maxWidth: '680px' }}>
          <div className="section-label">The Art Commission Marketplace</div>
          <h1 style={{ marginBottom: '24px', letterSpacing: '-0.02em' }}>
            Your <em style={{ color: 'var(--clay)', fontStyle: 'italic' }}>vision,</em><br />their craft.
          </h1>
          <p style={{ fontSize: '1.1rem', lineHeight: 1.7, color: 'var(--slate)', maxWidth: '480px', marginBottom: '40px' }}>
            Post what you're looking for. Tag your style, medium, and budget. Let artists come to you — or browse and pitch them directly. Real art, real artists.
          </p>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <Link href="/briefs/new" className="btn-primary">Post a Brief</Link>
            <Link href="/artists" className="btn-secondary">Browse Artists</Link>
          </div>
          <div style={{ marginTop: '52px', display: 'flex', gap: '40px' }}>
            {[
              { num: '100% Human', label: 'Verified Art' },
              { num: '8%', label: 'Artist Fee Only' },
              { num: 'Free', label: 'To Post Briefs' },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', fontWeight: 700 }}>{s.num}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--slate)', marginTop: '4px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Briefs */}
      <section style={{ padding: '80px', background: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
            <div>
              <div className="section-label">Open Briefs</div>
              <h2>Artists wanted now.</h2>
            </div>
            <Link href="/briefs" className="btn-outline">See all briefs →</Link>
          </div>
          {recentBriefs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--slate)' }}>
              <p style={{ fontSize: '1.1rem', marginBottom: '20px' }}>No briefs yet — be the first!</p>
              <Link href="/briefs/new" className="btn-primary">Post the First Brief</Link>
            </div>
          ) : (
            <div className="grid-3">
              {recentBriefs.map(brief => (
                <Link href={`/brief/${brief.id}`} key={brief.id} className="card" style={{ display: 'block' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span className={`badge badge-${brief.status}`}>{brief.status}</span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.8rem', color: 'var(--clay)', fontWeight: 600 }}>
                      {brief.budget_min && brief.budget_max ? `$${brief.budget_min}–$${brief.budget_max}` : 'Budget TBD'}
                    </span>
                  </div>
                  <h3 style={{ marginBottom: '10px', fontSize: '1rem' }}>{brief.title}</h3>
                  <p style={{ fontSize: '0.83rem', color: 'var(--slate)', lineHeight: 1.6, marginBottom: '14px' }}>
                    {brief.description?.slice(0, 100)}...
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                    {brief.brief_tags?.slice(0, 3).map(t => <span key={t.id} className="tag">{t.tag}</span>)}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Artists */}
      <section style={{ padding: '80px', background: 'var(--canvas)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
            <div>
              <div className="section-label">Artists</div>
              <h2>Find your artist.</h2>
            </div>
            <Link href="/artists" className="btn-outline">Browse all →</Link>
          </div>
          {topArtists.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--slate)' }}>
              <p style={{ fontSize: '1.1rem', marginBottom: '20px' }}>No artists yet — join as one!</p>
              <Link href="/auth/signup" className="btn-primary">Join as an Artist</Link>
            </div>
          ) : (
            <div className="grid-3">
              {topArtists.map(artist => (
                <Link href={`/artists/${artist.id}`} key={artist.id} className="card" style={{ display: 'block', textAlign: 'center' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--mist)', margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>
                    {artist.avatar_url ? <img src={artist.avatar_url} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" /> : '🎨'}
                  </div>
                  <div style={{ fontWeight: 700, marginBottom: '4px' }}>{artist.full_name || 'Artist'}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--slate)', marginBottom: '10px' }}>{artist.bio?.slice(0, 60) || 'Artist on Kōmish'}</div>
                  {artist.verified && <span className="badge badge-verified">✓ Verified</span>}
                  {artist.starting_price && (
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.82rem', color: 'var(--clay)', marginTop: '10px', fontWeight: 600 }}>
                      From ${artist.starting_price}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '80px', background: 'var(--ink)', color: 'white' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          <div className="section-label" style={{ color: 'rgba(250,247,242,0.5)' }}>How It Works</div>
          <h2 style={{ color: 'white', marginBottom: '56px' }}>Two ways to get great art.</h2>
          <div className="grid-2">
            {[
              { emoji: '📋', title: 'Post a Brief', desc: 'Describe your project, tag your style and budget. Artists who match get notified and send proposals directly to you.' },
              { emoji: '🎯', title: 'Pitch an Artist', desc: 'Browse artists and send your idea directly to someone whose work you love. Free for your first 5 pitches per month.' },
            ].map(item => (
              <div key={item.title} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '36px' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>{item.emoji}</div>
                <h3 style={{ color: 'white', marginBottom: '12px' }}>{item.title}</h3>
                <p style={{ color: 'rgba(250,247,242,0.6)', lineHeight: 1.7, fontSize: '0.9rem' }}>{item.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '48px', display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <Link href="/auth/signup" className="btn-primary">Get Started Free</Link>
            <Link href="/auth/signup?role=artist" className="btn-secondary">Join as an Artist</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--deep)', color: 'rgba(250,247,242,0.4)', padding: '40px 80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: 900, color: 'var(--canvas)' }}>
          Kō<span style={{ color: 'var(--clay)' }}>mish</span>
        </div>
        <div style={{ fontSize: '0.78rem' }}>© 2026 Kōmish. Human-made art, always.</div>
        <div style={{ display: 'flex', gap: '24px', fontSize: '0.82rem' }}>
          <Link href="/briefs" style={{ color: 'rgba(250,247,242,0.4)' }}>Browse Briefs</Link>
          <Link href="/artists" style={{ color: 'rgba(250,247,242,0.4)' }}>Browse Artists</Link>
        </div>
      </footer>
    </div>
  )
}
