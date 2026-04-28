'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Dashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [briefs, setBriefs] = useState([])
  const [proposals, setProposals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)
      if (prof?.role === 'buyer') {
        const { data: b } = await supabase.from('briefs').select('*, brief_tags(*)').eq('buyer_id', user.id).order('created_at',{ascending:false})
        if (b) setBriefs(b)
      } else {
        const { data: p } = await supabase.from('proposals').select('*, briefs(*, profiles(*))').eq('artist_id', user.id).order('created_at',{ascending:false})
        if (p) setProposals(p)
      }
      setLoading(false)
    }
    load()
  }, [])

  const signOut = async () => { await supabase.auth.signOut(); router.push('/') }

  if (loading) return <div className="page" style={{textAlign:'center',paddingTop:'140px'}}>Loading...</div>
  if (!profile) return null

  return (
    <div className="page">
      <div style={{marginBottom:'40px',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
        <div>
          <div className="section-label">{profile.role === 'buyer' ? 'Buyer' : 'Artist'} Dashboard</div>
          <h1 style={{fontSize:'2rem',marginBottom:'8px'}}>Welcome back, {profile.full_name?.split(' ')[0]} 👋</h1>
        </div>
        <button onClick={signOut} className="btn-secondary" style={{padding:'10px 18px',fontSize:'0.85rem'}}>Sign Out</button>
      </div>

      <div style={{display:'flex',gap:'12px',marginBottom:'48px',flexWrap:'wrap'}}>
        {profile.role === 'buyer' ? (
          <>
            <a href="/briefs/new" className="btn-primary">+ Post a Brief</a>
            <a href="/artists" className="btn-secondary">Browse Artists</a>
          </>
        ) : (
          <>
            <a href="/briefs" className="btn-primary">Browse Open Briefs</a>
            <a href={`/artists/${profile.id}/edit`} className="btn-secondary">Edit My Profile</a>
          </>
        )}
      </div>

      {profile.role === 'buyer' ? (
        <div>
          <h2 style={{fontSize:'1.3rem',marginBottom:'20px'}}>Your Briefs ({briefs.length})</h2>
          {briefs.length === 0 ? (
            <div className="card" style={{textAlign:'center',padding:'40px',color:'#4a5568'}}>
              <p style={{marginBottom:'16px'}}>No briefs yet.</p>
              <a href="/briefs/new" className="btn-primary">Post Your First Brief</a>
            </div>
          ) : briefs.map(b => (
            <a href={`/brief/${b.id}`} key={b.id} className="card" style={{display:'block',marginBottom:'14px'}}>
              <div style={{display:'flex',justifyContent:'space-between'}}>
                <div style={{fontWeight:700}}>{b.title}</div>
                <span className={`badge badge-${b.status === 'open' ? 'open' : 'closed'}`}>{b.status}</span>
              </div>
              <div style={{marginTop:'8px'}}>{b.brief_tags?.slice(0,3).map(t => <span key={t.id} className="tag" style={{fontSize:'0.7rem'}}>{t.tag}</span>)}</div>
            </a>
          ))}
        </div>
      ) : (
        <div>
          <h2 style={{fontSize:'1.3rem',marginBottom:'20px'}}>Your Proposals ({proposals.length})</h2>
          {proposals.length === 0 ? (
            <div className="card" style={{textAlign:'center',padding:'40px',color:'#4a5568'}}>
              <p style={{marginBottom:'16px'}}>No proposals yet.</p>
              <a href="/briefs" className="btn-primary">Browse Open Briefs</a>
            </div>
          ) : proposals.map(p => (
            <div key={p.id} className="card" style={{marginBottom:'14px'}}>
              <div style={{display:'flex',justifyContent:'space-between'}}>
                <div style={{fontWeight:700}}>{p.briefs?.title}</div>
                <span className={`badge ${p.status==='accepted'?'badge-verified':'badge-open'}`}>{p.status}</span>
              </div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.8rem',color:'#c8602a',marginTop:'6px',fontWeight:600}}>${p.price} · {p.delivery_days} days</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
