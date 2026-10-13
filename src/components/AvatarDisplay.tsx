import { useState, type FC } from 'react';
import { getIPLTeamByLogo } from '../constants/iplTeams';

interface AvatarDisplayProps {
  avatar: string;
  name?: string;
  sizeClassName?: string;
  className?: string;
  showBadge?: boolean;
}

export const AvatarDisplay: FC<AvatarDisplayProps> = ({
  avatar,
  name = 'Bidder',
  sizeClassName = 'w-10 h-10',
  className = '',
  showBadge = false
}) => {
  const [hasError, setHasError] = useState(false);
  const team = getIPLTeamByLogo(avatar);

  const isImage = !hasError && avatar && (
    avatar.startsWith('/') ||
    avatar.startsWith('http') ||
    avatar.includes('teams') ||
    avatar.includes('dicebear')
  );

  // Fallback initials
  const initials = team?.shortName || name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '🏏';

  if (isImage) {
    return (
      <div
        className={`relative rounded-2xl overflow-hidden flex items-center justify-center shrink-0 transition-transform ${
          team ? 'bg-white/95 p-1 shadow-sm border border-purple-500/20' : 'bg-purple-900/20'
        } ${sizeClassName} ${className}`}
        style={team ? { borderColor: team.primaryColor } : undefined}
      >
        <img
          src={avatar}
          alt={name}
          onError={() => setHasError(true)}
          className="w-full h-full object-contain pointer-events-none select-none drop-shadow-sm"
          loading="lazy"
        />
        {showBadge && team && (
          <span
            className="absolute -bottom-1 -right-1 text-[9px] font-black font-mono px-1 py-0.2 rounded-md text-white shadow"
            style={{ backgroundColor: team.primaryColor }}
          >
            {team.shortName}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl flex items-center justify-center shrink-0 select-none font-black font-mono text-xs border ${
        team
          ? 'text-white shadow-md'
          : 'bg-purple-600/20 border-purple-500/40 text-purple-300'
      } ${sizeClassName} ${className}`}
      style={team ? { backgroundColor: team.primaryColor, borderColor: team.secondaryColor } : undefined}
    >
      <span>{initials}</span>
    </div>
  );
};
