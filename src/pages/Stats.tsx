import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ArrowUpDown, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSeasons } from "@/hooks/useTonoiData";

const HISTORIC = "__historic__";

type Player = { id: string; player_name: string; goals: number; assists: number };
type Keeper = { id: string; goalkeeper_name: string; clean_sheets: number };

export default function Stats() {
  const { t } = useTranslation("stats");
  const seasonsQ = useSeasons();
  const [season, setSeason] = useState<string>("");

  useEffect(() => {
    if (!season && seasonsQ.data?.length) {
      const active = seasonsQ.data.find((s) => s.is_active);
      setSeason(active?.id ?? seasonsQ.data[0].id);
    }
  }, [seasonsQ.data, season]);

  return (
    <div className="container py-10">
      <h1 className="text-4xl font-black sm:text-5xl">{t("stats.title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("stats.subtitle")}</p>
      <div className="mt-3 inline-flex items-start gap-2 rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <span>{t("stats.note")}</span>
      </div>

      <div className="mt-6 max-w-xs">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("stats.season")}</label>
        <Select value={season} onValueChange={setSeason}>
          <SelectTrigger className="mt-1"><SelectValue placeholder={t("stats.seasonPlaceholder")} /></SelectTrigger>
          <SelectContent>
            {(seasonsQ.data ?? []).map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.label}{s.is_active ? t("stats.seasonCurrentSuffix") : ""}</SelectItem>
            ))}
            <SelectItem value={HISTORIC}>{t("stats.historic")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="players" className="mt-8">
        <TabsList>
          <TabsTrigger value="players">{t("stats.tabs.players")}</TabsTrigger>
          <TabsTrigger value="keepers">{t("stats.tabs.keepers")}</TabsTrigger>
        </TabsList>
        <TabsContent value="players" className="mt-4">
          <PlayersTable seasonId={season} />
        </TabsContent>
        <TabsContent value="keepers" className="mt-4">
          <KeepersTable seasonId={season} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

type SortKey = "name" | "goals" | "assists" | "ga";

function PlayersTable({ seasonId }: { seasonId: string }) {
  const { t } = useTranslation("stats");
  const isHistoric = seasonId === HISTORIC;
  const q = useQuery({
    queryKey: ["players", seasonId],
    enabled: !!seasonId,
    queryFn: async (): Promise<Player[]> => {
      if (isHistoric) {
        const { data, error } = await supabase
          .from("player_stats_alltime")
          .select("id, player_name, goals, assists");
        if (error) throw error;
        return (data ?? []).map((r) => ({ id: r.id, player_name: r.player_name, goals: r.goals, assists: r.assists }));
      }
      const { data, error } = await supabase
        .from("player_stats")
        .select("id, player_name, goals, assists")
        .eq("season_id", seasonId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const [sortKey, setSortKey] = useState<SortKey>("ga");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    let r = (q.data ?? []).map((p) => ({ ...p, ga: p.goals + p.assists }));
    if (search.trim()) {
      const n = search.trim().toLowerCase();
      r = r.filter((p) => p.player_name.toLowerCase().includes(n));
    }
    r.sort((a, b) => {
      if (sortKey === "name") {
        const cmp = a.player_name.localeCompare(b.player_name);
        return sortDir === "asc" ? cmp : -cmp;
      }
      const av = (a as unknown as Record<string, number>)[sortKey];
      const bv = (b as unknown as Record<string, number>)[sortKey];
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return r;
  }, [q.data, search, sortKey, sortDir]);

  function toggle(k: SortKey) {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir(k === "name" ? "asc" : "desc"); }
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder={t("stats.searchPlayerPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <span className="text-xs text-muted-foreground">{t("stats.playersCount", { count: rows.length })}</span>
      </div>
      <Card className="overflow-hidden">
        <div className="max-h-[70vh] overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-10 bg-muted/95 text-xs uppercase tracking-wider text-muted-foreground backdrop-blur">
              <tr>
                <SortTh onClick={() => toggle("name")} active={sortKey === "name"} dir={sortDir} align="left">{t("stats.table.player")}</SortTh>
                <SortTh onClick={() => toggle("goals")} active={sortKey === "goals"} dir={sortDir}>{t("stats.table.goals")}</SortTh>
                <SortTh onClick={() => toggle("assists")} active={sortKey === "assists"} dir={sortDir}>{t("stats.table.assists")}</SortTh>
                <SortTh onClick={() => toggle("ga")} active={sortKey === "ga"} dir={sortDir}>{t("stats.table.ga")}</SortTh>
              </tr>
            </thead>
            <tbody>
              {q.isLoading ? (
                <tr><td colSpan={4} className="p-4"><Skeleton className="h-6 w-full" /></td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">{t("stats.noData")}</td></tr>
              ) : (
                rows.map((p, i) => (
                  <tr key={p.id ?? i} className="border-t border-border hover:bg-accent/40">
                    <td className="px-3 py-2.5 font-medium">{p.player_name}</td>
                    <td className="px-3 py-2.5 text-center tabular-nums">{p.goals}</td>
                    <td className="px-3 py-2.5 text-center tabular-nums">{p.assists}</td>
                    <td className="px-3 py-2.5 text-center font-bold tabular-nums">{p.ga}</td>
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

function KeepersTable({ seasonId }: { seasonId: string }) {
  const { t } = useTranslation("stats");
  const isHistoric = seasonId === HISTORIC;
  const q = useQuery({
    queryKey: ["keepers", seasonId],
    enabled: !!seasonId,
    queryFn: async (): Promise<Keeper[]> => {
      if (isHistoric) {
        const { data, error } = await supabase
          .from("goalkeeper_stats_alltime")
          .select("id, goalkeeper_name, clean_sheets");
        if (error) throw error;
        return (data ?? []).map((r) => ({ id: r.id, goalkeeper_name: r.goalkeeper_name, clean_sheets: r.clean_sheets }));
      }
      const { data, error } = await supabase
        .from("goalkeeper_stats")
        .select("id, goalkeeper_name, clean_sheets")
        .eq("season_id", seasonId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const rows = useMemo(() => [...(q.data ?? [])].sort((a, b) => b.clean_sheets - a.clean_sheets), [q.data]);

  return (
    <Card className="overflow-hidden">
      <div className="max-h-[70vh] overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 bg-muted/95 text-xs uppercase tracking-wider text-muted-foreground backdrop-blur">
            <tr>
              <th className="px-3 py-3 text-left">{t("stats.table.keeper")}</th>
              <th className="px-3 py-3 text-center">{t("stats.table.cleanSheets")}</th>
            </tr>
          </thead>
          <tbody>
            {q.isLoading ? (
              <tr><td colSpan={2} className="p-4"><Skeleton className="h-6 w-full" /></td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={2} className="p-8 text-center text-muted-foreground">{t("stats.noData")}</td></tr>
            ) : (
              rows.map((g, i) => (
                <tr key={g.id ?? i} className="border-t border-border hover:bg-accent/40">
                  <td className="px-3 py-2.5 font-medium">{g.goalkeeper_name}</td>
                  <td className="px-3 py-2.5 text-center font-bold tabular-nums">{g.clean_sheets}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function SortTh({ children, onClick, active, dir, align = "center" }: { children: React.ReactNode; onClick: () => void; active: boolean; dir: "asc" | "desc"; align?: "left" | "center" }) {
  return (
    <th onClick={onClick} className={`cursor-pointer select-none whitespace-nowrap px-3 py-3 ${align === "left" ? "text-left" : "text-center"} hover:text-foreground`}>
      <span className="inline-flex items-center gap-1">
        {children}
        <ArrowUpDown className={`h-3 w-3 ${active ? (dir === "asc" ? "rotate-180 text-primary" : "text-primary") : "opacity-30"}`} />
      </span>
    </th>
  );
}
