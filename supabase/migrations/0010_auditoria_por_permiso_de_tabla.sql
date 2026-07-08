-- 0010: quién puede leer el historial de auditoría de un registro
-- (Sprint 2, pregunta 4.2 — aprobada). Antes, audit_log solo era legible
-- con permiso de Informes. Se amplía: también puede verla quien tenga
-- permiso de VER la tabla de origen del evento (ej. alguien con permiso
-- de Clientes puede ver la auditoría de un cliente, sin necesitar permiso
-- de Informes). "La auditoría forma parte del historial del registro, no
-- del módulo Informes" — decisión del cliente.
--
-- Nota: `tabla` en audit_log coincide 1:1 con el nombre de módulo usado en
-- tiene_permiso() para clientes/proveedores/productos, así que no hace
-- falta ninguna tabla de mapeo adicional.

drop policy audit_log_select on public.audit_log;

create policy audit_log_select on public.audit_log for select
  using (
    public.tiene_permiso('informes', 'ver')
    or public.tiene_permiso(tabla, 'ver')
  );
