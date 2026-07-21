import { useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Download, Plus, Trash2, Copy } from "lucide-react";
import { useTeams } from "@/hooks/useTonoiData";
import { TemplateRenderer } from "./TemplateRenderer";
import { TeamCombobox } from "./TeamCombobox";
import { COMPETITION_LABELS, CUP_LABELS, LEAGUE_LABELS, type Competition, type DomesticCup, type DomesticLeague, type ImageType, type Scorer, type TemplateData } from "./templates/shared";

const PREVIEW_SCALE = 0.45; // 1080 -> 486px

export function ImageGenerator() {
  const teamsQ = useTeams();
  const teams = useMemo(() => [...(teamsQ.data ?? [])].sort((a, b) => a.name.localeCompare(b.name)), [teamsQ.data]);

  const [type, setType] = useState<ImageType>("resultado");
  const [competition, setCompetition] = useState<Competition>("liga");
  const [domesticLeague, setDomesticLeague] = useState<DomesticLeague>("premier");
  const [domesticCup, setDomesticCup] = useState<DomesticCup>("copa-del-rey");
  const [ligaVariant, setLigaVariant] = useState<"auto" | 1 | 2>("auto");
  const [homeId, setHomeId] = useState<string>("");
  const [awayId, setAwayId] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState<string>("21:00");
  const [stadium, setStadium] = useState<string>("");
  const [homeGoals, setHomeGoals] = useState<number>(0);
  const [awayGoals, setAwayGoals] = useState<number>(0);
  const [scorers, setScorers] = useState<Scorer[]>([]);

  const homeTeam = teams.find((t) => t.id === homeId) ?? null;
  const awayTeam = teams.find((t) => t.id === awayId) ?? null;

  const data: TemplateData = {
    type, competition, domesticLeague, ligaVariant, homeTeam, awayTeam, date, time, stadium,
    homeGoals, awayGoals, scorers,
  };

  const renderRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  async function generatePng(): Promise<Blob | null> {
    if (!renderRef.current) return null;
    const dataUrl = await toPng(renderRef.current, {
      width: 1080,
      height: 1080,
      pixelRatio: 1,
      cacheBust: true,
      backgroundColor: "#000",
    });
    const res = await fetch(dataUrl);
    return await res.blob();
  }

  async function handleDownload() {
    if (!homeTeam || !awayTeam) return toast.error("Selecciona los dos equipos");
    setBusy(true);
    try {
      const blob = await generatePng();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const slug = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-");
      a.href = url;
      a.download = `tonoi-${type}-${date}-${slug(homeTeam.name)}-vs-${slug(awayTeam.name)}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Imagen descargada");
    } catch (e: any) {
      toast.error("Error generando imagen: " + (e?.message ?? "desconocido"));
    } finally {
      setBusy(false);
    }
  }

  async function handleCopy() {
    if (!homeTeam || !awayTeam) return toast.error("Selecciona los dos equipos");
    setBusy(true);
    try {
      const blob = await generatePng();
      if (!blob) return;
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      toast.success("Imagen copiada al portapapeles");
    } catch (e: any) {
      toast.error("No se pudo copiar: " + (e?.message ?? "desconocido"));
    } finally {
      setBusy(false);
    }
  }

  function addScorer() {
    setScorers([...scorers, { side: "home", minute: "", player: "" }]);
  }
  function updateScorer(i: number, patch: Partial<Scorer>) {
    setScorers(scorers.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function removeScorer(i: number) {
    setScorers(scorers.filter((_, idx) => idx !== i));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_540px]">
      {/* Form */}
      <Card className="space-y-4 p-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Generador de imagen</h3>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Tipo de imagen</Label>
            <Select value={type} onValueChange={(v) => setType(v as ImageType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="anuncio">Anuncio del partido</SelectItem>
                <SelectItem value="resultado">Resultado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Competición</Label>
            <Select value={competition} onValueChange={(v) => setCompetition(v as Competition)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(COMPETITION_LABELS) as Competition[]).map((c) => (
                  <SelectItem key={c} value={c} disabled={c === "conference"}>
                    {COMPETITION_LABELS[c]}{c === "conference" ? " (próximamente)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {competition === "liga" && (
            <>
              <div>
                <Label>Liga</Label>
                <Select value={domesticLeague} onValueChange={(v) => setDomesticLeague(v as DomesticLeague)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(LEAGUE_LABELS) as DomesticLeague[]).map((l) => (
                      <SelectItem key={l} value={l}>{LEAGUE_LABELS[l]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Diseño</Label>
                <Select value={String(ligaVariant)} onValueChange={(v) => setLigaVariant(v === "auto" ? "auto" : (Number(v) as 1 | 2))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Automático</SelectItem>
                    <SelectItem value="1">Diseño 1 (sepia)</SelectItem>
                    <SelectItem value="2">Diseño 2 (crema)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div>
            <Label>Equipo local</Label>
            <TeamCombobox teams={teams} value={homeId} onChange={setHomeId} />
          </div>
          <div>
            <Label>Equipo visitante</Label>
            <TeamCombobox teams={teams} value={awayId} onChange={setAwayId} />
          </div>


          <div>
            <Label>Fecha</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label>Hora</Label>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>

          <div className="sm:col-span-2">
            <Label>Estadio</Label>
            <Input placeholder="Ej: Etihad Stadium" value={stadium} onChange={(e) => setStadium(e.target.value)} />
          </div>

          {type === "resultado" && (
            <>
              <div>
                <Label>Goles local</Label>
                <Input type="number" min={0} value={homeGoals} onChange={(e) => setHomeGoals(Number(e.target.value))} />
              </div>
              <div>
                <Label>Goles visitante</Label>
                <Input type="number" min={0} value={awayGoals} onChange={(e) => setAwayGoals(Number(e.target.value))} />
              </div>
            </>
          )}
        </div>

        {type === "resultado" && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Goleadores</Label>
              <Button type="button" size="sm" variant="outline" onClick={addScorer}><Plus className="mr-1 h-4 w-4" />Añadir</Button>
            </div>
            <div className="space-y-2">
              {scorers.length === 0 && <p className="text-xs text-muted-foreground">Aún no hay goleadores.</p>}
              {scorers.map((s, i) => (
                <div key={i} className="grid grid-cols-[110px_90px_1fr_auto] gap-2">
                  <Select value={s.side} onValueChange={(v) => updateScorer(i, { side: v as "home" | "away" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="home">Local</SelectItem>
                      <SelectItem value="away">Visitante</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="Min" value={s.minute} onChange={(e) => updateScorer(i, { minute: e.target.value })} />
                  <Input placeholder="Jugador" value={s.player} onChange={(e) => updateScorer(i, { player: e.target.value })} />
                  <Button variant="ghost" size="icon" onClick={() => removeScorer(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button onClick={handleDownload} disabled={busy}><Download className="mr-1 h-4 w-4" />Descargar PNG</Button>
          <Button variant="outline" onClick={handleCopy} disabled={busy}><Copy className="mr-1 h-4 w-4" />Copiar</Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Los assets de fondos y logos de competición se cargan desde <code>/public/social/</code>. Si faltan archivos, las plantillas se verán incompletas.
        </p>
      </Card>

      {/* Preview */}
      <div>
        <Label className="mb-2 block">Vista previa (1080×1080)</Label>
        <div
          className="relative overflow-hidden rounded-md border bg-black"
          style={{ width: 1080 * PREVIEW_SCALE, height: 1080 * PREVIEW_SCALE }}
        >
          <div style={{ transform: `scale(${PREVIEW_SCALE})`, transformOrigin: "top left", width: 1080, height: 1080 }}>
            <div ref={renderRef}>
              <TemplateRenderer data={data} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
