-- 0050: "Datos del negocio" (nombre, logo, CUIT...) y "Numeración"
-- (prefijos) tienen que poder mostrarse en cualquier documento que
-- cualquier usuario autenticado genere (una factura, una impresión) —
-- no tiene sentido exigir el permiso `configuracion` solo para leer el
-- nombre del propio negocio. Se amplía el SELECT de `configuracion` a
-- cualquier usuario con sesión iniciada, mismo criterio que ya usan los
-- catálogos compartidos (`medios_pago`, `condiciones_iva`...) desde el
-- principio. Escribir (crear/modificar) sigue exigiendo el permiso
-- `configuracion`, sin cambios.

drop policy if exists configuracion_select on public.configuracion;
create policy configuracion_select on public.configuracion for select using (auth.uid() is not null);
