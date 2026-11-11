'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { messages, type Locale, type MessageKey } from './messages';

const STORAGE_KEY = 'refferq.locale';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, values?: Record<string, string>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children, initialLocale }: { children: React.ReactNode; initialLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale || 'en-KE');

  useEffect(() => {
    if (initialLocale) {
      window.localStorage.setItem(STORAGE_KEY, initialLocale);
      return;
    }
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'en-KE' || saved === 'sw-KE') setLocaleState(saved);
  }, [initialLocale]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((nextLocale: Locale) => {
    window.localStorage.setItem(STORAGE_KEY, nextLocale);
    const [firstSegment, ...rest] = window.location.pathname.split('/').filter(Boolean);
    if (firstSegment === 'en-KE' || firstSegment === 'sw-KE') {
      const nextPath = `/${nextLocale}${rest.length ? `/${rest.join('/')}` : ''}`;
      window.location.assign(`${nextPath}${window.location.search}${window.location.hash}`);
      return;
    }
    setLocaleState(nextLocale);
  }, []);

  const t = useCallback((key: MessageKey, values: Record<string, string> = {}) => {
    let value: string = messages[locale][key] || messages['en-KE'][key];
    for (const [name, replacement] of Object.entries(values)) {
      value = value.replaceAll(`{${name}}`, replacement);
    }
    return value;
  }, [locale]);

  const contextValue = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);
  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used inside I18nProvider');
  return context;
}
