import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 rounded-xl font-medium text-gray-700 hover:bg-gray-100 transition-colors"
      title={i18n.language === 'fr' ? 'Switch to English' : 'Passer en français'}
    >
      <Globe className="w-5 h-5" />
      <span className="hidden sm:inline text-sm font-bold uppercase">
        {i18n.language === 'fr' ? 'FR' : 'EN'}
      </span>
    </button>
  );
}
