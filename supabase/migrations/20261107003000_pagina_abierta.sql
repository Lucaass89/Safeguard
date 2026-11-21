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

create or replace function public.phishguard_ver_simulacion(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
begin
  if p_token is null or length(p_token) < 8 then
    return null;
  end if;

  update public.eventos_simulacion
    set pagina_abierta = true
  where token_unico = p_token
    and pagina_abierta = false;

  select
    split_part(e.nombre, ' ', 1) as nombre,
    ev.hizo_clic,
    ev.ingreso_datos,
    ev.completo_capacitacion,
    ev.vio_reconocimiento,
    c.canal,
    c.es_refuerzo,
    c.nombre_campana,
    p.titulo,
    p.asunto_mail,
    p.remitente_falso,
    p.cuerpo_html,
    p.categoria,
    p.nivel_dificultad,
    p.canal as canal_plantilla,
    p.metadata
  into r
  from public.eventos_simulacion ev
  join public.empleados e on e.id = ev.empleado_id
  join public.campanas c on c.id = ev.campana_id
  left join public.plantillas_phishing p on p.id = c.plantilla_id
  where ev.token_unico = p_token;

  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'nombre', r.nombre,
    'hizo_clic', r.hizo_clic,
    'ingreso_datos', r.ingreso_datos,
    'capacitado', r.completo_capacitacion,
    'reconocio', r.vio_reconocimiento,
    'canal', coalesce(r.canal, r.canal_plantilla, 'email'),
    'refuerzo', r.es_refuerzo,
    'titulo', r.titulo,
    'asunto', r.asunto_mail,
    'remitente', r.remitente_falso,
    'cuerpo', r.cuerpo_html,
    'categoria', r.categoria,
    'dificultad', r.nivel_dificultad,
    'leccion', coalesce(r.metadata->'lesson', '{}'::jsonb)
  );
end;
$$;
