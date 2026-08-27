ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS country_code text;
CREATE INDEX IF NOT EXISTS teams_country_code_idx ON public.teams (country_code);