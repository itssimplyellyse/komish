'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function BriefPage() {
  const { id } = useParams()
  const router = useRouter()
  const [brief, setBrief] = useState(null)
  const [proposals, setProposals] = useState([])
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({ message:'', price:'', delivery_days:'', revisions:'2' })
  const [submitting, setSubmitting] = useState(false)
  const [hasProposed, setHasProposed] = useState(false)
  const [msg, setMsg] = useState({type:'',text:''})

  useEffect(() => {
    const load = async () => {
      const { data: b } = await supabase.from('briefs').select('*, profiles(*), brief_tags(*)').eq('id',id).single()
      if (b) setBrief(b)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id',user.id).single()
        setProfile(prof)
        const { data: props } = await supabase.from('proposals').select('*, profiles(*)').eq('brief_id',id).order('created_at',{ascending:false})
        if (props) { setProposals(props); setHasProposed(props.some(p => p.artist_id === user.id)) }
      }
    }
    load()
  }, [id])

  const submitProposal = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('proposals').insert({ brief_id:id, artist_id:user.id, message:form.message, price:parseInt(form.price), delivery_days:parseInt(form.delivery_days), revisions:parseInt(form.revisions) })
    if (error) { setMsg({type:'error',text:error.message}) } else { setMsg({type:'success',text:'Proposal sent!'}); setHasProposed(true) }
    setSubmitting(false)
  }

  const acceptProposal = async (p) => {
    await supabase.from('proposals').update({status:'accepted'}).eq('id',p.id)
    await supabase.from('proposals').update({status:'declined'}).eq('brief_id',id).neq('id',p.id)
    await supabase.from('briefs').update({status:'in_progress'}).eq('id',id)
    await supabase.from('orders').insert({ proposal_id:p.id, buyer_id:brief.buyer_id, artist_id:p.artist_id, amount:p.price })
    router.push('/dashboard')
  }

  if (!brief) return <div className="page" style={{textAlign:'center',paddingTop:'140px'}}>Loading...</div>

  const isBuyer = profile?.id === brief.buyer_id
  const isArtist = profile?.role === 'artist'

  return (
    <div className="page">
      <div style={{display:'grid',gridTemplateColumns:'1fr 380px',gap:'40px',alignItems:'start'}}>
        <div>
          <div style={{marginBottom:'12px'}}><a href="/briefs" style={{fontSize:'0.85rem',color:'#c8602a'}}>← Back to briefs</a></div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'20px'}}>
            <div>
              <h1 style={{fontSize:'1.8rem',marginBottom:'8px'}}>{brief.title}</h1>
              <p style={{color:'#4a5568',fontSize:'0.85rem'}}>Posted by {brief.profiles?.full_name} · {new Date(brief.created_at).toLocaleDateString()}</p>
            </div>
            {brief.budget_max && <div style={{fontFamily:"'DM Mono',monospace",fontSize:'1.4rem',fontWeight:700,color:'#c8602a'}}>${brief.budget_min}–${brief.budget_max}</div>}
          </div>
          <div className="card" style={{marginBottom:'24px'}}>
            <p style={{lineHeight:1.75,color:'#4a5568'}}>{brief.description}</p>
            {brief.deadline && <div style={{marginTop:'14px',fontSize:'0.82rem',color:'#4a5568'}}>📅 Deadline: <strong>{new Date(brief.deadline).toLocaleDateString()}</strong></div>}
          </div>
          <div style={{marginBottom:'24px'}}>{brief.brief_tags?.map(t => <span key={t.id} className="tag">{t.tag}</span>)}</div>

          {isBuyer && (
            <div>
              <h2 style={{fontSize:'1.3rem',marginBottom:'20px'}}>Proposals ({proposals.length})</h2>
              {proposals.length === 0 ? <div className="card" style={{textAlign:'center',padding:'40px',color:'#4a5568'}}>No proposals yet. Artists will be notified.</div>
                : proposals.map(p => (
                  <div key={p.id} className="card" style={{marginBottom:'16px'}}>
                    <div style={{display:'flex',gap:'14px'}}>
                      <div style={{width:44,height:44,borderRadius:'50%',background:'#e8e2d9',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.2rem',flexShrink:0}}>🎨</div>
                      <div style={{flex:1}}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}>
                          <span style={{fontWeight:700}}>{p.profiles?.full_name}</span>
                          <span style={{fontFamily:"'DM Mono',monospace",fontWeight:700,color:'#c8602a'}}>${p.price}</span>
                        </div>
                        <p style={{fontSize:'0.85rem',color:'#4a5568',marginBottom:'10px'}}>{p.message}</p>
                        <div style={{fontSize:'0.78rem',color:'#4a5568',marginBottom:'12px'}}>⏱ {p.delivery_days} days · 🔄 {p.revisions} revisions</div>
                        {brief.status === 'open' && <button onClick={() => acceptProposal(p)} className="btn-primary" style={{padding:'9px 20px',fontSize:'0.85rem'}}>Accept & Pay ${p.price}</button>}
                        {p.status === 'accepted' && <span className="badge badge-verified">✓ Accepted</span>}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div style={{position:'sticky',top:'100px'}}>
          {isArtist && brief.status === 'open' && !hasProposed && (
            <div className="card">
              <h3 style={{marginBottom:'20px'}}>Send a Proposal</h3>
              <form onSubmit={submitProposal}>
                {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}
                <div className="form-group">
                  <label className="form-label">Your Message *</label>
                  <textarea className="form-input" required placeholder="Introduce yourself, describe your approach..." value={form.message} onChange={e => setForm(f => ({...f,message:e.target.value}))} style={{height:'100px'}} />
                </div>
                <div className="form-group">
                  <label className="form-label">Your Price (USD) *</label>
                  <input className="form-input" type="number" required placeholder="e.g. 150" min={1} value={form.price} onChange={e => setForm(f => ({...f,price:e.target.value}))} />
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                  <div className="form-group"><label className="form-label">Delivery (days)</label><input className="form-input" type="number" required placeholder="7" min={1} value={form.delivery_days} onChange={e => setForm(f => ({...f,delivery_days:e.target.value}))} /></div>
                  <div className="form-group"><label className="form-label">Revisions</label><input className="form-input" type="number" required placeholder="2" min={0} value={form.revisions} onChange={e => setForm(f => ({...f,revisions:e.target.value}))} /></div>
                </div>
                <button type="submit" className="btn-primary" style={{width:'100%',padding:'13px'}} disabled={submitting}>{submitting?'Sending...':'Send Proposal'}</button>
              </form>
            </div>
          )}
          {hasProposed && !isBuyer && <div className="card" style={{textAlign:'center'}}><div style={{fontSize:'2rem',marginBottom:'10px',color:'#5a7a5c'}}>✓</div><div style={{fontWeight:700}}>Proposal Sent!</div></div>}
          {!profile && <div className="card" style={{textAlign:'center'}}><h3 style={{marginBottom:'12px',fontSize:'1rem'}}>Interested?</h3><a href="/auth/signup?role=artist" className="btn-primary" style={{display:'block'}}>Join as an Artist</a></div>}
        </div>
      </div>
    </div>
  )
}
