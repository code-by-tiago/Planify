-- Confiança máxima: denúncia de mensagens de grupo + rate limit buckets

alter type public.community_report_target add value if not exists 'group_message';

create table if not exists public.community_rate_limit_buckets (
  user_id uuid not null references auth.users(id) on delete cascade,
  bucket_key text not null,
  window_epoch bigint not null,
  hit_count int not null default 1,
  updated_at timestamptz not null default now(),
  primary key (user_id, bucket_key, window_epoch)
);

create index if not exists community_rate_limit_buckets_updated_idx
  on public.community_rate_limit_buckets (updated_at);

alter table public.community_rate_limit_buckets enable row level security;
