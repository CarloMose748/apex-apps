import { litresToKilograms } from './units';

const CO2E_SAVED_PER_KG_OIL = 2.86;

export interface CarbonCreditSourceRecord {
  id: string;
  verifiedAt: string;
  collectedVolumeLitres?: number | null;
  netMassKg?: number | null;
  oilType?: string | null;
}

export interface CarbonCreditBlock {
  blockNumber: number;
  collectionId: string;
  verifiedAt: string;
  oilType: string;
  recoveredMassKg: number;
  co2eAvoidedKg: number;
  estimatedCredits: number;
  previousHash: string;
  blockHash: string;
}

async function sha256Hex(value: string): Promise<string> {
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function buildCarbonCreditBlocks(
  records: CarbonCreditSourceRecord[],
): Promise<CarbonCreditBlock[]> {
  const sortedRecords = [...records].sort(
    (left, right) => new Date(left.verifiedAt).getTime() - new Date(right.verifiedAt).getTime(),
  );

  const blocks: CarbonCreditBlock[] = [];
  let previousHash = 'GENESIS';

  for (const [index, record] of sortedRecords.entries()) {
    const recoveredMassKg = record.netMassKg ?? litresToKilograms(record.collectedVolumeLitres ?? 0);
    const co2eAvoidedKg = recoveredMassKg * CO2E_SAVED_PER_KG_OIL;
    const estimatedCredits = co2eAvoidedKg / 1000;

    const payload = JSON.stringify({
      blockNumber: index + 1,
      collectionId: record.id,
      verifiedAt: record.verifiedAt,
      oilType: record.oilType || 'Used Cooking Oil',
      recoveredMassKg: Number(recoveredMassKg.toFixed(3)),
      co2eAvoidedKg: Number(co2eAvoidedKg.toFixed(3)),
      estimatedCredits: Number(estimatedCredits.toFixed(6)),
      previousHash,
    });

    const blockHash = await sha256Hex(payload);

    blocks.push({
      blockNumber: index + 1,
      collectionId: record.id,
      verifiedAt: record.verifiedAt,
      oilType: record.oilType || 'Used Cooking Oil',
      recoveredMassKg,
      co2eAvoidedKg,
      estimatedCredits,
      previousHash,
      blockHash,
    });

    previousHash = blockHash;
  }

  return blocks.reverse();
}
