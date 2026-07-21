import type { Team } from "@/lib/tonoi";

export type Competition = "liga" | "champions" | "europa" | "copa" | "conference";
export type ImageType = "anuncio" | "resultado";

export type DomesticLeague =
  | "premier"
  | "laliga"
  | "bundesliga"
  | "serie-a"
  | "ligue-1"
  | "eredivisie"
  | "primeira-liga";

export type DomesticCup =
  | "copa-del-rey"
  | "fa-cup"
  | "carabao-cup"
  | "dfb-pokal"
  | "coppa-italia"
  | "coupe-de-france"
  | "knvb-beker"
  | "taca-de-portugal"
  | "otra";

export type Scorer = {
  side: "home" | "away";
  minute: string;
  player: string;
};

/** Agrupa goleadores por jugador (mismo lado) manteniendo el orden de aparición,
 *  y devuelve entradas del tipo "5', 14' Kane". */
export function groupScorers(scorers: Scorer[], side: "home" | "away"): string[] {
  const order: string[] = [];
  const map = new Map<string, string[]>();
  for (const s of scorers) {
    if (s.side !== side) continue;
    const key = (s.player ?? "").trim();
    if (!key) continue;
    if (!map.has(key)) {
      map.set(key, []);
      order.push(key);
    }
    map.get(key)!.push(`${s.minute}'`);
  }
  return order.map((name) => `${map.get(name)!.join(", ")} ${name}`);
}

/** Divide las entradas en columnas de un máximo de `perColumn` filas. */
export function splitIntoColumns<T>(items: T[], perColumn = 3): T[][] {
  if (items.length <= perColumn) return [items];
  const cols: T[][] = [];
  for (let i = 0; i < items.length; i += perColumn) {
    cols.push(items.slice(i, i + perColumn));
  }
  return cols;
}

export type TemplateData = {
  type: ImageType;
  competition: Competition;
  domesticLeague: DomesticLeague;
  domesticCup?: DomesticCup;
  ligaVariant?: "auto" | 1 | 2;
  homeTeam: Team | null;
  awayTeam: Team | null;
  date: string; // ISO
  time: string; // HH:MM
  stadium: string;
  homeGoals: number;
  awayGoals: number;
  scorers: Scorer[];
};

export const COMPETITION_LABELS: Record<Competition, string> = {
  liga: "Liga doméstica",
  champions: "Champions League",
  europa: "Europa League",
  copa: "Copa",
  conference: "Conference League",
};

export const LEAGUE_LABELS: Record<DomesticLeague, string> = {
  premier: "Premier League",
  laliga: "LaLiga",
  bundesliga: "Bundesliga",
  "serie-a": "Serie A",
  "ligue-1": "Ligue 1",
  eredivisie: "Eredivisie",
  "primeira-liga": "Primeira Liga",
};

export function formatDateEs(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  return `${dias[d.getDay()]}, ${d.getDate()} de ${meses[d.getMonth()]}, ${d.getFullYear()}`;
}

export function formatDateEn(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const day = d.getDate();
  const suf = day % 10 === 1 && day !== 11 ? "st" : day % 10 === 2 && day !== 12 ? "nd" : day % 10 === 3 && day !== 13 ? "rd" : "th";
  return `${days[d.getDay()]}, ${day}${suf} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function pickLaLigaVariant(data: TemplateData): 1 | 2 {
  if (data.ligaVariant === 1 || data.ligaVariant === 2) return data.ligaVariant;
  const seed = `${data.date}-${data.homeTeam?.id ?? ""}-${data.awayTeam?.id ?? ""}`;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return (Math.abs(h) % 2 === 0 ? 1 : 2);
}

// Asset paths (in /public so html-to-image can fetch them with same-origin)
export const ASSETS = {
  tonoiLogo: "/social/logo-tonoi.png",
  competitions: {
    liga: "/social/competitions/laliga.png", // fallback genérico (no se usa: se usa LEAGUE_ASSETS)
    champions: "/social/competitions/champions.png",
    europa: "/social/competitions/europa-league.png",
    copa: "/social/competitions/copa.png",
    conference: "/social/competitions/conference.png",
  } as Record<Competition, string>,
  templates: {
    anuncio: "/social/templates/anuncio-bg.jpg",
    "liga-1": "/social/templates/resultado-liga-1.png",
    "liga-2": "/social/templates/resultado-liga-2.png",
    champions: "/social/templates/resultado-champions.png",
    europa: "/social/templates/resultado-europaleague.png",
    copa: "/social/templates/resultado-copa.png",
  },
};

export const LEAGUE_ASSETS: Record<DomesticLeague, string> = {
  premier: "/social/competitions/leagues/premier.png",
  laliga: "/social/competitions/leagues/laliga.png",
  bundesliga: "/social/competitions/leagues/bundesliga.png",
  "serie-a": "/social/competitions/leagues/serie-a.png",
  "ligue-1": "/social/competitions/leagues/ligue-1.png",
  eredivisie: "/social/competitions/leagues/eredivisie.png",
  "primeira-liga": "/social/competitions/leagues/primeira-liga.png",
};

export const CUP_LABELS: Record<DomesticCup, string> = {
  "copa-del-rey": "Copa del Rey",
  "fa-cup": "FA Cup",
  "carabao-cup": "Carabao Cup (EFL Cup)",
  "dfb-pokal": "DFB-Pokal",
  "coppa-italia": "Coppa Italia",
  "coupe-de-france": "Coupe de France",
  "knvb-beker": "KNVB Beker",
  "taca-de-portugal": "Taça de Portugal",
  otra: "Otra copa",
};

export const CUP_ASSETS: Record<DomesticCup, string> = {
  "copa-del-rey": "/social/competitions/copa.png",
  "fa-cup": "/social/competitions/fa-cup.png",
  "carabao-cup": "/social/competitions/carabao-cup.png",
  "dfb-pokal": "/social/competitions/cups/dfb-pokal.png",
  "coppa-italia": "/social/competitions/cups/coppa-italia.png",
  "coupe-de-france": "/social/competitions/cups/coupe-de-france.png",
  "knvb-beker": "/social/competitions/cups/knvb-beker.png",
  "taca-de-portugal": "/social/competitions/cups/taca-de-portugal.png",
  otra: "/social/competitions/copa.png",
};

export function competitionLogo(data: TemplateData): string {
  if (data.competition === "liga") return LEAGUE_ASSETS[data.domesticLeague];
  if (data.competition === "copa") return CUP_ASSETS[data.domesticCup ?? "copa-del-rey"];
  return ASSETS.competitions[data.competition];
}

