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

const TLogo = ({ team, size }: { team: Team | null; size: number }) =>
  team?.logo_url ? (
    <img
      src={team.logo_url}
      alt=""
      crossOrigin="anonymous"
      style={{ width: size, height: size, objectFit: "contain", flexShrink: 0 }}
    />
  ) : (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 4,
        border: "1px solid #d4d4d8",
        color: "#52525b",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 800,
        fontSize: size * 0.32,
        flexShrink: 0,
      }}
    >
      {(team?.name ?? "?").slice(0, 3).toUpperCase()}
    </div>
  );


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
        date: new Date(m.match_date)
          .toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })
          .toUpperCase()
          .replace(/\./g, ""),
        local: teamById.get(localId) ?? null,
        visitor: teamById.get(visitorId) ?? null,
        score: `${sideScore(m, localId)} – ${sideScore(m, visitorId)}`,
      };
    });
  }, [teamId, matchesQ.data, localByMatch, teamById]);

  const columns = rows.length <= 25 ? 1 : rows.length <= 80 ? 2 : 3;
  const cols = useMemo(() => chunkIntoColumns(rows, columns), [rows, columns]);

  async function handleDownload() {
    if (!team) return toast.error("Selecciona un equipo");
    if (!renderRef.current || rows.length === 0) return toast.error("Ese equipo no tiene partidos");
    setBusy(true);
    try {
      const node = renderRef.current;
      // Pre-cargar los escudos como data URL para que no fallen por CORS al exportar.
      const BLANK =
        "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
      const imgs = Array.from(node.querySelectorAll("img"));
      await Promise.all(
        imgs.map(async (img) => {
          const src = img.getAttribute("src") ?? "";
          if (!src || src.startsWith("data:")) return;
          try {
            const res = await fetch(src, { mode: "cors" });
            if (!res.ok) throw new Error(String(res.status));
            const blob = await res.blob();
            const dataUrl = await new Promise<string>((resolve, reject) => {
              const fr = new FileReader();
              fr.onload = () => resolve(String(fr.result));
              fr.onerror = () => reject(new Error("read"));
              fr.readAsDataURL(blob);
            });
            img.removeAttribute("crossorigin");
            img.setAttribute("src", dataUrl);
          } catch {
            // Escudo no accesible: se sustituye por un pixel transparente
            img.removeAttribute("crossorigin");
            img.setAttribute("src", BLANK);
          }
        }),
      );
      await new Promise((r) => setTimeout(r, 100));


      const dataUrl = await toPng(node, {
        cacheBust: false,
        skipFonts: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      const blob = await (await fetch(dataUrl)).blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `partidos-${slug(team.name)}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      toast.success("Imagen descargada");

    } catch (e: any) {
      console.error("[TeamMatchesImage] download failed", e);
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
      gap: 24,
      padding: 32,
      background: "#ffffff",
      color: "#111111",
      fontFamily: "Inter, system-ui, sans-serif",
      width: "fit-content",
      alignItems: "flex-start",
    }}
  >
    {cols.map((col, i) => (
      <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 460 }}>
        {col.map((r, j) => (
          <div
            key={j}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              padding: "8px 10px",
              background: "#ffffff",
              borderBottom: "1px solid #e4e4e7",
            }}
          >
            <span
              style={{
                fontSize: 12,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: "#71717a",
                whiteSpace: "nowrap",
              }}
            >
              {r.date}
            </span>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 110px 1fr",
                alignItems: "center",
                gap: 10,
                width: "100%",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 16, whiteSpace: "nowrap" }}>{r.local?.name ?? "—"}</span>
                <TLogo team={r.local} size={24} />
              </div>
              <span
                style={{
                  textAlign: "center",
                  fontWeight: 700,
                  fontSize: 16,
                  fontFamily: "ui-monospace, monospace",
                  fontVariantNumeric: "tabular-nums",
                  background: "#f4f4f5",
                  borderRadius: 6,
                  padding: "4px 8px",
                  whiteSpace: "nowrap",
                }}
              >
                {r.score}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <TLogo team={r.visitor} size={24} />
                <span style={{ fontWeight: 600, fontSize: 16, whiteSpace: "nowrap" }}>{r.visitor?.name ?? "—"}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    ))}
  </div>
);

