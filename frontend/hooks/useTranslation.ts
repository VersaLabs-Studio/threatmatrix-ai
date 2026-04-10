'use client';

import { useState, useEffect, useCallback } from 'react';
import en from '@/messages/en.json';
import am from '@/messages/am.json';

type Locale = 'en' | 'am';
type Translations = typeof en;

const translations: Record<Locale, Translations> = { en, am };

export function useTranslation() {
  const [locale, setLocale] = useState<Locale>('en');

  useEffect(() => {
    const saved = localStorage.getItem('tm_locale') as Locale;
    if (saved && (saved === 'en' || saved === 'am')) {
      setLocale(saved);
    }
  }, []);

  const toggleLocale = useCallback(() => {
    const next = locale === 'en' ? 'am' : 'en';
    setLocale(next);
    localStorage.setItem('tm_locale', next);
    // Force a re-render or notify other listeners if needed
    window.dispatchEvent(new Event('localeChange'));
  }, [locale]);

  const t = useCallback((path: string) => {
    const keys = path.split('.');
    let current: any = translations[locale];
    
    for (const key of keys) {
      if (current && current[key]) {
        current = current[key];
      } else {
        return path; // Fallback to key
      }
    }
    
    return current;
  }, [locale]);

  // Listen for changes from other components
  useEffect(() => {
    const handler = () => {
      const saved = localStorage.getItem('tm_locale') as Locale;
      if (saved) setLocale(saved);
    };
    window.addEventListener('localeChange', handler);
    return () => window.removeEventListener('localeChange', handler);
  }, []);

  return { t, locale, toggleLocale };
}
