-- 0055: IVA por línea de artículo (cuarto ítem del documento "Mejoras
-- para implementar en ADMIN", el de mayor riesgo arquitectónico de los
-- 5). Ver docs/sistemas/iva-por-linea-diseno.md.
--
-- `facturas.iva` (una tasa para toda la factura) se reemplaza por
-- `factura_items.iva` (una tasa por línea) — permite mezclar Exento,
-- 10,5%, 21% y 27% dentro de la misma factura.
--
-- Las facturas ya cargadas no pierden nada: se copia la tasa que tenía
-- cada factura hacia todas sus líneas antes de sacar la columna vieja —
-- matemáticamente idéntico a lo que tenían, solo que ahora vive en el
-- lugar correcto.

alter table public.factura_items add column iva text;

update public.factura_items fi
set iva = f.iva
from public.facturas f
where f.id = fi.factura_id;

alter table public.factura_items
  alter column iva set not null,
  add constraint factura_items_iva_check check (iva in ('exento', '10.5', '21', '27'));

alter table public.facturas drop column iva;
