import { useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { TeamCombobox } from "@/components/social/TeamCombobox";
import { useMatches, useTeams } from "@/hooks/useTonoiData";
import { buildLocalByMatchMap, sideScore, type Match, type Team } from "@/lib/tonoi";
import { TLogo } from "@/components/social/templates/TeamLogo";

type Row = { date: string; local: Team | null; visitor: Team | null; score: string };

const slug = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Splits into `columns` groups of as-equal-as-possible size, keeping order. */
function chunkIntoColumns<T>(items: T[], columns: number): T[][] {
  const base = Math.floor(items.length / columns);
  const rem = items.length % columns;
  const out: T[][] = [];
  let i = 0;
  for (let c = 0; c < columns; c++) {
    const size = base + (c < rem ? 1 : 0);
    out.push(items.slice(i, i + size));
    i += size;
  }
  return out.filter((c) => c.length > 0);
}

export function TeamMatchesImage() {
  const teamsQ = useTeams();
  const matchesQ = useMatches();
  const [teamId, setTeamId] = useState("");
  const [busy, setBusy] = useState(false);
  const renderRef = useRef<HTMLDivElement>(null);

  const teams = useMemo(
    () => [...(teamsQ.data ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [teamsQ.data],
  );
  const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const team = teamById.get(teamId) ?? null;

  const localByMatch = useMemo(
    () => buildLocalByMatchMap(matchesQ.data ?? [], teamById),
    [matchesQ.data, teamById],
  );

  const rows: Row[] = useMemo(() => {
    if (!teamId) return [];
    const list = (matchesQ.data ?? [])
      .filter((m: Match) => m.winner_team_id === teamId || m.loser_team_id === teamId)
      .sort((a, b) => b.match_date.localeCompare(a.match_date));
    return list.map((m) => {
      const localId = m.home_team_id ?? localByMatch.get(m.id) ?? m.winner_team_id;
      const visitorId = localId === m.winner_team_id ? m.loser_team_id : m.winner_team_id;
      return {
        date: m.match_date.split("-").reverse().join("/"),
        local: teamById.get(localId)?.name ?? "—",
        visitor: teamById.get(visitorId)?.name ?? "—",
        score: `${sideScore(m, localId)} – ${sideScore(m, visitorId)}`,
      };
    });
  }, [teamId, matchesQ.data, localByMatch, teamById]);

  const columns = rows.length > 60 ? 3 : 2;
  const cols = useMemo(() => chunkIntoColumns(rows, columns), [rows, columns]);

  async function handleDownload() {
    if (!team) return toast.error("Selecciona un equipo");
    if (!renderRef.current || rows.length === 0) return toast.error("Ese equipo no tiene partidos");
    setBusy(true);
    try {
      const dataUrl = await toPng(renderRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `partidos-${slug(team.name)}.png`;
      a.click();
      toast.success("Imagen descargada");
    } catch (e: any) {
      toast.error("Error generando imagen: " + (e?.message ?? "desconocido"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <Label>Equipo</Label>
            <div className="mt-1">
              <TeamCombobox teams={teams} value={teamId} onChange={setTeamId} />
            </div>
          </div>
          <Button onClick={handleDownload} disabled={busy || !teamId || rows.length === 0}>
            <Download className="mr-2 h-4 w-4" /> {busy ? "Generando…" : "Descargar PNG"}
          </Button>
        </div>
        {teamId && (
          <p className="mt-3 text-xs text-muted-foreground">
            {rows.length} partidos · {columns} columnas
          </p>
        )}
      </Card>

      {rows.length > 0 && (
        <Card className="p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Previsualización</p>
          <div className="max-h-[60vh] overflow-auto rounded-md border border-border">
            <div ref={renderRef} style={{ width: "fit-content" }}>
              <MatchesCanvas cols={cols} />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

const MatchesCanvas = ({ cols }: { cols: Row[][] }) => (
  <div
    style={{
      display: "flex",
      gap: 28,
      padding: 32,
      background: "#ffffff",
      color: "#111111",
      fontFamily: "Inter, system-ui, sans-serif",
      width: "fit-content",
    }}
  >
    {cols.map((col, i) => (
      <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 420 }}>
        {col.map((r, j) => (
          <div
            key={j}
            style={{
              display: "grid",
              gridTemplateColumns: "104px 1fr 96px 1fr",
              alignItems: "center",
              gap: 10,
              padding: "6px 8px",
              background: j % 2 === 0 ? "#f4f4f5" : "#ffffff",
              borderRadius: 4,
              fontSize: 15,
              lineHeight: 1.2,
            }}
          >
            <span style={{ color: "#71717a", fontVariantNumeric: "tabular-nums" }}>{r.date}</span>
            <span style={{ textAlign: "right", fontWeight: 600, whiteSpace: "nowrap" }}>{r.local}</span>
            <span
              style={{
                textAlign: "center",
                fontWeight: 700,
                fontFamily: "ui-monospace, monospace",
                fontVariantNumeric: "tabular-nums",
                whiteSpace: "nowrap",
              }}
            >
              {r.score}
            </span>
            <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{r.visitor}</span>
          </div>
        ))}
      </div>
    ))}
  </div>
);
