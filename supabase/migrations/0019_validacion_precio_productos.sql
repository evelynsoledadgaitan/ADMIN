-- 0019: precio_actual no tenía CHECK desde la Fase 0 (paridad con monto de
-- Compras/Movimientos). Sprint 5, sección 2 del documento de arquitectura.
alter table public.productos
  add constraint productos_precio_positivo
    check (precio_actual > 0);
