-- PLAYWORLD rastros
create table if not exists rastros (
  id uuid primary key default gen_random_uuid(),
  alias text check (alias is null or char_length(alias) between 1 and 12),
  alma_id text not null check (alma_id in ('noctambula','melancolica','exploradora','colectiva','intensa','nostalgica')),
  track_ids text[] not null check (array_length(track_ids, 1) between 3 and 7),
  year_hint smallint check (year_hint between 2010 and 2026),
  origen text not null default 'visitante',
  created_at timestamptz not null default now()
);

alter table rastros enable row level security;

drop policy if exists "leer" on rastros;
create policy "leer" on rastros for select to anon using (true);

drop policy if exists "posar" on rastros;
create policy "posar" on rastros for insert to anon with check (origen = 'visitante');

create or replace view rastros_resumen as
  select alma_id, count(*)::int as n
  from rastros
  group by alma_id;
