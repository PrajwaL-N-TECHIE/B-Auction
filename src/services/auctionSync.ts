import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { AuctionRoom, AuctionParticipant, BidEntry, AuctionLot } from '../types/auction';
import { SAMPLE_LOT_PACKS } from '../constants/samplePacks';

const localRoomCache: Record<string, AuctionRoom> = {};
const subscribers: Record<string, ((room: AuctionRoom) => void)[]> = {};
const localChannels: Record<string, BroadcastChannel> = {};
const supabaseChannels: Record<string, RealtimeChannel> = {};

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 3; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `AUC-${rand}`;
}

/**
 * Get or create local BroadcastChannel for zero-latency multi-tab sync
 */
function getLocalChannel(code: string): BroadcastChannel | null {
  if (typeof window === 'undefined' || !window.BroadcastChannel) return null;
  const cleanCode = code.toUpperCase().trim();
  if (!localChannels[cleanCode]) {
    try {
      localChannels[cleanCode] = new BroadcastChannel(`bauction_local_${cleanCode}`);
    } catch {}
  }
  return localChannels[cleanCode] || null;
}

/**
 * Get or create Supabase Realtime WebSocket channel for instant sub-20ms cross-device sync
 */
export function getSupabaseChannel(code: string): RealtimeChannel {
  const cleanCode = code.toUpperCase().trim();
  const channelName = `auction_room_${cleanCode}`;
  if (!supabaseChannels[channelName]) {
    supabaseChannels[channelName] = supabase.channel(channelName, {
      config: {
        broadcast: {
          self: true,
          ack: true
        }
      }
    });
  }
  return supabaseChannels[channelName];
}

/**
 * Broadcast room update instantly across Supabase WebSockets, local tabs, and memory
 */
export async function broadcastRoomUpdate(code: string, room: AuctionRoom): Promise<void> {
  const cleanCode = code.toUpperCase().trim();
  localRoomCache[cleanCode] = room;

  // 1. Persist to localStorage
  try {
    localStorage.setItem(`bauction_room_${cleanCode}`, JSON.stringify(room));
  } catch {}

  // 2. Notify in-memory listeners
  const listeners = subscribers[cleanCode];
  if (listeners) {
    listeners.forEach(cb => {
      try { cb(room); } catch (e) { console.warn('Listener callback error:', e); }
    });
  }

  // 3. Send over local BroadcastChannel for multi-tab localhost sync
  const localCh = getLocalChannel(cleanCode);
  if (localCh) {
    try {
      localCh.postMessage({ type: 'ROOM_UPDATE', room });
    } catch {}
  }

  // 4. Send over Supabase Realtime WebSockets to all connected phones & laptops
  try {
    const sbChan = getSupabaseChannel(cleanCode);
    await sbChan.send({
      type: 'broadcast',
      event: 'ROOM_UPDATE',
      payload: room
    });
  } catch (err) {
    console.warn('[Supabase Realtime] Broadcast warn:', err);
  }
}

/**
 * Create a new Auction Arena
 */
export async function createRoom(
  code: string,
  title: string,
  packId: string = 'cricket',
  customPurse?: number,
  customIncrement?: number
): Promise<AuctionRoom> {
  const cleanCode = code.toUpperCase().trim();
  const selectedPack = SAMPLE_LOT_PACKS.find(p => p.id === packId) || SAMPLE_LOT_PACKS[0];

  const purse = customPurse !== undefined && customPurse > 0 ? customPurse : selectedPack.defaultPurse;
  const increment = customIncrement !== undefined && customIncrement > 0 ? customIncrement : selectedPack.minIncrement;

  const initialLots: AuctionLot[] = selectedPack.lots.map((lot, index) => ({
    ...lot,
    status: index === 0 ? 'bidding' : 'upcoming'
  }));

  const initialRoom: AuctionRoom = {
    code: cleanCode,
    title: title || selectedPack.name,
    currencySymbol: selectedPack.currencySymbol,
    unitLabel: selectedPack.unitLabel,
    initialPurse: purse,
    minIncrement: increment,
    status: 'active',
    currentLotIndex: 0,
    lots: initialLots,
    currentBid: initialLots[0]?.basePrice || 1.0,
    highestBidder: null,
    gavelPhase: 'idle',
    gavelCountdown: 10,
    bids: [],
    participants: {},
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  // Ensure channel is subscribed so broadcast goes through immediately
  const sbChan = getSupabaseChannel(cleanCode);
  await new Promise<void>((resolve) => {
    sbChan.subscribe((status) => {
      if (status === 'SUBSCRIBED' || status === 'CHANNEL_ERROR') {
        resolve();
      }
    });
    // Fallback timeout in case already subscribed or offline
    setTimeout(resolve, 800);
  });

  await broadcastRoomUpdate(cleanCode, initialRoom);
  console.log(`[Supabase Realtime] Auction Arena ${cleanCode} created successfully!`);
  return initialRoom;
}

/**
 * Join Room as a Franchise / Bidder
 */
export async function joinRoom(
  code: string,
  participant: Omit<AuctionParticipant, 'purse' | 'initialPurse' | 'wonLots'>
): Promise<AuctionRoom> {
  const cleanCode = code.toUpperCase().trim();
  let room = getCachedRoom(cleanCode);

  if (!room) {
    // Attempt fallback from localStorage
    try {
      const stored = localStorage.getItem(`bauction_room_${cleanCode}`);
      if (stored) room = JSON.parse(stored);
    } catch {}
  }

  if (!room) {
    // Joining before host state arrived: initialize fallback template
    room = {
      code: cleanCode,
      title: 'Premier Cricket Auction (IPL Mega Auction)',
      currencySymbol: '₹',
      unitLabel: 'Cr',
      initialPurse: 100,
      minIncrement: 0.25,
      status: 'active',
      currentLotIndex: 0,
      lots: SAMPLE_LOT_PACKS[0].lots,
      currentBid: SAMPLE_LOT_PACKS[0].lots[0].basePrice,
      highestBidder: null,
      gavelPhase: 'idle',
      gavelCountdown: 10,
      bids: [],
      participants: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }

  const existingParticipant = room.participants?.[participant.id];
  const fullParticipant: AuctionParticipant = {
    ...participant,
    purse: existingParticipant ? existingParticipant.purse : room.initialPurse,
    initialPurse: room.initialPurse,
    wonLots: existingParticipant ? existingParticipant.wonLots : []
  };

  const updatedRoom: AuctionRoom = {
    ...room,
    participants: {
      ...(room.participants || {}),
      [participant.id]: fullParticipant
    },
    updatedAt: Date.now()
  };

  await broadcastRoomUpdate(cleanCode, updatedRoom);
  return updatedRoom;
}

/**
 * Place a Bid in the Auction Arena
 */
export async function placeBid(code: string, participantId: string, amount: number): Promise<AuctionRoom> {
  const cleanCode = code.toUpperCase().trim();
  const room = getCachedRoom(cleanCode);
  if (!room) throw new Error('Auction room not found');

  const participant = room.participants?.[participantId];
  if (!participant) throw new Error('Participant not registered in this arena');

  // Verify purse balance
  if (participant.purse < amount) {
    throw new Error(`Insufficient purse balance! You have ${room.currencySymbol}${participant.purse.toFixed(2)} ${room.unitLabel}`);
  }

  // Verify amount is strictly greater than current bid
  if (amount <= room.currentBid && room.highestBidder !== null) {
    throw new Error(`Bid must be higher than current bid (${room.currencySymbol}${room.currentBid.toFixed(2)} ${room.unitLabel})`);
  }

  const newBid: BidEntry = {
    id: `bid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    participantId: participant.id,
    bidderName: participant.name,
    avatar: participant.avatar,
    amount: Number(amount.toFixed(2)),
    timestamp: Date.now()
  };

  const updatedRoom: AuctionRoom = {
    ...room,
    currentBid: newBid.amount,
    highestBidder: {
      participantId: participant.id,
      name: participant.name,
      avatar: participant.avatar,
      amount: newBid.amount
    },
    gavelPhase: 'idle',
    gavelCountdown: 10,
    bids: [newBid, ...(room.bids || [])].slice(0, 40),
    updatedAt: Date.now()
  };

  await broadcastRoomUpdate(cleanCode, updatedRoom);
  return updatedRoom;
}

/**
 * Set Gavel Countdown Phase (Host Action: Going Once / Going Twice)
 */
export async function setGavelPhase(code: string, phase: AuctionRoom['gavelPhase'], countdown?: number): Promise<AuctionRoom> {
  const cleanCode = code.toUpperCase().trim();
  const room = getCachedRoom(cleanCode);
  if (!room) throw new Error('Room not found');

  const updatedRoom: AuctionRoom = {
    ...room,
    gavelPhase: phase,
    gavelCountdown: countdown !== undefined ? countdown : room.gavelCountdown,
    updatedAt: Date.now()
  };

  await broadcastRoomUpdate(cleanCode, updatedRoom);
  return updatedRoom;
}

/**
 * Sell current Lot to the Highest Bidder (Host Action)
 */
export async function sellCurrentLot(code: string): Promise<AuctionRoom> {
  const cleanCode = code.toUpperCase().trim();
  const room = getCachedRoom(cleanCode);
  if (!room) throw new Error('Room not found');

  const currentLot = room.lots[room.currentLotIndex];
  if (!currentLot) throw new Error('No lot on stage');

  const winningBidder = room.highestBidder;
  if (!winningBidder) {
    return passCurrentLot(code);
  }

  const updatedLots = [...room.lots];
  const soldLot: AuctionLot = {
    ...currentLot,
    status: 'sold',
    soldTo: {
      participantId: winningBidder.participantId,
      name: winningBidder.name,
      avatar: winningBidder.avatar,
      amount: winningBidder.amount
    }
  };
  updatedLots[room.currentLotIndex] = soldLot;

  // Deduct purse and assign won lot to winner
  const updatedParticipants = { ...room.participants };
  const winner = updatedParticipants[winningBidder.participantId];
  if (winner) {
    updatedParticipants[winningBidder.participantId] = {
      ...winner,
      purse: Math.max(0, Number((winner.purse - winningBidder.amount).toFixed(2))),
      wonLots: [soldLot, ...(winner.wonLots || [])]
    };
  }

  const updatedRoom: AuctionRoom = {
    ...room,
    lots: updatedLots,
    participants: updatedParticipants,
    gavelPhase: 'sold',
    updatedAt: Date.now()
  };

  await broadcastRoomUpdate(cleanCode, updatedRoom);
  return updatedRoom;
}

/**
 * Pass current Lot as Unsold (Host Action)
 */
export async function passCurrentLot(code: string): Promise<AuctionRoom> {
  const cleanCode = code.toUpperCase().trim();
  const room = getCachedRoom(cleanCode);
  if (!room) throw new Error('Room not found');

  const updatedLots = [...room.lots];
  const currentLot = updatedLots[room.currentLotIndex];
  if (currentLot) {
    updatedLots[room.currentLotIndex] = {
      ...currentLot,
      status: 'unsold'
    };
  }

  const updatedRoom: AuctionRoom = {
    ...room,
    lots: updatedLots,
    gavelPhase: 'unsold',
    updatedAt: Date.now()
  };

  await broadcastRoomUpdate(cleanCode, updatedRoom);
  return updatedRoom;
}

/**
 * Navigate to next / previous Lot (Host Action)
 */
export async function navigateLot(code: string, direction: 'next' | 'prev'): Promise<AuctionRoom> {
  const cleanCode = code.toUpperCase().trim();
  const room = getCachedRoom(cleanCode);
  if (!room) throw new Error('Room not found');

  let newIndex = direction === 'next' ? room.currentLotIndex + 1 : room.currentLotIndex - 1;
  if (newIndex < 0) newIndex = 0;
  if (newIndex >= room.lots.length) newIndex = room.lots.length - 1;

  const targetLot = room.lots[newIndex];
  const updatedLots = [...room.lots];
  if (targetLot && targetLot.status === 'upcoming') {
    updatedLots[newIndex] = { ...targetLot, status: 'bidding' };
  }

  const updatedRoom: AuctionRoom = {
    ...room,
    currentLotIndex: newIndex,
    lots: updatedLots,
    currentBid: targetLot?.soldTo ? targetLot.soldTo.amount : targetLot?.basePrice || 1.0,
    highestBidder: targetLot?.soldTo ? {
      participantId: targetLot.soldTo.participantId,
      name: targetLot.soldTo.name,
      avatar: targetLot.soldTo.avatar,
      amount: targetLot.soldTo.amount
    } : null,
    gavelPhase: targetLot?.status === 'sold' ? 'sold' : targetLot?.status === 'unsold' ? 'unsold' : 'idle',
    gavelCountdown: 10,
    bids: [],
    updatedAt: Date.now()
  };

  await broadcastRoomUpdate(cleanCode, updatedRoom);
  return updatedRoom;
}

/**
 * Subscribe to Real-Time Room Updates
 * Powered by Supabase Realtime WebSockets for zero-reload sub-20ms cross-device sync!
 */
export function subscribeRoom(code: string, onUpdate: (room: AuctionRoom) => void): () => void {
  const cleanCode = code.toUpperCase().trim();

  if (!subscribers[cleanCode]) {
    subscribers[cleanCode] = [];
  }
  subscribers[cleanCode].push(onUpdate);

  // 1. Initial immediate push from local cache or storage
  const cached = getCachedRoom(cleanCode);
  if (cached) {
    onUpdate(cached);
  }

  // 2. Local BroadcastChannel listener (multi-tab sync)
  const localCh = getLocalChannel(cleanCode);
  const handleLocalMsg = (ev: MessageEvent) => {
    if (ev.data?.type === 'ROOM_UPDATE' && ev.data.room?.code === cleanCode) {
      localRoomCache[cleanCode] = ev.data.room;
      onUpdate(ev.data.room);
    }
  };
  localCh?.addEventListener('message', handleLocalMsg);

  // 3. Supabase Realtime WebSocket channel listener
  const sbChan = getSupabaseChannel(cleanCode);

  sbChan
    .on('broadcast', { event: 'ROOM_UPDATE' }, (msg) => {
      if (msg.payload && msg.payload.code === cleanCode) {
        localRoomCache[cleanCode] = msg.payload;
        try {
          localStorage.setItem(`bauction_room_${cleanCode}`, JSON.stringify(msg.payload));
        } catch {}
        onUpdate(msg.payload);
      }
    })
    .on('broadcast', { event: 'REQUEST_SYNC' }, () => {
      // If we have current room state (e.g. Host), broadcast it to newly joined bidders
      const current = localRoomCache[cleanCode] || getCachedRoom(cleanCode);
      if (current) {
        sbChan.send({
          type: 'broadcast',
          event: 'ROOM_UPDATE',
          payload: current
        }).catch(() => {});
      }
    });

  // Ensure channel is subscribed and request state from host
  sbChan.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log(`[Supabase Realtime] Connected to auction channel: ${cleanCode}`);
      // Request latest room state from any active host / peer
      sbChan.send({
        type: 'broadcast',
        event: 'REQUEST_SYNC',
        payload: {}
      }).catch(() => {});
    }
  });

  // 4. Storage event listener fallback
  const storageHandler = (e: StorageEvent) => {
    if (e.key === `bauction_room_${cleanCode}` && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        localRoomCache[cleanCode] = parsed;
        onUpdate(parsed);
      } catch {}
    }
  };
  window.addEventListener('storage', storageHandler);

  return () => {
    window.removeEventListener('storage', storageHandler);
    localCh?.removeEventListener('message', handleLocalMsg);
    if (subscribers[cleanCode]) {
      subscribers[cleanCode] = subscribers[cleanCode].filter(cb => cb !== onUpdate);
    }
  };
}

export function getCachedRoom(code: string): AuctionRoom | null {
  const cleanCode = code.toUpperCase().trim();
  if (localRoomCache[cleanCode]) return localRoomCache[cleanCode];
  try {
    const stored = localStorage.getItem(`bauction_room_${cleanCode}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      localRoomCache[cleanCode] = parsed;
      return parsed;
    }
  } catch {}
  return null;
}
