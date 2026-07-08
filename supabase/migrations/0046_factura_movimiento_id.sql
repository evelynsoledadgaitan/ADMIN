-- 0046: Facturación — segundo flujo: una factura puede ser el comprobante
-- fiscal de un cobro YA registrado (en vez de generar una Deuda nueva).
-- Ver docs/sistemas/facturacion-dos-flujos-diseno.md y decisión 0029.
--
-- Una sola columna nueva, sin ningún campo "modo" redundante: cuál de los
-- dos flujos se usó queda determinado por los datos mismos —
--   Flujo A (genera deuda): movimiento_id vacío, existe una fila en
--     deudas_clientes con factura_id apuntando a esta factura.
--   Flujo B (comprobante de un cobro): movimiento_id apunta al cobro,
--     no existe ninguna deuda asociada.

alter table public.facturas
  add column movimiento_id uuid references public.movimientos(id);

create index facturas_movimiento_idx on public.facturas (movimiento_id) where movimiento_id is not null;
