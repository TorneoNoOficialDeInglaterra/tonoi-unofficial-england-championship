import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type LiveEvent = {
  minute: number | null;
  extra: number | null;
  type: string | null;
  detail: string | null;
  team_api_id: number | null;
  team_name: string | null;
  player: string | null;
  assist: string | null;
};

export type LiveFixture = {
  id: string;
  fixture_id: number;
  kickoff_at: string;
  league_name: string | null;
  league_logo: string | null;
  round: string | null;
  home_api_team_id: number | null;
  away_api_team_id: number | null;
  home_name: string;
  away_name: string;
  home_logo: string | null;
  away_logo: string | null;
  home_team_id: string | null;
  away_team_id: string | null;
  home_goals: number | null;
  away_goals: number | null;
  home_pens: number | null;
  away_pens: number | null;
  status_short: string;
  status_long: string | null;
  elapsed: number | null;
  events: LiveEvent[];
  champion_team_id: string | null;
  updated_at: string;
};

export const LIVE_STATUSES = ["1H", "HT", "2H", "ET", "BT", "P", "SUSP", "INT", "LIVE"];
export const FINISHED_STATUSES = ["FT", "AET", "PEN"];

export function isLive(f?: LiveFixture | null) {
  return !!f && LIVE_STATUSES.includes(f.status_short);
}
export function isFinished(f?: LiveFixture | null) {
  return !!f && FINISHED_STATUSES.includes(f.status_short);
}

async function fetchCurrentFixture(): Promise<LiveFixture | null> {
  const { data, error } = await supabase
    .from("live_fixtures")
    .select("*")
    .eq("is_current", true)
    .order("kickoff_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as LiveFixture) ?? null;
}

export function useLiveFixture() {
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["live-fixture"],
    queryFn: fetchCurrentFixture,
  });

  const live = isLive(q.data);

  // Realtime updates on the stored row
  useEffect(() => {
    const channel = supabase
      .channel("live-fixture")
      .on("postgres_changes", { event: "*", schema: "public", table: "live_fixtures" }, () => {
        qc.invalidateQueries({ queryKey: ["live-fixture"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  // Ask the backend to refresh from the football API (it throttles internally)
  useEffect(() => {
    let cancelled = false;
    const sync = async () => {
      try {
        await supabase.functions.invoke("sync-live-fixture");
        if (!cancelled) qc.invalidateQueries({ queryKey: ["live-fixture"] });
      } catch {
        /* silent: widget falls back to stored data */
      }
    };
    sync();
    const id = setInterval(sync, live ? 60_000 : 15 * 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [live, qc]);

  return q;
}
