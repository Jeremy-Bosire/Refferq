import { parsePhoneNumberFromString } from 'libphonenumber-js/core';
import metadata from 'libphonenumber-js/metadata.max.json';

/** Normalize accepted Kenyan mobile formats to E.164 and reject non-Kenyan lines. */
export function normalizeKenyanMobile(input: string): string | null {
  const raw = input.trim();
  if (!raw || !/^[+\d\s().-]+$/.test(raw)) return null;

  const digits = raw.replace(/\D/g, '');
  const candidate = !raw.startsWith('+') && digits.startsWith('254')
    ? `+${digits}`
    : raw;
  const phone = parsePhoneNumberFromString(candidate, 'KE', metadata);

  if (!phone || phone.country !== 'KE' || !phone.isValid()) return null;
  if (!/^\+254[17]\d{8}$/.test(phone.number)) return null;
  return phone.number;
}
