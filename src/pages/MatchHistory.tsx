import { useMemo, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamBadge } from "@/components/TeamBadge";
import { useMatches, useTeams } from "@/hooks/useTonoiData";
import { decadeOf, hashHome, type Match } from "@/lib/tonoi";

export default function MatchHistory() {
  const teamsQ = useTeams();
  const matchesQ = useMatches();

  const teamById = useMemo(() => new Map((teamsQ.data ?? []).map((t) => [t.id, t])), [teamsQ.data]);

  const grouped = useMemo(() => {
    const m = new Map<number, Match[]>();
    (matchesQ.data ?? []).forEach((mt) => {
      const dec = decadeOf(mt.match_date);
      if (!m.has(dec)) m.set(dec, []);
      m.get(dec)!.push(mt);
    });
    // Sort each decade desc by date
    for (const v of m.values()) v.sort((a, b) => b.match_date.localeCompare(a.match_date));
    return m;
  }, [matchesQ.data]);

  const decades = useMemo(() => [...grouped.keys()].sort((a, b) => b - a), [grouped]);

  const currentDecade = Math.floor(new Date().getUTCFullYear() / 10) * 10;
  const initialDecade = decades.includes(currentDecade) ? currentDecade : (decades[0] ?? currentDecade);
  const [decade, setDecade] = useState<number>(initialDecade);

  useEffect(() => {
    if (decades.length && !decades.includes(decade)) setDecade(decades[0]);
  }, [decades, decade]);

  const matches = grouped.get(decade) ?? [];
  const idx = decades.indexOf(decade);
  const prevDecade = idx >= 0 && idx + 1 < decades.length ? decades[idx + 1] : null; // older
  const nextDecade = idx > 0 ? decades[idx - 1] : null; // newer

  const loading = teamsQ.isLoading || matchesQ.isLoading;

  return (
    <div className="container py-10">
      <h1 className="text-4xl font-black sm:text-5xl">Historial de partidos</h1>
      <p className="mt-2 text-muted-foreground">Cada partido por el título, agrupados por décadas.</p>

      <div className="mt-6 flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Década {decade}s</h2>
        <span className="text-xs text-muted-foreground">{matches.length} partidos</span>
      </div>

      <Card className="mt-3 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-3 text-left">Fecha</th>
                <th className="px-3 py-3 text-right">Local</th>
                <th className="px-3 py-3 text-center">Resultado</th>
                <th className="px-3 py-3 text-left">Visitante</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-border"><td colSpan={4} className="p-3"><Skeleton className="h-6 w-full" /></td></tr>
                ))
              ) : matches.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Sin partidos en esta década.</td></tr>
              ) : (
                matches.map((m) => {
                  const winner = teamById.get(m.winner_team_id);
                  const loser = teamById.get(m.loser_team_id);
                  // Decide local/visitor
                  let localId: string;
                  if (m.was_draw) {
                    localId = hashHome(m.id) ? m.winner_team_id : m.loser_team_id;
                  } else {
                    // Non-draw: also stable random; ToNOI doesn't track venue
                    localId = hashHome(m.id) ? m.winner_team_id : m.loser_team_id;
                  }
                  const local = teamById.get(localId);
                  const visitor = teamById.get(localId === m.winner_team_id ? m.loser_team_id : m.winner_team_id);
                  const localGoals = localId === m.winner_team_id ? m.winner_goals : m.loser_goals;
                  const visitorGoals = localId === m.winner_team_id ? m.loser_goals : m.winner_goals;
                  return (
                    <tr key={m.id} className="border-t border-border hover:bg-accent/40">
                      <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">
                        {new Date(m.match_date).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-medium">{local?.name ?? "—"}</span>
                          <TeamBadge team={local} size={24} />
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="inline-flex items-center gap-2 rounded-md bg-muted px-2.5 py-1 font-mono font-bold tabular-nums">
                          {localGoals} <span className="text-muted-foreground">–</span> {visitorGoals}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <TeamBadge team={visitor} size={24} />
                          <span className="font-medium">{visitor?.name ?? "—"}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Decade navigation */}
      <div className="mt-6 flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" disabled={!prevDecade} onClick={() => prevDecade && setDecade(prevDecade)}>
            <ChevronLeft className="mr-1 h-4 w-4" /> Década anterior
          </Button>
          <Button variant="outline" disabled={!nextDecade} onClick={() => nextDecade && setDecade(nextDecade)}>
            Década siguiente <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
        {decades.length > 0 && (
          <div className="w-full max-w-xs">
            <Select value={String(decade)} onValueChange={(v) => setDecade(Number(v))}>
              <SelectTrigger><SelectValue placeholder="Saltar a década" /></SelectTrigger>
              <SelectContent>
                {decades.map((d) => (
                  <SelectItem key={d} value={String(d)}>{d}s</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}
