export interface BuizAvatar {
  id: string;
  name: string;
  url: string;
}

export const BUIZ_AVATAR_PRESETS: BuizAvatar[] = [
  {
    id: 'CosmicHero',
    name: 'Cosmic Hero',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=CosmicHero'
  },
  {
    id: 'CodeNinja',
    name: 'Code Ninja',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=CodeNinja'
  },
  {
    id: 'NeonTiger',
    name: 'Neon Tiger',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=NeonTiger'
  },
  {
    id: 'PixelWizard',
    name: 'Pixel Wizard',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=PixelWizard'
  },
  {
    id: 'CyberKnight',
    name: 'Cyber Knight',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=CyberKnight'
  },
  {
    id: 'AstroFox',
    name: 'Astro Fox',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=AstroFox'
  },
  {
    id: 'QuantumPanda',
    name: 'Quantum Panda',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=QuantumPanda'
  },
  {
    id: 'ViperRacer',
    name: 'Viper Racer',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=ViperRacer'
  },
  {
    id: 'ShadowEcho',
    name: 'Shadow Echo',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=ShadowEcho'
  },
  {
    id: 'NovaSpark',
    name: 'Nova Spark',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=NovaSpark'
  },
  {
    id: 'BlazeRider',
    name: 'Blaze Rider',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=BlazeRider'
  },
  {
    id: 'LunarPilot',
    name: 'Lunar Pilot',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=LunarPilot'
  }
];

export function getRandomAvatar(): string {
  const randomIndex = Math.floor(Math.random() * BUIZ_AVATAR_PRESETS.length);
  return BUIZ_AVATAR_PRESETS[randomIndex].url;
}

export const DEFAULT_AVATAR = BUIZ_AVATAR_PRESETS[0].url;
