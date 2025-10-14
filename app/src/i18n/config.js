import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enCommon from "./resources/en/common.json";
import deCommon from "./resources/de/common.json";

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: enCommon },
    de: { translation: deCommon }
  },
  lng: "de",
  fallbackLng: "en",
  initImmediate: false,
  interpolation: {
    escapeValue: false
  },
  react: {
    useSuspense: false
  }
});

export default i18n;
