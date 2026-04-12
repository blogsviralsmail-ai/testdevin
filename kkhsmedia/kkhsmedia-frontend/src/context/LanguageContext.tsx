import { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'hi';

const translations: Record<string, Record<Language, string>> = {
  // Navigation
  'nav.dashboard': { en: 'Dashboard', hi: 'डैशबोर्ड' },
  'nav.liveSlots': { en: 'Live Slots', hi: 'लाइव स्लॉट' },
  'nav.videos': { en: 'Videos', hi: 'वीडियो' },
  'nav.analytics': { en: 'Analytics', hi: 'एनालिटिक्स' },
  'nav.billing': { en: 'Billing', hi: 'बिलिंग' },
  'nav.profile': { en: 'Profile', hi: 'प्रोफाइल' },
  'nav.notifications': { en: 'Notifications', hi: 'सूचनाएं' },
  'nav.webhooks': { en: 'Webhooks', hi: 'वेबहुक' },
  'nav.referrals': { en: 'Referrals', hi: 'रेफरल' },
  'nav.reseller': { en: 'Reseller Panel', hi: 'रीसेलर पैनल' },
  'nav.settings': { en: 'Settings', hi: 'सेटिंग्स' },
  'nav.logout': { en: 'Logout', hi: 'लॉग आउट' },

  // Admin
  'admin.dashboard': { en: 'Admin Dashboard', hi: 'एडमिन डैशबोर्ड' },
  'admin.users': { en: 'Users', hi: 'यूजर्स' },
  'admin.slots': { en: 'Slots', hi: 'स्लॉट' },
  'admin.videos': { en: 'Videos', hi: 'वीडियो' },
  'admin.orders': { en: 'Orders', hi: 'ऑर्डर' },
  'admin.products': { en: 'Products', hi: 'प्रोडक्ट' },
  'admin.coupons': { en: 'Coupons', hi: 'कूपन' },
  'admin.resellers': { en: 'Resellers', hi: 'रीसेलर' },
  'admin.contacts': { en: 'Contacts', hi: 'संपर्क' },
  'admin.analytics': { en: 'Analytics', hi: 'एनालिटिक्स' },
  'admin.settings': { en: 'Settings', hi: 'सेटिंग्स' },

  // Common
  'common.loading': { en: 'Loading...', hi: 'लोड हो रहा है...' },
  'common.save': { en: 'Save', hi: 'सेव करें' },
  'common.cancel': { en: 'Cancel', hi: 'रद्द करें' },
  'common.delete': { en: 'Delete', hi: 'हटाएं' },
  'common.edit': { en: 'Edit', hi: 'संपादित करें' },
  'common.add': { en: 'Add', hi: 'जोड़ें' },
  'common.search': { en: 'Search', hi: 'खोजें' },
  'common.filter': { en: 'Filter', hi: 'फ़िल्टर' },
  'common.noData': { en: 'No data found', hi: 'कोई डेटा नहीं मिला' },
  'common.confirm': { en: 'Are you sure?', hi: 'क्या आप पक्के हैं?' },

  // Stream
  'stream.startStream': { en: 'Start Stream', hi: 'स्ट्रीम शुरू करें' },
  'stream.stopStream': { en: 'Stop Stream', hi: 'स्ट्रीम बंद करें' },
  'stream.live': { en: 'LIVE', hi: 'लाइव' },
  'stream.offline': { en: 'Offline', hi: 'ऑफलाइन' },
  'stream.streamKey': { en: 'Stream Key', hi: 'स्ट्रीम की' },
  'stream.platform': { en: 'Platform', hi: 'प्लेटफ़ॉर्म' },

  // Auth
  'auth.login': { en: 'Login', hi: 'लॉग इन' },
  'auth.register': { en: 'Register', hi: 'रजिस्टर करें' },
  'auth.email': { en: 'Email', hi: 'ईमेल' },
  'auth.password': { en: 'Password', hi: 'पासवर्ड' },
  'auth.forgotPassword': { en: 'Forgot Password?', hi: 'पासवर्ड भूल गए?' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('language') as Language) || 'en';
  });

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
