-- ATHAR authentication and school profile schema.
-- Run in Supabase SQL Editor after creating the Supabase project.
create extension if not exists pgcrypto;

create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  school_number text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  school_id uuid not null references public.schools(id),
  school_number text not null,
  role text not null default 'teacher'
    check (role in ('teacher', 'counselor', 'principal', 'admin', 'super_admin')),
  job_title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, school_number)
);

create index if not exists profiles_school_id_idx on public.profiles(school_id);
create index if not exists profiles_role_idx on public.profiles(role);

-- Security-definer helpers avoid recursive RLS queries against profiles.
create or replace function public.current_profile_school_id()
returns uuid
language sql stable security definer
set search_path = ''
as $$
  select p.school_id from public.profiles p where p.id = (select auth.uid()) limit 1
$$;

create or replace function public.current_profile_role()
returns text
language sql stable security definer
set search_path = ''
as $$
  select p.role from public.profiles p where p.id = (select auth.uid()) limit 1
$$;

revoke all on function public.current_profile_school_id() from public;
revoke all on function public.current_profile_role() from public;
grant execute on function public.current_profile_school_id() to authenticated;
grant execute on function public.current_profile_role() to authenticated;

alter table public.schools enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

drop policy if exists "School leaders can read profiles" on public.profiles;
create policy "School leaders can read profiles"
  on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or (
      school_id = (select public.current_profile_school_id())
      and (select public.current_profile_role()) = 'principal'
    )
    or (select public.current_profile_role()) in ('admin', 'super_admin')
  );

drop policy if exists "Read allowed schools" on public.schools;
create policy "Read allowed schools"
  on public.schools for select to authenticated
  using (
    id = (select public.current_profile_school_id())
    or (select public.current_profile_role()) in ('admin', 'super_admin')
  );

-- No public signup and no client-side profile/role mutation policies are intentionally created.
-- Provision users through Supabase Auth, then create their profile with trusted admin tooling
-- or the SQL editor. Never expose the Supabase service_role key in the browser.
