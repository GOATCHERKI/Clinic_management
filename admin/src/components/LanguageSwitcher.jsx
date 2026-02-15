import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'tr' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors"
    >
      {i18n.language === 'en' ? 'TR' : 'EN'}
    </button>
  );
};

export default LanguageSwitcher; 