import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ruCommon from './ru/common.json';
import enCommon from './en/common.json';
import ruWard from './ru/ward.json';
import enWard from './en/ward.json';
import ruGuardian from './ru/guardian.json';
import enGuardian from './en/guardian.json';

const saved = localStorage.getItem('alivo_lang');
const lng = saved === 'en' ? 'en' : 'ru';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ru: { common: ruCommon, ward: ruWard, guardian: ruGuardian },
      en: { common: enCommon, ward: enWard, guardian: enGuardian },
    },
    lng,
    fallbackLng: 'ru',
    supportedLngs: ['ru', 'en'],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
  });

if (!saved) {
  localStorage.setItem('alivo_lang', 'ru');
}

export default i18n;
