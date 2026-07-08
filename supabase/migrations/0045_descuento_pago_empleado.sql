-- 0045: descuento dentro de un pago (ej. "se le paga $50.000 semanales,
-- se le descuentan $3.000 de mercadería consumida esa semana") — un
-- ajuste de una sola vez, dentro de una única operación. Deliberadamente
-- NO es una cuenta corriente de empleados (confirmado explícitamente,
-- opción (a) sobre dos alternativas presentadas): no hay ningún saldo
-- que se acumule entre pagos, ni un historial de consumos aparte.
--
-- `monto` sigue significando exactamente lo mismo que hasta ahora: lo
-- efectivamente pagado (neto, después del descuento si lo hubo). El
-- monto bruto no se guarda aparte — se puede reconstruir siempre como
-- `monto + descuento`, mismo criterio de "no persistir lo que se puede
-- calcular" que ya usan Neto/IVA en Facturación.
--
-- `motivo_descuento` es obligatorio cuando hay descuento (el motivo es
-- la razón de ser del descuento — sin él, un pago más bajo que lo
-- esperado no se explica solo).

alter table public.pagos_empleados
  add column descuento numeric(12,2) check (descuento is null or descuento > 0),
  add column motivo_descuento text;

alter table public.pagos_empleados
  add constraint motivo_descuento_si_hay_descuento check (
    (descuento is null and motivo_descuento is null)
    or (descuento is not null and motivo_descuento is not null and motivo_descuento <> '')
  );
