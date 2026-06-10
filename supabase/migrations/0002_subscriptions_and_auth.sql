create table public.organization_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  module_key text not null,
  status text not null default 'inactive',
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, module_key)
);

alter table public.organization_subscriptions enable row level security;

create policy "members read subscriptions"
on public.organization_subscriptions for select
using (organization_id = public.current_organization_id());

create policy "admins manage subscriptions"
on public.organization_subscriptions for all
using (
  organization_id = public.current_organization_id()
  and exists (
    select 1 from public.organization_members
    where organization_id = public.current_organization_id()
      and profile_id = auth.uid()
      and role in ('owner', 'admin')
  )
);
