-- Corrige geração de referral_code no signup: digest() do pgcrypto vive no schema extensions.
create or replace function public.planify_generate_referral_code(p_user_id uuid)
returns text
language plpgsql
immutable
set search_path to public, extensions
as $function$
declare
  raw text;
begin
  raw := upper(
    translate(
      encode(digest(p_user_id::text, 'sha256'), 'hex'),
      '0123456789abcdef',
      'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    )
  );
  return substring(raw from 1 for 8);
end;
$function$;
