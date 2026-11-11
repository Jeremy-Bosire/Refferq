import type { Metadata } from 'next';
import { HowWeMakeMoneyPage } from '@/components/HowWeMakeMoneyPage';
import { BRAND_NAME } from '@/lib/brand';

export const metadata: Metadata = {
  title: `How ${BRAND_NAME} works`,
  description: 'Current payment, referral reward, and customer-fund disclosures for this product preview.',
  alternates: {
    canonical: '/en-KE/how-we-make-money',
    languages: {
      'en-KE': '/en-KE/how-we-make-money',
      'sw-KE': '/sw-KE/how-we-make-money',
    },
  },
};

export default function FundingPage() {
  return <HowWeMakeMoneyPage />;
}
