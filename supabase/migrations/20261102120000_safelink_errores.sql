-- "Reportar un error" en el resultado de SafeLink: guarda el caso para que una persona lo revise.
-- Nunca toca public.amenazas ni la lista de marcas: un reporte no cambia ningún veredicto por sí solo.
-- La dirección se guarda sin la consulta (?…) ni el fragmento (#…), que pueden traer datos personales.

create table if not exists public.safelink_errores (
  id bigint generated always as identity primary key,
  usuario_id uuid references auth.users (id) on delete set null,
  dispositivo uuid,
  url text check (url is null or length(url) <= 2048),
  dominio text check (dominio is null or length(dominio) <= 253),
  canal text not null check (canal in ('enlace', 'whatsapp', 'pdf', 'correo', 'qr')),
  nivel text not null check (nivel in ('verde', 'amarillo', 'rojo', 'gris')),
  esperado text not null check (esperado in ('legitimo', 'peligroso', 'otro')),
  motivos jsonb not null default '[]'::jsonb check (jsonb_typeof(motivos) = 'array'),
  comentario text check (comentario is null or length(comentario) <= 500),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'revisado', 'descartado')),
  creado_en timestamptz not null default now()
);

create index if not exists safelink_errores_estado_idx
  on public.safelink_errores (estado, creado_en desc);

create index if not exists safelink_errores_dispositivo_idx
  on public.safelink_errores (dispositivo, creado_en);

create index if not exists safelink_errores_usuario_idx
  on public.safelink_errores (usuario_id, creado_en);

alter table public.safelink_errores enable row level security;

revoke all on public.safelink_errores from anon, authenticated;

create or replace function public.safelink_reportar_error(
  p_dispositivo uuid,
  p_url text,
  p_dominio text,
  p_canal text,
  p_nivel text,
  p_esperado text,
  p_motivos jsonb default '[]'::jsonb,
  p_comentario text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_url text := nullif(left(split_part(split_part(trim(coalesce(p_url, '')), '#', 1), '?', 1), 2048), '');
  v_dominio text := nullif(left(lower(trim(coalesce(p_dominio, ''))), 253), '');
  v_comentario text := nullif(left(trim(coalesce(p_comentario, '')), 500), '');
  v_motivos jsonb := coalesce(p_motivos, '[]'::jsonb);
begin
  if v_uid is null and p_dispositivo is null then
    return false;
  end if;

  if p_canal is null or p_canal not in ('enlace', 'whatsapp', 'pdf', 'correo', 'qr')
    or p_nivel is null or p_nivel not in ('verde', 'amarillo', 'rojo', 'gris')
    or p_esperado is null or p_esperado not in ('legitimo', 'peligroso', 'otro') then
    return false;
  end if;

  if jsonb_typeof(v_motivos) <> 'array' or jsonb_array_length(v_motivos) > 20 then
    return false;
  end if;

  if exists (
    select 1
    from jsonb_array_elements(v_motivos) as motivo
    where jsonb_typeof(motivo) <> 'string' or length(motivo #>> '{}') > 400
  ) then
    return false;
  end if;

  if (
    select count(*)
    from public.safelink_errores
    where creado_en > now() - interval '1 hour'
      and ((v_uid is not null and usuario_id = v_uid) or (p_dispositivo is not null and dispositivo = p_dispositivo))
  ) >= 10 then
    return false;
  end if;

  if (
    select count(*)
    from public.safelink_errores
    where creado_en > now() - interval '1 hour'
  ) >= 500 then
    return false;
  end if;

  insert into public.safelink_errores (
    usuario_id, dispositivo, url, dominio, canal, nivel, esperado, motivos, comentario
  ) values (
    v_uid, p_dispositivo, v_url, v_dominio, p_canal, p_nivel, p_esperado, v_motivos, v_comentario
  );

  return true;
end;
$$;

revoke all on function public.safelink_reportar_error(uuid, text, text, text, text, text, jsonb, text) from public;
grant execute on function public.safelink_reportar_error(uuid, text, text, text, text, text, jsonb, text)
  to anon, authenticated;
