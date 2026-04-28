'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const FILTERS = ['All','Watercolour','Digital','Oil Paint','Portrait','Charcoal','Verified']

export default function Artists() {
  const [artists, setArtists] = useState([])
  const [filter, setFilter] = useState('All')
  const [profile, setProfile] = useState(null)
  const [pitching, setPitching] = useState(null)
  const [pitchMsg, setPitchMsg] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('profiles').select('*, artist_tags(*)').eq('role','artist').then(({data}) => { if(data) setArtists(data); setLoading(false) })
    supabase.auth.getUser().then(({data:{user}}) => { if(user) supabase.from('profiles').select('*').eq('id',user.id).single().then(({data}) => setProfile(data)) })
  }, [])

  const sendPitch = async (artistId) => {
    if (!profile) { window.location.href='/auth/login'; return }
    if (profile.pitch_count >= profile.pitch_limit) { alert('No pitches left this month! Upgrade to send more.'); return }
    await supabase.from('pitches').insert({ buyer_id:profile.id, artist_id:artistId, message:pitchMsg })
    await supabase.from('profiles').update({ pitch_count: profile.pitch_count+1 }).eq('id',profile.id)
    setProfile(p => ({...p, pitch_count: p.pitch_count+1}))
    setPitching(null); setPitchMsg('')
    alert('Pitch sent! The artist will respond within 48 hours.')
  }

  const filtered = filter==='All' ? artists : filter==='Verified' ? artists.filter(a => a.verified) : artists.filter(a => a.artist_tags?.some(t => t.tag===filter))
  const pitchesLeft = profile ? profile.pitch_limit - profile.pitch_count : 5

  return (
    <div className="page">
      <div style={{marginBottom:'40px'}}>
        <div className="section-label">Browse & Pitch</div>
        <h1 style={{fontSize:'2rem',marginBottom:'8px'}}>Find your artist.</h1>
        <p style={{color:'#4a5568'}}>Love their work? Pitch your idea directly — free for your first 5 pitches.</p>
      </div>

      {profile?.role === 'buyer' && (
        <div style={{background:'#fff9f0',border:'1.5px solid #e8e2d9',borderRadius:'12px',padding:'16px 24px',display:'flex',alignItems:'center',gap:'20px',marginBottom:'32px',flexWrap:'wrap'}}>
          <div style={{display:'flex',gap:'6px'}}>
            {Array.from({length:profile.pitch_limit}).map((_,i) => <div key={i} style={{width:12,height:12,borderRadius:'50%',background:i<profile.pitch_count?'#c8602a':'#e8e2d9'}} />)}
          </div>
          <span style={{fontSize:'0.85rem',color:'#4a5568'}}><strong>{profile.pitch_count} of {profile.pitch_limit}</strong> free pitches used this month</span>
        </div>
      )}

      <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'36px'}}>
        {FILTERS.map(f => <button key={f} onClick={() => setFilter(f)} style={{padding:'8px 18px',borderRadius:'24px',cursor:'pointer',border:`1.5px solid ${filter===f?'#c8602a':'#e8e2d9'}`,background:filter===f?'#c8602a':'white',color:filter===f?'white':'#4a5568',fontSize:'0.82rem',fontWeight:500,fontFamily:"'DM Sans',sans-serif"}}>{f}</button>)}
      </div>

      {loading ? <div style={{textAlign:'center',padding:'80px',color:'#4a5568'}}>Loading...</div>
        : filtered.length === 0 ? <div style={{textAlign:'center',padding:'80px'}}><p style={{color:'#4a5568',marginBottom:'20px'}}>No artists found.</p><a href="/auth/signup?role=artist" className="btn-primary">Join as an Artist</a></div>
        : (
          <div className="grid-3">
            {filtered.map(artist => (
              <div key={artist.id} className="card">
                <a href={`/artists/${artist.id}`} style={{display:'block'}}>
                  <div style={{display:'flex',gap:'14px',alignItems:'center',marginBottom:'14px'}}>
                    <div style={{width:52,height:52,borderRadius:'50%',background:'#e8e2d9',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.4rem',flexShrink:0}}>🎨</div>
                    <div>
                      <div style={{fontWeight:700,marginBottom:'2px'}}>{artist.full_name} {artist.verified && <span style={{fontSize:'0.7rem',background:'#5a7a5c',color:'white',padding:'2px 6px',borderRadius:'10px',marginLeft:'4px'}}>✓</span>}</div>
                      <div style={{fontSize:'0.78rem',color:'#4a5568'}}>{artist.bio?.slice(0,50)||'Artist on Kōmish'}</div>
                    </div>
                  </div>
                  <div style={{marginBottom:'12px'}}>{artist.artist_tags?.slice(0,4).map(t => <span key={t.id} className="tag">{t.tag}</span>)}</div>
                  {artist.starting_price && <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.82rem',color:'#c8602a',fontWeight:600,marginBottom:'14px'}}>From ${artist.starting_price}</div>}
                </a>
                {profile?.role === 'buyer' && (
                  pitching === artist.id ? (
                    <div style={{borderTop:'1px solid #e8e2d9',paddingTop:'14px'}}>
                      <textarea className="form-input" placeholder="Describe your idea..." value={pitchMsg} onChange={e => setPitchMsg(e.target.value)} style={{height:'80px',marginBottom:'10px',fontSize:'0.85rem'}} />
                      <div style={{display:'flex',gap:'8px'}}>
                        <button onClick={() => sendPitch(artist.id)} className="btn-primary" style={{flex:1,padding:'9px',fontSize:'0.82rem'}} disabled={!pitchMsg.trim()}>Send Pitch</button>
                        <button onClick={() => setPitching(null)} className="btn-secondary" style={{padding:'9px 14px',fontSize:'0.82rem'}}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => pitchesLeft>0?setPitching(artist.id):alert('No pitches left!')} style={{width:'100%',padding:'9px',borderRadius:'8px',cursor:'pointer',background:pitchesLeft>0?'#1a1208':'#e8e2d9',color:pitchesLeft>0?'white':'#4a5568',border:'none',fontSize:'0.82rem',fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>
                      {pitchesLeft>0?'Pitch Idea':'Upgrade to Pitch More'}
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
