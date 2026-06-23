export const KG_PER_LITRE = 0.92;

export function litresToKilograms(litres?: number | null): number {
  if (litres == null || Number.isNaN(litres)) {
    return 0;
  }

  return litres * KG_PER_LITRE;
}

export function formatKilograms(value?: number | null, digits = 1): string {
  if (value == null || Number.isNaN(value)) {
    return '-';
  }

  return `${value.toFixed(digits)} kg`;
}

/**
 * Parse a free-text quantity like "20L", "15 kg", "2 drums" into litres + kg.
 * Returns null when no number can be extracted.
 *  - "20L" / "20 litres" → 20 L
 *  - "15kg"             → 15 / 0.92 ≈ 16.3 L
 *  - "2 drums"          → 2 × 193 L (standard 210L drum ~92% fill)
 */
export interface ParsedQuantity { liters: number; kg: number; }

export function parseQuantityToLitres(text: string): ParsedQuantity | null {
  if (!text) return null;
  const m = text.trim().match(/(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (!Number.isFinite(n) || n <= 0) return null;

  const lower = text.toLowerCase();
  let liters: number;
  if (/\b(l|lit|litre|litres|liter|liters)\b/.test(lower)) {
    liters = n;
  } else if (/\b(kg|kilo|kilogram)/.test(lower)) {
    liters = n / KG_PER_LITRE;
  } else if (/drum/.test(lower)) {
    liters = n * 193; // 210L drum at ~92% usable
  } else if (/\b(ibc|tank)\b/.test(lower)) {
    liters = n * 1000;
  } else {
    // Bare number → assume litres
    liters = n;
  }
  return { liters: Math.round(liters * 100) / 100, kg: Math.round(liters * KG_PER_LITRE * 100) / 100 };
}

/**
 * Extract a suburb/area name from a full address.
 * "123 Sarit Centre, Westlands, Nairobi, Kenya" → "Westlands"
 * Falls back to the whole address when no commas present.
 */
export function parseAreaFromAddress(address: string): string {
  if (!address) return '';
  const parts = address.split(',').map(p => p.trim()).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  // Second-to-last chunk is usually the suburb/town.
  return parts[parts.length - 2];
}
