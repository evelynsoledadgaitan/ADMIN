-- 0029: bucket de Storage para comprobantes adjuntos — genérico para
-- cualquier documento de cualquier módulo (ver
-- docs/sistemas/comprobante-adjunto-interfaz.md). Privado (no público):
-- todo acceso pasa por URL firmada de corta duración, protegida por las
-- mismas políticas de `tiene_permiso()` que ya rigen el resto del sistema.
--
-- La ruta de cada archivo es {modulo}/{tabla}/{registroId}/{archivo} — las
-- políticas de acá abajo solo miran el primer segmento (`modulo`), así que
-- agregar un módulo nuevo en el futuro (Facturación, Empleados...) es
-- una rama más en el `case`, no una tabla ni un mecanismo nuevo.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('adjuntos', 'adjuntos', false, 5242880, array['application/pdf', 'image/jpeg', 'image/png']);

create policy adjuntos_select on storage.objects for select
  using (
    bucket_id = 'adjuntos' and (
      (split_part(name, '/', 1) = 'clientes' and public.tiene_permiso('clientes', 'ver'))
      or (split_part(name, '/', 1) = 'proveedores' and public.tiene_permiso('proveedores', 'ver'))
    )
  );

create policy adjuntos_insert on storage.objects for insert
  with check (
    bucket_id = 'adjuntos' and (
      (split_part(name, '/', 1) = 'clientes' and public.tiene_permiso('clientes', 'crear'))
      or (split_part(name, '/', 1) = 'proveedores' and public.tiene_permiso('proveedores', 'crear'))
    )
  );

-- No hay política de UPDATE/DELETE: un adjunto es tan inmutable como el
-- registro al que pertenece (mismo criterio que deudas_clientes/compras/
-- movimientos) — se sube una vez, junto con el alta, y no se toca más.
