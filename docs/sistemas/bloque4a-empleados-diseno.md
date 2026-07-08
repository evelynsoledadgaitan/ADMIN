# Bloque 4A — Empleados: diseño funcional y técnico

Documento de diseño. No incluye implementación. Estructurado en las 4 preguntas fijas para cualquier módulo nuevo.

Marco: ADMIN administra, no liquida sueldos. Sin cálculos laborales, sin recibos de sueldo, sin AFIP, sin vacaciones/aguinaldo automáticos (decisión `0025`, extendida acá). Lo que sí necesita: administrar el empleado como dato maestro, su documentación, y un historial simple — cronológico, sin saldo — de pagos y adelantos.

---

## 1. ¿Qué reutiliza de lo que ya existe?

- **`modalidades_pago_empleado`**: catálogo ya creado y sembrado desde la Fase 0 ("Por hora", "Importe fijo"), nunca usado hasta ahora — es exactamente el campo "Modalidad de pago" del brief original.
- **`ArchivoAdjunto`/`VisorAdjunto`**: el sistema de adjuntos completo (Bloque 1), para la documentación del empleado.
- **`DataTable`/`ListView`, `EstadoFiltroTabs`, `useArchivable`/`useRestaurar`**: mismo patrón de listado que Clientes/Proveedores/Productos.
- **Patrón de inmutabilidad**: un pago o un adelanto se carga y no se edita, solo se anula — igual que todo lo demás.
- **`medios_pago`** (catálogo del Motor de Pagos): un pago a un empleado también se hace en efectivo, transferencia, etc. — mismo catálogo, sin duplicarlo.
- **Identidad visual, componentes de formulario, Card, Button**: sin ninguna diferencia con el resto de la aplicación.

---

## 2. ¿Qué tablas nuevas necesita?

Tres tablas — y acá hay una decisión de arquitectura que quiero dejar explícita antes de programar.

### `empleados` (dato maestro)
```
id, nombre_apellido, modalidad_pago_id -> modalidades_pago_empleado,
valor (por hora o importe fijo, según la modalidad),
archived_at / anulado_por / motivo_anulacion (mismo patrón de siempre)
```

### `documentos_empleados` — la novedad real de este módulo
```
id, empleado_id -> empleados,
tipo_documento (texto libre o un pequeño catálogo: DNI, Contrato, Apto médico, Otro),
comprobante_path,
archived_at (para poder "reemplazar" un documento vencido sin perder el historial — se archiva el viejo, se sube uno nuevo)
```
**Por qué es distinto a lo que ya existe**: hasta ahora, cualquier cosa que llevara un adjunto (una deuda, un ingreso, un movimiento, una factura) tenía **como mucho un archivo**. Un empleado puede tener varios documentos a la vez (DNI, contrato, apto médico...) — es la primera relación de "uno a muchos" adjuntos que aparece en el sistema. La solución es una tabla propia (no un cambio al sistema de adjuntos en sí, que sigue siendo el mismo `ArchivoAdjunto`/`VisorAdjunto` de siempre) donde cada fila es un documento, con su propio archivo.

### `pagos_empleados` — decisión de arquitectura a confirmar
Acá tengo que elegir entre dos caminos, y prefiero que la decisión sea tuya:

- **(a) Tabla propia, separada del Motor de Pagos** — mi recomendación. Mismo espíritu que `compras`/`deudas_clientes` (una tabla "gemela", no una extensión de lo compartido): `empleado_id`, `tipo` ('pago' | 'adelanto'), `monto`, `fecha`, `medio_pago_id`, `nota`, comprobante opcional, inmutable. **Sin saldo, sin cuenta corriente** — es un historial cronológico, nada más, coherente con "sin liquidación de sueldos".
- **(b) Extender `movimientos`** (el Motor de Pagos actual) para admitir una tercera entidad (`empleado_id`, además de `cliente_id`/`proveedor_id`). Ya está anotado desde hace tiempo (decisión `0023`) que esta es "la única limitación real de escala" de esa tabla — hoy pensada para dos entidades, no tres.

Recomiendo (a) por el mismo motivo que separamos Deudas de Compras en su momento: `movimientos` ya es una pieza compartida, probada y cerrada de Clientes y Proveedores — tocarla para sumar una tercera entidad es más riesgo (hay que revisar RLS, índices, y toda consulta existente que asuma "es cliente o proveedor") a cambio de ahorrar una tabla chica. Una tabla propia para empleados es más código pero cero riesgo sobre algo que ya funciona. ¿Coincidís, o preferís extender el Motor de Pagos?

---

## 3. ¿Qué pantallas nuevas agrega?

- **Listado de Empleados** (`/empleados`): mismo patrón que Clientes/Proveedores — buscador, Activos/Archivados, alta/editar/archivar/restaurar.
- **Alta/Modificación de Empleado**: Nombre y apellido, Modalidad de pago (select del catálogo existente), Valor (por hora o importe fijo, mismo campo, la etiqueta cambia según la modalidad elegida).
- **Ficha del Empleado**, con dos secciones:
  - **Documentación**: lista de documentos cargados (tipo, fecha, ver/descargar), botón para agregar uno nuevo (elige tipo + adjunta el archivo).
  - **Pagos y adelantos**: historial cronológico (más reciente primero, como el resto del sistema — a diferencia del libro contable de Clientes/Proveedores, acá no hay saldo que acumular), botón "Registrar pago" y "Registrar adelanto" (o un único diálogo con un selector de tipo, a definir en el detalle técnico).

No hay Estado de Cuenta de Empleados — no existe el concepto de saldo acá, a propósito.

---

## 4. ¿Qué impacto tiene sobre los demás módulos?

- **Ninguno sobre Clientes, Proveedores, Productos o Facturación** — Empleados no se relaciona con ningún otro módulo (a diferencia de Facturación, que sí se integraba con Clientes y Cuenta Corriente). Es el primer módulo del roadmap que es completamente autocontenido.
- **Permisos**: nuevo permiso `empleados` (ya estaba previsto en la lista original de 10 módulos desde la Fase 0 — no hace falta agregarlo al `CHECK` de `permisos.modulo`, ya existe).
- **Storage**: el bucket `adjuntos` necesita sumar el prefijo `empleados` a sus políticas (mismo mecanismo ya usado para sumar `facturacion`).
- **Inicio**: no propongo ningún acceso rápido nuevo ni tarjeta de "Pendientes" para este módulo — no hay una operación diaria de alta frecuencia evidente (a diferencia de Agregar deuda/Registrar cobro). Si en el uso real aparece una, se suma después.

---

## 5. Lo que necesito que confirmes antes de programar

1. **Tabla propia para pagos/adelantos** (opción a) en vez de extender el Motor de Pagos — ¿de acuerdo?
2. **Tipo de documento**: ¿un catálogo chico y fijo (DNI, Contrato, Apto médico, Otro) o texto libre sin restricción?
3. **"Pago" vs "adelanto"**: ¿alcanza con un campo `tipo` que el usuario elige al cargar (un solo diálogo, con un selector, como el signo del Ajuste), o preferís dos flujos separados con su propio botón?
4. **Sin saldo, confirmado** — el historial de pagos/adelantos es solo cronológico, ADMIN no calcula "cuánto se le debe" a un empleado. ¿Correcto?
