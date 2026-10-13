import { useState, useEffect, type FC } from 'react';
import { Sun, Moon, Volume2, VolumeX, LogOut, Gavel } from 'lucide-react';
import { sound } from '../utils/soundEffects';

interface HeaderProps {
  currentRoomCode?: string | null;
  role?: 'host' | 'player' | null;
  onLeaveRoom?: () => void;
  isLight?: boolean;
  onToggleTheme?: () => void;
}

export const Header: FC<HeaderProps> = ({
  currentRoomCode,
  role,
  onLeaveRoom,
  isLight: propIsLight,
  onToggleTheme: propToggleTheme
}) => {
  const [localIsLight, setLocalIsLight] = useState(false);
  const [isMuted, setIsMuted] = useState(sound.getMuted());

  const isLight = propIsLight !== undefined ? propIsLight : localIsLight;

  useEffect(() => {
    if (propIsLight === undefined) {
      try {
        const savedTheme = localStorage.getItem('bauction_theme') || 'dark';
        setLocalIsLight(savedTheme === 'light');
      } catch (e) {}
    }
  }, [propIsLight]);

  const toggleTheme = () => {
    if (propToggleTheme) {
      propToggleTheme();
    } else {
      const next = !localIsLight;
      setLocalIsLight(next);
      if (next) {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
        localStorage.setItem('bauction_theme', 'light');
      } else {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
        localStorage.setItem('bauction_theme', 'dark');
      }
    }
  };

  const toggleSound = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sound.setMuted(nextMuted);
  };

  return (
    <header className={`w-full border-b backdrop-blur-xl sticky top-0 z-40 transition-colors duration-200 ${
      isLight
        ? 'bg-white/90 border-purple-200/80 shadow-sm'
        : 'bg-[#07060F]/90 border-purple-500/20'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center p-1.5 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            <img src="/logo.png" alt="Buildicy Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`font-extrabold text-base sm:text-lg tracking-tight font-title ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                Buildicy <span className="text-purple-500">B-Auction</span>
              </span>
              <span className={`hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                isLight
                  ? 'bg-purple-100 text-purple-700 border-purple-200'
                  : 'bg-purple-500/10 text-purple-300 border-purple-500/30'
              }`}>
                <Gavel size={11} className="text-amber-400" />
                Live Draft Arena
              </span>
            </div>
            <p className={`text-[11px] hidden xs:block ${
              isLight ? 'text-slate-500' : 'text-zinc-400'
            }`}>
              Multiplayer Bidding & Team Auction Engine
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {currentRoomCode && (
            <div className="flex items-center gap-2">
              <div className={`px-2.5 py-1 rounded-xl border text-xs font-mono font-bold ${
                isLight
                  ? 'bg-purple-50 border-purple-200 text-purple-700'
                  : 'bg-[#141224] border-purple-500/30 text-purple-200'
              }`}>
                Room: <span className={isLight ? 'text-purple-900 tracking-wider' : 'text-white tracking-wider'}>{currentRoomCode}</span>
              </div>
              {onLeaveRoom && (
                <button
                  onClick={onLeaveRoom}
                  className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                    isLight
                      ? 'bg-slate-100 hover:bg-red-50 border-slate-200 hover:border-red-200 text-slate-600 hover:text-red-600'
                      : 'bg-white/5 hover:bg-red-500/10 border-white/10 hover:border-red-500/30 text-zinc-400 hover:text-red-300'
                  }`}
                  title="Leave Room"
                >
                  <LogOut size={15} />
                </button>
              )}
            </div>
          )}

          {/* Sound Mute Toggle */}
          <button
            onClick={toggleSound}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isMuted
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                : isLight
                ? 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700'
                : 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30 text-purple-300'
            }`}
            title={isMuted ? 'Unmute Sound FX' : 'Mute Sound FX'}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 hover:text-white'
            }`}
            title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {isLight ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>
      </div>
    </header>
  );
};
