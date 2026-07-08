# 0029 — Bloque 3: Facturación interna

## Decisión

Facturación es un módulo nuevo, integrado únicamente con Clientes y Cuenta Corriente (nunca con Proveedores, nunca con Stock, nunca con Caja, nunca con ARCA/AFIP — ver decisión `0025`). Genera un comprobante propio de ADMIN (`facturas` + `factura_items`), sin validez fiscal, imprimible/exportable a PDF vía el diálogo de impresión nativo del navegador.

**Principio central, corregido antes de la primera entrega**: documentar una operación (facturar) y registrar un movimiento de dinero (cobrar) son procesos completamente separados. **No existe "condición de pago" en Facturación.** Toda factura, sin excepción, genera automáticamente su Deuda correspondiente en `deudas_clientes` (`origen = 'factura'`, con `factura_id` para trazabilidad). El cobro de esa deuda se registra después, aparte, con el Motor de Pagos que ya existe — Facturación nunca sabe ni le importa si algo ya se cobró.

La primera versión de este diseño incluía un campo `condicion_pago` ('contado' | 'cuenta_corriente') que solo generaba la Deuda cuando la condición era "cuenta corriente". Se corrigió **antes de la primera entrega** — no llegó a mandarse ningún parche con esa versión — porque mezclaba dos conceptos que el cliente definió como estrictamente separados: una factura "contado" bajo ese diseño no hubiera dejado ningún rastro en la Cuenta Corriente, lo cual contradice la idea de que facturar siempre documenta una operación real del negocio, haya cobro inmediato o no.

**Líneas de factura son una fotografía, no una referencia en vivo**: `descripcion` y `precio_unitario` se copian del producto al momento de facturar (o se tipean a mano, si es un concepto libre) — si el precio del producto cambia después, las facturas viejas no cambian retroactivamente. Una línea puede o no estar asociada a un producto del catálogo (`producto_id` nullable), y una misma factura puede combinar líneas con y sin producto.

**Anular una factura anula automáticamente la deuda que generó** (decisión aprobada 5.1 del documento de diseño) — sin eso, quedaría una deuda "huérfana" de una factura inexistente. Por eso el listado de Facturación no ofrece "Restaurar" sobre una factura anulada: restaurarla sin poder restaurar la deuda dejaría el sistema inconsistente.

**Permiso propio `facturacion`**, con un puente de RLS hacia `deudas_clientes`: quien tiene permiso para facturar puede generar la Deuda automática sin necesitar además el permiso de Clientes (decisión aprobada 5.2).

**"Nueva factura" es un quinto acceso rápido en Inicio** — mismo patrón de 2 toques que los otros 4 (elegir cliente, cargar), aunque acá el segundo paso navega a una pantalla completa en vez de abrir un diálogo, porque una factura con líneas necesita más espacio.

## Por qué

Es la aplicación del documento de diseño ya aprobado (`docs/sistemas/bloque3-facturacion-diseno.md`), con la corrección de alcance incorporada antes de programar el detalle final. Vale la pena resaltar el proceso: la corrección llegó después de que el diseño y buena parte del código ya estaban escritos, y se resolvió editando los archivos existentes en vez de agregar una migración que deshiciera otra — porque nada de esa primera versión había llegado a entregarse todavía. Si ya se hubiera entregado un parche, la corrección hubiera sido una migración nueva (`alter table facturas drop column condicion_pago`), no una edición retroactiva.

## Alcance de lo implementado
- Migraciones `0032` (permiso `facturacion`), `0033` (`facturas`, `factura_items`), `0034` (`factura_id` en `deudas_clientes`), `0035` (RLS + puente de permisos).
- `src/modules/facturacion/`: tipos, validaciones, hooks (listar, ver, registrar, anular), `ListadoFacturacion`, `NuevaFactura`, `FichaFactura`.
- Facturación como módulo visible en el Menú y el Sidebar (categoría Comercial).
- Quinto acceso rápido "Nueva factura" en la Pantalla Principal.
- Enlace "Facturas" + botón "Nueva factura" desde el Estado de Cuenta del Cliente.
- Impresión/exportación vía `window.print()` con estilos `print:` — sin librerías de PDF nuevas.

## Extensión — registro del proceso de emisión (post-entrega)

Después de la primera entrega, se agregó la posibilidad de anotar el número real emitido en ARCA y adjuntar el PDF oficial — **sin que esto sea una integración con ARCA/AFIP**: sigue siendo 100% manual, el usuario emite la factura real por fuera de ADMIN y después vuelve a cargar esos dos datos acá, para tener el registro administrativo completo. No hay ninguna llamada a ningún servicio externo.

- **`numero_externo`** (editable): la única excepción a la inmutabilidad de una factura — reemplaza visualmente al correlativo interno (`FAC-000001`) una vez cargado, sin que el interno deje de existir.
- **`estado`** ('pendiente_emitir' | 'emitida'): calculado por un trigger, nunca por la aplicación — pasa a "Emitida" automáticamente en el momento en que existen tanto `numero_externo` como `comprobante_path` (el PDF). Evita que el estado se desincronice de los datos reales.
- **`comprobante_path`**: reutiliza el mismo sistema de adjuntos de Clientes/Proveedores (`ArchivoAdjunto`/`VisorAdjunto`, Bloque 1) — sin ningún componente nuevo.
- **`iva`** ('exento' | '10.5' | '21' | '27'), una tasa por factura: Neto e importe de IVA se calculan siempre a partir de `total` e `iva` (nunca se guardan — mismo criterio que `saldo_cliente()`).
- **Permiso `modificar` en Facturación**: hasta ahora la RLS de `facturas` solo usaba `crear`/`archivar` (una factura nacía y se anulaba, nunca se editaba). Esta es la primera vez que Facturación usa el cuarto permiso (`modificar`) que el motor de permisos ya tenía desde la Fase 0.
- **Bucket de Storage**: se sumó el prefijo `facturacion` a las políticas de `adjuntos` (antes solo reconocía `clientes`/`proveedores`).

### Migraciones de esta extensión
`0036` (columnas + trigger de estado), `0037` (RLS modificar), `0038` (Storage: prefijo facturacion).

## Sprint 3.1 — Pulido final (cierre del módulo)

Exclusivamente experiencia de uso sobre lo ya construido — sin migraciones nuevas, sin lógica de negocio nueva.

- **Panel resumen del listado**: 4 indicadores (pendientes, emitidas, facturado del mes, cantidad del mes) calculados en el cliente sobre la misma lista que ya trae `useFacturas()` — cero consultas nuevas.
- **Filtro por Estado** en el listado (Todos/Pendiente de emitir/Emitida), con soporte para `?estado=pendiente` en la URL.
- **Resumen económico más visible** en la Ficha: Neto/IVA/Total pasan a un panel destacado (fondo propio, Total en tipografía grande) en vez de texto chico alineado a la derecha.
- **Pendientes en Inicio**: primer disparador real de esa sección (hasta ahora un `TODO` desde la identidad visual definitiva) — una tarjeta de facturas pendientes de emitir, que lleva directo al listado de Facturación ya filtrado.
- **Indicador en Clientes**: un ícono chico junto al nombre cuando ese cliente tiene al menos una factura pendiente de emitir (`useClientesConFacturasPendientes()`, un Set de ids, sin cantidades — solo existencia).

Con esto, y sin ninguna migración nueva, el módulo Facturación queda cerrado.

## Reapertura puntual — dos flujos (genera deuda / comprobante de un cobro existente)

Después de dar Facturación por cerrada (Sprint 3.1), aparece un caso de uso real: cobrar primero, emitir la factura real en ARCA después, y asociarla al cobro ya existente sin generar una deuda duplicada. No es un cambio de opinión sobre el alcance — es un caso de uso encontrado usando el sistema, mismo criterio que ya se aplicó para reabrir Empleados si aparece un error real.

**Esto no es la "condición de pago" que se descartó antes.** Ahí la factura decidía por sí sola si generaba o no un cobro. Acá el cobro **ya existe**, registrado de forma completamente independiente (Motor de Pagos, como siempre) — la factura solo se asocia a algo que ya pasó. Sigue reforzando, no contradiciendo, la separación entre documentar una operación y registrar un movimiento de dinero.

**Una sola columna nueva** (`facturas.movimiento_id`), sin ningún campo "modo" redundante — cuál de los dos flujos se usó queda determinado por los datos: Flujo A (genera deuda) tiene una `deudas_clientes` con `factura_id` apuntando a la factura; Flujo B (comprobante de un cobro) tiene `movimiento_id` cargado y ninguna deuda asociada.

**El usuario elige explícitamente**, sin valor por defecto (decisión aprobada) — el formulario no deja guardar sin elegir una de las dos opciones. El selector de cobros (`SeleccionarCobroDialog`, componente propio, no reutiliza `SelectorEntidadDialog` porque hacen falta 4 datos por fila) muestra **todos** los cobros sin factura del cliente, sin límite de tiempo (decisión aprobada, punto 2) — con buscador para cuando la lista crezca.

**Si el monto de la factura no coincide con el del cobro elegido**, no se bloquea (decisión aprobada, punto 1) — se muestra una advertencia visible (motivos legítimos: redondeos, descuentos, bonificaciones) y se pide una confirmación explícita antes de continuar.

**Anular una factura del Flujo B no toca el cobro para nada** — el cobro existía antes que la factura y sigue existiendo después; solo se pierde el comprobante fiscal. (El código de anulación ya funcionaba así sin cambios: intenta anular una deuda vinculada, y si no hay ninguna, no hace nada — comportamiento que ya cubría este caso de antes, sin tener que tocarlo.)

### Migración de esta reapertura
`0046` (`facturas.movimiento_id`).

## Alternativas descartadas
- **Condición de pago con generación condicional de la Deuda**: diseño inicial, corregido antes de entregar — ver la sección de decisión arriba.
- **Transacción de base de datos explícita para el alta/anulación** (envolver factura + items + deuda en una única transacción SQL): se mantuvo el criterio ya establecido en todo el sistema (inserts/updates secuenciales desde el cliente, sin transacciones explícitas) — es una limitación conocida y aceptada, no específica de este módulo.
