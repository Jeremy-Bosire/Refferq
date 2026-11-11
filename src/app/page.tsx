import type { Metadata } from 'next';
import { LandingPage } from '@/components/LandingPage';
import { BRAND_NAME } from '@/lib/brand';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `${BRAND_NAME} | Share and track referrals`,
  description: 'Join free, review programme rules, and track qualifying referrals in one place.',
  openGraph: {
    title: `${BRAND_NAME} | Share and track referrals`,
    description: 'Join free, review programme rules, and track qualifying referrals in one place.',
    type: 'website',
  },
  alternates: {
    canonical: '/en-KE',
    languages: {
      'en-KE': '/en-KE',
      'sw-KE': '/sw-KE',
    },
  },
};

export default function HomePage() {
  return (
    <LandingPage
      brandName={BRAND_NAME}
      supportEmail={process.env.SUPPORT_EMAIL || ''}
      supportPhone={process.env.SUPPORT_PHONE || ''}
      businessRegNo={process.env.BUSINESS_REG_NO || ''}
    />
  );
}
