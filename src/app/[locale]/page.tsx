import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { I18nProvider } from '@/i18n/provider';
import { messages, type Locale } from '@/i18n/messages';
import { LandingPage } from '@/components/LandingPage';
import { BRAND_NAME } from '@/lib/brand';

const locales: Locale[] = ['en-KE', 'sw-KE'];

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: requestedLocale } = await params;
  if (!locales.includes(requestedLocale as Locale)) return {};

  const locale = requestedLocale as Locale;
  const title = `${BRAND_NAME} | ${messages[locale].landingTitle}`;
  const description = messages[locale].landingDescription;
  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}`,
      languages: { 'en-KE': '/en-KE', 'sw-KE': '/sw-KE' },
    },
    openGraph: {
      title,
      description,
      type: 'website',
      locale: locale === 'sw-KE' ? 'sw_KE' : 'en_KE',
      alternateLocale: locale === 'sw-KE' ? ['en_KE'] : ['sw_KE'],
    },
  };
}

export default async function LocalizedHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: requestedLocale } = await params;
  if (!locales.includes(requestedLocale as Locale)) notFound();
  const locale = requestedLocale as Locale;

  return (
    <I18nProvider initialLocale={locale}>
      <LandingPage
        brandName={BRAND_NAME}
        supportEmail={process.env.SUPPORT_EMAIL || ''}
        supportPhone={process.env.SUPPORT_PHONE || ''}
        businessRegNo={process.env.BUSINESS_REG_NO || ''}
      />
    </I18nProvider>
  );
}
