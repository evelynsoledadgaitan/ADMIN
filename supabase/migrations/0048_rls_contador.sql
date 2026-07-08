-- 0048: RLS de Contador — mismo patrón que Empleados, permiso `contador`
-- (ya existía en permisos.modulo desde la Fase 0). Se suma el prefijo
-- `contador` a las políticas del bucket `adjuntos` (mismo mecanismo ya
-- usado 4 veces: clientes, proveedores, facturacion, empleados).

alter table public.obligaciones_contador enable row level security;
alter table public.documentos_contador enable row level security;

create policy obligaciones_contador_select on public.obligaciones_contador for select
  using (public.tiene_permiso('contador', 'ver'));
create policy obligaciones_contador_insert on public.obligaciones_contador for insert
  with check (public.tiene_permiso('contador', 'crear'));
create policy obligaciones_contador_update on public.obligaciones_contador for update
  using (public.tiene_permiso('contador', 'modificar') or public.tiene_permiso('contador', 'archivar'))
  with check (public.tiene_permiso('contador', 'modificar') or public.tiene_permiso('contador', 'archivar'));

create policy documentos_contador_select on public.documentos_contador for select
  using (public.tiene_permiso('contador', 'ver'));
create policy documentos_contador_insert on public.documentos_contador for insert
  with check (public.tiene_permiso('contador', 'crear'));
create policy documentos_contador_update on public.documentos_contador for update
  using (public.tiene_permiso('contador', 'archivar'))
  with check (public.tiene_permiso('contador', 'archivar'));

drop policy if exists adjuntos_select on storage.objects;
create policy adjuntos_select on storage.objects for select
  using (
    bucket_id = 'adjuntos' and (
      (split_part(name, '/', 1) = 'clientes' and public.tiene_permiso('clientes', 'ver'))
      or (split_part(name, '/', 1) = 'proveedores' and public.tiene_permiso('proveedores', 'ver'))
      or (split_part(name, '/', 1) = 'facturacion' and public.tiene_permiso('facturacion', 'ver'))
      or (split_part(name, '/', 1) = 'empleados' and public.tiene_permiso('empleados', 'ver'))
      or (split_part(name, '/', 1) = 'contador' and public.tiene_permiso('contador', 'ver'))
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
      or (split_part(name, '/', 1) = 'contador' and (public.tiene_permiso('contador', 'crear') or public.tiene_permiso('contador', 'modificar')))
    )
  );
