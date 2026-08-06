ALTER TABLE public.faqs
  ADD COLUMN IF NOT EXISTS question_en text,
  ADD COLUMN IF NOT EXISTS answer_en text,
  ADD COLUMN IF NOT EXISTS question_it text,
  ADD COLUMN IF NOT EXISTS answer_it text;