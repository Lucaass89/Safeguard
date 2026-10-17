-- Suma "qr" a los origenes validos de safelink_analisis, para los enlaces
-- que llegan escaneando un codigo QR con la camara en /panel/qr.

do $$
declare
  v_conname text;
begin
  select conname into v_conname
  from pg_constraint
  where conrelid = 'public.safelink_analisis'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%entrada%';

  if v_conname is not null then
    execute format('alter table public.safelink_analisis drop constraint %I', v_conname);
  end if;
end $$;

alter table public.safelink_analisis
  add constraint safelink_analisis_entrada_check
  check (entrada in ('web', 'pdf', 'correo', 'whatsapp', 'qr'));
