-- MishiHomework schema. Run in Supabase SQL editor.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null default 'student' check (role in ('student','parent')),
  year_group int default 6,
  sats_date date,
  created_at timestamptz default now()
);

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('topic','homework','mock')),
  topic_id text,
  mock_paper text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  time_seconds int,
  questions_total int not null,
  marks_available int not null,
  marks_scored int,
  percent numeric(5,2)
);

create table public.attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null,
  topic_id text not null,
  difficulty int,
  user_answer jsonb,
  marks_awarded int not null default 0,
  marks_available int not null default 1,
  is_correct boolean not null default false,
  time_seconds int
);

create table public.homework_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  assigned_date date not null default current_date,
  question_ids text[] not null,
  attempt_id uuid references public.attempts(id),
  unique (user_id, assigned_date)
);

create index on public.attempts (user_id, completed_at);
create index on public.attempt_answers (user_id, topic_id);

-- Per-topic stats for weak-topic detection
create view public.topic_stats with (security_invoker = true) as
select user_id, topic_id,
       count(*) as answered,
       sum(marks_awarded)::numeric / nullif(sum(marks_available),0) as accuracy,
       max(a.completed_at) as last_practised
from public.attempt_answers aa
join public.attempts a on a.id = aa.attempt_id
group by user_id, topic_id;

-- Row Level Security: each user sees only their own rows
alter table public.profiles enable row level security;
alter table public.attempts enable row level security;
alter table public.attempt_answers enable row level security;
alter table public.homework_assignments enable row level security;

create policy "own profile" on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy "own attempts" on public.attempts for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own answers" on public.attempt_answers for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own homework" on public.homework_assignments for all using (user_id = auth.uid()) with check (user_id = auth.uid());
