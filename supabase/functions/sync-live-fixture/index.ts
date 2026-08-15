import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const API_BASE = "https://v3.football.api-sports.io";
const LIVE_STATUSES = ["1H", "HT", "2H", "ET", "BT", "P", "SUSP", "INT", "LIVE"];

type Json = Record<string, unknown>;

function json(body: Json, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}

async function apiGet(path: string, key: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "x-apisports-key": key },
  });
  if (!res.ok) throw new Error(`API football ${res.status}`);
  const data = await res.json();
  if (Array.isArray(data?.errors) === false && data?.errors && Object.keys(data.errors).length > 0) {
    throw new Error(`API football: ${JSON.stringify(data.errors)}`);
  }
  return data;
}

function mapEvents(fx: any) {
  const evs = Array.isArray(fx?.events) ? fx.events : [];
  return evs
    .filter((e: any) => ["Goal", "Card", "subst"].includes(e?.type))
    .map((e: any) => ({
      minute: e?.time?.elapsed ?? null,
      extra: e?.time?.extra ?? null,
      type: e?.type ?? null,
      detail: e?.detail ?? null,
      team_api_id: e?.team?.id ?? null,
      team_name: e?.team?.name ?? null,
      player: e?.player?.name ?? null,
      assist: e?.assist?.name ?? null,
    }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const apiKey = Deno.env.get("API_FOOTBALL_KEY");
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  if (!apiKey) return json({ ok: false, reason: "missing_api_key" }, 200);

  const url = new URL(req.url);
  const search = url.searchParams.get("search");
  if (search) {
    if (search.trim().length < 3) return json({ ok: false, error: "search too short" }, 400);
    try {
      const res = await apiGet(`/teams?search=${encodeURIComponent(search.trim().slice(0, 60))}`, apiKey);
      const teams = (res?.response ?? []).slice(0, 10).map((r: any) => ({
        id: r?.team?.id,
        name: r?.team?.name,
        country: r?.team?.country,
        logo: r?.team?.logo,
      }));
      return json({ ok: true, teams });
    } catch (e) {
      return json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 200);
    }
  }


  try {
    // 1. Current ToNOI champion = winner of the last title change
    const { data: lastChange, error: lcErr } = await supabase
      .from("matches")
      .select("winner_team_id, match_date, created_at")
      .eq("title_changed", true)
      .order("match_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lcErr) throw lcErr;
    if (!lastChange) return json({ ok: false, reason: "no_champion" });

    const { data: champion, error: chErr } = await supabase
      .from("teams")
      .select("id, name, api_football_team_id")
      .eq("id", lastChange.winner_team_id)
      .maybeSingle();
    if (chErr) throw chErr;
    if (!champion?.api_football_team_id) {
      return json({ ok: false, reason: "no_api_id", champion: champion?.name ?? null });
    }
    const apiTeamId = champion.api_football_team_id as number;

    // 2. Throttle using the stored row
    const { data: current } = await supabase
      .from("live_fixtures")
      .select("*")
      .eq("is_current", true)
      .order("kickoff_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const force = new URL(req.url).searchParams.get("force") === "1";
    if (current && !force) {
      const ageMs = Date.now() - new Date(current.updated_at).getTime();
      const live = LIVE_STATUSES.includes(current.status_short);
      const minAge = live ? 45_000 : 20 * 60_000;
      if (ageMs < minAge) return json({ ok: true, cached: true, fixture: current });
    }

    // 3. Live match first, otherwise next scheduled one
    let fixture: any = null;
    const liveRes = await apiGet(`/fixtures?team=${apiTeamId}&live=all`, apiKey);
    if (liveRes?.response?.length) {
      const detail = await apiGet(`/fixtures?id=${liveRes.response[0].fixture.id}`, apiKey);
      fixture = detail?.response?.[0] ?? liveRes.response[0];
    } else {
      const nextRes = await apiGet(`/fixtures?team=${apiTeamId}&next=1`, apiKey);
      fixture = nextRes?.response?.[0] ?? null;
    }

    if (!fixture) {
      if (current) await supabase.from("live_fixtures").update({ is_current: false }).eq("id", current.id);
      return json({ ok: true, fixture: null, reason: "no_fixture" });
    }

    // 4. Map API teams to ToNOI teams
    const homeApi = fixture.teams?.home?.id ?? null;
    const awayApi = fixture.teams?.away?.id ?? null;
    const { data: mapped } = await supabase
      .from("teams")
      .select("id, api_football_team_id")
      .in("api_football_team_id", [homeApi, awayApi].filter((x) => x !== null));
    const byApi = new Map((mapped ?? []).map((t: any) => [t.api_football_team_id, t.id]));

    const row = {
      fixture_id: fixture.fixture?.id,
      kickoff_at: fixture.fixture?.date,
      league_name: fixture.league?.name ?? null,
      league_logo: fixture.league?.logo ?? null,
      round: fixture.league?.round ?? null,
      home_api_team_id: homeApi,
      away_api_team_id: awayApi,
      home_name: fixture.teams?.home?.name ?? "?",
      away_name: fixture.teams?.away?.name ?? "?",
      home_logo: fixture.teams?.home?.logo ?? null,
      away_logo: fixture.teams?.away?.logo ?? null,
      home_team_id: byApi.get(homeApi) ?? null,
      away_team_id: byApi.get(awayApi) ?? null,
      home_goals: fixture.goals?.home ?? null,
      away_goals: fixture.goals?.away ?? null,
      home_pens: fixture.score?.penalty?.home ?? null,
      away_pens: fixture.score?.penalty?.away ?? null,
      status_short: fixture.fixture?.status?.short ?? "NS",
      status_long: fixture.fixture?.status?.long ?? null,
      elapsed: fixture.fixture?.status?.elapsed ?? null,
      events: mapEvents(fixture),
      champion_team_id: champion.id,
      is_current: true,
      updated_at: new Date().toISOString(),
    };

    const { data: saved, error: upErr } = await supabase
      .from("live_fixtures")
      .upsert(row, { onConflict: "fixture_id" })
      .select("*")
      .maybeSingle();
    if (upErr) throw upErr;

    await supabase
      .from("live_fixtures")
      .update({ is_current: false })
      .eq("is_current", true)
      .neq("fixture_id", row.fixture_id);

    return json({ ok: true, cached: false, fixture: saved });
  } catch (e) {
    console.error("sync-live-fixture error", e);
    return json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 200);
  }
});
