-- PhishGuard exige verificación en dos pasos: la organización del administrador solo se resuelve cuando la sesión
-- pasó el segundo paso (aal2). Todas las políticas y funciones de PhishGuard usan phishguard_org_id(), así que con
-- solo la contraseña no se ven empleados, campañas, eventos ni el tablero. La fila propia de usuarios_admin se sigue
-- leyendo (auth_user_id = auth.uid()) para que la app sepa que tiene que pedir el código.
-- Aplicarla después de publicar el frontend que pide el código (componente DosPasos).

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
    and coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
  limit 1;
$$;
