'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const ALL_TAGS = ['Watercolour','Oil Paint','Digital','Pencil/Ink','Acrylic','Charcoal','Mixed Media','Portrait','Landscape','Character Art','Pet Portrait','Abstract','Book Cover','Anime','Realistic','Dark/Gothic']

export default function EditProfile() {
  const router = useRouter()
  const { id } = useParams()
  const [form, setForm] = useState({ full_name:'', bio:'', location:'', website:'', starting_price:'' })
  const [tags, setTags] = useState([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState({type:'',text:''})
  const [userId, setUserId] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.id !== id) { router.push('/auth/login'); return }
      setUserId(user.id)
      const [{ data: prof }, { data: t }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id',user.id).single(),
        supabase.from('artist_tags').select('*').eq('artist_id',user.id)
      ])
      if (prof) setForm({ full_name:prof.full_name||'', bio:prof.bio||'', location:prof.location||'', website:prof.website||'', starting_price:prof.starting_price?.toString()||'' })
      if (t) setTags(t.map(x => x.tag))
    }
    load()
  }, [id])

  const toggleTag = (tag) => setTags(p => p.includes(tag) ? p.filter(t => t!==tag) : [...p,tag])

  const uploadPortfolio = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${userId}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('portfolio').upload(path, file)
    if (!upErr) {
      const { data: { publicUrl } } = supabase.storage.from('portfolio').getPublicUrl(path)
      await supabase.from('portfolio_images').insert({ artist_id:userId, image_url:publicUrl })
      setMsg({type:'success',text:'Image uploaded!'})
    } else { setMsg({type:'error',text:upErr.message}) }
    setUploading(false)
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true); setMsg({type:'',text:''})
    await supabase.from('profiles').update({ full_name:form.full_name, bio:form.bio, location:form.location, website:form.website, starting_price:form.starting_price?parseInt(form.starting_price):null }).eq('id',userId)
    await supabase.from('artist_tags').delete().eq('artist_id',userId)
    if (tags.length) await supabase.from('artist_tags').insert(tags.map(tag => ({ artist_id:userId, tag })))
    setMsg({type:'success',text:'Profile saved!'})
    setSaving(false)
    setTimeout(() => router.push(`/artists/${userId}`), 1200)
  }

  return (
    <div className="page-narrow">
      <div style={{marginBottom:'36px'}}>
        <div className="section-label">Your Profile</div>
        <h1 style={{fontSize:'2rem'}}>Edit Your Artist Profile</h1>
      </div>
      <form onSubmit={save} className="card">
        {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}
        <div className="form-group"><label className="form-label">Full Name *</label><input className="form-input" required value={form.full_name} onChange={e => setForm(f => ({...f,full_name:e.target.value}))} /></div>
        <div className="form-group"><label className="form-label">Bio</label><textarea className="form-input" placeholder="Tell buyers about your style and experience..." value={form.bio} onChange={e => setForm(f => ({...f,bio:e.target.value}))} /></div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
          <div className="form-group"><label className="form-label">Location</label><input className="form-input" placeholder="e.g. London, UK" value={form.location} onChange={e => setForm(f => ({...f,location:e.target.value}))} /></div>
          <div className="form-group"><label className="form-label">Starting Price (USD)</label><input className="form-input" type="number" placeholder="e.g. 50" min={0} value={form.starting_price} onChange={e => setForm(f => ({...f,starting_price:e.target.value}))} /></div>
        </div>
        <div className="form-group"><label className="form-label">Website</label><input className="form-input" type="url" placeholder="https://yourportfolio.com" value={form.website} onChange={e => setForm(f => ({...f,website:e.target.value}))} /></div>
        <div className="form-group">
          <label className="form-label">Your Styles & Specialisms</label>
          <div>{ALL_TAGS.map(tag => <button key={tag} type="button" onClick={() => toggleTag(tag)} style={{padding:'6px 14px',borderRadius:'20px',cursor:'pointer',border:`1.5px solid ${tags.includes(tag)?'#c8602a':'#e8e2d9'}`,background:tags.includes(tag)?'rgba(200,96,42,0.08)':'white',color:tags.includes(tag)?'#c8602a':'#4a5568',fontSize:'0.8rem',fontWeight:500,fontFamily:"'DM Sans',sans-serif",margin:'4px'}}>{tag}</button>)}</div>
        </div>
        <div className="form-group">
          <label className="form-label">Upload Portfolio Image</label>
          <input type="file" accept="image/*" onChange={uploadPortfolio} disabled={uploading} style={{fontSize:'0.85rem',color:'#4a5568'}} />
          {uploading && <p style={{fontSize:'0.82rem',color:'#4a5568',marginTop:'6px'}}>Uploading...</p>}
        </div>
        <div style={{display:'flex',gap:'12px'}}>
          <button type="submit" className="btn-primary" style={{flex:1,padding:'13px'}} disabled={saving}>{saving?'Saving...':'Save Profile'}</button>
          <button type="button" className="btn-secondary" onClick={() => router.back()}>Cancel</button>
        </div>
      </form>
    </div>
  )
}
