import { IPL_TEAMS, type IPLTeam } from './iplTeams';

export type AuctionMode = 'cricket' | 'football' | 'startup' | 'cyberpunk' | 'custom';

export interface ModeAvatar {
  id: string;
  name: string;
  shortName: string;
  logo: string;
  primaryColor: string;
  secondaryColor?: string;
  tagline: string;
}

export interface AuctionModeConfig {
  id: AuctionMode;
  name: string;
  badge: string;
  heroTagline: string;
  teamFieldLabel: string;
  teamPlaceholder: string;
  avatarSelectorLabel: string;
  lotLabel: string;
  squadLabel: string;
  currencySymbol: string;
  unitLabel: string;
  fallbackEmoji: string;
  defaultPurse: number;
  minIncrement: number;
  avatars: ModeAvatar[];
}

function makeSvg(inner: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${inner}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// ==========================================
// 1. CRICKET / IPL MODE AVATARS (10 Teams)
// ==========================================
export const CRICKET_AVATARS: ModeAvatar[] = IPL_TEAMS.map((team) => ({
  id: team.id,
  name: team.name,
  shortName: team.shortName,
  logo: team.logo,
  primaryColor: team.primaryColor,
  secondaryColor: team.secondaryColor,
  tagline: team.tagline
}));

// ==========================================
// 2. FOOTBALL / SOCCER CLUBS (10 Clubs)
// ==========================================
export const FOOTBALL_AVATARS: ModeAvatar[] = [
  {
    id: 'rma',
    name: 'Real Madrid CF',
    shortName: 'RMA',
    logo: makeSvg(`
      <circle cx="50" cy="50" r="46" fill="#FEBE10"/>
      <circle cx="50" cy="50" r="40" fill="#00529F"/>
      <circle cx="50" cy="50" r="34" fill="#FFFFFF"/>
      <path d="M22 68 L78 32" stroke="#FEBE10" stroke-width="8" stroke-linecap="round"/>
      <path d="M50 20 L58 35 L42 35 Z" fill="#FEBE10"/>
      <text x="50" y="58" font-family="sans-serif" font-weight="900" font-size="20" text-anchor="middle" fill="#00529F">RMA</text>
    `),
    primaryColor: '#FEBE10',
    secondaryColor: '#00529F',
    tagline: '¡Hala Madrid! ...y nada más'
  },
  {
    id: 'fcb',
    name: 'FC Barcelona',
    shortName: 'FCB',
    logo: makeSvg(`
      <path d="M15 25 Q50 15 85 25 Q85 65 50 88 Q15 65 15 25 Z" fill="#004D98" stroke="#EDBB00" stroke-width="4"/>
      <path d="M35 23 L35 80" stroke="#A50044" stroke-width="8"/>
      <path d="M65 23 L65 80" stroke="#A50044" stroke-width="8"/>
      <rect x="25" y="44" width="50" height="12" fill="#EDBB00" rx="3"/>
      <text x="50" y="53" font-family="sans-serif" font-weight="900" font-size="9" text-anchor="middle" fill="#004D98">FCB</text>
    `),
    primaryColor: '#A50044',
    secondaryColor: '#004D98',
    tagline: 'Més que un club'
  },
  {
    id: 'mci',
    name: 'Manchester City',
    shortName: 'MCI',
    logo: makeSvg(`
      <circle cx="50" cy="50" r="46" fill="#6CABDD"/>
      <circle cx="50" cy="50" r="38" fill="#1C2C5B"/>
      <circle cx="50" cy="50" r="30" fill="#FFFFFF"/>
      <path d="M36 42 Q50 30 64 42 L60 52 L40 52 Z" fill="#6CABDD"/>
      <path d="M34 56 Q50 64 66 56" stroke="#C8102E" stroke-width="4" fill="none"/>
      <text x="50" y="74" font-family="sans-serif" font-weight="900" font-size="9" text-anchor="middle" fill="#1C2C5B">CITY</text>
    `),
    primaryColor: '#6CABDD',
    secondaryColor: '#1C2C5B',
    tagline: 'Superbia in Proelio'
  },
  {
    id: 'liv',
    name: 'Liverpool FC',
    shortName: 'LIV',
    logo: makeSvg(`
      <path d="M18 20 Q50 12 82 20 Q82 68 50 90 Q18 68 18 20 Z" fill="#C8102E" stroke="#00B2A9" stroke-width="4"/>
      <path d="M48 30 Q54 36 50 48 Q56 46 58 54 Q48 54 44 64 Q46 52 40 46 Q46 44 48 30 Z" fill="#FFFFFF"/>
      <text x="50" y="78" font-family="sans-serif" font-weight="900" font-size="11" text-anchor="middle" fill="#FFFFFF">LFC</text>
    `),
    primaryColor: '#C8102E',
    secondaryColor: '#00B2A9',
    tagline: "You'll Never Walk Alone"
  },
  {
    id: 'ars',
    name: 'Arsenal FC',
    shortName: 'ARS',
    logo: makeSvg(`
      <path d="M18 22 Q50 14 82 22 Q82 66 50 88 Q18 66 18 22 Z" fill="#EF0107" stroke="#063672" stroke-width="4"/>
      <rect x="30" y="44" width="40" height="8" rx="3" fill="#FFFFFF"/>
      <circle cx="36" cy="52" r="7" fill="#063672" stroke="#FFFFFF" stroke-width="2"/>
      <circle cx="64" cy="52" r="7" fill="#063672" stroke="#FFFFFF" stroke-width="2"/>
      <text x="50" y="36" font-family="sans-serif" font-weight="900" font-size="10" text-anchor="middle" fill="#FFFFFF">GUNNERS</text>
    `),
    primaryColor: '#EF0107',
    secondaryColor: '#063672',
    tagline: 'Victoria Concordia Crescit'
  },
  {
    id: 'bay',
    name: 'FC Bayern München',
    shortName: 'BAY',
    logo: makeSvg(`
      <circle cx="50" cy="50" r="46" fill="#DC052D"/>
      <circle cx="50" cy="50" r="38" fill="#FFFFFF"/>
      <circle cx="50" cy="50" r="30" fill="#0066B2"/>
      <path d="M30 40 L50 30 L70 40 L50 50 Z M30 60 L50 50 L70 60 L50 70 Z" fill="#FFFFFF" opacity="0.85"/>
      <text x="50" y="86" font-family="sans-serif" font-weight="900" font-size="9" text-anchor="middle" fill="#FFFFFF">BAYERN</text>
    `),
    primaryColor: '#DC052D',
    secondaryColor: '#0066B2',
    tagline: 'Mia San Mia'
  },
  {
    id: 'psg',
    name: 'Paris Saint-Germain',
    shortName: 'PSG',
    logo: makeSvg(`
      <circle cx="50" cy="50" r="46" fill="#004170"/>
      <circle cx="50" cy="50" r="38" fill="#FFFFFF"/>
      <circle cx="50" cy="50" r="30" fill="#004170"/>
      <path d="M50 25 L43 65 L57 65 Z M40 50 L60 50" stroke="#DA291C" stroke-width="3" fill="#DA291C"/>
      <circle cx="50" cy="62" r="3" fill="#FFFFFF"/>
      <text x="50" y="84" font-family="sans-serif" font-weight="900" font-size="9" text-anchor="middle" fill="#FFFFFF">PARIS</text>
    `),
    primaryColor: '#004170',
    secondaryColor: '#DA291C',
    tagline: 'Ici c’est Paris'
  },
  {
    id: 'juv',
    name: 'Juventus FC',
    shortName: 'JUV',
    logo: makeSvg(`
      <rect x="8" y="8" width="84" height="84" rx="20" fill="#000000"/>
      <path d="M35 24 L35 62 Q35 74 48 74 Q56 74 56 66 L56 46" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round" fill="none"/>
      <path d="M68 24 L68 54 Q68 62 62 66" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round" fill="none"/>
      <text x="50" y="86" font-family="sans-serif" font-weight="900" font-size="8" text-anchor="middle" fill="#D4AF37">JUVENTUS</text>
    `),
    primaryColor: '#000000',
    secondaryColor: '#D4AF37',
    tagline: 'Fino Alla Fine'
  },
  {
    id: 'int',
    name: 'Inter Milan',
    shortName: 'INT',
    logo: makeSvg(`
      <circle cx="50" cy="50" r="46" fill="#0066B2"/>
      <circle cx="50" cy="50" r="38" fill="#000000"/>
      <circle cx="50" cy="50" r="30" fill="#0066B2"/>
      <circle cx="50" cy="50" r="22" fill="#000000"/>
      <text x="50" y="58" font-family="sans-serif" font-weight="900" font-size="22" text-anchor="middle" fill="#FFFFFF">IM</text>
    `),
    primaryColor: '#0066B2',
    secondaryColor: '#000000',
    tagline: 'Not For Everyone'
  },
  {
    id: 'che',
    name: 'Chelsea FC',
    shortName: 'CHE',
    logo: makeSvg(`
      <circle cx="50" cy="50" r="46" fill="#034694"/>
      <circle cx="50" cy="50" r="38" fill="#FFFFFF"/>
      <circle cx="50" cy="50" r="30" fill="#034694"/>
      <path d="M48 30 Q56 30 52 42 Q60 44 56 56 Q44 54 46 68" stroke="#DBA111" stroke-width="4" stroke-linecap="round" fill="none"/>
      <text x="50" y="85" font-family="sans-serif" font-weight="900" font-size="8" text-anchor="middle" fill="#FFFFFF">CHELSEA</text>
    `),
    primaryColor: '#034694',
    secondaryColor: '#DBA111',
    tagline: 'Pride of London'
  }
];

// ==========================================
// 3. STARTUP / TECH UNICORN BRANDS (10 Brands)
// ==========================================
export const STARTUP_AVATARS: ModeAvatar[] = [
  {
    id: 'nex',
    name: 'Nexus AI Capital',
    shortName: 'NEX',
    logo: makeSvg(`
      <rect x="8" y="8" width="84" height="84" rx="24" fill="#0F0D1E" stroke="#8B5CF6" stroke-width="4"/>
      <circle cx="50" cy="36" r="10" fill="#8B5CF6"/>
      <circle cx="30" cy="66" r="8" fill="#06B6D4"/>
      <circle cx="70" cy="66" r="8" fill="#A855F7"/>
      <line x1="50" y1="36" x2="30" y2="66" stroke="#8B5CF6" stroke-width="4"/>
      <line x1="50" y1="36" x2="70" y2="66" stroke="#A855F7" stroke-width="4"/>
      <line x1="30" y1="66" x2="70" y2="66" stroke="#06B6D4" stroke-width="3"/>
    `),
    primaryColor: '#8B5CF6',
    secondaryColor: '#06B6D4',
    tagline: 'Scaling Autonomous Intelligence'
  },
  {
    id: 'hrz',
    name: 'Horizon Ventures',
    shortName: 'HRZ',
    logo: makeSvg(`
      <rect x="8" y="8" width="84" height="84" rx="24" fill="#052E16" stroke="#10B981" stroke-width="4"/>
      <path d="M20 70 L40 40 L55 55 L75 25" stroke="#10B981" stroke-width="7" stroke-linecap="round" fill="none"/>
      <circle cx="75" cy="25" r="5" fill="#34D399"/>
      <text x="50" y="84" font-family="sans-serif" font-weight="900" font-size="10" text-anchor="middle" fill="#34D399">HORIZON</text>
    `),
    primaryColor: '#10B981',
    secondaryColor: '#34D399',
    tagline: 'Seed to IPO Hyper-Acceleration'
  },
  {
    id: 'cbd',
    name: 'Cyberdyne Robotics',
    shortName: 'CBD',
    logo: makeSvg(`
      <rect x="8" y="8" width="84" height="84" rx="24" fill="#0B132B" stroke="#3B82F6" stroke-width="4"/>
      <polygon points="50,20 78,36 78,68 50,84 22,68 22,36" fill="#1C2541" stroke="#3B82F6" stroke-width="4"/>
      <circle cx="50" cy="52" r="10" fill="#60A5FA"/>
      <circle cx="50" cy="52" r="4" fill="#FFFFFF"/>
    `),
    primaryColor: '#3B82F6',
    secondaryColor: '#60A5FA',
    tagline: 'Sub-10ms Hardware Systems'
  },
  {
    id: 'apx',
    name: 'Apex Founder Fund',
    shortName: 'APX',
    logo: makeSvg(`
      <rect x="8" y="8" width="84" height="84" rx="24" fill="#1C1917" stroke="#F59E0B" stroke-width="4"/>
      <polygon points="50,18 82,74 18,74" fill="none" stroke="#F59E0B" stroke-width="8" stroke-linejoin="round"/>
      <polygon points="50,38 66,70 34,70" fill="#F59E0B"/>
    `),
    primaryColor: '#F59E0B',
    secondaryColor: '#FBBF24',
    tagline: 'Backing 100x Category Creators'
  },
  {
    id: 'qtm',
    name: 'Quantum Guild',
    shortName: 'QTM',
    logo: makeSvg(`
      <rect x="8" y="8" width="84" height="84" rx="24" fill="#1E1B4B" stroke="#6366F1" stroke-width="4"/>
      <circle cx="50" cy="50" r="12" fill="#818CF8"/>
      <ellipse cx="50" cy="50" rx="34" ry="12" stroke="#6366F1" stroke-width="3" fill="none" transform="rotate(30 50 50)"/>
      <ellipse cx="50" cy="50" rx="34" ry="12" stroke="#A855F7" stroke-width="3" fill="none" transform="rotate(-30 50 50)"/>
    `),
    primaryColor: '#6366F1',
    secondaryColor: '#A855F7',
    tagline: 'Supercomputing Frontier'
  },
  {
    id: 'vng',
    name: 'Vanguard Studio',
    shortName: 'VNG',
    logo: makeSvg(`
      <rect x="8" y="8" width="84" height="84" rx="24" fill="#2A0808" stroke="#EF4444" stroke-width="4"/>
      <path d="M22 30 L50 74 L78 30" stroke="#EF4444" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M36 30 L50 54 L64 30" stroke="#F87171" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    `),
    primaryColor: '#EF4444',
    secondaryColor: '#F87171',
    tagline: 'Zero-to-One Product Engines'
  },
  {
    id: 'mtx',
    name: 'Matrix Syndicate',
    shortName: 'MTX',
    logo: makeSvg(`
      <rect x="8" y="8" width="84" height="84" rx="24" fill="#052E16" stroke="#84CC16" stroke-width="4"/>
      <rect x="26" y="26" width="16" height="16" fill="#84CC16" rx="3"/>
      <rect x="58" y="26" width="16" height="16" fill="#84CC16" rx="3"/>
      <rect x="26" y="58" width="16" height="16" fill="#84CC16" rx="3"/>
      <rect x="58" y="58" width="16" height="16" fill="#A3E635" rx="3"/>
      <path d="M34 42 L34 58 M66 42 L66 58 M42 34 L58 34" stroke="#84CC16" stroke-width="3"/>
    `),
    primaryColor: '#84CC16',
    secondaryColor: '#A3E635',
    tagline: 'Decentralized Infrastructure'
  },
  {
    id: 'seq',
    name: 'Sequoia Next',
    shortName: 'SEQ',
    logo: makeSvg(`
      <rect x="8" y="8" width="84" height="84" rx="24" fill="#064E3B" stroke="#059669" stroke-width="4"/>
      <path d="M50 20 L68 45 L58 45 L74 65 L26 65 L42 45 L32 45 Z" fill="#10B981"/>
      <rect x="47" y="65" width="6" height="15" fill="#34D399"/>
    `),
    primaryColor: '#059669',
    secondaryColor: '#10B981',
    tagline: 'Compounding Legendary Companies'
  },
  {
    id: 'ysy',
    name: 'Y-Foundry Labs',
    shortName: 'YSY',
    logo: makeSvg(`
      <rect x="8" y="8" width="84" height="84" rx="24" fill="#431407" stroke="#F97316" stroke-width="4"/>
      <path d="M26 26 L50 54 L74 26 M50 54 L50 78" stroke="#F97316" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>
    `),
    primaryColor: '#F97316',
    secondaryColor: '#FB923C',
    tagline: 'Make Something People Want'
  },
  {
    id: 'sth',
    name: 'Stealth Unicorn',
    shortName: 'STH',
    logo: makeSvg(`
      <rect x="8" y="8" width="84" height="84" rx="24" fill="#3B0764" stroke="#EC4899" stroke-width="4"/>
      <polygon points="50,15 58,45 42,45" fill="#EC4899"/>
      <circle cx="50" cy="58" r="18" fill="#A855F7"/>
      <circle cx="50" cy="58" r="8" fill="#F472B6"/>
      <polygon points="72,25 75,32 68,30" fill="#F472B6"/>
    `),
    primaryColor: '#EC4899',
    secondaryColor: '#F472B6',
    tagline: 'Silent Giants in Hyper-Growth'
  }
];

// ==========================================
// 4. CYBERPUNK / MEGACORP EMBLEMS (10 Factions)
// ==========================================
export const CYBERPUNK_AVATARS: ModeAvatar[] = [
  {
    id: 'ara',
    name: 'Arasaka Security',
    shortName: 'ARA',
    logo: makeSvg(`
      <rect x="8" y="8" width="84" height="84" rx="20" fill="#0C0A09" stroke="#DC2626" stroke-width="4"/>
      <circle cx="50" cy="50" r="12" fill="#DC2626"/>
      <path d="M50 20 L50 34 M50 66 L50 80 M20 50 L34 50 M66 50 L80 50" stroke="#DC2626" stroke-width="7" stroke-linecap="round"/>
      <text x="50" y="76" font-family="monospace" font-weight="900" font-size="8" text-anchor="middle" fill="#EF4444">ARASAKA</text>
    `),
    primaryColor: '#DC2626',
    secondaryColor: '#EF4444',
    tagline: 'Subjugation Through Superiority'
  },
  {
    id: 'mlt',
    name: 'Militech Defense',
    shortName: 'MLT',
    logo: makeSvg(`
      <rect x="8" y="8" width="84" height="84" rx="20" fill="#082F49" stroke="#06B6D4" stroke-width="4"/>
      <path d="M22 36 L50 20 L78 36 L78 64 L50 80 L22 64 Z" stroke="#06B6D4" stroke-width="5" fill="none"/>
      <polygon points="50,30 68,44 68,60 50,70 32,60 32,44" fill="#06B6D4"/>
    `),
    primaryColor: '#06B6D4',
    secondaryColor: '#38BDF8',
    tagline: 'Peace Through Lethality'
  },
  {
    id: 'wey',
    name: 'Weyland Yutani',
    shortName: 'WEY',
    logo: makeSvg(`
      <rect x="8" y="8" width="84" height="84" rx="20" fill="#1C1917" stroke="#EAB308" stroke-width="4"/>
      <path d="M18 34 L32 72 L46 34 L60 72 L74 34" stroke="#EAB308" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <text x="50" y="82" font-family="monospace" font-weight="900" font-size="7" text-anchor="middle" fill="#EAB308">BUILDING BETTER WORLDS</text>
    `),
    primaryColor: '#EAB308',
    secondaryColor: '#FACC15',
    tagline: 'Building Better Worlds'
  },
  {
    id: 'tyr',
    name: 'Tyrell BioTech',
    shortName: 'TYR',
    logo: makeSvg(`
      <rect x="8" y="8" width="84" height="84" rx="20" fill="#1E0A3C" stroke="#A855F7" stroke-width="4"/>
      <polygon points="50,18 84,72 16,72" fill="#581C87" stroke="#A855F7" stroke-width="5"/>
      <circle cx="50" cy="52" r="10" fill="#C084FC"/>
      <circle cx="50" cy="52" r="4" fill="#FFFFFF"/>
    `),
    primaryColor: '#A855F7',
    secondaryColor: '#C084FC',
    tagline: 'More Human Than Human'
  },
  {
    id: 'omn',
    name: 'OmniCorp Defense',
    shortName: 'OMN',
    logo: makeSvg(`
      <rect x="8" y="8" width="84" height="84" rx="20" fill="#0F172A" stroke="#2563EB" stroke-width="4"/>
      <circle cx="50" cy="50" r="28" stroke="#2563EB" stroke-width="6" fill="none"/>
      <rect x="36" y="36" width="28" height="28" fill="#3B82F6" rx="4"/>
      <text x="50" y="84" font-family="monospace" font-weight="900" font-size="8" text-anchor="middle" fill="#60A5FA">OMNICORP</text>
    `),
    primaryColor: '#2563EB',
    secondaryColor: '#60A5FA',
    tagline: 'Serving The Public Trust'
  },
  {
    id: 'shn',
    name: 'Shinra Electric',
    shortName: 'SHN',
    logo: makeSvg(`
      <rect x="8" y="8" width="84" height="84" rx="20" fill="#022C22" stroke="#10B981" stroke-width="4"/>
      <circle cx="50" cy="50" r="26" stroke="#10B981" stroke-width="4" fill="none"/>
      <path d="M50 16 L50 84 M16 50 L84 50" stroke="#10B981" stroke-width="4"/>
      <circle cx="50" cy="50" r="12" fill="#34D399"/>
    `),
    primaryColor: '#10B981',
    secondaryColor: '#34D399',
    tagline: 'Powering The Planet'
  },
  {
    id: 'cyb',
    name: 'Cyberdyne SkyNet',
    shortName: 'CYB',
    logo: makeSvg(`
      <rect x="8" y="8" width="84" height="84" rx="20" fill="#1C0A10" stroke="#F43F5E" stroke-width="4"/>
      <circle cx="50" cy="50" r="24" fill="#881337" stroke="#F43F5E" stroke-width="3"/>
      <circle cx="40" cy="46" r="6" fill="#F43F5E"/>
      <circle cx="60" cy="46" r="6" fill="#F43F5E"/>
      <line x1="36" y1="62" x2="64" y2="62" stroke="#FDA4AF" stroke-width="4" stroke-linecap="round"/>
    `),
    primaryColor: '#F43F5E',
    secondaryColor: '#FDA4AF',
    tagline: 'The Future Is Already Decided'
  },
  {
    id: 'vlt',
    name: 'Vault-Tec Dynamics',
    shortName: 'VLT',
    logo: makeSvg(`
      <rect x="8" y="8" width="84" height="84" rx="20" fill="#1E3A8A" stroke="#FACC15" stroke-width="4"/>
      <circle cx="50" cy="50" r="24" fill="#FACC15"/>
      <circle cx="50" cy="50" r="14" fill="#1E3A8A"/>
      <path d="M50 16 L50 26 M50 74 L50 84 M16 50 L26 50 M74 50 L84 50" stroke="#FACC15" stroke-width="8" stroke-linecap="round"/>
    `),
    primaryColor: '#3B82F6',
    secondaryColor: '#FACC15',
    tagline: 'Revolutionizing Tomorrow'
  },
  {
    id: 'crb',
    name: 'Cerberus Fleet',
    shortName: 'CRB',
    logo: makeSvg(`
      <rect x="8" y="8" width="84" height="84" rx="20" fill="#1F130B" stroke="#EA580C" stroke-width="4"/>
      <path d="M24 30 L40 70 M50 20 L50 74 M76 30 L60 70" stroke="#EA580C" stroke-width="7" stroke-linecap="round"/>
      <text x="50" y="84" font-family="monospace" font-weight="900" font-size="8" text-anchor="middle" fill="#FB923C">CERBERUS</text>
    `),
    primaryColor: '#EA580C',
    secondaryColor: '#FB923C',
    tagline: "Humanity's Absolute Apex"
  },
  {
    id: 'tri',
    name: 'TriOptimum Cyber',
    shortName: 'TRI',
    logo: makeSvg(`
      <rect x="8" y="8" width="84" height="84" rx="20" fill="#042F2E" stroke="#14B8A6" stroke-width="4"/>
      <polygon points="50,22 78,74 22,74" fill="none" stroke="#14B8A6" stroke-width="8" stroke-linejoin="round"/>
      <circle cx="50" cy="56" r="6" fill="#2DD4BF"/>
    `),
    primaryColor: '#14B8A6',
    secondaryColor: '#2DD4BF',
    tagline: 'The Networked Sentience'
  }
];

// ==========================================
// 5. UNIVERSAL / CUSTOM CLAN MASCOTS (10 Mascots)
// ==========================================
export const CUSTOM_AVATARS: ModeAvatar[] = [
  {
    id: 'phx',
    name: 'Solar Phoenix',
    shortName: 'PHX',
    logo: makeSvg(`
      <circle cx="50" cy="50" r="46" fill="#78350F" stroke="#F59E0B" stroke-width="4"/>
      <path d="M50 24 Q68 40 60 62 Q50 56 40 62 Q32 40 50 24 Z" fill="#F59E0B"/>
      <circle cx="50" cy="38" r="4" fill="#FEF08A"/>
    `),
    primaryColor: '#F59E0B',
    secondaryColor: '#FEF08A',
    tagline: 'Rising Unconquered'
  },
  {
    id: 'flc',
    name: 'Storm Falcon',
    shortName: 'FLC',
    logo: makeSvg(`
      <circle cx="50" cy="50" r="46" fill="#0C4A6E" stroke="#0EA5E9" stroke-width="4"/>
      <path d="M24 38 L50 22 L76 38 L50 78 Z" fill="#0284C7" stroke="#38BDF8" stroke-width="3"/>
    `),
    primaryColor: '#0EA5E9',
    secondaryColor: '#38BDF8',
    tagline: 'Speed From Above'
  },
  {
    id: 'pth',
    name: 'Shadow Panther',
    shortName: 'PTH',
    logo: makeSvg(`
      <circle cx="50" cy="50" r="46" fill="#1E1B4B" stroke="#8B5CF6" stroke-width="4"/>
      <polygon points="30,30 40,46 26,52" fill="#8B5CF6"/>
      <polygon points="70,30 60,46 74,52" fill="#8B5CF6"/>
      <circle cx="40" cy="54" r="4" fill="#C084FC"/>
      <circle cx="60" cy="54" r="4" fill="#C084FC"/>
    `),
    primaryColor: '#8B5CF6',
    secondaryColor: '#C084FC',
    tagline: 'Striking From Darkness'
  },
  {
    id: 'ttn',
    name: 'Iron Titan',
    shortName: 'TTN',
    logo: makeSvg(`
      <circle cx="50" cy="50" r="46" fill="#4C0519" stroke="#E11D48" stroke-width="4"/>
      <rect x="30" y="30" width="40" height="40" rx="8" fill="#BE123C"/>
      <rect x="38" y="44" width="24" height="6" rx="2" fill="#FDA4AF"/>
    `),
    primaryColor: '#E11D48',
    secondaryColor: '#FDA4AF',
    tagline: 'Unshakable Fortress'
  },
  {
    id: 'wlf',
    name: 'Thunder Wolf',
    shortName: 'WLF',
    logo: makeSvg(`
      <circle cx="50" cy="50" r="46" fill="#082F49" stroke="#38BDF8" stroke-width="4"/>
      <polygon points="32,24 44,44 26,46" fill="#38BDF8"/>
      <polygon points="68,24 56,44 74,46" fill="#38BDF8"/>
      <polygon points="50,44 60,68 40,68" fill="#7DD3FC"/>
    `),
    primaryColor: '#38BDF8',
    secondaryColor: '#BAE6FD',
    tagline: 'The Pack Dominates'
  },
  {
    id: 'drg',
    name: 'Golden Dragon',
    shortName: 'DRG',
    logo: makeSvg(`
      <circle cx="50" cy="50" r="46" fill="#713F12" stroke="#EAB308" stroke-width="4"/>
      <path d="M50 20 Q70 34 62 56 Q50 68 38 56 Q30 34 50 20 Z" fill="#EAB308"/>
      <circle cx="44" cy="42" r="3" fill="#FEF08A"/>
      <circle cx="56" cy="42" r="3" fill="#FEF08A"/>
    `),
    primaryColor: '#EAB308',
    secondaryColor: '#FEF08A',
    tagline: 'Commanding The Arena'
  },
  {
    id: 'shk',
    name: 'Oceanic Shark',
    shortName: 'SHK',
    logo: makeSvg(`
      <circle cx="50" cy="50" r="46" fill="#082F49" stroke="#0284C7" stroke-width="4"/>
      <path d="M30 68 Q50 20 74 54 Q60 52 50 68 Z" fill="#0284C7"/>
    `),
    primaryColor: '#0284C7',
    secondaryColor: '#38BDF8',
    tagline: 'Relentless Pursuit'
  },
  {
    id: 'vip',
    name: 'Crimson Viper',
    shortName: 'VIP',
    logo: makeSvg(`
      <circle cx="50" cy="50" r="46" fill="#064E3B" stroke="#10B981" stroke-width="4"/>
      <path d="M50 24 Q64 36 56 54 Q44 68 50 78" stroke="#10B981" stroke-width="8" stroke-linecap="round" fill="none"/>
      <circle cx="50" cy="24" r="5" fill="#34D399"/>
    `),
    primaryColor: '#10B981',
    secondaryColor: '#34D399',
    tagline: 'Precision Lethal Strike'
  },
  {
    id: 'lio',
    name: 'Apex Lion',
    shortName: 'LIO',
    logo: makeSvg(`
      <circle cx="50" cy="50" r="46" fill="#451A03" stroke="#D97706" stroke-width="4"/>
      <circle cx="50" cy="50" r="26" fill="#D97706"/>
      <circle cx="42" cy="46" r="4" fill="#FEF3C7"/>
      <circle cx="58" cy="46" r="4" fill="#FEF3C7"/>
      <polygon points="50,56 55,64 45,64" fill="#78350F"/>
    `),
    primaryColor: '#D97706',
    secondaryColor: '#FDE68A',
    tagline: 'King of the Stadium'
  },
  {
    id: 'ber',
    name: 'Midnight Bear',
    shortName: 'BER',
    logo: makeSvg(`
      <circle cx="50" cy="50" r="46" fill="#0F172A" stroke="#64748B" stroke-width="4"/>
      <circle cx="34" cy="34" r="9" fill="#475569"/>
      <circle cx="66" cy="34" r="9" fill="#475569"/>
      <ellipse cx="50" cy="56" rx="24" ry="20" fill="#334155"/>
      <ellipse cx="50" cy="62" rx="10" ry="8" fill="#94A3B8"/>
    `),
    primaryColor: '#64748B',
    secondaryColor: '#94A3B8',
    tagline: 'Brute Power Unleashed'
  }
];

// ==========================================
// MASTER AUCTION MODES CONFIGURATION
// ==========================================
export const AUCTION_MODES: Record<AuctionMode, AuctionModeConfig> = {
  cricket: {
    id: 'cricket',
    name: 'IPL Cricket Mega Auction',
    badge: 'IPL Mega Auction & Franchise Draft',
    heroTagline: 'Command the live IPL bidding table. Draft iconic batsmen, all-rounders, and fast bowlers with real-time budget tracking in ₹ Crores!',
    teamFieldLabel: 'Team / IPL Franchise Name:',
    teamPlaceholder: 'e.g. Royal Challengers or Apex XI...',
    avatarSelectorLabel: 'Choose IPL Franchise:',
    lotLabel: 'Player',
    squadLabel: 'Squad',
    currencySymbol: '₹',
    unitLabel: 'Cr',
    fallbackEmoji: '🏏',
    defaultPurse: 100,
    minIncrement: 0.25,
    avatars: CRICKET_AVATARS
  },
  football: {
    id: 'football',
    name: 'European Champions Football Draft',
    badge: 'European Champions Football Draft',
    heroTagline: 'Dominate the transfer window. Sign world-class strikers, wingers, and keepers into your European powerhouse club with budgets in € Millions!',
    teamFieldLabel: 'Club / Football Franchise Name:',
    teamPlaceholder: 'e.g. Galácticos FC, Cityzen XI, Red Devils...',
    avatarSelectorLabel: 'Choose European Club Crest:',
    lotLabel: 'Footballer',
    squadLabel: 'Club Squad',
    currencySymbol: '€',
    unitLabel: 'M',
    fallbackEmoji: '⚽',
    defaultPurse: 500,
    minIncrement: 5,
    avatars: FOOTBALL_AVATARS
  },
  startup: {
    id: 'startup',
    name: 'Tech Unicorn Dream Team Draft',
    badge: 'Tech Unicorn Dream Team Draft',
    heroTagline: 'Assemble your 10x engineering and product dream team. Win top AI researchers and staff architects with your $1M VC purse!',
    teamFieldLabel: 'Venture Capital / Startup Name:',
    teamPlaceholder: 'e.g. Horizon Labs, Nexus AI, Stealth Fund...',
    avatarSelectorLabel: 'Choose VC Firm / Tech Studio Brand:',
    lotLabel: 'Talent',
    squadLabel: 'Core Team',
    currencySymbol: '$',
    unitLabel: 'K',
    fallbackEmoji: '💻',
    defaultPurse: 1000,
    minIncrement: 20,
    avatars: STARTUP_AVATARS
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Sci-Fi Quantum Artifacts & Mechs',
    badge: 'Sci-Fi Cybernetic Bidding Arena',
    heroTagline: 'Bid for black-market neural implants, interstellar quantum warp cores, and heavy exo-rigs with high-stakes ⬡ Credits!',
    teamFieldLabel: 'Syndicate / Megacorp Name:',
    teamPlaceholder: 'e.g. Arasaka Corp, Neon Syndicate, Orbital...',
    avatarSelectorLabel: 'Choose Megacorp / Faction Emblem:',
    lotLabel: 'Artifact',
    squadLabel: 'Armory',
    currencySymbol: '⬡',
    unitLabel: 'Credits',
    fallbackEmoji: '🤖',
    defaultPurse: 50000,
    minIncrement: 1000,
    avatars: CYBERPUNK_AVATARS
  },
  custom: {
    id: 'custom',
    name: 'Open Bidding Arena',
    badge: 'Universal Live Auction Arena',
    heroTagline: 'High-stakes interactive auction draft for college events, corporate workshops, and team drafts with live screen sync!',
    teamFieldLabel: 'Team / Bidder Name:',
    teamPlaceholder: 'e.g. Team Phoenix, Alpha Bidders...',
    avatarSelectorLabel: 'Choose Team Mascot Emblem:',
    lotLabel: 'Item',
    squadLabel: 'Collection',
    currencySymbol: '$',
    unitLabel: '',
    fallbackEmoji: '🏆',
    defaultPurse: 100,
    minIncrement: 1,
    avatars: CUSTOM_AVATARS
  }
};

/**
 * Detect auction mode from room or packId
 */
export function detectAuctionMode(roomOrPackId?: any): AuctionMode {
  if (!roomOrPackId) return 'cricket';
  if (typeof roomOrPackId === 'string') {
    const clean = roomOrPackId.toLowerCase();
    if (clean === 'football' || clean.includes('football')) return 'football';
    if (clean === 'startup' || clean.includes('startup') || clean.includes('tech')) return 'startup';
    if (clean === 'cyberpunk' || clean.includes('cyber') || clean.includes('mech')) return 'cyberpunk';
    if (clean === 'custom') return 'custom';
    if (clean === 'cricket' || clean.includes('cricket') || clean.includes('ipl')) return 'cricket';
    return 'cricket';
  }

  // Object room inspection
  const packId = (roomOrPackId.packId || '').toLowerCase();
  if (packId in AUCTION_MODES) return packId as AuctionMode;

  const title = (roomOrPackId.title || '').toLowerCase();
  const cur = roomOrPackId.currencySymbol || '';
  const unit = roomOrPackId.unitLabel || '';

  if (title.includes('football') || title.includes('soccer') || title.includes('champions') || cur === '€') return 'football';
  if (title.includes('unicorn') || title.includes('startup') || title.includes('tech') || (cur === '$' && unit === 'K')) return 'startup';
  if (title.includes('cyber') || title.includes('quantum') || title.includes('mech') || cur === '⬡') return 'cyberpunk';
  if (title.includes('cricket') || title.includes('ipl') || cur === '₹' || unit === 'Cr') return 'cricket';

  return 'cricket';
}

/**
 * Get config for a specific mode
 */
export function getModeConfig(mode: AuctionMode): AuctionModeConfig {
  return AUCTION_MODES[mode] || AUCTION_MODES.cricket;
}

/**
 * Lookup avatar information across all modes by logo URL, shortName, or id
 */
export function getAvatarByUrlOrName(avatarUrl?: string, mode?: AuctionMode): ModeAvatar | undefined {
  if (!avatarUrl) return undefined;
  const cleanUrl = avatarUrl.split('?')[0].toLowerCase();

  // If mode provided, check mode first
  if (mode && AUCTION_MODES[mode]) {
    const match = AUCTION_MODES[mode].avatars.find(
      (a) => a.logo.toLowerCase() === cleanUrl || cleanUrl.includes(a.shortName.toLowerCase()) || cleanUrl.includes(a.id.toLowerCase())
    );
    if (match) return match;
  }

  // Check all modes
  const allModes: AuctionMode[] = ['cricket', 'football', 'startup', 'cyberpunk', 'custom'];
  for (const m of allModes) {
    const match = AUCTION_MODES[m].avatars.find(
      (a) => a.logo.toLowerCase() === cleanUrl || cleanUrl.includes(a.shortName.toLowerCase()) || cleanUrl.includes(a.id.toLowerCase())
    );
    if (match) return match;
  }

  return undefined;
}
