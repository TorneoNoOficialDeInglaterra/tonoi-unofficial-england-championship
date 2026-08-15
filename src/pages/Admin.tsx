import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { toast } from "sonner";
import { Trash2, LogOut, Shield, Archive, Check, ChevronsUpDown, Mail, Pencil, HelpCircle, Send, MessageSquareReply, Languages, Loader2, ChevronDown } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useTeams, useSeasons, useMatches } from "@/hooks/useTonoiData";
import { ImageGenerator } from "@/components/social/ImageGenerator";

import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { isPenaltyMatch, sideScore, type Match, type Team } from "@/lib/tonoi";


export default function Admin() {
  const nav = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { nav("/auth"); return; }
      setUserId(data.session.user.id);
      setChecking(false);
    });
  }, [nav]);

  const roleQ = useQuery({
    queryKey: ["role", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId!);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (checking || roleQ.isLoading) return <div className="container py-16">Cargando...</div>;

  const isAdmin = (roleQ.data ?? []).some((r) => r.role === "admin");

  if (!isAdmin) return <BootstrapAdmin userId={userId!} onDone={() => roleQ.refetch()} />;

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-black"><Shield className="h-7 w-7 text-primary" />Panel admin</h1>
          <p className="text-sm text-muted-foreground">Gestiona equipos, partidos, jugadores, porteros y temporadas.</p>
        </div>
        <Button variant="outline" onClick={async () => { await supabase.auth.signOut(); nav("/auth"); }}>
          <LogOut className="mr-1 h-4 w-4" /> Salir
        </Button>
      </div>

      <Tabs defaultValue="teams" className="mt-8">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList className="w-max">
            <TabsTrigger value="teams" className="whitespace-nowrap">Equipos</TabsTrigger>
            <TabsTrigger value="matches" className="whitespace-nowrap">Partidos</TabsTrigger>
            <TabsTrigger value="players" className="whitespace-nowrap">Jugadores</TabsTrigger>
            <TabsTrigger value="keepers" className="whitespace-nowrap">Porteros</TabsTrigger>
            <TabsTrigger value="seasons" className="whitespace-nowrap">Temporadas</TabsTrigger>
            <TabsTrigger value="faqs" className="whitespace-nowrap">FAQ</TabsTrigger>
            <TabsTrigger value="messages" className="whitespace-nowrap">Mensajes</TabsTrigger>
            <TabsTrigger value="images" className="whitespace-nowrap">Generar imagen</TabsTrigger>
            
          </TabsList>
        </div>
        <TabsContent value="teams" className="mt-4"><TeamsAdmin /></TabsContent>
        <TabsContent value="matches" className="mt-4"><MatchesAdmin /></TabsContent>
        <TabsContent value="players" className="mt-4"><PlayersAdmin /></TabsContent>
        <TabsContent value="keepers" className="mt-4"><KeepersAdmin /></TabsContent>
        <TabsContent value="seasons" className="mt-4"><SeasonsAdmin /></TabsContent>
        <TabsContent value="faqs" className="mt-4"><FaqsAdmin /></TabsContent>
        <TabsContent value="messages" className="mt-4"><MessagesAdmin /></TabsContent>
        <TabsContent value="images" className="mt-4"><ImageGenerator /></TabsContent>
        
      </Tabs>
    </div>
  );
}

function BootstrapAdmin({ userId, onDone }: { userId: string; onDone: () => void }) {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [hasAny, setHasAny] = useState<boolean | null>(null);
  useEffect(() => {
    supabase.from("user_roles").select("id", { count: "exact", head: true }).then(({ count }) => setHasAny((count ?? 0) > 0));
  }, []);

  async function makeMeAdmin() {
    setLoading(true);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Eres admin"); onDone(); }
  }

  return (
    <div className="container max-w-lg py-16">
      <Card className="p-6">
        <h1 className="text-2xl font-black">Acceso restringido</h1>
        {hasAny === false ? (
          <>
            <p className="mt-2 text-sm text-muted-foreground">No hay administradores aún. Convertirte en el primer admin del torneo.</p>
            <Button className="mt-4" onClick={makeMeAdmin} disabled={loading}>Hacerme admin</Button>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Tu cuenta no tiene permisos de admin. Pide a un administrador existente que te dé acceso.</p>
        )}
        <Button
          variant="outline"
          className="mt-6 w-full"
          onClick={async () => { await supabase.auth.signOut(); nav("/auth"); }}
        >
          <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
        </Button>
      </Card>
    </div>
  );
}

/* ================== TEAMS ================== */
function TeamsAdmin() {
  const teamsQ = useTeams();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [logo, setLogo] = useState("");

  function slugify(s: string) {
    return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  async function add() {
    if (!name.trim()) return;
    const { error } = await supabase.from("teams").insert({ name: name.trim(), slug: slugify(name), logo_url: logo.trim() || null });
    if (error) return toast.error(error.message);
    setName(""); setLogo("");
    toast.success("Equipo añadido");
    qc.invalidateQueries({ queryKey: ["teams"] });
  }
  async function updateLogo(id: string, value: string) {
    const { error } = await supabase.from("teams").update({ logo_url: value || null }).eq("id", id);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["teams"] });
  }
  async function updateApiId(id: string, value: string) {
    const parsed = value.trim() === "" ? null : Number(value.trim());
    if (parsed !== null && (!Number.isInteger(parsed) || parsed <= 0)) return toast.error("ID de API no válido");
    const { error } = await supabase.from("teams").update({ api_football_team_id: parsed }).eq("id", id);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["teams"] });
  }
  async function syncLive() {
    const { data, error } = await supabase.functions.invoke("sync-live-fixture", { body: {} });
    if (error) return toast.error(error.message);
    const res = data as { ok?: boolean; reason?: string; error?: string; fixture?: unknown };
    if (res?.reason === "missing_api_key") return toast.error("Falta configurar la clave de la API de fútbol");
    if (res?.reason === "no_api_id") return toast.error("El campeón actual no tiene ID de API asignado");
    if (res?.reason === "no_fixture") return toast.info("La API no devuelve próximo partido del campeón");
    if (res?.error) return toast.error(res.error);
    toast.success("Partido sincronizado");
    qc.invalidateQueries({ queryKey: ["live-fixture"] });
  }
  async function remove(id: string) {
    if (!confirm("¿Eliminar equipo?")) return;
    const { error } = await supabase.from("teams").delete().eq("id", id);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["teams"] });
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Añadir equipo</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
          <Input placeholder="Nombre (ej. Liverpool)" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="URL del escudo (opcional)" value={logo} onChange={(e) => setLogo(e.target.value)} />
          <Button onClick={add}>Añadir</Button>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Partido en directo</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Rellena el "ID API" del campeón actual y de sus rivales (identificador del club en api-football) para que el widget de la
              portada encuentre el próximo partido y lo siga en directo.
            </p>
          </div>
          <Button variant="outline" onClick={syncLive}>Sincronizar ahora</Button>
        </div>
      </Card>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs uppercase text-muted-foreground"><tr><th className="px-3 py-2 text-left">Equipo</th><th className="px-3 py-2 text-left">URL del escudo</th><th className="px-3 py-2 text-left">ID API</th><th /></tr></thead>
            <tbody>
              {(teamsQ.data ?? []).map((t) => (
                <tr key={t.id} className="border-t border-border">
                  <td className="px-3 py-2 font-medium">{t.name}</td>
                  <td className="px-3 py-2"><Input defaultValue={t.logo_url ?? ""} onBlur={(e) => updateLogo(t.id, e.target.value)} /></td>
                  <td className="px-3 py-2"><ApiTeamIdCell team={t} onSave={(v) => updateApiId(t.id, v)} /></td>
                  <td className="px-3 py-2 text-right"><Button variant="ghost" size="icon" onClick={() => remove(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ================== API-FOOTBALL TEAM ID ================== */
type ApiTeamResult = { id: number; name: string; country: string | null; logo: string | null };

function ApiTeamIdCell({ team, onSave }: { team: Team; onSave: (value: string) => void | Promise<void> }) {
  const apiId = (team as { api_football_team_id?: number | null }).api_football_team_id ?? "";
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ApiTeamResult[]>([]);

  async function search() {
    setLoading(true);
    setResults([]);
    try {
      const { data, error } = await supabase.functions.invoke(
        `sync-live-fixture?search=${encodeURIComponent(team.name)}`,
        { body: {} },
      );
      if (error) throw error;
      const res = data as { ok?: boolean; teams?: ApiTeamResult[]; reason?: string; error?: string };
      if (res?.reason === "missing_api_key") throw new Error("Falta la clave de la API de fútbol");
      if (res?.error) throw new Error(res.error);
      setResults(res?.teams ?? []);
      if ((res?.teams ?? []).length === 0) toast.info("Sin resultados en la API");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al buscar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Input className="w-20" inputMode="numeric" defaultValue={apiId} onBlur={(e) => onSave(e.target.value)} />
      <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) search(); }}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" title="Buscar ID en la API">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronsUpDown className="h-4 w-4" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-2" align="end">
          {loading ? (
            <p className="p-2 text-xs text-muted-foreground">Buscando...</p>
          ) : results.length === 0 ? (
            <p className="p-2 text-xs text-muted-foreground">Sin resultados.</p>
          ) : (
            <ul className="space-y-1">
              {results.map((r) => (
                <li key={r.id}>
                  <button
                    className="flex w-full items-center gap-2 rounded-md p-2 text-left text-xs hover:bg-muted"
                    onClick={async () => { await onSave(String(r.id)); setOpen(false); toast.success(`ID ${r.id} guardado`); }}
                  >
                    {r.logo && <img src={r.logo} alt="" className="h-5 w-5 object-contain" />}
                    <span className="min-w-0 flex-1 truncate">{r.name}</span>
                    <span className="text-muted-foreground">{r.country}</span>
                    <span className="font-mono">{r.id}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}



/* ================== TEAM COMBOBOX ================== */
function TeamCombobox({ teams, value, onChange, placeholder }: { teams: Team[]; value: string; onChange: (v: string) => void; placeholder: string }) {
  const [open, setOpen] = useState(false);
  const selected = teams.find((t) => t.id === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
          <span className={cn("truncate", !selected && "text-muted-foreground")}>{selected?.name ?? placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar equipo..." />
          <CommandList>
            <CommandEmpty>No se encontraron equipos.</CommandEmpty>
            <CommandGroup>
              {teams.map((t) => (
                <CommandItem
                  key={t.id}
                  value={t.name}
                  onSelect={() => { onChange(t.id); setOpen(false); }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === t.id ? "opacity-100" : "opacity-0")} />
                  {t.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/* ================== MATCHES (simplified) ================== */
function MatchesAdmin() {
  const teamsQ = useTeams();
  const matchesQ = useMatches();
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [home, setHome] = useState("");
  const [away, setAway] = useState("");
  const [score, setScore] = useState("");
  const [pens, setPens] = useState(false);
  const [homePens, setHomePens] = useState("");
  const [awayPens, setAwayPens] = useState("");


  const teams = useMemo(() => teamsQ.data ?? [], [teamsQ.data]);
  const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const sortedTeams = useMemo(() => [...teams].sort((a, b) => a.name.localeCompare(b.name)), [teams]);

  // Compute current champion at given date from existing matches
  function championAt(dateIso: string): string | null {
    const sorted = [...(matchesQ.data ?? [])]
      .filter((m) => m.match_date < dateIso)
      .sort((a, b) => a.match_date.localeCompare(b.match_date) || a.id.localeCompare(b.id));
    let champion: string | null = null;
    for (const m of sorted) {
      if (champion === null) { champion = m.winner_team_id; continue; }
      if (m.winner_team_id === champion || m.loser_team_id === champion) {
        if (m.winner_team_id !== champion && !m.was_draw) champion = m.winner_team_id;
      }
    }
    return champion;
  }

  /** Resuelve ganador/perdedor/goles/penaltis desde el marcador (local-visitante). */
  function resolveResult(
    homeId: string, awayId: string, scoreStr: string,
    penaltis: boolean, hpStr: string, apStr: string,
  ) {
    const m = scoreStr.trim().match(/^(\d+)\s*[-–:]\s*(\d+)$/);
    if (!m) { toast.error("Resultado inválido. Usa formato 2-1 (local-visitante)"); return null; }
    const hg = Number(m[1]);
    const ag = Number(m[2]);

    if (penaltis) {
      if (hg !== ag) { toast.error("Si se decide en penaltis, el resultado debe ser empate"); return null; }
      const hp = Number(hpStr);
      const ap = Number(apStr);
      if (!Number.isFinite(hp) || !Number.isFinite(ap) || hpStr === "" || apStr === "") {
        toast.error("Introduce los penaltis de ambos equipos"); return null;
      }
      if (hp === ap) { toast.error("La tanda de penaltis no puede acabar empatada"); return null; }
      const homeWins = hp > ap;
      return {
        winner: homeWins ? homeId : awayId,
        loser: homeWins ? awayId : homeId,
        wg: hg, lg: ag,
        draw: false,
        winner_pens: Math.max(hp, ap),
        loser_pens: Math.min(hp, ap),
      };
    }

    const draw = hg === ag;
    return {
      winner: draw ? homeId : (hg > ag ? homeId : awayId),
      loser: draw ? awayId : (hg > ag ? awayId : homeId),
      wg: draw ? hg : Math.max(hg, ag),
      lg: draw ? ag : Math.min(hg, ag),
      draw,
      winner_pens: null as number | null,
      loser_pens: null as number | null,
    };
  }

  async function add() {
    if (!home || !away || home === away) return toast.error("Selecciona dos equipos distintos");
    const r = resolveResult(home, away, score, pens, homePens, awayPens);
    if (!r) return;

    // Auto-deduce title_changed
    const currentChamp = championAt(date);
    const champInvolved = currentChamp !== null && (currentChamp === r.winner || currentChamp === r.loser);
    const computedTitleChanged = champInvolved && currentChamp !== r.winner && !r.draw;

    const { error } = await supabase.from("matches").insert({
      match_date: date,
      winner_team_id: r.winner,
      loser_team_id: r.loser,
      winner_goals: r.wg,
      loser_goals: r.lg,
      was_draw: r.draw,
      title_changed: computedTitleChanged,
      notes: null,
      home_team_id: home,
      winner_pens: r.winner_pens,
      loser_pens: r.loser_pens,
    });
    if (error) return toast.error(error.message);
    toast.success("Partido añadido");
    setScore("");
    setPens(false);
    setHomePens("");
    setAwayPens("");
    qc.invalidateQueries({ queryKey: ["matches"] });
  }


  async function remove(id: string) {
    if (!confirm("¿Eliminar partido?")) return;
    const { error } = await supabase.from("matches").delete().eq("id", id);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["matches"] });
  }

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editHome, setEditHome] = useState("");
  const [editAway, setEditAway] = useState("");
  const [editScore, setEditScore] = useState("");
  const [editPens, setEditPens] = useState(false);
  const [editHomePens, setEditHomePens] = useState("");
  const [editAwayPens, setEditAwayPens] = useState("");

  function openEdit(m: Match) {
    setEditId(m.id);
    setEditDate(m.match_date);
    const homeId = m.home_team_id ?? m.winner_team_id;
    const awayId = homeId === m.winner_team_id ? m.loser_team_id : m.winner_team_id;
    const homeGoals = homeId === m.winner_team_id ? m.winner_goals : m.loser_goals;
    const awayGoals = homeId === m.winner_team_id ? m.loser_goals : m.winner_goals;
    setEditHome(homeId);
    setEditAway(awayId);
    setEditScore(`${homeGoals}-${awayGoals}`);
    const hasPens = isPenaltyMatch(m);
    setEditPens(hasPens);
    if (hasPens) {
      const homeIsWinner = homeId === m.winner_team_id;
      setEditHomePens(String(homeIsWinner ? m.winner_pens : m.loser_pens));
      setEditAwayPens(String(homeIsWinner ? m.loser_pens : m.winner_pens));
    } else {
      setEditHomePens("");
      setEditAwayPens("");
    }
  }

  async function saveEdit() {
    if (!editId) return;
    if (!editHome || !editAway || editHome === editAway) return toast.error("Selecciona dos equipos distintos");
    const r = resolveResult(editHome, editAway, editScore, editPens, editHomePens, editAwayPens);
    if (!r) return;

    const currentChamp = championAt(editDate);
    const champInvolved = currentChamp !== null && (currentChamp === r.winner || currentChamp === r.loser);
    const computedTitleChanged = champInvolved && currentChamp !== r.winner && !r.draw;

    const { error } = await supabase.from("matches").update({
      match_date: editDate,
      winner_team_id: r.winner,
      loser_team_id: r.loser,
      winner_goals: r.wg,
      loser_goals: r.lg,
      was_draw: r.draw,
      title_changed: computedTitleChanged,
      home_team_id: editHome,
      winner_pens: r.winner_pens,
      loser_pens: r.loser_pens,
    }).eq("id", editId);
    if (error) return toast.error(error.message);
    toast.success("Partido actualizado");
    setEditId(null);
    qc.invalidateQueries({ queryKey: ["matches"] });
  }


  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Añadir partido</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Fecha</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label>Resultado (local - visitante)</Label>
            <Input placeholder="Ej: 2-4" value={score} onChange={(e) => setScore(e.target.value)} />
          </div>
          <div>
            <Label>Equipo local</Label>
            <TeamCombobox teams={sortedTeams} value={home} onChange={setHome} placeholder="Buscar equipo..." />
          </div>
          <div>
            <Label>Equipo visitante</Label>
            <TeamCombobox teams={sortedTeams} value={away} onChange={setAway} placeholder="Buscar equipo..." />
          </div>
          <div className="sm:col-span-2 rounded-md border border-border p-3">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Checkbox checked={pens} onCheckedChange={(v) => setPens(v === true)} />
              Se decidió en los penaltis
            </label>
            {pens && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Penaltis local</Label>
                  <Input type="number" min={0} placeholder="Ej: 5" value={homePens} onChange={(e) => setHomePens(e.target.value)} />
                </div>
                <div>
                  <Label>Penaltis visitante</Label>
                  <Input type="number" min={0} placeholder="Ej: 4" value={awayPens} onChange={(e) => setAwayPens(e.target.value)} />
                </div>
              </div>
            )}
          </div>
          <div className="sm:col-span-2"><Button onClick={add}>Añadir partido</Button></div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">El ganador y el empate se deducen automáticamente del marcador. Si hay penaltis, el resultado debe ser empate y gana quien marque más penaltis (2 puntos). El cambio de campeón se calcula automáticamente.</p>

      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
              <tr><th className="px-3 py-2 text-left">Fecha</th><th className="px-3 py-2 text-left">Local</th><th className="px-3 py-2 text-center">Resultado</th><th className="px-3 py-2 text-left">Visitante</th><th /></tr>
            </thead>
            <tbody>
              {[...(matchesQ.data ?? [])].reverse().slice(0, 50).map((m) => {
                const localId = m.home_team_id ?? m.winner_team_id;
                const visitorId = localId === m.winner_team_id ? m.loser_team_id : m.winner_team_id;
                const localGoals = sideScore(m, localId);
                const visitorGoals = sideScore(m, visitorId);


                return (
                  <tr key={m.id} className="border-t border-border">
                    <td className="px-3 py-2 text-muted-foreground">{m.match_date}</td>
                    <td className="px-3 py-2 font-medium">{teamById.get(localId)?.name ?? "?"}</td>
                    <td className="px-3 py-2 text-center font-mono">{localGoals} – {visitorGoals}</td>
                    <td className="px-3 py-2">{teamById.get(visitorId)?.name ?? "?"}</td>
                    <td className="px-3 py-2 text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(m)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="px-3 py-2 text-xs text-muted-foreground">Mostrando los últimos 50 partidos.</p>
      </Card>

      <Dialog open={!!editId} onOpenChange={(o) => !o && setEditId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar partido</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Fecha</Label>
              <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
            </div>
            <div>
              <Label>Resultado (local - visitante)</Label>
              <Input placeholder="Ej: 2-4" value={editScore} onChange={(e) => setEditScore(e.target.value)} />
            </div>
            <div>
              <Label>Equipo local</Label>
              <TeamCombobox teams={sortedTeams} value={editHome} onChange={setEditHome} placeholder="Buscar equipo..." />
            </div>
            <div>
              <Label>Equipo visitante</Label>
              <TeamCombobox teams={sortedTeams} value={editAway} onChange={setEditAway} placeholder="Buscar equipo..." />
            </div>
            <div className="sm:col-span-2 rounded-md border border-border p-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Checkbox checked={editPens} onCheckedChange={(v) => setEditPens(v === true)} />
                Se decidió en los penaltis
              </label>
              {editPens && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Penaltis local</Label>
                    <Input type="number" min={0} value={editHomePens} onChange={(e) => setEditHomePens(e.target.value)} />
                  </div>
                  <div>
                    <Label>Penaltis visitante</Label>
                    <Input type="number" min={0} value={editAwayPens} onChange={(e) => setEditAwayPens(e.target.value)} />
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditId(null)}>Cancelar</Button>
            <Button onClick={saveEdit}>Guardar cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ================== PLAYERS (incremental) ================== */
function PlayersAdmin() {
  const seasonsQ = useSeasons();
  const qc = useQueryClient();
  const [season, setSeason] = useState("");
  useEffect(() => { if (!season && seasonsQ.data?.length) setSeason(seasonsQ.data.find((s) => s.is_active)?.id ?? seasonsQ.data[0].id); }, [seasonsQ.data, season]);

  const playersQ = useQuery({
    queryKey: ["admin-players", season],
    enabled: !!season,
    queryFn: async () => {
      const { data, error } = await supabase.from("player_stats").select("*").eq("season_id", season).order("goals", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const [scorer, setScorer] = useState("");
  const [assister, setAssister] = useState("");

  async function bumpAlltimePlayer(name: string, field: "goals" | "assists") {
    const { data: existing } = await supabase
      .from("player_stats_alltime")
      .select("*")
      .ilike("player_name", name);
    if (existing && existing.length > 0) {
      const row = existing[0];
      const newVal = ((field === "goals" ? row.goals : row.assists) ?? 0) + 1;
      const patch = field === "goals" ? { goals: newVal } : { assists: newVal };
      await supabase.from("player_stats_alltime").update(patch).eq("id", row.id);
    } else {
      await supabase.from("player_stats_alltime").insert({
        player_name: name,
        goals: field === "goals" ? 1 : 0,
        assists: field === "assists" ? 1 : 0,
      });
    }
  }

  async function bumpField(name: string, field: "goals" | "assists") {
    const trimmed = name.trim();
    if (!trimmed) return;
    const { data: existing } = await supabase
      .from("player_stats")
      .select("*")
      .eq("season_id", season)
      .ilike("player_name", trimmed);
    if (existing && existing.length > 0) {
      const row = existing[0];
      const newVal = ((field === "goals" ? row.goals : row.assists) ?? 0) + 1;
      const patch = field === "goals" ? { goals: newVal } : { assists: newVal };
      const { error } = await supabase.from("player_stats").update(patch).eq("id", row.id);
      if (error) throw error;
    } else {
      const insert = {
        season_id: season,
        player_name: trimmed,
        goals: field === "goals" ? 1 : 0,
        assists: field === "assists" ? 1 : 0,
      };
      const { error } = await supabase.from("player_stats").insert(insert);
      if (error) throw error;
    }
    await bumpAlltimePlayer(trimmed, field);
  }

  async function registerGoal() {
    if (!scorer.trim()) return toast.error("Indica el goleador");
    try {
      await bumpField(scorer, "goals");
      if (assister.trim()) await bumpField(assister, "assists");
      toast.success("Gol registrado");
      setScorer(""); setAssister("");
      qc.invalidateQueries({ queryKey: ["admin-players", season] });
      qc.invalidateQueries({ queryKey: ["players", season] });
      qc.invalidateQueries({ queryKey: ["players", "__historic__"] });
    } catch (e: unknown) {
      toast.error((e as Error).message);
    }
  }

  async function remove(id: string) {
    const { error } = await supabase.from("player_stats").delete().eq("id", id);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["admin-players", season] });
  }

  return (
    <div className="space-y-4">
      <div className="max-w-xs"><Label>Temporada</Label><Select value={season} onValueChange={setSeason}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(seasonsQ.data ?? []).map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent></Select></div>
      <Card className="p-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Registrar gol</h3>
        <p className="mt-1 text-xs text-muted-foreground">Si el jugador ya existe se le suma uno; si no, se crea automáticamente.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <Input placeholder="Goleador" value={scorer} onChange={(e) => setScorer(e.target.value)} />
          <Input placeholder="Asistente (opcional)" value={assister} onChange={(e) => setAssister(e.target.value)} />
          <Button onClick={registerGoal}>Registrar</Button>
        </div>
      </Card>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs uppercase text-muted-foreground"><tr><th className="px-3 py-2 text-left">Jugador</th><th className="px-3 py-2 text-center">Goles</th><th className="px-3 py-2 text-center">Asistencias</th><th /></tr></thead>
            <tbody>
              {(playersQ.data ?? []).map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-3 py-2 font-medium">{p.player_name}</td>
                  <td className="px-3 py-2 text-center tabular-nums">{p.goals}</td>
                  <td className="px-3 py-2 text-center tabular-nums">{p.assists}</td>
                  <td className="px-3 py-2 text-right"><Button variant="ghost" size="icon" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ================== KEEPERS (incremental) ================== */
function KeepersAdmin() {
  const seasonsQ = useSeasons();
  const qc = useQueryClient();
  const [season, setSeason] = useState("");
  useEffect(() => { if (!season && seasonsQ.data?.length) setSeason(seasonsQ.data.find((s) => s.is_active)?.id ?? seasonsQ.data[0].id); }, [seasonsQ.data, season]);

  const q = useQuery({
    queryKey: ["admin-keepers", season],
    enabled: !!season,
    queryFn: async () => {
      const { data, error } = await supabase.from("goalkeeper_stats").select("*").eq("season_id", season).order("clean_sheets", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const [name, setName] = useState("");

  async function registerCleanSheet() {
    const trimmed = name.trim();
    if (!trimmed) return toast.error("Indica el portero");
    const { data: existing } = await supabase
      .from("goalkeeper_stats")
      .select("*")
      .eq("season_id", season)
      .ilike("goalkeeper_name", trimmed);
    if (existing && existing.length > 0) {
      const row = existing[0];
      const { error } = await supabase.from("goalkeeper_stats").update({ clean_sheets: (row.clean_sheets ?? 0) + 1 }).eq("id", row.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("goalkeeper_stats").insert({ season_id: season, goalkeeper_name: trimmed, clean_sheets: 1 });
      if (error) return toast.error(error.message);
    }
    // Bump all-time goalkeeper stats
    const { data: at } = await supabase
      .from("goalkeeper_stats_alltime")
      .select("*")
      .ilike("goalkeeper_name", trimmed);
    if (at && at.length > 0) {
      await supabase.from("goalkeeper_stats_alltime").update({ clean_sheets: (at[0].clean_sheets ?? 0) + 1 }).eq("id", at[0].id);
    } else {
      await supabase.from("goalkeeper_stats_alltime").insert({ goalkeeper_name: trimmed, clean_sheets: 1 });
    }
    toast.success("Portería a 0 registrada");
    setName("");
    qc.invalidateQueries({ queryKey: ["admin-keepers", season] });
    qc.invalidateQueries({ queryKey: ["keepers", season] });
    qc.invalidateQueries({ queryKey: ["keepers", "__historic__"] });
  }

  async function remove(id: string) {
    const { error } = await supabase.from("goalkeeper_stats").delete().eq("id", id);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["admin-keepers", season] });
  }

  return (
    <div className="space-y-4">
      <div className="max-w-xs"><Label>Temporada</Label><Select value={season} onValueChange={setSeason}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(seasonsQ.data ?? []).map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent></Select></div>
      <Card className="p-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Registrar portería a 0</h3>
        <p className="mt-1 text-xs text-muted-foreground">Si el portero ya existe se le suma uno; si no, se crea automáticamente.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
          <Input placeholder="Nombre del portero" value={name} onChange={(e) => setName(e.target.value)} />
          <Button onClick={registerCleanSheet}>Registrar</Button>
        </div>
      </Card>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs uppercase text-muted-foreground"><tr><th className="px-3 py-2 text-left">Portero</th><th className="px-3 py-2 text-center">Porterías a 0</th><th /></tr></thead>
            <tbody>
              {(q.data ?? []).map((k) => (
                <tr key={k.id} className="border-t border-border">
                  <td className="px-3 py-2 font-medium">{k.goalkeeper_name}</td>
                  <td className="px-3 py-2 text-center tabular-nums">{k.clean_sheets}</td>
                  <td className="px-3 py-2 text-right"><Button variant="ghost" size="icon" onClick={() => remove(k.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ================== SEASONS ================== */
function SeasonsAdmin() {
  const seasonsQ = useSeasons();
  const qc = useQueryClient();
  const [label, setLabel] = useState("");

  async function create() {
    if (!label.trim()) return;
    const { error } = await supabase.from("seasons").insert({ label: label.trim(), is_active: false, started_at: new Date().toISOString().slice(0, 10) });
    if (error) return toast.error(error.message);
    setLabel("");
    qc.invalidateQueries({ queryKey: ["seasons"] });
  }

  async function setActive(id: string) {
    const all = seasonsQ.data ?? [];
    for (const s of all) {
      const target = s.id === id;
      if (s.is_active !== target) {
        await supabase.from("seasons").update({ is_active: target }).eq("id", s.id);
      }
    }
    qc.invalidateQueries({ queryKey: ["seasons"] });
    toast.success("Temporada activa actualizada");
  }

  async function closeSeason(id: string, lbl: string) {
    if (!confirm(`Cerrar temporada ${lbl}? Se archivarán todas las estadísticas individuales y se borrarán de la temporada activa.`)) return;
    const [players, keepers] = await Promise.all([
      supabase.from("player_stats").select("*").eq("season_id", id),
      supabase.from("goalkeeper_stats").select("*").eq("season_id", id),
    ]);
    if (players.data?.length) {
      await supabase.from("player_stats_history").insert(players.data.map((p) => ({ season_label: lbl, player_name: p.player_name, team_id: p.team_id, goals: p.goals, assists: p.assists })));
    }
    if (keepers.data?.length) {
      await supabase.from("goalkeeper_stats_history").insert(keepers.data.map((g) => ({ season_label: lbl, goalkeeper_name: g.goalkeeper_name, team_id: g.team_id, clean_sheets: g.clean_sheets })));
    }
    await supabase.from("player_stats").delete().eq("season_id", id);
    await supabase.from("goalkeeper_stats").delete().eq("season_id", id);
    await supabase.from("seasons").update({ is_active: false, ended_at: new Date().toISOString().slice(0, 10) }).eq("id", id);
    qc.invalidateQueries();
    toast.success("Temporada cerrada y archivada");
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 border-primary/20 border-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-primary">¿Para qué sirven las temporadas?</h3>
        <p className="mt-2 text-sm text-foreground/80">
          Las temporadas agrupan las estadísticas individuales (goleadores, asistentes y porteros) por año futbolístico.
          La <strong>clasificación histórica</strong> y los partidos NO dependen de temporadas — son acumulados desde el primer ToNOI hasta hoy.
          Las temporadas solo afectan a la pestaña <strong>Estadísticas</strong>. Cuando cierras una temporada, sus datos se archivan
          y puedes empezar la siguiente desde cero. Si prefieres no usar temporadas, deja una activa de forma permanente.
        </p>
      </Card>
      <Card className="p-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Crear temporada</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
          <Input placeholder="Etiqueta (ej. 2026/2027)" value={label} onChange={(e) => setLabel(e.target.value)} />
          <Button onClick={create}>Crear</Button>
        </div>
      </Card>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs uppercase text-muted-foreground"><tr><th className="px-3 py-2 text-left">Temporada</th><th className="px-3 py-2 text-center">Activa</th><th className="px-3 py-2 text-right">Acciones</th></tr></thead>
            <tbody>
              {(seasonsQ.data ?? []).map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="px-3 py-2 font-medium">{s.label}</td>
                  <td className="px-3 py-2 text-center">
                    <Switch checked={s.is_active} onCheckedChange={() => setActive(s.id)} />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button variant="outline" size="sm" onClick={() => closeSeason(s.id, s.label)}>
                      <Archive className="mr-1 h-4 w-4" /> Cerrar y archivar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ================== MESSAGES ================== */
function MessagesAdmin() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["contact_messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const [replyId, setReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  const replyMessage = q.data?.find((m) => m.id === replyId);

  async function remove(id: string) {
    if (!confirm("¿Eliminar mensaje?")) return;
    const { error } = await supabase.from("contact_messages").delete().eq("id", id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["contact_messages"] });
  }

  async function sendReply() {
    if (!replyMessage || !replyText.trim()) return;
    setReplying(true);
    const { error: fnError } = await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "contact-reply",
        recipientEmail: replyMessage.email,
        idempotencyKey: `contact-reply-${replyMessage.id}-${Date.now()}`,
        templateData: {
          name: replyMessage.name,
          reply: replyText.trim(),
          originalMessage: replyMessage.message,
        },
      },
    });

    if (fnError) {
      setReplying(false);
      return toast.error(fnError.message || "No se ha podido enviar la respuesta");
    }

    const { error: updateError } = await supabase
      .from("contact_messages")
      .update({ response: replyText.trim(), responded_at: new Date().toISOString() })
      .eq("id", replyMessage.id);

    setReplying(false);
    setReplyId(null);
    setReplyText("");

    if (updateError) toast.error(updateError.message);
    else {
      toast.success("Respuesta enviada y guardada");
      qc.invalidateQueries({ queryKey: ["contact_messages"] });
    }
  }

  const messages = q.data ?? [];

  return (
    <div className="space-y-4">
      <Card className="p-4 border-primary/20 border-2">
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
          <Mail className="h-4 w-4" /> Mensajes de contacto
        </h3>
        <p className="mt-2 text-sm text-foreground/80">
          Mensajes enviados desde el formulario de la página de Contacto. Pulsa "Responder" para enviar una respuesta directamente al email del usuario.
        </p>
      </Card>

      <Dialog open={!!replyId} onOpenChange={(open) => { if (!open) { setReplyId(null); setReplyText(""); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><MessageSquareReply className="h-5 w-5" /> Responder a {replyMessage?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-medium text-foreground/90">Mensaje original:</p>
              <p className="mt-1 whitespace-pre-wrap text-foreground/80">{replyMessage?.message}</p>
            </div>
            <div>
              <Label>Tu respuesta</Label>
              <Textarea
                rows={6}
                placeholder="Escribe aquí la respuesta que recibirá el usuario..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setReplyId(null); setReplyText(""); }}>Cancelar</Button>
            <Button onClick={sendReply} disabled={replying || !replyText.trim()}>
              {replying ? "Enviando..." : <><Send className="mr-2 h-4 w-4" /> Enviar respuesta</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {messages.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">No hay mensajes todavía.</Card>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <Card key={m.id} className={cn("p-4", m.responded_at && "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20")}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="font-bold">{m.name}</span>
                    <a href={`mailto:${m.email}`} className="text-sm text-primary hover:underline">{m.email}</a>
                    <span className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString("es-ES")}</span>
                    {m.responded_at && <span className="text-xs font-medium text-green-700">Respondido</span>}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">{m.message}</p>
                  {m.response && (
                    <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950/20">
                      <p className="text-xs font-bold uppercase text-green-800 dark:text-green-200">Respuesta enviada:</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">{m.response}</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setReplyId(m.id)} title="Responder">
                    <MessageSquareReply className="h-4 w-4 text-primary" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(m.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


/* ================== FAQs ================== */
const FAQ_LANGS = [
  { code: "en", label: "inglés" },
  { code: "it", label: "italiano" },
  { code: "ca", label: "catalán" },
  { code: "eu", label: "euskera" },
  { code: "pt", label: "portugués" },
  { code: "gl", label: "gallego" },
] as const;

function FaqsAdmin() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["faqs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faqs")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [manualTr, setManualTr] = useState<Record<string, string>>({});
  const [order, setOrder] = useState<number>(0);
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [translating, setTranslating] = useState<string | null>(null);
  const [openLangs, setOpenLangs] = useState<Record<string, boolean>>({});
  const toggleLangs = (key: string) => setOpenLangs((m) => ({ ...m, [key]: !m[key] }));

  const langsToggle = (key: string) => (
    <button
      type="button"
      onClick={() => toggleLangs(key)}
      className="flex w-full items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2 text-sm font-medium hover:bg-muted"
    >
      <span className="flex items-center gap-2">
        <Languages className="h-4 w-4 text-primary" />
        Traducciones ({FAQ_LANGS.length} idiomas)
      </span>
      <ChevronDown className={`h-4 w-4 transition-transform ${openLangs[key] ? "rotate-180" : ""}`} />
    </button>
  );

  async function fetchTranslations(q: string, a: string) {
    const { data, error } = await supabase.functions.invoke("translate-faq", {
      body: { question: q, answer: a },
    });
    if (error) throw new Error(error.message);
    if ((data as { error?: string })?.error) throw new Error((data as { error?: string }).error);
    return data as Record<string, string>;
  }

  async function add() {
    if (!question.trim() || !answer.trim()) return toast.error("Rellena la pregunta y la respuesta");
    const manual = (key: string) => (manualTr[key] ?? "").trim();
    let tr: Record<string, string | null> = {};
    for (const l of FAQ_LANGS) {
      tr[`question_${l.code}`] = manual(`question_${l.code}`) || null;
      tr[`answer_${l.code}`] = manual(`answer_${l.code}`) || null;
    }
    if (autoTranslate) {
      setTranslating("new");
      try {
        const t = await fetchTranslations(question.trim(), answer.trim());
        tr = {};
        for (const l of FAQ_LANGS) {
          tr[`question_${l.code}`] = manual(`question_${l.code}`) || t[`question_${l.code}`] || null;
          tr[`answer_${l.code}`] = manual(`answer_${l.code}`) || t[`answer_${l.code}`] || null;
        }
      } catch (e) {
        toast.error(`No se pudo traducir automáticamente: ${e instanceof Error ? e.message : "error"}`);
      } finally {
        setTranslating(null);
      }
    }
    const { error } = await supabase.from("faqs").insert({
      question: question.trim(),
      answer: answer.trim(),
      ...tr,
      display_order: Number.isFinite(order) ? order : 0,
    } as never);
    if (error) return toast.error(error.message);
    setQuestion(""); setAnswer(""); setOrder(0);
    setManualTr({});
    toast.success("Pregunta añadida");
    qc.invalidateQueries({ queryKey: ["faqs"] });
  }

  async function retranslate(id: string, q: string, a: string) {
    if (!q.trim() || !a.trim()) return toast.error("Rellena la pregunta y la respuesta en español");
    setTranslating(id);
    try {
      const t = await fetchTranslations(q.trim(), a.trim());
      await updateField(id, t);
      toast.success("Traducciones generadas");
    } catch (e) {
      toast.error(`No se pudo traducir: ${e instanceof Error ? e.message : "error"}`);
    } finally {
      setTranslating(null);
    }
  }


  async function updateField(id: string, patch: Record<string, unknown>) {
    const { error } = await supabase.from("faqs").update({ ...patch, updated_at: new Date().toISOString() } as never).eq("id", id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["faqs"] });
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar pregunta?")) return;
    const { error } = await supabase.from("faqs").delete().eq("id", id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["faqs"] });
  }

  type FaqRow = {
    id: string;
    question: string;
    answer: string;
    display_order: number;
    [key: string]: unknown;
  };
  const faqs = (q.data ?? []) as FaqRow[];

  return (
    <div className="space-y-4">
      <Card className="p-4 border-primary/20 border-2">
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
          <HelpCircle className="h-4 w-4" /> Preguntas frecuentes
        </h3>
        <p className="mt-2 text-sm text-foreground/80">
          Estas preguntas se mostrarán en la página pública de Preguntas Frecuentes. Usa el orden para ordenarlas (menor primero).
          Las traducciones a los demás idiomas son opcionales: si las dejas vacías, se mostrará el texto en español.
        </p>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Añadir pregunta</h3>
        <div className="mt-3 grid gap-3">
          <div>
            <Label>Pregunta (español)</Label>
            <Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="¿Cómo funciona el ToNOI?" />
          </div>
          <div>
            <Label>Respuesta (español)</Label>
            <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={4} placeholder="Explicación detallada..." />
          </div>
          {langsToggle("new")}
          <div className={`grid gap-3 sm:grid-cols-2 ${openLangs["new"] ? "" : "hidden"}`}>
            {FAQ_LANGS.map((l) => (
              <div key={l.code} className="grid gap-3">
                <div>
                  <Label>Pregunta ({l.label})</Label>
                  <Input
                    value={manualTr[`question_${l.code}`] ?? ""}
                    onChange={(e) => setManualTr((m) => ({ ...m, [`question_${l.code}`]: e.target.value }))}
                    placeholder="Opcional"
                  />
                </div>
                <div>
                  <Label>Respuesta ({l.label})</Label>
                  <Textarea
                    value={manualTr[`answer_${l.code}`] ?? ""}
                    onChange={(e) => setManualTr((m) => ({ ...m, [`answer_${l.code}`]: e.target.value }))}
                    rows={3}
                    placeholder="Opcional"
                  />
                </div>
              </div>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={autoTranslate} onCheckedChange={(v) => setAutoTranslate(Boolean(v))} />
            Traducir automáticamente a inglés, italiano, catalán, euskera, portugués y gallego al guardar (los campos que rellenes a mano se respetan)
          </label>
          <div className="grid gap-2 sm:grid-cols-[120px_auto]">
            <div>
              <Label>Orden</Label>
              <Input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} />
            </div>
            <div className="flex items-end">
              <Button onClick={add} disabled={translating === "new"}>
                {translating === "new" ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Traduciendo…</>) : "Añadir"}
              </Button>
            </div>
          </div>

        </div>
      </Card>

      {faqs.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">No hay preguntas todavía.</Card>
      ) : (
        <div className="space-y-3">
          {faqs.map((f) => (
            <Card key={f.id} className="p-4">
              <div className="grid gap-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <Label>Pregunta (español)</Label>
                    <Input defaultValue={f.question} onBlur={(e) => e.target.value !== f.question && updateField(f.id, { question: e.target.value })} />
                  </div>
                  <div className="w-24">
                    <Label>Orden</Label>
                    <Input
                      type="number"
                      defaultValue={f.display_order}
                      onBlur={(e) => Number(e.target.value) !== f.display_order && updateField(f.id, { display_order: Number(e.target.value) })}
                    />
                  </div>
                  <Button variant="ghost" size="icon" className="mt-6" onClick={() => remove(f.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div>
                  <Label>Respuesta (español)</Label>
                  <Textarea
                    defaultValue={f.answer}
                    rows={3}
                    onBlur={(e) => e.target.value !== f.answer && updateField(f.id, { answer: e.target.value })}
                  />
                </div>
                {langsToggle(f.id)}
                <div className={`grid gap-3 sm:grid-cols-2 ${openLangs[f.id] ? "" : "hidden"}`}>
                  {FAQ_LANGS.map((l) => {
                    const qKey = `question_${l.code}`;
                    const aKey = `answer_${l.code}`;
                    const qVal = typeof f[qKey] === "string" ? (f[qKey] as string) : "";
                    const aVal = typeof f[aKey] === "string" ? (f[aKey] as string) : "";
                    return (
                      <div key={l.code} className="grid gap-3">
                        <div>
                          <Label>Pregunta ({l.label})</Label>
                          <Input
                            defaultValue={qVal}
                            onBlur={(e) => e.target.value !== qVal && updateField(f.id, { [qKey]: e.target.value.trim() || null })}
                          />
                        </div>
                        <div>
                          <Label>Respuesta ({l.label})</Label>
                          <Textarea
                            defaultValue={aVal}
                            rows={3}
                            onBlur={(e) => e.target.value !== aVal && updateField(f.id, { [aKey]: e.target.value.trim() || null })}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={translating === f.id}
                    onClick={() => retranslate(f.id, f.question, f.answer)}
                  >
                    {translating === f.id ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Traduciendo…</>
                    ) : (
                      <><Languages className="mr-2 h-4 w-4" /> Regenerar traducciones</>
                    )}
                  </Button>
                </div>

              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


