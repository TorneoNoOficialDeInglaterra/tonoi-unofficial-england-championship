import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Crown, Search, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamBadge } from "@/components/TeamBadge";
import { useMatches, useTeams } from "@/hooks/useTonoiData";
import { computeStandings, type StandingRow } from "@/lib/tonoi";

type SortKey = "pos" | "pj" | "v" | "e" | "d" | "p" | "gf" | "gc" | "dg" | "ppp" | "pct" | "mj" | "intentos" | "destronamientos" | "id_pct" | "team";

const COLS: { key: SortKey; label: string; desc?: string; numeric?: boolean }[] = [
  { key: "pj", label: "PJ", desc: "Partidos Jugados", numeric: true },
  { key: "v", label: "V", desc: "Victorias", numeric: true },
  { key: "e", label: "E", desc: "Empates", numeric: true },
  { key: "d", label: "D", desc: "Derrotas", numeric: true },
  { key: "p", label: "P", desc: "Puntos", numeric: true },
  { key: "gf", label: "GF", desc: "Goles a Favor", numeric: true },
  { key: "gc", label: "GC", desc: "Goles en Contra", numeric: true },
  { key: "dg", label: "DG", desc: "Diferencia de Goles", numeric: true },
  { key: "ppp", label: "PPP", desc: "Puntos por Partido", numeric: true },
  { key: "pct", label: "PcT", desc: "Partidos con Trofeo", numeric: true },
  { key: "mj", label: "MJ", desc: "Mejor racha", numeric: true },
  { key: "intentos", label: "I", desc: "Intentos", numeric: true },
  { key: "destronamientos", label: "Des", desc: "Destronamientos", numeric: true },
  { key: "id_pct", label: "ID", desc: "Índice de Destronamiento (%)", numeric: true },
];

export default function Standings() {
  const teamsQ = useTeams();
  const matchesQ = useMatches();
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState<SortKey>("pos");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [q, setQ] = useState("");

  // Hidden admin access via search
  useEffect(() => {
    if (q.trim().toLowerCase() === "croquetasdejamón" || q.trim().toLowerCase() === "croquetasdejamon") {
      setQ("");
      navigate("/admin");
    }
  }, [q, navigate]);

  const computed = useMemo(() => {
    if (!teamsQ.data || !matchesQ.data) return null;
    return computeStandings(teamsQ.data, matchesQ.data);
  }, [teamsQ.data, matchesQ.data]);

  const baseRows = computed?.rows ?? [];
  const championId = computed?.champion ?? null;

  const rows = useMemo(() => {
    let r = baseRows.map((row, idx) => ({ ...row, _pos: idx + 1 }));
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      r = r.filter((x) => x.team.name.toLowerCase().includes(needle));
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
  }, [baseRows, q, sortKey, sortDir]);

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir(k === "team" ? "asc" : "desc"); }
  }

  const loading = teamsQ.isLoading || matchesQ.isLoading;

  return (
    <div className="container py-10">
      <h1 className="text-4xl font-black sm:text-5xl">Clasificación histórica</h1>
      <p className="mt-2 text-muted-foreground">Calculada partido a partido desde el primer ToNOI hasta hoy.</p>

      {/* Legend */}
      <Card className="mt-6 p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Leyenda</h2>
        <ul className="mt-3 grid gap-2 text-xs text-foreground/80 sm:grid-cols-2 lg:grid-cols-3">
          <li><strong>PJ</strong>: Partidos Jugados</li>
          <li><strong>V/E/D</strong>: Victorias / Empates / Derrotas</li>
          <li><strong>P</strong>: Puntos Totales</li>
          <li><strong>PPP</strong>: Puntos por Partido</li>
          <li><strong>GF/GC/DG</strong>: Goles Favor / Contra / Diferencia</li>
          <li><strong>PcT</strong>: Partidos con Trofeo</li>
          <li><strong>MJ</strong>: Mejor racha (partidos seguidos con el trofeo)</li>
          <li><strong>I</strong>: Número de intentos para destronar al campeón</li>
          <li><strong>Des</strong>: Destronamientos (títulos ganados)</li>
          <li><strong>ID</strong>: Porcentaje de éxito (Des/I)</li>
        </ul>
      </Card>

      {/* Search */}
      <div className="mt-6 flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar equipo..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <span className="text-xs text-muted-foreground">{rows.length} equipos</span>
      </div>

      {/* Table */}
      <Card className="mt-4 overflow-hidden">
        <div className="max-h-[70vh] overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-10 bg-muted/95 text-xs uppercase tracking-wider text-muted-foreground backdrop-blur">
              <tr>
                <Th onClick={() => toggleSort("pos")} active={sortKey === "pos"} dir={sortDir}>#</Th>
                <Th onClick={() => toggleSort("team")} active={sortKey === "team"} dir={sortDir} align="left">Equipo</Th>
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
                <tr><td colSpan={COLS.length + 2} className="p-8 text-center text-muted-foreground">Sin datos todavía.</td></tr>
              ) : (
                rows.map((r) => (
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
