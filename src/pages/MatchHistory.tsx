import { useMemo, useState, useEffect, useRef, Fragment } from "react";
import { ChevronLeft, ChevronRight, Check, ChevronsUpDown, X, Info } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { TeamBadge } from "@/components/TeamBadge";
import { useMatches, useTeams } from "@/hooks/useTonoiData";
import { buildLocalByMatchMap, decadeOf, sideScore, type Match, type Team } from "@/lib/tonoi";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { localeTag } from "@/i18n";

/** Interrupciones históricas de la competición (fechas en formato ISO). */
const BREAKS = [
  {
    after: "1915-04-24",
    before: "1919-08-30",
    key: "wwi",
  },
  {
    after: "1939-09-02",
    before: "1945-11-17",
    key: "wwii",
  },
  {
    after: "2020-03-08",
    before: "2020-07-24",
    key: "covid",
  },
] as const;

function BreakRow({ text }: { text: string }) {
  return (
    <tr className="border-t border-border bg-muted/60">
      <td colSpan={4} className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {text}
      </td>
    </tr>
  );
}


function TeamCombo({
  teams, value, onChange, placeholder,
}: { teams: Team[]; value: string; onChange: (v: string) => void; placeholder: string }) {
  const { t: tr } = useTranslation("matches");
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
          <CommandInput placeholder={tr("history.filters.searchTeam")} />
          <CommandList>
            <CommandEmpty>{tr("history.filters.noTeamsFound")}</CommandEmpty>
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
  const { t } = useTranslation("matches");
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
  const scrollBoxRef = useRef<HTMLDivElement>(null);
  const changeDecade = (d: number) => {
    setDecade(d);
    if (scrollBoxRef.current) scrollBoxRef.current.scrollTop = 0;
    window.scrollTo({ top: 0, left: 0 });
  };

  useEffect(() => {
    if (decades.length && !decades.includes(decade)) setDecade(decades[0]);
  }, [decades, decade]);

  const [noteMatch, setNoteMatch] = useState<Match | null>(null);

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
        .filter((m) => m.winner_team_id === teamFilter || m.loser_team_id === teamFilter || m.home_team_id === teamFilter)
        .sort((a, b) => b.match_date.localeCompare(a.match_date));
    }
    return null;
  }, [teamFilter, h2hA, h2hB, h2hActive, matchesQ.data]);

  const filtering = h2hActive || !!teamFilter;
  const matches = filteredMatches ?? grouped.get(decade) ?? [];

  // Para cada parón, el id del último partido real disputado antes de la interrupción
  // (sobre TODOS los partidos, no solo los de la década visible).
  const breakAnchorByMatchId = useMemo(() => {
    const map = new Map<string, (typeof BREAKS)[number]>();
    const all = matchesQ.data ?? [];
    for (const b of BREAKS) {
      let anchor: Match | null = null;
      for (const m of all) {
        if (m.match_date <= b.after && (!anchor || m.match_date > anchor.match_date)) anchor = m;
      }
      if (anchor) map.set(anchor.id, b);
    }
    return map;
  }, [matchesQ.data]);

  const idx = decades.indexOf(decade);
  const prevDecade = idx >= 0 && idx + 1 < decades.length ? decades[idx + 1] : null;
  const nextDecade = idx > 0 ? decades[idx - 1] : null;

  const loading = teamsQ.isLoading || matchesQ.isLoading;
  const selectedTeam = teamsSorted.find((t) => t.id === teamFilter);
  const teamA = teamsSorted.find((t) => t.id === h2hA);
  const teamB = teamsSorted.find((t) => t.id === h2hB);

  return (
    <div className="container py-10">
      <h1 className="text-4xl font-black sm:text-5xl">{t("history.title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("history.subtitle")}</p>

      {/* Filters */}
      <Card className="mt-6 p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("history.filters.teamLabel")}</label>
            <TeamCombo
              teams={teamsSorted}
              value={teamFilter}
              onChange={(v) => { setTeamFilter(v); setH2hA(""); setH2hB(""); }}
              placeholder={t("history.filters.teamPlaceholder")}
            />
            {teamFilter && (
              <Button size="sm" variant="ghost" className="mt-2" onClick={() => setTeamFilter("")}>
                <X className="mr-1 h-3 w-3" /> {t("history.filters.clear")}
              </Button>
            )}
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("history.filters.h2hClub1Label")}</label>
            <TeamCombo
              teams={teamsSorted}
              value={h2hA}
              onChange={(v) => { setH2hA(v); setTeamFilter(""); }}
              placeholder={t("history.filters.clubPlaceholder")}
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("history.filters.h2hClub2Label")}</label>
            <TeamCombo
              teams={teamsSorted}
              value={h2hB}
              onChange={(v) => { setH2hB(v); setTeamFilter(""); }}
              placeholder={t("history.filters.clubPlaceholder")}
            />
          </div>
        </div>
        {(h2hA || h2hB) && (
          <Button size="sm" variant="ghost" className="mt-3" onClick={() => { setH2hA(""); setH2hB(""); }}>
            <X className="mr-1 h-3 w-3" /> {t("history.filters.clearH2h")}
          </Button>
        )}
      </Card>

      <div className="mt-6 flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">
          {h2hActive
            ? t("history.heading.h2h", { teamA: teamA?.name, teamB: teamB?.name })
            : teamFilter
              ? t("history.heading.teamMatches", { team: selectedTeam?.name })
              : t("history.heading.decade", { decade })}
        </h2>
        <span className="text-xs text-muted-foreground">{t("history.matchCount", { count: matches.length })}</span>
      </div>

      <Card className="mt-3 overflow-hidden">
        <div ref={scrollBoxRef} className="max-h-[80vh] overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-10 bg-muted/95 text-xs uppercase tracking-wider text-muted-foreground backdrop-blur">
              <tr>
                <th className="px-3 py-3 text-left">{t("history.table.date")}</th>
                <th className="px-3 py-3 text-right">{t("history.table.home")}</th>
                <th className="px-3 py-3 text-center">{t("history.table.result")}</th>
                <th className="px-3 py-3 text-left">{t("history.table.away")}</th>
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
                      ? t("history.empty.h2h")
                      : t("history.empty.none")}
                  </td>
                </tr>
              ) : (
                matches.map((m, i) => {
                  const localId = m.home_team_id ?? localByMatch.get(m.id) ?? m.winner_team_id;
                  const visitorId = localId === m.winner_team_id ? m.loser_team_id : m.winner_team_id;
                  const local = teamById.get(localId);
                  const visitor = teamById.get(visitorId);
                  const localGoals = sideScore(m, localId);
                  const visitorGoals = sideScore(m, visitorId);

                  // Lista en orden descendente: el banner va justo encima del último
                  // partido disputado antes del parón.
                  const breakAbove = filtering ? undefined : breakAnchorByMatchId.get(m.id);
                  return (
                    <Fragment key={m.id}>
                      {breakAbove && <BreakRow key={`${m.id}-b`} text={t(`history.breaks.${breakAbove.key}`)} />}
                      <tr
                        key={m.id}
                        className={cn("border-t border-border hover:bg-accent/40", m.notes && "cursor-pointer")}
                        onClick={m.notes ? () => setNoteMatch(m) : undefined}
                        title={m.notes ? t("history.noteDialog.hint") : undefined}
                      >
                        <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">
                          {new Date(m.match_date).toLocaleDateString(localeTag(), { day: "2-digit", month: "short", year: "numeric" })}
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
                            {m.notes && (
                              <button
                                type="button"
                                aria-label={t("history.noteDialog.hint")}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setNoteMatch(m);
                                }}
                                className="text-primary transition-opacity hover:opacity-70"
                              >
                                <Info className="h-4 w-4" />
                              </button>
                            )}
                          </span>
                        </td>

                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <TeamBadge team={visitor} size={24} />
                            <span className="font-medium">{visitor?.name ?? "—"}</span>
                          </div>
                        </td>
                      </tr>
                    </Fragment>
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
              <ChevronLeft className="mr-1 h-4 w-4" /> {t("history.decadeNav.previous")}
            </Button>
            <Button variant="outline" disabled={!nextDecade} onClick={() => nextDecade && changeDecade(nextDecade)}>
              {t("history.decadeNav.next")} <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          {decades.length > 0 && (
            <div className="w-full max-w-xs">
              <Select value={String(decade)} onValueChange={(v) => changeDecade(Number(v))}>
                <SelectTrigger><SelectValue placeholder={t("history.decadeNav.jumpTo")} /></SelectTrigger>
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
