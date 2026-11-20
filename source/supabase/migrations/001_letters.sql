-- Additive release schema. Apply as the Supabase database owner.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists public.letters (
  id text primary key,
  origin text not null check (origin in ('editorial', 'community')),
  salutation text not null check (char_length(salutation) <= 100),
  paragraphs text[] not null,
  signoff text not null check (char_length(signoff) <= 80),
  excerpt text not null,
  excerpts text[] not null default '{}',
  topic text not null default '',
  paths text[] not null default '{}',
  status text not null default 'visible' check (status in ('visible', 'hidden')),
  created_at timestamptz not null default now()
);
create index if not exists letters_visible_order on public.letters (created_at desc, id desc) where status = 'visible';
create index if not exists letters_community_order on public.letters (created_at desc, id desc) where status = 'visible' and origin = 'community';

create table if not exists private.submissions (
  request_key uuid primary key,
  fingerprint text not null,
  letter_id text not null unique,
  created_at timestamptz not null default now()
);
create table if not exists private.request_limits (
  bucket text not null,
  actor text not null,
  window_start timestamptz not null,
  count integer not null default 0,
  primary key (bucket, actor, window_start)
);
create table if not exists private.reading_sessions (
  id uuid primary key,
  seen text[] not null default '{}',
  updated_at timestamptz not null default now()
);
create table if not exists public.letter_reports (
  id uuid primary key,
  letter_id text not null references public.letters(id),
  reason text not null check (char_length(reason) between 3 and 500),
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now()
);
create table if not exists private.report_requests (
  request_key uuid primary key,
  fingerprint text not null,
  report_id uuid not null,
  created_at timestamptz not null default now()
);

alter table public.letters enable row level security;
alter table public.letter_reports enable row level security;
alter table private.submissions enable row level security;
alter table private.request_limits enable row level security;
alter table private.report_requests enable row level security;
alter table private.reading_sessions enable row level security;
revoke all on public.letters, public.letter_reports from anon, authenticated;
revoke all on all tables in schema private from public, anon, authenticated;

-- IDs remain permanent even when a row's visibility changes in Dashboard.
create or replace function private.keep_letter_identity() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.id <> old.id or new.origin <> old.origin or new.created_at <> old.created_at then
    raise exception 'Letter identity is immutable';
  end if;
  return new;
end;
$$;
drop trigger if exists letters_immutable_identity on public.letters;
create trigger letters_immutable_identity before update on public.letters
for each row execute function private.keep_letter_identity();

create or replace function private.public_letter(l public.letters) returns jsonb
language sql stable set search_path = '' as $$
 select jsonb_build_object('id', l.id, 'origin', l.origin, 'salutation', l.salutation,
  'paragraphs', l.paragraphs, 'signoff', l.signoff, 'excerpt', l.excerpt,
  'excerpts', l.excerpts, 'topic', l.topic, 'paths', l.paths, 'createdAt', l.created_at);
$$;

create or replace function private.consume_limit(p_bucket text, p_actor text, p_max integer) returns boolean
language plpgsql set search_path = '' as $$
declare n integer; w timestamptz := date_trunc('hour', now());
begin
  insert into private.request_limits(bucket, actor, window_start, count)
    values(p_bucket, p_actor, w, 1)
    on conflict(bucket, actor, window_start) do update set count = private.request_limits.count + 1
    returning count into n;
  -- Keep only short-lived, salted pseudonymous abuse counters.
  delete from private.request_limits where (bucket, actor, window_start) in (
   select bucket, actor, window_start from private.request_limits
   where window_start < now() - interval '48 hours' for update skip locked limit 100
  );
  return n <= p_max;
end;
$$;

-- Replace the earlier internal signatures when this additive release is re-applied.
drop function if exists public.ltg_letter(text);
drop function if exists public.ltg_rotation(text[], text);
create or replace function public.ltg_letter(p_id text, p_session uuid default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare result jsonb;
begin
 select private.public_letter(l) into result from public.letters l where l.id = p_id and l.status = 'visible';
 if result is not null and p_session is not null then
  insert into private.reading_sessions(id, seen) values(p_session, array[p_id])
  on conflict(id) do update set seen = case when p_id = any(private.reading_sessions.seen)
   then private.reading_sessions.seen else array_append(private.reading_sessions.seen, p_id) end, updated_at = now();
 end if;
 return result;
end;
$$;
create or replace function public.ltg_rotation(p_session uuid, p_exclude text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare result jsonb; visited text[];
begin
 insert into private.reading_sessions(id) values(p_session) on conflict(id) do nothing;
 select seen into visited from private.reading_sessions where id = p_session for update;
 select private.public_letter(l) into result from public.letters l
 where l.status = 'visible' and l.id <> p_exclude and not(l.id = any(visited)) order by random() limit 1;
 if result is null then
  visited := '{}';
  select private.public_letter(l) into result from public.letters l
   where l.status = 'visible' and l.id <> p_exclude order by random() limit 1;
 end if;
 if result is null then
  select private.public_letter(l) into result from public.letters l where l.status = 'visible' order by random() limit 1;
 end if;
 if result is not null then
  update private.reading_sessions set seen = array_append(visited, result->>'id'), updated_at = now() where id = p_session;
 end if;
 delete from private.reading_sessions where id in (
  select id from private.reading_sessions where id <> p_session
   and updated_at < now() - interval '7 days' for update skip locked limit 100
 );
 return result;
end;
$$;
create or replace function public.ltg_community(p_before timestamptz default null, p_id text default '', p_limit integer default 10) returns jsonb
language sql stable security definer set search_path = '' as $$
 select coalesce(jsonb_agg(private.public_letter(l) order by l.created_at desc, l.id desc), '[]'::jsonb)
 from (select * from public.letters where status = 'visible' and origin = 'community'
 and (p_before is null or (created_at, id) < (p_before, p_id))
 order by created_at desc, id desc limit least(greatest(p_limit, 1), 21)) l;
$$;

create or replace function public.ltg_publish(
 p_key uuid, p_fingerprint text, p_id text, p_salutation text, p_body text,
 p_signoff text, p_excerpt text, p_actor text
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare prior private.submissions; letter public.letters;
begin
 -- Reservation and letter insertion share one transaction. Concurrent retries wait here.
 insert into private.submissions(request_key, fingerprint, letter_id)
 values(p_key, p_fingerprint, p_id) on conflict(request_key) do nothing;
 select * into prior from private.submissions where request_key = p_key for update;
 if prior.fingerprint <> p_fingerprint then return jsonb_build_object('error', 'IDEMPOTENCY_CONFLICT'); end if;
 select * into letter from public.letters where id = prior.letter_id;
 if found then
  if letter.status <> 'visible' then return jsonb_build_object('error', 'LETTER_UNAVAILABLE'); end if;
  return jsonb_build_object('letter', private.public_letter(letter), 'visibility', 'visible');
 end if;
 if not private.consume_limit('publish', p_actor, 5) then
  delete from private.submissions where request_key = p_key;
  return jsonb_build_object('error', 'RATE_LIMITED');
 end if;
 if char_length(p_salutation) > 100 or char_length(p_body) not between 1 and 5000
  or char_length(p_signoff) > 80 or char_length(p_excerpt) not between 1 and 280
  or (strpos(p_body, p_excerpt) = 0 and (right(p_excerpt, 1) <> '…' or strpos(p_body, left(p_excerpt, char_length(p_excerpt) - 1)) = 0)) then raise exception 'Invalid publication payload'; end if;
 insert into public.letters(id, origin, salutation, paragraphs, signoff, excerpt, excerpts)
 values(p_id, 'community', p_salutation, regexp_split_to_array(p_body, E'\\n\\s*\\n'),
  p_signoff, p_excerpt, array[p_excerpt]) returning * into letter;
 return jsonb_build_object('letter', private.public_letter(letter), 'visibility', 'visible');
end;
$$;

create or replace function public.ltg_report(p_key uuid, p_fingerprint text, p_id uuid, p_letter text, p_reason text, p_actor text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare prior private.report_requests;
begin
 insert into private.report_requests(request_key, fingerprint, report_id)
 values(p_key, p_fingerprint, p_id) on conflict(request_key) do nothing;
 select * into prior from private.report_requests where request_key = p_key for update;
 if prior.fingerprint <> p_fingerprint then return jsonb_build_object('error', 'IDEMPOTENCY_CONFLICT'); end if;
 if exists(select 1 from public.letter_reports where id = prior.report_id) then return jsonb_build_object('saved', true); end if;
 if not exists(select 1 from public.letters where id = p_letter and status = 'visible' and origin = 'community') then
  delete from private.report_requests where request_key = p_key;
  return jsonb_build_object('error', 'LETTER_UNAVAILABLE');
 end if;
 if not private.consume_limit('report', p_actor, 10) then
  delete from private.report_requests where request_key = p_key;
  return jsonb_build_object('error', 'RATE_LIMITED');
 end if;
 insert into public.letter_reports(id, letter_id, reason) values(p_id, p_letter, p_reason);
 return jsonb_build_object('saved', true);
end;
$$;

revoke all on function public.ltg_letter(text, uuid), public.ltg_rotation(uuid, text), public.ltg_community(timestamptz, text, integer),
 public.ltg_publish(uuid, text, text, text, text, text, text, text), public.ltg_report(uuid, text, uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.ltg_letter(text, uuid), public.ltg_rotation(uuid, text), public.ltg_community(timestamptz, text, integer),
 public.ltg_publish(uuid, text, text, text, text, text, text, text), public.ltg_report(uuid, text, uuid, text, text, text) to service_role;
revoke all on all functions in schema private from public, anon, authenticated;
