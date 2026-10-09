-- El desbloqueo queda atado a un pago real de Mercado Pago.
-- La función anterior aceptaba el plan sin un cobro aprobado.

alter table public.pagos_phishguard
  add column if not exists pago_mp text;

create unique index if not exists pagos_phishguard_pago_mp_key
  on public.pagos_phishguard (pago_mp);

grant select, insert, update on table public.pagos_phishguard to service_role;

create or replace function public.phishguard_pagar_prueba()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'El pago se hace en Mercado Pago.';
end;
$$;

revoke all on function public.phishguard_pagar_prueba() from public, anon, authenticated;
grant execute on function public.phishguard_pagar_prueba() to authenticated;
