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

export type Scorer = {
  side: "home" | "away";
  minute: string;
  player: string;
};

export type TemplateData = {
  type: ImageType;
  competition: Competition;
  domesticLeague: DomesticLeague;
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
    "liga-1": "/social/templates/resultado-laliga-1.jpg",
    "liga-2": "/social/templates/resultado-laliga-2.jpg",
    champions: "/social/templates/resultado-champions.jpg",
    europa: "/social/templates/resultado-europa.jpg",
    copa: "/social/templates/resultado-copa.jpg",
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

export function competitionLogo(data: TemplateData): string {
  if (data.competition === "liga") return LEAGUE_ASSETS[data.domesticLeague];
  return ASSETS.competitions[data.competition];
}
