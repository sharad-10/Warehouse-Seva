import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";

import { AppLanguage, translations } from "./translations";

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => Promise<void>;
  t: (key: string) => string;
};

const STORAGE_KEY = "warehouse-seva-language";

const LanguageContext = React.createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = React.useState<AppLanguage>("en");

  React.useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === "en" || stored === "hi") {
        setLanguageState(stored);
      }
    }).catch(() => {
      // Ignore read failures and keep default language.
    });
  }, []);

  const setLanguage = React.useCallback(async (nextLanguage: AppLanguage) => {
    setLanguageState(nextLanguage);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, nextLanguage);
    } catch {
      // Ignore persistence failures and keep in-memory language.
    }
  }, []);

  const t = React.useCallback((key: string) => {
    return translations[language][key] ?? translations.en[key] ?? key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = React.useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider.");
  }

  return context;
}
