import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useMatches, useTeams } from "@/hooks/useTonoiData";
import type { Match, Team } from "@/lib/tonoi";

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

type MatchIssue = { match: Match; reasons: string[] };
type DuplicateGroup = { key: string; teams: Team[] };

function auditMatches(matches: Match[], teamsById: Map<string, Team>): MatchIssue[] {
  const issues: MatchIssue[] = [];
  for (const m of matches) {
    const reasons: string[] = [];
    const winner = teamsById.get(m.winner_team_id);
    const loser = teamsById.get(m.loser_team_id);
    if (!winner) reasons.push("Ganador no existe en equipos");
    if (!loser) reasons.push("Perdedor no existe en equipos");
    if (m.winner_team_id === m.loser_team_id) reasons.push("Ganador y perdedor son el mismo equipo");
    if (m.home_team_id) {
      if (!teamsById.get(m.home_team_id)) reasons.push("Equipo local no existe");
      else if (m.home_team_id !== m.winner_team_id && m.home_team_id !== m.loser_team_id) {
        reasons.push("El equipo local no es ni ganador ni perdedor");
      }
    }
    if (m.was_draw) {
      if (m.winner_goals !== m.loser_goals) reasons.push("Empate con goles distintos");
    } else {
      if (m.winner_goals < m.loser_goals) reasons.push("Ganador tiene menos goles que el perdedor");
      if (m.winner_goals === m.loser_goals) reasons.push("Marcador igualado marcado como no-empate");
    }
    if (m.winner_goals < 0 || m.loser_goals < 0) reasons.push("Goles negativos");
    if (reasons.length) issues.push({ match: m, reasons });
  }
  return issues;
}

function findDuplicateTeams(teams: Team[]): DuplicateGroup[] {
  const byKey = new Map<string, Team[]>();
  for (const t of teams) {
    const key = normalize(t.name);
    if (!key) continue;
    const arr = byKey.get(key) ?? [];
    arr.push(t);
    byKey.set(key, arr);
  }
  const groups: DuplicateGroup[] = [];
  for (const [key, arr] of byKey) if (arr.length > 1) groups.push({ key, teams: arr });
  // Also duplicates by slug
  const bySlug = new Map<string, Team[]>();
  for (const t of teams) {
    const arr = bySlug.get(t.slug) ?? [];
    arr.push(t);
    bySlug.set(t.slug, arr);
  }
  for (const [key, arr] of bySlug) {
    if (arr.length > 1 && !groups.some((g) => g.teams.every((t) => arr.includes(t)))) {
      groups.push({ key: `slug:${key}`, teams: arr });
    }
  }
  return groups;
}

export function AuditAdmin() {
  const teamsQ = useTeams();
  const matchesQ = useMatches();

  const teams = teamsQ.data ?? [];
  const matches = matchesQ.data ?? [];

  const teamsById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const matchIssues = useMemo(() => auditMatches(matches, teamsById), [matches, teamsById]);
  const duplicates = useMemo(() => findDuplicateTeams(teams), [teams]);

  if (teamsQ.isLoading || matchesQ.isLoading) {
    return <div className="text-sm text-muted-foreground">Analizando datos…</div>;
  }

  const allGood = matchIssues.length === 0 && duplicates.length === 0;

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex items-center gap-2">
          {allGood ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <span className="font-medium">Todo coherente. Sin incidencias detectadas.</span>
            </>
          ) : (
            <>
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <span className="font-medium">
                {matchIssues.length} partido(s) con incidencias · {duplicates.length} grupo(s) de equipos duplicados
              </span>
            </>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Analizados {matches.length} partidos y {teams.length} equipos.
        </p>
      </Card>

      <section>
        <h2 className="mb-2 text-lg font-bold">Partidos incoherentes</h2>
        {matchIssues.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin partidos incoherentes.</p>
        ) : (
          <div className="space-y-2">
            {matchIssues.map(({ match, reasons }) => {
              const w = teamsById.get(match.winner_team_id);
              const l = teamsById.get(match.loser_team_id);
              const h = match.home_team_id ? teamsById.get(match.home_team_id) : null;
              return (
                <Card key={match.id} className="p-3">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
                    <span className="font-mono text-xs text-muted-foreground">{match.match_date}</span>
                    <span>
                      <strong>{w?.name ?? "?"}</strong> {match.winner_goals}–{match.loser_goals}{" "}
                      <strong>{l?.name ?? "?"}</strong>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Local: {h?.name ?? "—"} · {match.was_draw ? "Empate" : "Victoria"}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {reasons.map((r) => (
                      <Badge key={r} variant="destructive" className="text-xs">{r}</Badge>
                    ))}
                  </div>
                  <div className="mt-1 font-mono text-[10px] text-muted-foreground">ID: {match.id}</div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold">Equipos duplicados</h2>
        {duplicates.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin duplicados detectados.</p>
        ) : (
          <div className="space-y-2">
            {duplicates.map((g) => (
              <Card key={g.key} className="p-3">
                <div className="text-xs text-muted-foreground">Coincidencia: {g.key}</div>
                <ul className="mt-1 space-y-1 text-sm">
                  {g.teams.map((t) => (
                    <li key={t.id} className="flex flex-wrap items-center gap-2">
                      <strong>{t.name}</strong>
                      <span className="text-xs text-muted-foreground">slug: {t.slug}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">{t.id}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
