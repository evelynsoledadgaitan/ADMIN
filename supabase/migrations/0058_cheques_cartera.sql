-- 0058: Cheques pasa a ser una cartera — un cheque se carga sin cliente
-- ni cobro, y recién se vincula cuando se lo usa de verdad como medio de
-- pago (decisión aprobada, da vuelta la decisión de la migración 0056).
-- Ver docs/sistemas/cheques-cartera-pagos-compuestos-diseno.md.
--
-- Hallazgo al revisar antes de escribir esto: `movimientos.cheque_id` ya
-- existía — se agregó en el primer Sprint del Motor de Pagos (migración
-- 0012), "preparado para cuando exista el módulo Cheques", sin FK
-- todavía porque `cheques` no existía en ese momento. Es exactamente el
-- lugar correcto para este vínculo — mejor que los dos punteros que se
-- habían agregado en `cheques` (`movimiento_cobro_id`/`movimiento_pago_id`,
-- migración 0056), que ahora quedan redundantes: un cheque puede
-- referenciarse desde más de un movimiento a lo largo de su vida (el
-- cobro que lo recibe, y más tarde el pago que lo entrega) — la relación
-- natural va de "movimiento" hacia "cheque", no al revés.

-- 1) Nuevo estado inicial: "en_cartera" — antes de usarse en cualquier cobro o pago.
alter table public.cheques drop constraint cheques_estado_check;
alter table public.cheques add constraint cheques_estado_check check (
  estado in ('en_cartera', 'disponible', 'entregado', 'depositado', 'acreditado', 'rechazado', 'anulado')
);
alter table public.cheques alter column estado set default 'en_cartera';

-- 2) cliente_id ya no es obligatorio al cargar el cheque — se completa
-- recién cuando se usa en un cobro real.
alter table public.cheques alter column cliente_id drop not null;
alter table public.cheques alter column movimiento_cobro_id drop not null;

-- 3) Migrar los vínculos que ya existan hacia movimientos.cheque_id, sin
-- perder nada de lo que ya se haya cargado con la versión anterior.
update public.movimientos m set cheque_id = c.id
from public.cheques c where c.movimiento_cobro_id = m.id;

update public.movimientos m set cheque_id = c.id
from public.cheques c where c.movimiento_pago_id = m.id;

-- 4) Ahora que `cheques` existe, se agrega la FK que la migración 0012
-- dejó pendiente a propósito, en su momento.
alter table public.movimientos
  add constraint movimientos_cheque_id_fkey foreign key (cheque_id) references public.cheques(id);

-- 5) Se sacan los punteros redundantes de `cheques` — toda la relación
-- vive ahora en `movimientos.cheque_id`.
alter table public.cheques drop column movimiento_cobro_id;
alter table public.cheques drop column movimiento_pago_id;
