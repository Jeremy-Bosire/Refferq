export const KENYAN_COUNTIES = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu', 'Garissa',
  'Homa Bay', 'Isiolo', 'Kajiado', 'Kakamega', 'Kericho', 'Kiambu', 'Kilifi',
  'Kirinyaga', 'Kisii', 'Kisumu', 'Kitui', 'Kwale', 'Laikipia', 'Lamu', 'Machakos',
  'Makueni', 'Mandera', 'Marsabit', 'Meru', 'Migori', 'Mombasa', 'Murang’a',
  'Nairobi', 'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua', 'Nyeri',
  'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River', 'Tharaka-Nithi', 'Trans Nzoia',
  'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot',
] as const;

export type CountryCode = 'KE';

export interface CountryConfig {
  code: CountryCode;
  name: string;
  currency: 'KES';
  locale: 'en-KE';
  timezone: 'Africa/Nairobi';
  callingCode: '+254';
  mobileNationalPrefixes: readonly ['7', '1'];
  counties: readonly string[];
  paymentMethods: Readonly<Record<'MPESA' | 'AIRTEL_MONEY', { enabled: boolean }>>;
  tax: { withholdingEnabled: boolean; withholdingRateBasisPoints: number | null };
}

export const COUNTRY_CONFIG: Readonly<Record<CountryCode, CountryConfig>> = {
  KE: {
    code: 'KE',
    name: 'Kenya',
    currency: 'KES',
    locale: 'en-KE',
    timezone: 'Africa/Nairobi',
    callingCode: '+254',
    mobileNationalPrefixes: ['7', '1'],
    counties: KENYAN_COUNTIES,
    // These are planned adapters. Neither collection nor payout is active yet.
    paymentMethods: {
      MPESA: { enabled: false },
      AIRTEL_MONEY: { enabled: false },
    },
    tax: { withholdingEnabled: false, withholdingRateBasisPoints: null },
  },
};

export function getCountryConfig(code: string): CountryConfig | null {
  return Object.prototype.hasOwnProperty.call(COUNTRY_CONFIG, code)
    ? COUNTRY_CONFIG[code as CountryCode]
    : null;
}

export function isKenyanCounty(value: unknown): value is (typeof KENYAN_COUNTIES)[number] {
  return typeof value === 'string' && (KENYAN_COUNTIES as readonly string[]).includes(value);
}
