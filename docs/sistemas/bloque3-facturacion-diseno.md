# Bloque 3 — Facturación interna: diseño funcional y técnico

Documento de diseño. No incluye implementación. Estructurado en las 4 preguntas que pediste — a partir de ahora, criterio fijo para cualquier módulo nuevo.

Recordatorio del marco que encuadra todo esto (decisión `0025`): comprobante propio de ADMIN, sin validez fiscal, sin ARCA/AFIP, sin CAE, sin stock, sin caja. Integración únicamente con Clientes, Productos y Cuenta Corriente.

---

## 1. ¿Qué reutiliza de lo que ya existe?

Prácticamente todo el andamiaje pesado ya está construido — esto es, sobre todo, una combinación de piezas existentes:

- **`SelectorEntidadDialog`**: elegir el cliente al facturar, mismo componente que ya usan los 4 accesos rápidos de Inicio.
- **El campo `origen = 'factura'`** de `deudas_clientes`: ya existe desde el Sprint de Cuenta Corriente compartida, pensado exactamente para este momento — no hace falta ninguna migración ahí.
- **`useRegistrarDeuda`, `saldo_cliente()`, el libro contable (`LibroCuentaCorriente`)**: la Deuda que genera una factura se ve, se sabe y se calcula con el mismo mecanismo de siempre, sin ningún camino paralelo.
- **Patrón de inmutabilidad completo**: no se edita, solo se anula — mismo `archived_at`/`anulado_por`/`motivo_anulacion` que todo el resto del sistema.
- **`ArchivoAdjunto`/`VisorAdjunto`**: si en algún momento se quisiera adjuntar algo a una factura, ya existe el mecanismo — no forma parte de este bloque salvo que lo pidas.
- **`DataTable`/`ListView`, `EstadoFiltroTabs`, `useArchivable`/`useRestaurar`**: el listado de facturas es una pantalla más, con el mismo lenguaje de siempre.
- **Catálogo de productos (`useProductos`, `precio_actual`)**: fuente de precios al armar una factura — sin tocar nada de Productos.

---

## 2. ¿Qué tablas nuevas necesita?

Dos tablas, más una columna nueva en una tabla ya existente.

### `facturas` (cabecera)
```
id, numero_interno (identity, visible como "FAC-000001"),
cliente_id -> clientes,
fecha,
total,
nota (opcional),
archived_at / anulado_por / motivo_anulacion (mismo patrón de siempre)
```

### `factura_items` (líneas — el detalle de productos)
```
id, factura_id -> facturas,
producto_id -> productos (opcional — ver nota abajo),
descripcion, cantidad, precio_unitario, subtotal
```

**Por qué `descripcion` y `precio_unitario` se copian en vez de leerse en vivo del producto**: si mañana cambia el precio de un producto, una factura de la semana pasada no puede cambiar retroactivamente — mismo principio que ya rige todo lo demás (una compra, un cobro, un ajuste nunca se recalculan según datos actuales). La factura es una fotografía del momento en que se emitió.

**Por qué `producto_id` es opcional**: para poder facturar un concepto que no está en el catálogo (un service, un flete, algo puntual) sin obligar a crear un producto solo para eso. Si no hay producto asociado, `descripcion` se tipea a mano.

### Columna nueva en `deudas_clientes`
```
factura_id uuid references public.facturas(id) -- nullable
```
Para poder ir de una Deuda a la factura que la generó (y viceversa) desde cualquiera de las dos pantallas — trazabilidad, no una relación obligatoria (las deudas que no vienen de una factura siguen sin este dato).

### Permiso nuevo: `facturacion`
Mismo criterio que se usó para `ajustes` — Facturación es una capacidad propia, no heredada de Clientes. Alguien podría gestionar Clientes sin poder emitir facturas, o viceversa.

---

## 3. ¿Qué pantallas nuevas agrega?

- **Listado de Facturas** (`/facturacion`): todas las facturas del sistema, con el mismo patrón que cualquier otro listado (buscador, filtro por condición de pago, Activos/Archivados, tabla en escritorio, lista en celular).
- **Nueva factura** (`/facturacion/nueva`): pantalla completa, no un diálogo — elegir cliente, agregar líneas (buscar producto o cargar uno libre, cantidad, precio autocompletado pero editable), condición de pago, total calculado en vivo.
- **Detalle de factura**: los datos, las líneas, el total, el estado (activa/anulada), botón Anular, botón Exportar/Imprimir, y si generó una deuda, un enlace directo a esa deuda en el Estado de Cuenta del cliente.
- **Entrada en el Menú**: Facturación pasa a ser un módulo visible más, con su ícono — ya no es infraestructura interna como Pagos o Cuenta Corriente.

**Pregunta para vos**: ¿sumamos "Nueva factura" como un quinto acceso rápido en Inicio (mismo patrón que Agregar deuda/Registrar cobro — elegís el cliente y vas directo), o el flujo normal de entrar a Facturación desde el Menú es suficiente por ahora?

---

## 4. ¿Qué impacto tiene sobre los demás módulos?

- **Clientes**: sin cambios de comportamiento. Se suma un enlace "Facturas" en la Ficha/Estado de Cuenta para ver las facturas de ese cliente puntual, filtrando el listado general.
- **Productos**: sin cambios de comportamiento. `precio_actual` se usa como valor por defecto al agregar una línea, nada más.
- **Cuenta Corriente**: toda factura genera automáticamente una fila en `deudas_clientes` — mismo mecanismo, misma función, mismo libro contable, siempre, sin excepción. Documentar una operación (facturar) y registrar un movimiento de dinero (cobrar) son procesos completamente separados — no existe una factura "ya cobrada" que se salte este paso; el cobro se registra después, aparte, con el Motor de Pagos que ya existe (decisión corregida — ver 0029).
- **Proveedores**: ningún impacto — Facturación se integra únicamente con Clientes, como especificaste.
- **Permisos**: nuevo permiso `facturacion`, más una decisión de RLS que necesito que confirmes (siguiente sección).

---

## 5. Decisiones que necesito que confirmes antes de programar

### 5.1 Anular una factura que generó una deuda
Si se anula una factura "a cuenta corriente", propongo que la Deuda que generó se anule automáticamente con ella (para que el saldo del cliente se corrija solo) — sin eso, quedaría una deuda "huérfana" de una factura que ya no existe. ¿De acuerdo?

### 5.2 Permiso para crear la Deuda automática
Quien emite una factura tiene el permiso `facturacion`, pero insertar en `deudas_clientes` hoy exige el permiso `clientes` — dos caminos posibles:
- **(a)** Ampliar la política de `deudas_clientes` para aceptar también el permiso `facturacion` al insertar (recomendado: quien puede facturar, puede generar la consecuencia directa y documentada de facturar).
- **(b)** Exigir que cualquier usuario que emita facturas tenga también el permiso de Clientes.

### 5.3 PDF / impresión
Para exportar o imprimir el comprobante, propongo usar el diálogo de impresión nativo del navegador (con una hoja de estilos pensada para impresión) en vez de sumar una librería de generación de PDF — en Android Chrome y en cualquier navegador de escritorio, "Imprimir" ya ofrece "Guardar como PDF" sin que ADMIN tenga que generar el archivo. Es más simple y no agrega dependencias. ¿De acuerdo, o preferís un PDF generado directamente por la aplicación?

### 5.4 Numeración
¿"FAC-000001" (mismo criterio que el resto: `numero_interno` correlativo, sin reiniciar por año) es suficiente, o necesitás que la numeración reinicie cada año calendario (un formato más parecido al de una factura real, aunque esta no tenga validez fiscal)?

---

Con estas cuatro respuestas, el diseño queda completamente cerrado y puedo empezar a programar.
