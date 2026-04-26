import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Match, Team } from "@/lib/tonoi";

export function useTeams() {
  return useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teams").select("*").order("name");
      if (error) throw error;
      return (data ?? []) as Team[];
    },
  });
}

export function useMatches() {
  return useQuery({
    queryKey: ["matches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .order("match_date", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Match[];
    },
  });
}

export function useSeasons() {
  return useQuery({
    queryKey: ["seasons"],
    queryFn: async () => {
      const { data, error } = await supabase.from("seasons").select("*").order("started_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}
