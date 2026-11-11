'use client';

import Link from 'next/link';
import { useI18n } from '@/i18n/provider';
import { BRAND_NAME } from '@/lib/brand';

export function HowWeMakeMoneyPage() {
  const { locale, t } = useI18n();
  const homeHref = locale === 'en-KE' || locale === 'sw-KE' ? `/${locale}` : '/';

  return (
    <main lang={locale} className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:px-6">
      <article className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <Link href={homeHref} className="text-sm font-semibold text-blue-700 hover:underline">← {BRAND_NAME}</Link>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight">{t('fundingPageTitle')}</h1>
        <div className="mt-6 space-y-5 text-base leading-7 text-slate-700">
          <p>{t('fundingPageCurrentState')}</p>
          <p>{t('fundingPageTruth')}</p>
          <p>{t('fundingPageRewards')}</p>
          <p>{t('fundingPageContact')}</p>
        </div>
      </article>
    </main>
  );
}
