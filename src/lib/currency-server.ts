import { prisma } from './prisma';

/** Legacy response compatibility. KES is the default; USD remains optional. */
export async function getCurrencySymbol(): Promise<string> {
  try {
    const settings = await prisma.programSettings.findFirst({ select: { currency: true } });
    const currency = settings?.currency === 'USD' ? 'USD' : 'KES';
    const parts = new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
    }).formatToParts(0);
    return parts.find((part) => part.type === 'currency')?.value || currency;
  } catch (error) {
    console.error('Failed to fetch currency symbol:', error);
    return 'KSh';
  }
}
