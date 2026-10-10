-- ATHAR authentication, school roles, portfolio works, and row-level security.
-- Apply only in the intended Supabase project after confirming its project URL.
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
  updated_at timestamptz not null default now()
);

create index if not exists profiles_school_id_idx on public.profiles(school_id);
create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_school_role_idx on public.profiles(school_id, role);
create index if not exists profiles_school_number_idx on public.profiles(school_number);

create table if not exists public.portfolio_works (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  title text not null,
  category text not null default 'مبادراتي',
  description text not null default '',
  evidence_urls text[] not null default '{}',
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'submitted', 'approved', 'returned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists portfolio_works_owner_idx on public.portfolio_works(owner_id);
create index if not exists portfolio_works_school_idx on public.portfolio_works(school_id);
create index if not exists portfolio_works_status_idx on public.portfolio_works(status);

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
alter table public.portfolio_works enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "School leaders can read profiles" on public.profiles;
drop policy if exists "Super admins manage profiles" on public.profiles;
drop policy if exists "Read allowed schools" on public.schools;
drop policy if exists "Super admins manage schools" on public.schools;
drop policy if exists "Owners and school leaders read portfolio works" on public.portfolio_works;
drop policy if exists "Owners insert their own portfolio works" on public.portfolio_works;
drop policy if exists "Owners update their own draft works" on public.portfolio_works;
drop policy if exists "Super admins manage all portfolio works" on public.portfolio_works;

create policy "Users can read own profile"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "School leaders can read profiles"
  on public.profiles for select to authenticated
  using (
    school_id = (select public.current_profile_school_id())
    and (select public.current_profile_role()) in ('principal', 'deputy_principal', 'admin')
  );

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

-- Teachers and counselors can read their own works; school leaders can read works
-- only from their own school; the global super admin can manage all works.
create policy "Owners and school leaders read portfolio works"
  on public.portfolio_works for select to authenticated
  using (
    owner_id = (select auth.uid())
    or (
      school_id = (select public.current_profile_school_id())
      and (select public.current_profile_role()) in ('principal', 'deputy_principal', 'admin')
    )
    or (select public.current_profile_role()) = 'super_admin'
  );

create policy "Owners insert their own portfolio works"
  on public.portfolio_works for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and school_id = (select public.current_profile_school_id())
    and (select public.current_profile_role()) in ('teacher', 'counselor')
  );

create policy "Owners update their own draft works"
  on public.portfolio_works for update to authenticated
  using (
    owner_id = (select auth.uid())
    and (select public.current_profile_role()) in ('teacher', 'counselor')
    and status in ('draft', 'returned')
  )
  with check (
    owner_id = (select auth.uid())
    and school_id = (select public.current_profile_school_id())
    and status in ('draft', 'returned')
  );

create policy "Super admins manage all portfolio works"
  on public.portfolio_works for all to authenticated
  using ((select public.current_profile_role()) = 'super_admin')
  with check ((select public.current_profile_role()) = 'super_admin');

-- Intentionally no public signup and no self-service role changes.
-- Create Auth users through trusted admin provisioning and create a matching profiles row.
-- Never expose service_role/secret keys in browser code or NEXT_PUBLIC_* variables.
