import { useEffect, useState, useRef, type FC } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Maximize, Minimize, Gavel, Sparkles, Copy, Check, Users, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { AuctionRoom } from '../types/auction';
import { AvatarDisplay } from './AvatarDisplay';

interface ProjectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: AuctionRoom;
}

export const ProjectorModal: FC<ProjectorModalProps> = ({
  isOpen,
  onClose,
  room,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const lastSoldRef = useRef<string | null>(null);

  // Keyboard controls (Esc to close, F for fullscreen)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Trigger celebration confetti when a lot is sold
  useEffect(() => {
    const currentLot = room.lots[room.currentLotIndex];
    if (isOpen && currentLot && currentLot.status === 'sold' && currentLot.id !== lastSoldRef.current) {
      lastSoldRef.current = currentLot.id;
      try {
        confetti({
          particleCount: 100,
          spread: 100,
          origin: { y: 0.6 },
          colors: ['#a855f7', '#7c3aed', '#facc15', '#3b82f6', '#10b981']
        });
      } catch {}
    }
  }, [isOpen, room.currentLotIndex, room.lots]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      modalRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
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
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  const currentLot = room.lots[room.currentLotIndex];
  const participantCount = Object.keys(room.participants || {}).length;
  const highestBidder = room.highestBidder;

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-50 bg-[#06050C] flex flex-col justify-between p-6 sm:p-10 text-white select-none overflow-hidden animate-in fade-in duration-200"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/15 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header Bar */}
      <div className="w-full flex items-center justify-between z-10 border-b border-purple-500/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center p-2 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
            <img src="/logo.png" alt="Buildicy" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight font-title text-white">
                Buildicy <span className="text-purple-400">Auditorium Stage</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-[10px] font-mono font-bold text-purple-300 uppercase tracking-wider">
                Lot #{room.currentLotIndex + 1} of {room.lots.length}
              </span>
            </div>
            <p className="text-xs text-zinc-400">{room.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="px-3.5 py-1.5 rounded-xl bg-[#141224] border border-purple-500/30 flex items-center gap-2 text-xs font-mono">
            <Users size={14} className="text-purple-400" />
            <span className="text-white font-bold">{participantCount}</span>
            <span className="text-zinc-400">Teams In Arena</span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
            title="Toggle Fullscreen (F)"
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
            title="Exit Projector Mode (ESC)"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Main Center Presentation Display */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12 my-auto z-10 w-full max-w-7xl mx-auto py-6">
        {/* Left Side: Room Code + Live Scannable QR Code */}
        <div className="flex flex-col items-center text-center p-6 sm:p-8 rounded-3xl bg-[#0F0D1D]/90 border border-purple-500/30 backdrop-blur-xl shadow-2xl shrink-0 max-w-sm w-full">
          <div className="text-[11px] font-mono uppercase tracking-widest text-purple-300 font-bold mb-2">
            Scan to Bid on Mobile
          </div>

          <div className="p-4 bg-white rounded-2xl shadow-2xl border-2 border-purple-300 mb-4 transition-transform hover:scale-105 duration-300">
            <QRCodeSVG
              id={`stage-qr-${room.code}`}
              value={getJoinUrl()}
              size={180}
              level="H"
              includeMargin={false}
            />
          </div>

          <div className="w-full space-y-2">
            <div className="text-xs text-zinc-400">Enter room code:</div>
            <div className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-white bg-purple-950/40 border border-purple-500/40 rounded-2xl py-2 px-4 shadow-inner">
              {room.code}
            </div>

            <button
              onClick={handleCopyLink}
              className="w-full mt-2 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              {copied ? 'Link Copied!' : 'Copy Direct Join Link'}
            </button>
          </div>
        </div>

        {/* Right Side: Massive Lot Card on Stage */}
        <div className="flex-1 flex flex-col items-center justify-center text-center w-full max-w-3xl">
          {currentLot ? (
            <div className={`w-full p-8 sm:p-12 rounded-3xl border-2 shadow-2xl relative overflow-hidden transition-all ${
              currentLot.status === 'sold'
                ? 'bg-gradient-to-b from-emerald-950/40 via-[#101F18]/90 to-[#0A140E] border-emerald-400/60 shadow-[0_0_80px_rgba(16,185,129,0.3)]'
                : currentLot.status === 'unsold'
                ? 'bg-gradient-to-b from-rose-950/30 via-[#190F14]/90 to-[#100A0D] border-rose-500/40'
                : 'bg-gradient-to-b from-purple-900/40 via-[#120F24]/90 to-[#0A0914] border-purple-400/60 shadow-[0_0_80px_rgba(168,85,247,0.35)]'
            }`}>
              {/* Category & Status Banner */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="px-3.5 py-1 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-200 text-xs font-mono font-bold uppercase tracking-wider">
                  {currentLot.category}
                </span>

                {currentLot.status === 'sold' && (
                  <span className="px-3.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1 animate-bounce">
                    <Trophy size={13} /> SOLD! 🔨
                  </span>
                )}
                {currentLot.status === 'unsold' && (
                  <span className="px-3.5 py-1 rounded-full bg-rose-500/20 border border-rose-400/50 text-rose-300 text-xs font-bold uppercase tracking-wider">
                    PASSED / UNSOLD
                  </span>
                )}
              </div>

              {/* Player Hero Spotlight Photo */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="w-32 h-32 sm:w-44 sm:h-44 rounded-3xl overflow-hidden border-4 border-purple-500/50 shadow-[0_0_60px_rgba(168,85,247,0.4)] bg-[#141224] flex items-center justify-center">
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
                      <span className="text-5xl">🏏</span>
                    )}
                  </div>
                  {currentLot.rating && (
                    <div className="absolute -bottom-2 -right-2 px-3 py-1 rounded-xl bg-purple-600 text-white text-xs font-mono font-black border border-purple-300 shadow-xl">
                      ★ {currentLot.rating}
                    </div>
                  )}
                </div>
              </div>

              {/* Title */}
              <h2 className="text-3xl sm:text-5xl font-black font-title text-white tracking-tight leading-tight mb-2">
                {currentLot.title}
              </h2>

              {currentLot.description && (
                <p className="text-xs sm:text-sm text-zinc-300 max-w-lg mx-auto mb-5">
                  {currentLot.description}
                </p>
              )}

              {/* Lot Stats Pill Grid */}
              {currentLot.stats && currentLot.stats.length > 0 && (
                <div className="flex items-center justify-center gap-3 flex-wrap mb-8">
                  {currentLot.stats.map((st, i) => (
                    <div key={i} className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono">
                      <span className="text-zinc-400 mr-1.5">{st.label}:</span>
                      <span className="text-white font-bold">{st.value}</span>
                    </div>
                  ))}
                  <div className="px-3.5 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs font-mono">
                    <span className="text-purple-300 mr-1.5">Base Price:</span>
                    <span className="text-purple-200 font-bold">{room.currencySymbol}{currentLot.basePrice.toFixed(2)} {room.unitLabel}</span>
                  </div>
                </div>
              )}

              {/* Current Bidding Arena Status */}
              <div className="p-6 rounded-3xl bg-[#141224]/80 border border-purple-500/40 backdrop-blur-xl">
                {currentLot.status === 'sold' && currentLot.soldTo ? (
                  <div className="space-y-3">
                    <div className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold">
                      Hammer Down • Sold Price
                    </div>
                    <div className="text-5xl sm:text-6xl font-black font-mono text-emerald-400 tracking-tight">
                      {room.currencySymbol}{currentLot.soldTo.amount.toFixed(2)} <span className="text-3xl text-emerald-300">{room.unitLabel}</span>
                    </div>
                    <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-sm font-bold">
                      <AvatarDisplay avatar={currentLot.soldTo.avatar} name={currentLot.soldTo.name} sizeClassName="w-8 h-8" />
                      <span>Sold to <strong className="text-white text-base">{currentLot.soldTo.name}</strong></span>
                    </div>
                  </div>
                ) : highestBidder ? (
                  <div className="space-y-3">
                    <div className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold flex items-center justify-center gap-1.5">
                      <Gavel size={14} className="text-amber-400" />
                      Current Leading Bid
                    </div>
                    <div className="text-5xl sm:text-6xl font-black font-mono text-amber-400 tracking-tight">
                      {room.currencySymbol}{room.currentBid.toFixed(2)} <span className="text-3xl text-amber-300">{room.unitLabel}</span>
                    </div>
                    <div className="inline-flex items-center gap-3 px-5 py-2 rounded-2xl bg-amber-950/40 border border-amber-400/40 text-amber-200 text-sm font-bold">
                      <AvatarDisplay avatar={highestBidder.avatar} name={highestBidder.name} sizeClassName="w-8 h-8" />
                      <span>Leading Bidder: <strong className="text-white text-base">{highestBidder.name}</strong></span>
                    </div>

                    {/* Gavel Phase Status */}
                    {room.gavelPhase !== 'idle' && (
                      <div className="pt-2 text-sm font-mono font-bold uppercase tracking-wider text-amber-400 animate-pulse">
                        {room.gavelPhase === 'going_once' && '⚡ Going Once... ⚡'}
                        {room.gavelPhase === 'going_twice' && '🔥 Going Twice... Last Call! 🔥'}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 py-2">
                    <div className="text-xs font-mono uppercase tracking-widest text-purple-300 font-bold">
                      Base Price Open For Bids
                    </div>
                    <div className="text-4xl sm:text-5xl font-black font-mono text-white tracking-tight">
                      {room.currencySymbol}{currentLot.basePrice.toFixed(2)} <span className="text-2xl text-purple-300">{room.unitLabel}</span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Bidders can tap the bid buttons on their smartphones to open!
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-zinc-400">
              <Sparkles size={32} className="text-purple-400 mx-auto mb-3" />
              <p>No lot currently selected.</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Footer Watermark */}
      <div className="w-full text-center text-xs text-zinc-500 z-10 flex items-center justify-center gap-2 pt-2 border-t border-purple-500/10">
        <img src="/logo.png" alt="Buildicy" className="w-4 h-4 object-contain inline-block opacity-70" />
        <span className="font-bold text-zinc-300">Buildicy Interactive Systems</span>
        <span>•</span>
        <span className="text-purple-400 font-mono">auction.buildicy.com</span>
      </div>
    </div>
  );
};
