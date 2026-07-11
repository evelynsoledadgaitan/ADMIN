# Roadmap — bloques funcionales hacia la Beta completa

Ver `docs/decisiones/0025-alcance-definitivo-del-proyecto.md` para el alcance que enmarca todo este roadmap (sin Caja, sin Stock, Facturación interna sin ARCA/AFIP).

Auditoría del estado real, actualizada tras cerrar Cheques — **roadmap funcional de ADMIN v1.0 completo, más los 5 ítems del documento de mejoras**:

| Estado | Piezas |
|---|---|
| ✅ Completo | Autenticación/permisos (motor), Identidad visual, Motor de Pagos, Cuenta Corriente compartida, Clientes, Proveedores, Productos, Facturación, Empleados, Contador, Informes, Configuración, Notas, Cheques |

## Bloque 1 — Cerrar Clientes y Proveedores
Validación real de CUIT (dígito verificador, no solo longitud) y comprobante adjunto (Supabase Storage) para deudas/compras/movimientos — los 2 pendientes que arrastran ambos módulos desde varios Sprints atrás.

## Bloque 2 — Productos: categorías e importación
Administración completa de categorías (crear, editar, archivar, restaurar), soporte de importación con Excel (.xlsx) además de CSV, y mejoras a las funciones de importación/actualización ya existentes. **Sin costo, sin margen, sin precio sugerido** — decisión explícita, revertida después de haberse confirmado inicialmente (ver decisión `0025`). Productos queda exclusivamente orientado a listas de precios.

## Bloque 3 — Facturación interna
Comprobante propio de ADMIN, sin validez fiscal, exportable a PDF, integrado únicamente con Clientes y Cuenta Corriente. Toda factura genera automáticamente una Deuda, siempre — sin "condición de pago": documentar la operación y registrar el cobro son procesos separados, el cobro se hace después con el Motor de Pagos. Sin ARCA/AFIP, sin CAE, sin Web Services — por decisión de producto, no por límite de tiempo (ver `0025`).

## Bloque 4A — Empleados
Dato maestro, documentación (primera relación "uno a muchos" de adjuntos del sistema) e historial simple de pagos y adelantos — tabla propia, deliberadamente separada del Motor de Pagos, sin saldo ni cuenta corriente. Sin cálculos laborales, sin recibos de sueldo, sin AFIP, sin vacaciones ni aguinaldo automáticos (ver `0025` y decisión `0030`).

## Bloque 4B — Contador
Organizador de vencimientos, honorarios, impuestos y documentación — dos tablas, autocontenido, sin ningún cálculo automático de impuestos ni integración con ARCA (ver `0025` y decisión `0031`). Estado calculado en el momento (Pagado/Vencido/Próximo a vencer/Pendiente), colores de estado protagonistas, honorarios distinguidos de impuestos por ícono. Lenguaje visible: "Vencimiento", no "Obligación".

## Informes
Consulta, resume y presenta datos que ya existen en todos los módulos anteriores — sin tablas nuevas, sin gráficos obligatorios, sin cálculos contables. 5 categorías (Clientes, Proveedores, Facturación, Empleados, Contador), filtro de período compartido, exportar a PDF y Excel. Ver `0032`.

## Configuración
Parámetros generales de ADMIN — Datos del negocio, Usuarios y permisos, Categorías generales (Condición de IVA/Medios de pago/Modalidades de pago), Numeración. Sin ninguna tabla nueva: reutiliza `configuracion` (Fase 0, sin usar hasta ahora) y `usuarios`/`permisos`. Ver `0033`.

## Notas
El módulo más simple del roadmap — anotador rápido, sin categorías/prioridades/etiquetas. Primera y única excepción a la inmutabilidad de todo el sistema (se edita directo, sin anular). Tercera fuente de "Pendientes" en Inicio. Ver `0035`.

## Pendiente explícito — para el final del roadmap

**Alta de usuarios desde ADMIN (email + PIN de 4 dígitos)**: diseño ya conversado y casi cerrado, pospuesto a pedido explícito para el último Sprint del proyecto — es la primera pieza que necesita código de servidor (una Edge Function de Supabase, con el privilegio de creación de cuentas protegido ahí, nunca en el navegador). Separación confirmada: la administradora general sigue con email + contraseña sin cambios; los usuarios que ella cree usan PIN de 4 dígitos, riesgo aceptado explícitamente. Dos puntos ya marcados, pendientes de retomar: (1) hay que bajar el mínimo de contraseña a 4 caracteres en el panel de Supabase — un cambio manual, no de código, que afecta a toda la cuenta; (2) la protección contra intentos repetidos queda en el límite por IP que Supabase ya trae de fábrica — un bloqueo específico por cuenta sería una pieza aparte, no incluida todavía.

## Mejoras futuras registradas (sin implementar)

Ideas anotadas para más adelante, explícitamente no para esta etapa — se implementan cuando aparezca una necesidad real de uso, no por anticipación:

- **Informes como fuente de autocontrol** (decisión `0032`): que otros módulos se apoyen en las consultas de Informes para advertir situaciones que requieren atención (pendientes, inconsistencias, vencimientos), generalizando el patrón que ya usa "Pendientes" en Inicio.

## Metodología (sin cambios)
Cada bloque se diseña y se muestra antes de programarse — mismo criterio usado en todos los Sprints anteriores. Este documento es el mapa general; cada bloque va a tener su propio documento de arquitectura específico cuando le toque el turno.
