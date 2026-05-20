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

-- RLS: anonymous users may insert their own waitlist row; reads are admin-only.
alter table public.gtm_waitlist enable row level security;

drop policy if exists "anon can insert waitlist row" on public.gtm_waitlist;
create policy "anon can insert waitlist row"
  on public.gtm_waitlist
  for insert
  to anon
  with check (
    email is not null
    and email <> ''
    and mode in ('brand', 'venue')
    and org_name is not null
    and org_name <> ''
  );

-- (No select/update/delete policies — only the service role can read the table
--  via the Supabase dashboard or service key.)
