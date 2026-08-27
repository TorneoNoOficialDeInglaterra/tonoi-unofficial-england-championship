import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Search, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { StandingsTable, type PositionedRow } from "@/components/StandingsTable";
import { useMatches, useTeams } from "@/hooks/useTonoiData";
import { computeStandings } from "@/lib/tonoi";
import { countryName, flagUrl } from "@/lib/countries";

const norm = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export default function NationalStandings() {
  const { t, i18n } = useTranslation("standings");
  const teamsQ = useTeams();
  const matchesQ = useMatches();
  const [params, setParams] = useSearchParams();
  const selected = params.get("pais");
  const [query, setQuery] = useState("");
  const [teamQuery, setTeamQuery] = useState("");

  const computed = useMemo(() => {
    if (!teamsQ.data || !matchesQ.data) return null;
    return computeStandings(teamsQ.data, matchesQ.data);
  }, [teamsQ.data, matchesQ.data]);

  const baseRows = computed?.rows ?? [];
  const championId = computed?.champion ?? null;
  const loading = teamsQ.isLoading || matchesQ.isLoading;

  const countries = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of baseRows) {
      const code = row.team.country_code;
      if (!code) continue;
      counts.set(code, (counts.get(code) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([code, count]) => ({ code, count, name: countryName(code, i18n.language) }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [baseRows, i18n.language]);

  const allRows: PositionedRow[] = useMemo(() => {
    if (!selected) return [];
    return baseRows
      .filter((r) => r.team.country_code === selected)
      .map((r, idx) => ({ ...r, _pos: idx + 1 }));
  }, [baseRows, selected]);

  const rows: PositionedRow[] = useMemo(() => {
    const q = norm(teamQuery);
    if (!q) return allRows;
    return allRows.filter((r) => norm(r.team.name).includes(q));
  }, [allRows, teamQuery]);

  // Búsqueda en la cuadrícula: países por nombre + equipos por nombre
  const q = norm(query);
  const filteredCountries = useMemo(() => {
    if (!q) return countries;
    return countries.filter((c) => norm(c.name).includes(q) || norm(c.code).includes(q));
  }, [countries, q]);

  const teamMatches = useMemo(() => {
    if (q.length < 2) return [];
    return baseRows
      .filter((r) => r.team.country_code && norm(r.team.name).includes(q))
      .slice(0, 12)
      .map((r) => ({ id: r.team.id, name: r.team.name, code: r.team.country_code as string }));
  }, [baseRows, q]);

  // Al cambiar de país, ir al principio de la página
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTeamQuery("");
  }, [selected]);

  if (selected) {
    return (
      <div className="container py-10">
        <Button variant="ghost" className="mb-4 -ml-2" onClick={() => setParams({})}>
          <ArrowLeft className="mr-2 h-4 w-4" /> {t("national.back")}
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={flagUrl(selected, 80)} alt="" className="h-10 w-auto rounded-sm shadow" />
            <div>
              <h1 className="text-3xl font-black sm:text-4xl">{countryName(selected, i18n.language)}</h1>
              <p className="text-sm text-muted-foreground">
                {t("filter.teamsCount", { count: rows.length })}
              </p>
            </div>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={teamQuery}
              onChange={(e) => setTeamQuery(e.target.value)}
              placeholder={t("national.searchTeam", { defaultValue: "Buscar equipo..." })}
              className="pl-9 pr-9"
            />
            {teamQuery && (
              <button
                type="button"
                onClick={() => setTeamQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                aria-label="Limpiar"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <div className="mt-6">
          <StandingsTable rows={rows} championId={championId} loading={loading} />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="text-4xl font-black sm:text-5xl">{t("national.title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("national.subtitle")}</p>

      <div className="relative mt-6 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("national.searchPlaceholder", { defaultValue: "Buscar país o equipo..." })}
          className="pl-9 pr-9"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
            aria-label="Limpiar"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {teamMatches.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {teamMatches.map((tm) => (
            <button
              key={tm.id}
              type="button"
              onClick={() => setParams({ pais: tm.code })}
              className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm transition-colors hover:border-primary hover:bg-accent"
            >
              <img src={flagUrl(tm.code, 20)} alt="" className="h-3.5 w-5 rounded-[2px] object-cover" />
              <span className="font-medium">{tm.name}</span>
              <span className="text-xs text-muted-foreground">{countryName(tm.code, i18n.language)}</span>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : filteredCountries.length === 0 && teamMatches.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">
          {t("national.noResults", { defaultValue: "No se han encontrado países ni equipos." })}
        </p>
      ) : (
        <div className="mt-8 grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {filteredCountries.map((c) => (
            <button key={c.code} type="button" onClick={() => setParams({ pais: c.code })} className="text-left">
              <Card className="flex h-full flex-col items-center gap-2 p-4 transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-lg">
                <img src={flagUrl(c.code, 80)} alt="" className="h-10 w-auto rounded-sm shadow" loading="lazy" />
                <span className="text-center text-sm font-bold leading-tight">{c.name}</span>
                <span className="text-xs text-muted-foreground">{t("filter.teamsCount", { count: c.count })}</span>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
