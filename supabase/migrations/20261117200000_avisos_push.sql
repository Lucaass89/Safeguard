-- Celulares que reciben avisos de la app (Firebase Cloud Messaging). Cada token pertenece a la persona que inició
-- sesión en ese celular. phishguard indica si quiere los avisos de su empresa (alguien tocó el enlace de una
-- simulación). Los avisos generales (mantenimientos y estafas de la semana) van por temas de Firebase y no pasan
-- por esta tabla. Solo se escribe con push_registrar y push_borrar; las funciones del servidor leen con service_role.

create table if not exists public.push_dispositivos (
  token text primary key check (char_length(token) between 20 and 4096),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  phishguard boolean not null default true,
  actualizado timestamptz not null default now()
);

create index if not exists push_dispositivos_usuario on public.push_dispositivos (usuario_id);

alter table public.push_dispositivos enable row level security;

revoke all on public.push_dispositivos from anon, authenticated;

create or replace function public.push_registrar(p_token text, p_phishguard boolean default true)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is null then
    raise exception 'Hace falta iniciar sesión';
  end if;
  if p_token is null or char_length(p_token) not between 20 and 4096 then
    raise exception 'Token inválido';
  end if;

  insert into public.push_dispositivos (token, usuario_id, phishguard, actualizado)
  values (p_token, auth.uid(), coalesce(p_phishguard, true), now())
  on conflict (token) do update
    set usuario_id = excluded.usuario_id,
        phishguard = excluded.phishguard,
        actualizado = now();
end;
$$;

create or replace function public.push_borrar(p_token text)
returns void
language sql
security definer
set search_path to 'public'
as $$
  delete from public.push_dispositivos
  where token = p_token and usuario_id = auth.uid();
$$;

revoke all on function public.push_registrar(text, boolean) from public, anon;
revoke all on function public.push_borrar(text) from public, anon;
grant execute on function public.push_registrar(text, boolean) to authenticated;
grant execute on function public.push_borrar(text) to authenticated;
