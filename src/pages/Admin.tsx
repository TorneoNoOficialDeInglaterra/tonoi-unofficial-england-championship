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
import { Trash2, LogOut, Shield, Archive, Check, ChevronsUpDown } from "lucide-react";
import { useTeams, useSeasons, useMatches } from "@/hooks/useTonoiData";
import { cn } from "@/lib/utils";
import type { Team } from "@/lib/tonoi";

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
          </TabsList>
        </div>
        <TabsContent value="teams" className="mt-4"><TeamsAdmin /></TabsContent>
        <TabsContent value="matches" className="mt-4"><MatchesAdmin /></TabsContent>
        <TabsContent value="players" className="mt-4"><PlayersAdmin /></TabsContent>
        <TabsContent value="keepers" className="mt-4"><KeepersAdmin /></TabsContent>
        <TabsContent value="seasons" className="mt-4"><SeasonsAdmin /></TabsContent>
      </Tabs>
    </div>
  );
}

function BootstrapAdmin({ userId, onDone }: { userId: string; onDone: () => void }) {
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
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs uppercase text-muted-foreground"><tr><th className="px-3 py-2 text-left">Equipo</th><th className="px-3 py-2 text-left">URL del escudo</th><th /></tr></thead>
            <tbody>
              {(teamsQ.data ?? []).map((t) => (
                <tr key={t.id} className="border-t border-border">
                  <td className="px-3 py-2 font-medium">{t.name}</td>
                  <td className="px-3 py-2"><Input defaultValue={t.logo_url ?? ""} onBlur={(e) => updateLogo(t.id, e.target.value)} /></td>
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
  const [winner, setWinner] = useState("");
  const [loser, setLoser] = useState("");
  const [score, setScore] = useState("");
  const [draw, setDraw] = useState(false);

  const teams = teamsQ.data ?? [];
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

  async function add() {
    if (!winner || !loser || winner === loser) return toast.error("Selecciona dos equipos distintos");
    const m = score.trim().match(/^(\d+)\s*[-–:]\s*(\d+)$/);
    if (!m) return toast.error("Resultado inválido. Usa formato 2-1");
    const wg = Number(m[1]);
    const lg = Number(m[2]);
    if (!draw && wg === lg) return toast.error("Si es empate marca el switch. Si no, los goles del ganador deben ser mayores.");
    if (!draw && wg < lg) return toast.error("Los goles del ganador deben ser mayores que los del perdedor");
    if (draw && wg !== lg) return toast.error("En empates ambos goles deben ser iguales");

    // Auto-deduce title_changed
    const currentChamp = championAt(date);
    const titleChanged = currentChamp !== null && currentChamp !== winner && !draw && (currentChamp === loser || currentChamp === winner ? currentChamp !== winner : false);
    // Simpler: title changes if there was a champion, the champion is involved, and the new winner != champion (and not a draw)
    const champInvolved = currentChamp !== null && (currentChamp === winner || currentChamp === loser);
    const computedTitleChanged = champInvolved && currentChamp !== winner && !draw;

    const { error } = await supabase.from("matches").insert({
      match_date: date,
      winner_team_id: winner,
      loser_team_id: loser,
      winner_goals: wg,
      loser_goals: lg,
      was_draw: draw,
      title_changed: computedTitleChanged || titleChanged,
      notes: null,
    });
    if (error) return toast.error(error.message);
    toast.success("Partido añadido");
    setScore(""); setDraw(false);
    qc.invalidateQueries({ queryKey: ["matches"] });
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar partido?")) return;
    const { error } = await supabase.from("matches").delete().eq("id", id);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["matches"] });
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
            <Label>Resultado</Label>
            <Input placeholder="Ej: 2-1" value={score} onChange={(e) => setScore(e.target.value)} />
          </div>
          <div>
            <Label>Equipo ganador</Label>
            <TeamCombobox teams={sortedTeams} value={winner} onChange={setWinner} placeholder="Buscar equipo..." />
          </div>
          <div>
            <Label>Equipo perdedor</Label>
            <TeamCombobox teams={sortedTeams} value={loser} onChange={setLoser} placeholder="Buscar equipo..." />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={draw} onCheckedChange={setDraw} />
            <Label>Empate</Label>
          </div>
          <div className="sm:col-span-2"><Button onClick={add}>Añadir partido</Button></div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">El cambio de campeón se calcula automáticamente. En empates, el campeón mantiene el título.</p>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
              <tr><th className="px-3 py-2 text-left">Fecha</th><th className="px-3 py-2 text-left">Ganador</th><th className="px-3 py-2 text-center">Resultado</th><th className="px-3 py-2 text-left">Perdedor</th><th /></tr>
            </thead>
            <tbody>
              {[...(matchesQ.data ?? [])].reverse().slice(0, 50).map((m) => (
                <tr key={m.id} className="border-t border-border">
                  <td className="px-3 py-2 text-muted-foreground">{m.match_date}</td>
                  <td className="px-3 py-2 font-medium">{teamById.get(m.winner_team_id)?.name ?? "?"}</td>
                  <td className="px-3 py-2 text-center font-mono">{m.winner_goals} – {m.loser_goals}</td>
                  <td className="px-3 py-2">{teamById.get(m.loser_team_id)?.name ?? "?"}</td>
                  <td className="px-3 py-2 text-right"><Button variant="ghost" size="icon" onClick={() => remove(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="px-3 py-2 text-xs text-muted-foreground">Mostrando los últimos 50 partidos.</p>
      </Card>
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

  async function bumpField(name: string, field: "goals" | "assists") {
    const trimmed = name.trim();
    if (!trimmed) return;
    // Find existing (case-insensitive)
    const { data: existing } = await supabase
      .from("player_stats")
      .select("*")
      .eq("season_id", season)
      .ilike("player_name", trimmed);
    if (existing && existing.length > 0) {
      const row = existing[0];
      const newVal = (row[field] ?? 0) + 1;
      const { error } = await supabase.from("player_stats").update({ [field]: newVal }).eq("id", row.id);
      if (error) throw error;
    } else {
      const insert: Record<string, unknown> = { season_id: season, player_name: trimmed, goals: 0, assists: 0 };
      insert[field] = 1;
      const { error } = await supabase.from("player_stats").insert(insert);
      if (error) throw error;
    }
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
    toast.success("Portería a 0 registrada");
    setName("");
    qc.invalidateQueries({ queryKey: ["admin-keepers", season] });
    qc.invalidateQueries({ queryKey: ["keepers", season] });
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
