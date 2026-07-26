-- Wastely Supabase schema.
-- Run this once in your Supabase project's SQL Editor (Dashboard -> SQL Editor -> New query).

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  points int not null default 0,
  scan_count int not null default 0,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_scan_date date,
  created_at timestamptz not null default now()
);

create table public.scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  item_name text not null,
  category text not null check (category in ('recyclable', 'trash')),
  confidence numeric not null,
  reason text,
  state text,
  points_awarded int not null default 0,
  feedback_given boolean not null default false,
  user_corrected boolean not null default false,
  corrected_category text check (corrected_category in ('recyclable', 'trash')),
  created_at timestamptz not null default now()
);

create index scans_user_id_idx on public.scans (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.scans enable row level security;

-- Profiles are readable by everyone (needed for the public leaderboard);
-- only the owning user may update their own display name/avatar.
create policy "profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Scans are private to their owner. Inserts/point-awarding only ever happen
-- server-side via the service role key (which bypasses RLS), so there is
-- intentionally no client-facing insert policy here.
create policy "users can view their own scans"
  on public.scans for select
  using (auth.uid() = user_id);

-- Auto-create a profile row whenever a new auth user signs up (e.g. via Google).
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Records a completed scan and atomically awards points + updates the
-- day-based streak. Intended to be called only by the server using the
-- service role key (never exposed to the client), so a signed-in user
-- cannot call this directly to award themselves arbitrary points.
create or replace function public.record_scan(
  p_user_id uuid,
  p_item_name text,
  p_category text,
  p_confidence numeric,
  p_reason text,
  p_state text,
  p_base_points int default 10
)
returns table (
  scan_id uuid,
  points int,
  scan_count int,
  current_streak int,
  longest_streak int
) as $$
declare
  v_today date := current_date;
  v_last date;
  v_streak int;
  v_longest int;
  v_streak_bonus int;
  v_scan_id uuid;
begin
  -- Column names here are qualified with the "pr" alias because the RETURNS
  -- TABLE clause above implicitly declares plpgsql variables named points,
  -- scan_count, current_streak, longest_streak -- unqualified references
  -- collide with those and Postgres errors with "ambiguous".
  select pr.last_scan_date, pr.current_streak, pr.longest_streak
    into v_last, v_streak, v_longest
    from public.profiles pr
    where pr.id = p_user_id
    for update;

  if v_last is null or v_last < v_today - 1 then
    v_streak := 1;
  elsif v_last = v_today - 1 then
    v_streak := v_streak + 1;
  end if; -- v_last = v_today: already scanned today, streak unchanged

  v_longest := greatest(v_longest, v_streak);
  v_streak_bonus := least(v_streak, 10) * 2;

  insert into public.scans (user_id, item_name, category, confidence, reason, state, points_awarded)
  values (p_user_id, p_item_name, p_category, p_confidence, p_reason, p_state, p_base_points + v_streak_bonus)
  returning id into v_scan_id;

  update public.profiles pr
    set points = pr.points + p_base_points + v_streak_bonus,
        scan_count = pr.scan_count + 1,
        current_streak = v_streak,
        longest_streak = v_longest,
        last_scan_date = v_today
    where pr.id = p_user_id;

  return query
    select v_scan_id, p2.points, p2.scan_count, p2.current_streak, p2.longest_streak
    from public.profiles p2
    where p2.id = p_user_id;
end;
$$ language plpgsql security definer;

-- Awards a one-time bonus for giving feedback (confirm/correct) on a scan.
-- Guarded by feedback_given so repeated calls can't farm points.
create or replace function public.record_feedback(
  p_scan_id uuid,
  p_user_id uuid,
  p_corrected boolean,
  p_corrected_category text,
  p_bonus_points int default 5
)
returns table (points int) as $$
declare
  v_updated boolean;
begin
  update public.scans
    set feedback_given = true,
        user_corrected = p_corrected,
        corrected_category = p_corrected_category
    where id = p_scan_id
      and user_id = p_user_id
      and feedback_given = false
  returning true into v_updated;

  if v_updated is null then
    -- already claimed, or scan doesn't belong to this user: no-op
    return query select pr.points from public.profiles pr where pr.id = p_user_id;
    return;
  end if;

  update public.profiles pr
    set points = pr.points + p_bonus_points
    where pr.id = p_user_id;

  return query select pr.points from public.profiles pr where pr.id = p_user_id;
end;
$$ language plpgsql security definer;

-- Only the server (service_role, which bypasses grants anyway) should be able
-- to award points -- explicitly block direct client calls to these functions.
revoke execute on function public.record_scan from public, anon, authenticated;
revoke execute on function public.record_feedback from public, anon, authenticated;
