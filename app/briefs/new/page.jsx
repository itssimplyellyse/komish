'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const ART_TYPES = ['Portrait','Landscape','Character Art','Pet Portrait','Abstract','Book Cover','Logo/Brand','Fan Art','Wedding','Tattoo Design','Album Art']
const MEDIUMS = ['Watercolour','Oil Paint','Digital','Pencil/Ink','Acrylic','Charcoal','Mixed Media','Gouache','Pastel']
const MOODS = ['Realistic','Impressionist','Cartoon/Anime','Minimalist','Dark/Gothic','Whimsical','Vintage','Surrealist']

export default function NewBrief() {
  const router = useRouter()
  const [form, setForm] = useState({ title:'', description:'', budget_min:'', budget_max:'', deadline:'' })
  const [tags, setTags] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({data:{user}}) => { if (!user) router.push('/auth/login') })
  }, [])

  const toggleTag = (tag) => setTags(p => p.includes(tag) ? p.filter(t => t !== tag) : [...p, tag])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (tags.length === 0) { setError('Select at least one tag.'); return }
    setLoading(true); setError('')
    const { data: { user } } = await supabase.auth.getUser()
    const { data: brief, error: err } = await supabase.from('briefs').insert({ buyer_id:user.id, title:form.title, description:form.description, budget_min:form.budget_min?parseInt(form.budget_min):null, budget_max:form.budget_max?parseInt(form.budget_max):null, deadline:form.deadline||null }).select().single()
    if (err) { setError(err.message); setLoading(false); return }
    await supabase.from('brief_tags').insert(tags.map(tag => ({ brief_id:brief.id, tag })))
    router.push(`/brief/${brief.id}`)
  }

  const TagBtn = ({ tag, color }) => (
    <button type="button" onClick={() => toggleTag(tag)} style={{padding:'7px 16px',borderRadius:'20px',cursor:'pointer',border:`1.5px solid ${tags.includes(tag)?color:'#e8e2d9'}`,background:tags.includes(tag)?`${color}18`:'white',color:tags.includes(tag)?color:'#4a5568',fontSize:'0.82rem',fontWeight:500,fontFamily:"'DM Sans',sans-serif",margin:'4px',transition:'all 0.15s'}}>
      {tag}
    </button>
  )

  return (
    <div className="page-narrow">
      <div style={{marginBottom:'36px'}}>
        <div className="section-label">New Brief</div>
        <h1 style={{fontSize:'2rem',marginBottom:'8px'}}>Tell artists what you need.</h1>
        <p style={{color:'#4a5568',fontSize:'0.9rem'}}>Free to post. The more detail, the better the match.</p>
      </div>
      <form onSubmit={handleSubmit} className="card">
        {error && <div className="alert alert-error">{error}</div>}
        <div className="form-group">
          <label className="form-label">Project Title *</label>
          <input className="form-input" type="text" required placeholder="e.g. Family portrait in watercolour" value={form.title} onChange={e => setForm(f => ({...f,title:e.target.value}))} />
        </div>
        <div className="form-group">
          <label className="form-label">Describe Your Vision *</label>
          <textarea className="form-input" required placeholder="Describe the scene, mood, colours, references..." value={form.description} onChange={e => setForm(f => ({...f,description:e.target.value}))} style={{height:'120px'}} />
        </div>
        <div className="form-group">
          <label className="form-label">Art Type *</label>
          <div>{ART_TYPES.map(t => <TagBtn key={t} tag={t} color="#c8602a" />)}</div>
        </div>
        <div className="form-group">
          <label className="form-label">Medium / Style</label>
          <div>{MEDIUMS.map(t => <TagBtn key={t} tag={t} color="#5a7a5c" />)}</div>
        </div>
        <div className="form-group">
          <label className="form-label">Mood</label>
          <div>{MOODS.map(t => <TagBtn key={t} tag={t} color="#a07820" />)}</div>
        </div>
        <div className="form-group">
          <label className="form-label">Budget Range (USD)</label>
          <div style={{display:'flex',gap:'12px',alignItems:'center'}}>
            <input className="form-input" type="number" placeholder="Min e.g. 50" min={0} value={form.budget_min} onChange={e => setForm(f => ({...f,budget_min:e.target.value}))} />
            <span style={{color:'#4a5568',flexShrink:0}}>—</span>
            <input className="form-input" type="number" placeholder="Max e.g. 300" min={0} value={form.budget_max} onChange={e => setForm(f => ({...f,budget_max:e.target.value}))} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Deadline (optional)</label>
          <input className="form-input" type="date" value={form.deadline} onChange={e => setForm(f => ({...f,deadline:e.target.value}))} />
        </div>
        <div style={{display:'flex',gap:'12px'}}>
          <button type="submit" className="btn-primary" style={{flex:1,padding:'14px'}} disabled={loading}>{loading?'Posting...':'🚀 Post Brief'}</button>
          <button type="button" className="btn-secondary" onClick={() => router.back()}>Cancel</button>
        </div>
      </form>
    </div>
  )
}
