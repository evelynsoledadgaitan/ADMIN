-- 0057: RLS de Cheques — mismo patrón de siempre, permiso `cheques` (ya
-- existía en permisos.modulo desde la Fase 0). Se suma el prefijo
-- `cheques` a las políticas del bucket `adjuntos` (mismo mecanismo ya
-- usado 5 veces) para la foto del frente.

alter table public.cheques enable row level security;

create policy cheques_select on public.cheques for select
  using (public.tiene_permiso('cheques', 'ver'));
create policy cheques_insert on public.cheques for insert
  with check (public.tiene_permiso('cheques', 'crear'));
create policy cheques_update on public.cheques for update
  using (public.tiene_permiso('cheques', 'modificar'))
  with check (public.tiene_permiso('cheques', 'modificar'));

drop policy if exists adjuntos_select on storage.objects;
create policy adjuntos_select on storage.objects for select
  using (
    bucket_id = 'adjuntos' and (
      (split_part(name, '/', 1) = 'clientes' and public.tiene_permiso('clientes', 'ver'))
      or (split_part(name, '/', 1) = 'proveedores' and public.tiene_permiso('proveedores', 'ver'))
      or (split_part(name, '/', 1) = 'facturacion' and public.tiene_permiso('facturacion', 'ver'))
      or (split_part(name, '/', 1) = 'empleados' and public.tiene_permiso('empleados', 'ver'))
      or (split_part(name, '/', 1) = 'contador' and public.tiene_permiso('contador', 'ver'))
      or (split_part(name, '/', 1) = 'configuracion' and auth.uid() is not null)
      or (split_part(name, '/', 1) = 'cheques' and public.tiene_permiso('cheques', 'ver'))
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
      or (split_part(name, '/', 1) = 'configuracion' and public.tiene_permiso('configuracion', 'modificar'))
      or (split_part(name, '/', 1) = 'cheques' and public.tiene_permiso('cheques', 'crear'))
    )
  );
