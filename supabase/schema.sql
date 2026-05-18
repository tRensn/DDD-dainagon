create table if not exists public.profiles (
  username text primary key check (char_length(username) between 1 and 24),
  auth_user_id uuid unique default auth.uid(),
  created_at timestamptz not null default now()
);

create table if not exists public.rankings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid(),
  player_name text not null references public.profiles(username),
  score integer not null,
  created_at timestamptz not null default now()
);

alter table public.profiles
add column if not exists auth_user_id uuid unique default auth.uid();

alter table public.profiles
alter column auth_user_id set default auth.uid();

alter table public.profiles
add column if not exists created_at timestamptz not null default now();

create unique index if not exists profiles_auth_user_id_unique_idx
on public.profiles (auth_user_id)
where auth_user_id is not null;

alter table public.rankings
add column if not exists user_id uuid default auth.uid();

alter table public.rankings
alter column user_id set default auth.uid();

alter table public.rankings
add column if not exists created_at timestamptz not null default now();

with duplicated_rankings as (
  select
    ctid,
    row_number() over (
      partition by player_name
      order by created_at desc
    ) as duplicate_index
  from public.rankings
)
delete from public.rankings
using duplicated_rankings
where rankings.ctid = duplicated_rankings.ctid
  and duplicated_rankings.duplicate_index > 1;

create unique index if not exists rankings_player_name_unique_idx
on public.rankings (player_name);

create unique index if not exists rankings_user_id_unique_idx
on public.rankings (user_id)
where user_id is not null;

alter table public.profiles enable row level security;
alter table public.rankings enable row level security;

grant select on table public.profiles to anon, authenticated;
grant insert, update on table public.profiles to authenticated;
grant select on table public.rankings to anon, authenticated;
grant insert, update on table public.rankings to authenticated;

drop policy if exists "Profiles are viewable by everyone." on public.profiles;
create policy "Profiles are viewable by everyone."
on public.profiles
for select
to anon, authenticated
using (true);

drop policy if exists "Players can register their own name." on public.profiles;
drop policy if exists "Users can create their own profile." on public.profiles;
create policy "Users can create their own profile."
on public.profiles
for insert
to authenticated
with check (auth_user_id = auth.uid());

drop policy if exists "Users can keep their own profile." on public.profiles;
create policy "Users can keep their own profile."
on public.profiles
for update
to authenticated
using (auth_user_id = auth.uid())
with check (auth_user_id = auth.uid());

drop policy if exists "Rankings are viewable by everyone." on public.rankings;
create policy "Rankings are viewable by everyone."
on public.rankings
for select
to anon, authenticated
using (true);

drop policy if exists "Anyone can submit a ranking score." on public.rankings;
drop policy if exists "Players can submit their own ranking score." on public.rankings;
drop policy if exists "Signed-in users can submit their own ranking score." on public.rankings;
create policy "Signed-in users can submit their own ranking score."
on public.rankings
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.profiles
    where profiles.username = rankings.player_name
      and profiles.auth_user_id = auth.uid()
  )
);

drop policy if exists "Players can update their own ranking score." on public.rankings;
drop policy if exists "Signed-in users can update their own ranking score." on public.rankings;
create policy "Signed-in users can update their own ranking score."
on public.rankings
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.username = rankings.player_name
      and profiles.auth_user_id = auth.uid()
  )
)
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.profiles
    where profiles.username = rankings.player_name
      and profiles.auth_user_id = auth.uid()
  )
);

create index if not exists rankings_score_created_at_idx
on public.rankings (score desc, created_at asc);
