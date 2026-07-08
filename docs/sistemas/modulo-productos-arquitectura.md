# Módulo Productos — Propuesta funcional y técnica (Sprint 5)

Documento de diseño. No incluye implementación. Enfoque pedido: catálogo y actualización de precios — no se integra con Compras todavía (queda como diseño preparado, sección 9).

---

## 1. Punto de partida: gran parte de esto ya existe desde la Fase 0

Antes de proponer nada nuevo, es importante que veas lo que ya está construido y probado desde los cimientos del proyecto — este Sprint agrega mucho menos backend nuevo de lo que parece a primera vista:

- La tabla `productos` y `categorias_productos` ya existen, con exactamente los 4 campos del brief.
- La tabla `historial_precios` ya existe.
- **Las reglas de actualización del brief ya están implementadas como triggers**, desde la migración `0005`: al `INSERT` se registra el precio inicial en el historial; al `UPDATE` de `precio_actual`, se registra una entrada nueva en el historial **solo si el precio efectivamente cambió** — exactamente "si el código existe, actualizar precio, mantener categoría, mantener historial; si el precio no cambió, no registrar". Esto vale sin importar si el cambio de precio viene de una edición manual o de una importación masiva, porque el trigger está atado a la tabla, no a una pantalla.
- La auditoría (`audit_productos`) y las políticas de RLS de `productos`, `categorias_productos` e `historial_precios` ya existen (migraciones `0006` y `0008`).

Lo que falta es: la interfaz (pantallas), completar dos validaciones de la base que quedaron pendientes, y el mecanismo de importación de listas (que no existía en ningún lado todavía).

---

## 2. Modelo de datos — cambios mínimos

**Sin tablas nuevas para el catálogo y el historial** (ya existen). Dos ajustes chicos a lo ya construido:

- `productos.precio_actual` no tiene ningún `CHECK` todavía — se agrega `CHECK (precio_actual > 0)`, mismo criterio que `monto` en Compras y Movimientos.
- `productos.codigo_barras` ya es `UNIQUE`, pero esa restricción es **global**, no distingue productos archivados. Esto importa para la importación (ver sección 5.5) — no requiere cambiar el esquema, pero sí la lógica de importación tiene que contemplarlo.

---

## 3. Categorías — cómo se crean "manualmente"

El brief dice "las categorías son creadas manualmente" pero no define dónde. Propongo que se creen **en el momento en que hacen falta**, no en una pantalla de administración separada: el `Select` de categoría, en el Alta/Modificación de producto, tiene una opción "**+ Nueva categoría**" que abre un campo de texto inline; al confirmar, se crea la categoría y queda seleccionada. Es una extensión genérica del componente `Select` del Design System (prop nueva `onCrearOpcion`), no algo específico de Productos — cualquier catálogo futuro con el mismo problema (crear una opción nueva sin salir del formulario) la puede reusar.

**No propongo** una pantalla dedicada de "Gestionar categorías" en este Sprint — hoy ningún catálogo del sistema (condición IVA, medios de pago, estados de cheque) tiene una, y no es parte de lo pedido. Si en algún momento hace falta editar o eliminar una categoría existente, es una pantalla chica que se agrega después sin tocar nada de esto.

---

## 4. Preguntas abiertas (necesito tu decisión antes de programar)

### 4.1 Formato del archivo de importación
¿Las listas de precios que se reciben de los proveedores vienen como **CSV** (texto plano, más simple de leer) o como **Excel (.xlsx)**? Son dos librerías distintas y no quiero asumir. Recomiendo empezar por **CSV solamente** (más liviano, sin necesitar convertir binarios) y sumar Excel más adelante si en la práctica los proveedores mandan `.xlsx` — no es una decisión que bloquee nada del resto del diseño.

### 4.2 ¿Qué columnas trae el archivo, y cómo se identifican?
Propongo un archivo con **encabezado** (primera fila con nombres de columna) y que ADMIN busque las columnas por **nombre**, no por posición fija — `codigo_barras`, `nombre`, `precio` (sin importar mayúsculas ni el orden en que vengan). Es más tolerante a que cada proveedor arme el archivo un poco distinto. ¿Te sirve este criterio, o preferís un formato de columnas fijo y exigirle al usuario que acomode el archivo antes de importar?

### 4.3 ¿Actualizar también el nombre del producto al importar, o solo el precio?
El brief es explícito en "mantener categoría", pero no dice qué hacer con el nombre cuando el código ya existe. Propongo actualizarlo también (si el proveedor corrigió una descripción, conviene reflejarlo), pero es una decisión de negocio, no técnica. ¿Lo confirmás, o preferís que el nombre nunca cambie por importación (solo por edición manual)?

### 4.4 ¿Un producto archivado que reaparece en una lista, se reactiva solo?
Como `codigo_barras` es único en toda la tabla (no distingue archivados), si un producto que archivaste hace tiempo vuelve a aparecer en una lista nueva del proveedor, la importación va a encontrar coincidencia igual. Propongo que en ese caso **se reactive automáticamente** (`archived_at` vuelve a `NULL`) — que un código vuelva a aparecer en una lista de precios es una señal razonable de que el producto volvió a estar disponible. ¿Estás de acuerdo, o preferís que un producto archivado quede afuera de la importación (y haya que reactivarlo a mano primero)?

### 4.5 ¿La categoría es obligatoria en el alta manual?
El archivo de importación no trae categoría (no es un dato que el proveedor tenga), así que un producto nuevo creado por importación necesariamente entra sin categorizar. Propongo:
- En el **alta manual**, la categoría es obligatoria (mantiene el catálogo prolijo).
- Los productos que entran **por importación** quedan con categoría vacía ("Sin categorizar"), con la posibilidad de filtrarlos después para completarla.

¿De acuerdo con este criterio mixto, o preferís que la categoría sea siempre opcional (incluso en alta manual)?

---

## 5. Reglas de actualización (resumen, incorporando las respuestas anteriores)

**Alta manual:** código de barras, nombre y precio obligatorios; categoría obligatoria (sujeto a 4.5). Se crea el producto, el trigger ya existente registra el precio inicial en el historial.

**Modificación manual:** mismos campos editables. Si se cambia el precio, el trigger ya existente registra la nueva entrada en el historial — automático, no requiere ningún código nuevo en el frontend más allá de hacer el `UPDATE`.

**Importación (por cada fila del archivo):**
1. Si `codigo_barras` ya existe → `UPDATE` de `precio_actual` (y `nombre`, sujeto a 4.3). Categoría **nunca** se toca. Si estaba archivado, se reactiva (sujeto a 4.4). El historial se actualiza solo si el precio cambió (ya lo hace el trigger).
2. Si `codigo_barras` es nuevo → `INSERT` con categoría vacía (sujeto a 4.5). El trigger registra el precio inicial.

Todo esto se resuelve con un único `UPSERT` (`INSERT ... ON CONFLICT (codigo_barras) DO UPDATE ...`) — una sola sentencia SQL por lote, no un loop fila por fila desde el frontend. Con archivos grandes (pensando en escala, mismo criterio que el listado de Clientes del Sprint 2), se envía en lotes de algunos cientos de filas por vez, no todo en una sola operación gigante.

---

## 6. Pantallas

| Ruta | Pantalla |
|---|---|
| `/productos` | Listado |
| `/productos/nuevo` | Alta |
| `/productos/:id` | Ficha (incluye el historial de precios — ver 6.4) |
| `/productos/:id/editar` | Modificación |
| `/productos/importar` | Importar lista |

### 6.1 Listado de productos
Mismo patrón que Clientes/Proveedores (`ListView`). Buscador por nombre o código de barras. **Cero componentes nuevos.**

### 6.2 Alta / Modificación de producto
Un `FormBlock`: código de barras, nombre, categoría (`Select` con quick-add, sección 3), precio (`CurrencyField`, ya existe). **Cero componentes nuevos** más allá de la mejora al `Select`.

### 6.3 Ficha del producto (con historial de precios integrado)
A diferencia de Proveedores, acá **no propongo una pantalla separada** tipo "Estado de cuenta" — el historial de precios es un solo tipo de dato relacionado, no varias secciones distintas (Proveedores tenía Saldo + Compras + Pagos + Actividad, que sí justificaban una pantalla aparte). La Ficha muestra los datos del producto (`CampoSoloLectura`) y, debajo, la lista cronológica de precios.

```
┌───────────────────────────────────┐
│ [Nombre del producto]              │
│ Código: 7791234567890              │
│ Categoría: Almacén                 │
│ Precio actual: $ 1.250              │
├───────────────────────────────────┤
│ Historial de precios               │
│  15/06/2026    $ 1.250             │
│  02/03/2026    $ 1.100             │
│  10/01/2026    $   980             │
└───────────────────────────────────┘
[Modificar]  [Archivar]
```

**Componente nuevo:** `HistorialPrecios` — lista cronológica de `historial_precios` de un producto, mismo espíritu que `HistorialAuditoria` (Sprint 2) y `ListaCompras`/`ListaMovimientos` (Sprints 3-4): de solo lectura, sin buscador ni FAB. Vive en `src/modules/productos/` — es específico de Productos, no lo va a reusar otro módulo hoy.

### 6.4 Importar lista
Pantalla de 3 pasos, no un diálogo (a diferencia de Registrar cobro/compra, esto es una operación más pesada que merece su propia pantalla):

1. **Elegir archivo** — `FileField` extendido (sección 7) para aceptar CSV, no solo imágenes.
2. **Previsualizar** — antes de tocar la base de datos, se muestra un resumen: cuántos productos se van a crear, cuántos se van a actualizar (con precio anterior → nuevo), y cualquier fila con error (código o precio faltante/inválido) sin bloquear el resto. El usuario ve exactamente qué va a pasar antes de confirmar.
3. **Confirmar** — ejecuta el `UPSERT` por lotes, `toast.exito('Se importaron N productos')`, vuelve al listado.

**Estados:** carga del archivo (spinner corto mientras se parsea), vacío (archivo sin filas válidas → mensaje claro, no se habilita "Confirmar"), error (archivo con formato irreconocible → mensaje explicando qué se esperaba).

---

## 7. Componentes reutilizables

| Necesidad | Componente |
|---|---|
| Código de barras, nombre | `TextField` (ya existe) |
| Categoría, con quick-add | `Select` (ya existe, **mejora**: prop `onCrearOpcion`) |
| Precio | `CurrencyField` (ya existe) |
| Guardar / Cancelar / Archivar | `Button` (ya existe) |
| Confirmación de archivado | `useConfirm` (ya existe) |
| Aviso de éxito/error | `useToast` (ya existe) |
| Historial de precios | `HistorialPrecios` — **nuevo**, específico de Productos |
| Selector de archivo (CSV) | `FileField` — **mejora**: hoy solo maneja imágenes (preview con `<img>`); se generaliza para mostrar un chip con el nombre del archivo cuando no es una imagen, en vez de romperse. Reutilizable para cualquier adjunto no-imagen futuro (ej. comprobantes de Compras/Movimientos, ya reservados desde los Sprints 3 y 4). |
| Parseo de CSV | Nueva dependencia: **`papaparse`** — parseo de CSV robusto (comillas, comas dentro de campos, distintos separadores) sin tener que escribirlo a mano. Es una librería chica, angosta en su propósito, coherente con "elegir la solución más simple" (no traigo una librería de spreadsheets completa si solo hace falta leer CSV — ver pregunta 4.1). |

---

## 8. Validaciones

| Campo | Frontend | Base de datos |
|---|---|---|
| `codigo_barras` | Requerido | `NOT NULL`, `UNIQUE` (ya existe). **Sin** formato fijo (no se asume EAN-13) — hay negocios con códigos propios además de los de fábrica. |
| `nombre` | Requerido | `NOT NULL` (ya existe) |
| `precio_actual` | Requerido, mayor a cero | **Nuevo:** `CHECK (precio_actual > 0)` |
| `categoria_id` | Obligatoria en alta manual (sujeto a 4.5) | Sin cambios — sigue siendo nullable a nivel de base para no bloquear la importación |
| Importación — cada fila | Fila con código o precio inválido/faltante se marca con error y se excluye del resumen a confirmar, sin frenar el resto del archivo | Los mismos `CHECK` de arriba aplican también acá — es la misma tabla |

---

## 9. Integración futura con Compras

El documento de arquitectura de Proveedores (Sprint 4, sección 3.2) ya dejó esto anotado: cuando Productos esté completamente funcional, se puede evaluar que una Compra tenga líneas de detalle, cada una apuntando a un producto real. Este Sprint no lo implementa, pero el diseño ya es compatible sin ningún cambio: `productos.id` es una referencia estable, así que una futura tabla `compras_detalle` (con `compra_id`, `producto_id`, `cantidad`, `precio_unitario`) se puede agregar en cualquier momento sin tocar nada de lo construido acá. No hay nada que "dejar preparado" de forma especulativa en este Sprint — la compatibilidad ya existe por cómo está modelado `productos` desde la Fase 0.

---

## 10. Integración con auditoría

Sin trabajo nuevo: `productos` ya tiene el trigger genérico de auditoría desde la Fase 0. Una importación masiva va a generar una entrada de auditoría por cada fila insertada o actualizada (igual que cualquier otro `INSERT`/`UPDATE`) — no se necesita un mecanismo de auditoría "de la importación como operación", el rastro completo ya queda, producto por producto, en el mismo `audit_log` de siempre.

---

## 11. Resumen de preguntas abiertas

1. **Formato del archivo** (4.1) — recomiendo CSV solamente por ahora.
2. **Columnas por nombre, no por posición** (4.2) — recomiendo sí.
3. **Actualizar nombre en la importación** (4.3) — recomiendo sí.
4. **Reactivar automáticamente un producto archivado que reaparece** (4.4) — recomiendo sí.
5. **Categoría obligatoria solo en alta manual** (4.5) — recomiendo sí.

Con estas cinco definiciones, la migración del `CHECK` de precio, la mejora a `Select` y `FileField`, `HistorialPrecios`, y la pantalla de Importar (parseo + preview + upsert por lotes) quedan listas para programarse.
