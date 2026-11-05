-- Threepetal — 初始化 Schema（Supabase Postgres 15）
-- 执行方式：Supabase Studio → SQL Editor 粘贴运行；或 supabase db push。

-- 1) profiles（扩展 auth.users）
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  country text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "own profile" on public.profiles
  for all using (auth.uid () = id) with check (auth.uid () = id);

-- 新用户自动建 profile
create or replace function public.handle_new_user () returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user ();

-- 2) ls_events（webhook 幂等日志，仅 service_role 写）
create table if not exists public.ls_events (
  id text primary key,
  event_type text,
  payload jsonb,
  processed_at timestamptz default now()
);

-- 3) purchases（订单，本人可读）
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid (),
  user_id uuid references public.profiles (id) on delete cascade,
  ls_customer_id text,
  ls_order_id text,
  product_id text,
  variant_id text,
  amount numeric,
  currency text,
  status text default 'completed',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.purchases enable row level security;
create policy "own purchases" on public.purchases
  for select using (auth.uid () = user_id);

-- 4) licenses（解锁真相源，仅 webhook 经 service_role 写，本人只读）
create table if not exists public.licenses (
  id uuid primary key default gen_random_uuid (),
  user_id uuid references public.profiles (id) on delete cascade,
  product_id text,
  entitlement text not null,
  status text default 'active',
  granted_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.licenses enable row level security;
create policy "own licenses" on public.licenses
  for select using (auth.uid () = user_id);

-- 5) game_progress（存档，本人读写）
create table if not exists public.game_progress (
  id uuid primary key default gen_random_uuid (),
  user_id uuid references public.profiles (id) on delete cascade,
  level int default 1,
  score bigint default 0,
  petals int default 0,
  save_data jsonb default '{}',
  updated_at timestamptz default now()
);
alter table public.game_progress enable row level security;
create policy "own progress" on public.game_progress
  for all using (auth.uid () = user_id) with check (auth.uid () = user_id);

-- 6) leaderboard（公开读，本人写）
create table if not exists public.leaderboard (
  id uuid primary key default gen_random_uuid (),
  user_id uuid references public.profiles (id) on delete cascade,
  mode text default 'classic',
  score bigint not null,
  meta jsonb,
  created_at timestamptz default now()
);
alter table public.leaderboard enable row level security;
create policy "read leaderboard" on public.leaderboard for select using (true);
create policy "write own score" on public.leaderboard
  for insert with check (auth.uid () = user_id);

-- 7) feature_flags（公开读）
create table if not exists public.feature_flags (
  key text primary key,
  enabled boolean default false,
  rollout_pct int default 0,
  whitelist_user_ids uuid[]
);
alter table public.feature_flags enable row level security;
create policy "read flags" on public.feature_flags for select using (true);

-- 唯一索引（供 upsert / 幂等解锁）
create unique index if not exists game_progress_user_idx
  on public.game_progress (user_id);
create unique index if not exists licenses_user_entitlement_idx
  on public.licenses (user_id, entitlement);
create unique index if not exists purchases_ls_order_idx
  on public.purchases (ls_order_id);
