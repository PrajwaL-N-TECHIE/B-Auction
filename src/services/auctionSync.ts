import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type {
  AuctionRoom,
  AuctionParticipant,
  BidEntry,
  AuctionLot,
  PlayerJoinEvent,
  PlayerBidEvent,
  RequestSyncEvent
} from '../types/auction';
import { SAMPLE_LOT_PACKS } from '../constants/samplePacks';

const localRoomCache: Record<string, AuctionRoom> = {};
const subscribers: Record<string, ((room: AuctionRoom) => void)[]> = {};
const localChannels: Record<string, BroadcastChannel> = {};
const supabaseChannels: Record<string, RealtimeChannel> = {};
const hostRooms: Set<string> = new Set();
const hostJoinDebounceTimers: Record<string, any> = {};

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 3; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `AUC-${rand}`;
}

export function registerHost(code: string): void {
  const cleanCode = code.toUpperCase().trim();
  hostRooms.add(cleanCode);
  try {
    sessionStorage.setItem(`bauction_is_host_${cleanCode}`, 'true');
  } catch {}
}

export function unregisterHost(code: string): void {
  const cleanCode = code.toUpperCase().trim();
  hostRooms.delete(cleanCode);
  try {
    sessionStorage.removeItem(`bauction_is_host_${cleanCode}`);
  } catch {}
}

export function isHost(code: string): boolean {
  const cleanCode = code.toUpperCase().trim();
  if (hostRooms.has(cleanCode)) return true;
  try {
    return (
      sessionStorage.getItem(`bauction_is_host_${cleanCode}`) === 'true' ||
      sessionStorage.getItem('bauction_tab_role') === 'host'
    );
  } catch {
    return false;
  }
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
 * Get or create Supabase Realtime WebSocket channel with self: false
 * to strictly prevent echo feedback loops
 */
export function getSupabaseChannel(code: string): RealtimeChannel {
  const cleanCode = code.toUpperCase().trim();
  const channelName = `auction_room_${cleanCode}`;
  if (!supabaseChannels[channelName]) {
    supabaseChannels[channelName] = supabase.channel(channelName, {
      config: {
        broadcast: {
          self: false, // NEVER deliver to self to prevent echo feedback loops
          ack: false
        }
      }
    });
  }
  return supabaseChannels[channelName];
}

/**
 * Notify in-memory listeners and persist to localStorage
 */
function notifyListeners(code: string, room: AuctionRoom) {
  const cleanCode = code.toUpperCase().trim();
  localRoomCache[cleanCode] = room;

  try {
    localStorage.setItem(`bauction_room_${cleanCode}`, JSON.stringify(room));
  } catch {}

  const listeners = subscribers[cleanCode];
  if (listeners) {
    listeners.forEach((cb) => {
      try {
        cb(room);
      } catch (e) {
        console.warn('Listener callback error:', e);
      }
    });
  }
}

/**
 * Host-only authoritative room broadcast:
 * Delivers room update to all connected bidders, projector screens, and local tabs.
 */
export async function hostBroadcastRoom(code: string, room: AuctionRoom): Promise<void> {
  const cleanCode = code.toUpperCase().trim();
  notifyListeners(cleanCode, room);

  // 1. Send over local BroadcastChannel for multi-tab localhost sync
  const localCh = getLocalChannel(cleanCode);
  if (localCh) {
    try {
      localCh.postMessage({ type: 'ROOM_UPDATE', room });
    } catch {}
  }

  // 2. Send over Supabase Realtime WebSockets to all connected phones & laptops
  try {
    const sbChan = getSupabaseChannel(cleanCode);
    sbChan.send({
      type: 'broadcast',
      event: 'ROOM_UPDATE',
      payload: room
    }).catch(() => {});
  } catch (err) {
    console.warn('[Supabase Realtime] Broadcast warn:', err);
  }
}

// Backwards compatibility alias for host actions
export const broadcastRoomUpdate = hostBroadcastRoom;

/**
 * Monotonically apply incoming ROOM_UPDATE:
 * Strictly prevents out-of-order, stale packets from reverting the UI.
 */
function applyIncomingRoomUpdate(code: string, incomingRoom: AuctionRoom) {
  const cleanCode = code.toUpperCase().trim();
  const current = localRoomCache[cleanCode];

  if (current) {
    // Monotonic version check: Discard older revisions
    if ((incomingRoom.version || 0) < (current.version || 0)) {
      return;
    }
  }

  notifyListeners(cleanCode, incomingRoom);
}

/**
 * Host handler for participant joining:
 * Batches incoming joins so 80 concurrent bidders don't flood the channel with 80 room updates.
 */
function handleHostPlayerJoin(
  code: string,
  participant: Omit<AuctionParticipant, 'purse' | 'initialPurse' | 'wonLots'>
) {
  const cleanCode = code.toUpperCase().trim();
  const room = localRoomCache[cleanCode] || getCachedRoom(cleanCode);
  if (!room) return;

  const currentParticipants = room.participants || {};
  let finalParticipantId = participant.id;
  const cleanNameLower = participant.name.trim().toLowerCase();

  // If already present with same data, don't spam updates
  if (currentParticipants[finalParticipantId] && currentParticipants[finalParticipantId].name === participant.name) {
    return;
  }

  const existingSameId = currentParticipants[participant.id];
  if (existingSameId && existingSameId.name.trim().toLowerCase() !== cleanNameLower) {
    finalParticipantId = `tm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }

  const existingParticipant = currentParticipants[finalParticipantId];
  const fullParticipant: AuctionParticipant = {
    ...participant,
    id: finalParticipantId,
    purse: existingParticipant ? existingParticipant.purse : room.initialPurse,
    initialPurse: room.initialPurse,
    wonLots: existingParticipant ? existingParticipant.wonLots : []
  };

  const updatedParticipants = {
    ...currentParticipants,
    [finalParticipantId]: fullParticipant
  };

  const nextRoom: AuctionRoom = {
    ...room,
    participants: updatedParticipants,
    version: (room.version || 0) + 1,
    updatedAt: Date.now()
  };

  localRoomCache[cleanCode] = nextRoom;

  // Debounce broadcast by 50ms so concurrent joins are bundled cleanly
  if (hostJoinDebounceTimers[cleanCode]) {
    clearTimeout(hostJoinDebounceTimers[cleanCode]);
  }
  hostJoinDebounceTimers[cleanCode] = setTimeout(() => {
    delete hostJoinDebounceTimers[cleanCode];
    const latest = localRoomCache[cleanCode];
    if (latest) {
      hostBroadcastRoom(cleanCode, latest);
    }
  }, 50);
}

/**
 * Host handler for placing a bid:
 * Atomic, conflict-free, sequential price assignment.
 */
function handleHostPlayerBid(code: string, payload: PlayerBidEvent) {
  const cleanCode = code.toUpperCase().trim();
  const room = localRoomCache[cleanCode] || getCachedRoom(cleanCode);
  if (!room) return;

  // 1. Verify auction is active
  if (room.status !== 'active') return;

  // 2. Verify lot index matches
  if (payload.lotIndex !== room.currentLotIndex) return;

  const participant = room.participants?.[payload.participantId];
  if (!participant) return;

  // 3. Verify purse balance
  if (participant.purse < payload.amount) return;

  // 4. Verify amount is strictly higher than current bid (or >= basePrice if no bids yet)
  const isHigher = room.highestBidder === null ? payload.amount >= room.currentBid : payload.amount > room.currentBid;
  if (!isHigher) return;

  const newBid: BidEntry = {
    id: `bid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    participantId: participant.id,
    bidderName: participant.name,
    avatar: participant.avatar,
    amount: Number(payload.amount.toFixed(2)),
    timestamp: payload.timestamp || Date.now()
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
    version: (room.version || 0) + 1,
    updatedAt: Date.now()
  };

  hostBroadcastRoom(cleanCode, updatedRoom);
}

/**
 * Create a new Auction Arena (Host Action)
 */
export async function createRoom(
  code: string,
  title: string,
  packId: string = 'cricket',
  customPurse?: number,
  customIncrement?: number
): Promise<AuctionRoom> {
  const cleanCode = code.toUpperCase().trim();
  registerHost(cleanCode);

  const selectedPack = SAMPLE_LOT_PACKS.find((p) => p.id === packId) || SAMPLE_LOT_PACKS[0];
  const purse = customPurse !== undefined && customPurse > 0 ? customPurse : selectedPack.defaultPurse;
  const increment =
    customIncrement !== undefined && customIncrement > 0 ? customIncrement : selectedPack.minIncrement;

  const initialLots: AuctionLot[] = selectedPack.lots.map((lot, index) => ({
    ...lot,
    status: index === 0 ? 'bidding' : 'upcoming'
  }));

  const initialRoom: AuctionRoom = {
    code: cleanCode,
    title: title || selectedPack.name,
    packId: selectedPack.id,
    mode: selectedPack.id,
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
    updatedAt: Date.now(),
    version: 1
  };

  await hostBroadcastRoom(cleanCode, initialRoom);
  return initialRoom;
}

/**
 * Join Room as a Franchise / Bidder:
 * Emits lightweight PLAYER_JOIN and REQUEST_SYNC events.
 * Bidders NEVER broadcast full room states!
 */
export async function joinRoom(
  code: string,
  participant: Omit<AuctionParticipant, 'purse' | 'initialPurse' | 'wonLots'>
): Promise<AuctionRoom> {
  const cleanCode = code.toUpperCase().trim();
  let room = getCachedRoom(cleanCode);

  if (!room) {
    try {
      const stored = localStorage.getItem(`bauction_room_${cleanCode}`);
      if (stored) room = JSON.parse(stored);
    } catch {}
  }

  const baseRoom: AuctionRoom = room || {
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
    updatedAt: Date.now(),
    version: 1
  };

  // Optimistically register in local cache
  const fullParticipant: AuctionParticipant = {
    ...participant,
    purse: baseRoom.initialPurse,
    initialPurse: baseRoom.initialPurse,
    wonLots: []
  };

  const updatedRoom: AuctionRoom = {
    ...baseRoom,
    participants: {
      ...(baseRoom.participants || {}),
      [participant.id]: fullParticipant
    }
  };
  localRoomCache[cleanCode] = updatedRoom;
  notifyListeners(cleanCode, updatedRoom);

  const joinPayload: PlayerJoinEvent = {
    code: cleanCode,
    participant
  };

  // 1. Broadcast to local tabs
  const localCh = getLocalChannel(cleanCode);
  localCh?.postMessage({ type: 'PLAYER_JOIN', payload: joinPayload });

  // 2. Broadcast PLAYER_JOIN event to Host via Supabase WebSockets
  try {
    const sbChan = getSupabaseChannel(cleanCode);
    sbChan.send({
      type: 'broadcast',
      event: 'PLAYER_JOIN',
      payload: joinPayload
    }).catch(() => {});
  } catch (e) {}

  // 3. Request current authoritative room from Host
  try {
    const sbChan = getSupabaseChannel(cleanCode);
    sbChan.send({
      type: 'broadcast',
      event: 'REQUEST_SYNC',
      payload: { code: cleanCode, requesterId: participant.id } as RequestSyncEvent
    }).catch(() => {});
  } catch (e) {}

  return updatedRoom;
}

/**
 * Place a Bid in the Auction Arena (Bidder Action):
 * Emits lightweight PLAYER_BID event to Host.
 * Host validates purse, enforces price increment, and broadcasts ROOM_UPDATE.
 */
export async function placeBid(
  code: string,
  participantId: string,
  amount: number
): Promise<AuctionRoom> {
  const cleanCode = code.toUpperCase().trim();
  const room = getCachedRoom(cleanCode);
  if (!room) throw new Error('Auction room not found');

  const participant = room.participants?.[participantId];
  if (!participant) throw new Error('Participant not registered in this arena');

  if (participant.purse < amount) {
    throw new Error(
      `Insufficient purse balance! You have ${room.currencySymbol}${participant.purse.toFixed(2)} ${room.unitLabel}`
    );
  }

  if (amount <= room.currentBid && room.highestBidder !== null) {
    throw new Error(
      `Bid must be higher than current bid (${room.currencySymbol}${room.currentBid.toFixed(2)} ${room.unitLabel})`
    );
  }

  const bidEvent: PlayerBidEvent = {
    code: cleanCode,
    lotIndex: room.currentLotIndex,
    participantId,
    amount,
    timestamp: Date.now()
  };

  // If this client is Host, process directly
  if (isHost(cleanCode)) {
    handleHostPlayerBid(cleanCode, bidEvent);
    return localRoomCache[cleanCode] || room;
  }

  // 1. Send via local broadcast channel
  const localCh = getLocalChannel(cleanCode);
  localCh?.postMessage({ type: 'PLAYER_BID', payload: bidEvent });

  // 2. Send PLAYER_BID event to Host via Supabase WebSockets
  try {
    const sbChan = getSupabaseChannel(cleanCode);
    sbChan.send({
      type: 'broadcast',
      event: 'PLAYER_BID',
      payload: bidEvent
    }).catch(() => {});
  } catch (e) {}

  return room;
}

/**
 * Set Gavel Countdown Phase (Host Action: Going Once / Going Twice)
 */
export async function setGavelPhase(
  code: string,
  phase: AuctionRoom['gavelPhase'],
  countdown?: number
): Promise<AuctionRoom> {
  const cleanCode = code.toUpperCase().trim();
  registerHost(cleanCode);
  const room = getCachedRoom(cleanCode);
  if (!room) throw new Error('Room not found');

  const updatedRoom: AuctionRoom = {
    ...room,
    gavelPhase: phase,
    gavelCountdown: countdown !== undefined ? countdown : room.gavelCountdown,
    version: (room.version || 0) + 1,
    updatedAt: Date.now()
  };

  await hostBroadcastRoom(cleanCode, updatedRoom);
  return updatedRoom;
}

/**
 * Sell current Lot to the Highest Bidder (Host Action)
 */
export async function sellCurrentLot(code: string): Promise<AuctionRoom> {
  const cleanCode = code.toUpperCase().trim();
  registerHost(cleanCode);
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
    version: (room.version || 0) + 1,
    updatedAt: Date.now()
  };

  await hostBroadcastRoom(cleanCode, updatedRoom);
  return updatedRoom;
}

/**
 * Pass current Lot as Unsold (Host Action)
 */
export async function passCurrentLot(code: string): Promise<AuctionRoom> {
  const cleanCode = code.toUpperCase().trim();
  registerHost(cleanCode);
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
    version: (room.version || 0) + 1,
    updatedAt: Date.now()
  };

  await hostBroadcastRoom(cleanCode, updatedRoom);
  return updatedRoom;
}

/**
 * Navigate to next / previous Lot (Host Action)
 */
export async function navigateLot(code: string, direction: 'next' | 'prev'): Promise<AuctionRoom> {
  const cleanCode = code.toUpperCase().trim();
  registerHost(cleanCode);
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
    highestBidder: targetLot?.soldTo
      ? {
          participantId: targetLot.soldTo.participantId,
          name: targetLot.soldTo.name,
          avatar: targetLot.soldTo.avatar,
          amount: targetLot.soldTo.amount
        }
      : null,
    gavelPhase:
      targetLot?.status === 'sold' ? 'sold' : targetLot?.status === 'unsold' ? 'unsold' : 'idle',
    gavelCountdown: 10,
    bids: [],
    version: (room.version || 0) + 1,
    updatedAt: Date.now()
  };

  await hostBroadcastRoom(cleanCode, updatedRoom);
  return updatedRoom;
}

/**
 * Subscribe to Real-Time Room Updates
 * Powered by Supabase Realtime WebSockets with authoritative host coordination.
 */
export function subscribeRoom(
  code: string,
  onUpdate: (room: AuctionRoom) => void,
  clientRole: 'host' | 'player' = 'player'
): () => void {
  const cleanCode = code.toUpperCase().trim();

  if (clientRole === 'host') {
    registerHost(cleanCode);
  }

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
    const data = ev.data;
    if (!data) return;

    if (data.type === 'ROOM_UPDATE' && data.room?.code === cleanCode) {
      applyIncomingRoomUpdate(cleanCode, data.room);
    } else if (data.type === 'PLAYER_JOIN' && data.payload?.code === cleanCode) {
      if (isHost(cleanCode)) {
        handleHostPlayerJoin(cleanCode, data.payload.participant);
      }
    } else if (data.type === 'PLAYER_BID' && data.payload?.code === cleanCode) {
      if (isHost(cleanCode)) {
        handleHostPlayerBid(cleanCode, data.payload);
      }
    } else if (data.type === 'REQUEST_SYNC' && data.payload?.code === cleanCode) {
      if (isHost(cleanCode)) {
        const current = localRoomCache[cleanCode];
        if (current) {
          hostBroadcastRoom(cleanCode, current);
        }
      }
    }
  };
  localCh?.addEventListener('message', handleLocalMsg);

  // 3. Supabase Realtime WebSocket channel listener
  const sbChan = getSupabaseChannel(cleanCode);

  sbChan
    .on('broadcast', { event: 'ROOM_UPDATE' }, (msg) => {
      if (msg.payload && msg.payload.code === cleanCode) {
        applyIncomingRoomUpdate(cleanCode, msg.payload as AuctionRoom);
      }
    })
    .on('broadcast', { event: 'PLAYER_JOIN' }, (msg) => {
      const payload = msg.payload as PlayerJoinEvent;
      if (payload && payload.code === cleanCode) {
        if (isHost(cleanCode)) {
          handleHostPlayerJoin(cleanCode, payload.participant);
        } else {
          // Update local participant roster display
          const cur = localRoomCache[cleanCode];
          if (cur && payload.participant) {
            const fullP: AuctionParticipant = {
              ...payload.participant,
              purse: cur.initialPurse,
              initialPurse: cur.initialPurse,
              wonLots: []
            };
            const upd: AuctionRoom = {
              ...cur,
              participants: {
                ...(cur.participants || {}),
                [payload.participant.id]: fullP
              }
            };
            notifyListeners(cleanCode, upd);
          }
        }
      }
    })
    .on('broadcast', { event: 'PLAYER_BID' }, (msg) => {
      const payload = msg.payload as PlayerBidEvent;
      if (payload && payload.code === cleanCode && isHost(cleanCode)) {
        handleHostPlayerBid(cleanCode, payload);
      }
    })
    .on('broadcast', { event: 'REQUEST_SYNC' }, () => {
      // ONLY the Host responds to sync requests to eliminate sync storms
      if (isHost(cleanCode)) {
        const current = localRoomCache[cleanCode];
        if (current) {
          hostBroadcastRoom(cleanCode, current);
        }
      }
    });

  // Ensure channel is subscribed and request initial state from host if bidder
  sbChan.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      if (!isHost(cleanCode)) {
        sbChan.send({
          type: 'broadcast',
          event: 'REQUEST_SYNC',
          payload: { code: cleanCode }
        }).catch(() => {});
      }
    }
  });

  return () => {
    localCh?.removeEventListener('message', handleLocalMsg);
    if (subscribers[cleanCode]) {
      subscribers[cleanCode] = subscribers[cleanCode].filter((cb) => cb !== onUpdate);
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
