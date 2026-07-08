# Bloque 4B — Contador: diseño funcional y técnico

Documento de diseño. No incluye implementación. Estructurado en las 4 preguntas fijas para cualquier módulo nuevo (mismo criterio que Facturación y Empleados).

Marco: organizar obligaciones, vencimientos, honorarios, impuestos y documentación — sin ERP, sin sistema contable, sin integración con ARCA (decisión `0025`), sin ningún cálculo automático de impuestos ni generación automática de nada (mismo principio que se reafirmó con el aguinaldo de Empleados: todo lo carga una persona, ADMIN no dispara nada solo).

---

## 1. ¿Qué reutiliza de lo que ya existe?

- **Patrón completo de Empleados**: es el módulo más parecido que existe — dato maestro autocontenido, sin integración con otros módulos, documentación con múltiples archivos, inmutable con anulación.
- **`ArchivoAdjunto`/`VisorAdjunto`**: para el comprobante de cada obligación y para la documentación general.
- **`DataTable`/`ListView`, `EstadoFiltroTabs`, `useArchivable`/`useRestaurar`, `HistorialAuditoria`**: mismo lenguaje de siempre.
- **Patrón "Pendientes en Inicio"**: exactamente el mecanismo ya construido para Facturación (conteo liviano, tarjeta que lleva al listado ya filtrado) — acá aplicado a vencimientos próximos o vencidos.
- **Patrón de estado calculado, no guardado a mano**: mismo criterio que el estado de Facturación (Pendiente de emitir/Emitida, decidido por un trigger según los datos) — acá el estado de una obligación se calcula solo, comparando fechas, sin que nadie lo toque directamente.

---

## 2. ¿Qué tablas nuevas necesita?

Dos tablas — mismo criterio que separó "el dato/evento en sí" de "la documentación general" en Empleados.

### `obligaciones_contador` — el core del módulo
```
id, tipo ('impuesto' | 'honorario' | 'otro'),
concepto (ej. "IVA junio 2026", "Honorarios julio"),
monto (opcional — a veces se carga la obligación antes de saber el monto exacto),
fecha_vencimiento,
fecha_pago (null = todavía no se pagó),
comprobante_path (opcional — el comprobante de pago, un solo archivo, mismo patrón que Deudas/Ingresos/Movimientos),
nota (opcional),
archived_at / anulado_por / motivo_anulacion (inmutable, igual que todo lo demás)
```

**Estado — no es una columna, se calcula siempre en el momento**:
- `fecha_pago` cargada → **Pagada**.
- Sin `fecha_pago` y `fecha_vencimiento` ya pasó → **Vencida**.
- Sin `fecha_pago` y `fecha_vencimiento` todavía no llegó → **Pendiente**.

Ninguna de las tres depende de que alguien la actualice — se recalcula sola cada vez que se mira la pantalla, comparando fechas. Más simple todavía que el trigger de Facturación (ahí hacía falta un trigger porque dependía de dos columnas nulificables a la vez; acá alcanza con comparar contra la fecha de hoy, sin guardar nada extra).

### `documentos_contador` — documentación general, no atada a una obligación puntual
```
id, tipo_documento (catálogo chico: Contrato de servicios, Poder, Constancia de inscripción, Otro),
descripcion_otro (obligatoria solo si tipo_documento='otro', mismo patrón que documentos_empleados),
comprobante_path,
archived_at / anulado_por / motivo_anulacion
```
Mismo criterio que `documentos_empleados`: varios archivos a la vez, cada uno su propia fila.

---

## 3. ¿Qué pantallas nuevas agrega?

- **Contador** (`/contador`): pantalla principal con dos pestañas —
  - **Obligaciones**: listado con filtro por Estado (Todos/Pendiente/Vencida/Pagada) y por Tipo (Impuesto/Honorario/Otro), buscador, alta.
  - **Documentación**: mismo patrón que la sección de documentación de un Empleado — lista de documentos generales, botón agregar.
- **Alta de Obligación**: Tipo, Concepto, Monto (opcional), Fecha de vencimiento, Nota (opcional).
- **Ficha de la Obligación**: datos, estado (con color — igual criterio visual que el resto del sistema), botón **"Marcar como pagada"** (carga fecha de pago + comprobante opcional), Actividad, Anular.

---

## 4. ¿Qué impacto tiene sobre los demás módulos?

- **Ninguno sobre Clientes, Proveedores, Productos, Facturación o Empleados** — autocontenido, mismo criterio que Empleados.
- **Inicio**: se suma como segunda fuente de la sección "Pendientes" (la primera fue Facturación) — una tarjeta con la cantidad de obligaciones vencidas o por vencer pronto, que lleva directo al listado ya filtrado.
- **Permisos**: nuevo permiso `contador` (ya estaba previsto en la lista original de 10 módulos desde la Fase 0 — no hace falta ampliar el `CHECK`).
- **Storage**: se suma el prefijo `contador` a las políticas del bucket `adjuntos` (mismo mecanismo ya usado 3 veces).

---

## 5. Lo que necesito que confirmes antes de programar

1. **Monto opcional** en una obligación (para poder cargarla antes de saber el importe exacto) — ¿de acuerdo, o preferís que sea obligatorio siempre?
2. **Umbral de "por vencer pronto"** para la tarjeta de Pendientes en Inicio: propongo incluir las vencidas **más** las que vencen dentro de los próximos 7 días. ¿Ese número te sirve, o preferís otro (3 días, 15 días)?
3. **Catálogo de `tipo_documento`** para la Documentación general: propongo Contrato de servicios / Poder / Constancia de inscripción / Otro. ¿Coincide con lo que necesitás, agregás o sacás alguno?
4. **"Marcar como pagada"**: ¿el comprobante de pago es opcional (como en el resto del sistema) o querés que sea obligatorio para poder marcar una obligación como pagada?
