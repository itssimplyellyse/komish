'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [briefs, setBriefs] = useState([])
  const [artists, setArtists] = useState([])

  useEffect(() => {
    supabase.from('briefs').select('*, profiles(*), brief_tags(*)').eq('status','open').order('created_at',{ascending:false}).limit(3).then(({data}) => data && setBriefs(data))
    supabase.from('profiles').select('*, artist_tags(*)').eq('role','artist').limit(6).then(({data}) => data && setArtists(data))
  }, [])

  return (
    <div>
      {/* Hero */}
      <section style={{minHeight:'100vh',display:'flex',alignItems:'center',padding:'120px 80px 80px',background:'linear-gradient(135deg, #faf7f2 0%, #fff9f0 100%)'}}>
        <div style={{maxWidth:'680px'}}>
          <div className="section-label">The Art Commission Marketplace</div>
          <h1 style={{marginBottom:'24px'}}>Your <em style={{color:'#c8602a'}}>vision,</em><br/>their craft.</h1>
          <p style={{fontSize:'1.1rem',lineHeight:1.7,color:'#4a5568',maxWidth:'480px',marginBottom:'40px'}}>
            Post what you're looking for. Tag your style, medium, and budget. Let artists come to you — or browse and pitch them directly.
          </p>
          <div style={{display:'flex',gap:'14px',flexWrap:'wrap'}}>
            <a href="/briefs/new" className="btn-primary">Post a Brief</a>
            <a href="/artists" className="btn-secondary">Browse Artists</a>
          </div>
          <div style={{marginTop:'48px',display:'flex',gap:'40px'}}>
            {[{num:'100% Human',label:'Verified Art'},{num:'8%',label:'Artist Fee Only'},{num:'Free',label:'To Post Briefs'}].map(s => (
              <div key={s.label}>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:'1.8rem',fontWeight:700}}>{s.num}</div>
                <div style={{fontSize:'0.78rem',color:'#4a5568',marginTop:'4px'}}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Briefs */}
      <section style={{padding:'80px',background:'white'}}>
        <div style={{maxWidth:'1200px',margin:'0 auto'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:'40px'}}>
            <div><div className="section-label">Open Briefs</div><h2>Artists wanted now.</h2></div>
            <a href="/briefs" className="btn-outline">See all →</a>
          </div>
          {briefs.length === 0 ? (
            <div style={{textAlign:'center',padding:'60px',color:'#4a5568'}}>
              <p style={{marginBottom:'20px'}}>No briefs yet — be the first!</p>
              <a href="/briefs/new" className="btn-primary">Post the First Brief</a>
            </div>
          ) : (
            <div className="grid-3">
              {briefs.map(b => (
                <a href={`/brief/${b.id}`} key={b.id} className="card" style={{display:'block'}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:'12px'}}>
                    <span className="badge badge-open">Open</span>
                    {b.budget_max && <span style={{fontFamily:"'DM Mono',monospace",fontSize:'0.8rem',color:'#c8602a',fontWeight:600}}>${b.budget_min}–${b.budget_max}</span>}
                  </div>
                  <h3 style={{fontSize:'1rem',marginBottom:'8px'}}>{b.title}</h3>
                  <p style={{fontSize:'0.82rem',color:'#4a5568',lineHeight:1.6,marginBottom:'12px'}}>{b.description?.slice(0,100)}...</p>
                  <div>{b.brief_tags?.slice(0,3).map(t => <span key={t.id} className="tag">{t.tag}</span>)}</div>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Artists */}
      <section style={{padding:'80px',background:'#faf7f2'}}>
        <div style={{maxWidth:'1200px',margin:'0 auto'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:'40px'}}>
            <div><div className="section-label">Artists</div><h2>Find your artist.</h2></div>
            <a href="/artists" className="btn-outline">Browse all →</a>
          </div>
          {artists.length === 0 ? (
            <div style={{textAlign:'center',padding:'60px',color:'#4a5568'}}>
              <p style={{marginBottom:'20px'}}>No artists yet — join as one!</p>
              <a href="/auth/signup?role=artist" className="btn-primary">Join as an Artist</a>
            </div>
          ) : (
            <div className="grid-3">
              {artists.map(a => (
                <a href={`/artists/${a.id}`} key={a.id} className="card" style={{display:'block',textAlign:'center'}}>
                  <div style={{width:64,height:64,borderRadius:'50%',background:'#e8e2d9',margin:'0 auto 14px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.8rem'}}>🎨</div>
                  <div style={{fontWeight:700,marginBottom:'4px'}}>{a.full_name || 'Artist'}</div>
                  <div style={{fontSize:'0.8rem',color:'#4a5568',marginBottom:'10px'}}>{a.bio?.slice(0,60) || 'Artist on Kōmish'}</div>
                  {a.verified && <span className="badge badge-verified">✓ Verified</span>}
                  {a.starting_price && <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.82rem',color:'#c8602a',marginTop:'10px',fontWeight:600}}>From ${a.starting_price}</div>}
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={{background:'#0f0a05',color:'rgba(250,247,242,0.4)',padding:'40px 80px',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'20px'}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:'1.4rem',fontWeight:900,color:'#faf7f2'}}>Kō<span style={{color:'#c8602a'}}>mish</span></div>
        <div style={{fontSize:'0.78rem'}}>© 2026 Kōmish. Human-made art, always.</div>
      </footer>
    </div>
  )
}
