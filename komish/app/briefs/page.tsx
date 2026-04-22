'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Brief } from '@/types'

const FILTERS = ['All', 'Portrait', 'Landscape', 'Digital', 'Watercolour', 'Character Art', 'Pet Portrait', 'Oil Paint']

export default function Briefs() {
  const [briefs, setBriefs] = useState<Brief[]>([])
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('briefs')
        .select('*, profiles(*), brief_tags(*)')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
      if (data) setBriefs(data)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = filter === 'All' ? briefs : briefs.filter(b => b.brief_tags?.some(t => t.tag === filter))

  return (
    <div className="page">
      <div style={{ marginBottom: '40px' }}>
        <div className="section-label">Open Briefs</div>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Find your next commission.</h1>
        <p style={{ color: 'var(--slate)' }}>Buyers posting what they need. Respond with your portfolio and a quote.</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '36px' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: '8px 18px', borderRadius: '24px', cursor: 'pointer',
              border: `1.5px solid ${filter === f ? 'var(--clay)' : 'var(--mist)'}`,
              background: filter === f ? 'var(--clay)' : 'white',
              color: filter === f ? 'white' : 'var(--slate)',
              fontSize: '0.82rem', fontWeight: 500, transition: 'all 0.15s',
              fontFamily: "'DM Sans', sans-serif"
            }}>{f}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px', color: 'var(--slate)' }}>Loading briefs...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px' }}>
          <p style={{ color: 'var(--slate)', marginBottom: '20px', fontSize: '1rem' }}>
            {filter === 'All' ? 'No open briefs yet.' : `No briefs tagged "${filter}" yet.`}
          </p>
          <Link href="/briefs/new" className="btn-primary">Post the First Brief</Link>
        </div>
      ) : (
        <div className="grid-3">
          {filtered.map(brief => (
            <Link href={`/brief/${brief.id}`} key={brief.id} className="card" style={{ display: 'block' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span className="badge badge-open">Open</span>
                {brief.budget_max && (
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.8rem', color: 'var(--clay)', fontWeight: 600 }}>
                    Up to ${brief.budget_max}
                  </span>
                )}
              </div>
              <h3 style={{ fontSize: '1rem', marginBottom: '8px', lineHeight: 1.4 }}>{brief.title}</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--slate)', lineHeight: 1.6, marginBottom: '14px' }}>
                {brief.description?.slice(0, 110)}{brief.description && brief.description.length > 110 ? '...' : ''}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: '12px' }}>
                {brief.brief_tags?.slice(0, 4).map(t => <span key={t.id} className="tag">{t.tag}</span>)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--slate)', borderTop: '1px solid var(--mist)', paddingTop: '12px' }}>
                <span>By {(brief as any).profiles?.full_name || 'Buyer'}</span>
                {brief.deadline && <span>Due {new Date(brief.deadline).toLocaleDateString()}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
