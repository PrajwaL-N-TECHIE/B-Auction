import type { AuctionLot } from '../types/auction';

export interface LotPack {
  id: string;
  name: string;
  description: string;
  currencySymbol: string;
  unitLabel: string;
  defaultPurse: number;
  minIncrement: number;
  lots: AuctionLot[];
}

export const SAMPLE_LOT_PACKS: LotPack[] = [
  {
    id: 'cricket',
    name: 'Premier Cricket Auction (IPL Style)',
    description: 'Iconic all-rounders, batsmen, and pacers with purse balances in Crores (₹).',
    currencySymbol: '₹',
    unitLabel: 'Cr',
    defaultPurse: 100, // 100 Cr
    minIncrement: 0.25, // 25 Lakhs
    lots: [
      {
        id: 'lot_c1',
        title: 'Virat Kohli',
        category: 'Top-Order Batsman',
        description: 'Elite anchor and run machine with unmatched chase consistency.',
        basePrice: 2.0,
        rating: 98,
        stats: [
          { label: 'Role', value: 'Right-Hand Bat' },
          { label: 'Strike Rate', value: '138.4' },
          { label: 'Avg', value: '52.7' }
        ],
        status: 'upcoming'
      },
      {
        id: 'lot_c2',
        title: 'Jasprit Bumrah',
        category: 'Spearhead Pacer',
        description: 'Deadly yorker specialist and undisputed death-overs maestro.',
        basePrice: 2.0,
        rating: 99,
        stats: [
          { label: 'Role', value: 'Right-Arm Fast' },
          { label: 'Economy', value: '6.7' },
          { label: 'Wickets', value: '165+' }
        ],
        status: 'upcoming'
      },
      {
        id: 'lot_c3',
        title: 'Rohit Sharma',
        category: 'Power Opener & Captain',
        description: 'Prolific big-hitter with proven 5-time championship leadership.',
        basePrice: 2.0,
        rating: 96,
        stats: [
          { label: 'Role', value: 'Opener' },
          { label: 'Strike Rate', value: '142.1' },
          { label: 'Titles', value: '5' }
        ],
        status: 'upcoming'
      },
      {
        id: 'lot_c4',
        title: 'Rashid Khan',
        category: 'Mystery Leg-Spinner',
        description: 'World #1 T20 leg spinner with explosive lower-order hitting.',
        basePrice: 1.5,
        rating: 97,
        stats: [
          { label: 'Role', value: 'Leg Spin' },
          { label: 'Economy', value: '6.4' },
          { label: 'Dot Ball %', value: '54%' }
        ],
        status: 'upcoming'
      },
      {
        id: 'lot_c5',
        title: 'Hardik Pandya',
        category: 'Pace All-Rounder',
        description: 'Dynamic finisher and middle-overs enforcer with 140kmph pace.',
        basePrice: 1.5,
        rating: 94,
        stats: [
          { label: 'Role', value: 'All-Rounder' },
          { label: 'Strike Rate', value: '146.8' },
          { label: 'Bowling Avg', value: '27.4' }
        ],
        status: 'upcoming'
      },
      {
        id: 'lot_c6',
        title: 'Heinrich Klaasen',
        category: 'Wicket-Keeper Finisher',
        description: 'Spin-demolishing destructive middle-order powerhouse.',
        basePrice: 1.0,
        rating: 95,
        stats: [
          { label: 'Role', value: 'WK-Batter' },
          { label: 'Strike Rate', value: '172.5' },
          { label: 'Sixes/Inn', value: '3.1' }
        ],
        status: 'upcoming'
      }
    ]
  },
  {
    id: 'startup',
    name: 'Tech Unicorn Dream Team Draft',
    description: 'Assemble the ultimate engineering & product team with your $1M VC purse.',
    currencySymbol: '$',
    unitLabel: 'K',
    defaultPurse: 1000, // $1,000K ($1M)
    minIncrement: 20, // $20K
    lots: [
      {
        id: 'lot_s1',
        title: 'Principal AI Researcher',
        category: 'AI & Machine Learning',
        description: 'Ex-DeepMind architect capable of fine-tuning multi-modal foundation models.',
        basePrice: 120,
        rating: 98,
        stats: [
          { label: 'Specialty', value: 'LLMs & Agents' },
          { label: 'Papers', value: '14 NeurIPS' },
          { label: 'Velocity', value: '10x' }
        ],
        status: 'upcoming'
      },
      {
        id: 'lot_s2',
        title: 'Staff Full-Stack Architect',
        category: 'Systems & Infrastructure',
        description: 'Zero-downtime distributed systems specialist who built sub-10ms real-time pipelines.',
        basePrice: 100,
        rating: 96,
        stats: [
          { label: 'Stack', value: 'Go / Rust / TS' },
          { label: 'Scale', value: '10M DAU' },
          { label: 'Reliability', value: '99.99%' }
        ],
        status: 'upcoming'
      },
      {
        id: 'lot_s3',
        title: 'Head of Product Design',
        category: 'UI/UX & Creative',
        description: 'Award-winning design lead obsessed with fluid micro-interactions and dark mode aesthetic.',
        basePrice: 90,
        rating: 95,
        stats: [
          { label: 'Craft', value: 'Design Systems' },
          { label: 'Awards', value: 'Apple Design Award' },
          { label: 'Retention', value: '+42%' }
        ],
        status: 'upcoming'
      },
      {
        id: 'lot_s4',
        title: 'Growth & Viral Marketer',
        category: 'Growth & Distribution',
        description: 'Acquisition wizard who engineered 0 to 1M users organically without paid ads.',
        basePrice: 80,
        rating: 93,
        stats: [
          { label: 'CAC', value: '$0.12' },
          { label: 'K-Factor', value: '1.8' },
          { label: 'Funnels', value: 'Optimized' }
        ],
        status: 'upcoming'
      },
      {
        id: 'lot_s5',
        title: 'Senior Cybersecurity Ninja',
        category: 'Security & DevOps',
        description: 'White-hat hacker and zero-trust architect who hardens cloud perimeter.',
        basePrice: 85,
        rating: 94,
        stats: [
          { label: 'Focus', value: 'Red Teaming' },
          { label: 'Compliance', value: 'SOC2 / ISO' },
          { label: 'Bounties', value: '$250k+' }
        ],
        status: 'upcoming'
      }
    ]
  },
  {
    id: 'cyberpunk',
    name: 'Sci-Fi Quantum Artifacts & Mechs',
    description: 'High-stakes bidding on futuristic sci-fi tech and cybernetic upgrades.',
    currencySymbol: '⬡',
    unitLabel: 'Credits',
    defaultPurse: 50000,
    minIncrement: 1000,
    lots: [
      {
        id: 'lot_m1',
        title: 'Hyperion Titan Exo-Rig',
        category: 'Heavy Combat Rig',
        description: 'Tungsten-reinforced mechanized armor with plasma shield emitters.',
        basePrice: 8000,
        rating: 97,
        stats: [
          { label: 'Shield', value: '10,000 MW' },
          { label: 'Armor', value: 'Class 4' },
          { label: 'Speed', value: 'Mach 1.2' }
        ],
        status: 'upcoming'
      },
      {
        id: 'lot_m2',
        title: 'Quantum Warp Core V9',
        category: 'Propulsion Tech',
        description: 'Zero-point energy battery enabling instant sub-light interstellar travel.',
        basePrice: 12000,
        rating: 99,
        stats: [
          { label: 'Output', value: '500 PetaWatts' },
          { label: 'Stability', value: '99.8%' },
          { label: 'Range', value: '12 Light Yrs' }
        ],
        status: 'upcoming'
      },
      {
        id: 'lot_m3',
        title: 'Neural Deck Cyber-Implant',
        category: 'Cerebral AI',
        description: 'Direct optical cerebral interface boosting human analytical clock speed by 1000x.',
        basePrice: 6000,
        rating: 94,
        stats: [
          { label: 'Bandwidth', value: '10 TB/s' },
          { label: 'Latency', value: '0.01ms' },
          { label: 'Synapses', value: 'Overclocked' }
        ],
        status: 'upcoming'
      }
    ]
  }
];
