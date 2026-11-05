-- Uso de Faro: límite por usuario e IP, y caché de las preguntas rápidas.
-- Solo la función safelink-faro escribe y lee, con la clave de servicio. Nadie entra desde el cliente.

create table if not exists public.safelink_faro_uso (
  id bigint generated always as identity primary key,
  usuario_id uuid not null,
  ip text check (ip is null or length(ip) <= 64),
  clave text check (clave is null or length(clave) <= 500),
  respuesta text check (respuesta is null or length(respuesta) <= 4000),
  tokens_entrada integer check (tokens_entrada is null or tokens_entrada between 0 and 2000000),
  tokens_salida integer check (tokens_salida is null or tokens_salida between 0 and 2000000),
  tokens_total integer check (tokens_total is null or tokens_total between 0 and 2000000),
  creado_en timestamptz not null default now()
);

create index if not exists safelink_faro_uso_usuario_idx
  on public.safelink_faro_uso (usuario_id, creado_en desc);

create index if not exists safelink_faro_uso_ip_idx
  on public.safelink_faro_uso (ip, creado_en desc);

create index if not exists safelink_faro_uso_clave_idx
  on public.safelink_faro_uso (clave, creado_en desc);

alter table public.safelink_faro_uso enable row level security;

revoke all on public.safelink_faro_uso from anon, authenticated;
