alter table public.empleados enable row level security;

drop policy if exists ev_select on public.eventos_simulacion;
drop policy if exists ev_insert on public.eventos_simulacion;
drop policy if exists ev_update on public.eventos_simulacion;
drop policy if exists ev_delete on public.eventos_simulacion;

create policy ev_select on public.eventos_simulacion
for select to authenticated
using (
  exists (
    select 1
    from public.campanas c
    where c.id = campana_id
      and c.organizacion_id = public.phishguard_org_id()
  )
);

create policy ev_insert on public.eventos_simulacion
for insert to authenticated
with check (
  exists (
    select 1
    from public.campanas c
    where c.id = campana_id
      and c.organizacion_id = public.phishguard_org_id()
  )
);

create policy ev_update on public.eventos_simulacion
for update to authenticated
using (
  exists (
    select 1
    from public.campanas c
    where c.id = campana_id
      and c.organizacion_id = public.phishguard_org_id()
  )
)
with check (
  exists (
    select 1
    from public.campanas c
    where c.id = campana_id
      and c.organizacion_id = public.phishguard_org_id()
  )
);

create policy ev_delete on public.eventos_simulacion
for delete to authenticated
using (
  exists (
    select 1
    from public.campanas c
    where c.id = campana_id
      and c.organizacion_id = public.phishguard_org_id()
  )
);

revoke all on public.eventos_simulacion from anon;
grant select, insert, update, delete on public.eventos_simulacion to authenticated;

alter table public.eventos_simulacion enable row level security;
