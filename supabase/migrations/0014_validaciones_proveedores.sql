-- 0014: paridad con Clientes — proveedores.cuit no tenía validación de
-- formato en la base desde la Fase 0 (migración 0009 solo cubrió clientes).
-- Sprint 4, sección 2.1 del documento de arquitectura de Proveedores.

alter table public.proveedores
  add constraint proveedores_cuit_formato
    check (cuit is null or cuit ~ '^\d{11}$');
