-- ATHAR initial authentication and school profile schema.
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

alter table public.schools enable row level security;
alter table public.profiles enable row level security;

-- Signed-in users may read their own profile.
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

-- A principal may read profiles in their own school. Admin roles may read all profiles.
drop policy if exists "School leaders can read profiles" on public.profiles;
create policy "School leaders can read profiles"
  on public.profiles for select
  to authenticated
  using (
    id = (select auth.uid())
    or (
      school_id = (select p.school_id from public.profiles p where p.id = (select auth.uid()))
      and (select p.role from public.profiles p where p.id = (select auth.uid())) = 'principal'
    )
    or (select p.role from public.profiles p where p.id = (select auth.uid())) in ('admin', 'super_admin')
  );

-- Users can read their own school's basic record; admins can read all schools.
drop policy if exists "Read allowed schools" on public.schools;
create policy "Read allowed schools"
  on public.schools for select
  to authenticated
  using (
    id = (select p.school_id from public.profiles p where p.id = (select auth.uid()))
    or (select p.role from public.profiles p where p.id = (select auth.uid())) in ('admin', 'super_admin')
  );

-- No public signup and no client-side profile/role mutation policies are intentionally created.
-- Provision accounts via Supabase Auth admin interface; insert profiles using the SQL editor
-- or a trusted server-side admin process. Never expose the service_role key in the browser.
