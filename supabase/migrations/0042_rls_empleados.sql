-- 0042: RLS de las 3 tablas de Empleados — mismo patrón de siempre,
-- permiso `empleados` (ya existía en permisos.modulo desde la Fase 0, no
-- hizo falta ampliar el CHECK). Se suma también el prefijo `empleados` a
-- las políticas del bucket `adjuntos` (mismo mecanismo ya usado para
-- clientes/proveedores/facturacion).

alter table public.empleados enable row level security;
alter table public.documentos_empleados enable row level security;
alter table public.pagos_empleados enable row level security;

create policy empleados_select on public.empleados for select
  using (public.tiene_permiso('empleados', 'ver'));
create policy empleados_insert on public.empleados for insert
  with check (public.tiene_permiso('empleados', 'crear'));
create policy empleados_update on public.empleados for update
  using (public.tiene_permiso('empleados', 'modificar') or public.tiene_permiso('empleados', 'archivar'))
  with check (public.tiene_permiso('empleados', 'modificar') or public.tiene_permiso('empleados', 'archivar'));

create policy documentos_empleados_select on public.documentos_empleados for select
  using (public.tiene_permiso('empleados', 'ver'));
create policy documentos_empleados_insert on public.documentos_empleados for insert
  with check (public.tiene_permiso('empleados', 'crear'));
create policy documentos_empleados_update on public.documentos_empleados for update
  using (public.tiene_permiso('empleados', 'archivar'))
  with check (public.tiene_permiso('empleados', 'archivar'));

create policy pagos_empleados_select on public.pagos_empleados for select
  using (public.tiene_permiso('empleados', 'ver'));
create policy pagos_empleados_insert on public.pagos_empleados for insert
  with check (public.tiene_permiso('empleados', 'crear'));
create policy pagos_empleados_update on public.pagos_empleados for update
  using (public.tiene_permiso('empleados', 'archivar'))
  with check (public.tiene_permiso('empleados', 'archivar'));

drop policy if exists adjuntos_select on storage.objects;
create policy adjuntos_select on storage.objects for select
  using (
    bucket_id = 'adjuntos' and (
      (split_part(name, '/', 1) = 'clientes' and public.tiene_permiso('clientes', 'ver'))
      or (split_part(name, '/', 1) = 'proveedores' and public.tiene_permiso('proveedores', 'ver'))
      or (split_part(name, '/', 1) = 'facturacion' and public.tiene_permiso('facturacion', 'ver'))
      or (split_part(name, '/', 1) = 'empleados' and public.tiene_permiso('empleados', 'ver'))
    )
  );

drop policy if exists adjuntos_insert on storage.objects;
create policy adjuntos_insert on storage.objects for insert
  with check (
    bucket_id = 'adjuntos' and (
      (split_part(name, '/', 1) = 'clientes' and public.tiene_permiso('clientes', 'crear'))
      or (split_part(name, '/', 1) = 'proveedores' and public.tiene_permiso('proveedores', 'crear'))
      or (split_part(name, '/', 1) = 'facturacion' and (public.tiene_permiso('facturacion', 'crear') or public.tiene_permiso('facturacion', 'modificar')))
      or (split_part(name, '/', 1) = 'empleados' and public.tiene_permiso('empleados', 'crear'))
    )
  );
