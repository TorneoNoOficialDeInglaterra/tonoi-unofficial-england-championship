import { useMemo, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { TeamBadge } from "@/components/TeamBadge";
import { useMatches, useTeams } from "@/hooks/useTonoiData";
import { decadeOf, type Match } from "@/lib/tonoi";
import { cn } from "@/lib/utils";

export default function MatchHistory() {
  const teamsQ = useTeams();
  const matchesQ = useMatches();

  const teamById = useMemo(() => new Map((teamsQ.data ?? []).map((t) => [t.id, t])), [teamsQ.data]);
  const teamsSorted = useMemo(() => [...(teamsQ.data ?? [])].sort((a, b) => a.name.localeCompare(b.name)), [teamsQ.data]);

  // Compute local team for every match by alternating venue per team chronologically.
  // Rule: if a team played at home in its previous match, it now plays away (and vice versa).
  // For a team's first ever match, we assign local to whichever team has the alphabetically earlier name (stable).
  const localByMatch = useMemo(() => {
    const map = new Map<string, string>(); // matchId -> localTeamId
    const lastVenue = new Map<string, "home" | "away">();
    const ordered = [...(matchesQ.data ?? [])].sort(
      (a, b) => a.match_date.localeCompare(b.match_date) || a.id.localeCompare(b.id),
    );
    for (const m of ordered) {
      const a = m.winner_team_id;
      const b = m.loser_team_id;
      const va = lastVenue.get(a);
      const vb = lastVenue.get(b);
      let localId: string;
      if (va && vb) {
        // both have history: prefer team whose last venue was away
        if (va === "away" && vb === "home") localId = a;
        else if (vb === "away" && va === "home") localId = b;
        else if (va === "away" && vb === "away") {
          // both away last → tiebreak alphabetically
          const ta = teamById.get(a)?.name ?? a;
          const tb = teamById.get(b)?.name ?? b;
          localId = ta.localeCompare(tb) <= 0 ? a : b;
        } else {
          // both home last → same tiebreak
          const ta = teamById.get(a)?.name ?? a;
          const tb = teamById.get(b)?.name ?? b;
          localId = ta.localeCompare(tb) <= 0 ? a : b;
        }
      } else if (va && !vb) {
        // a has history, b doesn't → b plays at home if a played home; else a is home
        localId = va === "home" ? b : a;
      } else if (!va && vb) {
        localId = vb === "home" ? a : b;
      } else {
        // neither has history (first match for both) → alphabetical local
        const ta = teamById.get(a)?.name ?? a;
        const tb = teamById.get(b)?.name ?? b;
        localId = ta.localeCompare(tb) <= 0 ? a : b;
      }
      map.set(m.id, localId);
      lastVenue.set(localId, "home");
      lastVenue.set(localId === a ? b : a, "away");
    }
    return map;
  }, [matchesQ.data, teamById]);

  // Team filter
  const [teamFilter, setTeamFilter] = useState<string>("");
  const [comboOpen, setComboOpen] = useState(false);

  const grouped = useMemo(() => {
    const m = new Map<number, Match[]>();
    (matchesQ.data ?? []).forEach((mt) => {
      const dec = decadeOf(mt.match_date);
      if (!m.has(dec)) m.set(dec, []);
      m.get(dec)!.push(mt);
    });
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

  const filteredMatches = useMemo(() => {
    if (!teamFilter) return null;
    return [...(matchesQ.data ?? [])]
      .filter((m) => m.winner_team_id === teamFilter || m.loser_team_id === teamFilter)
      .sort((a, b) => b.match_date.localeCompare(a.match_date));
  }, [teamFilter, matchesQ.data]);

  const matches = filteredMatches ?? grouped.get(decade) ?? [];
  const idx = decades.indexOf(decade);
  const prevDecade = idx >= 0 && idx + 1 < decades.length ? decades[idx + 1] : null;
  const nextDecade = idx > 0 ? decades[idx - 1] : null;

  const loading = teamsQ.isLoading || matchesQ.isLoading;
  const selectedTeam = teamsSorted.find((t) => t.id === teamFilter);

  return (
    <div className="container py-10">
      <h1 className="text-4xl font-black sm:text-5xl">Historial de partidos</h1>
      <p className="mt-2 text-muted-foreground">Cada partido por el título, agrupados por décadas.</p>

      {/* Team search */}
      <div className="mt-6 flex flex-wrap items-end gap-3">
        <div className="w-full max-w-sm">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Buscar equipo</label>
          <Popover open={comboOpen} onOpenChange={setComboOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" className="mt-1 w-full justify-between font-normal">
                <span className={cn("truncate", !selectedTeam && "text-muted-foreground")}>
                  {selectedTeam?.name ?? "Todos los equipos"}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
              <Command>
                <CommandInput placeholder="Buscar equipo..." />
                <CommandList>
                  <CommandEmpty>No se encontraron equipos.</CommandEmpty>
                  <CommandGroup>
                    {teamsSorted.map((t) => (
                      <CommandItem key={t.id} value={t.name} onSelect={() => { setTeamFilter(t.id); setComboOpen(false); }}>
                        <Check className={cn("mr-2 h-4 w-4", teamFilter === t.id ? "opacity-100" : "opacity-0")} />
                        {t.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        {teamFilter && (
          <Button variant="ghost" onClick={() => setTeamFilter("")}>
            <X className="mr-1 h-4 w-4" /> Limpiar
          </Button>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">
          {teamFilter ? `Partidos de ${selectedTeam?.name}` : `Década ${decade}s`}
        </h2>
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
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Sin partidos.</td></tr>
              ) : (
                matches.map((m) => {
                  const localId = m.home_team_id ?? localByMatch.get(m.id) ?? m.winner_team_id;
                  const visitorId = localId === m.winner_team_id ? m.loser_team_id : m.winner_team_id;
                  const local = teamById.get(localId);
                  const visitor = teamById.get(visitorId);
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

      {/* Decade navigation (only when not filtering by team) */}
      {!teamFilter && (
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
      )}
    </div>
  );
}
