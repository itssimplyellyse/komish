export type Role = 'buyer' | 'artist'

export interface Profile {
  id: string
  role: Role
  full_name: string | null
  username: string | null
  bio: string | null
  avatar_url: string | null
  location: string | null
  website: string | null
  starting_price: number | null
  verified: boolean
  pitch_count: number
  pitch_limit: number
  created_at: string
}

export interface ArtistTag {
  id: string
  artist_id: string
  tag: string
}

export interface PortfolioImage {
  id: string
  artist_id: string
  image_url: string
  caption: string | null
  created_at: string
}

export interface Brief {
  id: string
  buyer_id: string
  title: string
  description: string | null
  budget_min: number | null
  budget_max: number | null
  deadline: string | null
  status: 'open' | 'in_progress' | 'completed' | 'closed'
  created_at: string
  profiles?: Profile
  brief_tags?: BriefTag[]
}

export interface BriefTag {
  id: string
  brief_id: string
  tag: string
}

export interface Proposal {
  id: string
  brief_id: string
  artist_id: string
  message: string
  price: number
  delivery_days: number
  revisions: number
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  profiles?: Profile
  briefs?: Brief
}

export interface Pitch {
  id: string
  buyer_id: string
  artist_id: string
  message: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  buyer?: Profile
  artist?: Profile
}

export interface Order {
  id: string
  proposal_id: string
  buyer_id: string
  artist_id: string
  amount: number
  stripe_payment_intent: string | null
  escrow_status: 'held' | 'released' | 'refunded'
  created_at: string
  buyer?: Profile
  artist?: Profile
}

export interface Message {
  id: string
  order_id: string
  sender_id: string
  content: string
  created_at: string
  sender?: Profile
}
