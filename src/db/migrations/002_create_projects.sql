CREATE TABLE public.projects (
  id uuid PRIMARY KEY,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120 AND name = btrim(name)),
  description text CHECK (char_length(description) <= 2000),
  creator_id text NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT
);
