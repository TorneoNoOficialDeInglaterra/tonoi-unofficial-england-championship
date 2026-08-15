import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import { localeTag } from "@/i18n";
import { Crown, Calendar, ArrowRight, Trophy, Play, ListOrdered, History } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamBadge } from "@/components/TeamBadge";
import NextMatchWidget from "@/components/NextMatchWidget";

import { useMatches, useTeams } from "@/hooks/useTonoiData";
import { computeStandings, daysBetween, buildLocalByMatchMap, sideScore, isPenaltyMatch } from "@/lib/tonoi";

import logoImg from "@/assets/logo.png";
import hero1 from "@/assets/hero/hero1.jpg";
import hero2 from "@/assets/hero/hero2.jpg";
import hero3 from "@/assets/hero/hero3.jpg";
import hero4 from "@/assets/hero/hero4.jpg";
import hero5 from "@/assets/hero/hero5.jpg";

const HERO_IMAGES = [hero1, hero5, hero2, hero4, hero3];

export default function Home() {
  const { t } = useTranslation("home");
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
  const lastLocalGoals = last && lastLocalId ? sideScore(last, lastLocalId) : "";
  const lastVisitorGoals = last && lastVisitorId ? sideScore(last, lastVisitorId) : "";


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
                <Trophy className="h-4 w-4" /> {t("hero.tagline")}
              </div>
              <h1 className="mt-3 max-w-3xl text-5xl font-black leading-none sm:text-7xl">
                {t("hero.titleLine1")}<br />{t("hero.titleLine2")}
              </h1>
              <p className="mt-5 max-w-xl text-base opacity-90 sm:text-lg">
                {t("hero.subtitle")}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" variant="secondary">
                  <Link to="/clasificacion">{t("hero.viewStandings")} <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/40 bg-white/0 text-white hover:bg-white/10 hover:text-white">
                  <Link to="/historial">{t("hero.matchHistory")}</Link>
                </Button>
              </div>
            </div>

            {/* Big logo */}
            <div className="hidden justify-center lg:flex">
              <div className="rounded-full bg-white p-6 ring-1 ring-white/40 shadow-[0_10px_40px_rgba(0,0,0,0.4)]">
                <img src={logoImg} alt={t("hero.logoAlt")} className="h-64 w-64 object-contain" />
              </div>
            </div>
          </div>

          {/* Carousel dots */}
          <div className="mt-10 flex gap-1.5">
            {HERO_IMAGES.map((_, i) => (
              <button
                key={i}
                aria-label={t("hero.imageAlt", { n: i + 1 })}
                onClick={() => setHeroIdx(i)}
                className={`h-1.5 rounded-full transition-all ${i === heroIdx ? "w-8 bg-white" : "w-3 bg-white/40 hover:bg-white/60"}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Champion + last match */}
      <section className="container mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="overflow-hidden border-2 border-primary/20 p-6 shadow-[var(--shadow-elegant)]">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
            <Crown className="h-4 w-4" /> {t("champion.current")}
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
                  {championSince ? t("champion.daysAsChampion", { count: daysBetween(championSince) }) : t("champion.noData")}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">{t("champion.noMatches")}</p>
          )}
        </Card>

        <Card className="p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <Calendar className="h-4 w-4" /> {t("lastMatch.title")}
          </div>
          {teamsQ.isLoading || matchesQ.isLoading ? (
            <Skeleton className="mt-4 h-20 w-full" />
          ) : last && lastLocal && lastVisitor ? (
            <div className="mt-4">
              <p className="text-xs text-muted-foreground">{new Date(last.match_date).toLocaleDateString(localeTag(), { day: "numeric", month: "long", year: "numeric" })}</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="flex flex-1 items-center gap-2">
                  <TeamBadge team={lastLocal} size={36} />
                  <span className="font-semibold">{lastLocal.name}</span>
                </div>
                <div className="shrink-0 whitespace-nowrap rounded-md bg-primary px-2 py-1 font-mono text-sm font-bold text-primary-foreground sm:px-3 sm:py-1.5 sm:text-lg">
                  {lastLocalGoals} – {lastVisitorGoals}
                </div>
                <div className="flex flex-1 items-center justify-end gap-2 text-right">
                  <span className="font-semibold">{lastVisitor.name}</span>
                  <TeamBadge team={lastVisitor} size={36} />
                </div>
              </div>
              {isPenaltyMatch(last) ? (
                <p className="mt-2 text-xs text-muted-foreground">{t("lastMatch.penalties")}</p>
              ) : last.was_draw ? (
                <p className="mt-2 text-xs text-muted-foreground">{t("lastMatch.draw")}</p>
              ) : null}

              {last.title_changed && <p className="mt-1 text-xs font-semibold text-primary">{t("lastMatch.titleChanged")}</p>}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">{t("lastMatch.noMatches")}</p>
          )}
        </Card>

        <NextMatchWidget />
      </section>


      {/* What is ToNOI + side widgets (2-column on desktop) */}
      <section className="container mt-16">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          {/* Left column: text + reglamento */}
          <div>
            <h2 className="text-4xl font-black sm:text-5xl">{t("about.heading")}</h2>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-foreground/90">
              <p>
                {t("about.paragraph1")}
              </p>
              <p>
                <Trans i18nKey="about.paragraph2" ns="home" components={{ strong: <strong /> }} />
              </p>
              <p>
                {t("about.paragraph3")}
              </p>
            </div>

            <Card className="mt-10 border-2 border-primary/20 p-6">
              <h3 className="flex items-center gap-2 text-2xl font-black">
                <Trophy className="h-5 w-5 text-primary" /> {t("rules.title")}
              </h3>
              <ul className="mt-4 space-y-3 text-sm">
                {(t("rules.items", { returnObjects: true }) as string[]).map((r, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="mt-0.5 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <p className="mt-8 text-lg font-semibold italic text-primary">
              {t("about.closing")}
            </p>
          </div>

          {/* Right column: widgets */}
          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            {/* Top 10 */}
            <Card className="p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
                  <ListOrdered className="h-4 w-4" /> {t("top10.title")}
                </h3>
                <Link to="/clasificacion" className="text-xs font-semibold text-primary hover:underline">{t("top10.viewAll")}</Link>
              </div>
              {teamsQ.isLoading || matchesQ.isLoading ? (
                <div className="mt-3 space-y-2">{Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-7 w-full" />)}</div>
              ) : top10.length === 0 ? (
                <p className="mt-3 text-xs text-muted-foreground">{t("top10.noData")}</p>
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
                  <History className="h-4 w-4" /> {t("last5.title")}
                </h3>
                <Link to="/historial" className="text-xs font-semibold text-primary hover:underline">{t("last5.viewAll")}</Link>
              </div>
              {teamsQ.isLoading || matchesQ.isLoading ? (
                <div className="mt-3 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : last5.length === 0 ? (
                <p className="mt-3 text-xs text-muted-foreground">{t("last5.noMatches")}</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {last5.map((m) => {
                    const localId = m.home_team_id ?? localByMatch.get(m.id) ?? m.winner_team_id;
                    const visitorId = localId === m.winner_team_id ? m.loser_team_id : m.winner_team_id;
                    const localGoals = sideScore(m, localId);
                    const visitorGoals = sideScore(m, visitorId);

                    const local = teamById.get(localId);
                    const visitor = teamById.get(visitorId);
                    return (
                      <li key={m.id} className="rounded-md border border-border p-2 text-xs">
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {new Date(m.match_date).toLocaleDateString(localeTag(), { day: "2-digit", month: "short", year: "numeric" })}
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <TeamBadge team={local} size={18} />
                          <span className="min-w-0 flex-1 truncate font-medium">{local?.name ?? "—"}</span>
                          <span className="font-mono font-bold tabular-nums">{localGoals}–{visitorGoals}</span>
                          <span className="min-w-0 flex-1 truncate text-right font-medium">{visitor?.name ?? "—"}</span>
                          <TeamBadge team={visitor} size={18} />
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
            <Play className="h-4 w-4" /> {t("video.label")}
          </div>
          <h3 className="mt-2 text-2xl font-black">{t("video.heading")}</h3>
          <div className="mt-4 aspect-video w-full overflow-hidden rounded-xl border border-border shadow-[var(--shadow-card)]">
            <iframe
              className="h-full w-full"
              src="https://www.youtube.com/embed/SpRxKO4BRfk"
              title={t("video.iframeTitle")}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </section>
    </div>
  );
}
