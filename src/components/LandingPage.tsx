'use client';

import Link from 'next/link';
import { ArrowRight, BadgeCheck, CircleHelp, CreditCard, Gift, ShoppingBag, Wallet } from 'lucide-react';
import { useI18n } from '@/i18n/provider';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { InstallPrompt } from '@/components/InstallPrompt';

type Props = {
  brandName: string;
  supportEmail: string;
  supportPhone: string;
  businessRegNo: string;
};

const faqKeys = [
  ['faqJoinQuestion', 'faqJoinAnswer'],
  ['faqDepositQuestion', 'faqDepositAnswer'],
  ['faqRewardQuestion', 'faqRewardAnswer'],
  ['faqLevelsQuestion', 'faqLevelsAnswer'],
  ['faqWithdrawQuestion', 'faqWithdrawAnswer'],
  ['faqFeesQuestion', 'faqFeesAnswer'],
  ['faqRefundQuestion', 'faqRefundAnswer'],
  ['faqTaxQuestion', 'faqTaxAnswer'],
  ['faqMisleadQuestion', 'faqMisleadAnswer'],
  ['faqSpamQuestion', 'faqSpamAnswer'],
  ['faqPrivacyQuestion', 'faqPrivacyAnswer'],
  ['faqHelpQuestion', 'faqHelpAnswer'],
] as const;

export function LandingPage({ brandName, supportEmail, supportPhone, businessRegNo }: Props) {
  const { locale, t } = useI18n();
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqKeys.map(([question, answer]) => ({
      '@type': 'Question',
      name: t(question),
      acceptedAnswer: { '@type': 'Answer', text: t(answer) },
    })),
  };
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: brandName,
  };

  const actions = [
    { icon: Wallet, title: t('tileDeposit'), description: t('tileDepositDescription') },
    { icon: ShoppingBag, title: t('tileShop'), description: t('tileShopDescription') },
    { icon: Gift, title: t('tileRefer'), description: t('tileReferDescription') },
    { icon: CreditCard, title: t('tileWithdraw'), description: t('tileWithdrawDescription') },
  ];

  const steps = [
    ['stepOne', 'stepOneDescription'],
    ['stepTwo', 'stepTwoDescription'],
    ['stepThree', 'stepThreeDescription'],
  ] as const;

  return (
    <main lang={locale} className="min-h-screen bg-slate-50 text-slate-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, '\\u003c') }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema).replace(/</g, '\\u003c') }} />
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-xl font-extrabold tracking-tight text-blue-700" aria-label={brandName}>{brandName}</Link>
        <nav className="flex flex-wrap items-center justify-end gap-2" aria-label={t('mainMenu')}>
          <LanguageSwitcher />
          <InstallPrompt />
          <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-white">{t('signIn')}</Link>
          <Link href="/register" className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">{t('joinFree')}</Link>
        </nav>
      </header>

      <section className="border-y border-blue-100 bg-gradient-to-br from-blue-50 via-white to-amber-50">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-[1.15fr_.85fr] md:py-24 lg:px-8">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800"><BadgeCheck size={16} />{t('landingEyebrow')}</p>
            <h1 className="max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">{t('landingTitle')}</h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">{t('landingDescription')}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-blue-700 px-5 font-semibold text-white hover:bg-blue-800">{t('joinFree')} <ArrowRight size={18} /></Link>
              <Link href="/login" className="inline-flex min-h-12 items-center rounded-xl border border-slate-300 bg-white px-5 font-semibold text-slate-800 hover:bg-slate-100">{t('signIn')}</Link>
            </div>
            <p className="mt-5 flex items-start gap-2 text-sm text-slate-600"><CreditCard className="mt-0.5 shrink-0" size={17} />{t('paymentsNotEnabled')}</p>
          </div>
          <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-xl shadow-blue-900/5 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">{t('paymentStatus')}</p>
            <h2 className="mt-2 text-2xl font-bold">{t('transparentRules')}</h2>
            <ul className="mt-6 space-y-4 text-sm leading-6 text-slate-700">
              <li className="flex gap-3"><BadgeCheck className="mt-1 shrink-0 text-emerald-600" size={18} />{t('noJoiningFee')}</li>
              <li className="flex gap-3"><BadgeCheck className="mt-1 shrink-0 text-emerald-600" size={18} />{t('rewardConditions')}</li>
              <li className="flex gap-3"><BadgeCheck className="mt-1 shrink-0 text-emerald-600" size={18} />{t('noDepositReturns')}</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold sm:text-3xl">{t('whatYouCanDo')}</h2>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {actions.map(({ icon: Icon, title, description }) => (
            <article key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="inline-flex rounded-xl bg-blue-50 p-3 text-blue-700"><Icon size={22} /></span>
              <h3 className="mt-4 font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold sm:text-3xl">{t('howItWorks')}</h2>
          <ol className="mt-7 grid gap-5 md:grid-cols-3">
            {steps.map(([title, description], index) => (
              <li key={title} className="rounded-2xl border border-slate-200 p-6">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-700 font-bold text-white">{index + 1}</span>
                <h3 className="mt-4 text-lg font-bold">{t(title)}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{t(description)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-2 lg:px-8">
        <div>
          <h2 className="text-2xl font-bold">{t('paymentMethods')}</h2>
          <p className="mt-3 text-slate-600">{t('paymentMethodsPending')}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-xl font-bold">{t('learnHowFundsWork')}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">{t('legalDetailsPending')}</p>
          <Link href={`/${locale}/how-we-make-money`} className="mt-4 inline-flex items-center gap-2 font-semibold text-blue-800 hover:underline">{t('learnHowFundsWork')} <ArrowRight size={16} /></Link>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="flex items-center gap-3 text-2xl font-bold sm:text-3xl"><CircleHelp className="text-blue-700" />{t('faqTitle')}</h2>
          <div className="mt-7 divide-y divide-slate-200 border-y border-slate-200">
            {faqKeys.map(([question, answer]) => (
              <details key={question} className="group py-4">
                <summary className="cursor-pointer list-none pr-8 font-semibold marker:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700">{t(question)}</summary>
                <p className="mt-3 text-sm leading-6 text-slate-600">{t(answer)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-100">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 text-sm text-slate-600 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div><p className="font-bold text-slate-900">{brandName}</p><p className="mt-1">{t('legalDetailsPending')}</p>
            {businessRegNo && <p>{businessRegNo}</p>}
            {supportEmail && <a className="mr-3 underline" href={`mailto:${supportEmail}`}>{supportEmail}</a>}
            {supportPhone && <a className="underline" href={`tel:${supportPhone}`}>{supportPhone}</a>}
          </div>
          <div className="flex items-center gap-4"><Link href={`/${locale}/how-we-make-money`} className="underline">{t('learnHowFundsWork')}</Link><LanguageSwitcher /></div>
        </div>
      </footer>
    </main>
  );
}
