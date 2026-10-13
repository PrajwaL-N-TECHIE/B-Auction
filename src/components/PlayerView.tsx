import { useState, useEffect, useRef, type FC } from 'react';
import { Gavel, Trophy, ArrowUp, AlertCircle, Sparkles, CheckCircle2, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { AuctionRoom, AuctionParticipant, AuctionLot } from '../types/auction';
import { placeBid } from '../services/auctionSync';
import { sound } from '../utils/soundEffects';
import { AvatarDisplay } from './AvatarDisplay';
import { detectAuctionMode, getModeConfig } from '../constants/auctionModes';

interface PlayerViewProps {
  room: AuctionRoom;
  participant: AuctionParticipant;
  isLight?: boolean;
}

export const PlayerView: FC<PlayerViewProps> = ({ room, participant, isLight = false }) => {
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [customBidAmount, setCustomBidAmount] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'bidding' | 'squad'>('bidding');
  const [celebrationLot, setCelebrationLot] = useState<AuctionLot | null>(null);
  const celebratedLotIds = useRef<Set<string>>(new Set());

  const currentMode = detectAuctionMode(room);
  const modeConfig = getModeConfig(currentMode);

  const currentLot = room.lots[room.currentLotIndex];
  const myParticipant = room.participants[participant.id] || participant;
  const isHighestBidder = room.highestBidder?.participantId === participant.id;
  const currentPrice = room.currentBid;
  const remainingPurse = myParticipant.purse || 0;

  // Sound & alert when someone outbids me
  useEffect(() => {
    if (room.highestBidder && room.highestBidder.participantId !== participant.id) {
      const myPreviousBid = room.bids?.find(b => b.participantId === participant.id);
      if (myPreviousBid) {
        sound.playOutbidAlert();
        sound.triggerHaptic([100, 50, 100]);
      }
    }
  }, [room.highestBidder?.participantId, participant.id]);

  const triggerVictoryConfetti = () => {
    sound.playSoldFanfare();
    sound.triggerHaptic([150, 80, 150, 80, 400]);

    try {
      // Left cannon blast
      confetti({
        particleCount: 80,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.7 },
        colors: ['#a855f7', '#7c3aed', '#facc15', '#ec1c24', '#004ba0', '#10b981']
      });

      // Right cannon blast
      confetti({
        particleCount: 80,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.7 },
        colors: ['#a855f7', '#7c3aed', '#facc15', '#ec1c24', '#004ba0', '#10b981']
      });

      // Secondary fireworks starburst in center
      setTimeout(() => {
        try {
          confetti({
            particleCount: 110,
            spread: 110,
            origin: { y: 0.5 },
            colors: ['#facc15', '#ffd700', '#a855f7', '#ffffff']
          });
        } catch {}
      }, 250);

      // Tertiary fountain burst
      setTimeout(() => {
        try {
          confetti({
            particleCount: 70,
            spread: 120,
            origin: { y: 0.6 }
          });
        } catch {}
      }, 550);
    } catch {}
  };

  // Celebration & confetti blast when a player is sold to this bidder
  useEffect(() => {
    // 1. Direct check on current lot
    const isCurrentSoldToMe =
      (currentLot &&
        currentLot.status === 'sold' &&
        currentLot.soldTo?.participantId === participant.id) ||
      (room.gavelPhase === 'sold' &&
        room.highestBidder?.participantId === participant.id);

    if (isCurrentSoldToMe && currentLot && !celebratedLotIds.current.has(currentLot.id)) {
      celebratedLotIds.current.add(currentLot.id);
      setCelebrationLot(currentLot);
      triggerVictoryConfetti();
    }

    // 2. Check if my wonLots was updated
    const lastWon = myParticipant.wonLots?.[0];
    if (lastWon && !celebratedLotIds.current.has(lastWon.id)) {
      celebratedLotIds.current.add(lastWon.id);
      setCelebrationLot(lastWon);
      triggerVictoryConfetti();
    }

    // 3. Scan all room.lots for any newly marked sold lot to this participant
    room.lots.forEach((lot) => {
      if (lot.status === 'sold' && lot.soldTo?.participantId === participant.id) {
        if (!celebratedLotIds.current.has(lot.id)) {
          celebratedLotIds.current.add(lot.id);
          setCelebrationLot(lot);
          triggerVictoryConfetti();
        }
      }
    });
  }, [
    currentLot?.status,
    currentLot?.soldTo?.participantId,
    currentLot?.id,
    room.gavelPhase,
    room.highestBidder?.participantId,
    room.lots,
    myParticipant.wonLots,
    participant.id
  ]);

  const handleQuickBid = async (increment: number) => {
    if (submitting || isHighestBidder || currentLot?.status !== 'bidding') return;
    setErrorMsg('');

    const targetAmount = Number((currentPrice + increment).toFixed(2));
    if (targetAmount > remainingPurse) {
      setErrorMsg(`Insufficient purse balance! You only have ${room.currencySymbol}${remainingPurse.toFixed(2)} ${room.unitLabel}`);
      return;
    }

    setSubmitting(true);
    sound.playBidChime();
    sound.triggerHaptic([60, 40, 60]);

    try {
      await placeBid(room.code, participant.id, targetAmount);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to place bid');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCustomBid = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(customBidAmount);
    if (isNaN(val) || val <= currentPrice) {
      setErrorMsg(`Bid must be greater than current price (${room.currencySymbol}${currentPrice.toFixed(2)})`);
      return;
    }
    if (val > remainingPurse) {
      setErrorMsg(`Insufficient purse balance! You only have ${room.currencySymbol}${remainingPurse.toFixed(2)} ${room.unitLabel}`);
      return;
    }

    setSubmitting(true);
    sound.playBidChime();
    sound.triggerHaptic([60, 40, 60]);

    try {
      await placeBid(room.code, participant.id, val);
      setCustomBidAmount('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to place bid');
    } finally {
      setSubmitting(false);
    }
  };

  const minInc = room.minIncrement || 0.25;

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-6 flex flex-col items-center justify-between min-h-[calc(100vh-5rem)] select-none">
      {/* Contestant Header */}
      <div className={`w-full p-4 rounded-3xl border backdrop-blur-xl shadow-xl flex items-center justify-between gap-4 transition-colors ${
        isLight ? 'bg-white border-purple-200' : 'bg-[#0F0D1D]/90 border-purple-500/30'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center p-1.5 shrink-0 shadow-inner ${
            isLight ? 'bg-purple-50 border-purple-200' : 'bg-purple-600/20 border-purple-500/40'
          }`}>
            <AvatarDisplay avatar={myParticipant.avatar} name={myParticipant.name} sizeClassName="w-full h-full" />
          </div>
          <div>
            <div className={`text-base font-extrabold font-title truncate max-w-[160px] sm:max-w-[200px] ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              {myParticipant.name}
            </div>
            <div className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
              Room: <span className="text-purple-600 dark:text-purple-300 font-bold">{room.code}</span> • Lot #{room.currentLotIndex + 1}
            </div>
          </div>
        </div>

        {/* Remaining Purse Card */}
        <div className="text-right">
          <div className={`text-[10px] font-mono uppercase font-bold ${
            isLight ? 'text-slate-500' : 'text-zinc-400'
          }`}>
            Your Purse
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            {room.currencySymbol}{remainingPurse.toFixed(2)} <span className="text-xs font-bold">{room.unitLabel}</span>
          </div>
        </div>
      </div>

      {/* Tabs Switcher: Bidding vs My Squad */}
      <div className={`flex items-center p-1 rounded-2xl border my-4 w-full shadow-sm ${
        isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#141224] border-purple-500/20'
      }`}>
        <button
          type="button"
          onClick={() => setActiveTab('bidding')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'bidding'
              ? 'bg-purple-600 text-white shadow-md'
              : isLight ? 'text-slate-600' : 'text-zinc-400'
          }`}
        >
          <Gavel size={14} />
          <span>Active Bidding</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('squad')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'squad'
              ? 'bg-purple-600 text-white shadow-md'
              : isLight ? 'text-slate-600' : 'text-zinc-400'
          }`}
        >
          <Trophy size={14} />
          <span>My {modeConfig.squadLabel} ({myParticipant.wonLots?.length || 0})</span>
        </button>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="w-full mb-3 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs text-center font-bold flex items-center justify-center gap-2">
          <AlertCircle size={15} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* TAB 1: ACTIVE BIDDING */}
      {activeTab === 'bidding' && currentLot && (
        <div className="w-full flex-1 flex flex-col justify-between py-2 space-y-4">
          {/* Current Lot Card */}
          <div className={`p-5 rounded-3xl border shadow-xl relative overflow-hidden transition-colors ${
            isHighestBidder
              ? isLight ? 'bg-purple-50 border-purple-400 shadow-purple-200/50' : 'bg-[#151229] border-purple-500/60 shadow-[0_0_40px_rgba(168,85,247,0.25)]'
              : isLight ? 'bg-white border-purple-200' : 'bg-[#0C0C14]/90 border-purple-500/30'
          }`}>
            <div className="flex items-center gap-3.5 mb-3">
              {/* Player Headshot Photo */}
              <div className="relative shrink-0">
                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 shadow-md flex items-center justify-center ${
                  isLight ? 'bg-slate-100 border-purple-200' : 'bg-[#141224] border-purple-500/40'
                }`}>
                  {currentLot.imageUrl ? (
                    <img
                      src={currentLot.imageUrl}
                      alt={currentLot.title}
                      className="w-full h-full object-cover object-top"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="text-2xl">{modeConfig.fallbackEmoji}</span>
                  )}
                </div>
                {currentLot.rating && (
                  <div className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-md bg-purple-600 text-white text-[9px] font-mono font-black border border-purple-400 shadow">
                    ★{currentLot.rating}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className={`text-[10px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border truncate ${
                    isLight ? 'bg-purple-100 border-purple-200 text-purple-700' : 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                  }`}>
                    {currentLot.category}
                  </span>
                  <span className={`text-[10px] font-mono shrink-0 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                    Base: {room.currencySymbol}{currentLot.basePrice.toFixed(2)} {room.unitLabel}
                  </span>
                </div>

                <h3 className={`text-lg sm:text-xl font-black font-title tracking-tight truncate ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}>
                  {currentLot.title}
                </h3>
              </div>
            </div>

            {/* Current Price Ticker */}
            <div className="mt-4 p-4 rounded-2xl bg-[#141224]/80 border border-purple-500/30 text-center">
              <div className={`text-[10px] font-mono uppercase tracking-widest font-bold ${
                isHighestBidder ? 'text-amber-400' : isLight ? 'text-purple-700' : 'text-purple-300'
              }`}>
                Current Highest Bid
              </div>
              <div className="text-3xl sm:text-4xl font-black font-mono text-amber-500 dark:text-amber-400 mt-1">
                {room.currencySymbol}{currentPrice.toFixed(2)} <span className="text-xl">{room.unitLabel}</span>
              </div>
              {room.highestBidder && (
                <div className="flex items-center justify-center gap-2 mt-1.5">
                  <AvatarDisplay avatar={room.highestBidder.avatar} name={room.highestBidder.name} sizeClassName="w-5 h-5" />
                  <span className="text-xs text-zinc-300 font-bold truncate max-w-[180px]">
                    {room.highestBidder.name}
                  </span>
                </div>
              )}
            </div>

            {/* Highest Bidder Feedback Banner */}
            {isHighestBidder ? (
              <div className="mt-3 p-2.5 rounded-xl bg-amber-400/20 border border-amber-400/50 text-amber-600 dark:text-amber-300 text-xs font-bold text-center flex items-center justify-center gap-1.5 animate-pulse">
                <Trophy size={14} />
                <span>YOU HOLD THE HIGHEST BID! 👑</span>
              </div>
            ) : room.highestBidder ? (
              <div className="mt-3 p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-300 text-xs text-center">
                Tap below to raise your bid!
              </div>
            ) : null}
          </div>

          {/* Quick Bid Buttons (Solid Purple & High Contrast) */}
          <div className="space-y-3">
            <div className={`text-[11px] font-mono font-bold uppercase tracking-wider text-center ${
              isLight ? 'text-purple-700' : 'text-purple-300'
            }`}>
              One-Tap Bid Escalations:
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => handleQuickBid(minInc)}
                disabled={submitting || isHighestBidder || currentLot.status !== 'bidding' || (currentPrice + minInc) > remainingPurse}
                className="py-3 px-2 rounded-2xl bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-mono font-black text-xs sm:text-sm flex flex-col items-center justify-center gap-0.5 shadow-lg shadow-purple-600/30 transition-all cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-1">
                  <ArrowUp size={14} />
                  <span>+{room.currencySymbol}{minInc}</span>
                </div>
                <span className="text-[10px] opacity-80">{room.currencySymbol}{(currentPrice + minInc).toFixed(2)}</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickBid(minInc * 2)}
                disabled={submitting || isHighestBidder || currentLot.status !== 'bidding' || (currentPrice + minInc * 2) > remainingPurse}
                className="py-3 px-2 rounded-2xl bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-mono font-black text-xs sm:text-sm flex flex-col items-center justify-center gap-0.5 shadow-lg shadow-purple-600/30 transition-all cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-1">
                  <ArrowUp size={14} />
                  <span>+{room.currencySymbol}{(minInc * 2).toFixed(2)}</span>
                </div>
                <span className="text-[10px] opacity-80">{room.currencySymbol}{(currentPrice + minInc * 2).toFixed(2)}</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickBid(minInc * 4)}
                disabled={submitting || isHighestBidder || currentLot.status !== 'bidding' || (currentPrice + minInc * 4) > remainingPurse}
                className="py-3 px-2 rounded-2xl bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-mono font-black text-xs sm:text-sm flex flex-col items-center justify-center gap-0.5 shadow-lg shadow-purple-600/30 transition-all cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-1">
                  <ArrowUp size={14} />
                  <span>+{room.currencySymbol}{(minInc * 4).toFixed(2)}</span>
                </div>
                <span className="text-[10px] opacity-80">{room.currencySymbol}{(currentPrice + minInc * 4).toFixed(2)}</span>
              </button>
            </div>

            {/* Custom Bid Input */}
            <form onSubmit={handleCustomBid} className="flex items-center gap-2 mt-2">
              <input
                type="number"
                step="any"
                min={currentPrice + 0.01}
                max={remainingPurse}
                value={customBidAmount}
                onChange={(e) => setCustomBidAmount(e.target.value)}
                placeholder={`Enter custom bid (> ${currentPrice})...`}
                className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-mono font-bold transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  isLight
                    ? 'bg-slate-50 border-purple-200 text-slate-900 placeholder-slate-400'
                    : 'bg-[#141224] border-purple-500/40 text-white placeholder-zinc-500'
                }`}
              />
              <button
                type="submit"
                disabled={submitting || isHighestBidder || !customBidAmount || currentLot.status !== 'bidding'}
                className="py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-bold text-xs shadow-md cursor-pointer transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Bid
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: MY SQUAD */}
      {activeTab === 'squad' && (
        <div className="w-full flex-1 flex flex-col py-2">
          {myParticipant.wonLots && myParticipant.wonLots.length > 0 ? (
            <div className={`p-4 rounded-3xl border shadow-xl ${
              isLight ? 'bg-white border-purple-200' : 'bg-[#0C0C14]/90 border-purple-500/30'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-purple-500/10 mb-3">
                <span className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Your Acquired Squad ({myParticipant.wonLots.length})
                </span>
                <span className="text-xs font-mono text-purple-500 font-bold">
                  Remaining Purse: {room.currencySymbol}{remainingPurse.toFixed(2)} {room.unitLabel}
                </span>
              </div>

              <div className="space-y-2">
                {myParticipant.wonLots.map((lot, idx) => (
                  <div key={lot.id || idx} className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-purple-500/30 bg-purple-950/20 shrink-0 flex items-center justify-center">
                        {lot.imageUrl ? (
                          <img src={lot.imageUrl} alt={lot.title} className="w-full h-full object-cover object-top" />
                        ) : (
                          <span className="text-base">🏏</span>
                        )}
                      </div>
                      <div>
                        <div className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {lot.title}
                        </div>
                        <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                          {lot.category}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                        {room.currencySymbol}{lot.soldTo?.amount.toFixed(2)} {room.unitLabel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={`p-10 text-center rounded-3xl border my-auto ${
              isLight ? 'bg-white border-purple-200 text-slate-500' : 'bg-[#0C0C14]/80 border-purple-500/20 text-zinc-500'
            }`}>
              <Sparkles size={28} className="text-purple-500 mx-auto mb-2" />
              <p className="text-xs font-bold">You haven't won any lots yet.</p>
              <p className="text-[11px] mt-1">Raise your bids on the current lot to sign stars to your team!</p>
            </div>
          )}
        </div>
      )}

      {/* VICTORY CELEBRATION MODAL WHEN BIDDER WINS LOT */}
      {celebrationLot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
          <div className="relative w-full max-w-sm rounded-3xl p-6 sm:p-8 border-2 border-amber-400 bg-gradient-to-b from-[#181028] via-[#0E0B1A] to-[#080612] text-white text-center shadow-[0_0_80px_rgba(250,204,21,0.4)] space-y-4">
            {/* Pulsing Trophy Badge */}
            <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-400/20 border-2 border-amber-400/60 flex items-center justify-center shadow-[0_0_30px_rgba(250,204,21,0.5)] animate-bounce">
              <Trophy size={34} className="text-amber-400" />
            </div>

            <div className="space-y-1">
              <div className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-black">
                ★ Hammer Down! Signed to Your Team ★
              </div>
              <h2 className="text-2xl sm:text-3xl font-black font-title tracking-tight text-white">
                YOU WON THE LOT!
              </h2>
            </div>

            {/* Player Spotlight Card */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3.5 text-left">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-400 shrink-0 bg-purple-950/40">
                {celebrationLot.imageUrl ? (
                  <img
                    src={celebrationLot.imageUrl}
                    alt={celebrationLot.title}
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <span className="text-3xl flex items-center justify-center h-full">🏏</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-base font-black text-white truncate">
                  {celebrationLot.title}
                </div>
                <div className="text-[11px] text-zinc-400 truncate">
                  {celebrationLot.category}
                </div>
                <div className="text-sm font-black font-mono text-amber-400 mt-1">
                  Sold for: {room.currencySymbol}{celebrationLot.soldTo?.amount.toFixed(2)} {room.unitLabel}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between text-xs">
              <span className="text-zinc-400">Remaining Purse:</span>
              <span className="font-mono font-black text-emerald-400 text-sm">
                {room.currencySymbol}{remainingPurse.toFixed(2)} {room.unitLabel}
              </span>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setCelebrationLot(null);
                  setActiveTab('squad');
                }}
                className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-purple-600/30 cursor-pointer active:scale-95"
              >
                View in My {modeConfig.squadLabel} ({myParticipant.wonLots?.length || 1}) ➔
              </button>
              <button
                type="button"
                onClick={() => setCelebrationLot(null)}
                className="w-full py-2 px-4 rounded-xl text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Continue Bidding
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className={`w-full text-center text-xs py-2 border-t flex items-center justify-center gap-2 ${
        isLight ? 'text-slate-400 border-slate-200' : 'text-zinc-500 border-purple-500/10'
      }`}>
        <span className={`font-bold ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>Buildicy B-Auction</span>
        <span>•</span>
        <span className="text-purple-500 font-mono">auction.buildicy.com</span>
      </div>
    </div>
  );
};
