-- Cambiar el estado de una persona (aprobar o rechazar) es de un administrador.
-- El alta manual y la importación CSV no pasan por este update.

create or replace function public.empleados_solo_admin_cambia_estado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rol text;
begin
  if new.estado is not distinct from old.estado then
    return new;
  end if;

  select ua.rol into v_rol
  from public.usuarios_admin ua
  where ua.auth_user_id = auth.uid();

  if v_rol is null or v_rol not ilike 'admin%' then
    raise exception 'Solo un administrador puede cambiar el estado';
  end if;

  return new;
end;
$$;

drop trigger if exists empleados_solo_admin_cambia_estado on public.empleados;

create trigger empleados_solo_admin_cambia_estado
before update of estado on public.empleados
for each row
execute function public.empleados_solo_admin_cambia_estado();
