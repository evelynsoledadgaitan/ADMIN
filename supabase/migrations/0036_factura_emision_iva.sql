-- 0036: registro del proceso administrativo de emisión — sigue sin haber
-- ninguna integración con ARCA/AFIP (decisión 0025, sin cambios): esto es
-- exclusivamente un lugar donde anotar a mano el número real que ARCA
-- emitió por fuera de ADMIN, y adjuntar el PDF que ARCA entregó.
--
-- `numero_externo`: editable (única excepción al resto de la factura,
-- que sigue siendo inmutable en todo lo demás) — reemplaza visualmente al
-- correlativo interno una vez cargado, sin que el interno (`numero_interno`)
-- deje de existir (sigue siendo la referencia técnica de siempre).
--
-- `estado` se calcula solo, con un trigger — nunca se setea a mano desde
-- la aplicación: pasa a 'emitida' automáticamente en el momento en que
-- existen tanto `numero_externo` como `comprobante_path` (el PDF real).
-- Esto evita que "Emitida" y "tiene los dos datos cargados" puedan
-- desincronizarse por error humano.
--
-- `iva`: una tasa por factura (no por línea) — Exento/10,5%/21%/27%.
-- Neto e importe de IVA no se guardan: se calculan siempre a partir de
-- `total` e `iva` (mismo criterio de "nunca persistir lo que se puede
-- calcular" que ya usa saldo_cliente()/saldo_proveedor()).

alter table public.facturas
  add column numero_externo text,
  add column estado text not null default 'pendiente_emitir' check (estado in ('pendiente_emitir', 'emitida')),
  add column comprobante_path text,
  add column iva text not null default 'exento' check (iva in ('exento', '10.5', '21', '27'));

create or replace function public.actualizar_estado_factura()
returns trigger
language plpgsql
as $$
begin
  if new.numero_externo is not null and new.comprobante_path is not null then
    new.estado := 'emitida';
  else
    new.estado := 'pendiente_emitir';
  end if;
  return new;
end;
$$;

create trigger set_estado_factura
  before insert or update on public.facturas
  for each row execute function public.actualizar_estado_factura();
