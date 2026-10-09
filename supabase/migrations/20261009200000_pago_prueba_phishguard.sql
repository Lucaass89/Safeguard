-- Pago de prueba de PhishGuard: 500 pesos por Mercado Pago.
-- No guarda tarjetas. Marca el plan como activo para la cuenta que pagó.

create table if not exists public.pagos_phishguard (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null,
  organizacion_id uuid not null references public.organizaciones (id),
  medio text not null default 'mercado_pago',
  monto numeric(12, 2) not null,
  moneda text not null default 'ARS',
  es_prueba boolean not null default true,
  creado_en timestamptz not null default now(),
  constraint pagos_phishguard_medio_check check (medio = 'mercado_pago'),
  constraint pagos_phishguard_monto_check check (monto = 500),
  constraint pagos_phishguard_moneda_check check (moneda = 'ARS')
);

alter table public.pagos_phishguard enable row level security;

revoke all on table public.pagos_phishguard from public, anon, authenticated;

create or replace function public.phishguard_pagar_prueba()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_org uuid;
  v_nombre text;
begin
  if v_uid is null then
    raise exception 'Tenés que entrar para pagar.';
  end if;

  select u.email into v_email
  from auth.users u
  where u.id = v_uid;

  if coalesce(btrim(v_email), '') = '' then
    raise exception 'Esta cuenta no tiene un correo para asociar el pago.';
  end if;

  select a.organizacion_id into v_org
  from public.usuarios_admin a
  where a.auth_user_id = v_uid
  limit 1;

  if v_org is null then
    insert into public.organizaciones (nombre_empresa, plan_id, estado_suscripcion)
    values ('Prueba PhishGuard', 'Inicial', 'activa')
    returning id into v_org;

    v_nombre := split_part(v_email, '@', 1);

    insert into public.usuarios_admin (
      organizacion_id, auth_user_id, nombre, email, rol
    )
    values (v_org, v_uid, v_nombre, v_email, 'Admin_Principal');
  else
    update public.organizaciones
      set estado_suscripcion = 'activa'
    where id = v_org;
  end if;

  if not exists (
    select 1 from public.pagos_phishguard p where p.auth_user_id = v_uid
  ) then
    insert into public.pagos_phishguard (
      auth_user_id, organizacion_id, medio, monto, moneda, es_prueba
    )
    values (v_uid, v_org, 'mercado_pago', 500, 'ARS', true);
  end if;

  return jsonb_build_object(
    'desbloqueado', true,
    'organizacion_id', v_org,
    'monto', 500,
    'moneda', 'ARS'
  );
end;
$$;

revoke all on function public.phishguard_pagar_prueba() from public, anon;
grant execute on function public.phishguard_pagar_prueba() to authenticated;
