UPDATE public.teams t SET logo_url = v.url FROM (VALUES
('e552b574-c0a5-40c7-b2b2-9b9e6ca84168'::uuid, 'placeholder')
) AS v(id, url) WHERE false;