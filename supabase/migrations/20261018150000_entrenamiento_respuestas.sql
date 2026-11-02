-- "¿Estafa o real?" en el inicio de la app: una fila por respuesta, sin cuenta ni datos personales.
-- Sirve para saber si alguien vuelve a jugar antes de sumar puntos o rachas.

create table if not exists public.entrenamiento_respuestas (
  id bigint generated always as identity primary key,
  dispositivo uuid not null,
  mensaje text not null check (mensaje ~ '^[a-z0-9-]{1,80}$'),
  acerto boolean not null,
  creado_en timestamptz not null default now()
);

create index if not exists entrenamiento_respuestas_dispositivo_idx
  on public.entrenamiento_respuestas (dispositivo, creado_en);

alter table public.entrenamiento_respuestas enable row level security;

revoke all on public.entrenamiento_respuestas from anon, authenticated;

create or replace function public.entrenamiento_registrar(
  p_dispositivo uuid,
  p_mensaje text,
  p_acerto boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_dispositivo is null or p_acerto is null or p_mensaje is null or p_mensaje !~ '^[a-z0-9-]{1,80}$' then
    return;
  end if;

  if (
    select count(*)
    from public.entrenamiento_respuestas
    where dispositivo = p_dispositivo
      and creado_en > now() - interval '1 hour'
  ) >= 60 then
    return;
  end if;

  insert into public.entrenamiento_respuestas (dispositivo, mensaje, acerto)
  values (p_dispositivo, p_mensaje, p_acerto);
end;
$$;

revoke all on function public.entrenamiento_registrar(uuid, text, boolean) from public;
grant execute on function public.entrenamiento_registrar(uuid, text, boolean) to anon, authenticated;
