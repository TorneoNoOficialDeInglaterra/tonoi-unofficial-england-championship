ALTER TABLE public.contact_messages ADD COLUMN IF NOT EXISTS response TEXT;
ALTER TABLE public.contact_messages ADD COLUMN IF NOT EXISTS responded_at TIMESTAMP WITH TIME ZONE;
