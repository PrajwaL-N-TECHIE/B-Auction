import { useState, useEffect, type FC } from 'react';
import { ArrowRight, Sparkles, Gavel, Shield, Dices, Plus } from 'lucide-react';
import { generateRoomCode, createRoom, joinRoom, subscribeRoom, getCachedRoom } from '../services/auctionSync';
import type { AuctionParticipant, AuctionRoom } from '../types/auction';
import { BUIZ_AVATAR_PRESETS, getRandomAvatar, DEFAULT_AVATAR } from '../constants/avatars';
import { IPL_TEAMS, getIPLTeamByLogo, type IPLTeam } from '../constants/iplTeams';
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
  const [activeRoom, setActiveRoom] = useState<AuctionRoom | null>(null);

  // Live room state subscription for instant duplicate team detection
  useEffect(() => {
    const clean = joinCode.toUpperCase().trim();
    if (clean.length >= 6) {
      const cached = getCachedRoom(clean);
      if (cached) setActiveRoom(cached);

      const unsub = subscribeRoom(clean, (roomUpdate) => {
        setActiveRoom(roomUpdate);
      });
      return () => unsub();
    } else {
      setActiveRoom(null);
    }
  }, [joinCode]);

  // Check taken teams in current room
  const cleanCode = joinCode.toUpperCase().trim();
  const takenParticipants = Object.values(activeRoom?.participants || {});

  const getTakenInfo = (team: IPLTeam) => {
    return takenParticipants.find((p) => {
      const pLogo = (p.avatar || '').split('?')[0].toLowerCase();
      const tLogo = team.logo.split('?')[0].toLowerCase();
      return pLogo === tLogo || pLogo.includes(team.shortName.toLowerCase());
    });
  };

  // If currently selected avatar is taken by another bidder, switch to first available
  useEffect(() => {
    if (!activeRoom || takenParticipants.length === 0) return;
    const clean = joinCode.toUpperCase().trim();
    const myPid = clean ? localStorage.getItem(`bauction_pid_${clean}`) : null;
    const currentTeam = getIPLTeamByLogo(selectedAvatar);
    if (currentTeam) {
      const taken = getTakenInfo(currentTeam);
      if (taken && taken.id !== myPid) {
        const firstAvailable = IPL_TEAMS.find((t) => {
          const tInfo = getTakenInfo(t);
          return !tInfo || tInfo.id === myPid;
        });
        if (firstAvailable) {
          setSelectedAvatar(firstAvailable.logo);
          setTeamName(firstAvailable.name);
        }
      }
    }
  }, [activeRoom?.code, takenParticipants.length, joinCode]);

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
    const clean = joinCode.toUpperCase().trim();
    const myPid = clean ? localStorage.getItem(`bauction_pid_${clean}`) : null;
    const available = IPL_TEAMS.filter((t) => {
      const taken = getTakenInfo(t);
      return !taken || taken.id === myPid;
    });
    if (available.length > 0) {
      const randomTeam = available[Math.floor(Math.random() * available.length)];
      setSelectedAvatar(randomTeam.logo);
      setTeamName(randomTeam.name);
    } else {
      setSelectedAvatar(getRandomAvatar());
    }
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
      // Re-use saved participant ID for this room so page refresh does not trigger duplicate error
      const storagePidKey = `bauction_pid_${cleanCode}`;
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

        // 2. Check duplicate IPL franchise logo
        const duplicateAvatar = otherParticipants.find((p) => {
          if (!p.avatar) return false;
          const pLogo = p.avatar.split('?')[0].toLowerCase();
          const chosenLogo = selectedAvatar.split('?')[0].toLowerCase();
          return pLogo === chosenLogo;
        });
        if (duplicateAvatar) {
          setErrorMsg(`This IPL franchise has already been chosen by "${duplicateAvatar.name}". Duplicate franchise entries are strictly not allowed!`);
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

          {/* IPL Franchise / Team Avatar Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`text-xs font-mono font-bold uppercase tracking-wider ${
                isLight ? 'text-purple-700' : 'text-purple-300'
              }`}>
                Choose IPL Franchise:
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

            {/* Selected IPL Team Highlight Banner */}
            {(() => {
              const currentTeam = getIPLTeamByLogo(selectedAvatar) || IPL_TEAMS[0];
              return (
                <div
                  className="mb-3 p-3 rounded-2xl border flex items-center gap-3 transition-all shadow-md"
                  style={{
                    backgroundColor: isLight ? '#faf5ff' : 'rgba(24, 18, 43, 0.9)',
                    borderColor: currentTeam.primaryColor
                  }}
                >
                  <div className="w-14 h-14 p-1.5 rounded-xl bg-white shadow-sm border border-purple-100 flex items-center justify-center shrink-0">
                    <img
                      src={currentTeam.logo}
                      alt={currentTeam.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black font-title truncate text-slate-900 dark:text-white">
                        {currentTeam.name}
                      </span>
                      <span
                        className="text-[10px] font-black font-mono px-1.5 py-0.5 rounded text-white shrink-0"
                        style={{ backgroundColor: currentTeam.primaryColor }}
                      >
                        {currentTeam.shortName}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-purple-600 dark:text-purple-300 truncate mt-0.5">
                      {currentTeam.tagline}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* 10 IPL Teams Grid */}
            <div className="grid grid-cols-5 gap-2">
              {IPL_TEAMS.map((team) => {
                const clean = joinCode.toUpperCase().trim();
                const myPid = clean ? localStorage.getItem(`bauction_pid_${clean}`) : null;
                const takenInfo = getTakenInfo(team);
                const isTakenByOther = Boolean(takenInfo && takenInfo.id !== myPid);
                const isMyTeam = Boolean(takenInfo && takenInfo.id === myPid);
                const isSelected = selectedAvatar === team.logo || selectedAvatar.includes(team.shortName.toLowerCase());

                return (
                  <button
                    key={team.id}
                    type="button"
                    disabled={isTakenByOther}
                    onClick={() => {
                      if (isTakenByOther) return;
                      setSelectedAvatar(team.logo);
                      setTeamName(team.name);
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
                      borderColor: team.primaryColor,
                      backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.1)'
                    } : undefined}
                    title={
                      isTakenByOther
                        ? `Claimed by ${takenInfo?.name || 'another team'} - Duplicate entries not allowed`
                        : `${team.name} (${team.shortName})`
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
                        src={team.logo}
                        alt={team.shortName}
                        className="w-full h-full object-contain pointer-events-none drop-shadow-sm"
                        loading="lazy"
                      />
                    </div>
                    <span
                      className="text-[10px] font-mono font-black tracking-tight"
                      style={{ color: isTakenByOther ? '#ef4444' : team.primaryColor }}
                    >
                      {team.shortName}
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
