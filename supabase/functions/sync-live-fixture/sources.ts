// Extra data sources for the live-match widget.
//
// 1. football-data.org (free tier, current seasons) -> reliable schedule + score
// 2. Firecrawl + Lovable AI  -> fallback that works for any club in the world
//
// Both return the same normalised shape so the sync function can store it.

export type NormalisedFixture = {
  fixture_id: number;
  kickoff_at: string;
  league_name: string | null;
  league_logo: string | null;
  round: string | null;
  home_name: string;
  away_name: string;
  home_logo: string | null;
  away_logo: string | null;
  home_goals: number | null;
  away_goals: number | null;
  home_pens: number | null;
  away_pens: number | null;
  status_short: string;
  status_long: string | null;
  elapsed: number | null;
  events: unknown[];
  source: string;
};

/* ------------------------------------------------------------------ */
/* TheSportsDB (free key, current seasons, worldwide)                  */
/* ------------------------------------------------------------------ */

const TSDB = "https://www.thesportsdb.com/api/v1/json/3";

async function tsdbGet(path: string) {
  const res = await fetch(`${TSDB}${path}`);
  if (!res.ok) throw new Error(`thesportsdb ${res.status}`);
  return await res.json();
}

/** Find the TheSportsDB team id (and its api-football id, when known). */
export async function tsdbFindTeam(
  name: string,
): Promise<{ id: number; apiFootballId: number | null } | null> {
  const searches = Array.from(new Set([name, simplifySearchName(name)].filter(Boolean)));
  const soccer: any[] = [];
  for (const search of searches) {
    const data = await tsdbGet(`/searchteams.php?t=${encodeURIComponent(search)}`);
    const teams: any[] = data?.teams ?? [];
    for (const team of teams.filter((t) => t?.strSport === "Soccer")) {
      if (!soccer.some((existing) => existing?.idTeam === team?.idTeam)) soccer.push(team);
    }
  }
  const target = normalise(name);
  const allowsReserve = isReserveTeamName(name);
  const best = soccer
    .map((team) => ({ team, score: scoreTeamMatch(team, target, allowsReserve) }))
    .sort((a, b) => b.score - a.score)[0]?.team;
  if (!best?.idTeam) return null;
  return {
    id: Number(best.idTeam),
    apiFootballId: best?.idAPIfootball ? Number(best.idAPIfootball) : null,
  };
}

function simplifySearchName(name: string) {
  return name
    .replace(/\b(balompi[eé]|s\.?a\.?d\.?)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isReserveTeamName(name: string) {
  const clean = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, " ");
  return /\b(b|c|ii|iii|u\s*-?\s*\d{2}|under\s*\d{2}|reserve|reserves|youth|academy)\b/.test(clean);
}

function scoreTeamMatch(team: any, target: string, allowsReserve: boolean) {
  const name = normalise(team?.strTeam ?? "");
  const alternate = normalise(`${team?.strTeamAlternate ?? ""}`);
  let score = 0;
  if (name === target) score = 100;
  else if (name.includes(target) || target.includes(name)) score = 80;
  else if (alternate === target) score = 70;
  else if (alternate.includes(target) || target.includes(alternate)) score = 60;
  else score = 10;

  if (!allowsReserve && isReserveTeamName(team?.strTeam ?? "")) score -= 50;
  return score;
}

function tsdbMap(e: any): NormalisedFixture {
  const kickoff = e?.strTimestamp
    ? new Date(`${e.strTimestamp}${e.strTimestamp.endsWith("Z") ? "" : "Z"}`)
    : new Date(`${e?.dateEvent}T${e?.strTime ?? "00:00:00"}Z`);
  const home = e?.intHomeScore === null || e?.intHomeScore === undefined ? null : Number(e.intHomeScore);
  const away = e?.intAwayScore === null || e?.intAwayScore === undefined ? null : Number(e.intAwayScore);
  const rawStatus = String(e?.strStatus ?? "").trim();
  const status = mapTsdbStatus(rawStatus, home !== null && away !== null);
  return {
    fixture_id: Number(e.idEvent),
    kickoff_at: kickoff.toISOString(),
    league_name: e?.strLeague ?? null,
    league_logo: e?.strLeagueBadge ?? null,
    round: e?.intRound ? `Jornada ${e.intRound}` : (e?.strGroup ?? null),
    home_name: e?.strHomeTeam ?? "?",
    away_name: e?.strAwayTeam ?? "?",
    home_logo: e?.strHomeTeamBadge ?? null,
    away_logo: e?.strAwayTeamBadge ?? null,
    home_goals: home,
    away_goals: away,
    home_pens: null,
    away_pens: null,
    status_short: status.short,
    status_long: status.long,
    elapsed: null,
    events: [],
    source: "thesportsdb",
  };
}

function mapTsdbStatus(rawStatus: string, hasScore: boolean) {
  const status = rawStatus.toUpperCase();
  if (["1H", "HT", "2H", "ET", "P", "LIVE"].includes(status)) {
    return { short: status, long: rawStatus || "Live" };
  }
  if (["FT", "AET", "PEN"].includes(status) || status.includes("FINISHED")) {
    return { short: status.includes("PEN") ? "PEN" : status.includes("AET") ? "AET" : "FT", long: rawStatus || "Match Finished" };
  }
  if (status.includes("POSTPONED")) return { short: "PST", long: rawStatus };
  if (status.includes("CANCELLED")) return { short: "CANC", long: rawStatus };
  if (status.includes("SUSPENDED")) return { short: "SUSP", long: rawStatus };
  return { short: hasScore ? "LIVE" : "NS", long: rawStatus || (hasScore ? "Live" : "Not Started") };
}

/** Next scheduled fixture for a team. */
export async function tsdbNextFixture(teamId: number): Promise<NormalisedFixture | null> {
  const data = await tsdbGet(`/eventsnext.php?id=${teamId}`);
  const list: any[] = data?.events ?? [];
  const mapped = list
    .filter((e) => e?.strSport === "Soccer")
    .map(tsdbMap)
    .filter((f) => Number.isFinite(new Date(f.kickoff_at).getTime()))
    .sort((a, b) => new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime());
  return mapped[0] ?? null;
}

/** Refresh a stored TheSportsDB event (score once the match is played). */
export async function tsdbEvent(eventId: number): Promise<NormalisedFixture | null> {
  const data = await tsdbGet(`/lookupevent.php?id=${eventId}`);
  const e = data?.events?.[0];
  return e ? tsdbMap(e) : null;
}

/* ------------------------------------------------------------------ */
/* football-data.org                                                   */
/* ------------------------------------------------------------------ */

const FD_BASE = "https://api.football-data.org/v4";

async function fdGet(path: string, token: string) {
  const res = await fetch(`${FD_BASE}${path}`, { headers: { "X-Auth-Token": token } });
  if (!res.ok) throw new Error(`football-data ${res.status}: ${await res.text()}`);
  return await res.json();
}

/** Resolve a football-data team id from the club name (searches its competitions). */
export async function fdFindTeamId(token: string, name: string): Promise<number | null> {
  const target = normalise(name);
  const comps = ["PL", "PD", "SA", "BL1", "FL1", "DED", "PPL", "ELC", "BSA", "CL"];
  for (const comp of comps) {
    try {
      const data = await fdGet(`/competitions/${comp}/teams`, token);
      for (const t of data?.teams ?? []) {
        const candidates = [t?.name, t?.shortName, t?.tla].filter(Boolean).map(normalise);
        if (candidates.some((c: string) => c === target || c.includes(target) || target.includes(c))) {
          return t.id as number;
        }
      }
    } catch (_) {
      // rate limit or plan restriction -> try next competition
    }
  }
  return null;
}

function normalise(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(fc|cf|afc|sc|ac|club|de|futbol|football|calcio|cd|ud|rcd|sv|spvgg|bsc|balompie|sad)\b/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

const FD_STATUS: Record<string, string> = {
  SCHEDULED: "NS",
  TIMED: "NS",
  IN_PLAY: "2H",
  PAUSED: "HT",
  FINISHED: "FT",
  SUSPENDED: "SUSP",
  POSTPONED: "PST",
  CANCELLED: "CANC",
  AWARDED: "AWD",
};

/** Live match if there is one, otherwise the closest upcoming fixture. */
export async function fdNextFixture(token: string, teamId: number): Promise<NormalisedFixture | null> {
  const data = await fdGet(`/teams/${teamId}/matches?limit=60`, token);
  const list: any[] = data?.matches ?? [];
  const now = Date.now();

  const live = list.find((m) => ["IN_PLAY", "PAUSED"].includes(m?.status));
  const upcoming = list
    .filter((m) => ["SCHEDULED", "TIMED"].includes(m?.status) && new Date(m.utcDate).getTime() > now - 3 * 3600_000)
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())[0];

  const m = live ?? upcoming;
  if (!m) return null;

  return {
    fixture_id: Number(m.id),
    kickoff_at: m.utcDate,
    league_name: m?.competition?.name ?? null,
    league_logo: m?.competition?.emblem ?? null,
    round: m?.matchday ? `Matchday ${m.matchday}` : (m?.stage ?? null),
    home_name: m?.homeTeam?.name ?? "?",
    away_name: m?.awayTeam?.name ?? "?",
    home_logo: m?.homeTeam?.crest ?? null,
    away_logo: m?.awayTeam?.crest ?? null,
    home_goals: m?.score?.fullTime?.home ?? null,
    away_goals: m?.score?.fullTime?.away ?? null,
    home_pens: m?.score?.penalties?.home ?? null,
    away_pens: m?.score?.penalties?.away ?? null,
    status_short: FD_STATUS[m?.status] ?? "NS",
    status_long: m?.status ?? null,
    elapsed: null,
    events: [],
    source: "football-data",
  };
}

/* ------------------------------------------------------------------ */
/* Firecrawl + Lovable AI fallback                                     */
/* ------------------------------------------------------------------ */

const FIRECRAWL_V2 = "https://api.firecrawl.dev/v2";
const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

export async function scrapeNextFixture(
  teamName: string,
  firecrawlKey: string,
  lovableKey: string,
): Promise<NormalisedFixture | null> {
  const query = `"${teamName}" próximo partido fecha hora rival calendario fútbol`;
  const res = await fetch(`${FIRECRAWL_V2}/search`, {
    method: "POST",
    headers: { Authorization: `Bearer ${firecrawlKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      limit: 3,
      lang: "es",
      scrapeOptions: { formats: ["markdown"], onlyMainContent: true },
    }),
  });
  if (!res.ok) throw new Error(`firecrawl ${res.status}: ${await res.text()}`);
  const payload = await res.json();
  const docs: any[] = payload?.data?.web ?? payload?.data ?? payload?.results ?? [];
  const context = docs
    .map((d) => `SOURCE: ${d?.url}\n${(d?.markdown ?? d?.description ?? "").slice(0, 6000)}`)
    .join("\n\n---\n\n")
    .slice(0, 24000);
  if (!context.trim()) return null;

  const today = new Date().toISOString();
  const ai = await fetch(AI_GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "Extraes datos de partidos de fútbol a partir de texto web. Responde SOLO con JSON válido. " +
            `La fecha y hora actual UTC es ${today}. Si no encuentras el dato, usa null.`,
        },
        {
          role: "user",
          content:
            `Equipo: ${teamName}\n\n` +
            "Del texto siguiente, extrae el partido EN JUEGO de este equipo si lo hay; si no, el PRÓXIMO partido futuro.\n" +
            'Formato: {"kickoff_at_utc":"ISO 8601 o null","home_name":"","away_name":"","competition":"","home_goals":null,"away_goals":null,"status":"NS|1H|HT|2H|FT","elapsed":null,"confident":true}\n' +
            'Si no hay información fiable, devuelve {"confident":false}.\n\n' +
            context,
        },
      ],
      temperature: 0,
    }),
  });
  if (!ai.ok) throw new Error(`ai gateway ${ai.status}: ${await ai.text()}`);
  const aiData = await ai.json();
  const raw = aiData?.choices?.[0]?.message?.content ?? "";
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;

  let parsed: any;
  try {
    parsed = JSON.parse(match[0]);
  } catch (_) {
    return null;
  }
  if (parsed?.confident === false || !parsed?.kickoff_at_utc || !parsed?.home_name || !parsed?.away_name) {
    return null;
  }
  const kickoff = new Date(parsed.kickoff_at_utc);
  if (!Number.isFinite(kickoff.getTime())) return null;

  // Deterministic pseudo id so upserts stay stable for the same scraped match.
  const seed = `${parsed.home_name}|${parsed.away_name}|${kickoff.toISOString().slice(0, 10)}`;
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) % 1_000_000_000;

  return {
    fixture_id: -hash,
    kickoff_at: kickoff.toISOString(),
    league_name: parsed.competition ?? null,
    league_logo: null,
    round: null,
    home_name: String(parsed.home_name),
    away_name: String(parsed.away_name),
    home_logo: null,
    away_logo: null,
    home_goals: parsed.home_goals ?? null,
    away_goals: parsed.away_goals ?? null,
    home_pens: null,
    away_pens: null,
    status_short: parsed.status ?? "NS",
    status_long: null,
    elapsed: parsed.elapsed ?? null,
    events: [],
    source: "scrape",
  };
}
