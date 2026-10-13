import { IPL_TEAMS, type IPLTeam } from './iplTeams';

export interface BuizAvatar {
  id: string;
  name: string;
  shortName?: string;
  url: string;
  primaryColor?: string;
  secondaryColor?: string;
  tagline?: string;
}

// Official IPL Team Logos as primary avatars
export const IPL_AVATAR_PRESETS: BuizAvatar[] = IPL_TEAMS.map(team => ({
  id: team.id,
  name: team.name,
  shortName: team.shortName,
  url: team.logo,
  primaryColor: team.primaryColor,
  secondaryColor: team.secondaryColor,
  tagline: team.tagline
}));

export const BUIZ_AVATAR_PRESETS: BuizAvatar[] = IPL_AVATAR_PRESETS;

export function getRandomAvatar(): string {
  const randomIndex = Math.floor(Math.random() * BUIZ_AVATAR_PRESETS.length);
  return BUIZ_AVATAR_PRESETS[randomIndex].url;
}

export const DEFAULT_AVATAR = BUIZ_AVATAR_PRESETS[0].url; // RCB Logo
