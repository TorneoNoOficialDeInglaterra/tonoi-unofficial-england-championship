ALTER TABLE public.matches ADD COLUMN home_team_id uuid REFERENCES public.teams(id);
UPDATE public.matches SET home_team_id = winner_team_id WHERE home_team_id IS NULL;