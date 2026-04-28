import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Crown, Calendar, ArrowRight, Trophy, Play } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamBadge } from "@/components/TeamBadge";
import { useMatches, useTeams } from "@/hooks/useTonoiData";
import { computeStandings, daysBetween } from "@/lib/tonoi";

export default function Home() {
  const teamsQ = useTeams();
  const matchesQ = useMatches();

  const data = useMemo(() => {
    if (!teamsQ.data || !matchesQ.data) return null;
    return computeStandings(teamsQ.data, matchesQ.data);
  }, [teamsQ.data, matchesQ.data]);

  const teamById = useMemo(() => new Map((teamsQ.data ?? []).map((t) => [t.id, t])), [teamsQ.data]);

  const champion = data?.champion ? teamById.get(data.champion) : null;
  const championSince = data?.championSinceDate ?? null;
  const last = data?.lastMatch ?? null;
  const lastWinner = last ? teamById.get(last.winner_team_id) : null;
  const lastLoser = last ? teamById.get(last.loser_team_id) : null;

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[image:var(--gradient-hero)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.25),transparent_60%)]" />
        <div className="container relative py-16 text-primary-foreground sm:py-20">
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
            <p className="mt-4 text-sm text-muted-foreground">Aún no hay partidos registrados. Añade el primero desde el panel admin.</p>
          )}
        </Card>

        <Card className="p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <Calendar className="h-4 w-4" /> Último partido
          </div>
          {teamsQ.isLoading || matchesQ.isLoading ? (
            <Skeleton className="mt-4 h-20 w-full" />
          ) : last && lastWinner && lastLoser ? (
            <div className="mt-4">
              <p className="text-xs text-muted-foreground">{new Date(last.match_date).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="flex flex-1 items-center gap-2">
                  <TeamBadge team={lastWinner} size={36} />
                  <span className="font-semibold">{lastWinner.name}</span>
                </div>
                <div className="rounded-md bg-primary px-3 py-1.5 font-mono text-lg font-bold text-primary-foreground">
                  {last.winner_goals} – {last.loser_goals}
                </div>
                <div className="flex flex-1 items-center justify-end gap-2 text-right">
                  <span className="font-semibold">{lastLoser.name}</span>
                  <TeamBadge team={lastLoser} size={36} />
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

      {/* What is ToNOI */}
      <section className="container mt-20">
        <div className="mx-auto max-w-3xl">
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

          <p className="mt-8 text-center text-lg font-semibold italic text-primary">
            Sumérgete con nosotros en esta aventura y disfruta del fútbol como nunca.
          </p>
        </div>
      </section>

      {/* YouTube video */}
      <section className="container mt-16">
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
