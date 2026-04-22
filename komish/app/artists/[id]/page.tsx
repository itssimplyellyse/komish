'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Profile, PortfolioImage } from '@/types'

export default function ArtistProfile() {
  const { id } = useParams()
  const router = useRouter()
  const [artist, setArtist] = useState<Profile | null>(null)
  const [portfolio, setPortfolio] = useState<PortfolioImage[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [{ data: a }, { data: { user } }, { data: imgs }, { data: t }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).single(),
        supabase.auth.getUser(),
        supabase.from('portfolio_images').select('*').eq('artist_id', id).order('created_at', { ascending: false }),
        supabase.from('artist_tags').select('*').eq('artist_id', id)
      ])
      if (a) setArtist(a)
      if (imgs) setPortfolio(imgs)
      if (t) setTags(t.map((x: any) => x.tag))
      if (user) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setCurrentUser(prof)
      }
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div className="page" style={{ textAlign: 'center', paddingTop: '140px' }}>Loading...</div>
  if (!artist) return <div className="page">Artist not found.</div>

  const isOwn = currentUser?.id === artist.id

  return (
    <div className="page">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '48px', alignItems: 'start' }}>
        <div>
          {/* Header */}
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '32px' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--mist)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', flexShrink: 0, overflow: 'hidden' }}>
              {artist.avatar_url ? <img src={artist.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : '🎨'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                <h1 style={{ fontSize: '1.8rem' }}>{artist.full_name}</h1>
                {artist.verified && <span className="badge badge-verified">✓ Verified Human</span>}
              </div>
              {artist.location && <div style={{ fontSize: '0.85rem', color: 'var(--slate)', marginBottom: '8px' }}>📍 {artist.location}</div>}
              {artist.bio && <p style={{ color: 'var(--slate)', lineHeight: 1.7, fontSize: '0.9rem' }}>{artist.bio}</p>}
              <div style={{ marginTop: '12px' }}>
                {tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
              </div>
            </div>
            {isOwn && (
              <Link href={`/artists/${id}/edit`} className="btn-outline">Edit Profile</Link>
            )}
          </div>

          {/* Portfolio */}
          <h2 style={{ fontSize: '1.3rem', marginBottom: '20px' }}>Portfolio</h2>
          {portfolio.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px', color: 'var(--slate)' }}>
              {isOwn ? (
                <>
                  <p style={{ marginBottom: '16px' }}>Add your first portfolio piece!</p>
                  <Link href={`/artists/${id}/edit`} className="btn-primary">Upload Work</Link>
                </>
              ) : 'No portfolio images yet.'}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {portfolio.map(img => (
                <div key={img.id} style={{ aspectRatio: '1', borderRadius: '12px', overflow: 'hidden', background: 'var(--mist)' }}>
                  <img src={img.image_url} alt={img.caption || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ position: 'sticky', top: '100px' }}>
          <div className="card" style={{ marginBottom: '16px' }}>
            {artist.starting_price && (
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--mist)' }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '1.6rem', fontWeight: 700, color: 'var(--clay)' }}>
                  From ${artist.starting_price}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--slate)' }}>per commission</div>
              </div>
            )}
            {!isOwn && currentUser?.role === 'buyer' && (
              <Link href="/briefs/new" className="btn-primary" style={{ display: 'block', textAlign: 'center', marginBottom: '10px' }}>
                Post a Brief
              </Link>
            )}
            {!isOwn && !currentUser && (
              <Link href="/auth/signup" className="btn-primary" style={{ display: 'block', textAlign: 'center' }}>
                Sign Up to Commission
              </Link>
            )}
            {artist.website && (
              <a href={artist.website} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ display: 'block', textAlign: 'center', marginTop: '10px' }}>
                Visit Website ↗
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
