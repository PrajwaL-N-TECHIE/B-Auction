import { useState, useEffect, type FC } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Gavel, Maximize2, Users, QrCode, Copy, Check, XCircle,
  ChevronLeft, ChevronRight, Award, History, ListOrdered, CheckCircle2, RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { AuctionRoom } from '../types/auction';
import {
  setGavelPhase, sellCurrentLot, passCurrentLot, navigateLot
} from '../services/auctionSync';
import { sound } from '../utils/soundEffects';
import { ProjectorModal } from './ProjectorModal';
import { AvatarDisplay } from './AvatarDisplay';
import { detectAuctionMode, getModeConfig } from '../constants/auctionModes';

interface HostViewProps {
  room: AuctionRoom;
  onLeaveRoom: () => void;
  isLight?: boolean;
}

export const HostView: FC<HostViewProps> = ({ room, isLight = false }) => {
  const [isProjectorOpen, setIsProjectorOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'bids' | 'teams' | 'catalog'>('bids');

  const currentMode = detectAuctionMode(room);
  const modeConfig = getModeConfig(currentMode);
  const currentLot = room.lots[room.currentLotIndex];
  const participantsList = Object.values(room.participants || {});
  const highestBidder = room.highestBidder;

  // Keyboard Shortcuts (Space: Hammer/Sold, G: Gavel countdown, N: Next lot, P: Prev lot)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleSellLot();
      } else if (e.key === 'g' || e.key === 'G') {
        handleTriggerGavel();
      } else if (e.key === 'n' || e.key === 'N') {
        handleNextLot();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [room.code, currentLot?.id, room.highestBidder]);

  const handleTriggerGavel = async () => {
    sound.playCountdownTick(true);
    const nextPhase = room.gavelPhase === 'going_once' ? 'going_twice' : 'going_once';
    await setGavelPhase(room.code, nextPhase);
  };

  const handleSellLot = async () => {
    sound.playGavelStrike();
    sound.playSoldFanfare();
    try {
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#a855f7', '#7c3aed', '#facc15', '#3b82f6', '#10b981']
      });
    } catch {}
    await sellCurrentLot(room.code);
  };

  const handlePassLot = async () => {
    sound.playGavelStrike();
    await passCurrentLot(room.code);
  };

  const handleNextLot = async () => {
    await navigateLot(room.code, 'next');
  };

  const handlePrevLot = async () => {
    await navigateLot(room.code, 'prev');
  };

  const getJoinUrl = () => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const port = window.location.port ? `:${window.location.port}` : '';
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `http://192.168.1.6${port}/?room=${room.code}`;
      }
      return `${window.location.origin}/?room=${room.code}`;
    }
    return `https://auction.buildicy.com/?room=${room.code}`;
  };

  const handleCopyLink = () => {
    const url = getJoinUrl();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Bar: Room Info & Quick Controls */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl border backdrop-blur-xl shadow-xl transition-colors ${
        isLight
          ? 'bg-white border-purple-200'
          : 'bg-[#0C0C14]/90 border-purple-500/30'
      }`}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center p-2.5 shrink-0 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
            <Gavel size={24} className="text-purple-500" />
          </div>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className={`text-lg sm:text-xl font-black font-title ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                {room.title}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-bold ${
                isLight
                  ? 'bg-purple-100 text-purple-700 border-purple-200'
                  : 'bg-purple-500/15 border-purple-500/30 text-purple-300'
              }`}>
                Lot #{room.currentLotIndex + 1} of {room.lots.length}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold flex items-center gap-1.5 ${
                currentLot?.status === 'sold'
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/40'
                  : currentLot?.status === 'unsold'
                  ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/40'
                  : 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  currentLot?.status === 'sold' ? 'bg-emerald-500' : currentLot?.status === 'unsold' ? 'bg-rose-500' : 'bg-amber-500 animate-ping'
                }`} />
                {currentLot?.status === 'sold' ? 'SOLD 🔨' : currentLot?.status === 'unsold' ? 'UNSOLD' : 'BIDDING OPEN'}
              </span>
            </div>

            <div className={`flex items-center gap-2 mt-1 text-xs ${
              isLight ? 'text-slate-500' : 'text-zinc-400'
            }`}>
              <span>Code:</span>
              <button
                onClick={handleCopyLink}
                className={`font-mono font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer border ${
                  isLight
                    ? 'bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-200'
                    : 'bg-purple-950/60 hover:bg-purple-900 text-white border-purple-500/40'
                }`}
                title="Click to copy join link"
              >
                <span>{room.code}</span>
                {copiedLink ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
              </button>
              <span>•</span>
              <span className="flex items-center gap-1 text-purple-600 dark:text-purple-300 font-semibold">
                <Users size={13} /> {participantsList.length} Connected Teams
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Stage Mode, Share QR (Solid Purple Buttons) */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={() => setIsShareModalOpen(true)}
            className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
              isLight
                ? 'bg-slate-100 hover:bg-purple-50 border-slate-200 text-slate-700 hover:text-purple-700'
                : 'bg-[#161426] hover:bg-purple-950/60 border-purple-500/30 text-purple-200'
            }`}
          >
            <QrCode size={15} />
            <span>Join QR Code</span>
          </button>

          <button
            onClick={() => setIsProjectorOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-purple-600/30 cursor-pointer active:scale-95"
          >
            <Maximize2 size={15} />
            <span>Stage Mode</span>
          </button>
        </div>
      </div>

      {/* Main Lot On The Block Display */}
      {currentLot && (
        <div className={`p-6 sm:p-8 rounded-3xl border-2 shadow-xl transition-colors relative overflow-hidden ${
          currentLot.status === 'sold'
            ? isLight ? 'bg-emerald-50/90 border-emerald-300' : 'bg-emerald-950/20 border-emerald-500/40'
            : currentLot.status === 'unsold'
            ? isLight ? 'bg-rose-50/90 border-rose-300' : 'bg-rose-950/20 border-rose-500/40'
            : isLight ? 'bg-white border-purple-200 shadow-purple-100' : 'bg-[#0C0C14]/90 border-purple-500/40'
        }`}>
          {/* Navigation Controls */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevLot}
              disabled={room.currentLotIndex === 0}
              className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                isLight ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200' : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
              }`}
            >
              <ChevronLeft size={16} />
              <span>Prev Lot</span>
            </button>

            <span className={`text-xs font-mono font-bold uppercase tracking-wider ${
              isLight ? 'text-purple-700' : 'text-purple-300'
            }`}>
              {currentLot.category}
            </span>

            <button
              onClick={handleNextLot}
              disabled={room.currentLotIndex === room.lots.length - 1}
              className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                isLight ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200' : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
              }`}
            >
              <span>Next Lot</span>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Lot Header & Live Price */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-purple-500/10">
            <div className="flex items-start sm:items-center gap-4 sm:gap-6">
              {/* Player Photo Card */}
              <div className="relative shrink-0">
                <div className={`w-28 h-28 sm:w-36 sm:h-36 rounded-3xl overflow-hidden border-2 shadow-xl flex items-center justify-center ${
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
                    <div className="text-4xl">{modeConfig.fallbackEmoji}</div>
                  )}
                </div>
                {currentLot.rating && (
                  <div className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-xl bg-purple-600 text-white text-[11px] font-mono font-black border border-purple-400 shadow-md">
                    ★ {currentLot.rating}
                  </div>
                )}
              </div>

              <div>
                <h3 className={`text-2xl sm:text-4xl font-black font-title tracking-tight ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}>
                  {currentLot.title}
                </h3>
                {currentLot.description && (
                  <p className={`text-xs sm:text-sm mt-1 max-w-xl ${
                    isLight ? 'text-slate-600' : 'text-zinc-400'
                  }`}>
                    {currentLot.description}
                  </p>
                )}

                {/* Stats pills */}
                {currentLot.stats && (
                  <div className="flex items-center gap-2 flex-wrap mt-3">
                    {currentLot.stats.map((st, i) => (
                      <span key={i} className={`text-xs font-mono px-2.5 py-1 rounded-lg border ${
                        isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-white/5 border-white/10 text-zinc-300'
                      }`}>
                        <strong className="text-purple-600 dark:text-purple-300">{st.label}:</strong> {st.value}
                      </span>
                    ))}
                    <span className={`text-xs font-mono px-2.5 py-1 rounded-lg border ${
                      isLight ? 'bg-purple-50 border-purple-200 text-purple-700 font-bold' : 'bg-purple-950/40 border-purple-500/30 text-purple-300 font-bold'
                    }`}>
                      Base: {room.currencySymbol}{currentLot.basePrice.toFixed(2)} {room.unitLabel}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Current Price Ticker Box */}
            <div className={`p-4 sm:p-5 rounded-2xl border text-right min-w-[220px] ${
              currentLot.status === 'sold'
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-purple-500/10 border-purple-500/30'
            }`}>
              <div className={`text-[10px] font-mono uppercase tracking-widest font-bold ${
                isLight ? 'text-purple-700' : 'text-purple-300'
              }`}>
                {currentLot.status === 'sold' ? 'Sold Amount' : 'Current Highest Bid'}
              </div>
              <div className="text-3xl sm:text-4xl font-black font-mono text-amber-500 dark:text-amber-400 mt-0.5">
                {room.currencySymbol}{room.currentBid.toFixed(2)} <span className="text-xl">{room.unitLabel}</span>
              </div>
              {highestBidder ? (
                <div className="flex items-center justify-end gap-2 mt-2">
                  <AvatarDisplay avatar={highestBidder.avatar} name={highestBidder.name} sizeClassName="w-6 h-6" />
                  <span className={`text-xs font-bold truncate max-w-[140px] ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}>
                    {highestBidder.name}
                  </span>
                </div>
              ) : (
                <div className={`text-xs mt-1 ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>
                  No bids yet (Base Price)
                </div>
              )}
            </div>
          </div>

          {/* Host Auctioneer Command Center Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6">
            {/* Gavel Countdown Call */}
            <button
              onClick={handleTriggerGavel}
              disabled={currentLot.status !== 'bidding'}
              className={`py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                room.gavelPhase === 'going_once'
                  ? 'bg-amber-600 text-white border-amber-400 animate-pulse'
                  : room.gavelPhase === 'going_twice'
                  ? 'bg-orange-600 text-white border-orange-400 animate-bounce'
                  : isLight
                  ? 'bg-slate-100 hover:bg-amber-50 text-slate-800 border-slate-200 hover:border-amber-300'
                  : 'bg-[#141224] hover:bg-amber-950/40 text-amber-200 border-purple-500/30'
              }`}
            >
              <Gavel size={17} />
              <span>
                {room.gavelPhase === 'going_once'
                  ? 'Going Twice... (Call G)'
                  : room.gavelPhase === 'going_twice'
                  ? 'Last Call! ⚡'
                  : 'Call: Going Once (G)'}
              </span>
            </button>

            {/* SOLD HAMMER DOWN BUTTON */}
            <button
              onClick={handleSellLot}
              disabled={!highestBidder || currentLot.status === 'sold'}
              className={`py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 border transition-all cursor-pointer shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                currentLot.status === 'sold'
                  ? 'bg-emerald-950/20 text-emerald-500/50 border-emerald-500/20'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-emerald-600/30'
              }`}
            >
              <CheckCircle2 size={18} />
              <span>SOLD! 🔨 (Spacebar)</span>
            </button>

            {/* PASS / UNSOLD BUTTON */}
            <button
              onClick={handlePassLot}
              disabled={currentLot.status === 'sold'}
              className={`py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                isLight
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                  : 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border-rose-500/30'
              }`}
            >
              <XCircle size={17} />
              <span>Pass / Unsold</span>
            </button>
          </div>
        </div>
      )}

      {/* Tabs Switcher: Live Bids Log vs Connected Teams & Purses vs Catalog */}
      <div className={`flex items-center gap-2 border-b pb-2 ${
        isLight ? 'border-slate-200' : 'border-purple-500/20'
      }`}>
        <button
          onClick={() => setActiveTab('bids')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'bids'
              ? 'bg-purple-600 text-white shadow-md'
              : isLight
              ? 'text-slate-600 hover:text-slate-900 bg-slate-100'
              : 'text-zinc-400 hover:text-white bg-white/5'
          }`}
        >
          <History size={14} />
          <span>Live Bids Feed ({room.bids?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('teams')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'teams'
              ? 'bg-purple-600 text-white shadow-md'
              : isLight
              ? 'text-slate-600 hover:text-slate-900 bg-slate-100'
              : 'text-zinc-400 hover:text-white bg-white/5'
          }`}
        >
          <Award size={14} />
          <span>Teams & Purse Tracker ({participantsList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'catalog'
              ? 'bg-purple-600 text-white shadow-md'
              : isLight
              ? 'text-slate-600 hover:text-slate-900 bg-slate-100'
              : 'text-zinc-400 hover:text-white bg-white/5'
          }`}
        >
          <ListOrdered size={14} />
          <span>All Lots ({room.lots.length})</span>
        </button>
      </div>

      {/* TAB CONTENT: BIDS FEED */}
      {activeTab === 'bids' && (
        <div className={`rounded-3xl border overflow-hidden shadow-xl ${
          isLight ? 'bg-white border-purple-200' : 'bg-[#0C0C14]/80 border-purple-500/20'
        }`}>
          <div className={`p-4 border-b flex items-center justify-between ${
            isLight ? 'border-purple-100 bg-purple-50/50' : 'border-purple-500/20'
          }`}>
            <span className={`text-xs font-mono uppercase tracking-wider font-bold ${
              isLight ? 'text-purple-800' : 'text-purple-300'
            }`}>
              Recent Real-Time Bid Escalations
            </span>
            <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
              Sub-50ms Supabase Realtime
            </span>
          </div>

          {room.bids && room.bids.length > 0 ? (
            <div className={isLight ? 'divide-y divide-slate-100' : 'divide-y divide-white/5'}>
              {room.bids.map((bid, idx) => (
                <div key={bid.id || idx} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${
                      idx === 0
                        ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40'
                        : isLight
                        ? 'bg-slate-100 text-slate-600 border border-slate-200'
                        : 'bg-white/5 text-zinc-400 border border-white/10'
                    }`}>
                      #{idx + 1}
                    </span>
                    <AvatarDisplay avatar={bid.avatar} name={bid.bidderName} sizeClassName="w-8 h-8" />
                    <div>
                      <div className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {bid.bidderName}
                      </div>
                      <div className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                        {new Date(bid.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-black text-base text-amber-500 dark:text-amber-400">
                      {room.currencySymbol}{bid.amount.toFixed(2)} {room.unitLabel}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`p-12 text-center text-xs ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
              No bids placed on this lot yet. Connected bidders can tap buttons to open bidding!
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: TEAMS & PURSE TRACKER */}
      {activeTab === 'teams' && (
        <div className={`rounded-3xl border overflow-hidden shadow-xl ${
          isLight ? 'bg-white border-purple-200' : 'bg-[#0C0C14]/80 border-purple-500/20'
        }`}>
          <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${
            isLight ? 'border-purple-100 bg-purple-50/50' : 'border-purple-500/20'
          }`}>
            <div>
              <h3 className={`text-sm sm:text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Franchises & Purse Balances
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                Initial budget: {room.currencySymbol}{room.initialPurse} {room.unitLabel} per team
              </p>
            </div>
          </div>

          {participantsList.length === 0 ? (
            <div className={`p-12 text-center text-xs ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
              No teams connected yet. Share the QR code or room code to let bidders join!
            </div>
          ) : (
            <div className={isLight ? 'divide-y divide-slate-100' : 'divide-y divide-white/5'}>
              {participantsList.map((p, idx) => (
                <div key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-purple-50/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${
                      isLight ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'bg-white/5 text-zinc-400 border border-white/10'
                    }`}>
                      #{idx + 1}
                    </span>
                    <AvatarDisplay avatar={p.avatar} name={p.name} sizeClassName="w-10 h-10" />
                    <div>
                      <div className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {p.name}
                      </div>
                      <div className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                        Acquired: <strong className="text-purple-600 dark:text-purple-300">{p.wonLots?.length || 0} lots</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className={`text-[10px] font-mono uppercase ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                        Purse Remaining
                      </div>
                      <div className="font-mono font-black text-base text-emerald-600 dark:text-emerald-400">
                        {room.currencySymbol}{(p.purse || 0).toFixed(2)} {room.unitLabel}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: CATALOG */}
      {activeTab === 'catalog' && (
        <div className={`rounded-3xl border overflow-hidden shadow-xl ${
          isLight ? 'bg-white border-purple-200' : 'bg-[#0C0C14]/80 border-purple-500/20'
        }`}>
          <div className={isLight ? 'divide-y divide-slate-100' : 'divide-y divide-white/5'}>
            {room.lots.map((lot, idx) => (
              <div key={lot.id} className={`p-4 flex items-center justify-between gap-4 ${
                idx === room.currentLotIndex ? (isLight ? 'bg-purple-50/80 font-bold' : 'bg-purple-950/40 font-bold') : ''
              }`}>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-zinc-500 w-6">#{idx + 1}</span>
                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-purple-500/30 bg-purple-950/20 shrink-0 flex items-center justify-center">
                    {lot.imageUrl ? (
                      <img src={lot.imageUrl} alt={lot.title} className="w-full h-full object-cover object-top" />
                    ) : (
                      <span className="text-base">🏏</span>
                    )}
                  </div>
                  <div>
                    <div className={`text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>{lot.title}</div>
                    <div className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>{lot.category}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                    lot.status === 'sold'
                      ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                      : lot.status === 'unsold'
                      ? 'bg-rose-500/10 text-rose-600 border border-rose-500/30'
                      : 'bg-purple-500/10 text-purple-600 border border-purple-500/30'
                  }`}>
                    {lot.status === 'sold' ? `Sold to ${lot.soldTo?.name}` : lot.status === 'unsold' ? 'Unsold' : 'Upcoming'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SHARE / QR MODAL */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className={`border rounded-3xl p-6 sm:p-8 max-w-md w-full relative shadow-2xl text-center ${
            isLight ? 'bg-white border-purple-200' : 'bg-[#0C0C14] border-purple-500/40'
          }`}>
            <button
              onClick={() => setIsShareModalOpen(false)}
              className="absolute top-5 right-5 p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-white rounded-lg hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
            >
              <XCircle size={20} />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center mx-auto mb-4">
              <QrCode className="text-purple-500" size={24} />
            </div>

            <h3 className={`text-xl font-bold mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Scan to Join Auction
            </h3>
            <p className={`text-xs mb-5 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
              Point your phone camera to join <strong className="text-purple-600 dark:text-purple-300">"{room.title}"</strong> as a bidding team!
            </p>

            <div className="p-4 bg-white rounded-2xl shadow-xl border-2 border-purple-300 inline-block mb-4">
              <QRCodeSVG value={getJoinUrl()} size={190} level="H" includeMargin={false} />
            </div>

            <div className={`p-3 rounded-2xl border mb-3 font-mono font-bold text-lg ${
              isLight ? 'bg-purple-50 border-purple-200 text-purple-950' : 'bg-[#141224] border-purple-500/30 text-white'
            }`}>
              Room Code: <span className="text-purple-600 dark:text-purple-300 tracking-wider">{room.code}</span>
            </div>

            <button
              onClick={handleCopyLink}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
            >
              {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              {copiedLink ? 'Join Link Copied!' : 'Copy Direct Join Link'}
            </button>
          </div>
        </div>
      )}

      {/* Stage Projector Modal */}
      <ProjectorModal
        isOpen={isProjectorOpen}
        onClose={() => setIsProjectorOpen(false)}
        room={room}
      />
    </div>
  );
};
