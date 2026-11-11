export const DEFAULT_CURRENCY = 'KES' as const;
export const DEFAULT_LOCALE = 'en-KE' as const;

/** Convert a major-unit decimal string to integer minor units without float arithmetic. */
export function toMinorUnits(amountMajor: string | number): number {
  const value = String(amountMajor).trim();
  const match = /^(\d+)(?:\.(\d+))?$/.exec(value);
  if (!match) throw new TypeError('Money must be a non-negative decimal amount');

  const whole = BigInt(match[1]);
  const fraction = match[2] || '';
  const minorDigits = BigInt((fraction.slice(0, 2) + '00').slice(0, 2));
  let minor = whole * 100n + minorDigits;
  if (fraction.length > 2 && fraction[2] >= '5') minor += 1n;

  const result = Number(minor);
  if (!Number.isSafeInteger(result)) throw new RangeError('Money amount exceeds the safe integer range');
  return result;
}

/** Read integer minor units from JSON while supporting the old major-unit field. */
export function readMinorAmount(
  metadata: Record<string, unknown>,
  minorKey: string,
  legacyMajorKey: string,
): number | null {
  const minor = metadata[minorKey];
  if (typeof minor === 'number' && Number.isSafeInteger(minor) && minor >= 0) return minor;
  if (metadata.estimated_value_currency !== 'KES') return null;
  const legacy = metadata[legacyMajorKey];
  if (typeof legacy !== 'string' && typeof legacy !== 'number') return null;
  try {
    return toMinorUnits(legacy);
  } catch {
    return null;
  }
}

function toScaledInteger(value: string | number, decimalPlaces: number): bigint {
  const match = /^(\d+)(?:\.(\d+))?$/.exec(String(value).trim());
  if (!match) throw new TypeError('Rate must be a non-negative decimal amount');
  const scale = 10n ** BigInt(decimalPlaces);
  const fraction = (match[2] || '').slice(0, decimalPlaces).padEnd(decimalPlaces, '0');
  return BigInt(match[1]) * scale + BigInt(fraction || '0');
}

function applyBasisPoints(amountMinor: number, basisPoints: bigint): number {
  if (!Number.isSafeInteger(amountMinor)) throw new TypeError('Money must be provided as integer minor units');
  const result = Number((BigInt(amountMinor) * basisPoints) / 10_000n);
  if (!Number.isSafeInteger(result)) throw new RangeError('Calculated money exceeds the safe integer range');
  return result;
}

/** Apply a fractional rate such as 0.2 for 20% using integer basis points. */
export function applyFractionToMoney(amountMinor: number, fraction: string | number): number {
  return applyBasisPoints(amountMinor, toScaledInteger(fraction, 4));
}

/** Apply a percentage such as 15 for 15% using integer basis points. */
export function applyPercentToMoney(amountMinor: number, percent: string | number): number {
  return applyBasisPoints(amountMinor, toScaledInteger(percent, 2));
}

/** Format an integer amount in minor currency units (100 units = 1 major unit). */
export function formatMoney(amountMinor: number, currency: string = DEFAULT_CURRENCY): string {
  if (!Number.isSafeInteger(amountMinor)) {
    throw new TypeError('Money must be provided as a safe integer in minor units');
  }

  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountMinor / 100);
}

/** Compatibility helper for callers that still pass a display symbol. */
export function formatCurrency(amountMinor: number, currencyOrSymbol: string = DEFAULT_CURRENCY): string {
  const currency = currencyOrSymbol === '$' || currencyOrSymbol === 'US$' ? 'USD' : currencyOrSymbol;
  return formatMoney(amountMinor, currency === 'USD' ? 'USD' : DEFAULT_CURRENCY);
}

export async function formatAmount(amountMinor: number): Promise<string> {
  return formatMoney(amountMinor);
}
