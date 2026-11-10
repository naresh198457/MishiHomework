-- Parent review: reports of questions that look wrong. Run in the Supabase SQL editor (after 001_init.sql).

create table public.question_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null,
  topic_id text not null,
  prompt text not null,
  answer text not null,
  figure jsonb,
  note text,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.question_reports enable row level security;
create policy "own reports" on public.question_reports for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Mark which account is the parent. The /review page only opens for accounts whose profile role is 'parent'.
-- 1) Replace the email addresses below with the real ones, then run these two statements:
insert into public.profiles (id, display_name, role)
select id, 'Parent', 'parent' from auth.users where email = 'PARENT_EMAIL_HERE'
on conflict (id) do update set role = 'parent';

insert into public.profiles (id, display_name, role)
select id, 'Mishitha', 'student' from auth.users where email = 'CHILD_EMAIL_HERE'
on conflict (id) do update set role = 'student';
