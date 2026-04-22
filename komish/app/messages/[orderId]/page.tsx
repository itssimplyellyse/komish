'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Message, Order, Profile } from '@/types'

export default function Messages() {
  const { orderId } = useParams()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [order, setOrder] = useState<Order | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [newMsg, setNewMsg] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const [{ data: prof }, { data: ord }, { data: msgs }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('orders').select('*, buyer:profiles!orders_buyer_id_fkey(*), artist:profiles!orders_artist_id_fkey(*)').eq('id', orderId).single(),
        supabase.from('messages').select('*, sender:profiles(*)').eq('order_id', orderId).order('created_at', { ascending: true })
      ])
      setProfile(prof); setOrder(ord)
      if (msgs) setMessages(msgs)
    }
    load()

    // Real-time messages
    const channel = supabase.channel(`order-${orderId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `order_id=eq.${orderId}` }, async (payload) => {
        const { data } = await supabase.from('messages').select('*, sender:profiles(*)').eq('id', payload.new.id).single()
        if (data) setMessages(m => [...m, data])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [orderId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMsg.trim() || !profile) return
    setSending(true)
    await supabase.from('messages').insert({ order_id: orderId, sender_id: profile.id, content: newMsg.trim() })
    setNewMsg(''); setSending(false)
  }

  const releasePayment = async () => {
    if (!confirm('Release payment to artist? This cannot be undone.')) return
    await supabase.from('orders').update({ escrow_status: 'released' }).eq('id', orderId)
    alert('Payment released to artist! 🎉')
  }

  if (!order) return <div className="page" style={{ textAlign: 'center', paddingTop: '140px' }}>Loading...</div>

  const other = profile?.id === order.buyer_id ? (order as any).artist : (order as any).buyer
  const isBuyer = profile?.id === order.buyer_id

  return (
    <div className="page" style={{ maxWidth: '800px' }}>
      {/* Header */}
      <div className="card" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--mist)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
            {other?.avatar_url ? <img src={other.avatar_url} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" /> : '🎨'}
          </div>
          <div>
            <div style={{ fontWeight: 700 }}>{other?.full_name}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--slate)' }}>{isBuyer ? 'Artist' : 'Client'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '1rem', fontWeight: 700, color: 'var(--clay)' }}>${order.amount}</div>
            <div style={{ fontSize: '0.72rem', color: order.escrow_status === 'held' ? 'var(--sage)' : 'var(--slate)' }}>
              {order.escrow_status === 'held' ? '🔒 In Escrow' : order.escrow_status === 'released' ? '✓ Released' : 'Refunded'}
            </div>
          </div>
          {isBuyer && order.escrow_status === 'held' && (
            <button onClick={releasePayment} className="btn-primary" style={{ padding: '9px 18px', fontSize: '0.82rem' }}>
              Release Payment ✓
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={{ background: 'white', border: '1px solid var(--mist)', borderRadius: '16px', marginBottom: '16px', height: '480px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--slate)', padding: '40px 0', fontSize: '0.9rem' }}>
              No messages yet. Say hello! 👋
            </div>
          )}
          {messages.map(msg => {
            const isMe = msg.sender_id === profile?.id
            return (
              <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', gap: '10px', alignItems: 'flex-end' }}>
                {!isMe && (
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--mist)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0 }}>
                    {(msg as any).sender?.avatar_url ? <img src={(msg as any).sender.avatar_url} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" /> : '🎨'}
                  </div>
                )}
                <div style={{ maxWidth: '70%' }}>
                  <div style={{
                    background: isMe ? 'var(--clay)' : 'var(--mist)',
                    color: isMe ? 'white' : 'var(--ink)',
                    padding: '12px 16px', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    fontSize: '0.88rem', lineHeight: 1.55
                  }}>
                    {msg.content}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--slate)', marginTop: '4px', textAlign: isMe ? 'right' : 'left' }}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} style={{ padding: '16px 20px', borderTop: '1px solid var(--mist)', display: 'flex', gap: '10px' }}>
          <input className="form-input" placeholder="Type a message..." value={newMsg}
            onChange={e => setNewMsg(e.target.value)} style={{ flex: 1, marginBottom: 0 }} />
          <button type="submit" className="btn-primary" style={{ padding: '12px 20px', whiteSpace: 'nowrap' }} disabled={sending || !newMsg.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
