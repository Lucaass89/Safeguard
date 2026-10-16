-- Marca el aviso ya enviado para no repetirlo si la persona vuelve a tocar el enlace.

alter table public.eventos_simulacion
  add column if not exists aviso_caida_en timestamptz;
