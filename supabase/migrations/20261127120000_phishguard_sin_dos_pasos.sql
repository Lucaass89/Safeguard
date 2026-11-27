-- PhishGuard deja de exigir la verificación en dos pasos: la organización del administrador se resuelve con la sesión
-- de siempre (aal1 o aal2). Revierte la condición que agregó 20261117120000_phishguard_dos_pasos.sql.

create or replace function public.phishguard_org_id()
returns uuid
language sql
stable
security definer
set search_path to 'public'
as $$
  select organizacion_id
  from public.usuarios_admin
  where auth_user_id = auth.uid()
  limit 1;
$$;
