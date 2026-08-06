ALTER TABLE public.faqs
  ADD COLUMN IF NOT EXISTS question_ca text,
  ADD COLUMN IF NOT EXISTS answer_ca text,
  ADD COLUMN IF NOT EXISTS question_eu text,
  ADD COLUMN IF NOT EXISTS answer_eu text,
  ADD COLUMN IF NOT EXISTS question_pt text,
  ADD COLUMN IF NOT EXISTS answer_pt text;