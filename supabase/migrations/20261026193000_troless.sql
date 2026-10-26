-- Troless accounts, circular videos, encouragement, and reports.
-- The app server uses the service role. Row level security stays on and
-- anon/authenticated have no policies, so password hashes are not public.

create table if not exists public.users (
  id uuid primary key,
  email text not null unique,
  password_hash text,
  password_salt text,
  google_sub text unique,
  display_name text not null check (char_length(display_name) between 1 and 40),
  handle text not null unique check (handle ~ '^[a-z0-9_]{3,20}$'),
  bio text not null check (char_length(bio) between 1 and 160),
  hue integer not null check (hue >= 0 and hue < 360),
  pledge_accepted_at timestamptz not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists users_single_admin on public.users ((true)) where is_admin;

create table if not exists public.videos (
  id uuid primary key,
  user_id uuid not null references public.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  filename text not null check (filename ~ '^[A-Za-z0-9.-]+$'),
  mime text not null check (mime in ('video/webm', 'video/mp4')),
  duration_ms integer not null check (duration_ms >= 1000 and duration_ms <= 60000),
  created_at timestamptz not null default now()
);

create index if not exists videos_created_at_idx on public.videos (created_at desc);
create index if not exists videos_user_id_idx on public.videos (user_id);

create table if not exists public.encouragements (
  user_id uuid not null references public.users (id) on delete cascade,
  video_id uuid not null references public.videos (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, video_id)
);

create table if not exists public.comments (
  id uuid primary key,
  video_id uuid not null references public.videos (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 280),
  created_at timestamptz not null default now()
);

create index if not exists comments_video_created_idx on public.comments (video_id, created_at);

create table if not exists public.reports (
  id uuid primary key,
  reporter_id uuid not null references public.users (id) on delete cascade,
  target_type text not null check (target_type in ('video', 'comment')),
  target_id uuid not null,
  reason text not null check (char_length(reason) between 1 and 280),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists reports_unreviewed_idx on public.reports (created_at desc) where reviewed_at is null;

alter table public.users enable row level security;
alter table public.videos enable row level security;
alter table public.encouragements enable row level security;
alter table public.comments enable row level security;
alter table public.reports enable row level security;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on table public.users from anon, authenticated';
    execute 'revoke all on table public.videos from anon, authenticated';
    execute 'revoke all on table public.encouragements from anon, authenticated';
    execute 'revoke all on table public.comments from anon, authenticated';
    execute 'revoke all on table public.reports from anon, authenticated';
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant all on table public.users to service_role';
    execute 'grant all on table public.videos to service_role';
    execute 'grant all on table public.encouragements to service_role';
    execute 'grant all on table public.comments to service_role';
    execute 'grant all on table public.reports to service_role';
  end if;
end $$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('videos', 'videos', false, 12582912, array['video/webm', 'video/mp4'])
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
