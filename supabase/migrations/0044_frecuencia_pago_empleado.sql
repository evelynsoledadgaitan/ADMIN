-- 0044: "Frecuencia de pago" — dato puramente informativo (pedido
-- explícito: "sin cálculos automáticos"). No dispara nada, no calcula
-- nada, es un campo más en la Ficha para saber de un vistazo si a este
-- empleado se le paga semanal, quincenal, mensual, por hora, por jornada
-- u otra cosa.

alter table public.empleados
  add column frecuencia_pago text check (frecuencia_pago in (
    'semanal', 'quincenal', 'mensual', 'por_hora', 'por_jornada', 'otro'
  ));
