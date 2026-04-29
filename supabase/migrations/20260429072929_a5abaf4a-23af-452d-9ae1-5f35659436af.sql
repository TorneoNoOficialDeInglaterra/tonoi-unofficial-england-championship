-- Player all-time stats
CREATE TABLE public.player_stats_alltime (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name text NOT NULL UNIQUE,
  goals integer NOT NULL DEFAULT 0,
  assists integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.player_stats_alltime ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read player_alltime"
ON public.player_stats_alltime FOR SELECT TO public USING (true);

CREATE POLICY "admins write player_alltime"
ON public.player_stats_alltime FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Goalkeeper all-time stats
CREATE TABLE public.goalkeeper_stats_alltime (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goalkeeper_name text NOT NULL UNIQUE,
  clean_sheets integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.goalkeeper_stats_alltime ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read gk_alltime"
ON public.goalkeeper_stats_alltime FOR SELECT TO public USING (true);

CREATE POLICY "admins write gk_alltime"
ON public.goalkeeper_stats_alltime FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Backfill players from current + history
INSERT INTO public.player_stats_alltime (player_name, goals, assists)
SELECT player_name, SUM(goals)::int, SUM(assists)::int
FROM (
  SELECT player_name, goals, assists FROM public.player_stats
  UNION ALL
  SELECT player_name, goals, assists FROM public.player_stats_history
) s
GROUP BY player_name
ON CONFLICT (player_name) DO UPDATE
SET goals = EXCLUDED.goals,
    assists = EXCLUDED.assists,
    updated_at = now();

-- Backfill goalkeepers
INSERT INTO public.goalkeeper_stats_alltime (goalkeeper_name, clean_sheets)
SELECT goalkeeper_name, SUM(clean_sheets)::int
FROM (
  SELECT goalkeeper_name, clean_sheets FROM public.goalkeeper_stats
  UNION ALL
  SELECT goalkeeper_name, clean_sheets FROM public.goalkeeper_stats_history
) s
GROUP BY goalkeeper_name
ON CONFLICT (goalkeeper_name) DO UPDATE
SET clean_sheets = EXCLUDED.clean_sheets,
    updated_at = now();