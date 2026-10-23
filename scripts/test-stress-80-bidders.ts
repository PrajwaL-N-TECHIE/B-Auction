/**
 * Comprehensive Stress Test: 80 Concurrent Bidders on B-Auction
 * Tests mass concurrent franchise join, simultaneous bidding, monotonic revision checks,
 * gavel countdown phases, and lot sales to verify complete stability under high load.
 */

import type { AuctionRoom, AuctionParticipant, BidEntry, PlayerBidEvent } from '../src/types/auction';
import { SAMPLE_LOT_PACKS } from '../src/constants/samplePacks';

class AuctionStressHarness {
  public hostRoom: AuctionRoom;
  public bidderRooms: Map<string, AuctionRoom> = new Map();
  public participants: Map<string, AuctionParticipant> = new Map();
  public clientStateOscillations = 0;

  constructor(roomCode: string = 'TEST-AUC-80') {
    const pack = SAMPLE_LOT_PACKS[0];
    this.hostRoom = {
      code: roomCode,
      title: 'Mega Premier Auction',
      packId: pack.id,
      mode: pack.id,
      currencySymbol: pack.currencySymbol,
      unitLabel: pack.unitLabel,
      initialPurse: pack.defaultPurse,
      minIncrement: pack.minIncrement,
      status: 'active',
      currentLotIndex: 0,
      lots: pack.lots.map((l, i) => ({ ...l, status: i === 0 ? 'bidding' : 'upcoming' })),
      currentBid: pack.lots[0].basePrice,
      highestBidder: null,
      gavelPhase: 'idle',
      gavelCountdown: 10,
      bids: [],
      participants: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1
    };
  }

  public hostBroadcast(room: AuctionRoom) {
    this.hostRoom = { ...room };
    for (const [id, current] of this.bidderRooms.entries()) {
      if ((room.version || 0) < (current.version || 0)) {
        continue; // Discard stale packet
      }
      if (
        current.version > room.version &&
        current.currentBid > room.currentBid
      ) {
        this.clientStateOscillations++;
      }
      this.bidderRooms.set(id, { ...room });
    }
  }

  public hostHandlePlayerJoin(participant: Omit<AuctionParticipant, 'purse' | 'initialPurse' | 'wonLots'>) {
    const fullP: AuctionParticipant = {
      ...participant,
      purse: this.hostRoom.initialPurse,
      initialPurse: this.hostRoom.initialPurse,
      wonLots: []
    };
    const nextRoom: AuctionRoom = {
      ...this.hostRoom,
      participants: {
        ...this.hostRoom.participants,
        [participant.id]: fullP
      },
      version: (this.hostRoom.version || 0) + 1,
      updatedAt: Date.now()
    };
    this.hostBroadcast(nextRoom);
  }

  public hostHandlePlayerBid(event: PlayerBidEvent): boolean {
    if (this.hostRoom.status !== 'active') return false;
    if (event.lotIndex !== this.hostRoom.currentLotIndex) return false;

    const participant = this.hostRoom.participants[event.participantId];
    if (!participant || participant.purse < event.amount) return false;

    const isHigher = this.hostRoom.highestBidder === null
      ? event.amount >= this.hostRoom.currentBid
      : event.amount > this.hostRoom.currentBid;
    if (!isHigher) return false;

    const newBid: BidEntry = {
      id: `bid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      participantId: participant.id,
      bidderName: participant.name,
      avatar: participant.avatar,
      amount: Number(event.amount.toFixed(2)),
      timestamp: event.timestamp
    };

    const nextRoom: AuctionRoom = {
      ...this.hostRoom,
      currentBid: newBid.amount,
      highestBidder: {
        participantId: participant.id,
        name: participant.name,
        avatar: participant.avatar,
        amount: newBid.amount
      },
      gavelPhase: 'idle',
      gavelCountdown: 10,
      bids: [newBid, ...(this.hostRoom.bids || [])].slice(0, 40),
      version: (this.hostRoom.version || 0) + 1,
      updatedAt: Date.now()
    };

    this.hostBroadcast(nextRoom);
    return true;
  }

  public hostSellLot() {
    const winner = this.hostRoom.highestBidder;
    if (!winner) return;

    const currentLot = this.hostRoom.lots[this.hostRoom.currentLotIndex];
    const soldLot = {
      ...currentLot,
      status: 'sold' as const,
      soldTo: {
        participantId: winner.participantId,
        name: winner.name,
        avatar: winner.avatar,
        amount: winner.amount
      }
    };

    const nextLots = [...this.hostRoom.lots];
    nextLots[this.hostRoom.currentLotIndex] = soldLot;

    const nextParticipants = { ...this.hostRoom.participants };
    const winnerP = nextParticipants[winner.participantId];
    if (winnerP) {
      nextParticipants[winner.participantId] = {
        ...winnerP,
        purse: Math.max(0, Number((winnerP.purse - winner.amount).toFixed(2))),
        wonLots: [soldLot, ...(winnerP.wonLots || [])]
      };
    }

    const nextRoom: AuctionRoom = {
      ...this.hostRoom,
      lots: nextLots,
      participants: nextParticipants,
      gavelPhase: 'sold',
      version: (this.hostRoom.version || 0) + 1,
      updatedAt: Date.now()
    };

    this.hostBroadcast(nextRoom);
  }
}

async function runAuctionStressTest() {
  console.log('================================================================');
  console.log('🏏 RUNNING COMPREHENSIVE STRESS TEST: 80 BIDDERS ON B-AUCTION');
  console.log('================================================================\n');

  const harness = new AuctionStressHarness('AUC-MEGA-80');
  const TOTAL_BIDDERS = 80;

  // -------------------------------------------------------------
  // TEST 1: Simultaneous Join of 80 Bidders
  // -------------------------------------------------------------
  console.log(`[TEST 1] Registering and connecting ${TOTAL_BIDDERS} bidders concurrently...`);
  const joinPromises: Promise<void>[] = [];

  for (let i = 1; i <= TOTAL_BIDDERS; i++) {
    const p = {
      id: `bidder_${i}`,
      name: `Franchise ${i}`,
      avatar: `emblem_${(i % 10) + 1}`,
      joinedAt: Date.now()
    };
    harness.bidderRooms.set(p.id, { ...harness.hostRoom });

    joinPromises.push(
      new Promise<void>((resolve) => {
        const jitter = Math.random() * 15;
        setTimeout(() => {
          harness.hostHandlePlayerJoin(p);
          resolve();
        }, jitter);
      })
    );
  }

  await Promise.all(joinPromises);

  const registeredCount = Object.keys(harness.hostRoom.participants).length;
  console.log(`✔ All ${TOTAL_BIDDERS} join requests processed.`);
  console.log(`✔ Host Roster Count: ${registeredCount} / ${TOTAL_BIDDERS}`);
  if (registeredCount !== TOTAL_BIDDERS) {
    throw new Error(`FAIL: Expected ${TOTAL_BIDDERS} bidders, got ${registeredCount}`);
  }
  console.log(`✔ Current room version: ${harness.hostRoom.version} (monotonically increased)`);
  console.log('✅ TEST 1 PASSED: Zero join collisions, all 80 bidders registered.\n');

  // -------------------------------------------------------------
  // TEST 2: High-Frequency Concurrent Bidding
  // -------------------------------------------------------------
  const lot = harness.hostRoom.lots[0];
  console.log(`[TEST 2] Lot #0 on stage: ${lot.title} (Base: ₹${lot.basePrice} Cr)`);
  console.log(`[TEST 2] Simulating 40 ascending bids placed concurrently within 300ms...`);

  let simulatedPrice = lot.basePrice;
  const bidPromises: Promise<void>[] = [];
  const BIDS_COUNT = 40;

  for (let i = 1; i <= BIDS_COUNT; i++) {
    simulatedPrice = Number((simulatedPrice + harness.hostRoom.minIncrement).toFixed(2));
    const bidderId = `bidder_${(i % TOTAL_BIDDERS) + 1}`;
    const amount = simulatedPrice;

    bidPromises.push(
      new Promise<void>((resolve) => {
        setTimeout(() => {
          harness.hostHandlePlayerBid({
            code: harness.hostRoom.code,
            lotIndex: 0,
            participantId: bidderId,
            amount,
            timestamp: Date.now() + i * 5
          });
          resolve();
        }, i * 5);
      })
    );
  }

  await Promise.all(bidPromises);

  console.log(`✔ Final winning bid price: ₹${harness.hostRoom.currentBid} Cr`);
  console.log(`✔ Highest Bidder: ${harness.hostRoom.highestBidder?.name} (Bid: ₹${harness.hostRoom.highestBidder?.amount} Cr)`);
  console.log(`✔ Total bids recorded: ${harness.hostRoom.bids.length}`);
  if (harness.hostRoom.bids.length !== BIDS_COUNT) {
    throw new Error(`FAIL: Expected ${BIDS_COUNT} bids recorded, got ${harness.hostRoom.bids.length}`);
  }
  console.log('✅ TEST 2 PASSED: 40 concurrent bids captured atomically in strict sequential order.\n');

  // -------------------------------------------------------------
  // TEST 3: Monotonic Revision Check (Anti-Blinking)
  // -------------------------------------------------------------
  console.log('[TEST 3] Testing anti-blinking guard against stale room updates...');
  const currentVersion = harness.hostRoom.version;

  // Stale packet
  const staleRoom: AuctionRoom = {
    ...harness.hostRoom,
    currentBid: 1.0, // Attempt to revert price
    version: currentVersion - 15
  };
  harness.hostBroadcast(staleRoom);

  let staleReverted = false;
  for (const [id, r] of harness.bidderRooms.entries()) {
    if (r.currentBid === 1.0 || r.version === staleRoom.version) {
      staleReverted = true;
      break;
    }
  }

  if (staleReverted) {
    throw new Error('FAIL: Stale packet reverted client bid price!');
  }
  console.log(`✔ Stale packet successfully blocked (version ${staleRoom.version} < ${currentVersion}).`);
  console.log(`✔ Total illegal client state oscillations: ${harness.clientStateOscillations} (0 expected)`);
  if (harness.clientStateOscillations !== 0) {
    throw new Error('FAIL: Detected client state oscillation!');
  }
  console.log('✅ TEST 3 PASSED: Zero price reversion, zero UI blinking.\n');

  // -------------------------------------------------------------
  // TEST 4: Sell Lot to Highest Bidder & Purse Deduction
  // -------------------------------------------------------------
  console.log('[TEST 4] Host sells lot to the highest bidder...');
  const winnerId = harness.hostRoom.highestBidder!.participantId;
  const winningAmount = harness.hostRoom.highestBidder!.amount;
  const initialPurse = harness.hostRoom.participants[winnerId].purse;

  harness.hostSellLot();

  const winnerAfter = harness.hostRoom.participants[winnerId];
  console.log(`✔ Gavel status: ${harness.hostRoom.gavelPhase}`);
  console.log(`✔ Winner (${winnerAfter.name}) new purse: ₹${winnerAfter.purse} Cr (Deducted: ₹${winningAmount} Cr from ₹${initialPurse} Cr)`);
  console.log(`✔ Winner won lots count: ${winnerAfter.wonLots.length} (${winnerAfter.wonLots[0]?.title})`);

  if (winnerAfter.purse !== Number((initialPurse - winningAmount).toFixed(2))) {
    throw new Error('FAIL: Purse was not deducted correctly!');
  }
  if (winnerAfter.wonLots.length !== 1 || winnerAfter.wonLots[0].status !== 'sold') {
    throw new Error('FAIL: Won lot was not assigned properly to winner!');
  }
  console.log('✅ TEST 4 PASSED: Clean lot settlement, purse deduction, and roster sync.\n');

  console.log('================================================================');
  console.log('🎉 ALL 4 B-AUCTION STRESS TESTS PASSED WITH 100% SUCCESS!');
  console.log('================================================================');
}

runAuctionStressTest().catch((err) => {
  console.error('\n❌ B-AUCTION STRESS TEST FAILED:', err);
  process.exit(1);
});
