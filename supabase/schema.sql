-- ATHAR authentication and school-scoped authorization schema.
-- Apply in the intended Supabase project only after verifying it is the correct project.
create extension if not exists pgcrypto;

create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  school_number text not null unique,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  school_id uuid not null references public.schools(id),
  school_number text not null,
  role text not null default 'teacher'
    check (role in ('teacher', 'counselor', 'deputy_principal', 'principal', 'admin', 'super_admin')),
  job_title text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, school_number)
);

create index if not exists profiles_school_id_idx on public.profiles(school_id);
create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_school_role_idx on public.profiles(school_id, role);

-- Security-definer helpers avoid recursive RLS queries against profiles.
create or replace function public.current_profile_school_id()
returns uuid
language sql stable security definer
set search_path = ''
as $$
  select p.school_id from public.profiles p where p.id = (select auth.uid()) and p.is_active = true limit 1
$$;

create or replace function public.current_profile_role()
returns text
language sql stable security definer
set search_path = ''
as $$
  select p.role from public.profiles p where p.id = (select auth.uid()) and p.is_active = true limit 1
$$;

revoke all on function public.current_profile_school_id() from public;
revoke all on function public.current_profile_role() from public;
grant execute on function public.current_profile_school_id() to authenticated;
grant execute on function public.current_profile_role() to authenticated;

alter table public.schools enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "School leaders can read profiles" on public.profiles;
drop policy if exists "Super admins manage profiles" on public.profiles;
drop policy if exists "Read allowed schools" on public.schools;
drop policy if exists "Super admins manage schools" on public.schools;

create policy "Users can read own profile"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

-- School principals, deputy principals and school admins can view profiles in their own school.
-- This is intentionally school-scoped; it does not grant access to work/portfolio tables by itself.
create policy "School leaders can read profiles"
  on public.profiles for select to authenticated
  using (
    school_id = (select public.current_profile_school_id())
    and (select public.current_profile_role()) in ('principal', 'deputy_principal', 'admin')
  );

-- The global super admin can read and manage every profile, across all schools.
create policy "Super admins manage profiles"
  on public.profiles for all to authenticated
  using ((select public.current_profile_role()) = 'super_admin')
  with check ((select public.current_profile_role()) = 'super_admin');

create policy "Read allowed schools"
  on public.schools for select to authenticated
  using (
    id = (select public.current_profile_school_id())
    or (select public.current_profile_role()) = 'super_admin'
  );

create policy "Super admins manage schools"
  on public.schools for all to authenticated
  using ((select public.current_profile_role()) = 'super_admin')
  with check ((select public.current_profile_role()) = 'super_admin');

-- No public signup. Create Auth users through trusted admin provisioning, then insert their profiles.
-- Never expose the Supabase service_role/secret key in browser code or NEXT_PUBLIC_* variables.
-- Portfolio/work tables must receive their own RLS policies before they store real school data.
