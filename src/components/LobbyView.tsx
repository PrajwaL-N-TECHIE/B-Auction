import { useState, useEffect, type FC } from 'react';
import { ArrowRight, Sparkles, Gavel, Shield, Dices, Plus } from 'lucide-react';
import { generateRoomCode, createRoom, joinRoom } from '../services/auctionSync';
import type { AuctionParticipant } from '../types/auction';
import { BUIZ_AVATAR_PRESETS, getRandomAvatar, DEFAULT_AVATAR } from '../constants/avatars';
import { SAMPLE_LOT_PACKS } from '../constants/samplePacks';

interface LobbyViewProps {
  onJoinAsHost: (code: string) => void;
  onJoinAsPlayer: (code: string, participant: AuctionParticipant) => void;
  initialRoomCode?: string;
  isLight?: boolean;
}

export const LobbyView: FC<LobbyViewProps> = ({
  onJoinAsHost,
  onJoinAsPlayer,
  initialRoomCode = '',
  isLight = false
}) => {
  const [mode, setMode] = useState<'join' | 'create'>(initialRoomCode ? 'join' : 'join');

  // Create Room State
  const [createTitle, setCreateTitle] = useState('Premier League Auction');
  const [createCode, setCreateCode] = useState(generateRoomCode());
  const [selectedPackId, setSelectedPackId] = useState('cricket');
  const [customPurse, setCustomPurse] = useState<number>(100);
  const [creating, setCreating] = useState(false);

  // Join Room State
  const [joinCode, setJoinCode] = useState(initialRoomCode || '');
  const [teamName, setTeamName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(DEFAULT_AVATAR);
  const [joining, setJoining] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Update joinCode if initialRoomCode changes
  useEffect(() => {
    if (initialRoomCode) {
      setJoinCode(initialRoomCode.toUpperCase().trim());
      setMode('join');
    }
  }, [initialRoomCode]);

  // Load saved preferences
  useEffect(() => {
    try {
      const savedName = localStorage.getItem('bauction_team_name');
      if (savedName) setTeamName(savedName);
      const savedAvatar = localStorage.getItem('bauction_team_avatar');
      if (savedAvatar) setSelectedAvatar(savedAvatar);
    } catch {}
  }, []);

  const handleRollAvatar = () => {
    setSelectedAvatar(getRandomAvatar());
  };

  const handlePackChange = (packId: string) => {
    setSelectedPackId(packId);
    const pack = SAMPLE_LOT_PACKS.find(p => p.id === packId);
    if (pack) {
      setCustomPurse(pack.defaultPurse);
      setCreateTitle(pack.name);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createCode.trim()) return;
    setCreating(true);
    try {
      const cleanCode = createCode.toUpperCase().trim();
      await createRoom(cleanCode, createTitle.trim(), selectedPackId, customPurse);
      onJoinAsHost(cleanCode);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create auction room.');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanCode = joinCode.toUpperCase().trim();
    const cleanName = teamName.trim();

    if (!cleanCode) {
      setErrorMsg('Please enter a valid room code.');
      return;
    }
    if (!cleanName) {
      setErrorMsg('Please enter your Team / Franchise Name.');
      return;
    }

    setJoining(true);
    try {
      localStorage.setItem('bauction_team_name', cleanName);
      localStorage.setItem('bauction_team_avatar', selectedAvatar);

      const participantId = `tm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newParticipant: Omit<AuctionParticipant, 'purse' | 'initialPurse' | 'wonLots'> = {
        id: participantId,
        name: cleanName,
        avatar: selectedAvatar,
        joinedAt: Date.now()
      };

      const room = await joinRoom(cleanCode, newParticipant);
      const registered = room.participants[participantId];
      if (registered) {
        onJoinAsPlayer(cleanCode, registered);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to join auction.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 sm:py-12 flex flex-col items-center">
      {/* Hero Header */}
      <div className="text-center max-w-xl mx-auto mb-8 space-y-3">
        <div className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full border text-xs font-mono font-bold ${
          isLight
            ? 'bg-purple-100 border-purple-200 text-purple-700'
            : 'bg-purple-500/15 border-purple-500/30 text-purple-300'
        }`}>
          <Sparkles size={13} className="text-purple-500" />
          Real-Time Bidding & Franchise Draft
        </div>
        <h1 className={`text-3xl sm:text-5xl font-black font-title tracking-tight leading-tight ${
          isLight ? 'text-slate-900' : 'text-white'
        }`}>
          Command The Bidding <span className="text-purple-500">Arena.</span>
        </h1>
        <p className={`text-xs sm:text-sm leading-relaxed ${
          isLight ? 'text-slate-600' : 'text-zinc-400'
        }`}>
          Live auction platform for sports fantasy drafts, startup team bidding, and college fests. Raise bids from your phone with real-time budget tracking!
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className={`flex items-center p-1.5 rounded-2xl border mb-8 shadow-md ${
        isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#0F0D1C] border-purple-500/30'
      }`}>
        <button
          type="button"
          onClick={() => { setMode('join'); setErrorMsg(''); }}
          className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
            mode === 'join'
              ? 'bg-purple-600 text-white shadow-md'
              : isLight
              ? 'text-slate-600 hover:text-slate-900'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Gavel size={16} />
          <span>Join as Team / Bidder</span>
        </button>

        <button
          type="button"
          onClick={() => { setMode('create'); setErrorMsg(''); }}
          className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
            mode === 'create'
              ? 'bg-purple-600 text-white shadow-md'
              : isLight
              ? 'text-slate-600 hover:text-slate-900'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Shield size={16} />
          <span>Host an Auction</span>
        </button>
      </div>

      {/* Error notification banner */}
      {errorMsg && (
        <div className="w-full max-w-md mb-6 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs text-center font-bold">
          {errorMsg}
        </div>
      )}

      {/* JOIN AS BIDDER / TEAM FORM */}
      {mode === 'join' && (
        <form
          onSubmit={handleJoinRoom}
          className={`w-full max-w-md p-6 sm:p-8 rounded-3xl border backdrop-blur-2xl shadow-xl space-y-5 animate-in fade-in duration-200 ${
            isLight
              ? 'bg-white border-purple-200'
              : 'bg-[#0C0C14]/90 border-purple-500/40'
          }`}
        >
          {/* Room Code */}
          <div>
            <label className={`block text-xs font-mono font-bold uppercase tracking-wider mb-2 ${
              isLight ? 'text-purple-700' : 'text-purple-300'
            }`}>
              Auction Room Code:
            </label>
            <input
              type="text"
              required
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="e.g. AUC-729"
              maxLength={10}
              className={`w-full text-center tracking-widest font-mono text-xl sm:text-2xl font-black py-3 px-4 rounded-2xl border transition-all uppercase shadow-inner focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                isLight
                  ? 'bg-slate-50 border-purple-200 text-slate-900 placeholder-slate-400'
                  : 'bg-[#141224] border-purple-500/40 text-white placeholder-zinc-600'
              }`}
            />
          </div>

          {/* Team / Bidder Name */}
          <div>
            <label className={`block text-xs font-mono font-bold uppercase tracking-wider mb-2 ${
              isLight ? 'text-purple-700' : 'text-purple-300'
            }`}>
              Team / Franchise Name:
            </label>
            <input
              type="text"
              required
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. Royal Challengers or Apex Ventures..."
              maxLength={28}
              className={`w-full py-3 px-4 rounded-2xl border text-sm font-bold transition-all shadow-inner focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                isLight
                  ? 'bg-slate-50 border-purple-200 text-slate-900 placeholder-slate-400'
                  : 'bg-[#141224] border-purple-500/40 text-white placeholder-zinc-500'
              }`}
            />
          </div>

          {/* Character Avatar Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`text-xs font-mono font-bold uppercase tracking-wider ${
                isLight ? 'text-purple-700' : 'text-purple-300'
              }`}>
                Team Avatar:
              </label>
              <button
                type="button"
                onClick={handleRollAvatar}
                className="text-[11px] text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-mono font-bold flex items-center gap-1 cursor-pointer"
              >
                <Dices size={13} />
                <span>Randomize</span>
              </button>
            </div>

            {/* Selected Avatar Preview */}
            <div className="flex items-center justify-center mb-3">
              <div className={`relative p-2 rounded-2xl border-2 flex items-center justify-center shadow-md ${
                isLight ? 'bg-purple-50 border-purple-300' : 'bg-purple-950/40 border-purple-500'
              }`}>
                <div className="w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center">
                  <img
                    src={selectedAvatar}
                    alt="Team Avatar"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Avatar Preset Grid */}
            <div className="grid grid-cols-6 gap-2">
              {BUIZ_AVATAR_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedAvatar(preset.url)}
                  className={`h-11 rounded-xl p-1 flex items-center justify-center transition-all cursor-pointer ${
                    selectedAvatar === preset.url
                      ? 'bg-purple-600/30 border-2 border-purple-500 scale-110 shadow-md'
                      : isLight
                      ? 'bg-slate-100 hover:bg-slate-200 border border-slate-200 opacity-80 hover:opacity-100'
                      : 'bg-white/5 hover:bg-white/10 border border-white/10 opacity-70 hover:opacity-100'
                  }`}
                  title={preset.name}
                >
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className="w-full h-full object-contain pointer-events-none"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Join Button (Solid Purple) */}
          <button
            type="submit"
            disabled={joining}
            className="w-full py-3.5 px-6 rounded-2xl bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-black text-sm tracking-wide transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {joining ? (
              <span>Connecting to Arena...</span>
            ) : (
              <>
                <span>Enter Auction Arena</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      )}

      {/* CREATE AS HOST FORM */}
      {mode === 'create' && (
        <form
          onSubmit={handleCreateRoom}
          className={`w-full max-w-md p-6 sm:p-8 rounded-3xl border backdrop-blur-2xl shadow-xl space-y-5 animate-in fade-in duration-200 ${
            isLight
              ? 'bg-white border-purple-200'
              : 'bg-[#0C0C14]/90 border-purple-500/40'
          }`}
        >
          {/* Auction Title */}
          <div>
            <label className={`block text-xs font-mono font-bold uppercase tracking-wider mb-2 ${
              isLight ? 'text-purple-700' : 'text-purple-300'
            }`}>
              Auction Event Title:
            </label>
            <input
              type="text"
              required
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              placeholder="e.g. Mega League Auction 2026"
              className={`w-full py-3 px-4 rounded-2xl border text-sm font-bold transition-all shadow-inner focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                isLight
                  ? 'bg-slate-50 border-purple-200 text-slate-900 placeholder-slate-400'
                  : 'bg-[#141224] border-purple-500/40 text-white placeholder-zinc-500'
              }`}
            />
          </div>

          {/* Generated Code */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`text-xs font-mono font-bold uppercase tracking-wider ${
                isLight ? 'text-purple-700' : 'text-purple-300'
              }`}>
                Generated Room Code:
              </label>
              <button
                type="button"
                onClick={() => setCreateCode(generateRoomCode())}
                className="text-[11px] text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-mono font-bold cursor-pointer"
              >
                Regenerate ↻
              </button>
            </div>
            <input
              type="text"
              required
              value={createCode}
              onChange={(e) => setCreateCode(e.target.value.toUpperCase())}
              className={`w-full text-center tracking-widest font-mono text-xl sm:text-2xl font-black py-3 px-4 rounded-2xl border transition-all uppercase shadow-inner focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                isLight
                  ? 'bg-slate-50 border-purple-200 text-slate-900 placeholder-slate-400'
                  : 'bg-[#141224] border-purple-500/40 text-white placeholder-zinc-600'
              }`}
            />
          </div>

          {/* Auction Lot Pack Selector */}
          <div>
            <label className={`block text-xs font-mono font-bold uppercase tracking-wider mb-2 ${
              isLight ? 'text-purple-700' : 'text-purple-300'
            }`}>
              Select Lot Pack:
            </label>
            <div className="space-y-2">
              {SAMPLE_LOT_PACKS.map((pack) => (
                <button
                  key={pack.id}
                  type="button"
                  onClick={() => handlePackChange(pack.id)}
                  className={`w-full p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                    selectedPackId === pack.id
                      ? isLight
                        ? 'bg-purple-50 border-purple-500 text-purple-950 shadow-sm'
                        : 'bg-purple-600/30 border-purple-400 text-white shadow-md'
                      : isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      : 'bg-[#141224] border-purple-500/20 text-zinc-400 hover:text-white'
                  }`}
                >
                  <div className={`text-xs font-bold ${
                    selectedPackId === pack.id ? (isLight ? 'text-purple-900' : 'text-white') : (isLight ? 'text-slate-800' : 'text-zinc-300')
                  }`}>
                    {pack.name} ({pack.lots.length} lots)
                  </div>
                  <div className={`text-[10px] mt-0.5 ${
                    isLight ? 'text-slate-500' : 'text-zinc-400'
                  }`}>
                    Purse: {pack.currencySymbol}{pack.defaultPurse} {pack.unitLabel} • Min +{pack.currencySymbol}{pack.minIncrement} {pack.unitLabel}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Starting Purse */}
          <div>
            <label className={`block text-xs font-mono font-bold uppercase tracking-wider mb-2 ${
              isLight ? 'text-purple-700' : 'text-purple-300'
            }`}>
              Starting Purse Per Team ({SAMPLE_LOT_PACKS.find(p => p.id === selectedPackId)?.unitLabel || 'Credits'}):
            </label>
            <input
              type="number"
              min={1}
              required
              value={customPurse}
              onChange={(e) => setCustomPurse(Number(e.target.value))}
              className={`w-full py-3 px-4 rounded-2xl border text-sm font-bold font-mono transition-all shadow-inner focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                isLight
                  ? 'bg-slate-50 border-purple-200 text-slate-900'
                  : 'bg-[#141224] border-purple-500/40 text-white'
              }`}
            />
          </div>

          {/* Launch Button (Solid Purple) */}
          <button
            type="submit"
            disabled={creating}
            className="w-full py-3.5 px-6 rounded-2xl bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-black text-sm tracking-wide transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {creating ? (
              <span>Initializing Arena...</span>
            ) : (
              <>
                <Plus size={16} />
                <span>Launch Auction Arena</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};
