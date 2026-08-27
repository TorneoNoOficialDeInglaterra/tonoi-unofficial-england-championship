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

  const rows: PositionedRow[] = useMemo(() => {
    if (!selected) return [];
    return baseRows
      .filter((r) => r.team.country_code === selected)
      .map((r, idx) => ({ ...r, _pos: idx + 1 }));
  }, [baseRows, selected]);

  // Al cambiar de país, ir al principio de la página
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [selected]);

  if (selected) {
    return (
      <div className="container py-10">
        <Button variant="ghost" className="mb-4 -ml-2" onClick={() => setParams({})}>
          <ArrowLeft className="mr-2 h-4 w-4" /> {t("national.back")}
        </Button>
        <div className="flex items-center gap-3">
          <img src={flagUrl(selected, 80)} alt="" className="h-10 w-auto rounded-sm shadow" />
          <div>
            <h1 className="text-3xl font-black sm:text-4xl">{countryName(selected, i18n.language)}</h1>
            <p className="text-sm text-muted-foreground">{t("filter.teamsCount", { count: rows.length })}</p>
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

      {loading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : (
        <div className="mt-8 grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {countries.map((c) => (
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
