-- altr GTM waitlist — Supabase schema
-- Run this once in your Supabase project: SQL Editor → New query → paste → Run.
-- Safe to re-run (idempotent).

create extension if not exists "pgcrypto";

create table if not exists public.gtm_waitlist (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),

  -- 'brand' (K-content brand) or 'venue' (global venue / event)
  mode          text not null check (mode in ('brand', 'venue')),

  -- contact
  org_name      text not null,
  contact_name  text,
  email         text not null,

  -- structured answers keyed by question id (b0..b4 for brand, v0..v3 for venue)
  answers       jsonb not null default '{}'::jsonb,

  -- attribution / context
  utm           jsonb default '{}'::jsonb,
  referrer      text,
  user_agent    text,
  submitted_at  timestamptz
);

-- Helpful indexes for triage
create index if not exists gtm_waitlist_created_at_idx on public.gtm_waitlist (created_at desc);
create index if not exists gtm_waitlist_mode_idx       on public.gtm_waitlist (mode);
create index if not exists gtm_waitlist_email_idx      on public.gtm_waitlist (email);

-- RLS: any client (anon, publishable, authenticated) may insert a valid
-- waitlist row; reads/updates/deletes have no policy so they are denied for
-- everyone except the service_role (which always bypasses RLS).
alter table public.gtm_waitlist enable row level security;

drop policy if exists "anon can insert waitlist row" on public.gtm_waitlist;
drop policy if exists "any client can insert valid waitlist row" on public.gtm_waitlist;

create policy "any client can insert valid waitlist row"
  on public.gtm_waitlist
  for insert
  to public
  with check (
    email is not null
    and email <> ''
    and mode in ('brand', 'venue')
    and org_name is not null
    and org_name <> ''
  );

-- (No select/update/delete policies — service_role only via Supabase
--  dashboard or backend code. Required for using Supabase's new
--  sb_publishable_* keys which don't always map to the legacy 'anon' role.)
