'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Brief, Proposal, Profile } from '@/types'

export default function BriefPage() {
  const { id } = useParams()
  const router = useRouter()
  const [brief, setBrief] = useState<Brief | null>(null)
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [proposalForm, setProposalForm] = useState({ message: '', price: '', delivery_days: '', revisions: '2' })
  const [submitting, setSubmitting] = useState(false)
  const [hasProposed, setHasProposed] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const load = async () => {
      const [{ data: b }, { data: { user } }] = await Promise.all([
        supabase.from('briefs').select('*, profiles(*), brief_tags(*)').eq('id', id).single(),
        supabase.auth.getUser()
      ])
      if (b) setBrief(b)

      if (user) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setProfile(prof)

        const { data: props } = await supabase.from('proposals')
          .select('*, profiles(*)').eq('brief_id', id).order('created_at', { ascending: false })
        if (props) {
          setProposals(props)
          setHasProposed(props.some(p => p.artist_id === user.id))
        }
      }
    }
    load()
  }, [id])

  const submitProposal = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true); setError(''); setSuccess('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { error } = await supabase.from('proposals').insert({
      brief_id: id, artist_id: user.id,
      message: proposalForm.message,
      price: parseInt(proposalForm.price),
      delivery_days: parseInt(proposalForm.delivery_days),
      revisions: parseInt(proposalForm.revisions),
    })
    if (error) { setError(error.message); setSubmitting(false); return }
    setSuccess('Proposal sent! The buyer will be in touch.'); setHasProposed(true)
    setSubmitting(false)
    // Reload proposals
    const { data } = await supabase.from('proposals').select('*, profiles(*)').eq('brief_id', id).order('created_at', { ascending: false })
    if (data) setProposals(data)
  }

  const acceptProposal = async (proposal: Proposal) => {
    await supabase.from('proposals').update({ status: 'accepted' }).eq('id', proposal.id)
    await supabase.from('proposals').update({ status: 'declined' }).eq('brief_id', id).neq('id', proposal.id)
    await supabase.from('briefs').update({ status: 'in_progress' }).eq('id', id)
    // Create order
    await supabase.from('orders').insert({
      proposal_id: proposal.id, buyer_id: brief?.buyer_id,
      artist_id: proposal.artist_id, amount: proposal.price
    })
    router.push('/dashboard')
  }

  if (!brief) return <div className="page" style={{ textAlign: 'center', paddingTop: '140px' }}>Loading...</div>

  const isBuyer = profile?.id === brief.buyer_id
  const isArtist = profile?.role === 'artist'

  return (
    <div className="page">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '40px', alignItems: 'start' }}>
        {/* Main */}
        <div>
          <div style={{ marginBottom: '12px' }}>
            <Link href="/briefs" style={{ fontSize: '0.85rem', color: 'var(--clay)' }}>← Back to briefs</Link>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <span className={`badge badge-${brief.status.replace('_', '-')}`} style={{ marginBottom: '10px', display: 'inline-block' }}>{brief.status}</span>
              <h1 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>{brief.title}</h1>
              <p style={{ color: 'var(--slate)', fontSize: '0.85rem' }}>
                Posted by {(brief as any).profiles?.full_name} · {new Date(brief.created_at).toLocaleDateString()}
              </p>
            </div>
            {brief.budget_min && brief.budget_max && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '1.4rem', fontWeight: 700, color: 'var(--clay)' }}>
                  ${brief.budget_min}–${brief.budget_max}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--slate)' }}>budget range</div>
              </div>
            )}
          </div>

          <div className="card" style={{ marginBottom: '28px' }}>
            <h3 style={{ marginBottom: '14px', fontSize: '1rem' }}>Project Description</h3>
            <p style={{ lineHeight: 1.75, color: 'var(--slate)', fontSize: '0.9rem' }}>{brief.description}</p>
            {brief.deadline && (
              <div style={{ marginTop: '16px', padding: '10px 14px', background: 'var(--warm-white)', borderRadius: '8px', fontSize: '0.82rem', color: 'var(--slate)' }}>
                📅 Deadline: <strong>{new Date(brief.deadline).toLocaleDateString()}</strong>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '12px' }}>Tags</h3>
            <div>{brief.brief_tags?.map(t => <span key={t.id} className="tag">{t.tag}</span>)}</div>
          </div>

          {/* Proposals — buyer only */}
          {isBuyer && (
            <div>
              <h2 style={{ fontSize: '1.3rem', marginBottom: '20px' }}>Proposals ({proposals.length})</h2>
              {proposals.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', color: 'var(--slate)', padding: '40px' }}>
                  No proposals yet. Artists will be notified about your brief.
                </div>
              ) : proposals.map(p => (
                <div key={p.id} className="card" style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--mist)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>🎨</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div>
                          <span style={{ fontWeight: 700 }}>{(p as any).profiles?.full_name}</span>
                          {(p as any).profiles?.verified && <span className="badge badge-verified" style={{ marginLeft: '8px' }}>✓ Verified</span>}
                        </div>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.9rem', fontWeight: 700, color: 'var(--clay)' }}>${p.price}</span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--slate)', lineHeight: 1.6, marginBottom: '10px' }}>{p.message}</p>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', color: 'var(--slate)', marginBottom: '14px' }}>
                        <span>⏱ {p.delivery_days} days</span>
                        <span>🔄 {p.revisions} revisions</span>
                      </div>
                      {brief.status === 'open' && (
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button onClick={() => acceptProposal(p)} className="btn-primary" style={{ padding: '9px 20px', fontSize: '0.85rem' }}>
                            Accept & Pay ${p.price}
                          </button>
                          <Link href={`/artists/${p.artist_id}`} className="btn-secondary" style={{ padding: '9px 20px', fontSize: '0.85rem' }}>
                            View Profile
                          </Link>
                        </div>
                      )}
                      {p.status === 'accepted' && <span className="badge badge-verified">✓ Accepted</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ position: 'sticky', top: '100px' }}>
          {isArtist && brief.status === 'open' && !hasProposed && (
            <div className="card">
              <h3 style={{ marginBottom: '20px' }}>Send a Proposal</h3>
              <form onSubmit={submitProposal}>
                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}
                <div className="form-group">
                  <label className="form-label">Your Message *</label>
                  <textarea className="form-input" required placeholder="Introduce yourself, describe your approach, share relevant work..."
                    value={proposalForm.message} onChange={e => setProposalForm(f => ({ ...f, message: e.target.value }))} style={{ height: '100px' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Your Price (USD) *</label>
                  <input className="form-input" type="number" required placeholder="e.g. 150" min={1}
                    value={proposalForm.price} onChange={e => setProposalForm(f => ({ ...f, price: e.target.value }))} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Delivery (days)</label>
                    <input className="form-input" type="number" required placeholder="7" min={1}
                      value={proposalForm.delivery_days} onChange={e => setProposalForm(f => ({ ...f, delivery_days: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Revisions</label>
                    <input className="form-input" type="number" required placeholder="2" min={0}
                      value={proposalForm.revisions} onChange={e => setProposalForm(f => ({ ...f, revisions: e.target.value }))} />
                  </div>
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%', padding: '13px' }} disabled={submitting}>
                  {submitting ? 'Sending...' : 'Send Proposal'}
                </button>
              </form>
            </div>
          )}
          {hasProposed && !isBuyer && (
            <div className="card" style={{ textAlign: 'center', color: 'var(--sage)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>✓</div>
              <div style={{ fontWeight: 700 }}>Proposal Sent!</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--slate)', marginTop: '6px' }}>The buyer will review and respond.</div>
            </div>
          )}
          {!profile && (
            <div className="card" style={{ textAlign: 'center' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '1rem' }}>Interested in this brief?</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--slate)', marginBottom: '20px' }}>Sign up as an artist to send a proposal.</p>
              <Link href="/auth/signup?role=artist" className="btn-primary" style={{ display: 'block', textAlign: 'center' }}>Join as an Artist</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
