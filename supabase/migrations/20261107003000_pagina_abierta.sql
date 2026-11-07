alter table public.eventos_simulacion
  rename column mail_abierto to pagina_abierta;

create or replace function public.phishguard_registrar(p_token text, p_evento text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_evento not in ('abrio', 'clic', 'datos', 'capacitacion', 'reconocimiento') then
    raise exception 'Evento inválido';
  end if;

  update public.eventos_simulacion
    set
      pagina_abierta = pagina_abierta or p_evento in ('abrio', 'clic', 'datos'),
      hizo_clic = hizo_clic or p_evento in ('clic', 'datos'),
      ingreso_datos = ingreso_datos or p_evento = 'datos',
      completo_capacitacion = completo_capacitacion or p_evento = 'capacitacion',
      vio_reconocimiento = vio_reconocimiento or p_evento = 'reconocimiento',
      fecha_evento = now()
  where token_unico = p_token;

  if not found then
    return null;
  end if;

  return public.phishguard_ver_simulacion(p_token);
end;
$$;
