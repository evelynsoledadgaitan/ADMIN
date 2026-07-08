-- 0038: el bucket `adjuntos` (migración 0029) solo reconocía los
-- prefijos `clientes`/`proveedores` en sus políticas de Storage. El PDF
-- oficial de una factura se sube bajo el prefijo `facturacion` (mismo
-- criterio de ruta que el resto: {modulo}/{tabla}/{id}/{archivo}), así
-- que hace falta sumar esa rama — mismo patrón que ya se usó para poder
-- generar la Deuda automática con el permiso de facturación en vez del
-- de clientes (migración 0035).

drop policy if exists adjuntos_select on storage.objects;
create policy adjuntos_select on storage.objects for select
  using (
    bucket_id = 'adjuntos' and (
      (split_part(name, '/', 1) = 'clientes' and public.tiene_permiso('clientes', 'ver'))
      or (split_part(name, '/', 1) = 'proveedores' and public.tiene_permiso('proveedores', 'ver'))
      or (split_part(name, '/', 1) = 'facturacion' and public.tiene_permiso('facturacion', 'ver'))
    )
  );

drop policy if exists adjuntos_insert on storage.objects;
create policy adjuntos_insert on storage.objects for insert
  with check (
    bucket_id = 'adjuntos' and (
      (split_part(name, '/', 1) = 'clientes' and public.tiene_permiso('clientes', 'crear'))
      or (split_part(name, '/', 1) = 'proveedores' and public.tiene_permiso('proveedores', 'crear'))
      or (split_part(name, '/', 1) = 'facturacion' and public.tiene_permiso('facturacion', 'crear'))
      or (split_part(name, '/', 1) = 'facturacion' and public.tiene_permiso('facturacion', 'modificar'))
    )
  );
