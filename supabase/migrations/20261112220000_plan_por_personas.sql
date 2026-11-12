-- PhishGuard se cobra según la cantidad de personas que elige la organización.
-- Se guarda esa cantidad en la organización y en cada pago.
-- El cobro ya no es un monto fijo: depende del tramo, con un mínimo de USD 25.

alter table public.organizaciones
  add column if not exists usuarios_contratados integer;

alter table public.organizaciones
  drop constraint if exists organizaciones_usuarios_contratados_check;

alter table public.organizaciones
  add constraint organizaciones_usuarios_contratados_check
  check (usuarios_contratados is null or usuarios_contratados between 1 and 10000);

alter table public.pagos_phishguard
  add column if not exists personas integer;

alter table public.pagos_phishguard
  drop constraint if exists pagos_phishguard_personas_check;

alter table public.pagos_phishguard
  add constraint pagos_phishguard_personas_check
  check (personas is null or personas between 1 and 10000);

alter table public.pagos_phishguard
  drop constraint if exists pagos_phishguard_monto_check;

alter table public.pagos_phishguard
  add constraint pagos_phishguard_monto_check check (monto >= 500);

update public.organizaciones o
  set usuarios_contratados = 25
where o.usuarios_contratados is null
  and exists (
    select 1 from public.pagos_phishguard p
    where p.organizacion_id = o.id and p.monto = 37500
  );
