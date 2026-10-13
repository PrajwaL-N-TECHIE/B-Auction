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
    name: 'Premier Cricket Auction (IPL Mega Auction)',
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
        description: 'Elite anchor and all-time run machine with unmatched chase consistency.',
        imageUrl: '/players/virat_kohli.jpg',
        basePrice: 2.0,
        rating: 99,
        stats: [
          { label: 'Role', value: 'Right-Hand Bat' },
          { label: 'Strike Rate', value: '138.4' },
          { label: 'IPL Runs', value: '8,000+' }
        ],
        status: 'upcoming'
      },
      {
        id: 'lot_c2',
        title: 'Jasprit Bumrah',
        category: 'Spearhead Fast Bowler',
        description: 'Deadly yorker specialist and undisputed death-overs maestro.',
        imageUrl: '/players/jasprit_bumrah.jpg',
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
        imageUrl: '/players/rohit_sharma.jpg',
        basePrice: 2.0,
        rating: 97,
        stats: [
          { label: 'Role', value: 'Opener' },
          { label: 'Strike Rate', value: '142.1' },
          { label: 'Titles', value: '5 IPL Trophies' }
        ],
        status: 'upcoming'
      },
      {
        id: 'lot_c4',
        title: 'MS Dhoni',
        category: 'Wicket-Keeper & Legend Finisher',
        description: 'Iconic master strategist, legendary captain, and lightning-fast keeper.',
        imageUrl: '/players/ms_dhoni.jpg',
        basePrice: 2.0,
        rating: 98,
        stats: [
          { label: 'Role', value: 'WK-Finisher' },
          { label: 'Dismissals', value: '190+' },
          { label: 'Titles', value: '5 IPL Trophies' }
        ],
        status: 'upcoming'
      },
      {
        id: 'lot_c5',
        title: 'Suryakumar Yadav',
        category: '360° Middle-Order Batter',
        description: 'World #1 T20 innovator capable of hitting any ball behind the keeper.',
        imageUrl: '/players/suryakumar_yadav.jpg',
        basePrice: 2.0,
        rating: 98,
        stats: [
          { label: 'Role', value: 'Right-Hand Bat' },
          { label: 'Strike Rate', value: '174.2' },
          { label: 'Sixes', value: '120+' }
        ],
        status: 'upcoming'
      },
      {
        id: 'lot_c6',
        title: 'Hardik Pandya',
        category: 'Pace All-Rounder',
        description: 'Dynamic finisher and middle-overs enforcer with 140kmph pace.',
        imageUrl: '/players/hardik_pandya.jpg',
        basePrice: 2.0,
        rating: 95,
        stats: [
          { label: 'Role', value: 'All-Rounder' },
          { label: 'Strike Rate', value: '146.8' },
          { label: 'Bowling Avg', value: '27.4' }
        ],
        status: 'upcoming'
      },
      {
        id: 'lot_c7',
        title: 'Rashid Khan',
        category: 'Mystery Leg-Spinner',
        description: 'World-renowned leg spin wizard with explosive lower-order hitting.',
        imageUrl: '/players/rashid_khan.jpg',
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
        id: 'lot_c8',
        title: 'Rishabh Pant',
        category: 'Wicket-Keeper Explosive Batter',
        description: 'Fearless left-handed game-changer with audacious boundary power.',
        imageUrl: '/players/rishabh_pant.jpg',
        basePrice: 2.0,
        rating: 96,
        stats: [
          { label: 'Role', value: 'WK-Batter' },
          { label: 'Strike Rate', value: '148.5' },
          { label: 'Max Score', value: '128*' }
        ],
        status: 'upcoming'
      },
      {
        id: 'lot_c9',
        title: 'Travis Head',
        category: 'Explosive Powerplay Opener',
        description: 'Relentless powerplay destroyer who dismantled bowling attacks in 2024.',
        imageUrl: '/players/travis_head.jpg',
        basePrice: 1.5,
        rating: 96,
        stats: [
          { label: 'Role', value: 'Left-Hand Opener' },
          { label: 'Strike Rate', value: '191.5' },
          { label: 'Powerplay SR', value: '210.0' }
        ],
        status: 'upcoming'
      },
      {
        id: 'lot_c10',
        title: 'Shubman Gill',
        category: 'Prince of Indian Batting',
        description: 'Technically flawless elegant opener and orange cap holder.',
        imageUrl: '/players/shubman_gill.jpg',
        basePrice: 2.0,
        rating: 95,
        stats: [
          { label: 'Role', value: 'Right-Hand Opener' },
          { label: 'Average', value: '47.8' },
          { label: 'Centuries', value: '3' }
        ],
        status: 'upcoming'
      },
      {
        id: 'lot_c11',
        title: 'Mitchell Starc',
        category: 'Left-Arm Express Pacer',
        description: 'Record auction signing, searing yorkers and high-pressure clutch performer.',
        imageUrl: '/players/mitchell_starc.jpg',
        basePrice: 2.0,
        rating: 96,
        stats: [
          { label: 'Role', value: 'Left-Arm Fast' },
          { label: 'Speed', value: '148 km/h' },
          { label: 'Playoff MoM', value: '2' }
        ],
        status: 'upcoming'
      },
      {
        id: 'lot_c12',
        title: 'Glenn Maxwell',
        category: 'Big Show All-Rounder',
        description: 'Unorthodox reverse-sweeping match-winner and handy off-spinner.',
        imageUrl: '/players/glenn_maxwell.jpg',
        basePrice: 1.5,
        rating: 94,
        stats: [
          { label: 'Role', value: 'Batting All-Rounder' },
          { label: 'Strike Rate', value: '157.0' },
          { label: 'Sixes', value: '140+' }
        ],
        status: 'upcoming'
      },
      {
        id: 'lot_c13',
        title: 'KL Rahul',
        category: 'Top-Order Anchor & Wicket-Keeper',
        description: 'Consistent high-scoring anchor capable of accelerating at will.',
        imageUrl: '/players/kl_rahul.jpg',
        basePrice: 2.0,
        rating: 94,
        stats: [
          { label: 'Role', value: 'WK-Batter' },
          { label: 'Average', value: '45.5' },
          { label: 'Strike Rate', value: '135.0' }
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
        imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
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
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
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
        imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
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
        imageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&auto=format&fit=crop&q=80',
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
        imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
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
        imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80',
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
        imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80',
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
        imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&auto=format&fit=crop&q=80',
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
