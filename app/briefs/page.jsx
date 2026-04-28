'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const FILTERS = ['All','Portrait','Landscape','Digital','Watercolour','Character Art','Pet Portrait','Oil Paint']

export default function Briefs() {
  const [briefs, setBriefs] = useState([])
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('briefs').select('*, profiles(*), brief_tags(*)').eq('status','open').order('created_at',{ascending:false}).then(({data}) => { if(data) setBriefs(data); setLoading(false) })
  }, [])

  const filtered = filter === 'All' ? briefs : briefs.filter(b => b.brief_tags?.some(t => t.tag === filter))

  return (
    <div className="page">
      <div style={{marginBottom:'40px'}}>
        <div className="section-label">Open Briefs</div>
        <h1 style={{fontSize:'2rem',marginBottom:'8px'}}>Find your next commission.</h1>
        <p style={{color:'#4a5568'}}>Buyers posting what they need. Respond with your work and a quote.</p>
      </div>
      <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'36px'}}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{padding:'8px 18px',borderRadius:'24px',cursor:'pointer',border:`1.5px solid ${filter===f?'#c8602a':'#e8e2d9'}`,background:filter===f?'#c8602a':'white',color:filter===f?'white':'#4a5568',fontSize:'0.82rem',fontWeight:500,fontFamily:"'DM Sans',sans-serif"}}>
            {f}
          </button>
        ))}
      </div>
      {loading ? <div style={{textAlign:'center',padding:'80px',color:'#4a5568'}}>Loading...</div>
        : filtered.length === 0 ? (
          <div style={{textAlign:'center',padding:'80px'}}>
            <p style={{color:'#4a5568',marginBottom:'20px'}}>No open briefs yet.</p>
            <a href="/briefs/new" className="btn-primary">Post the First Brief</a>
          </div>
        ) : (
          <div className="grid-3">
            {filtered.map(b => (
              <a href={`/brief/${b.id}`} key={b.id} className="card" style={{display:'block'}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:'12px'}}>
                  <span className="badge badge-open">Open</span>
                  {b.budget_max && <span style={{fontFamily:"'DM Mono',monospace",fontSize:'0.8rem',color:'#c8602a',fontWeight:600}}>Up to ${b.budget_max}</span>}
                </div>
                <h3 style={{fontSize:'1rem',marginBottom:'8px'}}>{b.title}</h3>
                <p style={{fontSize:'0.82rem',color:'#4a5568',lineHeight:1.6,marginBottom:'12px'}}>{b.description?.slice(0,110)}</p>
                <div>{b.brief_tags?.slice(0,4).map(t => <span key={t.id} className="tag">{t.tag}</span>)}</div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.75rem',color:'#4a5568',borderTop:'1px solid #e8e2d9',paddingTop:'12px',marginTop:'12px'}}>
                  <span>By {b.profiles?.full_name||'Buyer'}</span>
                  {b.deadline && <span>Due {new Date(b.deadline).toLocaleDateString()}</span>}
                </div>
              </a>
            ))}
          </div>
        )}
    </div>
  )
}
