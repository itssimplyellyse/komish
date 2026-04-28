'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ArtistProfile() {
  const { id } = useParams()
  const [artist, setArtist] = useState(null)
  const [portfolio, setPortfolio] = useState([])
  const [tags, setTags] = useState([])
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    supabase.from('profiles').select('*').eq('id',id).single().then(({data}) => data && setArtist(data))
    supabase.from('portfolio_images').select('*').eq('artist_id',id).then(({data}) => data && setPortfolio(data))
    supabase.from('artist_tags').select('*').eq('artist_id',id).then(({data}) => data && setTags(data.map(t => t.tag)))
    supabase.auth.getUser().then(({data:{user}}) => { if(user) supabase.from('profiles').select('*').eq('id',user.id).single().then(({data}) => setCurrentUser(data)) })
  }, [id])

  if (!artist) return <div className="page" style={{textAlign:'center',paddingTop:'140px'}}>Loading...</div>
  const isOwn = currentUser?.id === artist.id

  return (
    <div className="page">
      <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:'48px',alignItems:'start'}}>
        <div>
          <div style={{display:'flex',gap:'20px',alignItems:'flex-start',marginBottom:'32px'}}>
            <div style={{width:80,height:80,borderRadius:'50%',background:'#e8e2d9',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'2rem',flexShrink:0}}>🎨</div>
            <div style={{flex:1}}>
              <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'6px'}}>
                <h1 style={{fontSize:'1.8rem'}}>{artist.full_name}</h1>
                {artist.verified && <span className="badge badge-verified">✓ Verified Human</span>}
              </div>
              {artist.location && <div style={{fontSize:'0.85rem',color:'#4a5568',marginBottom:'8px'}}>📍 {artist.location}</div>}
              {artist.bio && <p style={{color:'#4a5568',lineHeight:1.7,fontSize:'0.9rem'}}>{artist.bio}</p>}
              <div style={{marginTop:'12px'}}>{tags.map(t => <span key={t} className="tag">{t}</span>)}</div>
            </div>
            {isOwn && <a href={`/artists/${id}/edit`} className="btn-outline">Edit Profile</a>}
          </div>

          <h2 style={{fontSize:'1.3rem',marginBottom:'20px'}}>Portfolio</h2>
          {portfolio.length === 0 ? (
            <div className="card" style={{textAlign:'center',padding:'60px',color:'#4a5568'}}>
              {isOwn ? <><p style={{marginBottom:'16px'}}>Add your first portfolio piece!</p><a href={`/artists/${id}/edit`} className="btn-primary">Upload Work</a></> : 'No portfolio images yet.'}
            </div>
          ) : (
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px'}}>
              {portfolio.map(img => <div key={img.id} style={{aspectRatio:'1',borderRadius:'12px',overflow:'hidden',background:'#e8e2d9'}}><img src={img.image_url} alt={img.caption||''} style={{width:'100%',height:'100%',objectFit:'cover'}} /></div>)}
            </div>
          )}
        </div>

        <div style={{position:'sticky',top:'100px'}}>
          <div className="card">
            {artist.starting_price && <div style={{marginBottom:'16px',paddingBottom:'16px',borderBottom:'1px solid #e8e2d9'}}>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:'1.6rem',fontWeight:700,color:'#c8602a'}}>From ${artist.starting_price}</div>
              <div style={{fontSize:'0.78rem',color:'#4a5568'}}>per commission</div>
            </div>}
            {!isOwn && currentUser?.role === 'buyer' && <a href="/briefs/new" className="btn-primary" style={{display:'block',textAlign:'center',marginBottom:'10px'}}>Post a Brief</a>}
            {!isOwn && !currentUser && <a href="/auth/signup" className="btn-primary" style={{display:'block',textAlign:'center'}}>Sign Up to Commission</a>}
            {artist.website && <a href={artist.website} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{display:'block',textAlign:'center',marginTop:'10px'}}>Visit Website ↗</a>}
          </div>
        </div>
      </div>
    </div>
  )
}
