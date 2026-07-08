-- 0051: prefijo `configuracion` en el bucket `adjuntos`, para el logo del
-- negocio. A diferencia del resto de los adjuntos del sistema, el logo
-- tiene que poder verse ampliamente (aparece en facturas impresas que
-- cualquier usuario puede generar) — mismo criterio que la migración
-- 0050 aplicó a la tabla `configuracion`: SELECT abierto a cualquier
-- usuario autenticado, INSERT restringido al permiso `configuracion`.

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
    )
  );
