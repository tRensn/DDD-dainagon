create table if not exists public.rankings (
  id uuid primary key default gen_random_uuid(),
  player_name text not null check (char_length(player_name) between 1 and 24),
  score integer not null,
  created_at timestamptz not null default now()
);

alter table public.rankings enable row level security;

grant select, insert on table public.rankings to anon;

drop policy if exists "Rankings are viewable by everyone." on public.rankings;
create policy "Rankings are viewable by everyone."
on public.rankings
for select
to anon
using (true);

drop policy if exists "Anyone can submit a ranking score." on public.rankings;
create policy "Anyone can submit a ranking score."
on public.rankings
for insert
to anon
with check (true);

create index if not exists rankings_score_created_at_idx
on public.rankings (score desc, created_at asc);
