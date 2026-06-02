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
import { buildLocalByMatchMap, decadeOf, type Match, type Team } from "@/lib/tonoi";
import { cn } from "@/lib/utils";

function TeamCombo({
  teams, value, onChange, placeholder,
}: { teams: Team[]; value: string; onChange: (v: string) => void; placeholder: string }) {
  const [open, setOpen] = useState(false);
  const selected = teams.find((t) => t.id === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="mt-1 w-full justify-between font-normal">
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected?.name ?? placeholder}
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
              {teams.map((t) => (
                <CommandItem key={t.id} value={t.name} onSelect={() => { onChange(t.id); setOpen(false); }}>
                  <Check className={cn("mr-2 h-4 w-4", value === t.id ? "opacity-100" : "opacity-0")} />
                  {t.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function MatchHistory() {
  const teamsQ = useTeams();
  const matchesQ = useMatches();

  const teamById = useMemo(() => new Map((teamsQ.data ?? []).map((t) => [t.id, t])), [teamsQ.data]);
  const teamsSorted = useMemo(() => [...(teamsQ.data ?? [])].sort((a, b) => a.name.localeCompare(b.name)), [teamsQ.data]);

  const localByMatch = useMemo(
    () => buildLocalByMatchMap(matchesQ.data ?? [], teamById),
    [matchesQ.data, teamById],
  );

  // Filters
  const [teamFilter, setTeamFilter] = useState<string>("");
  const [h2hA, setH2hA] = useState<string>("");
  const [h2hB, setH2hB] = useState<string>("");

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
  const changeDecade = (d: number) => {
    setDecade(d);
    window.scrollTo({ top: 0, left: 0 });
  };

  useEffect(() => {
    if (decades.length && !decades.includes(decade)) setDecade(decades[0]);
  }, [decades, decade]);

  const h2hActive = !!h2hA && !!h2hB && h2hA !== h2hB;

  const filteredMatches = useMemo(() => {
    if (h2hActive) {
      return [...(matchesQ.data ?? [])]
        .filter(
          (m) =>
            (m.winner_team_id === h2hA && m.loser_team_id === h2hB) ||
            (m.winner_team_id === h2hB && m.loser_team_id === h2hA),
        )
        .sort((a, b) => b.match_date.localeCompare(a.match_date));
    }
    if (teamFilter) {
      return [...(matchesQ.data ?? [])]
        .filter((m) => m.winner_team_id === teamFilter || m.loser_team_id === teamFilter)
        .sort((a, b) => b.match_date.localeCompare(a.match_date));
    }
    return null;
  }, [teamFilter, h2hA, h2hB, h2hActive, matchesQ.data]);

  const filtering = h2hActive || !!teamFilter;
  const matches = filteredMatches ?? grouped.get(decade) ?? [];
  const idx = decades.indexOf(decade);
  const prevDecade = idx >= 0 && idx + 1 < decades.length ? decades[idx + 1] : null;
  const nextDecade = idx > 0 ? decades[idx - 1] : null;

  const loading = teamsQ.isLoading || matchesQ.isLoading;
  const selectedTeam = teamsSorted.find((t) => t.id === teamFilter);
  const teamA = teamsSorted.find((t) => t.id === h2hA);
  const teamB = teamsSorted.find((t) => t.id === h2hB);

  return (
    <div className="container py-10">
      <h1 className="text-4xl font-black sm:text-5xl">Historial de partidos</h1>
      <p className="mt-2 text-muted-foreground">Cada partido por el título, agrupados por décadas.</p>

      {/* Filters */}
      <Card className="mt-6 p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Equipo</label>
            <TeamCombo
              teams={teamsSorted}
              value={teamFilter}
              onChange={(v) => { setTeamFilter(v); setH2hA(""); setH2hB(""); }}
              placeholder="Todos los equipos"
            />
            {teamFilter && (
              <Button size="sm" variant="ghost" className="mt-2" onClick={() => setTeamFilter("")}>
                <X className="mr-1 h-3 w-3" /> Limpiar
              </Button>
            )}
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Enfrentamiento — Club 1</label>
            <TeamCombo
              teams={teamsSorted}
              value={h2hA}
              onChange={(v) => { setH2hA(v); setTeamFilter(""); }}
              placeholder="Selecciona club"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Enfrentamiento — Club 2</label>
            <TeamCombo
              teams={teamsSorted}
              value={h2hB}
              onChange={(v) => { setH2hB(v); setTeamFilter(""); }}
              placeholder="Selecciona club"
            />
          </div>
        </div>
        {(h2hA || h2hB) && (
          <Button size="sm" variant="ghost" className="mt-3" onClick={() => { setH2hA(""); setH2hB(""); }}>
            <X className="mr-1 h-3 w-3" /> Limpiar enfrentamiento
          </Button>
        )}
      </Card>

      <div className="mt-6 flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">
          {h2hActive
            ? `${teamA?.name} vs ${teamB?.name}`
            : teamFilter
              ? `Partidos de ${selectedTeam?.name}`
              : `Década ${decade}s`}
        </h2>
        <span className="text-xs text-muted-foreground">{matches.length} partidos</span>
      </div>

      <Card className="mt-3 overflow-hidden">
        <div className="max-h-[80vh] overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-10 bg-muted/95 text-xs uppercase tracking-wider text-muted-foreground backdrop-blur">
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
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
                    {h2hActive
                      ? "No existen partidos entre esos dos clubes."
                      : "Sin partidos."}
                  </td>
                </tr>
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

      {/* Decade navigation (only when not filtering) */}
      {!filtering && (
        <div className="mt-6 flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" disabled={!prevDecade} onClick={() => prevDecade && changeDecade(prevDecade)}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Década anterior
            </Button>
            <Button variant="outline" disabled={!nextDecade} onClick={() => nextDecade && changeDecade(nextDecade)}>
              Década siguiente <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          {decades.length > 0 && (
            <div className="w-full max-w-xs">
              <Select value={String(decade)} onValueChange={(v) => changeDecade(Number(v))}>
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
