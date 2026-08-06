import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import esCommon from "./locales/es/common.json";
import enCommon from "./locales/en/common.json";
import itCommon from "./locales/it/common.json";
import esHome from "./locales/es/home.json";
import enHome from "./locales/en/home.json";
import itHome from "./locales/it/home.json";
import esStandings from "./locales/es/standings.json";
import enStandings from "./locales/en/standings.json";
import itStandings from "./locales/it/standings.json";
import esMatches from "./locales/es/matches.json";
import enMatches from "./locales/en/matches.json";
import itMatches from "./locales/it/matches.json";
import esStats from "./locales/es/stats.json";
import enStats from "./locales/en/stats.json";
import itStats from "./locales/it/stats.json";
import esPages from "./locales/es/pages.json";
import enPages from "./locales/en/pages.json";
import itPages from "./locales/it/pages.json";

export const SUPPORTED_LANGUAGES = [
  { code: "es", label: "Español", short: "ES" },
  { code: "en", label: "English", short: "EN" },
  { code: "it", label: "Italiano", short: "IT" },
] as const;

export type LangCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

export const resources = {
  es: { common: esCommon, home: esHome, standings: esStandings, matches: esMatches, stats: esStats, pages: esPages },
  en: { common: enCommon, home: enHome, standings: enStandings, matches: enMatches, stats: enStats, pages: enPages },
  it: { common: itCommon, home: itHome, standings: itStandings, matches: itMatches, stats: itStats, pages: itPages },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "es",
    supportedLngs: ["es", "en", "it"],
    defaultNS: "common",
    ns: ["common", "home", "standings", "matches", "stats", "pages"],
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "tonoi-lang",
      caches: ["localStorage"],
    },
    interpolation: { escapeValue: false },
  });

const applyHtmlLang = (lng: string) => {
  document.documentElement.lang = lng;
  const title = i18n.t("meta.title", { ns: "common" });
  if (title && title !== "meta.title") document.title = title;
  const desc = i18n.t("meta.description", { ns: "common" });
  const el = document.querySelector('meta[name="description"]');
  if (el && desc && desc !== "meta.description") el.setAttribute("content", desc);
};
applyHtmlLang(i18n.resolvedLanguage ?? "es");
i18n.on("languageChanged", applyHtmlLang);


/** date-fns / Intl locale tag for the active language */
export function localeTag(lng?: string) {
  switch (lng ?? i18n.resolvedLanguage) {
    case "en":
      return "en-GB";
    case "it":
      return "it-IT";
    default:
      return "es-ES";
  }
}

export default i18n;
