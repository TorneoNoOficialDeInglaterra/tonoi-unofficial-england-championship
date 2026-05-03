
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "users see own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Teams
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "admins write teams" ON public.teams FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seasons
CREATE TABLE public.seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT false,
  started_at DATE,
  ended_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read seasons" ON public.seasons FOR SELECT USING (true);
CREATE POLICY "admins write seasons" ON public.seasons FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Matches: stored as winner/loser. was_draw=true => decided by penalties (winner = penalty winner)
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_date DATE NOT NULL,
  home_team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE RESTRICT,
  away_team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE RESTRICT,
  home_goals INTEGER NOT NULL DEFAULT 0,
  away_goals INTEGER NOT NULL DEFAULT 0,
  winner_team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE RESTRICT,
  loser_team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE RESTRICT,
  winner_goals INTEGER NOT NULL DEFAULT 0,
  loser_goals INTEGER NOT NULL DEFAULT 0,
  was_draw BOOLEAN NOT NULL DEFAULT false,
  title_changed BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_matches_date ON public.matches(match_date DESC);
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read matches" ON public.matches FOR SELECT USING (true);
CREATE POLICY "admins write matches" ON public.matches FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Player & Goalkeeper stats (current seasons)
CREATE TABLE public.player_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  goals INTEGER NOT NULL DEFAULT 0,
  assists INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (season_id, player_name)
);
ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read player_stats" ON public.player_stats FOR SELECT USING (true);
CREATE POLICY "admins write player_stats" ON public.player_stats FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.goalkeeper_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  goalkeeper_name TEXT NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  clean_sheets INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (season_id, goalkeeper_name)
);
ALTER TABLE public.goalkeeper_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read gk_stats" ON public.goalkeeper_stats FOR SELECT USING (true);
CREATE POLICY "admins write gk_stats" ON public.goalkeeper_stats FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- History snapshots
CREATE TABLE public.player_stats_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_label TEXT NOT NULL,
  player_name TEXT NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  goals INTEGER NOT NULL DEFAULT 0,
  assists INTEGER NOT NULL DEFAULT 0,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.player_stats_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read player_history" ON public.player_stats_history FOR SELECT USING (true);
CREATE POLICY "admins write player_history" ON public.player_stats_history FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.goalkeeper_stats_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_label TEXT NOT NULL,
  goalkeeper_name TEXT NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  clean_sheets INTEGER NOT NULL DEFAULT 0,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.goalkeeper_stats_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read gk_history" ON public.goalkeeper_stats_history FOR SELECT USING (true);
CREATE POLICY "admins write gk_history" ON public.goalkeeper_stats_history FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed active season
INSERT INTO public.seasons (label, is_active, started_at) VALUES ('2025/2026', true, '2025-08-01');
