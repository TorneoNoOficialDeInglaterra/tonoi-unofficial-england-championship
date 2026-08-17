import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TeamBadge } from "@/components/TeamBadge";
import { useMatches, useTeams } from "@/hooks/useTonoiData";
import { computeStandings, type Match, type Team } from "@/lib/tonoi";
import { localeTag } from "@/i18n";

type Issue = {
  match: Match;
  champion: Team | null;
  reason: string;
};

/**
 * Reproduce la cadena de títulos exactamente como `computeStandings` y recoge
 * los partidos en los que ninguno de los dos equipos venía con el trofeo
 * (por eso no suman PcT y el PcT deja de cuadrar con V+E).
 */
function auditChain(matchesAsc: Match[], teamById: Map<string, Team>) {
  let champion: string | null = null;
  const issues: Issue[] = [];

  for (const m of matchesAsc) {
    if (!teamById.has(m.winner_team_id) || !teamById.has(m.loser_team_id)) {
      issues.push({
        match: m,
        champion: champion ? teamById.get(champion) ?? null : null,
        reason: "Uno de los equipos del partido no existe en la base de datos, así que el partido se ignora por completo en la clasificación.",
      });
      continue;
    }
    if (champion === null) {
      champion = m.winner_team_id;
      continue;
    }
    const championInvolved = m.winner_team_id === champion || m.loser_team_id === champion;
    if (!championInvolved) {
      issues.push({
        match: m,
        champion: teamById.get(champion) ?? null,
        reason: `El trofeo estaba en poder de ${teamById.get(champion)?.name ?? "—"}, que no juega este partido: se suman V/E/D a los dos equipos pero ningún PcT, y el campeón sigue siendo el mismo.`,
      });
      continue;
    }
    champion = m.winner_team_id;
  }
  return issues;
}

export default function Auditoria() {
  const teamsQ = useTeams();
  const matchesQ = useMatches();

  const teamById = useMemo(
    () => new Map((teamsQ.data ?? []).map((t) => [t.id, t])),
    [teamsQ.data],
  );

  const issues = useMemo(
    () => auditChain(matchesQ.data ?? [], teamById),
    [matchesQ.data, teamById],
  );

  const rows = useMemo(
    () => computeStandings(teamsQ.data ?? [], matchesQ.data ?? []).rows,
    [teamsQ.data, matchesQ.data],
  );

  const teamMismatches = useMemo(
    () => rows.filter((r) => r.pct !== r.v + r.e).sort((a, b) => Math.abs(b.v + b.e - b.pct) - Math.abs(a.v + a.e - a.pct)),
    [rows],
  );

  const loading = teamsQ.isLoading || matchesQ.isLoading;
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString(localeTag(), { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="container py-10">
      <h1 className="text-4xl font-black sm:text-5xl">Auditoría de PcT</h1>
      <p className="mt-2 max-w-3xl text-muted-foreground">
        El PcT (Partidos con el Trofeo) debería ser igual a V+E, porque todo partido del ToNOI se
        disputa con el título en juego. Aquí se listan los partidos que rompen la cadena de campeón
        y, por tanto, no suman PcT a nadie.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Badge variant="secondary" className="text-sm">Partidos con descuadre: {loading ? "…" : issues.length}</Badge>
        <Badge variant="secondary" className="text-sm">Equipos afectados: {loading ? "…" : teamMismatches.length}</Badge>
      </div>

      <h2 className="mt-10 text-2xl font-bold">Partidos que rompen la cadena</h2>
      <Card className="mt-3 overflow-hidden">
        <div className="max-h-[70vh] overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-10 bg-muted/95 text-xs uppercase tracking-wider text-muted-foreground backdrop-blur">
              <tr>
                <th className="px-3 py-3 text-left">Fecha</th>
                <th className="px-3 py-3 text-left">Partido</th>
                <th className="px-3 py-3 text-center">Resultado</th>
                <th className="px-3 py-3 text-left">Campeón vigente</th>
                <th className="px-3 py-3 text-left">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-t border-border">
                    <td colSpan={5} className="p-3"><Skeleton className="h-6 w-full" /></td>
                  </tr>
                ))
              ) : issues.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No hay descuadres: el PcT coincide con V+E en todos los equipos.
                  </td>
                </tr>
              ) : (
                issues.map(({ match: m, champion, reason }) => {
                  const w = teamById.get(m.winner_team_id);
                  const l = teamById.get(m.loser_team_id);
                  return (
                    <tr key={m.id} className="border-t border-border align-top hover:bg-accent/40">
                      <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">{fmt(m.match_date)}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <TeamBadge team={w} size={20} />
                          <span className="font-medium">{w?.name ?? "—"}</span>
                          <span className="text-muted-foreground">vs</span>
                          <TeamBadge team={l} size={20} />
                          <span className="font-medium">{l?.name ?? "—"}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-center font-mono font-bold tabular-nums">
                        {m.winner_goals}–{m.loser_goals}
                        {m.was_draw && <span className="ml-2 text-xs font-normal text-muted-foreground">empate</span>}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <TeamBadge team={champion ?? undefined} size={20} />
                          <span>{champion?.name ?? "—"}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">{reason}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <h2 className="mt-10 text-2xl font-bold">Equipos donde PcT ≠ V+E</h2>
      <Card className="mt-3 overflow-hidden">
        <div className="max-h-[60vh] overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-10 bg-muted/95 text-xs uppercase tracking-wider text-muted-foreground backdrop-blur">
              <tr>
                <th className="px-3 py-3 text-left">Equipo</th>
                <th className="px-3 py-3 text-right">V</th>
                <th className="px-3 py-3 text-right">E</th>
                <th className="px-3 py-3 text-right">V+E</th>
                <th className="px-3 py-3 text-right">PcT</th>
                <th className="px-3 py-3 text-right">Diferencia</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-t border-border">
                    <td colSpan={6} className="p-3"><Skeleton className="h-6 w-full" /></td>
                  </tr>
                ))
              ) : teamMismatches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">Ningún equipo descuadra.</td>
                </tr>
              ) : (
                teamMismatches.map((r) => (
                  <tr key={r.team.id} className="border-t border-border hover:bg-accent/40">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <TeamBadge team={r.team} size={20} />
                        <span className="font-medium">{r.team.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{r.v}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{r.e}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{r.v + r.e}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{r.pct}</td>
                    <td className="px-3 py-2.5 text-right font-bold tabular-nums">
                      {r.v + r.e - r.pct > 0 ? "+" : ""}{r.v + r.e - r.pct}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
