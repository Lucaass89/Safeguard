-- El cobro de PhishGuard pasa de 500 a 37.500 pesos: el mínimo de USD 25 por mes.
-- Los pagos ya hechos de 500 siguen siendo válidos.

alter table public.pagos_phishguard
  drop constraint if exists pagos_phishguard_monto_check;

alter table public.pagos_phishguard
  add constraint pagos_phishguard_monto_check check (monto in (500, 37500));
