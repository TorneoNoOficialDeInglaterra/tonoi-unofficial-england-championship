import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import {
  fdFindTeamId,
  fdNextFixture,
  scrapeNextFixture,
  tsdbEvent,
  tsdbFindTeam,
  tsdbNextFixture,
  type NormalisedFixture,
} from "./sources.ts";

const API_BASE = "https://v3.football.api-sports.io";
const LIVE_STATUSES = ["1H", "HT", "2H", "ET", "BT", "P", "SUSP", "INT", "LIVE"];

type Json = Record<string, unknown>;

function json(body: Json, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}

const RAPID_BASE = "https://api-football-v1.p.rapidapi.com/v3";

async function apiGet(path: string, key: string) {
  // Try the direct api-sports.io endpoint first, then RapidAPI (some keys only work there)
  const attempts: { url: string; headers: Record<string, string> }[] = [
    { url: `${API_BASE}${path}`, headers: { "x-apisports-key": key } },
    {
      url: `${RAPID_BASE}${path}`,
      headers: { "x-rapidapi-key": key, "x-rapidapi-host": "api-football-v1.p.rapidapi.com" },
    },
  ];
  let lastStatus = 0;
  for (const a of attempts) {
    const res = await fetch(a.url, { headers: a.headers });
    if (res.status === 401 || res.status === 403) {
      lastStatus = res.status;
      continue;
    }
    if (!res.ok) throw new Error(`API football ${res.status}`);
    const data = await res.json();
    const errs = data?.errors;
    if (errs && !Array.isArray(errs) && Object.keys(errs).length > 0) {
      throw new Error(`API football: ${JSON.stringify(errs)}`);
    }
    return data;
  }
  throw new Error(`API football ${lastStatus} (clave rechazada)`);
}


function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

// The free API-Football plan rejects the "next" parameter, so we query by
// date range / season and pick the closest upcoming fixture ourselves.
async function findNextFixture(apiTeamId: number, key: string) {
  const now = Date.now();
  const from = new Date(now - 6 * 3600_000);
  const to = new Date(now + 120 * 24 * 3600_000);
  const year = new Date().getUTCFullYear();
  const seasons = [year, year - 1, year + 1];

  const pick = (list: any[]) => {
    const upcoming = list
      .filter((f) => {
        const t = new Date(f?.fixture?.date ?? 0).getTime();
        return Number.isFinite(t) && t > now - 3 * 3600_000;
      })
      .sort(
        (a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime(),
      );
    return upcoming[0] ?? null;
  };

  for (const season of seasons) {
    try {
      const res = await apiGet(
        `/fixtures?team=${apiTeamId}&season=${season}&from=${ymd(from)}&to=${ymd(to)}`,
        key,
      );
      const found = pick(res?.response ?? []);
      if (found) return found;
    } catch (_) {
      // ignore and try the next season / strategy
    }
  }

  for (const season of seasons) {
    try {
      const res = await apiGet(`/fixtures?team=${apiTeamId}&season=${season}`, key);
      const found = pick(res?.response ?? []);
      if (found) return found;
    } catch (_) {
      // ignore
    }
  }

  return null;
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

  const fdToken = Deno.env.get("FOOTBALL_DATA_API_KEY");
  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");

  const url = new URL(req.url);
  const search = url.searchParams.get("search");
  if (search) {
    if (!apiKey) return json({ ok: false, reason: "missing_api_key" }, 200);
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
      .select("id, name, api_football_team_id, football_data_team_id, sportsdb_team_id")
      .eq("id", lastChange.winner_team_id)
      .maybeSingle();
    if (chErr) throw chErr;
    if (!champion) return json({ ok: false, reason: "no_champion" });
    const apiTeamId = (champion.api_football_team_id ?? null) as number | null;

    // 2. Throttle using the stored row
    const { data: current } = await supabase
      .from("live_fixtures")
      .select("*")
      .eq("is_current", true)
      .order("kickoff_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // A stored fixture is dropped 6 h after kickoff so the widget moves on to
    // the next match; a change of champion also forces an immediate refresh.
    const KEEP_RESULT_MS = 6 * 3600_000;
    const staleFinished =
      !!current && Date.now() - new Date(current.kickoff_at).getTime() > KEEP_RESULT_MS;
    const championChanged = !!current && current.champion_team_id !== champion.id;

    const force = url.searchParams.get("force") === "1";
    if (current && !force && !staleFinished && !championChanged) {
      const ageMs = Date.now() - new Date(current.updated_at).getTime();
      const live = LIVE_STATUSES.includes(current.status_short);
      const minAge = live ? 45_000 : 20 * 60_000;
      if (ageMs < minAge) return json({ ok: true, cached: true, fixture: current });
    }


    // 3. Resolve the fixture from the available sources, in order of quality
    let norm: NormalisedFixture | null = null;
    const tried: string[] = [];

    // 3a. API-Football (live data works on the free plan; scheduled needs a paid plan)
    if (apiKey && apiTeamId) {
      tried.push("api-football");
      try {
        let fixture: any = null;
        const liveRes = await apiGet(`/fixtures?team=${apiTeamId}&live=all`, apiKey);
        if (liveRes?.response?.length) {
          const detail = await apiGet(`/fixtures?id=${liveRes.response[0].fixture.id}`, apiKey);
          fixture = detail?.response?.[0] ?? liveRes.response[0];
        } else {
          fixture = await findNextFixture(apiTeamId, apiKey);
        }
        if (fixture) {
          norm = {
            fixture_id: fixture.fixture?.id,
            kickoff_at: fixture.fixture?.date,
            league_name: fixture.league?.name ?? null,
            league_logo: fixture.league?.logo ?? null,
            round: fixture.league?.round ?? null,
            home_name: fixture.teams?.home?.name ?? "?",
            away_name: fixture.teams?.away?.name ?? "?",
            home_logo: fixture.teams?.home?.logo ?? null,
            away_logo: fixture.teams?.away?.logo ?? null,
            home_goals: fixture.goals?.home ?? null,
            away_goals: fixture.goals?.away ?? null,
            home_pens: fixture.score?.penalty?.home ?? null,
            away_pens: fixture.score?.penalty?.away ?? null,
            status_short: fixture.fixture?.status?.short ?? "NS",
            status_long: fixture.fixture?.status?.long ?? null,
            elapsed: fixture.fixture?.status?.elapsed ?? null,
            events: mapEvents(fixture),
            source: "api-football",
          };
        }
      } catch (e) {
        console.warn("api-football source failed", e);
      }
    }

    // 3a-bis. TheSportsDB (free, worldwide, current season schedule)
    if (!norm) {
      tried.push("thesportsdb");
      try {
        let sdbId = (champion.sportsdb_team_id ?? null) as number | null;
        if (!sdbId) {
          const found = await tsdbFindTeam(champion.name as string);
          if (found) {
            sdbId = found.id;
            const patch: Record<string, unknown> = { sportsdb_team_id: found.id };
            if (!apiTeamId && found.apiFootballId) patch.api_football_team_id = found.apiFootballId;
            await supabase.from("teams").update(patch).eq("id", champion.id);
          }
        }
        if (sdbId) {
          // Refresh the stored event only while it is still relevant (kicked off
          // less than 6 h ago and same champion); otherwise jump to the next one.
          if (current && !staleFinished && !championChanged && new Date(current.kickoff_at).getTime() < Date.now()) {
            const refreshed = await tsdbEvent(Number(current.fixture_id));
            if (refreshed && refreshed.home_goals !== null) norm = refreshed;
          }
          if (!norm) norm = await tsdbNextFixture(sdbId);
        }

      } catch (e) {
        console.warn("thesportsdb source failed", e);
      }
    }

    // 3b. football-data.org (free, current seasons, big leagues)
    if (!norm && fdToken) {
      tried.push("football-data");
      try {
        let fdId = (champion.football_data_team_id ?? null) as number | null;
        if (!fdId) {
          fdId = await fdFindTeamId(fdToken, champion.name as string);
          if (fdId) {
            await supabase.from("teams").update({ football_data_team_id: fdId }).eq("id", champion.id);
          }
        }
        if (fdId) norm = await fdNextFixture(fdToken, fdId);
      } catch (e) {
        console.warn("football-data source failed", e);
      }
    }

    // 3c. Firecrawl + AI fallback (any club in the world)
    if (!norm && firecrawlKey && lovableKey) {
      tried.push("scrape");
      try {
        norm = await scrapeNextFixture(champion.name as string, firecrawlKey, lovableKey);
      } catch (e) {
        console.warn("scrape source failed", e);
      }
    }

    if (!norm || !norm.fixture_id || !norm.kickoff_at) {
      if (current) await supabase.from("live_fixtures").update({ is_current: false }).eq("id", current.id);
      return json({ ok: true, fixture: null, reason: "no_fixture", tried });
    }

    // 4. Map the fixture teams to ToNOI teams (by API id when we have it, else by name)
    const { data: allTeams } = await supabase.from("teams").select("id, name, api_football_team_id");
    const slug = (s: string) =>
      s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
    const findTeam = (name: string, apiId: number | null) => {
      const list = allTeams ?? [];
      if (apiId) {
        const byApi = list.find((t: any) => t.api_football_team_id === apiId);
        if (byApi) return byApi.id;
      }
      const target = slug(name);
      const exact = list.find((t: any) => slug(t.name) === target);
      if (exact) return exact.id;
      const partial = list.find(
        (t: any) => slug(t.name).includes(target) || target.includes(slug(t.name)),
      );
      return partial?.id ?? null;
    };

    const isHomeChampion = slug(norm.home_name).includes(slug(champion.name as string).slice(0, 6));
    const championApi = apiTeamId;

    const row = {
      fixture_id: norm.fixture_id,
      kickoff_at: norm.kickoff_at,
      league_name: norm.league_name,
      league_logo: norm.league_logo,
      round: norm.round,
      home_api_team_id: norm.source === "api-football" && isHomeChampion ? championApi : null,
      away_api_team_id: norm.source === "api-football" && !isHomeChampion ? championApi : null,
      home_name: norm.home_name,
      away_name: norm.away_name,
      home_logo: norm.home_logo,
      away_logo: norm.away_logo,
      home_team_id: findTeam(norm.home_name, null),
      away_team_id: findTeam(norm.away_name, null),
      home_goals: norm.home_goals,
      away_goals: norm.away_goals,
      home_pens: norm.home_pens,
      away_pens: norm.away_pens,
      status_short: norm.status_short,
      status_long: norm.status_long,
      elapsed: norm.elapsed,
      events: norm.events,
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
