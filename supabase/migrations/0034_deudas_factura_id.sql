-- 0034: trazabilidad entre una Deuda y la Factura que la generó — opcional
-- (las deudas que no vienen de una factura siguen sin este dato). Permite
-- ir de una a la otra desde cualquiera de las dos pantallas.

alter table public.deudas_clientes
  add column factura_id uuid references public.facturas(id);

create index deudas_clientes_factura_idx on public.deudas_clientes (factura_id) where factura_id is not null;
