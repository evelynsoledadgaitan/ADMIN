-- 0043: completa el formulario de Registrar pago/adelanto con los campos
-- que faltaban (pedido explícito): `concepto` (obligatorio — "Sueldo
-- quincena 1", "Adelanto para gastos médicos"...) reemplaza a `nota`, que
-- era opcional y no alcanzaba; `numero_comprobante` es nuevo y opcional,
-- mismo patrón que ya usan deudas_clientes/compras.
--
-- El backfill (`update ... where concepto is null`) es necesario porque
-- `nota` era opcional — cualquier fila ya cargada sin nota no puede
-- quedar con `concepto` vacío una vez que la columna pasa a NOT NULL.

alter table public.pagos_empleados rename column nota to concepto;

update public.pagos_empleados
set concepto = case tipo when 'pago' then 'Pago' else 'Adelanto' end
where concepto is null;

alter table public.pagos_empleados alter column concepto set not null;

alter table public.pagos_empleados add column numero_comprobante text;
