/** Public-facing product identity. Operational/legal details remain unset until configured. */
export const BRAND_NAME = process.env.NEXT_PUBLIC_BRAND_NAME?.trim() || 'GanjiLink';
export const BRAND_PRIMARY_COLOR = process.env.NEXT_PUBLIC_BRAND_PRIMARY_COLOR?.trim() || '#2563eb';
