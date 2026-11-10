-- Badges earned by each child. Run in the Supabase SQL editor (after 001 and 002).
-- Badges themselves are worked out by the app from quiz history; this table just remembers
-- which ones were earned, and when, so a badge never disappears and "new badge" pop-ups are accurate.

create table public.user_badges (
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id text not null,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

alter table public.user_badges enable row level security;
create policy "own badges" on public.user_badges for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
