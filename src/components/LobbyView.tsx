import { useState, useEffect, type FC } from 'react';
import { ArrowRight, Sparkles, Gavel, Shield, Dices, Plus, Trophy, Zap, Cpu } from 'lucide-react';
import { generateRoomCode, createRoom, joinRoom, subscribeRoom, getCachedRoom } from '../services/auctionSync';
import type { AuctionParticipant, AuctionRoom } from '../types/auction';
import { SAMPLE_LOT_PACKS } from '../constants/samplePacks';
import {
  AUCTION_MODES,
  detectAuctionMode,
  getModeConfig,
  getAvatarByUrlOrName,
  type AuctionMode,
  type ModeAvatar
} from '../constants/auctionModes';

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
  const [mode, setMode] = useState<'join' | 'create'>('join');

  // Create Room State
  const [createTitle, setCreateTitle] = useState('Premier Cricket Auction (IPL Mega Auction)');
  const [createCode, setCreateCode] = useState(generateRoomCode());
  const [selectedPackId, setSelectedPackId] = useState('cricket');
  const [customPurse, setCustomPurse] = useState<number>(100);
  const [creating, setCreating] = useState(false);

  // Join Room State
  const [joinCode, setJoinCode] = useState(initialRoomCode || '');
  const [teamName, setTeamName] = useState('');
  const [selectedJoinMode, setSelectedJoinMode] = useState<AuctionMode>('cricket');
  const [selectedAvatar, setSelectedAvatar] = useState(AUCTION_MODES.cricket.avatars[0].logo);
  const [joining, setJoining] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeRoom, setActiveRoom] = useState<AuctionRoom | null>(null);

  // Live room state subscription for instant duplicate team detection
  useEffect(() => {
    const clean = joinCode.toUpperCase().trim();
    if (clean.length >= 6) {
      const cached = getCachedRoom(clean);
      if (cached) {
        setActiveRoom(cached);
        const rMode = detectAuctionMode(cached);
        setSelectedJoinMode(rMode);
      }

      const unsub = subscribeRoom(clean, (roomUpdate) => {
        setActiveRoom(roomUpdate);
        const rMode = detectAuctionMode(roomUpdate);
        setSelectedJoinMode(rMode);
      });
      return () => unsub();
    } else {
      setActiveRoom(null);
    }
  }, [joinCode]);

  // Determine active mode dynamically
  const currentMode: AuctionMode =
    mode === 'create'
      ? detectAuctionMode(selectedPackId)
      : activeRoom
      ? detectAuctionMode(activeRoom)
      : selectedJoinMode;

  const modeConfig = getModeConfig(currentMode);

  // Check taken teams in current room
  const cleanCode = joinCode.toUpperCase().trim();
  const takenParticipants = Object.values(activeRoom?.participants || {});

  const getTakenInfo = (avatarItem: ModeAvatar) => {
    return takenParticipants.find((p) => {
      const pLogo = (p.avatar || '').split('?')[0].toLowerCase();
      const aLogo = avatarItem.logo.split('?')[0].toLowerCase();
      return (
        pLogo === aLogo ||
        pLogo.includes(avatarItem.shortName.toLowerCase()) ||
        pLogo.includes(avatarItem.id.toLowerCase())
      );
    });
  };

  // If currently selected avatar does not belong to current mode, or is taken, switch to first available
  useEffect(() => {
    const myPid = cleanCode ? localStorage.getItem(`bauction_pid_${cleanCode}`) : null;
    const existsInCurrentMode = modeConfig.avatars.some((a) => {
      const aLogo = a.logo.split('?')[0].toLowerCase();
      const sLogo = selectedAvatar.split('?')[0].toLowerCase();
      return aLogo === sLogo || a.id === selectedAvatar;
    });

    const isCurrentTaken = Boolean(
      modeConfig.avatars.some((a) => {
        const aLogo = a.logo.split('?')[0].toLowerCase();
        const sLogo = selectedAvatar.split('?')[0].toLowerCase();
        if (aLogo === sLogo || a.id === selectedAvatar) {
          const taken = getTakenInfo(a);
          return taken && taken.id !== myPid;
        }
        return false;
      })
    );

    if (!existsInCurrentMode || isCurrentTaken) {
      const firstAvailable = modeConfig.avatars.find((a) => {
        const taken = getTakenInfo(a);
        return !taken || taken.id === myPid;
      }) || modeConfig.avatars[0];

      if (firstAvailable) {
        setSelectedAvatar(firstAvailable.logo);
        // Only override teamName if empty or if matching another team's default name
        setTeamName(firstAvailable.name);
      }
    }
  }, [currentMode, activeRoom?.code, takenParticipants.length]);

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
    const myPid = cleanCode ? localStorage.getItem(`bauction_pid_${cleanCode}`) : null;
    const available = modeConfig.avatars.filter((a) => {
      const taken = getTakenInfo(a);
      return !taken || taken.id === myPid;
    });
    if (available.length > 0) {
      const randomAvatar = available[Math.floor(Math.random() * available.length)];
      setSelectedAvatar(randomAvatar.logo);
      setTeamName(randomAvatar.name);
    } else {
      const randomAvatar = modeConfig.avatars[Math.floor(Math.random() * modeConfig.avatars.length)];
      setSelectedAvatar(randomAvatar.logo);
      setTeamName(randomAvatar.name);
    }
  };

  const handlePackChange = (packId: string) => {
    setSelectedPackId(packId);
    const pack = SAMPLE_LOT_PACKS.find((p) => p.id === packId);
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
      const cCode = createCode.toUpperCase().trim();
      await createRoom(cCode, createTitle.trim(), selectedPackId, customPurse);
      onJoinAsHost(cCode);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create auction room.');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const cCode = joinCode.toUpperCase().trim();
    const cleanName = teamName.trim();

    if (!cCode) {
      setErrorMsg('Please enter a valid room code.');
      return;
    }
    if (!cleanName) {
      setErrorMsg(`Please enter your ${modeConfig.teamFieldLabel.replace(':', '')}.`);
      return;
    }

    setJoining(true);
    try {
      // Re-use saved participant ID for this room so page refresh does not trigger duplicate error
      const storagePidKey = `bauction_pid_${cCode}`;
      let participantId = localStorage.getItem(storagePidKey);
      if (!participantId) {
        participantId = `tm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        localStorage.setItem(storagePidKey, participantId);
      }

      // Pre-flight duplicate check against live room state
      if (activeRoom) {
        const otherParticipants = Object.values(activeRoom.participants || {}).filter(
          (p) => p.id !== participantId
        );

        // 1. Check duplicate team name
        const duplicateName = otherParticipants.find(
          (p) => p.name.trim().toLowerCase() === cleanName.toLowerCase()
        );
        if (duplicateName) {
          setErrorMsg(`The team name "${cleanName}" is already registered in this arena. Duplicate team names are not allowed!`);
          setJoining(false);
          return;
        }

        // 2. Check duplicate avatar / emblem
        const duplicateAvatar = otherParticipants.find((p) => {
          if (!p.avatar) return false;
          const pLogo = p.avatar.split('?')[0].toLowerCase();
          const chosenLogo = selectedAvatar.split('?')[0].toLowerCase();
          return pLogo === chosenLogo;
        });
        if (duplicateAvatar) {
          setErrorMsg(`This franchise emblem is already chosen by "${duplicateAvatar.name}". Duplicate entries are strictly not allowed!`);
          setJoining(false);
          return;
        }
      }

      localStorage.setItem('bauction_team_name', cleanName);
      localStorage.setItem('bauction_team_avatar', selectedAvatar);

      const newParticipant: Omit<AuctionParticipant, 'purse' | 'initialPurse' | 'wonLots'> = {
        id: participantId,
        name: cleanName,
        avatar: selectedAvatar,
        joinedAt: Date.now()
      };

      const room = await joinRoom(cCode, newParticipant);
      const registered = room.participants[participantId];
      if (registered) {
        onJoinAsPlayer(cCode, registered);
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
          {currentMode === 'cricket' && <Sparkles size={13} className="text-purple-500" />}
          {currentMode === 'football' && <Trophy size={13} className="text-amber-500" />}
          {currentMode === 'startup' && <Zap size={13} className="text-emerald-500" />}
          {currentMode === 'cyberpunk' && <Cpu size={13} className="text-rose-500" />}
          <span>{modeConfig.badge}</span>
        </div>
        <h1 className={`text-3xl sm:text-5xl font-black font-title tracking-tight leading-tight ${
          isLight ? 'text-slate-900' : 'text-white'
        }`}>
          Command The Bidding <span className="text-purple-500">Arena.</span>
        </h1>
        <p className={`text-xs sm:text-sm leading-relaxed ${
          isLight ? 'text-slate-600' : 'text-zinc-400'
        }`}>
          {modeConfig.heroTagline}
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
          {/* Mode Selector Pill if Room is not yet joined */}
          {!activeRoom && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={`text-[11px] font-mono font-bold uppercase tracking-wider ${
                  isLight ? 'text-slate-600' : 'text-zinc-400'
                }`}>
                  Select Auction Mode:
                </label>
                <span className="text-[10px] font-mono text-purple-500 font-bold">Auto-syncs with Room Code</span>
              </div>
              <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl border bg-black/10 border-purple-500/20">
                {(['cricket', 'football', 'startup', 'cyberpunk'] as AuctionMode[]).map((mId) => {
                  const mConf = AUCTION_MODES[mId];
                  const isActive = currentMode === mId;
                  return (
                    <button
                      key={mId}
                      type="button"
                      onClick={() => setSelectedJoinMode(mId)}
                      className={`py-1.5 px-1.5 rounded-xl text-[11px] font-bold font-mono transition-all text-center truncate cursor-pointer ${
                        isActive
                          ? 'bg-purple-600 text-white shadow'
                          : isLight
                          ? 'text-slate-600 hover:text-slate-900'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {mConf.fallbackEmoji} {mId === 'cricket' ? 'IPL' : mId === 'football' ? 'Football' : mId === 'startup' ? 'Tech/VC' : 'Sci-Fi'}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
            {activeRoom && (
              <p className="text-[11px] font-mono text-emerald-500 mt-1 text-center font-bold">
                ✓ Connected to {activeRoom.title} ({activeRoom.currencySymbol}{activeRoom.initialPurse} {activeRoom.unitLabel})
              </p>
            )}
          </div>

          {/* Dynamic Team / Bidder Name */}
          <div>
            <label className={`block text-xs font-mono font-bold uppercase tracking-wider mb-2 ${
              isLight ? 'text-purple-700' : 'text-purple-300'
            }`}>
              {modeConfig.teamFieldLabel}
            </label>
            <input
              type="text"
              required
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder={modeConfig.teamPlaceholder}
              maxLength={32}
              className={`w-full py-3 px-4 rounded-2xl border text-sm font-bold transition-all shadow-inner focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                isLight
                  ? 'bg-slate-50 border-purple-200 text-slate-900 placeholder-slate-400'
                  : 'bg-[#141224] border-purple-500/40 text-white placeholder-zinc-500'
              }`}
            />
          </div>

          {/* Dynamic Avatar Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`text-xs font-mono font-bold uppercase tracking-wider ${
                isLight ? 'text-purple-700' : 'text-purple-300'
              }`}>
                {modeConfig.avatarSelectorLabel}
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

            {/* Selected Team Highlight Banner */}
            {(() => {
              const currentAvatar = getAvatarByUrlOrName(selectedAvatar, currentMode) || modeConfig.avatars[0];
              return (
                <div
                  className="mb-3 p-3 rounded-2xl border flex items-center gap-3 transition-all shadow-md"
                  style={{
                    backgroundColor: isLight ? '#faf5ff' : 'rgba(24, 18, 43, 0.9)',
                    borderColor: currentAvatar.primaryColor
                  }}
                >
                  <div className="w-14 h-14 p-1.5 rounded-xl bg-white shadow-sm border border-purple-100 flex items-center justify-center shrink-0">
                    <img
                      src={currentAvatar.logo}
                      alt={currentAvatar.name}
                      className="w-full h-full object-contain pointer-events-none"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black font-title truncate text-slate-900 dark:text-white">
                        {currentAvatar.name}
                      </span>
                      <span
                        className="text-[10px] font-black font-mono px-1.5 py-0.5 rounded text-white shrink-0 shadow-sm"
                        style={{ backgroundColor: currentAvatar.primaryColor }}
                      >
                        {currentAvatar.shortName}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-purple-600 dark:text-purple-300 truncate mt-0.5">
                      {currentAvatar.tagline}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* 10 Mode Avatars Grid */}
            <div className="grid grid-cols-5 gap-2">
              {modeConfig.avatars.map((av) => {
                const myPid = cleanCode ? localStorage.getItem(`bauction_pid_${cleanCode}`) : null;
                const takenInfo = getTakenInfo(av);
                const isTakenByOther = Boolean(takenInfo && takenInfo.id !== myPid);
                const isMyTeam = Boolean(takenInfo && takenInfo.id === myPid);
                const aLogo = av.logo.split('?')[0].toLowerCase();
                const sLogo = selectedAvatar.split('?')[0].toLowerCase();
                const isSelected = aLogo === sLogo || selectedAvatar.includes(av.shortName.toLowerCase());

                return (
                  <button
                    key={av.id}
                    type="button"
                    disabled={isTakenByOther}
                    onClick={() => {
                      if (isTakenByOther) return;
                      setSelectedAvatar(av.logo);
                      setTeamName(av.name);
                      setErrorMsg('');
                    }}
                    className={`h-16 rounded-2xl p-1.5 flex flex-col items-center justify-center gap-1 transition-all relative group ${
                      isTakenByOther
                        ? 'opacity-35 cursor-not-allowed bg-rose-950/20 border border-rose-500/20 grayscale'
                        : isSelected
                        ? 'border-2 scale-105 shadow-lg cursor-pointer'
                        : isLight
                        ? 'bg-slate-100/80 hover:bg-white border border-slate-200 opacity-80 hover:opacity-100 hover:shadow-sm cursor-pointer'
                        : 'bg-white/5 hover:bg-white/10 border border-white/10 opacity-75 hover:opacity-100 cursor-pointer'
                    }`}
                    style={isSelected && !isTakenByOther ? {
                      borderColor: av.primaryColor,
                      backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.1)'
                    } : undefined}
                    title={
                      isTakenByOther
                        ? `Claimed by ${takenInfo?.name || 'another team'} - Duplicate entries not allowed`
                        : `${av.name} (${av.shortName})`
                    }
                  >
                    {isTakenByOther && (
                      <span className="absolute -top-1 -right-1 text-[8px] font-black font-mono tracking-tighter uppercase px-1 py-0.5 rounded-full bg-rose-600 text-white shadow-sm z-10">
                        TAKEN
                      </span>
                    )}
                    {isMyTeam && (
                      <span className="absolute -top-1 -right-1 text-[8px] font-black font-mono tracking-tighter uppercase px-1 py-0.5 rounded-full bg-emerald-600 text-white shadow-sm z-10">
                        YOU
                      </span>
                    )}
                    <div className="w-8 h-8 flex items-center justify-center">
                      <img
                        src={av.logo}
                        alt={av.shortName}
                        className="w-full h-full object-contain pointer-events-none drop-shadow-sm"
                        loading="lazy"
                      />
                    </div>
                    <span
                      className="text-[10px] font-mono font-black tracking-tight"
                      style={{ color: isTakenByOther ? '#ef4444' : av.primaryColor }}
                    >
                      {av.shortName}
                    </span>
                  </button>
                );
              })}
            </div>

            {takenParticipants.length > 0 && (
              <div className="flex items-center justify-between text-[11px] font-mono pt-1 text-zinc-400">
                <span className="text-purple-600 dark:text-purple-300 font-bold">
                  {takenParticipants.length} franchise{takenParticipants.length > 1 ? 's' : ''} claimed
                </span>
                <span className="text-rose-500 font-bold text-[10px]">
                  No duplicates allowed
                </span>
              </div>
            )}
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
              Select Lot Pack (Auction Mode):
            </label>
            <div className="space-y-2">
              {SAMPLE_LOT_PACKS.map((pack) => {
                const packMode = detectAuctionMode(pack.id);
                const packConf = getModeConfig(packMode);
                const isSelected = selectedPackId === pack.id;
                return (
                  <button
                    key={pack.id}
                    type="button"
                    onClick={() => handlePackChange(pack.id)}
                    className={`w-full p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                      isSelected
                        ? isLight
                          ? 'bg-purple-50 border-purple-500 text-purple-950 shadow-sm'
                          : 'bg-purple-600/30 border-purple-400 text-white shadow-md'
                        : isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        : 'bg-[#141224] border-purple-500/20 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`text-xs font-bold flex items-center gap-1.5 ${
                        isSelected ? (isLight ? 'text-purple-900' : 'text-white') : (isLight ? 'text-slate-800' : 'text-zinc-300')
                      }`}>
                        <span>{packConf.fallbackEmoji}</span>
                        <span>{pack.name}</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 font-bold shrink-0">
                        {pack.lots.length} {packConf.lotLabel}s
                      </span>
                    </div>
                    <div className={`text-[10px] mt-1 ${
                      isLight ? 'text-slate-500' : 'text-zinc-400'
                    }`}>
                      Starting Purse: {pack.currencySymbol}{pack.defaultPurse} {pack.unitLabel} • Min Bid +{pack.currencySymbol}{pack.minIncrement} {pack.unitLabel}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Starting Purse */}
          <div>
            <label className={`block text-xs font-mono font-bold uppercase tracking-wider mb-2 ${
              isLight ? 'text-purple-700' : 'text-purple-300'
            }`}>
              Starting Purse Per Team ({modeConfig.currencySymbol} {modeConfig.unitLabel}):
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
                <span>Launch {modeConfig.badge}</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};
