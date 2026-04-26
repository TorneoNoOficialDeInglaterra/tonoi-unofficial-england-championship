import { useEffect, useState } from "react";
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
import { toast } from "sonner";
import { Trash2, LogOut, Shield, Archive } from "lucide-react";
import { useTeams, useSeasons, useMatches } from "@/hooks/useTonoiData";

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
        <TabsList>
          <TabsTrigger value="teams">Equipos</TabsTrigger>
          <TabsTrigger value="matches">Partidos</TabsTrigger>
          <TabsTrigger value="players">Jugadores</TabsTrigger>
          <TabsTrigger value="keepers">Porteros</TabsTrigger>
          <TabsTrigger value="seasons">Temporadas</TabsTrigger>
        </TabsList>
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
      </Card>
    </div>
  );
}

function MatchesAdmin() {
  const teamsQ = useTeams();
  const matchesQ = useMatches();
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [winner, setWinner] = useState("");
  const [loser, setLoser] = useState("");
  const [wg, setWg] = useState("1");
  const [lg, setLg] = useState("0");
  const [draw, setDraw] = useState(false);
  const [titleChanged, setTitleChanged] = useState(false);
  const [notes, setNotes] = useState("");

  async function add() {
    if (!winner || !loser || winner === loser) return toast.error("Selecciona dos equipos distintos");
    const { error } = await supabase.from("matches").insert({
      match_date: date,
      winner_team_id: winner,
      loser_team_id: loser,
      winner_goals: Number(wg),
      loser_goals: Number(lg),
      was_draw: draw,
      title_changed: titleChanged,
      notes: notes || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Partido añadido");
    setNotes(""); setTitleChanged(false);
    qc.invalidateQueries({ queryKey: ["matches"] });
  }
  async function remove(id: string) {
    if (!confirm("¿Eliminar partido?")) return;
    const { error } = await supabase.from("matches").delete().eq("id", id);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["matches"] });
  }

  const teams = teamsQ.data ?? [];
  const teamById = new Map(teams.map((t) => [t.id, t]));

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Añadir partido</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div><Label>Fecha</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div>
            <Label>Ganador</Label>
            <Select value={winner} onValueChange={setWinner}><SelectTrigger><SelectValue placeholder="Equipo..." /></SelectTrigger><SelectContent>{teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select>
          </div>
          <div>
            <Label>Perdedor</Label>
            <Select value={loser} onValueChange={setLoser}><SelectTrigger><SelectValue placeholder="Equipo..." /></SelectTrigger><SelectContent>{teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Goles G.</Label><Input type="number" min={0} value={wg} onChange={(e) => setWg(e.target.value)} /></div>
            <div><Label>Goles P.</Label><Input type="number" min={0} value={lg} onChange={(e) => setLg(e.target.value)} /></div>
          </div>
          <div className="flex items-center gap-2"><Switch checked={draw} onCheckedChange={setDraw} /><Label>Empate (decidido por penaltis)</Label></div>
          <div className="flex items-center gap-2"><Switch checked={titleChanged} onCheckedChange={setTitleChanged} /><Label>¿Cambio de campeón?</Label></div>
          <div className="sm:col-span-2 lg:col-span-2"><Label>Notas (opcional)</Label><Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Competición, ronda, etc." /></div>
          <div className="sm:col-span-2 lg:col-span-4"><Button onClick={add}>Añadir partido</Button></div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Para empates en los 90' resueltos por penaltis: marca "Empate" y pon como ganador quien ganó la tanda. Los goles deben coincidir (será el global).</p>
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr><th className="px-3 py-2 text-left">Fecha</th><th className="px-3 py-2 text-left">Ganador</th><th className="px-3 py-2 text-center">Resultado</th><th className="px-3 py-2 text-left">Perdedor</th><th /></tr>
          </thead>
          <tbody>
            {[...(matchesQ.data ?? [])].reverse().slice(0, 50).map((m) => (
              <tr key={m.id} className="border-t border-border">
                <td className="px-3 py-2 text-muted-foreground">{m.match_date}</td>
                <td className="px-3 py-2 font-medium">{teamById.get(m.winner_team_id)?.name ?? "?"}</td>
                <td className="px-3 py-2 text-center font-mono">{m.winner_goals} – {m.loser_goals}{m.was_draw ? " (p)" : ""}</td>
                <td className="px-3 py-2">{teamById.get(m.loser_team_id)?.name ?? "?"}</td>
                <td className="px-3 py-2 text-right"><Button variant="ghost" size="icon" onClick={() => remove(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="px-3 py-2 text-xs text-muted-foreground">Mostrando los últimos 50 partidos.</p>
      </Card>
    </div>
  );
}

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

  const [name, setName] = useState("");
  const [goals, setGoals] = useState("0");
  const [assists, setAssists] = useState("0");
  async function add() {
    if (!name.trim()) return;
    const { error } = await supabase.from("player_stats").insert({ season_id: season, player_name: name.trim(), goals: Number(goals), assists: Number(assists) });
    if (error) return toast.error(error.message);
    setName(""); setGoals("0"); setAssists("0");
    qc.invalidateQueries({ queryKey: ["admin-players", season] });
  }
  async function update(id: string, patch: Partial<{ goals: number; assists: number }>) {
    const { error } = await supabase.from("player_stats").update(patch).eq("id", id);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["admin-players", season] });
  }
  async function remove(id: string) {
    const { error } = await supabase.from("player_stats").delete().eq("id", id);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["admin-players", season] });
  }

  return (
    <div className="space-y-4">
      <div className="max-w-xs"><Label>Temporada</Label><Select value={season} onValueChange={setSeason}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(seasonsQ.data ?? []).map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent></Select></div>
      <Card className="p-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Añadir jugador</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-[2fr_1fr_1fr_auto]">
          <Input placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
          <Input type="number" min={0} placeholder="Goles" value={goals} onChange={(e) => setGoals(e.target.value)} />
          <Input type="number" min={0} placeholder="Asistencias" value={assists} onChange={(e) => setAssists(e.target.value)} />
          <Button onClick={add}>Añadir</Button>
        </div>
      </Card>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground"><tr><th className="px-3 py-2 text-left">Jugador</th><th className="px-3 py-2 text-center">Goles</th><th className="px-3 py-2 text-center">Asistencias</th><th /></tr></thead>
          <tbody>
            {(playersQ.data ?? []).map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-3 py-2 font-medium">{p.player_name}</td>
                <td className="px-3 py-2 text-center"><Input className="mx-auto w-20 text-center" type="number" defaultValue={p.goals} onBlur={(e) => update(p.id, { goals: Number(e.target.value) })} /></td>
                <td className="px-3 py-2 text-center"><Input className="mx-auto w-20 text-center" type="number" defaultValue={p.assists} onBlur={(e) => update(p.id, { assists: Number(e.target.value) })} /></td>
                <td className="px-3 py-2 text-right"><Button variant="ghost" size="icon" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

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
  const [cs, setCs] = useState("0");

  async function add() {
    if (!name.trim()) return;
    const { error } = await supabase.from("goalkeeper_stats").insert({ season_id: season, goalkeeper_name: name.trim(), clean_sheets: Number(cs) });
    if (error) return toast.error(error.message);
    setName(""); setCs("0");
    qc.invalidateQueries({ queryKey: ["admin-keepers", season] });
  }
  async function update(id: string, value: number) {
    const { error } = await supabase.from("goalkeeper_stats").update({ clean_sheets: value }).eq("id", id);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["admin-keepers", season] });
  }
  async function remove(id: string) {
    const { error } = await supabase.from("goalkeeper_stats").delete().eq("id", id);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["admin-keepers", season] });
  }

  return (
    <div className="space-y-4">
      <div className="max-w-xs"><Label>Temporada</Label><Select value={season} onValueChange={setSeason}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(seasonsQ.data ?? []).map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent></Select></div>
      <Card className="p-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Añadir portero</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-[2fr_1fr_auto]">
          <Input placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
          <Input type="number" min={0} placeholder="Porterías a 0" value={cs} onChange={(e) => setCs(e.target.value)} />
          <Button onClick={add}>Añadir</Button>
        </div>
      </Card>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground"><tr><th className="px-3 py-2 text-left">Portero</th><th className="px-3 py-2 text-center">Porterías a 0</th><th /></tr></thead>
          <tbody>
            {(q.data ?? []).map((k) => (
              <tr key={k.id} className="border-t border-border">
                <td className="px-3 py-2 font-medium">{k.goalkeeper_name}</td>
                <td className="px-3 py-2 text-center"><Input className="mx-auto w-20 text-center" type="number" defaultValue={k.clean_sheets} onBlur={(e) => update(k.id, Number(e.target.value))} /></td>
                <td className="px-3 py-2 text-right"><Button variant="ghost" size="icon" onClick={() => remove(k.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

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
    // Deactivate others
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
      <Card className="p-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Crear temporada</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
          <Input placeholder="Etiqueta (ej. 2026/2027)" value={label} onChange={(e) => setLabel(e.target.value)} />
          <Button onClick={create}>Crear</Button>
        </div>
      </Card>
      <Card className="overflow-hidden">
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
      </Card>
    </div>
  );
}
