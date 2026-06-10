create extension if not exists "pgcrypto";

create type public.member_role as enum ('owner', 'admin', 'collaborator', 'readonly');
create type public.applicant_role as enum ('tenant', 'guarantor');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text default '',
  legal_name text default '',
  legal_email text default '',
  signature text default '',
  logo_url text default '',
  included_seats integer not null default 3,
  extra_seat_price_eur integer not null default 19,
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  first_name text default '',
  last_name text default '',
  email text not null,
  phone text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  invited_email text,
  display_name text default '',
  role public.member_role not null default 'collaborator',
  created_at timestamptz not null default now()
);

create table public.dossiers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  address text not null,
  rent numeric not null,
  status text not null default 'draft',
  completeness integer not null default 0,
  solvency_score integer,
  solvency_label text,
  summary text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.applicants (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.dossiers(id) on delete cascade,
  first_name text default '',
  last_name text default '',
  role public.applicant_role not null,
  work_status text not null,
  housing_status text not null,
  monthly_income numeric not null default 0,
  tax_notice_income numeric not null default 0,
  created_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references public.applicants(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  mime_type text not null,
  size_bytes bigint not null default 0,
  created_at timestamptz not null default now()
);

create table public.subscription_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  stripe_event_id text unique,
  event_type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_members enable row level security;
alter table public.dossiers enable row level security;
alter table public.applicants enable row level security;
alter table public.documents enable row level security;
alter table public.subscription_events enable row level security;

create or replace function public.current_organization_id()
returns uuid
language sql
stable
as $$
  select organization_id from public.profiles where id = auth.uid()
$$;

create policy "members can read their organization"
on public.organizations for select
using (id = public.current_organization_id());

create policy "admins can update their organization"
on public.organizations for update
using (
  id = public.current_organization_id()
  and exists (
    select 1 from public.organization_members
    where organization_id = id and profile_id = auth.uid() and role in ('owner', 'admin')
  )
);

create policy "users can read own profile"
on public.profiles for select
using (id = auth.uid() or organization_id = public.current_organization_id());

create policy "users can update own profile"
on public.profiles for update
using (id = auth.uid());

create policy "members can read org members"
on public.organization_members for select
using (organization_id = public.current_organization_id());

create policy "admins manage org members"
on public.organization_members for all
using (
  organization_id = public.current_organization_id()
  and exists (
    select 1 from public.organization_members
    where organization_id = public.current_organization_id()
      and profile_id = auth.uid()
      and role in ('owner', 'admin')
  )
);

create policy "members read dossiers"
on public.dossiers for select
using (organization_id = public.current_organization_id());

create policy "members write dossiers"
on public.dossiers for all
using (organization_id = public.current_organization_id());

create policy "members read applicants"
on public.applicants for select
using (
  exists (
    select 1 from public.dossiers
    where dossiers.id = applicants.dossier_id
      and dossiers.organization_id = public.current_organization_id()
  )
);

create policy "members write applicants"
on public.applicants for all
using (
  exists (
    select 1 from public.dossiers
    where dossiers.id = applicants.dossier_id
      and dossiers.organization_id = public.current_organization_id()
  )
);

create policy "members read documents"
on public.documents for select
using (organization_id = public.current_organization_id());

create policy "members write documents"
on public.documents for all
using (organization_id = public.current_organization_id());

insert into storage.buckets (id, name, public)
values ('rental-documents', 'rental-documents', false)
on conflict (id) do nothing;
