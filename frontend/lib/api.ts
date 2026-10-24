export const TOKEN_KEY = 'ecobin_token';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  points: number;
  totalWasteKg: number;
  createdAt?: string;
}
export interface Bin {
  id: string;
  name: string;
  location: string;
  household: string;
  wasteType: string;
  capacityKg: number;
  fillLevel: number;
  status: string;
}
export interface Collection {
  id: string;
  household: string;
  wasteType: string;
  weightKg: number;
  pointsEarned: number;
  collectedAt: string;
  createdAt: string;
  bin?: Bin | null;
  user?: User | null;
}
export interface Participation {
  household: string;
  collections: number;
  totalKg: number;
  totalPoints: number;
}
export interface WasteLog {
  id: string;
  wasteType: string;
  weightKg: number;
  correct: boolean;
  pointsEarned: number;
  createdAt: string;
  bin?: Bin | null;
  user?: User | null;
}
export interface Tx {
  id: string;
  type: string;
  points: number;
  description: string;
  code?: string | null;
  createdAt: string;
}
export interface Reward {
  id: string;
  name: string;
  description: string;
  cost: number;
  stock: number;
}
export interface Notif {
  id: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export const WASTE_TYPES = ['ORGANIC', 'PLASTIC', 'PAPER', 'GLASS', 'METAL', 'E_WASTE'];

// EcoPoints awarded per kg (mirrors backend waste.util.ts)
export const POINTS_PER_KG: Record<string, number> = {
  ORGANIC: 5,
  PLASTIC: 10,
  PAPER: 6,
  GLASS: 8,
  METAL: 12,
  E_WASTE: 20,
};

export const WASTE_META: Record<string, { label: string; emoji: string; chip: string; bar: string; ring: string }> = {
  ORGANIC: { label: 'Organic', emoji: '🍌', chip: 'bg-green-500/15 text-green-400', bar: 'bg-green-500', ring: 'ring-green-500' },
  PLASTIC: { label: 'Plastic', emoji: '🧴', chip: 'bg-yellow-500/15 text-yellow-400', bar: 'bg-yellow-400', ring: 'ring-yellow-500' },
  PAPER: { label: 'Paper', emoji: '📰', chip: 'bg-blue-500/15 text-blue-400', bar: 'bg-blue-500', ring: 'ring-blue-500' },
  GLASS: { label: 'Glass', emoji: '🫙', chip: 'bg-cyan-500/15 text-cyan-400', bar: 'bg-cyan-500', ring: 'ring-cyan-500' },
  METAL: { label: 'Metal', emoji: '🥫', chip: 'bg-slate-500/20 text-slate-300', bar: 'bg-slate-400', ring: 'ring-slate-500' },
  E_WASTE: { label: 'E-Waste', emoji: '🔋', chip: 'bg-rose-500/15 text-rose-400', bar: 'bg-rose-500', ring: 'ring-rose-500' },
};

export async function gql<T = any>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  const res = await fetch('/api/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ query, variables }),
  });
  let json: any;
  try {
    json = await res.json();
  } catch {
    throw new Error('Server unreachable. Please try again.');
  }
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data as T;
}

export function timeAgo(date: string): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(date).getTime()) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return new Date(date).toLocaleDateString();
}
