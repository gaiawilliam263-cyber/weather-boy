create table if not exists locations (
  id bigint generated always as identity primary key,
  name text not null,
  country text,
  state text,
  lat double precision not null,
  lon double precision not null,
  created_at timestamptz default now(),
  unique (lat, lon)
);

-- Lock the table: only the backend (service key) can touch it.
alter table locations enable row level security;
