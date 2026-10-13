import type { FC } from 'react';

interface AvatarDisplayProps {
  avatar: string;
  name?: string;
  sizeClassName?: string;
  className?: string;
}

export const AvatarDisplay: FC<AvatarDisplayProps> = ({
  avatar,
  name = 'Bidder',
  sizeClassName = 'w-10 h-10',
  className = ''
}) => {
  const isImage = avatar && (avatar.startsWith('http') || avatar.startsWith('/') || avatar.includes('dicebear'));

  if (isImage) {
    return (
      <div className={`rounded-2xl overflow-hidden flex items-center justify-center shrink-0 ${sizeClassName} ${className}`}>
        <img
          src={avatar}
          alt={name}
          className="w-full h-full object-contain pointer-events-none select-none"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center shrink-0 select-none ${sizeClassName} ${className}`}>
      <span className="text-2xl">{avatar || '⚡'}</span>
    </div>
  );
};
