-- 0037: permite editar número real (ARCA) y adjunto de una factura sin
-- que eso sea "anular" — usa el permiso `modificar`, que ya existe en el
-- motor de permisos (`tiene_permiso`) desde la Fase 0, pero que
-- Facturación no había usado hasta ahora (nació 100% inmutable). Anular
-- sigue usando el permiso `archivar`, sin cambios.

drop policy if exists facturas_update on public.facturas;

create policy facturas_update on public.facturas for update
  using (
    public.tiene_permiso('facturacion', 'modificar')
    or public.tiene_permiso('facturacion', 'archivar')
  )
  with check (
    public.tiene_permiso('facturacion', 'modificar')
    or public.tiene_permiso('facturacion', 'archivar')
  );
