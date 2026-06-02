// Shared types & helpers for the ToNOI app

export type Team = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
};

export type Match = {
  id: string;
  match_date: string; // ISO date
  winner_team_id: string;
  loser_team_id: string;
  winner_goals: number;
  loser_goals: number;
  was_draw: boolean;
  title_changed: boolean;
  notes: string | null;
  home_team_id?: string | null;
};

export type StandingRow = {
  team: Team;
  pj: number;
  v: number;
  e: number;
  d: number;
  p: number;
  gf: number;
  gc: number;
  dg: number;
  ppp: number;
  pct: number; // partidos con trofeo
  mj: number;  // mejor racha
  intentos: number;
  destronamientos: number;
  id_pct: number; // %
};

// Stable pseudo-random for home/away assignment on draws (seeded by match id)
export function hashHome(id: string): boolean {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return (h & 1) === 0;
}

export function decadeOf(dateIso: string): number {
  const y = new Date(dateIso).getUTCFullYear();
  return Math.floor(y / 10) * 10;
}

export function daysBetween(fromIso: string, to = new Date()): number {
  const from = new Date(fromIso);
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / 86400000));
}

/**
 * Determines the home (local) team id for every match by alternating venues per team chronologically.
 * If a match already has `home_team_id` set, it is respected.
 */
export function buildLocalByMatchMap(matches: Match[], teamById?: Map<string, Team>): Map<string, string> {
  const map = new Map<string, string>();
  const lastVenue = new Map<string, "home" | "away">();
  const ordered = [...matches].sort(
    (a, b) => a.match_date.localeCompare(b.match_date) || a.id.localeCompare(b.id),
  );
  const tieBreak = (a: string, b: string) => {
    const ta = teamById?.get(a)?.name ?? a;
    const tb = teamById?.get(b)?.name ?? b;
    return ta.localeCompare(tb) <= 0 ? a : b;
  };
  for (const m of ordered) {
    const a = m.winner_team_id;
    const b = m.loser_team_id;
    let localId: string;
    if (m.home_team_id && (m.home_team_id === a || m.home_team_id === b)) {
      localId = m.home_team_id;
    } else {
      const va = lastVenue.get(a);
      const vb = lastVenue.get(b);
      if (va && vb) {
        if (va === "away" && vb === "home") localId = a;
        else if (vb === "away" && va === "home") localId = b;
        else localId = tieBreak(a, b);
      } else if (va && !vb) localId = va === "home" ? b : a;
      else if (!va && vb) localId = vb === "home" ? a : b;
      else localId = tieBreak(a, b);
    }
    map.set(m.id, localId);
    lastVenue.set(localId, "home");
    lastVenue.set(localId === a ? b : a, "away");
  }
  return map;
}

/**
 * Compute the standings & current champion from the chronological list of matches.
 * Champion logic: first match defines first champion as the winner. On every subsequent
 * match, the champion (going in) is challenged. If the challenger wins (or wins on penalties
 * for a draw), they become the new champion.
 */
export function computeStandings(teams: Team[], matchesAsc: Match[]) {
  const byId = new Map(teams.map((t) => [t.id, t]));
  const stats = new Map<string, StandingRow>();
  const ensure = (tid: string): StandingRow => {
    let s = stats.get(tid);
    if (!s) {
      const team = byId.get(tid);
      if (!team) throw new Error("Unknown team " + tid);
      s = { team, pj: 0, v: 0, e: 0, d: 0, p: 0, gf: 0, gc: 0, dg: 0, ppp: 0, pct: 0, mj: 0, intentos: 0, destronamientos: 0, id_pct: 0 };
      stats.set(tid, s);
    }
    return s;
  };

  let champion: string | null = null;
  let championSinceMatchIndex: number | null = null;
  let championSinceDate: string | null = null;
  // Streak tracking: for each team, count consecutive matches as champion.
  const currentStreak = new Map<string, number>();

  matchesAsc.forEach((m, idx) => {
    const w = ensure(m.winner_team_id);
    const l = ensure(m.loser_team_id);
    w.pj++; l.pj++;
    w.gf += m.winner_goals; w.gc += m.loser_goals;
    l.gf += m.loser_goals; l.gc += m.winner_goals;
    if (m.was_draw) {
      w.e++; l.e++;
      // En empate: el campeón retiene 1 punto; el retador (que optaba al título) recibe 0.
      // Si ningún equipo era campeón antes del partido, ambos reciben 1.
      if (champion !== null && (m.winner_team_id === champion || m.loser_team_id === champion)) {
        if (m.winner_team_id === champion) { w.p += 1; }
        else { l.p += 1; }
      } else {
        w.p += 1; l.p += 1;
      }
    } else {
      w.v++; l.d++;
      w.p += 2;
    }

    if (champion === null) {
      // First match -> winner becomes first champion
      champion = m.winner_team_id;
      championSinceMatchIndex = idx;
      championSinceDate = m.match_date;
      currentStreak.set(champion, 1);
      ensure(champion).pct += 1;
      ensure(champion).mj = Math.max(ensure(champion).mj, 1);
    } else {
      const challengerId = m.winner_team_id === champion ? m.loser_team_id : (m.loser_team_id === champion ? m.winner_team_id : null);
      if (challengerId) {
        // The match involves the champion
        ensure(challengerId).intentos += 1;
        const newWinner = m.winner_team_id;
        if (newWinner !== champion) {
          // Title changes
          ensure(challengerId).destronamientos += 1;
          champion = newWinner;
          championSinceMatchIndex = idx;
          championSinceDate = m.match_date;
          currentStreak.set(champion, 1);
          // reset old champion's streak
          for (const [k] of currentStreak) if (k !== champion) currentStreak.set(k, 0);
        } else {
          // Champion retained
          currentStreak.set(champion, (currentStreak.get(champion) ?? 0) + 1);
        }
        ensure(champion).pct += 1;
        ensure(champion).mj = Math.max(ensure(champion).mj, currentStreak.get(champion) ?? 0);
      }
      // If neither team is the champion, title doesn't change (rare in ToNOI, but safe).
    }
  });

  for (const s of stats.values()) {
    s.dg = s.gf - s.gc;
    s.ppp = s.pj > 0 ? +(s.p / s.pj).toFixed(2) : 0;
    s.id_pct = s.intentos > 0 ? +((s.destronamientos / s.intentos) * 100).toFixed(1) : 0;
  }

  const rows = [...stats.values()].sort((a, b) =>
    b.p - a.p || b.dg - a.dg || b.gf - a.gf || a.team.name.localeCompare(b.team.name),
  );

  // Last match by REAL date (not array order — older matches loaded later may sit at the end)
  let lastMatch: Match | null = null;
  for (const m of matchesAsc) {
    if (!lastMatch || m.match_date > lastMatch.match_date) lastMatch = m;
  }
  return { rows, champion, championSinceDate, lastMatch };
}
