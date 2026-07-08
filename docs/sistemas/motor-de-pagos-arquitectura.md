# Motor de Pagos — Propuesta de arquitectura (Sprint 3)

Documento de diseño. No incluye implementación. El objetivo de este Sprint es la **infraestructura reutilizable**, no una pantalla de "Pagos" — el primer consumidor real va a ser la sección "Movimientos" del Estado de cuenta de Clientes (hoy vacía a propósito, ver Sprint 2), y después Proveedores.

---

## 1. El problema, en una frase

Clientes cobra, Proveedores paga, Empleados paga (sueldos), Contador paga (honorarios/impuestos). Son cuatro módulos distintos haciendo, en el fondo, la misma operación: registrar que se movió dinero, con quién, cuánto, cuándo y de qué forma. Si cada módulo construye su propia tabla y su propia pantalla para esto, vamos a terminar con cuatro versiones ligeramente distintas de lo mismo — exactamente el tipo de duplicación que el proyecto quiere evitar.

---

## 2. Alcance real de este Sprint (importante)

El pedido incluye Empleados y Contador, pero **esos módulos todavía no existen** — no hay tabla `empleados` ni tabla que represente ítems de Contador. No puedo crear una referencia (`FOREIGN KEY`) a una tabla que no existe.

**Propongo:** diseñar el motor de forma genérica para los cuatro, pero **conectarlo hoy únicamente a Clientes y Proveedores** (las dos tablas que sí existen). Cuando se programen Empleados y Contador, sumar su columna de referencia es una migración chica que no toca nada de lo ya construido — el motor está pensado para eso desde el modelo de datos (sección 3). Lo marco como pregunta abierta en la sección 8 por si preferís otro orden.

---

## 3. Modelo de datos

### 3.1 Decisión de diseño: FK reales, no asociación polimórfica

Hay dos formas típicas de modelar "esto puede pertenecer a distintos tipos de entidad":

- **(a) Asociación polimórfica**: una columna `entidad_tipo` (texto: `'cliente' | 'proveedor'...`) + una columna `entidad_id` (uuid) sin `FOREIGN KEY` real, porque un FK no puede apuntar "condicionalmente" a distintas tablas.
- **(b) Una columna nullable por tipo de entidad** (`cliente_id`, `proveedor_id`, ...), cada una con su propio `FOREIGN KEY` real, y un `CHECK` que exige que exactamente una esté completa.

**Propongo (b).** Es más verbosa (una columna de más por cada entidad futura), pero mantiene integridad referencial real: la base de datos garantiza que un pago no puede apuntar a un cliente que no existe, ON DELETE/CASCADE funciona normal, y los índices son directos. La opción (a) es más compacta pero renuncia a esas garantías — y este proyecto ya eligió integridad real sobre compacidad en cada decisión anterior (los `CHECK` de la migración `0009`, los catálogos en vez de strings libres). Sería inconsistente cambiar de criterio acá.

### 3.2 Catálogo nuevo: `medios_pago`

Mismo patrón que `condiciones_iva`, `categorias_productos`, etc. (Fase 0) — catálogo editable, no un `ENUM`.

```
medios_pago
  id            uuid pk
  nombre        text unique not null   -- Efectivo, Transferencia, Cheque, Tarjeta, Otro
  orden         int
```

### 3.3 Tabla nueva: `movimientos`

```
movimientos
  id                uuid pk
  tipo              text not null check (tipo in ('cobro', 'pago'))
  cliente_id        uuid references clientes(id)     -- solo si tipo = 'cobro'
  proveedor_id      uuid references proveedores(id)  -- solo si tipo = 'pago'
  monto             numeric(12,2) not null check (monto > 0)
  fecha             date not null default current_date
  medio_pago_id     uuid not null references medios_pago(id)
  cheque_id         uuid   -- columna preparada, SIN FK todavía (no existe la tabla cheques) — ver sección 6
  nota              text   -- opcional, breve
  archived_at       timestamptz  -- ver sección 4 (¿"archivar" o "anular"?)
  created_at        timestamptz not null default now()
  updated_at        timestamptz not null default now()

  check (
    (tipo = 'cobro' and cliente_id is not null and proveedor_id is null)
    or
    (tipo = 'pago' and proveedor_id is not null and cliente_id is null)
  )
```

`fecha` (cuándo ocurrió el pago) se guarda separada de `created_at` (cuándo se cargó en el sistema) a propósito — alguien puede cargar hoy un pago que recibió hace tres días, y "Estado de cuenta" debe poder ordenar y filtrar por la fecha real del movimiento, no por cuándo se tipeó.

**Extensión futura (no en este Sprint):** cuando existan Empleados y Contador, se agregan `empleado_id` y `contador_item_id` (nullable, con su FK) y se amplía el `CHECK` para cubrir los dos casos nuevos. No requiere tocar ninguna fila existente.

---

## 4. ¿"Archivar" o "Anular"? — inmutabilidad de los movimientos

Esto es una decisión de negocio, no solo técnica, y la marco como la más importante de este documento.

**Propongo que un movimiento, una vez guardado, no se pueda modificar** (no hay pantalla de "Editar pago"). Si se cargó mal, la corrección es **anularlo** (mismo mecanismo que archivar — no se borra, se marca) y, si corresponde, cargar el movimiento correcto como uno nuevo. Es la práctica estándar para cualquier registro contable/financiero: la historia de "qué se cargó y cuándo" no debería poder reescribirse, solo corregirse con un nuevo asiento — de lo contrario, el historial de auditoría de un pago ("se modificó tal fecha") no sirve de mucho si el monto original ya no se puede reconstruir.

Uso el mismo nombre de columna (`archived_at`) que el resto de la app por consistencia técnica (mismas queries, mismo patrón de RLS, mismo trigger), pero en la interfaz el botón y el mensaje dicen **"Anular"**, no "Archivar" — es el verbo correcto para un movimiento de dinero y evita que se lea como "ocultar", cuando lo que comunica es "esto no es válido".

**¿Confirmás este criterio, o preferís que los movimientos sí se puedan editar como cualquier otro registro?** Es la pregunta que más cambia el diseño de la pantalla, así que prefiero confirmarla antes de programar nada.

---

## 5. Flujo

```
Ficha de Cliente/Proveedor
        │
        ▼
Estado de cuenta ──► "Movimientos" (ahora con datos reales)
        │
        ├─► Botón "Registrar cobro" / "Registrar pago" (FAB, mismo lugar de siempre)
        │         │
        │         ▼
        │   Diálogo "Registrar cobro" (monto, fecha, medio de pago, nota)
        │         │
        │         ▼
        │   Guardar ──► INSERT a movimientos ──► toast.exito ──► la lista se refresca
        │
        └─► Tocar un movimiento existente ──► detalle simple (mismo diálogo, en modo lectura) ──► botón "Anular" (con confirmación)
```

No hay una pantalla "Pagos" en el Menú ni una ruta propia — se entra siempre desde la entidad (Cliente o Proveedor), que es como el brief pensó "Estado de cuenta" desde el principio.

---

## 6. Integración futura con Cheques

El catálogo `medios_pago` ya incluye "Cheque" desde este Sprint — un usuario puede registrar hoy un cobro/pago "por cheque" sin que exista todavía el módulo Cheques, simplemente como un dato de texto (qué medio se usó).

La columna `cheque_id` queda **preparada pero sin `FOREIGN KEY`** hasta que exista la tabla `cheques` — en ese momento, una migración agrega la referencia real y el formulario de Registrar cobro/pago agrega un selector opcional de "¿qué cheque?" cuando el medio es "Cheque". No hace falta ningún cambio de estructura, solo completar lo que ya está previsto.

---

## 7. Integración futura con saldo a favor — necesito tu definición

Acá tengo que ser honesto sobre una limitación real: "saldo a favor" (que un cliente pagó de más y tiene crédito para el futuro) solo tiene sentido si en algún lado existe el concepto de "cuánto debe" — y **hoy ADMIN no modela deuda ni cargos en ningún lado** (no hay Facturas, no hay un total pendiente por cliente). El brief original solo menciona "facturas pendientes" como ejemplo de qué podría aparecer en Pendientes, pero nunca se definió un módulo de facturación.

No quiero inventar ese comportamiento sin que me digas cómo lo pensás. Dos caminos posibles, bien distintos:

- **(a) Saldo a favor "simple"**: se calcula solo a partir de cobros no vinculados a nada (`SUM(monto)` de cobros del cliente) — es decir, todo cobro es, por ahora, un crédito a favor del cliente, sin restar ninguna deuda (porque no existe el concepto de deuda todavía). Esto es fácil de calcular con lo que este Sprint ya deja armado, pero es un número que hoy no significa "lo que falta cobrarle", sino simplemente "cuánto pagó en total".
- **(b) Saldo a favor "real"**: requiere primero modelar cargos/deuda (facturas, o al menos un monto adeudado por cliente) — que es un módulo nuevo, no contemplado en el brief original, y una decisión de producto más grande que este Sprint.

**No voy a avanzar con ninguna de las dos sin que la definas.** Lo que sí puedo asegurar es que el modelo de `movimientos` de este Sprint no bloquea ninguna de las dos — ambas se construyen encima, no en contra.

---

## 8. Componentes reutilizables (estrategia para evitar duplicación)

**Casi todo el formulario ya existe en el Design System** — nada nuevo salvo el contenedor:

| Campo | Componente |
|---|---|
| Monto | `CurrencyField` (ya existe) |
| Fecha | `DateField` (ya existe) |
| Medio de pago | `Select` (ya existe) |
| Nota | `CampoTextoLargo` (ya existe) |
| Guardar / Cancelar | `Button` (ya existe) |
| Confirmación de anular | `useConfirm` (ya existe) |
| Aviso de éxito/error | `useToast` (ya existe) |

**Dos piezas nuevas, genéricas y compartidas** (no específicas de Clientes ni de Proveedores):
- `RegistrarMovimientoDialog` — el formulario de arriba, parametrizado por `tipo` (`'cobro' | 'pago'`) y la entidad (`clienteId` o `proveedorId`).
- `ListaMovimientos` — lista cronológica de movimientos de una entidad (mismo espíritu que `HistorialAuditoria` del Sprint 2: de solo lectura salvo el botón Anular, sin buscador ni FAB propio).

**¿Dónde viven?** Los pongo en un módulo nuevo `src/modules/pagos/` — mismo patrón de carpeta que `clientes/` (con su propio `api.ts`, `types.ts`, `validaciones.ts`), pero **sin pantallas propias ni ruta en el Menú** — es lógica y componentes que Clientes y Proveedores importan. No lo pongo dentro de `core/` porque `core/` es para piezas agnósticas de negocio (un botón, una tarjeta); "movimiento", "cobro" y "pago" son conceptos de negocio específicos, y mezclar eso en `core/` rompería la separación que ya definimos en `docs/decisiones/0001`.

Esto es exactamente la estrategia anti-duplicación: **un solo lugar** con la lógica de datos y **dos componentes** de interfaz, consumidos por Clientes hoy y por Proveedores (y más adelante Empleados/Contador) sin reescribir nada.

---

## 9. Validaciones

| Regla | Frontend | Base de datos |
|---|---|---|
| Monto obligatorio, mayor a cero | Sí | `CHECK (monto > 0)` |
| Fecha obligatoria | Sí (default: hoy) | `NOT NULL`, default `current_date` |
| Medio de pago obligatorio | Sí (`Select`) | `NOT NULL` + `FOREIGN KEY` |
| Exactamente una entidad según el tipo | Se arma así desde el formulario (no lo elige el usuario) | `CHECK` (sección 3.3) |
| Nota | Ninguna (opcional, texto libre) | Ninguna |

**Pregunta abierta:** ¿la fecha del movimiento puede ser futura (ej. registrar un pago programado) o debe ser hoy o anterior? El brief no lo define y no quiero asumir — si la respuesta es "no puede ser futura", agrego `CHECK (fecha <= current_date)`.

---

## 10. Integración con auditoría

No requiere ningún mecanismo nuevo: `movimientos` se suma a la lista de tablas con el trigger genérico ya existente (`registrar_auditoria()`, Fase 0) —

```sql
create trigger audit_movimientos after insert or update on public.movimientos
  for each row execute function public.registrar_auditoria();
```

— y automáticamente cada alta y cada anulación queda registrada en `audit_log`, igual que Clientes y Proveedores. `ListaMovimientos` puede, si hace falta, mostrar quién anuló un movimiento usando `HistorialAuditoria` para ese registro puntual, exactamente igual que ya funciona en Clientes.

**Permisos:** no propongo crear un módulo de permiso nuevo llamado "Pagos" — la lista fija de módulos con permiso (`clientes`, `proveedores`, ...) ya está definida y el brief pidió no agregar módulos nuevos. En cambio, propongo que **el permiso para ver/crear un movimiento se herede del permiso de la entidad relacionada**: registrar un cobro de un cliente requiere permiso de `crear` en Clientes; registrar un pago a un proveedor requiere permiso de `crear` en Proveedores. Es coherente con cómo ya funciona `audit_log` desde la migración `0010` (permiso de la tabla de origen, no un módulo aparte). ¿Estás de acuerdo con este criterio?

---

## 11. Resumen de preguntas abiertas

1. **Inmutabilidad** (sección 4): ¿movimientos no editables, solo anulables? — es la definición más importante de este documento.
2. **Alcance** (sección 2): ¿de acuerdo en conectar el motor solo a Clientes y Proveedores por ahora, y sumar Empleados/Contador cuando esos módulos existan?
3. **Saldo a favor** (sección 7): ¿opción (a) simple o (b) requiere modelar deuda primero? Necesito tu definición antes de que este concepto aparezca en cualquier pantalla.
4. **Fecha futura** (sección 9): ¿se permite o se bloquea?
5. **Permisos** (sección 10): ¿heredados de la entidad relacionada, sin crear un módulo "Pagos" nuevo?
6. **Ubicación del código** (sección 8): ¿`src/modules/pagos/` sin pantalla propia, como propongo, o preferís otra organización?

Con estas seis definiciones, la implementación completa (migraciones + `RegistrarMovimientoDialog` + `ListaMovimientos` + integración real en el Estado de cuenta de Clientes) queda lista para programarse.
