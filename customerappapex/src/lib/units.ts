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
