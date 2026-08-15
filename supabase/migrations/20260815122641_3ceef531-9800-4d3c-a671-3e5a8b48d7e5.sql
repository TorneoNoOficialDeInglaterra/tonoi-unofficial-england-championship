ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS api_football_team_id integer;

CREATE TABLE public.live_fixtures (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fixture_id bigint NOT NULL UNIQUE,
  kickoff_at timestamp with time zone NOT NULL,
  league_name text,
  league_logo text,
  round text,
  home_api_team_id integer,
  away_api_team_id integer,
  home_name text NOT NULL,
  away_name text NOT NULL,
  home_logo text,
  away_logo text,
  home_team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  away_team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  home_goals integer,
  away_goals integer,
  home_pens integer,
  away_pens integer,
  status_short text NOT NULL DEFAULT 'NS',
  status_long text,
  elapsed integer,
  events jsonb NOT NULL DEFAULT '[]'::jsonb,
  champion_team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  is_current boolean NOT NULL DEFAULT true,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.live_fixtures TO anon;
GRANT SELECT ON public.live_fixtures TO authenticated;
GRANT ALL ON public.live_fixtures TO service_role;

ALTER TABLE public.live_fixtures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read live fixtures"
ON public.live_fixtures FOR SELECT
USING (true);

CREATE POLICY "service role manages live fixtures"
ON public.live_fixtures FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_live_fixtures_updated_at
BEFORE UPDATE ON public.live_fixtures
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX live_fixtures_current_idx ON public.live_fixtures (is_current, kickoff_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.live_fixtures;