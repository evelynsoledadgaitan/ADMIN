# Changelog

Historial de cambios de ADMIN, un Sprint por entrada. Formato acordado a partir del Sprint 2 — ✅ Agregado / 🔧 Cambios / 🐞 Errores corregidos / ⚠️ Pendiente. Más reciente arriba.

---

## Cheques — corrección del selector de Cliente

Ver decisión `0040` (sección "Corrección").

### 🐞 Errores corregidos
- "Nuevo cheque" usaba un desplegable simple para elegir el cliente, incómodo de recorrer en el celular con una lista larga y sin poder escribir para filtrar. Reemplazado por el mismo buscador (`SelectorEntidadDialog`) que ya usa el resto de la app — incluida la propia Ficha del cheque al elegir un proveedor.

---

## Módulo Cheques (completo)

Quinto y último ítem del documento "Mejoras para implementar en ADMIN" — se completan los 5. Ver `docs/sistemas/cheques-diseno.md` y decisión `0040`.

### ✅ Agregado
- **Cheques**: alta (genera un cobro automático al cliente), listado con 7 pestañas por estado (Disponibles/Entregados/Depositados/Acreditados/Rechazados/Anulados/Todos), Ficha con acciones según el estado.
- **Depositar** (sin generar ningún movimiento nuevo — el ingreso ya se registró al recibirlo), **Marcar acreditado**, **Marcar rechazado** (anula el cobro o el pago vinculado, según de qué estado venía), **Entregar a un proveedor** (genera un pago automático), **Anular**.
- **Trazabilidad**: la Ficha muestra a qué proveedor se entregó un cheque y un enlace directo a su Estado de Cuenta.
- **Actividad**: historial automático de cada cambio de estado, reutilizando `HistorialAuditoria` — sin ninguna tabla nueva para esto.
- Quinta fuente de "Pendientes" en Inicio: cheques disponibles próximos a vencer (7 días).

### 🔧 Cambios
- `HistorialAuditoria` acepta `cheques`.
- El medio de pago "Cheque" (catálogo desde la Fase 0, sin usar hasta ahora) queda conectado por primera vez.

### 🐞 Errores corregidos
- Ninguno.

### ⚠️ Pendiente
- Con los 5 ítems del documento de mejoras completos, quedan las Etapas 2 y 3 de la revisión integral (consistencia/UX, rendimiento) y, al final de todo, el alta de usuarios con PIN.

---

## Facturación — IVA por línea de artículo

Cuarto ítem del documento "Mejoras para implementar en ADMIN" (orden: Facturación → Siempre factura → Informes → **IVA por línea** → Cheques) — el de mayor riesgo arquitectónico de los 5. Ver `docs/sistemas/iva-por-linea-diseno.md` y decisión `0039`.

### ✅ Agregado
- Cada línea de una factura tiene su propia tasa de IVA (Exento/10,5%/21%/27%) — se pueden mezclar tasas distintas dentro de la misma factura.
- Resumen económico con desglose por tasa cuando corresponde (Neto + IVA por cada tasa presente) — con una sola tasa, se ve igual que antes.
- Una línea nueva hereda la tasa de la anterior; la primera línea de una factura nueva arranca en Exento.
- Columna IVA en la tabla de líneas de la Ficha de factura.

### 🔧 Cambios
- `facturas.iva` (una tasa por factura) reemplazada por `factura_items.iva` (una tasa por línea) — con migración de datos: las facturas ya cargadas mantienen su tasa, copiada a cada una de sus líneas.
- `calcularNetoEIva(total, iva)` reemplazada por `calcularDesgloseIva(items)`.

### 🐞 Errores corregidos
- Ninguno.

### ⚠️ Pendiente
- Último ítem del orden acordado: módulo Cheques completo.

---

## Informes — períodos, ordenamiento, filtros, resumen

Tercer ítem del documento "Mejoras para implementar en ADMIN" (orden: Facturación → Siempre factura → **Informes** → IVA por línea → Cheques). Ver `docs/sistemas/informes-mejoras-diseno.md` y decisión `0038`.

### ✅ Agregado
- **Ordenar por**: Mayor deuda / Menor deuda / A-Z / Z-A / Más reciente actividad / Más antigua actividad — igual en Clientes y Proveedores.
- **Filtrar por**: Todos / Sólo con deuda / Sólo saldo a favor / Sin movimientos (saldo $0) + rango de importe (Desde/Hasta, en valor absoluto).
- **Resumen superior**: cantidad con deuda, total adeudado, promedio de deuda — calculado sobre lo que está filtrado en pantalla.
- **"Mes anterior" / "Año anterior"** en el filtro de período — a diferencia de los demás (que siempre llegan hasta hoy), son el período calendario completo ya cerrado.
- "Más reciente/antigua actividad" — sin ninguna consulta nueva a la base: se extendieron `saldos_clientes()`/`saldos_proveedores()` (funciones SQL ya existentes) para devolver también la fecha, en la misma llamada de siempre.

### 🔧 Cambios
- Los informes de Clientes y Proveedores pasan de 3 secciones fijas a una sola, con los controles nuevos — menos código repetido, más flexible.
- `useSaldosClientesConActividad`/`useSaldosProveedoresConActividad` (nuevos) — los hooks existentes (`useSaldosClientes`/`useSaldosProveedores`, usados en 8 lugares de los listados) no se tocaron.

### 🐞 Errores corregidos
- Ninguno.

### ⚠️ Pendiente
- Siguiente ítem del orden acordado: IVA por línea de artículo — el de mayor riesgo arquitectónico de los 5.

---

## Clientes "Siempre factura" — tareas pendientes de facturación

Segundo ítem del documento "Mejoras para implementar en ADMIN" (orden: Facturación → **Siempre factura** → Informes → IVA por línea → Cheques). Ver `docs/sistemas/siempre-factura-diseno.md` y decisión `0037`.

### ✅ Agregado
- **Pendientes de facturar** (`/facturacion/pendientes`): deudas sin factura de clientes "Siempre factura" — nada guardado en ninguna tabla nueva, se deriva en el momento. Vive en Facturación, no en Informes (pedido explícito: "las tareas pendientes son trabajo diario, no análisis").
- Cuarta fuente de "Pendientes" en Inicio — con una sola pendiente, va directo a Nueva Factura con esa deuda ya elegida.
- Indicador "Facturación pendiente: N deuda(s)" en la Ficha del cliente, solo para clientes "Siempre factura" con algo pendiente.
- `Nueva factura` acepta `?deuda=ID` — preselecciona el Flujo C automáticamente.

### 🔧 Cambios
- `TablaInforme` (vivía en Informes) se renombra a `TablaSimple` y se muda a `core/components/` — la necesitaba también Facturación.

### 🐞 Errores corregidos
- **Anular una factura del Flujo C** anulaba también la deuda vinculada, como si fuera del Flujo A — corregido: ahora se distingue por `origen`, y el Flujo C solo desvincula (`factura_id = null`), sin anular una deuda que existía antes y de forma independiente.

### ⚠️ Pendiente
- Siguiente ítem del orden acordado: mejoras a Informes (períodos, ordenamientos, filtros, resumen).

---

## Facturación — tercer flujo: comprobante de una deuda ya generada

Primero de 5 ítems del documento "Mejoras para implementar en ADMIN" (orden acordado: Facturación → tareas de "Siempre factura" → Informes → IVA por línea → Cheques). Ver `docs/sistemas/facturacion-tercer-flujo-diseno.md` y decisión `0029`.

### ✅ Agregado
- Tercera opción en "Nueva factura": "Es el comprobante de una deuda ya generada" — asocia la factura a una deuda existente sin crear una nueva.
- Precompletado automático de una línea (descripción + monto de la deuda elegida) — editable.
- Indicador visual 🟢 Facturada / 🟡 Sin factura en el libro contable de Clientes, junto a cada deuda — calculado en el momento a partir de `factura_id`, sin guardar ningún dato nuevo.
- `SeleccionarDeudaDialog`: mismo patrón que el selector de cobros del Flujo B.
- Advertencia (no bloqueante) si el monto de la factura no coincide con el de la deuda elegida.

### 🔧 Cambios
- `FilaLibroCC` admite un `badge` opcional — solo en el frontend, sin ninguna columna nueva en la base.

### 🐞 Errores corregidos
- Ninguno.

### ⚠️ Pendiente
- Siguiente ítem del orden acordado: tareas pendientes de facturación para clientes "Siempre factura".

---

## Recuperación de contraseña

Ver decisión `0036`.

### ✅ Agregado
- "¿Olvidaste tu contraseña?" en Login — envía el email de recuperación (`resetPasswordForEmail`).
- `/update-password`: pantalla nueva, pública, para elegir la contraseña nueva — detecta el evento `PASSWORD_RECOVERY` de dos formas (evento + sesión ya activa al montar) para evitar una condición de carrera real.

### 🔧 Cambios
- Ninguno a `AuthProvider`, `signInWithPassword`, permisos ni arquitectura — todo nuevo, agregado sin tocar lo existente.

### 🐞 Errores corregidos
- Ninguno — no existía ningún flujo de recuperación antes de esto.

### ⚠️ Pendiente
- **Paso manual en Supabase, fuera del código**: agregar `http://localhost:5173/update-password` y la URL real de Vercel a "Redirect URLs" en Authentication → URL Configuration. Sin esto, el enlace del email no funciona.

---

## Notas — "Nueva nota" en Inicio

Ver decisión `0035` (sección "Ajuste").

### ✅ Agregado
- **"Nueva nota"**, sexto acceso rápido en Inicio — abre el diálogo directo, sin elegir cliente/proveedor (a diferencia de los otros 5).

### 🔧 Cambios
- `entidadTipo` pasa a ser opcional en `AccionRapida`.

### 🐞 Errores corregidos
- Ninguno — el recordatorio "hasta resolverla" ya funcionaba así desde la entrega original, se confirmó sin necesitar cambios.

---

## Notas — cierre del roadmap funcional de ADMIN v1.0

El módulo más simple de todo el sistema, y el último del roadmap original. Ver `docs/sistemas/notas-diseno.md` y decisión `0035`.

### ✅ Agregado
- **Notas**: crear, editar (primera y única excepción a la inmutabilidad de ADMIN — se edita directo, sin anular), marcar como realizada (tachado, sin desaparecer), archivar, buscar por título/descripción.
- **Un único diálogo** para crear y editar — sin Ficha independiente.
- **Tercera fuente de "Pendientes" en Inicio**: recordatorios de hoy o vencidos, junto a Facturación y Contador. Con una sola nota pendiente, la tarjeta abre esa nota directo; con más de una, lleva al listado.

### 🔧 Cambios
- `useArchivable`/`useRestaurar` aceptan `notas`.

### 🐞 Errores corregidos
- Ninguno.

### ⚠️ Pendiente
- Con Notas cerrado, el desarrollo funcional de ADMIN v1.0 queda completo. Queda pendiente, pospuesto a pedido explícito para el final: alta de usuarios con PIN (después de la puesta en producción).

---

## Revisión integral v1.0 — Etapa 1: limpieza interna

Primera de 3 etapas hacia la versión 1.0 de producción. Sin funcionalidad nueva, sin cambios de arquitectura ni de flujo — solo limpieza. Ver decisión `0034`.

### ✅ Agregado
- `core/lib/validacion.ts`, `core/lib/texto.ts` (utilidades centralizadas nuevas).
- `core/components/BadgeArchivado.tsx` (`BadgeArchivado` + `BadgeArchivadoChico`).
- Validación en Datos del negocio (nombre obligatorio, formato de email) y Numeración (ningún prefijo vacío).

### 🔧 Cambios
- `hoyISO()`, `hayErrores()`, `normalizarParaOrden()` centralizadas — 16 copias idénticas repartidas en 14 archivos pasan a una sola implementación cada una.
- 10 archivos usan ahora el badge de Archivado/Anulado compartido, en vez de repetir el mismo bloque de clases — incluye una pequeña inconsistencia corregida (`ListadoEmpleados` no tenía `shrink-0`, ahora es igual a los otros 3 listados).

### 🐞 Errores corregidos
- Ninguno de comportamiento — `tokens.ts` (código muerto eliminado) tenía un valor de color que ni siquiera coincidía con el real usado en `vite.config.ts`, pero al no estar conectado a nada no llegaba a producir un error visible.

### ⚠️ Pendiente
- Etapa 2 (consistencia y UX): botón Volver unificado, flujo Confirmar+Anular centralizado, consultas redundantes de FichaEmpleado, buscador de Contador.
- Etapa 3 (rendimiento): `manualChunks`, verificación del bundle.

---

## Configuración

Parámetros generales de ADMIN — sin ninguna tabla nueva, reutilizando la tabla `configuracion` (Fase 0, nunca usada) y `usuarios`/`permisos` (completas, sin pantalla hasta ahora). Ver `docs/sistemas/configuracion-diseno.md` y decisión `0033`.

### ✅ Agregado
- **Datos del negocio**: nombre, CUIT, dirección, teléfono, email, ciudad, provincia, condición de IVA, observaciones, logo — reutilizado de inmediato en el encabezado impreso de las facturas (antes decía "ADMIN" fijo).
- **Usuarios y permisos**: activar/desactivar usuarios existentes, matriz de Ver/Crear/Modificar/Archivar por módulo. Sin alta de usuarios nuevos (límite técnico real — el navegador no puede crear cuentas de forma segura; el alta sigue siendo manual desde Supabase).
- **Categorías generales**: administración completa (crear/editar/archivar/restaurar) de Condición de IVA, Medios de pago y Modalidades de pago de Empleados — los 3 catálogos que hasta ahora solo se editaban por SQL directo.
- **Numeración**: prefijo editable de cada comprobante (Deudas, Ajustes, Facturas, Cobros/Pagos, Ingresos de mercadería) — un cambio solo afecta a los comprobantes nuevos.

### 🔧 Cambios
- Lectura de `configuracion` (y el logo en Storage) ampliada a cualquier usuario autenticado — necesario para que Datos del negocio y Numeración aparezcan en cualquier documento, no solo para quien administra Configuración.
- Las 5 funciones de numeración (`formatearNumeroX`) ganaron un parámetro de prefijo opcional, conectado en los listados, fichas, libro contable e Informes de Clientes, Proveedores, Facturación y Pagos.

### 🐞 Errores corregidos
- Ninguno.

### ⚠️ Pendiente
- Con Configuración cerrado, solo queda Notas para completar el roadmap entero.

---

## Informes

Primer módulo puramente de lectura del roadmap — sin tablas nuevas. Ver `docs/sistemas/informes-diseno.md` y decisión `0032`.

### ✅ Agregado
- **Informes**: landing con 5 categorías (Clientes, Proveedores, Facturación, Empleados, Contador), cada una con sus informes como secciones de una sola pantalla.
- **Clientes**: saldos pendientes, saldo a favor, mayor deuda (lista completa, sin Top 10).
- **Proveedores**: deudas pendientes, pagos realizados.
- **Facturación**: total facturado por período, emitidas, pendientes de emitir.
- **Empleados**: pagos realizados, adelantos.
- **Contador**: vencidas, pendientes, próximos vencimientos.
- **Filtro de período compartido** (Hoy/Esta semana/Este mes/Este año/Rango personalizado) en los informes de actividad — los de saldo (Clientes, Proveedores) y de estado actual (Contador: Vencidas/Pendientes) no lo llevan, a propósito.
- **Exportar a PDF y a Excel**, en todos los informes — sin librerías nuevas (Excel reutiliza `xlsx`, ya instalada; PDF reutiliza el diálogo de impresión nativo, mismo criterio que Facturación).
- **Permiso doble**: cada categoría exige `informes` + el permiso del módulo correspondiente.

### 🔧 Cambios
- Ninguno fuera de lo agregado.

### 🐞 Errores corregidos
- Ninguno.

### ⚠️ Pendiente
- "Aguinaldos registrados" quedó fuera de esta versión — no hay ningún dato estructurado que lo identifique, solo texto libre en Concepto (ver decisión `0032`).
- Con Informes cerrado, solo queda Configuración (Bloque 5) para terminar el roadmap completo.
- **Mejora futura registrada, sin implementar**: que otros módulos se apoyen en las consultas de Informes para autocontrolarse (pendientes, inconsistencias, vencimientos) — se hace cuando aparezca una necesidad real de uso, no por anticipación.

---

## Bloque 4B — Contador

Organizador de vencimientos, honorarios, impuestos y documentación — sin cálculos, sin ARCA. Ver `docs/sistemas/bloque4b-contador-diseno.md` y decisión `0031`.

### ✅ Agregado
- **Contador**: dos pestañas — Vencimientos (alta, estado calculado, marcar como pagado, anular) y Documentación (general, varios archivos a la vez).
- **Cuatro estados con color protagonista**: Pagado / Vencido / Próximo a vencer (7 días) / Pendiente — se calculan siempre, nunca se guardan.
- **Honorarios distinguidos de Impuestos por ícono**, para no competir con los colores de estado.
- **Panel resumen** en el listado (vencidos, próximos a vencer, pendientes, pagados) — igual criterio que Facturación.
- **Segunda fuente de "Pendientes" en Inicio** — la sección ahora soporta más de una tarjeta a la vez (Facturación + Contador).

### 🔧 Cambios
- `HistorialAuditoria` acepta `obligaciones_contador`.
- Pendientes en Inicio: rediseñado internamente para listar varias fuentes en vez de una sola.

### 🐞 Errores corregidos
- Ninguno.

### ⚠️ Pendiente
- Bloque 5 del roadmap (Informes, Configuración, Notas) — siguiente en la fila.

---

## Facturación — dos flujos (genera deuda / comprobante de un cobro existente)

Reapertura puntual de un módulo ya cerrado — caso de uso real encontrado en el uso diario. Ver `docs/sistemas/facturacion-dos-flujos-diseno.md` y decisión `0029` (sección "Reapertura puntual").

### ✅ Agregado
- **Segundo flujo en Nueva factura**: "Es el comprobante de un cobro ya registrado" — asocia la factura a un cobro que ya existe, sin generar ninguna Deuda nueva. Elección explícita y obligatoria entre los dos flujos, sin valor por defecto.
- **`SeleccionarCobroDialog`**: selector de cobros sin factura de un cliente, sin límite de tiempo, con Fecha/Monto/Medio de pago/Concepto por fila y buscador.
- **Advertencia de importes distintos**: si el total de la factura no coincide con el monto del cobro elegido, se avisa de forma visible y se pide confirmación explícita — sin bloquear (pueden ser redondeos, descuentos, bonificaciones).
- **"Ver el cobro"** en la Ficha de factura, para las del segundo flujo — mismo lugar que "Ver la deuda" del primero.

### 🔧 Cambios
- Ninguno fuera de lo agregado — el primer flujo (genera deuda) sigue exactamente igual.

### 🐞 Errores corregidos
- Ninguno.

### ⚠️ Pendiente
- Diseño del Bloque 4B (Contador) — retomar una vez confirmado este cambio.

---

## Empleados — 3 ajustes al formulario de pago

Pedidos después de probar el módulo en uso real. Ver decisión `0030` (sección "Tres ajustes finales").

### ✅ Agregado
- **Monto precargado** cuando la modalidad es "Importe fijo" (solo en Pago, no en Adelanto).
- **"Horas trabajadas"** para modalidad "Por hora" — sugiere el monto (horas × valor/hora), sigue editable.
- **Descuento opcional dentro del mismo pago**, con motivo obligatorio — un ajuste de una sola vez, explícitamente **sin ningún saldo que se arrastre entre pagos** (se evaluaron dos alternativas y se descartó la que equivalía a una cuenta corriente de empleados).

### 🔧 Cambios
- Ninguno fuera de lo agregado.

### 🐞 Errores corregidos
- Ninguno.

### ⚠️ Pendiente
- Bloque 4B (Contador) — siguiente en la fila.

---

## Empleados — cierre del módulo (gestión de pagos completa)

Completa lo que había quedado a mitad de camino en la primera entrega del Bloque 4A y suma lo pedido explícitamente. Ver decisión `0030` (sección "Cierre del módulo").

### ✅ Agregado
- **Campo "Frecuencia de pago"** (semanal/quincenal/mensual/por hora/por jornada/otro) — puramente informativo, sin cálculos.
- **"Concepto"** obligatorio en Registrar pago/adelanto (reemplaza a "Nota", que era opcional).
- **"Número de comprobante"** opcional en Registrar pago/adelanto, mismo patrón que Deudas/Ingresos.
- **"Actividad"** en la Ficha del empleado — se había omitido en la entrega anterior.

### 🔧 Cambios
- Ninguno fuera de lo agregado.

### 🐞 Errores corregidos
- Se había omitido la sección "Actividad" en la Ficha del empleado en la primera entrega del Bloque 4A — corregido acá.

### ⚠️ Pendiente
- Bloque 4B (Contador) — siguiente en la fila.

---

## Bloque 4A — Empleados

Primer módulo del roadmap completamente autocontenido — sin integración con ningún otro módulo. Ver `docs/sistemas/bloque4a-empleados-diseno.md` y decisión `0030`.

### ✅ Agregado
- **Empleados**: alta/modificación/archivar/restaurar, mismo patrón que Clientes/Proveedores/Productos. Reutiliza el catálogo `modalidades_pago_empleado` (sembrado desde la Fase 0, sin usar hasta ahora).
- **Documentación del empleado**: primera relación "uno a muchos" de adjuntos del sistema (DNI, Contrato, Apto médico, CV, Certificado, Otro) — indicador visual de completa/incompleta en la Ficha.
- **Historial de pagos y adelantos**: tabla propia (`pagos_empleados`), deliberadamente separada del Motor de Pagos — sin saldo, sin cuenta corriente, cronológico nada más. "Registrar pago" y "Registrar adelanto" son dos botones distintos.
- **Resumen en la Ficha**: cargo, modalidad de pago, valor, último pago, último adelanto.
- Campo nuevo `cargo` (texto libre, opcional) — no estaba en el brief original de 3 campos.

### 🔧 Cambios
- `useRestaurar` extendido para aceptar `empleados`.

### 🐞 Errores corregidos
- Ninguno.

### ⚠️ Pendiente
- Bloque 4B (Contador) — siguiente en la fila.

---

## Sprint 3.1 — Pulido final de Facturación (cierre del módulo)

Exclusivamente experiencia de uso y presentación — sin migraciones, sin lógica de negocio nueva. Con esto, Facturación queda cerrada. Ver decisión `0029` (sección "Sprint 3.1").

### ✅ Agregado
- **Panel resumen** en el listado de Facturación: pendientes, emitidas, facturado del mes, cantidad del mes — calculado sobre datos ya cargados.
- **Filtro por Estado** (Todos/Pendiente de emitir/Emitida) en el listado, con soporte para abrir ya filtrado (`/facturacion?estado=pendiente`).
- **"Pendientes" en Inicio, con contenido real por primera vez**: tarjeta de facturas pendientes de emitir, lleva directo al listado filtrado.
- **Indicador en el listado de Clientes**: ícono junto al nombre cuando ese cliente tiene alguna factura pendiente de emitir.

### 🔧 Cambios
- Resumen económico (Neto/IVA/Total) en la Ficha de factura: pasa a un panel destacado con el Total en tipografía grande, en vez de texto alineado a la derecha.

### 🐞 Errores corregidos
- Ninguno.

### ⚠️ Pendiente
- Bloque 4 del roadmap (Empleados y Contador) — siguiente en la fila. Con Facturación cerrada, no queda ningún módulo funcional a medias.

---

## Facturación — registro del proceso de emisión

Extensión sobre el Bloque 3, sin tocar la filosofía (sigue sin haber ninguna integración con ARCA/AFIP). Ver decisión `0029` (sección "Extensión").

### ✅ Agregado
- **Número real (ARCA) editable** por factura — reemplaza visualmente al correlativo interno una vez cargado, sin que este deje de existir.
- **Estado de la factura** (Pendiente de emitir / Emitida), calculado automáticamente por un trigger según si el número real y el PDF están cargados — nunca se marca a mano.
- **Adjuntar el PDF oficial de ARCA**, reutilizando el mismo sistema de adjuntos de Clientes/Proveedores.
- **IVA por factura** (Exento / 10,5 % / 21 % / 27 %) — Neto e importe de IVA se calculan siempre a partir del total, nunca se guardan.
- Columna "Estado" en el listado de Facturación, con insignia de color.
- Permiso `modificar` habilitado por primera vez en Facturación (hasta ahora solo usaba `crear`/`archivar`).

### 🔧 Cambios
- Ninguno fuera de lo agregado.

### 🐞 Errores corregidos
- Ninguno.

### ⚠️ Pendiente
- Bloque 4 del roadmap (Empleados y Contador) — siguiente en la fila.

---

## Bloque 3 — Facturación interna

Módulo nuevo, integrado únicamente con Clientes y Cuenta Corriente. Ver `docs/sistemas/bloque3-facturacion-diseno.md` y decisión `0029`.

### ✅ Agregado
- **Facturación**: comprobante interno de ADMIN, sin validez fiscal (`facturas` + `factura_items`, líneas con o sin producto del catálogo, combinables).
- **Toda factura genera automáticamente su Deuda** en la Cuenta Corriente del cliente — nunca hay "condición de pago": documentar la operación y registrar el cobro son procesos separados, el cobro se hace después con el Motor de Pagos.
- **Anular una factura anula automáticamente la deuda que generó**, corrigiendo el saldo del cliente solo.
- **Permiso propio `facturacion`**, con un puente de RLS que le permite generar la Deuda automática sin necesitar además el permiso de Clientes.
- Listado de Facturación (Activas/Anuladas, buscador, ordenable), Nueva factura (pantalla completa, líneas dinámicas, buscador de producto reutilizando `SelectorEntidadDialog`), Ficha de factura (detalle, anular, imprimir/exportar).
- Quinto acceso rápido "Nueva factura" en Inicio.
- Enlace "Facturas" + botón "Nueva factura" desde el Estado de Cuenta del Cliente.
- Impresión/exportación a PDF vía el diálogo nativo del navegador — sin librerías nuevas.

### 🔧 Cambios
- Ninguno fuera de lo agregado.

### 🐞 Errores corregidos
- Ninguno — el diseño incluyó una "condición de pago" (Contado/Cuenta corriente) en una primera versión, corregida antes de la primera entrega (no llegó a mandarse ningún parche con esa versión). Ver decisión `0029`.

### ⚠️ Pendiente
- Bloque 4 del roadmap (Empleados y Contador) — siguiente en la fila.

---

## Estado de cuenta en los listados de Clientes y Proveedores

Cambio de diseño sobre un módulo ya cerrado — el listado principal pasa a ser una herramienta de gestión diaria de cuenta corriente, no una ficha de datos. Ver `docs/sistemas/estado-cuenta-listado.md` y decisión `0028`.

### ✅ Agregado
- **Columna "Estado de cuenta"** en los listados de Clientes y Proveedores: saldo en color y signo (🔴 con deuda, 🟢 al día, 🔵 a favor), sin texto — reemplaza a Razón social/Facturación (Clientes) y Razón social/CUIT (Proveedores), que siguen existiendo tal cual en la Ficha de cada uno.
- **Filtro "Estado de cuenta"** (Todos/Con deuda/Al día/Saldo a favor) en los dos listados.
- **`saldos_clientes()`/`saldos_proveedores()`** (migración `0031`): saldo de todos los activos en una sola consulta, para no convertir el listado en una llamada por fila.
- **`EstadoCuentaBadge`** (`modules/cuentaCorriente/`): componente único que traduce el saldo interno al signo mostrado en pantalla — mismo criterio exacto en Clientes y Proveedores, por construcción.
- Columna ordenable por estado de cuenta, y la fila de celular de ambos listados actualizada con el mismo badge.

### 🔧 Cambios
- Ninguno fuera de lo agregado.

### 🐞 Errores corregidos
- Ninguno.

### ⚠️ Pendiente
- Nada específico de este cambio — el roadmap de bloques sigue en el Bloque 3 (Facturación interna).

---

## Bloque 2 — Productos: categorías, Excel, importación tolerante

Cierra Productos del todo. Ver `docs/sistemas/bloque2-productos-diseno.md` y decisión `0027`. **Costo, margen y precio sugerido quedaron fuera del alcance** — se habían confirmado en una ronda anterior y se revirtieron antes de programar nada (ver nota de reversión en decisión `0025`).

### ✅ Agregado
- **Administración de categorías** (`/productos/categorias`): crear, editar, archivar, restaurar — mismo patrón que cualquier entidad de datos maestros del sistema. Vive dentro de Productos por ahora (Configuración todavía no es un módulo real).
- **Importación con Excel (.xlsx)**, además de CSV — mismo reconocimiento de columnas por nombre para los dos formatos, escrito una sola vez.
- **Precio tolerante**: `normalizarPrecio()` interpreta símbolos de moneda, separador de miles y decimal (punto o coma, en cualquier combinación), sin pedirle al usuario que edite el archivo antes de subirlo.
- **Vista previa con ejemplos**: antes de confirmar una importación, se muestran hasta 5 productos que van a cambiar de precio, con precio anterior → precio nuevo.

### 🔧 Cambios
- Ninguno fuera de lo agregado — se respetó explícitamente no tocar el listado ni la Ficha de Productos en este bloque.

### 🐞 Errores corregidos
- Ninguno.

### ⚠️ Pendiente
- Bloque 3 del roadmap (Facturación interna, sin ARCA/AFIP) — siguiente en la fila.

---

## Bloque 1 — CUIT real y comprobante adjunto

Cierra los 2 pendientes que Clientes y Proveedores arrastraban desde varios Sprints atrás. Ver `docs/sistemas/comprobante-adjunto-interfaz.md` y decisión `0026`.

### ✅ Agregado
- **`core/lib/cuit.ts`**: validación real del dígito verificador del CUIT (módulo 11), compartida por Clientes y Proveedores — reemplaza la validación de solo-longitud.
- **`ArchivoAdjunto`** y **`VisorAdjunto`** (`core/components/`): selector y visor de comprobantes, genéricos para todo el sistema — sin saber nada de negocio. Miniatura real para imágenes (con rotación EXIF automática, API nativa del navegador, sin librerías nuevas), ícono + nombre + peso para PDF.
- **Bucket de Storage `adjuntos`** (migración `0029`), privado, acceso vía URL firmada de 5 minutos, protegido por `tiene_permiso()`.
- Comprobante opcional en Registrar deuda, Registrar ingreso de mercadería y Registrar cobro/pago — subida atómica junto con el alta del registro (id generado en el cliente, sin viajes de red de más).
- "Ver" y "Descargar" en los 3 diálogos de detalle, cuando el movimiento tiene un adjunto.
- Confirmación antes de quitar un archivo elegido (reutiliza el diálogo de confirmación ya existente).

### 🔧 Cambios
- Mensajes de error de CUIT en Clientes y Proveedores: "El CUIT no es válido" en vez de "debe tener 11 dígitos" — ahora valida la forma matemática real, no solo el largo.

### 🐞 Errores corregidos
- Ninguno.

### ⚠️ Pendiente
- HEIC no se acepta como formato — limitación real de vista previa en Android, documentada y confirmada con el cliente antes de descartarlo (ver decisión `0026`).
- Validar contra el padrón real de AFIP/ARCA que el CUIT exista — fuera de alcance por decisión `0025` (sin dependencias externas).
- Bloque 2 del roadmap (Productos: categorías, Excel, importación tolerante) — siguiente en la fila.

---

## Reorganización del flujo operativo

Pantalla Principal orientada a las operaciones diarias reales, terminología "Ingreso de mercadería" en Proveedores, y el Estado de Cuenta como libro contable único. Ver `docs/sistemas/reorganizacion-flujo-operativo.md` y decisión `0024`.

### ✅ Agregado
- **Accesos rápidos de Inicio reorganizados**: Agregar deuda, Agregar ingreso de mercadería, Registrar cobro, Registrar pago — cada uno abre un buscador de entidad (`SelectorEntidadDialog`, nuevo, compartido) y después el formulario, sin pasar por el módulo.
- **"Ajuste" como redirección**: elegirlo en el origen de una Deuda o un Ingreso cierra ese formulario y abre el Ajuste real (mismo permiso, mismo signo, mismo motivo obligatorio) — nunca un segundo concepto de "ajuste" separado.
- **`LibroCuentaCorriente`**: Estado de Cuenta de Clientes y Proveedores como una única tabla — Fecha, Concepto, Debe, Haber, Saldo acumulado, orden cronológico ascendente (única lista de la app en ese orden, a propósito).
- **`origen` en `compras`** (migración `0028`) — Proveedores ahora también clasifica el origen del ingreso (Mercadería, Factura, Otro), como ya lo hacía Clientes con sus deudas.
- Navegación automática al Estado de cuenta de la entidad después de guardar cualquier movimiento desde los accesos rápidos de Inicio.

### 🔧 Cambios
- Terminología de Proveedores: "Compra" → "Ingreso de mercadería" en todo el texto visible (botones, títulos, mensajes, prefijo de número interno `ING-000001`). Los nombres técnicos internos no cambiaron.
- `Nuevo cliente`, `Nuevo proveedor`, `Nuevo producto`, `Importar lista` salen de los accesos rápidos de Inicio — siguen disponibles dentro de cada módulo (FAB del listado), sin cambios de comportamiento ahí.
- Las listas separadas de Deudas/Compras, Pagos y Ajustes en cada Estado de Cuenta se reemplazan por el libro único — el detalle/anulación de un movimiento puntual se preservó (clic en la fila del libro).
- `useClientes`/`useProveedores` aceptan un parámetro `enabled` opcional, para no cargar esas listas en Inicio hasta que se usa un acceso rápido.

### 🐞 Errores corregidos
- Ninguno (de un Sprint anterior) — se encontró y corrigió, dentro de este mismo Sprint antes de entregarlo, una regresión propia: la primera versión del libro contable no permitía anular un movimiento puntual. Ver decisión `0024`.

### ⚠️ Pendiente
- El bundle inicial de la app creció por los diálogos que ahora importa `PantallaPrincipal` directamente — candidato a carga diferida si el tiempo de carga se vuelve perceptible (ver decisión `0024`, nota de rendimiento).
- Integración con Caja, Stock, Facturación, Informes y Contador — arquitectura ya pensada para admitirlos (ver sección 8 del documento de diseño), sin implementar todavía.
- Extender el Motor de Pagos/Ajustes a una tercera entidad (ej. Contador) — hoy están pensados para dos (Cliente/Proveedor); es la única limitación real de escala identificada.

---

## Cuenta Corriente — Clientes y Proveedores (arquitectura compartida)

Supera la decisión `0020` (Cuenta Corriente de Clientes pospuesta) con una definición concreta, y agrega Ajustes como pieza compartida entre los dos módulos. Primera entrega bajo el nuevo flujo de trabajo (parche, no ZIP — ver `WORKFLOW.md`).

### ✅ Agregado
- **Deudas de Clientes** (`deudas_clientes`): "Registrar deuda" con origen elegible (Cuenta del mes / Venta / Factura / Otro), descripción, importe, comprobante opcional — gemela de Compras (Proveedores), inmutable, solo se anula.
- **Ajustes de cuenta** (`ajustes_cuenta`): único componente compartido entre Clientes y Proveedores (`RegistrarAjusteDialog`, `ListaAjustes`, en `src/modules/cuentaCorriente/`). Importe con signo (positivo o negativo), motivo siempre obligatorio.
- **Permiso "ajustes"**: nuevo e independiente de Clientes/Proveedores/Modificar — decisión explícita por tratarse de una operación sensible. Sin pantalla ni ruta propia.
- **`saldo_cliente()`**: función gemela de `saldo_proveedor()` (actualizada para sumar ajustes) — deudas activas menos cobros activos, más ajustes.
- Estado de cuenta de Clientes: pasa a tener Saldo, Deudas, Pagos, Ajustes y Actividad (antes solo Pagos + Actividad, sin saldo).
- Estado de cuenta de Proveedores: se suma la sección de Ajustes.
- Documento de arquitectura (`docs/sistemas/cuenta-corriente-arquitectura-compartida.md`) y decisión `0023`.

### 🔧 Cambios
- Ficha de Cliente: nuevo resumen de Saldo; el botón "Ver estado de cuenta" pasa a llamarse "Estado de cuenta" (Clientes y Proveedores usan ahora el mismo texto).
- `hayErrores` (Clientes) generalizada para servir tanto al formulario de Cliente como al de Deuda.

### 🐞 Errores corregidos
- Ninguno.

### ⚠️ Pendiente
- Asignación de pagos a deudas/compras específicas — descartada del núcleo (mismo criterio que el Sprint 4), queda como posible evolución futura.
- Cuenta Corriente de Empleados/Cheques/Contador — no aplica todavía porque esos módulos no son funcionales.

---

## Rediseño de identidad visual — Etapa 3 (Módulos: Clientes, Proveedores, Productos)

Tercera y última etapa del rediseño aprobado. Aplicado a los 3 módulos funcionales — Empleados, Cheques, Notas, Contador e Informes siguen como esqueleto hasta que tengan su propio Sprint de desarrollo, momento en el que van a nacer usando esta misma infraestructura.

### ✅ Agregado
- **`DataTable`** (`core/components/DataTable.tsx`): tabla de escritorio única de ADMIN — búsqueda, orden por columna, filtros por slot, paginación con selector de filas por página (10/20/50/100), acciones por fila con tooltip. Convive con `ListView` (celular), no lo reemplaza.
- **`EstadoFiltroTabs`**: pestañas Activos/Archivados, mismo componente en celular y escritorio.
- **`useRestaurar`**: restaura un registro archivado (`archived_at` → `NULL`). Sin migraciones ni permisos nuevos — la política de "archivar" ya autorizaba la operación en cualquier dirección.
- **`Tooltip`** (Radix, nueva dependencia `@radix-ui/react-tooltip`): usado en las acciones por fila de `DataTable`.
- Acciones por fila en Clientes, Proveedores y Productos: Ver, Editar, Archivar (activos) · Ver, Restaurar (archivados). **Sin botón de Eliminar** — contradice la regla "nunca se elimina, se archiva" del brief original.
- `FormBlock` acepta `columnas={2}` (máximo 2, solo en escritorio) — aplicado en Clientes (Facturación), Proveedores y Productos.
- Documento de diseño (`docs/sistemas/etapa3-listados-escritorio.md`) y decisión `0022`.

### 🔧 Cambios
- Barra superior de módulo nueva en escritorio para Clientes/Proveedores/Productos: título, contador de registros, pestañas Activos/Archivados, filtros (Facturación en Clientes) y botón principal destacado — reemplaza al `TopBar` genérico solo en estas 3 pantallas de listado.
- Fichas de Clientes/Proveedores/Productos: insignia "Archivado" + botón Restaurar cuando corresponde, en vez de Modificar/Archivar.
- Formularios de Clientes/Proveedores/Productos: ancho máximo centrado en escritorio (antes se estiraban de punta a punta de la pantalla).
- `Select` acepta `className` y `label` opcional (para usos compactos, como el filtro de Facturación en el toolbar de la tabla).

### 🐞 Errores corregidos
- Ninguno.

### ⚠️ Pendiente
- Columnas configurables por usuario, acciones masivas y exportación desde `DataTable` — el componente ya está diseñado para admitirlas (ver comentario en `DataTable.tsx` y decisión `0022`), pero no implementadas.
- Restaurar un cheque/nota/etc. — no aplica todavía porque esos módulos no existen como funcionalidad real.
- Íconos reales de la PWA (pendiente desde la Fase 0, nota: ya se resolvió en la Beta 0.1 — este ítem queda obsoleto, se saca del changelog a partir de la próxima entrada).

---

## Rediseño de identidad visual — Ajustes a la Etapa 2

6 ajustes puntuales pedidos después de probar la Etapa 2, antes de arrancar la Etapa 3. Sin cambios a Supabase, base de datos, permisos ni lógica de negocio.

### 🔧 Cambios
1. **Sidebar**: ancho reducido a 216px (antes 240px). Más aire en el bloque inferior (Configuración + usuario) — separador y padding superior aumentados.
2. **Encabezado de Inicio**: panel de saludo ~45% más bajo (padding vertical reducido a la mitad). Se quitó la barra superior con el título "Inicio" en esta pantalla puntual — el panel de saludo ya cumple esa función y el Sidebar/BottomNav ya indican el módulo activo (`TopBar.tsx` ahora no renderiza nada en `/`). Nombre del usuario mantiene el mismo protagonismo; la fecha bajó de tamaño y se acortó el formato ("mar. 2 jul." en vez de "martes 2 de julio").
3. **Pendientes**: la tarjeta de estado vacío pasó de vertical (ícono arriba, texto abajo, mucho padding) a horizontal y compacta.
4. **Accesos rápidos**: cada tarjeta suma un detalle de borde izquierdo con el color de su módulo (nuevo campo `borde` en `core/theme/modulos.ts`), más separación entre ícono y texto, texto con más peso (`font-semibold`), y un hover más elegante en escritorio (leve elevación + sombra, sin depender solo del `active:scale` pensado para dedo).
5. **Tarjetas**: sombra de `.sombra-tarjeta` un punto más marcada, sin dejar de ser sutil.
6. **Espaciado general de Inicio**: paddings verticales reducidos en las tres secciones — la pantalla aprovecha mejor el alto disponible, con menos espacio vacío entre bloques.

### ⚠️ Pendiente
- Sobre el pedido de "mantener el degradado suave" del panel de saludo: el panel nunca tuvo un degradado real (CSS `gradient`) — es un tinte plano (`bg-panel-calido`), consistente con el principio "sin gradientes" que quedó establecido desde el documento de identidad visual. Se mantuvo así; si preferís un degradado real ahí, es un cambio chico pero puntual que conviene confirmar antes de aplicarlo.
- Etapa 3: aplicar el rediseño módulo por módulo, con tablas de escritorio (búsqueda, filtros, orden por columna, paginación, acciones alineadas) — alcance mayor al de un ajuste, se va a tratar como su propia etapa de diseño antes de programarla.

---

## Rediseño de identidad visual — Etapa 2 (Componentes base)

Segunda de tres etapas del rediseño aprobado. Sin cambios a Supabase, base de datos, permisos, autenticación ni comportamiento de ningún módulo — exclusivamente componentes visuales compartidos.

### ✅ Agregado
- Token `--border-strong` (hover de tarjetas/campos) y clases utilitarias `.sombra-tarjeta` / `.sombra-boton-principal` en `index.css` — un solo lugar para las dos únicas sombras que usa ADMIN.
- `LABEL_CAMPO` (`core/lib/utils.ts`): estilo único de label editorial, reutilizado en todos los campos de formulario y encabezados de bloque.
- Prop `icono` en `Button` — íconos en los botones del diálogo de confirmación (✓ Guardar, lápiz Modificar, archivo Archivar).

### 🔧 Cambios
- `--radius` pasa de 8px a 12px globalmente — eleva de una sola vez el radio de tarjetas, botones y campos en toda la app.
- `Button.tsx`: Guardar/Modificar/Archivar ganan sombra y más peso (mayor protagonismo); Cancelar pasa a un tratamiento más liviano (borde, sin relleno) — mismo color de siempre, menos peso visual cuando acompaña a una acción principal.
- `Card.tsx`: sombra sutil + más padding (1.25rem).
- `FormBlock.tsx`: el título de cada bloque pasa a ser una etiqueta editorial arriba de la tarjeta (como en los mockups aprobados), no un heading adentro.
- `TextField`, `Select`, `CurrencyField`, `DateField`, `CampoTextoLargo`, `SearchField`: labels con el nuevo estilo editorial, hover y foco más consistentes.
- `Sidebar.tsx`: separación visual entre categorías (línea sutil), estado activo más claro (indicador lateral limpio + fondo), hover más notorio.
- `ListView.tsx`: hover en filas (antes solo existía el feedback táctil de `active:`, pensado para dedo — ahora también responde al mouse).
- `PantallaPrincipal.tsx`: el estado vacío de Pendientes y los accesos rápidos ahora usan el mismo estilo de tarjeta (sombra + hover) que el resto de la app.

### 🐞 Errores corregidos
- Ninguno.

### ⚠️ Pendiente
- Etapa 3: aplicar el rediseño módulo por módulo (Clientes, Proveedores, Productos...) — incluye la transformación de listados a tabla real en escritorio, que se decidió dejar para esta etapa porque las columnas dependen de cada módulo.
- El FAB en escritorio todavía no se reemplaza por un botón "+ Nuevo X" con etiqueta (Etapa 3).

---

## Rediseño de identidad visual — Etapa 1 (Layout, Sidebar, BottomNav, TopBar, Pantalla Principal)

Primera de tres etapas del rediseño aprobado (`identidad-visual-admin.md`). Sin cambios a Supabase, base de datos, permisos, autenticación ni comportamiento de ningún módulo — exclusivamente layout y navegación.

### ✅ Agregado
- **Sidebar de escritorio** (`core/components/Sidebar.tsx`, ≥768px): mismos 10 destinos que el celular, agrupados por categoría (General, Comercial, Operaciones, Personal, Gestión) con Configuración separada al final junto a la sesión del usuario. Colapsa a solo íconos entre 768–1023px, se expande completo desde 1024px — sin JavaScript, solo clases responsive.
- Tokens de color del riel de navegación (`--riel`, azul petróleo `#1C303C`) y del panel cálido de la Pantalla Principal (`--panel-calido`).
- Accesos rápidos en la Pantalla Principal (Nuevo cliente, Nuevo proveedor, Nuevo producto, Importar lista) — atajos de navegación a pantallas que ya existen, cada uno con el color de wayfinding de su módulo.
- `CATEGORIAS_SIDEBAR` en `core/theme/modulos.ts` — agrupación puramente visual, no toca rutas ni permisos.

### 🔧 Cambios
- `AppShell.tsx`: layout responsive — fila horizontal (Sidebar + contenido) desde 768px, columna vertical (TopBar + contenido + BottomNav) en celular. Mismo mecanismo de transición entre pantallas de siempre.
- `BottomNav.tsx`: pasa del fondo blanco al riel oscuro (azul petróleo), mismo color que el Sidebar — es el mismo ancla de marca en los dos dispositivos. Oculto desde 768px.
- `TopBar.tsx`: tipografía ajustada a la nueva escala (20px/600 en vez de 16px/600).
- `PantallaPrincipal.tsx`: el saludo vive ahora sobre un panel con lavado sutil del azul de marca; "Pendientes" sigue mostrando el estado vacío real (sin datos simulados) con un tratamiento más cuidado.
- `FloatingActionButton.tsx` y `ToastProvider.tsx`: el margen inferior ya no asume que siempre hay una BottomNav debajo — en escritorio (sin BottomNav) usan menos espacio de separación.

### 🐞 Errores corregidos
- Ninguno — esta etapa es de rediseño, no de corrección.

### ⚠️ Pendiente
- Etapa 2 (componentes base: botones, tarjetas, tablas, formularios, diálogos, toasts) y Etapa 3 (aplicar el rediseño módulo por módulo) — a la espera de que se pruebe y apruebe esta etapa primero, según la metodología acordada.
- El FAB todavía no se reemplaza por un botón "+ Nuevo X" con etiqueta en escritorio (eso es Etapa 2/3) — en escritorio sigue siendo el mismo botón flotante circular de siempre, sin regresión, solo pendiente del pulido visual acordado.

---

## Auditoría de interfaz post-Beta

Revisión completa de botones sin acción, formularios y navegación, a pedido del cliente durante los días de prueba con datos reales.

### 🐞 Errores corregidos
- **La BottomNav podía tapar el último elemento de cualquier pantalla** (una fila de lista, o el pie de un formulario con los botones Guardar/Cancelar). Causa: `BottomNav` usaba `position: fixed`, así que quedaba flotando *encima* del contenido en vez de ocupar su propio espacio — `main` se extendía por detrás sin saberlo. Se corrigió en un solo lugar (`BottomNav.tsx` ya no es `fixed`, es un ítem normal del `flex h-screen flex-col` de `AppShell`) — el arreglo vale para todas las pantallas de la app a la vez, no pantalla por pantalla.
- **El botón "+" de los módulos todavía no desarrollados (Cheques, Empleados, Contador, Notas, Informes, Configuración) no hacía nada al tocarlo.** Ahora muestra un aviso "Próximamente" (`ModuleEmptyScreen.tsx`) — ningún botón de ADMIN debería sentirse roto, aunque el módulo todavía no exista.

### Revisado sin cambios necesarios
- **Formularios** (Clientes, Proveedores, Productos, Registrar cobro/pago/compra): validación, autofoco, estados de carga y confirmación de cambios sin guardar funcionando como se diseñaron.
- **Navegación**: las 23 rutas registradas corresponden 1 a 1 con los `navigate(...)` usados en el código — no se encontró ningún enlace roto ni pantalla huérfana. Los módulos sin desarrollar (Cheques, Empleados, Contador, Notas, Informes) se mantienen en el Menú a propósito — son parte de la lista fija de módulos del brief original, no pantallas para eliminar.

---

## Corrección post-Beta — Login no funcionaba

Encontrado durante el primer login real contra Supabase en producción (el primero de todo el proyecto — hasta acá, `build`/`tsc` corrían contra una URL placeholder).

### 🐞 Errores corregidos
- **Recursión infinita en RLS de `usuarios`/`permisos`** (arrastrado desde la Fase 0, migración `0008`): tres políticas resolvían "¿es admin?" con un `SELECT` directo contra la misma tabla que protegían, lo que PostgreSQL rechaza con "infinite recursion detected". Como el error nunca se revisaba en `AuthProvider.tsx`, la falla era completamente silenciosa — el síntoma era "toco Ingresar y no pasa nada, sin ningún error en ningún lado". Corregido con una función `security definer` (migración `0022`) y con el chequeo de errores agregado a `AuthProvider.tsx`. Ver `docs/decisiones/0021`.

### ⚠️ Pendiente
- Sin cambios respecto a la Beta 0.1 — ver `BETA.md`.

---

## Release Beta 0.1

Primera versión pensada para usarse con datos reales. Reúne los Sprints 1 a 5 sin agregar funcionalidad nueva propia — ver `BETA.md` para el detalle completo de qué incluye, qué no, y una aclaración importante sobre el alcance real de "Cuenta corriente de Clientes" (no tiene saldo calculado, a diferencia de Proveedores — es una decisión ya tomada en el Sprint 3, no un pendiente de esta versión).

### ✅ Agregado
- Íconos reales de la PWA (monograma sobre el azul de marca) — hasta acá, instalar ADMIN en Android mostraba un ícono genérico.
- `BETA.md`: qué incluye la Beta, qué no, y cómo instalarla para probarla con datos reales.
- Versión del proyecto marcada como `0.1.0-beta.1` en `package.json`.

### 🔧 Cambios
- Ninguno funcional — esta entrada es un empaquetado de release, no un Sprint de desarrollo.

### 🐞 Errores corregidos
- Ninguno.

### ⚠️ Pendiente
- Ver "Qué NO incluye todavía" en `BETA.md` — Cheques, Empleados, Contador, Notas, Informes, gestión de Usuarios desde la interfaz, restaurar archivados, dígito verificador de CUIT, compras con detalle de productos, comprobantes adjuntos.

---

## Sprint 5 — Módulo Productos

### ✅ Agregado
- Alta, Modificación, Ficha y Archivado de productos.
- **Categorías por quick-add**: se crean sin salir del formulario de producto (mejora al componente `Select` del Design System, reutilizable en cualquier catálogo futuro).
- **Historial de precios** integrado en la Ficha del producto — dato que ya se generaba automáticamente desde la Fase 0 (triggers), ahora visible.
- **Importación de listas de precios** (CSV): columnas identificadas por nombre (tolerante a mayúsculas/acentos/espacios), previsualización con resumen antes de confirmar, descarga de un CSV con las filas que tuvieron error, y resultado final (nuevos / actualizados / reactivados / con errores).
- Reactivación automática de productos archivados que vuelven a aparecer en una lista importada, conservando todo su historial.
- **Historial de importaciones** (`importaciones`): usuario, fecha/hora y los cuatro contadores del resultado, para auditoría y soporte — no guarda el archivo original.
- `FileField` generalizado: ahora también acepta archivos que no son imágenes (como el CSV de importación), mostrando el nombre del archivo en vez de romperse.
- Migración `0019`: `CHECK` de precio positivo en `productos` (paridad con Compras/Movimientos).
- Función `importar_productos()`: un único UPSERT por lotes en la base de datos para toda la importación — nunca un loop fila por fila desde el frontend.
- Documento de arquitectura (`docs/sistemas/modulo-productos-arquitectura.md`) y decisiones `0018`/`0019`.

### 🔧 Cambios
- Ninguno a módulos existentes.

### 🐞 Errores corregidos
- Ninguno.

### ⚠️ Pendiente
- Soporte para archivos Excel (`.xlsx`) en la importación — se evaluará si en la práctica los proveedores mandan mayormente ese formato.
- Compras con detalle de productos (vínculo entre una línea de compra y un producto real) — evolución futura, ver `docs/sistemas/modulo-productos-arquitectura.md` sección 9.
- Pantalla de administración de categorías (editar/eliminar) — hoy solo se crean, no existe en ningún catálogo del sistema todavía.
- Restaurar un cliente/proveedor/producto archivado.
- Validación del dígito verificador de CUIT.
- Íconos reales de la PWA.

---

## Sprint 4 — Módulo Proveedores

### ✅ Agregado
- Alta, Modificación, Ficha y Archivado de proveedores (mismo patrón que Clientes).
- **Compras**: registro de compras a un proveedor (`descripcion`, `numero_comprobante` opcional, `monto`, `fecha`), inmutables — solo se consultan o se anulan, nunca se editan. Número interno visible (`COMP-000001`).
- **Saldo del proveedor**: calculado en la base de datos (`saldo_proveedor()`), nunca almacenado — compras activas menos pagos activos.
- Estado de cuenta del proveedor: Saldo, Compras, Pagos (Motor de Pagos del Sprint 3, sin ningún cambio) y Actividad, todo en una sola pantalla.
- Ficha del proveedor: resumen simple de saldo pendiente, última compra y último pago.
- Componentes nuevos, propios de Proveedores (no compartidos, ver `docs/sistemas/modulo-proveedores-arquitectura.md` sección 4.4): `RegistrarCompraDialog`, `ListaCompras`.
- Migración `0014`: paridad de validación de CUIT entre Proveedores y Clientes (existía desde la Fase 0 solo para Clientes).
- Documento de arquitectura (`docs/sistemas/modulo-proveedores-arquitectura.md`) y decisiones `0016`/`0017`.

### 🔧 Cambios
- Orden cronológico de Compras y Pagos ahora es estable: fecha descendente y, en empate, fecha de creación descendente (antes, Pagos desempataba por número interno — en la práctica da el mismo resultado, pero se unificó el criterio).
- Formateadores de moneda y fecha (`formatearMoneda`, `formatearFecha`) se centralizaron en `core/lib/format.ts` — antes vivían duplicados dentro de `ListaMovimientos`.

### 🐞 Errores corregidos
- Ninguno.

### ⚠️ Pendiente
- Compras con detalle de productos (hoy son monto + descripción simple) — se evaluará cuando el módulo Productos esté completamente desarrollado.
- Asignación de pagos a compras específicas (cuentas por pagar con imputación) — descartado del núcleo a propósito; quedaría como una evolución futura si hiciera falta.
- Vínculo real entre una compra/movimiento y un cheque, y adjuntar comprobante — mismos pendientes del Sprint 3, ahora también reservados en `compras`.
- Restaurar un cliente/proveedor archivado.
- Validación del dígito verificador de CUIT.
- Íconos reales de la PWA.

---

## Sprint 3 — Motor de Pagos

### ✅ Agregado
- Motor de Pagos (`src/modules/pagos/`): infraestructura reutilizable de registro de cobros/pagos, sin pantalla ni ruta propia — la consumen Clientes y (a partir del próximo Sprint) Proveedores.
- Tabla `movimientos`: registra cobros (Clientes) y pagos (Proveedores). Inmutable — solo se puede consultar o anular, nunca editar.
- Número interno visible por movimiento (`MOV-000001`, `MOV-000002`...), además del `id` interno.
- Catálogo `medios_pago` (Efectivo, Transferencia, Cheque, Tarjeta, Otro).
- Componentes nuevos, reutilizables por cualquier módulo que use el Motor: `RegistrarMovimientoDialog`, `ListaMovimientos`.
- La sección "Movimientos" del Estado de cuenta de Clientes (vacía desde el Sprint 2) ya es funcional: se pueden registrar cobros, verlos, y anularlos con motivo opcional.
- Documento de arquitectura (`docs/sistemas/motor-de-pagos-arquitectura.md`) y decisiones `0014`/`0015`.

### 🔧 Cambios
- Ninguno a módulos existentes — Clientes solo sumó la integración del Motor en su Estado de cuenta, sin tocar Alta/Modificación/Ficha/Listado.

### 🐞 Errores corregidos
- Ninguno.

### ⚠️ Pendiente
- **Cuenta Corriente** (saldo deudor / saldo a favor): el Motor de Pagos registra hechos a propósito, sin interpretarlos — el cálculo de saldo queda para un módulo aparte, que además va a necesitar un concepto de "deuda/cargo" que hoy no existe en ningún lado del sistema.
- Vínculo real entre un movimiento y un cheque (`cheque_id` ya existe en la tabla, sin `FOREIGN KEY` porque el módulo Cheques todavía no existe).
- Adjuntar comprobante a un movimiento (`comprobante_path` ya existe en la tabla, sin implementar la carga).
- Integración con Empleados y Contador (cuando esos módulos existan).
- Restaurar un cliente archivado (pendiente desde el Sprint 2).
- Validación del dígito verificador de CUIT (pendiente desde el Sprint 2).
- Íconos reales de la PWA (pendiente desde la Fase 0).

---

## Sprint 2 — Módulo Clientes

### ✅ Agregado
- Alta de clientes.
- Modificación de clientes.
- Archivado de clientes (con confirmación explicando que no se elimina y podrá restaurarse).
- Ficha del cliente.
- Estado de cuenta del cliente — sección "Actividad" (historial de auditoría) funcional; sección "Movimientos" queda vacía a propósito hasta el Sprint de Pagos.
- Componentes nuevos al Design System, reutilizables por los módulos que siguen: `CampoSoloLectura`, `HistorialAuditoria`, `PageTitleProvider`/`usePageTitle`.
- Migración `0009`: validaciones de formato (email, CUIT) a nivel de base de datos para `clientes`.
- Migración `0010`: quien tiene permiso de **ver** una tabla (ej. Clientes) ahora también puede ver su historial de auditoría, sin necesitar permiso de Informes.
- Documento de arquitectura del módulo (`docs/sistemas/modulo-clientes-arquitectura.md`) y decisión `0012` (título dinámico de la TopBar, rendimiento del listado pensado para miles de registros).

### 🔧 Cambios
- `ListView`: búsqueda ahora insensible a mayúsculas y acentos ("José" encuentra "jose"), filtro con `React.useDeferredValue` para no trabar la escritura en listas grandes, y nuevo estado `error` con botón "Reintentar".
- `TopBar`: puede mostrar un título específico de la pantalla actual (ej. "Editar cliente", el nombre real de un cliente) en vez de siempre el nombre del módulo.
- El listado de Clientes ordena alfabéticamente en la consulta a la base de datos, no en el cliente — un cliente nuevo aparece en su posición correcta sin lógica adicional.
- `Login` ahora usa `TextField` del Design System (antes usaba inputs sueltos, de antes de que `TextField` existiera).

### 🐞 Errores corregidos
- `database.types.ts` (tipos de Supabase escritos a mano) no declaraba `Relationships` en ninguna tabla, lo que hacía que TypeScript no pudiera tipar correctamente `.insert()`/`.update()` ni los `select` con joins embebidos. Se corrigió agregando las relaciones reales del esquema.

### ⚠️ Pendiente
- Registro de pagos (sección "Movimientos" del Estado de cuenta).
- Restaurar un cliente archivado: el mensaje de confirmación ya promete que "podrá restaurarse más adelante", pero todavía no existe ninguna pantalla para hacerlo. Hay que resolverlo antes de que sea un problema real (probablemente un listado de archivados en Configuración o dentro del propio módulo).
- Validación del dígito verificador de CUIT (AFIP/ARCA) — por ahora solo se valida longitud (11 dígitos), a pedido explícito.
- Íconos reales de la PWA (pendiente desde la Fase 0).

---

## Sprint 1.5 — Sistema de Componentes

### ✅ Agregado
- Snackbar de confirmaciones (`useToast`), 4 variantes: éxito, advertencia, error, información.
- Diálogo de confirmación imperativo (`useConfirm`).
- `Select`, `TextField`, `CurrencyField` (formato $ es-AR), `DateField` (nativo), `FileField` (con preview, cámara o galería).
- `SearchField` y `EmptyState`, separados de `ListView` para poder reusarlos sueltos.
- `Card` (tarjeta única de la app) y `Spinner`/`Skeleton` (indicadores de carga).
- Colores semánticos de estado (éxito/advertencia/error/información), en un namespace separado de los 4 colores de acción del brief original.
- Transición de 160ms entre pantallas (CSS puro) y feedback táctil (`active:scale`) uniforme en botones y tarjetas.
- `useModuloOrden`: mecanismo preparado para ordenar el Menú (alfabético ya funciona; "frecuentes" queda como punto de extensión para cuando exista tracking de uso).
- Documento de referencia `docs/sistema-de-componentes.md`.

### 🔧 Cambios
- Las 9 pantallas de módulo pasaron a cargarse con `React.lazy` por ruta — el bundle inicial no crece a medida que se suman módulos reales.

### 🐞 Errores corregidos
- Ninguno relevante (Sprint de construcción, no de corrección).

### ⚠️ Pendiente
- Ningún módulo tenía todavía lógica de negocio real (eso empezó en el Sprint 2, con Clientes).

---

## Sprint 1 — Esqueleto de la aplicación

### ✅ Agregado
- Navegación definitiva: `BottomNav` (Inicio + Menú) y `TopBar` únicas para toda la app, dentro de un `AppShell` común.
- Pantalla Principal: saludo + "Pendientes" (sin gráficos ni indicadores, por diseño).
- Menú: grilla de acceso a los 9 módulos, cada uno con ícono y color propio.
- Pantalla inicial vacía para cada uno de los 9 módulos (buscador + FAB + "No hay ___."), reutilizando `ListView`.
- Diseño mobile-first: bordes negros sutiles, íconos de colores, botones grandes, `safe-area` para notch/gesture bar de Android.

### 🔧 Cambios
- N/A (primer Sprint de interfaz, sobre los cimientos de la Fase 0).

### 🐞 Errores corregidos
- N/A.

### ⚠️ Pendiente
- Ningún módulo tenía funcionalidad de negocio todavía — objetivo explícito del Sprint era validar navegación y diseño, no funcionalidad.

---

## Fase 0 — Cimientos

### ✅ Agregado
- Proyecto base: React + TypeScript + Vite, Tailwind + shadcn/ui, Supabase (Auth + PostgreSQL + Storage), configurado como PWA instalable (sin offline).
- Modelo inicial de base de datos: usuarios, permisos por módulo y acción, catálogos (condición IVA, categorías, estados de cheque, modalidades de pago), clientes, proveedores, productos + historial de precios, configuración.
- Auditoría automática por triggers de PostgreSQL (`audit_log`), RLS basada en una única función `tiene_permiso()`.
- Sistema `core` inicial: `Button` (4 colores de acción), `ListView`, `FormBlock`, autenticación completa.
- Documentación de decisiones de arquitectura (`docs/decisiones/`).

### ⚠️ Pendiente
- Todo lo que se fue resolviendo en los Sprints siguientes.
