-- El jefe necesita un historial de quién cayó y cuándo. Para eso el tablero
-- ahora devuelve la fecha del evento en cada simulación y el canal, el nombre
-- y la fecha de cada campaña.

create or replace function public.phishguard_tablero()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_org uuid := public.phishguard_org_id();
  v_org_nombre text;
begin
  if v_org is null then
    return jsonb_build_object(
      'organizacion', null,
      'empleados', '[]'::jsonb,
      'eventos', '[]'::jsonb,
      'campanas', '[]'::jsonb
    );
  end if;

  select nombre_empresa into v_org_nombre
  from public.organizaciones
  where id = v_org;

  return jsonb_build_object(
    'organizacion', jsonb_build_object(
      'id', v_org,
      'nombre_empresa', v_org_nombre
    ),
    'empleados', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', e.id,
          'nombre', e.nombre,
          'departamento', coalesce(e.departamento, 'General')
        )
        order by coalesce(e.departamento, 'General'), e.nombre
      )
      from public.empleados e
      where e.organizacion_id = v_org
        and e.estado = 'activo'
    ), '[]'::jsonb),
    'eventos', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', ev.id,
          'empleado_id', ev.empleado_id,
          'campana_id', ev.campana_id,
          'hizo_clic', ev.hizo_clic,
          'ingreso_datos', ev.ingreso_datos,
          'completo_capacitacion', ev.completo_capacitacion,
          'vio_reconocimiento', ev.vio_reconocimiento,
          'fecha_evento', ev.fecha_evento
        )
      )
      from public.eventos_simulacion ev
      join public.campanas c on c.id = ev.campana_id
      where c.organizacion_id = v_org
    ), '[]'::jsonb),
    'campanas', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'es_refuerzo', c.es_refuerzo,
          'nombre_campana', c.nombre_campana,
          'canal', c.canal,
          'creado_en', c.creado_en
        )
      )
      from public.campanas c
      where c.organizacion_id = v_org
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.phishguard_tablero() from public, anon;
grant execute on function public.phishguard_tablero() to authenticated;
