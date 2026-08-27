import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowUpDown, Crown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamBadge } from "@/components/TeamBadge";
import { CountryFlag } from "@/components/CountryFlag";
import type { StandingRow } from "@/lib/tonoi";

export type SortKey =
  | "pos" | "pj" | "v" | "e" | "d" | "p" | "gf" | "gc" | "dg" | "ppp"
  | "pct" | "mj" | "intentos" | "destronamientos" | "id_pct" | "team";

const COL_KEYS: { key: SortKey; i18nKey: string }[] = [
  { key: "pj", i18nKey: "pj" },
  { key: "v", i18nKey: "v" },
  { key: "e", i18nKey: "e" },
  { key: "d", i18nKey: "d" },
  { key: "p", i18nKey: "p" },
  { key: "gf", i18nKey: "gf" },
  { key: "gc", i18nKey: "gc" },
  { key: "dg", i18nKey: "dg" },
  { key: "ppp", i18nKey: "ppp" },
  { key: "pct", i18nKey: "pct" },
  { key: "mj", i18nKey: "mj" },
  { key: "intentos", i18nKey: "intentos" },
  { key: "destronamientos", i18nKey: "destronamientos" },
  { key: "id_pct", i18nKey: "idPct" },
];

export type PositionedRow = StandingRow & { _pos: number };

export function StandingsTable({
  rows,
  championId,
  loading,
  maxHeight = "88vh",
}: {
  rows: PositionedRow[];
  championId: string | null;
  loading?: boolean;
  maxHeight?: string;
}) {
  const { t } = useTranslation("standings");
  const COLS = useMemo(
    () => COL_KEYS.map((c) => ({ ...c, label: t(`cols.${c.i18nKey}.label`), desc: t(`cols.${c.i18nKey}.desc`) })),
    [t],
  );
  const [sortKey, setSortKey] = useState<SortKey>("pos");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    if (sortKey === "pos") return rows;
    return [...rows].sort((a, b) => {
      if (sortKey === "team") {
        const cmp = a.team.name.localeCompare(b.team.name);
        return sortDir === "asc" ? cmp : -cmp;
      }
      const av = (a as unknown as Record<string, number>)[sortKey];
      const bv = (b as unknown as Record<string, number>)[sortKey];
      return sortDir === "asc" ? av - bv : bv - av;
    });
  }, [rows, sortKey, sortDir]);

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir(k === "team" ? "asc" : "desc"); }
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-auto" style={{ maxHeight }}>
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
            ) : sorted.length === 0 ? (
              <tr><td colSpan={COLS.length + 2} className="p-8 text-center text-muted-foreground">{t("table.empty")}</td></tr>
            ) : (
              sorted.map((r) => (
                <Row key={r.team.id} row={r} pos={r._pos} isChampion={r.team.id === championId} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
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
          <CountryFlag code={row.team.country_code} width={18} />
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

export default StandingsTable;
