export interface IPLTeam {
  id: string;
  name: string;
  shortName: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  tagline: string;
}

export const IPL_TEAMS: IPLTeam[] = [
  {
    id: 'RCB',
    name: 'Royal Challengers Bengaluru',
    shortName: 'RCB',
    logo: '/teams/rcb.png',
    primaryColor: '#ec1c24',
    secondaryColor: '#000000',
    tagline: 'Play Bold • Ee Sala Cup Namde'
  },
  {
    id: 'CSK',
    name: 'Chennai Super Kings',
    shortName: 'CSK',
    logo: '/teams/csk.png',
    primaryColor: '#fdb913',
    secondaryColor: '#005fa2',
    tagline: 'Whistle Podu • Yellove'
  },
  {
    id: 'MI',
    name: 'Mumbai Indians',
    shortName: 'MI',
    logo: '/teams/mi.png',
    primaryColor: '#004ba0',
    secondaryColor: '#d1ab3e',
    tagline: 'Duniya Hila Denge • One Family'
  },
  {
    id: 'KKR',
    name: 'Kolkata Knight Riders',
    shortName: 'KKR',
    logo: '/teams/kkr.png',
    primaryColor: '#3a225d',
    secondaryColor: '#b3995d',
    tagline: 'Korbo Lorbo Jeetbo'
  },
  {
    id: 'SRH',
    name: 'Sunrisers Hyderabad',
    shortName: 'SRH',
    logo: '/teams/srh.png',
    primaryColor: '#f26522',
    secondaryColor: '#000000',
    tagline: 'Orange Army • Rise Up'
  },
  {
    id: 'DC',
    name: 'Delhi Capitals',
    shortName: 'DC',
    logo: '/teams/dc.png',
    primaryColor: '#0078bc',
    secondaryColor: '#d71920',
    tagline: 'Roar Macha'
  },
  {
    id: 'RR',
    name: 'Rajasthan Royals',
    shortName: 'RR',
    logo: '/teams/rr.png',
    primaryColor: '#ea1a85',
    secondaryColor: '#254aa5',
    tagline: 'Halla Bol'
  },
  {
    id: 'PBKS',
    name: 'Punjab Kings',
    shortName: 'PBKS',
    logo: '/teams/pbks.png',
    primaryColor: '#dd1f2d',
    secondaryColor: '#d4af37',
    tagline: 'Sadda Punjab'
  },
  {
    id: 'GT',
    name: 'Gujarat Titans',
    shortName: 'GT',
    logo: '/teams/gt.svg',
    primaryColor: '#1b2133',
    secondaryColor: '#c4a962',
    tagline: 'Aava De'
  },
  {
    id: 'LSG',
    name: 'Lucknow Super Giants',
    shortName: 'LSG',
    logo: '/teams/lsg.png',
    primaryColor: '#0057b8',
    secondaryColor: '#ff671f',
    tagline: 'Ab Apni Baari Hai'
  }
];

export const DEFAULT_IPL_TEAM = IPL_TEAMS[0];

export function getIPLTeamById(id: string): IPLTeam | undefined {
  return IPL_TEAMS.find(t => t.id === id || t.shortName.toUpperCase() === id.toUpperCase());
}

export function getIPLTeamByLogo(logoUrl: string): IPLTeam | undefined {
  return IPL_TEAMS.find(t => t.logo === logoUrl || logoUrl.includes(t.shortName.toLowerCase()));
}
