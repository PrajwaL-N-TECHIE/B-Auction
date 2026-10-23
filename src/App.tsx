import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { LobbyView } from './components/LobbyView';
import { HostView } from './components/HostView';
import { PlayerView } from './components/PlayerView';
import { subscribeRoom, getCachedRoom, registerHost, unregisterHost } from './services/auctionSync';
import type { AuctionRoom, AuctionParticipant } from './types/auction';

export default function App() {
  const [role, setRole] = useState<'host' | 'player' | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [currentRoom, setCurrentRoom] = useState<AuctionRoom | null>(null);
  const [currentParticipant, setCurrentParticipant] = useState<AuctionParticipant | null>(null);
  const [urlRoomCode, setUrlRoomCode] = useState<string>('');
  const [isLight, setIsLight] = useState<boolean>(() => {
    try {
      return localStorage.getItem('bauction_theme') === 'light';
    } catch {
      return false;
    }
  });

  // Apply theme class to document root
  useEffect(() => {
    if (isLight) {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  }, [isLight]);

  const toggleTheme = () => {
    setIsLight((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('bauction_theme', next ? 'light' : 'dark');
      } catch {}
      return next;
    });
  };

  // Check URL query parameter (?room=AUC-729) & restore tab session
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const r = params.get('room');
      if (r) {
        setUrlRoomCode(r.toUpperCase().trim());
      }

      // Check tab-isolated session
      try {
        const savedRole = sessionStorage.getItem('bauction_tab_role') as 'host' | 'player' | null;
        const savedCode = sessionStorage.getItem('bauction_tab_code');
        const savedPid = sessionStorage.getItem('bauction_tab_active_pid');

        if (savedRole && savedCode) {
          const cleanCode = savedCode.toUpperCase().trim();
          const cached = getCachedRoom(cleanCode);
          if (cached) {
            setRoomCode(cleanCode);
            setRole(savedRole);
            if (savedRole === 'host') {
              registerHost(cleanCode);
            }
            setCurrentRoom(cached);
            if (savedRole === 'player' && savedPid && cached.participants[savedPid]) {
              setCurrentParticipant(cached.participants[savedPid]);
            }
          }
        }
      } catch {}
    }
  }, []);

  // Real-time synchronization subscription
  useEffect(() => {
    if (!roomCode) {
      setCurrentRoom(null);
      return;
    }

    const unsubscribe = subscribeRoom(
      roomCode,
      (updatedRoom) => {
        setCurrentRoom(updatedRoom);
        if (currentParticipant && updatedRoom.participants[currentParticipant.id]) {
          setCurrentParticipant(updatedRoom.participants[currentParticipant.id]);
        }
      },
      role || 'player'
    );

    return () => {
      unsubscribe();
    };
  }, [roomCode, role, currentParticipant?.id]);

  const handleJoinAsHost = (code: string) => {
    const cleanCode = code.toUpperCase().trim();
    registerHost(cleanCode);
    setRole('host');
    setRoomCode(cleanCode);
    try {
      sessionStorage.setItem('bauction_tab_role', 'host');
      sessionStorage.setItem('bauction_tab_code', cleanCode);
      sessionStorage.removeItem('bauction_tab_active_pid');
    } catch {}
    const cached = getCachedRoom(cleanCode);
    if (cached) {
      setCurrentRoom(cached);
    }
    // Update URL query parameter
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('room', cleanCode);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const handleJoinAsPlayer = (code: string, participant: AuctionParticipant) => {
    const cleanCode = code.toUpperCase().trim();
    setRole('player');
    setRoomCode(cleanCode);
    setCurrentParticipant(participant);
    try {
      sessionStorage.setItem('bauction_tab_role', 'player');
      sessionStorage.setItem('bauction_tab_code', cleanCode);
      sessionStorage.setItem('bauction_tab_active_pid', participant.id);
    } catch {}
    const cached = getCachedRoom(cleanCode);
    if (cached) {
      setCurrentRoom({
        ...cached,
        participants: {
          ...(cached.participants || {}),
          [participant.id]: participant
        }
      });
    }
    // Update URL query parameter
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('room', cleanCode);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const handleLeaveRoom = () => {
    if (roomCode) {
      unregisterHost(roomCode);
    }
    setRole(null);
    setRoomCode(null);
    setCurrentRoom(null);
    setCurrentParticipant(null);
    try {
      sessionStorage.removeItem('bauction_tab_role');
      sessionStorage.removeItem('bauction_tab_code');
      sessionStorage.removeItem('bauction_tab_active_pid');
    } catch {}
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('room');
      window.history.replaceState({}, '', url.toString());
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${
      isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#050507] text-white'
    }`}>
      {/* Buildicy Top Navigation */}
      <Header
        currentRoomCode={roomCode}
        role={role}
        onLeaveRoom={roomCode ? handleLeaveRoom : undefined}
        isLight={isLight}
        onToggleTheme={toggleTheme}
      />

      {/* Main View Container */}
      <main className="flex-1 flex flex-col">
        {!role || !roomCode ? (
          <LobbyView
            onJoinAsHost={handleJoinAsHost}
            onJoinAsPlayer={handleJoinAsPlayer}
            initialRoomCode={urlRoomCode}
            isLight={isLight}
          />
        ) : role === 'host' && currentRoom ? (
          <HostView
            room={currentRoom}
            onLeaveRoom={handleLeaveRoom}
            isLight={isLight}
          />
        ) : role === 'player' && currentRoom && currentParticipant ? (
          <PlayerView
            room={currentRoom}
            participant={currentParticipant}
            isLight={isLight}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-400">
            <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className={`text-sm font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
              Connecting to Auction Arena {roomCode}...
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
