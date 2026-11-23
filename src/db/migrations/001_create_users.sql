CREATE TABLE public.users (
  id text PRIMARY KEY CHECK (btrim(id) <> ''),
  email text NOT NULL UNIQUE CHECK (email = lower(btrim(email)) AND email <> ''),
  name text NOT NULL CHECK (btrim(name) <> ''),
  role text NOT NULL CHECK (role IN ('admin', 'viewer')),
  password_hash text NOT NULL CHECK (btrim(password_hash) <> '')
);
