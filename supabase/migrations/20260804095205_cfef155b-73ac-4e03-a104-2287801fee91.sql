ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS winner_pens integer,
  ADD COLUMN IF NOT EXISTS loser_pens integer;