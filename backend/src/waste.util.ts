export const WASTE_TYPES = ['ORGANIC', 'PLASTIC', 'PAPER', 'GLASS', 'METAL', 'E_WASTE'] as const;
export type WasteType = (typeof WASTE_TYPES)[number];

// EcoPoints awarded per kg for correctly segregated waste
export const POINTS_PER_KG: Record<WasteType, number> = {
  ORGANIC: 5,
  PLASTIC: 10,
  PAPER: 6,
  GLASS: 8,
  METAL: 12,
  E_WASTE: 20,
};

export const BIN_COLORS: Record<WasteType, string> = {
  ORGANIC: 'Green',
  PLASTIC: 'Yellow',
  PAPER: 'Blue',
  GLASS: 'White',
  METAL: 'Grey',
  E_WASTE: 'Red',
};

const TIPS: Record<WasteType, string> = {
  ORGANIC: 'Keep it free of plastic. Great for composting.',
  PLASTIC: 'Rinse and dry before disposal. Remove caps and labels.',
  PAPER: 'Keep it dry and clean. Flatten boxes.',
  GLASS: 'Rinse and handle carefully. Do not mix with ceramics.',
  METAL: 'Rinse cans and crush if possible.',
  E_WASTE: 'Never mix with household waste. Remove batteries if possible.',
};

// Order matters: more specific categories are checked first.
const KEYWORDS: [WasteType, string[]][] = [
  ['E_WASTE', ['battery', 'phone', 'charger', 'cable', 'bulb', 'laptop', 'earphone', 'circuit', 'remote']],
  ['GLASS', ['glass', 'jar', 'mirror', 'wine bottle']],
  ['METAL', ['can', 'tin', 'foil', 'aluminium', 'aluminum', 'steel', 'copper', 'iron']],
  ['PAPER', ['paper', 'newspaper', 'cardboard', 'carton', 'magazine', 'book', 'envelope', 'box']],
  ['ORGANIC', ['banana', 'apple', 'peel', 'food', 'vegetable', 'fruit', 'leaves', 'leaf', 'tea', 'coffee', 'egg', 'rice', 'bread', 'flower']],
  ['PLASTIC', ['plastic', 'bottle', 'bag', 'wrapper', 'straw', 'cup', 'container', 'packet', 'polythene', 'toy']],
];

export interface Classification {
  item: string;
  found: boolean;
  wasteType: string;
  binColor: string;
  tip: string;
}

export function classifyWaste(item: string): Classification {
  const text = (item || '').toLowerCase().trim();
  for (const [type, words] of KEYWORDS) {
    if (words.some((w) => new RegExp(`\\b${w}s?\\b`).test(text))) {
      return { item: text, found: true, wasteType: type, binColor: BIN_COLORS[type], tip: TIPS[type] };
    }
  }
  return {
    item: text,
    found: false,
    wasteType: 'UNKNOWN',
    binColor: '-',
    tip: 'Item not recognised. Check local guidelines or ask an admin.',
  };
}
