// Países / naciones futbolísticas usadas para la nacionalidad de los equipos.
// Se usa ISO 3166-1 alpha-2 en minúsculas, salvo Reino Unido, donde se usan
// las naciones futbolísticas (gb-eng, gb-sct, gb-wls, gb-nir).

export const UK_NATIONS: Record<string, Record<string, string>> = {
  "gb-eng": { es: "Inglaterra", en: "England", it: "Inghilterra", ca: "Anglaterra", eu: "Ingalaterra", pt: "Inglaterra", gl: "Inglaterra" },
  "gb-sct": { es: "Escocia", en: "Scotland", it: "Scozia", ca: "Escòcia", eu: "Eskozia", pt: "Escócia", gl: "Escocia" },
  "gb-wls": { es: "Gales", en: "Wales", it: "Galles", ca: "Gal·les", eu: "Gales", pt: "País de Gales", gl: "Gales" },
  "gb-nir": { es: "Irlanda del Norte", en: "Northern Ireland", it: "Irlanda del Nord", ca: "Irlanda del Nord", eu: "Ipar Irlanda", pt: "Irlanda do Norte", gl: "Irlanda do Norte" },
};

/** Códigos disponibles en el selector del panel de administración. */
export const COUNTRY_CODES: string[] = [
  "gb-eng", "gb-sct", "gb-wls", "gb-nir",
  "ad", "ae", "al", "am", "ar", "at", "au", "az", "ba", "be", "bg", "bo", "br", "by",
  "ca", "cl", "cn", "co", "cr", "cy", "cz", "de", "dk", "dz", "ec", "ee", "eg", "es",
  "fi", "fo", "fr", "ge", "gr", "gt", "hn", "hr", "hu", "id", "ie", "il", "in", "iq",
  "ir", "is", "it", "jm", "jp", "kr", "kz", "lt", "lu", "lv", "ly", "ma", "mc", "md",
  "me", "mk", "mt", "mx", "my", "ng", "nl", "no", "nz", "pa", "pe", "pl", "pt", "py",
  "qa", "ro", "rs", "ru", "sa", "se", "si", "sk", "sn", "sv", "th", "tn", "tr", "ua",
  "us", "uy", "uz", "ve", "vn", "xk", "za",
];

const displayCache = new Map<string, Intl.DisplayNames>();
function displayNames(lang: string) {
  let d = displayCache.get(lang);
  if (!d) {
    try {
      d = new Intl.DisplayNames([lang, "es", "en"], { type: "region" });
    } catch {
      d = new Intl.DisplayNames(["es"], { type: "region" });
    }
    displayCache.set(lang, d);
  }
  return d;
}

/** Nombre del país en el idioma indicado. */
export function countryName(code: string | null | undefined, lang = "es"): string {
  if (!code) return "";
  const base = lang.split("-")[0];
  const uk = UK_NATIONS[code];
  if (uk) return uk[base] ?? uk.es;
  if (code === "xk") return "Kosovo";
  try {
    return displayNames(base).of(code.toUpperCase()) ?? code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

/** URL de la bandera (flagcdn soporta también gb-eng, gb-sct, gb-wls, gb-nir). */
export function flagUrl(code: string, width: 20 | 40 | 80 | 160 = 40): string {
  return `https://flagcdn.com/w${width}/${code.toLowerCase()}.png`;
}
