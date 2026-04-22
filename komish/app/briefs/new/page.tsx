'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const ART_TYPES = ['Portrait','Landscape','Character Art','Pet Portrait','Abstract','Book Cover','Logo/Brand','Fan Art','Wedding','Tattoo Design','Album Art','Concept Art']
const MEDIUMS = ['Watercolour','Oil Paint','Digital','Pencil/Ink','Acrylic','Charcoal','Mixed Media','Gouache','Pastel','3D Art']
const MOODS = ['Realistic','Impressionist','Cartoon/Anime','Minimalist','Dark/Gothic','Whimsical','Vintage','Surrealist','Pop Art']

export default function NewBrief() {
  const router = useRouter()
  const [form, setForm] = useState({ title: '', description: '', budget_min: '', budget_max: '', deadline: '' })
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/auth/login')
    })
  }, [])

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedTags.length === 0) { setError('Please select at least one tag.'); return }
    setLoading(true); setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { data: brief, error: briefErr } = await supabase.from('briefs').insert({
      buyer_id: user.id,
      title: form.title,
      description: form.description,
      budget_min: form.budget_min ? parseInt(form.budget_min) : null,
      budget_max: form.budget_max ? parseInt(form.budget_max) : null,
      deadline: form.deadline || null,
    }).select().single()

    if (briefErr) { setError(briefErr.message); setLoading(false); return }

    await supabase.from('brief_tags').insert(selectedTags.map(tag => ({ brief_id: brief.id, tag })))
    router.push(`/brief/${brief.id}`)
  }

  const TagGroup = ({ label, tags, color }: { label: string; tags: string[]; color: string }) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {tags.map(tag => (
          <button key={tag} type="button" onClick={() => toggleTag(tag)}
            style={{
              padding: '7px 16px', borderRadius: '20px', cursor: 'pointer',
              border: `1.5px solid ${selectedTags.includes(tag) ? color : 'var(--mist)'}`,
              background: selectedTags.includes(tag) ? `${color}18` : 'white',
              color: selectedTags.includes(tag) ? color : 'var(--slate)',
              fontSize: '0.82rem', fontWeight: 500, transition: 'all 0.15s',
              fontFamily: "'DM Sans', sans-serif"
            }}>
            {tag}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="page-narrow">
      <div style={{ marginBottom: '36px' }}>
        <div className="section-label">New Brief</div>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Tell artists what you need.</h1>
        <p style={{ color: 'var(--slate)', fontSize: '0.9rem' }}>The more detail you add, the better the match. It's free to post.</p>
      </div>

      <form onSubmit={handleSubmit} className="card">
        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-group">
          <label className="form-label">Project Title *</label>
          <input className="form-input" type="text" required placeholder="e.g. Family portrait in watercolour style"
            value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        </div>

        <div className="form-group">
          <label className="form-label">Describe Your Vision *</label>
          <textarea className="form-input" required placeholder="Describe the scene, mood, references, colours, size — anything that helps the artist understand what you're imagining..."
            value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ height: '120px' }} />
        </div>

        <TagGroup label="Art Type *" tags={ART_TYPES} color="var(--clay)" />
        <TagGroup label="Medium / Style" tags={MEDIUMS} color="var(--sage)" />
        <TagGroup label="Mood" tags={MOODS} color="#a07820" />

        <div className="form-group">
          <label className="form-label">Budget Range (USD)</label>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input className="form-input" type="number" placeholder="Min e.g. 50" min={0}
              value={form.budget_min} onChange={e => setForm(f => ({ ...f, budget_min: e.target.value }))} />
            <span style={{ color: 'var(--slate)', flexShrink: 0 }}>—</span>
            <input className="form-input" type="number" placeholder="Max e.g. 300" min={0}
              value={form.budget_max} onChange={e => setForm(f => ({ ...f, budget_max: e.target.value }))} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Deadline (optional)</label>
          <input className="form-input" type="date"
            value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="submit" className="btn-primary" style={{ flex: 1, padding: '14px' }} disabled={loading}>
            {loading ? 'Posting...' : '🚀 Post Brief — Notify Artists'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => router.back()}>Cancel</button>
        </div>
      </form>
    </div>
  )
}
