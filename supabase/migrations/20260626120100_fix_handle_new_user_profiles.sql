-- Alinha trigger de signup ao schema real de profiles (sem colunas status/is_owner).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to public, auth, extensions
as $function$
declare
  v_referral_code text;
begin
  v_referral_code := public.planify_generate_referral_code(new.id);

  insert into public.profiles (
    id,
    email,
    full_name,
    role,
    is_admin,
    referral_code
  )
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'full_name'
    ),
    'teacher',
    false,
    v_referral_code
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    referral_code = coalesce(public.profiles.referral_code, excluded.referral_code),
    updated_at = now();

  return new;
end;
$function$;
