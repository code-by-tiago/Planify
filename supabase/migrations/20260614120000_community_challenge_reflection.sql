-- Persist BNCC challenge reflection text per user

alter table public.community_user_challenges
  add column if not exists reflection text;
