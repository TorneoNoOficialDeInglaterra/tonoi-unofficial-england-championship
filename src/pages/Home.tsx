import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Crown, Calendar, ArrowRight, Trophy, Play, ListOrdered, History } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamBadge } from "@/components/TeamBadge";
import { useMatches, useTeams } from "@/hooks/useTonoiData";
import { computeStandings, daysBetween, buildLocalByMatchMap } from "@/lib/tonoi";

import logoImg from "@/assets/logo.png";
import hero1 from "@/assets/hero/hero1.jpg";
import hero2 from "@/assets/hero/hero2.jpg";
import hero3 from "@/assets/hero/hero3.jpg";
import hero4 from "@/assets/hero/hero4.jpg";
import hero5 from "@/assets/hero/hero5.jpg";

const HERO_IMAGES = [hero1, hero2, hero3, hero4, hero5];

export default function Home() {
  const teamsQ = useTeams();
  const matchesQ = useMatches();

  const data = useMemo(() => {
    if (!teamsQ.data || !matchesQ.data) return null;
    return computeStandings(teamsQ.data, matchesQ.data);
  }, [teamsQ.data, matchesQ.data]);

  const teamById = useMemo(() => new Map((teamsQ.data ?? []).map((t) => [t.id, t])), [teamsQ.data]);

  const localByMatch = useMemo(
    () => buildLocalByMatchMap(matchesQ.data ?? [], teamById),
    [matchesQ.data, teamById],
  );

  const champion = data?.champion ? teamById.get(data.champion) : null;
  const championSince = data?.championSinceDate ?? null;
  const last = data?.lastMatch ?? null;
  const lastLocalId = last ? (last.home_team_id ?? localByMatch.get(last.id) ?? last.winner_team_id) : null;
  const lastVisitorId = last && lastLocalId
    ? (lastLocalId === last.winner_team_id ? last.loser_team_id : last.winner_team_id)
    : null;
  const lastLocal = lastLocalId ? teamById.get(lastLocalId) : null;
  const lastVisitor = lastVisitorId ? teamById.get(lastVisitorId) : null;
  const lastLocalGoals = last && lastLocalId === last.winner_team_id ? last?.winner_goals : last?.loser_goals;
  const lastVisitorGoals = last && lastLocalId === last.winner_team_id ? last?.loser_goals : last?.winner_goals;

  // Top 10 (by points)
  const top10 = useMemo(() => (data?.rows ?? []).slice(0, 10), [data]);

  // Last 5 matches by date desc
  const last5 = useMemo(() => {
    const arr = [...(matchesQ.data ?? [])];
    arr.sort((a, b) => b.match_date.localeCompare(a.match_date));
    return arr.slice(0, 5);
  }, [matchesQ.data]);

  // Hero carousel
  const [heroIdx, setHeroIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setHeroIdx((i) => (i + 1) % HERO_IMAGES.length), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div>
      {/* Hero with photo carousel + big logo */}
      <section className="relative overflow-hidden">
        {/* Carousel layer */}
        <div className="absolute inset-0">
          {HERO_IMAGES.map((src, i) => (
            <img
              key={src}
              src={src}
              alt=""
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1500ms] ${i === heroIdx ? "opacity-100" : "opacity-0"}`}
            />
          ))}
          {/* Dark overlay for legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
        </div>

        <div className="container relative py-16 text-white sm:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] opacity-90">
                <Trophy className="h-4 w-4" /> Torneo No Oficial de Inglaterra
              </div>
              <h1 className="mt-3 max-w-3xl text-5xl font-black leading-none sm:text-7xl">
                Para ser campeón,<br />gana al campeón.
              </h1>
              <p className="mt-5 max-w-xl text-base opacity-90 sm:text-lg">
                Un solo título. Una sola regla. Sigue la historia viva del ToNOI partido a partido.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" variant="secondary">
                  <Link to="/clasificacion">Ver clasificación <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/40 bg-white/0 text-white hover:bg-white/10 hover:text-white">
                  <Link to="/historial">Historial de partidos</Link>
                </Button>
              </div>
            </div>

            {/* Big logo */}
            <div className="hidden justify-center lg:flex">
              <div className="rounded-full bg-white p-6 ring-1 ring-white/40 shadow-[0_10px_40px_rgba(0,0,0,0.4)]">
                <img src={logoImg} alt="Logo ToNOI" className="h-64 w-64 object-contain" />
              </div>
            </div>
          </div>

          {/* Carousel dots */}
          <div className="mt-10 flex gap-1.5">
            {HERO_IMAGES.map((_, i) => (
              <button
                key={i}
                aria-label={`Imagen ${i + 1}`}
                onClick={() => setHeroIdx(i)}
                className={`h-1.5 rounded-full transition-all ${i === heroIdx ? "w-8 bg-white" : "w-3 bg-white/40 hover:bg-white/60"}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Champion + last match */}
      <section className="container mt-10 grid gap-4 sm:grid-cols-2">
        <Card className="overflow-hidden border-2 border-primary/20 p-6 shadow-[var(--shadow-elegant)]">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
            <Crown className="h-4 w-4" /> Campeón actual
          </div>
          {teamsQ.isLoading || matchesQ.isLoading ? (
            <Skeleton className="mt-4 h-20 w-full" />
          ) : champion ? (
            <div className="mt-4 flex items-center gap-4">
              <TeamBadge team={champion} size={64} />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-3xl font-black">{champion.name}</h2>
                  <Crown className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {championSince ? `${daysBetween(championSince)} días como campeón` : "—"}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Aún no hay partidos registrados.</p>
          )}
        </Card>

        <Card className="p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <Calendar className="h-4 w-4" /> Último partido
          </div>
          {teamsQ.isLoading || matchesQ.isLoading ? (
            <Skeleton className="mt-4 h-20 w-full" />
          ) : last && lastLocal && lastVisitor ? (
            <div className="mt-4">
              <p className="text-xs text-muted-foreground">{new Date(last.match_date).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="flex flex-1 items-center gap-2">
                  <TeamBadge team={lastLocal} size={36} />
                  <span className="font-semibold">{lastLocal.name}</span>
                </div>
                <div className="rounded-md bg-primary px-3 py-1.5 font-mono text-lg font-bold text-primary-foreground">
                  {lastLocalGoals} – {lastVisitorGoals}
                </div>
                <div className="flex flex-1 items-center justify-end gap-2 text-right">
                  <span className="font-semibold">{lastVisitor.name}</span>
                  <TeamBadge team={lastVisitor} size={36} />
                </div>
              </div>
              {last.was_draw && <p className="mt-2 text-xs text-muted-foreground">Empate.</p>}
              {last.title_changed && <p className="mt-1 text-xs font-semibold text-primary">¡Cambio de campeón!</p>}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Sin partidos todavía.</p>
          )}
        </Card>
      </section>

      {/* What is ToNOI + side widgets (2-column on desktop) */}
      <section className="container mt-16">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          {/* Left column: text + reglamento */}
          <div>
            <h2 className="text-4xl font-black sm:text-5xl">¿Qué es el ToNOI?</h2>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-foreground/90">
              <p>
                ¿Te imaginas que pasaría si en el fútbol se decidiera quién es el campeón como se hace en el boxeo?
                Pues nosotros estamos aquí para contarlo.
              </p>
              <p>
                El <strong>Torneo No Oficial de Inglaterra (ToNOI)</strong> es un campeonato en el que para ser campeón
                debes ganar al actual campeón. No existen fase de grupos, eliminatorias ni nada por el estilo:{" "}
                <strong>solo finales</strong>. Si te enfrentas al equipo campeón y resultas victorioso, serás el nuevo
                <strong> CAMPEÓN NO OFICIAL DE INGLATERRA</strong> y comenzarás a hacer historia hasta verte derrotado por otro equipo.
              </p>
              <p>
                El título cambia de manos partido a partido, atravesando décadas, generaciones y rivalidades. Aquí no
                importa la liga ni la copa: lo único que cuenta es ese duelo concreto en el que un club desafía al
                campeón del momento.
              </p>
            </div>

            <Card className="mt-10 border-2 border-primary/20 p-6">
              <h3 className="flex items-center gap-2 text-2xl font-black">
                <Trophy className="h-5 w-5 text-primary" /> Reglamento Oficial
              </h3>
              <ul className="mt-4 space-y-3 text-sm">
                {[
                  "Si ganas al actual campeón, te conviertes en campeón.",
                  "Solo valen partidos oficiales.",
                  "Si en una liga no hay registros oficiales se contará el siguiente partido oficial.",
                  "En caso de desaparición del club campeón, el título vuelve al anterior campeón.",
                  "Todas las prórrogas cuentan.",
                  "Los penaltis cuentan: si el partido acaba en empate global o requiere desempate, el ganador se lleva el título.",
                ].map((r, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="mt-0.5 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <p className="mt-8 text-lg font-semibold italic text-primary">
              Sumérgete con nosotros en esta aventura y disfruta del fútbol como nunca.
            </p>
          </div>

          {/* Right column: widgets */}
          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            {/* Top 10 */}
            <Card className="p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
                  <ListOrdered className="h-4 w-4" /> Top 10
                </h3>
                <Link to="/clasificacion" className="text-xs font-semibold text-primary hover:underline">Ver todo →</Link>
              </div>
              {teamsQ.isLoading || matchesQ.isLoading ? (
                <div className="mt-3 space-y-2">{Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-7 w-full" />)}</div>
              ) : top10.length === 0 ? (
                <p className="mt-3 text-xs text-muted-foreground">Sin datos.</p>
              ) : (
                <ol className="mt-3 space-y-1.5 text-sm">
                  {top10.map((row, i) => (
                    <li key={row.team.id} className="flex items-center gap-2">
                      <span className="w-5 flex-none text-right text-xs font-bold text-muted-foreground">{i + 1}</span>
                      <TeamBadge team={row.team} size={20} />
                      <span className="min-w-0 flex-1 truncate font-medium">{row.team.name}</span>
                      <span className="flex-none font-mono text-xs font-bold tabular-nums">{row.p}</span>
                    </li>
                  ))}
                </ol>
              )}
            </Card>

            {/* Últimos 5 */}
            <Card className="p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
                  <History className="h-4 w-4" /> Últimos 5 partidos
                </h3>
                <Link to="/historial" className="text-xs font-semibold text-primary hover:underline">Ver todo →</Link>
              </div>
              {teamsQ.isLoading || matchesQ.isLoading ? (
                <div className="mt-3 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : last5.length === 0 ? (
                <p className="mt-3 text-xs text-muted-foreground">Sin partidos.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {last5.map((m) => {
                    const w = teamById.get(m.winner_team_id);
                    const l = teamById.get(m.loser_team_id);
                    return (
                      <li key={m.id} className="rounded-md border border-border p-2 text-xs">
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {new Date(m.match_date).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <TeamBadge team={w} size={18} />
                          <span className="min-w-0 flex-1 truncate font-medium">{w?.name ?? "—"}</span>
                          <span className="font-mono font-bold tabular-nums">{m.winner_goals}–{m.loser_goals}</span>
                          <span className="min-w-0 flex-1 truncate text-right font-medium">{l?.name ?? "—"}</span>
                          <TeamBadge team={l} size={18} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </aside>
        </div>
      </section>

      {/* YouTube video */}
      <section className="container mt-16 pb-16">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <Play className="h-4 w-4" /> Vídeo de origen
          </div>
          <h3 className="mt-2 text-2xl font-black">Conoce el torneo en vídeo</h3>
          <div className="mt-4 aspect-video w-full overflow-hidden rounded-xl border border-border shadow-[var(--shadow-card)]">
            <iframe
              className="h-full w-full"
              src="https://www.youtube.com/embed/SpRxKO4BRfk"
              title="¿Qué es el ToNOI?"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </section>
    </div>
  );
}
