import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation, Trans } from "react-i18next";
import { Crown, Search, ArrowUpDown, Check, ChevronsUpDown, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { TeamBadge } from "@/components/TeamBadge";
import { useMatches, useTeams } from "@/hooks/useTonoiData";
import { computeStandings, type StandingRow } from "@/lib/tonoi";
import { cn } from "@/lib/utils";

type SortKey = "pos" | "pj" | "v" | "e" | "d" | "p" | "gf" | "gc" | "dg" | "ppp" | "pct" | "mj" | "intentos" | "destronamientos" | "id_pct" | "team";

const COL_KEYS: { key: SortKey; i18nKey: string; numeric?: boolean }[] = [
  { key: "pj", i18nKey: "pj", numeric: true },
  { key: "v", i18nKey: "v", numeric: true },
  { key: "e", i18nKey: "e", numeric: true },
  { key: "d", i18nKey: "d", numeric: true },
  { key: "p", i18nKey: "p", numeric: true },
  { key: "gf", i18nKey: "gf", numeric: true },
  { key: "gc", i18nKey: "gc", numeric: true },
  { key: "dg", i18nKey: "dg", numeric: true },
  { key: "ppp", i18nKey: "ppp", numeric: true },
  { key: "pct", i18nKey: "pct", numeric: true },
  { key: "mj", i18nKey: "mj", numeric: true },
  { key: "intentos", i18nKey: "intentos", numeric: true },
  { key: "destronamientos", i18nKey: "destronamientos", numeric: true },
  { key: "id_pct", i18nKey: "idPct", numeric: true },
];

export default function Standings() {
  const { t } = useTranslation("standings");
  const COLS = useMemo(() => COL_KEYS.map((c) => ({ ...c, label: t(`cols.${c.i18nKey}.label`), desc: t(`cols.${c.i18nKey}.desc`) })), [t]);
  const teamsQ = useTeams();
  const matchesQ = useMatches();
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState<SortKey>("pos");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [teamFilter, setTeamFilter] = useState<string>("");
  const [comboOpen, setComboOpen] = useState(false);
  const [comboQuery, setComboQuery] = useState("");

  // Hidden admin access via combobox search
  useEffect(() => {
    const v = comboQuery.trim().toLowerCase();
    if (v === "croquetasdejamón" || v === "croquetasdejamon") {
      setComboQuery("");
      setComboOpen(false);
      navigate("/admin");
    }
  }, [comboQuery, navigate]);

  const computed = useMemo(() => {
    if (!teamsQ.data || !matchesQ.data) return null;
    return computeStandings(teamsQ.data, matchesQ.data);
  }, [teamsQ.data, matchesQ.data]);

  const baseRows = computed?.rows ?? [];
  const championId = computed?.champion ?? null;
  const teamsSorted = useMemo(() => [...(teamsQ.data ?? [])].sort((a, b) => a.name.localeCompare(b.name)), [teamsQ.data]);
  const selectedTeam = teamsSorted.find((t) => t.id === teamFilter);

  const rows = useMemo(() => {
    let r = baseRows.map((row: any, idx: number) => ({ ...row, _pos: idx + 1 }));
    if (teamFilter) {
      r = r.filter((x: { team: { id: string } }) => x.team.id === teamFilter);
    }
    if (sortKey !== "pos") {
      r = [...r].sort((a, b) => {
        if (sortKey === "team") {
          const cmp = a.team.name.localeCompare(b.team.name);
          return sortDir === "asc" ? cmp : -cmp;
        }
        const av = (a as unknown as Record<string, number>)[sortKey];
        const bv = (b as unknown as Record<string, number>)[sortKey];
        return sortDir === "asc" ? av - bv : bv - av;
      });
    }
    return r;
  }, [baseRows, teamFilter, sortKey, sortDir]);

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir(k === "team" ? "asc" : "desc"); }
  }

  const loading = teamsQ.isLoading || matchesQ.isLoading;

  return (
    <div className="container py-10">
      <h1 className="text-4xl font-black sm:text-5xl">{t("title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>

      {/* Legend */}
      <Card className="mt-6 p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-primary">{t("legend.title")}</h2>
        <ul className="mt-3 grid gap-2 text-xs text-foreground/80 sm:grid-cols-2 lg:grid-cols-3">
          <li><Trans i18nKey="legend.pj" ns="standings" /></li>
          <li><Trans i18nKey="legend.ved" ns="standings" /></li>
          <li><Trans i18nKey="legend.p" ns="standings" /></li>
          <li><Trans i18nKey="legend.ppp" ns="standings" /></li>
          <li><Trans i18nKey="legend.gfgcdg" ns="standings" /></li>
          <li><Trans i18nKey="legend.pct" ns="standings" /></li>
          <li><Trans i18nKey="legend.mj" ns="standings" /></li>
          <li><Trans i18nKey="legend.intentos" ns="standings" /></li>
          <li><Trans i18nKey="legend.destronamientos" ns="standings" /></li>
          <li><Trans i18nKey="legend.id" ns="standings" /></li>
        </ul>
      </Card>

      {/* Team combobox filter */}
      <div className="mt-6 flex items-center gap-2">
        <Popover open={comboOpen} onOpenChange={setComboOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={comboOpen}
              className="w-[280px] justify-between"
            >
              {selectedTeam ? (
                <span className="flex items-center gap-2">
                  <TeamBadge team={selectedTeam} size={20} />
                  {selectedTeam.name}
                </span>
              ) : (
                <span className="text-muted-foreground">{t("filter.placeholder")}</span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-0">
            <Command>
              <CommandInput
                placeholder={t("filter.searchPlaceholder")}
                value={comboQuery}
                onValueChange={setComboQuery}
              />
              <CommandList>
                <CommandEmpty>{t("filter.noResults")}</CommandEmpty>
                <CommandGroup>
                  {teamsSorted.map((t) => (
                    <CommandItem
                      key={t.id}
                      value={t.name}
                      onSelect={() => {
                        setTeamFilter(t.id === teamFilter ? "" : t.id);
                        setComboOpen(false);
                      }}
                    >
                      <Check className={cn("mr-2 h-4 w-4", teamFilter === t.id ? "opacity-100" : "opacity-0")} />
                      <TeamBadge team={t} size={20} />
                      <span className="ml-2">{t.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {teamFilter && (
          <Button variant="ghost" onClick={() => setTeamFilter("")}>
            <X className="mr-1 h-4 w-4" /> {t("filter.clear")}
          </Button>
        )}
        <span className="text-xs text-muted-foreground">{t("filter.teamsCount", { count: rows.length })}</span>
      </div>

      {/* Table */}
      <Card className="mt-4 overflow-hidden">
        <div className="max-h-[88vh] overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-10 bg-muted/95 text-xs uppercase tracking-wider text-muted-foreground backdrop-blur">
              <tr>
                <Th onClick={() => toggleSort("pos")} active={sortKey === "pos"} dir={sortDir}>{t("table.pos")}</Th>
                <Th onClick={() => toggleSort("team")} active={sortKey === "team"} dir={sortDir} align="left">{t("table.team")}</Th>
                {COLS.map((c) => (
                  <Th key={c.key} onClick={() => toggleSort(c.key)} active={sortKey === c.key} dir={sortDir} title={c.desc}>
                    {c.label}
                  </Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="p-3" colSpan={COLS.length + 2}><Skeleton className="h-6 w-full" /></td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr><td colSpan={COLS.length + 2} className="p-8 text-center text-muted-foreground">{t("table.empty")}</td></tr>
              ) : (
                rows.map((r: StandingRow & { _pos: number }) => (
                  <Row key={r.team.id} row={r} pos={r._pos} isChampion={r.team.id === championId} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Th({ children, onClick, active, dir, align = "center", title }: { children: React.ReactNode; onClick: () => void; active: boolean; dir: "asc" | "desc"; align?: "left" | "center"; title?: string }) {
  return (
    <th
      onClick={onClick}
      title={title}
      className={`cursor-pointer select-none whitespace-nowrap px-3 py-3 ${align === "left" ? "text-left" : "text-center"} hover:text-foreground`}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        <ArrowUpDown className={`h-3 w-3 ${active ? (dir === "asc" ? "rotate-180 text-primary" : "text-primary") : "opacity-30"}`} />
      </span>
    </th>
  );
}

function Row({ row, pos, isChampion }: { row: StandingRow; pos: number; isChampion: boolean }) {
  return (
    <tr className={`border-t border-border transition-colors hover:bg-accent/40 ${isChampion ? "bg-primary/5" : ""}`}>
      <td className="px-3 py-2 text-center font-semibold tabular-nums">{pos}</td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <TeamBadge team={row.team} size={24} />
          <span className="font-medium">{row.team.name}</span>
          {isChampion && <Crown className="h-4 w-4 text-primary" />}
        </div>
      </td>
      <Td>{row.pj}</Td>
      <Td>{row.v}</Td>
      <Td>{row.e}</Td>
      <Td>{row.d}</Td>
      <Td bold>{row.p}</Td>
      <Td>{row.gf}</Td>
      <Td>{row.gc}</Td>
      <Td>{row.dg > 0 ? `+${row.dg}` : row.dg}</Td>
      <Td>{row.ppp.toFixed(2)}</Td>
      <Td>{row.pct}</Td>
      <Td>{row.mj}</Td>
      <Td>{row.intentos}</Td>
      <Td>{row.destronamientos}</Td>
      <Td>{row.id_pct.toFixed(1)}%</Td>
    </tr>
  );
}

function Td({ children, bold }: { children: React.ReactNode; bold?: boolean }) {
  return <td className={`px-3 py-2 text-center tabular-nums ${bold ? "font-bold" : ""}`}>{children}</td>;
}
