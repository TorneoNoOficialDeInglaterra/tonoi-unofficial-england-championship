import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation, Trans } from "react-i18next";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { TeamBadge } from "@/components/TeamBadge";
import { CountryFlag } from "@/components/CountryFlag";
import { StandingsTable, type PositionedRow } from "@/components/StandingsTable";
import { useMatches, useTeams } from "@/hooks/useTonoiData";
import { computeStandings } from "@/lib/tonoi";
import { cn } from "@/lib/utils";

export default function Standings() {
  const { t } = useTranslation("standings");
  const teamsQ = useTeams();
  const matchesQ = useMatches();
  const navigate = useNavigate();
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
  const selectedTeam = teamsSorted.find((x) => x.id === teamFilter);

  const rows: PositionedRow[] = useMemo(() => {
    const r = baseRows.map((row, idx) => ({ ...row, _pos: idx + 1 }));
    return teamFilter ? r.filter((x) => x.team.id === teamFilter) : r;
  }, [baseRows, teamFilter]);

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
        <div className="mt-4 rounded-lg border border-border bg-muted/40 p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-primary">{t("scoring.title")}</h3>
          <ul className="mt-2 grid gap-1.5 text-xs text-foreground/80 sm:grid-cols-2">
            <li><Trans i18nKey="scoring.win" ns="standings" /></li>
            <li><Trans i18nKey="scoring.pens" ns="standings" /></li>
            <li><Trans i18nKey="scoring.drawChampion" ns="standings" /></li>
            <li><Trans i18nKey="scoring.drawChallenger" ns="standings" /></li>
            <li><Trans i18nKey="scoring.loss" ns="standings" /></li>
          </ul>
        </div>
      </Card>

      {/* Team combobox filter */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Popover open={comboOpen} onOpenChange={setComboOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" aria-expanded={comboOpen} className="w-full justify-between sm:w-[280px]">
              {selectedTeam ? (
                <span className="flex items-center gap-2">
                  <TeamBadge team={selectedTeam} size={20} />
                  {selectedTeam.name}
                  <CountryFlag code={selectedTeam.country_code} width={16} />
                </span>
              ) : (
                <span className="text-muted-foreground">{t("filter.placeholder")}</span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-0">
            <Command>
              <CommandInput placeholder={t("filter.searchPlaceholder")} value={comboQuery} onValueChange={setComboQuery} />
              <CommandList>
                <CommandEmpty>{t("filter.noResults")}</CommandEmpty>
                <CommandGroup>
                  {teamsSorted.map((team) => (
                    <CommandItem
                      key={team.id}
                      value={team.name}
                      onSelect={() => {
                        setTeamFilter(team.id === teamFilter ? "" : team.id);
                        setComboOpen(false);
                      }}
                    >
                      <Check className={cn("mr-2 h-4 w-4", teamFilter === team.id ? "opacity-100" : "opacity-0")} />
                      <TeamBadge team={team} size={20} />
                      <span className="ml-2">{team.name}</span>
                      <CountryFlag code={team.country_code} width={16} className="ml-auto" />
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

      <div className="mt-4">
        <StandingsTable rows={rows} championId={championId} loading={loading} />
      </div>
    </div>
  );
}
