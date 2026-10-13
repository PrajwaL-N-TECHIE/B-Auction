import { supabase } from '../lib/supabase';
import type { AuctionRoom, AuctionParticipant, BidEntry, AuctionLot } from '../types/auction';
import { SAMPLE_LOT_PACKS } from '../constants/samplePacks';

const localCache: Record<string, AuctionRoom> = {};
const activeSubscriptions: Record<string, ((room: AuctionRoom) => void)[]> = {};

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let prefix = 'AUC';
  let rand = '';
  for (let i = 0; i < 3; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${rand}`;
}

function notifyLocalListeners(code: string, room: AuctionRoom) {
  localCache[code] = room;
  try {
    localStorage.setItem(`bauction_room_${code}`, JSON.stringify(room));
  } catch {}

  const listeners = activeSubscriptions[code];
  if (listeners) {
    listeners.forEach(cb => {
      try { cb(room); } catch (e) { console.warn('Listener error:', e); }
    });
  }
}

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

  const newRoom: AuctionRoom = {
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

  notifyLocalListeners(cleanCode, newRoom);

  // Broadcast to Supabase Realtime channel
  try {
    const channel = supabase.channel(`auction_room_${cleanCode}`);
    await channel.subscribe();
    await channel.send({
      type: 'broadcast',
      event: 'room_state',
      payload: newRoom
    });
  } catch (err) {
    console.warn('Supabase createRoom warning:', err);
  }

  return newRoom;
}

export async function joinRoom(code: string, participant: Omit<AuctionParticipant, 'purse' | 'initialPurse' | 'wonLots'>): Promise<AuctionRoom> {
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
    // If joining before room cache arrives, create minimal active structure
    room = {
      code: cleanCode,
      title: 'Buildicy Live Auction',
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

  notifyLocalListeners(cleanCode, updatedRoom);

  try {
    const channel = supabase.channel(`auction_room_${cleanCode}`);
    await channel.send({
      type: 'broadcast',
      event: 'room_state',
      payload: updatedRoom
    });
  } catch (e) {
    console.warn('Supabase joinRoom broadcast error:', e);
  }

  return updatedRoom;
}

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
    id: `bid_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
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
    bids: [newBid, ...(room.bids || [])].slice(0, 30),
    updatedAt: Date.now()
  };

  notifyLocalListeners(cleanCode, updatedRoom);

  try {
    const channel = supabase.channel(`auction_room_${cleanCode}`);
    await channel.send({
      type: 'broadcast',
      event: 'bid_placed',
      payload: updatedRoom
    });
  } catch (e) {
    console.warn('Supabase placeBid error:', e);
  }

  return updatedRoom;
}

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

  notifyLocalListeners(cleanCode, updatedRoom);

  try {
    const channel = supabase.channel(`auction_room_${cleanCode}`);
    await channel.send({
      type: 'broadcast',
      event: 'gavel_phase',
      payload: updatedRoom
    });
  } catch (e) {
    console.warn('Supabase setGavelPhase error:', e);
  }

  return updatedRoom;
}

export async function sellCurrentLot(code: string): Promise<AuctionRoom> {
  const cleanCode = code.toUpperCase().trim();
  const room = getCachedRoom(cleanCode);
  if (!room) throw new Error('Room not found');

  const currentLot = room.lots[room.currentLotIndex];
  if (!currentLot) throw new Error('No lot on stage');

  const winningBidder = room.highestBidder;
  if (!winningBidder) {
    // If no one bid, mark unsold
    return passCurrentLot(code);
  }

  // Update lot
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

  // Deduct purse and add won lot to winner
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

  notifyLocalListeners(cleanCode, updatedRoom);

  try {
    const channel = supabase.channel(`auction_room_${cleanCode}`);
    await channel.send({
      type: 'broadcast',
      event: 'lot_sold',
      payload: updatedRoom
    });
  } catch (e) {
    console.warn('Supabase sellCurrentLot error:', e);
  }

  return updatedRoom;
}

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

  notifyLocalListeners(cleanCode, updatedRoom);

  try {
    const channel = supabase.channel(`auction_room_${cleanCode}`);
    await channel.send({
      type: 'broadcast',
      event: 'lot_unsold',
      payload: updatedRoom
    });
  } catch (e) {
    console.warn('Supabase passCurrentLot error:', e);
  }

  return updatedRoom;
}

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

  notifyLocalListeners(cleanCode, updatedRoom);

  try {
    const channel = supabase.channel(`auction_room_${cleanCode}`);
    await channel.send({
      type: 'broadcast',
      event: 'lot_navigate',
      payload: updatedRoom
    });
  } catch (e) {
    console.warn('Supabase navigateLot error:', e);
  }

  return updatedRoom;
}

export function subscribeRoom(code: string, onUpdate: (room: AuctionRoom) => void): () => void {
  const cleanCode = code.toUpperCase().trim();

  if (!activeSubscriptions[cleanCode]) {
    activeSubscriptions[cleanCode] = [];
  }
  activeSubscriptions[cleanCode].push(onUpdate);

  const cached = getCachedRoom(cleanCode);
  if (cached) {
    onUpdate(cached);
  }

  const channel = supabase.channel(`auction_room_${cleanCode}`);
  channel
    .on('broadcast', { event: '*' }, (message: any) => {
      if (message.payload && message.payload.code === cleanCode) {
        notifyLocalListeners(cleanCode, message.payload);
      }
    })
    .subscribe();

  const storageHandler = (e: StorageEvent) => {
    if (e.key === `bauction_room_${cleanCode}` && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        notifyLocalListeners(cleanCode, parsed);
      } catch {}
    }
  };
  window.addEventListener('storage', storageHandler);

  return () => {
    window.removeEventListener('storage', storageHandler);
    channel.unsubscribe().catch(() => {});
    if (activeSubscriptions[cleanCode]) {
      activeSubscriptions[cleanCode] = activeSubscriptions[cleanCode].filter(cb => cb !== onUpdate);
    }
  };
}

export function getCachedRoom(code: string): AuctionRoom | null {
  const cleanCode = code.toUpperCase().trim();
  if (localCache[cleanCode]) return localCache[cleanCode];
  try {
    const stored = localStorage.getItem(`bauction_room_${cleanCode}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      localCache[cleanCode] = parsed;
      return parsed;
    }
  } catch {}
  return null;
}
