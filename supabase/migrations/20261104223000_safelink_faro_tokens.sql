-- Tokens de cada consulta a Faro. La suma por usuario_id es lo que consumió esa cuenta.
-- Si la tabla se creó con la migración anterior, estas columnas se agregan acá.

alter table public.safelink_faro_uso
  add column if not exists tokens_entrada integer,
  add column if not exists tokens_salida integer,
  add column if not exists tokens_total integer;

alter table public.safelink_faro_uso
  drop constraint if exists safelink_faro_uso_tokens_entrada_check,
  drop constraint if exists safelink_faro_uso_tokens_salida_check,
  drop constraint if exists safelink_faro_uso_tokens_total_check;

alter table public.safelink_faro_uso
  add constraint safelink_faro_uso_tokens_entrada_check check (tokens_entrada is null or tokens_entrada between 0 and 2000000),
  add constraint safelink_faro_uso_tokens_salida_check check (tokens_salida is null or tokens_salida between 0 and 2000000),
  add constraint safelink_faro_uso_tokens_total_check check (tokens_total is null or tokens_total between 0 and 2000000);
