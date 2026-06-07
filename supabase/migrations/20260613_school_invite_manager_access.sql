-- Planify Stage 3 — school invite manager access + profiles.plan for school Pro grants.

alter table public.profiles
  add column if not exists plan text;

comment on column public.profiles.plan is
  'Billing plan key (pro, monthly, premium, yearly). Used for school-invite Pro grants and premium access fallback.';

-- Directors and school_manager profiles may manage invites for their school.
create or replace function public.can_manage_school_invites(p_school_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    public.is_school_director(p_school_id)
    or (
      exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.role = 'school_manager'
      )
      and (
        public.is_active_school_member(p_school_id)
        or exists (
          select 1
          from public.schools s
          where s.id = p_school_id
            and s.director_user_id = auth.uid()
        )
      )
    );
$$;

drop policy if exists school_invites_select_director on public.school_invites;
create policy school_invites_select_manager
  on public.school_invites for select
  using (public.can_manage_school_invites(school_id));

drop policy if exists school_invites_insert_director on public.school_invites;
create policy school_invites_insert_manager
  on public.school_invites for insert
  with check (public.can_manage_school_invites(school_id));

drop policy if exists school_invites_update_director on public.school_invites;
create policy school_invites_update_manager
  on public.school_invites for update
  using (public.can_manage_school_invites(school_id))
  with check (public.can_manage_school_invites(school_id));
