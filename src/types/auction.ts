export interface LotStat {
  label: string;
  value: string;
}

export interface AuctionLot {
  id: string;
  title: string;
  category: string;
  description?: string;
  basePrice: number;
  imageUrl?: string;
  rating?: number;
  stats?: LotStat[];
  status: 'upcoming' | 'bidding' | 'sold' | 'unsold';
  soldTo?: {
    participantId: string;
    name: string;
    avatar: string;
    amount: number;
  };
}

export interface BidEntry {
  id: string;
  participantId: string;
  bidderName: string;
  avatar: string;
  amount: number;
  timestamp: number;
}

export interface AuctionParticipant {
  id: string;
  name: string;
  avatar: string;
  purse: number; // remaining budget
  initialPurse: number;
  wonLots: AuctionLot[];
  joinedAt: number;
}

export type GavelPhase = 'idle' | 'going_once' | 'going_twice' | 'sold' | 'unsold';

export interface AuctionRoom {
  code: string;
  title: string;
  packId?: string;
  mode?: string;
  currencySymbol: string; // e.g. '₹' or '$'
  unitLabel: string; // e.g. 'Cr', 'Lakh', ''
  initialPurse: number;
  minIncrement: number;
  status: 'lobby' | 'active' | 'paused' | 'completed';
  currentLotIndex: number;
  lots: AuctionLot[];
  currentBid: number;
  highestBidder: {
    participantId: string;
    name: string;
    avatar: string;
    amount: number;
  } | null;
  gavelPhase: GavelPhase;
  gavelCountdown: number; // e.g. 10 to 0
  bids: BidEntry[];
  participants: Record<string, AuctionParticipant>;
  createdAt: number;
  updatedAt: number;
  version: number; // Monotonically increasing revision counter to eliminate race conditions & blinking
}

export interface PlayerJoinEvent {
  code: string;
  participant: Omit<AuctionParticipant, 'purse' | 'initialPurse' | 'wonLots'>;
}

export interface PlayerBidEvent {
  code: string;
  lotIndex: number;
  participantId: string;
  amount: number;
  timestamp: number;
}

export interface RequestSyncEvent {
  code: string;
  requesterId?: string;
}

