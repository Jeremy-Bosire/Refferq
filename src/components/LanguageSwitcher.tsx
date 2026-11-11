'use client';

import { useI18n } from '@/i18n/provider';

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
      <span className="hidden sm:inline">{t('language')}</span>
      <select
        aria-label={t('language')}
        className="max-w-[7.5rem] rounded-md border bg-background px-2 py-1 text-foreground"
        value={locale}
        onChange={(event) => setLocale(event.target.value as 'en-KE' | 'sw-KE')}
      >
        <option value="en-KE">{t('languageEnglish')}</option>
        <option value="sw-KE">{t('languageSwahili')}</option>
      </select>
    </label>
  );
}
