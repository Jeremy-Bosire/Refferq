import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { HowWeMakeMoneyPage } from '@/components/HowWeMakeMoneyPage';
import { I18nProvider } from '@/i18n/provider';
import { messages, type Locale } from '@/i18n/messages';
import { BRAND_NAME } from '@/lib/brand';

const locales: Locale[] = ['en-KE', 'sw-KE'];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: requestedLocale } = await params;
  if (!locales.includes(requestedLocale as Locale)) return {};

  const locale = requestedLocale as Locale;
  const title = messages[locale].fundingPageTitle;
  const description = messages[locale].fundingPageCurrentState;
  return {
    title: `${title} | ${BRAND_NAME}`,
    description,
    alternates: {
      canonical: `/${locale}/how-we-make-money`,
      languages: {
        'en-KE': '/en-KE/how-we-make-money',
        'sw-KE': '/sw-KE/how-we-make-money',
      },
    },
    openGraph: {
      title: `${title} | ${BRAND_NAME}`,
      description,
      type: 'article',
      locale: locale === 'sw-KE' ? 'sw_KE' : 'en_KE',
      alternateLocale: locale === 'sw-KE' ? ['en_KE'] : ['sw_KE'],
    },
  };
}

export default async function LocalizedFundingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: requestedLocale } = await params;
  if (!locales.includes(requestedLocale as Locale)) notFound();
  const locale = requestedLocale as Locale;
  return <I18nProvider initialLocale={locale}><HowWeMakeMoneyPage /></I18nProvider>;
}
