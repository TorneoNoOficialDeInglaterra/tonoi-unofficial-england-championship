import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { localeTag } from "@/i18n";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Radio, CalendarClock, Crown, Goal, Square, ArrowRightLeft } from "lucide-react";
import { useLiveFixture, isLive, isFinished, type LiveEvent } from "@/hooks/useLiveFixture";

function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

function EventIcon({ type }: { type: string | null }) {
  if (type === "Goal") return <Goal className="h-3.5 w-3.5 text-primary" />;
  if (type === "Card") return <Square className="h-3.5 w-3.5 text-muted-foreground" />;
  return <ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground" />;
}

function estimateLiveMinute(fixture: NonNullable<ReturnType<typeof useLiveFixture>["data"]>, now: number) {
  const stored = typeof fixture.elapsed === "number" && fixture.elapsed > 0 ? fixture.elapsed : null;
  const status = fixture.status_short.toUpperCase();
  if (status === "HT") return 45;

  const kickoffMs = new Date(fixture.kickoff_at).getTime();
  if (!Number.isFinite(kickoffMs)) return stored ?? 0;

  const realMinutes = Math.floor((now - kickoffMs) / 60_000);
  let estimated = 0;
  if (realMinutes > 0) {
    if (status === "1H") estimated = Math.min(realMinutes, 45);
    else if (status === "2H") estimated = Math.min(Math.max(realMinutes - 15, 46), 90);
    else if (status === "ET") estimated = Math.min(Math.max(realMinutes - 20, 91), 120);
    else estimated = Math.min(realMinutes, 120);
  }

  return Math.max(stored ?? 0, estimated || 1);
}

export default function NextMatchWidget() {
  const { t } = useTranslation("home");
  const { data: fixture, isLoading } = useLiveFixture();

  const live = isLive(fixture);
  const finished = isFinished(fixture);
  const now = useNow(!!fixture && !finished);

  const countdown = useMemo(() => {
    if (!fixture || live || finished) return null;
    const diff = new Date(fixture.kickoff_at).getTime() - now;
    if (diff <= 0) return null;
    const d = Math.floor(diff / 86_400_000);
    const h = Math.floor((diff % 86_400_000) / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    const s = Math.floor((diff % 60_000) / 1000);
    return d > 0 ? `${d}d ${h}h ${m}m` : `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [fixture, live, finished, now]);

  const titleNotice = useMemo(() => {
    if (!fixture || !fixture.champion_team_id) return null;
    if (!live && !finished) return null;
    const championIsHome = fixture.home_team_id === fixture.champion_team_id;
    const championIsAway = fixture.away_team_id === fixture.champion_team_id;
    if (!championIsHome && !championIsAway) return null;
    const hg = fixture.home_goals ?? 0;
    const ag = fixture.away_goals ?? 0;
    const hp = fixture.home_pens;
    const ap = fixture.away_pens;
    let championWins: boolean;
    if (hg === ag && hp !== null && ap !== null && hp !== ap) {
      championWins = championIsHome ? hp > ap : ap > hp;
    } else if (hg === ag) {
      championWins = true; // draw: champion retains
    } else {
      championWins = championIsHome ? hg > ag : ag > hg;
    }
    return championWins ? "retains" : "changes";
  }, [fixture, live, finished]);

  const events = (fixture?.events ?? []) as LiveEvent[];
  const liveMinute = live && fixture ? estimateLiveMinute(fixture, now) : 0;

  return (
    <Card className="p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {live ? <Radio className="h-4 w-4 text-primary" /> : <CalendarClock className="h-4 w-4" />}
          {live ? t("next.liveTitle") : finished ? t("next.finishedTitle") : t("next.title")}
        </div>
        {live && (
          <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            {t("next.liveBadge")}
          </span>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="mt-4 h-20 w-full" />
      ) : !fixture ? (
        <p className="mt-4 text-sm text-muted-foreground">{t("next.none")}</p>
      ) : (
        <div className="mt-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {fixture.league_logo && <img src={fixture.league_logo} alt="" className="h-4 w-4 object-contain" loading="lazy" />}
            <span className="truncate">{fixture.league_name ?? ""}</span>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex flex-1 items-center gap-2">
              {fixture.home_logo && <img src={fixture.home_logo} alt="" className="h-8 w-8 object-contain" loading="lazy" />}
              <span className="min-w-0 truncate font-semibold">{fixture.home_name}</span>
            </div>
            <div className="shrink-0 whitespace-nowrap rounded-md bg-primary px-2 py-1 font-mono text-sm font-bold text-primary-foreground sm:px-3 sm:py-1.5 sm:text-lg">
              {live || finished
                ? `${fixture.home_goals ?? 0} – ${fixture.away_goals ?? 0}`
                : new Date(fixture.kickoff_at).toLocaleTimeString(localeTag(), { hour: "2-digit", minute: "2-digit" })}
            </div>
            <div className="flex flex-1 items-center justify-end gap-2 text-right">
              <span className="min-w-0 truncate font-semibold">{fixture.away_name}</span>
              {fixture.away_logo && <img src={fixture.away_logo} alt="" className="h-8 w-8 object-contain" loading="lazy" />}
            </div>
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            {live
              ? fixture.status_short === "HT"
                ? t("next.halfTime")
                : t("next.minute", { n: liveMinute })
              : finished
                ? t("next.fullTime")
                : new Date(fixture.kickoff_at).toLocaleDateString(localeTag(), { weekday: "long", day: "numeric", month: "long" })}
            {countdown ? ` · ${t("next.startsIn", { time: countdown })}` : ""}
          </p>

          {titleNotice && (
            <p className={`mt-2 flex items-center gap-1.5 text-xs font-semibold ${titleNotice === "changes" ? "text-primary" : "text-muted-foreground"}`}>
              <Crown className="h-3.5 w-3.5" />
              {titleNotice === "changes" ? t("next.titleChanges") : t("next.titleRetained")}
            </p>
          )}

          {(live || finished) && events.length > 0 && (
            <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto border-t border-border pt-2 text-xs">
              {events.map((e, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-8 flex-none font-mono text-[10px] text-muted-foreground">
                    {e.minute ?? "-"}
                    {e.extra ? `+${e.extra}` : ""}'
                  </span>
                  <EventIcon type={e.type} />
                  <span className="min-w-0 flex-1 truncate">
                    {e.player ?? "—"}
                    {e.detail ? <span className="text-muted-foreground"> · {e.detail}</span> : null}
                  </span>
                  <span className="flex-none truncate text-[10px] text-muted-foreground">{e.team_name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}
