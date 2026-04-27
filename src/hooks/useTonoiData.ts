import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Match, Team } from "@/lib/tonoi";

const PAGE_SIZE = 1000;

async function fetchAllPaginated<T>(
  table: "teams" | "matches" | "seasons",
  order: { column: string; ascending: boolean }[],
): Promise<T[]> {
  const all: T[] = [];
  let from = 0;
  while (true) {
    let q = supabase.from(table).select("*").range(from, from + PAGE_SIZE - 1);
    for (const o of order) q = q.order(o.column, { ascending: o.ascending });
    const { data, error } = await q;
    if (error) throw error;
    const rows = (data ?? []) as T[];
    all.push(...rows);
    if (rows.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return all;
}

export function useTeams() {
  return useQuery({
    queryKey: ["teams"],
    queryFn: () => fetchAllPaginated<Team>("teams", [{ column: "name", ascending: true }]),
  });
}

export function useMatches() {
  return useQuery({
    queryKey: ["matches"],
    queryFn: () =>
      fetchAllPaginated<Match>("matches", [
        { column: "match_date", ascending: true },
        { column: "created_at", ascending: true },
      ]),
  });
}

export function useSeasons() {
  return useQuery({
    queryKey: ["seasons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seasons")
        .select("*")
        .order("started_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}
