# ADMIN — Reorganización del flujo operativo

Documento de arquitectura funcional y técnica. No incluye implementación. Cubre lo que pediste — accesos rápidos reorganizados, flujo de Clientes/Proveedores, Estado de Cuenta como libro contable, y el impacto en los módulos futuros — más los riesgos y mejoras que encontré al analizarlo, como pediste al final.

---

## 0. Dos preguntas antes de diseñar el resto (importan de verdad)

### 0.1 "Ajuste" como origen de una Deuda/Ingreso — ¿es lo mismo que el Ajuste que ya existe?

Ya construimos "Ajustes" como una pieza separada del sistema (Sprint anterior): un movimiento con importe con signo (positivo o negativo) y motivo obligatorio, pensado para correcciones discrecionales del saldo, con su propio permiso independiente.

Ahora pedís que "Ajuste" sea también una de las opciones de **origen** de una Deuda (Clientes) o un Ingreso de mercadería (Proveedores) — junto a Cuenta del mes, Venta, Factura, Otro.

Esto puede leerse de dos formas distintas, y necesito que me digas cuál:

- **(a) Son la misma cosa.** "Ajuste" como origen de deuda simplemente **redirige** al formulario de Ajuste ya construido (con su propio permiso, su propio signo, su propio motivo obligatorio) en vez de abrir el formulario de Deuda con `origen = 'ajuste'`. No se duplica nada — el "menú" de accesos ofrece ambos caminos, pero por debajo usan el mismo mecanismo.
- **(b) Son cosas distintas.** Una Deuda con `origen = 'ajuste'` es un cargo más (siempre positivo, sin el permiso especial de Ajustes, sin poder ser negativo) que casualmente se llama "ajuste" pero vive en la tabla de deudas, separado del Ajuste real.

Si es (b), vamos a tener dos conceptos distintos que se llaman igual en la interfaz — el usuario va a ver "Ajuste" en dos lugares con comportamiento distinto (uno permite negativo y pide permiso especial, el otro no), lo cual genera confusión exactamente del tipo que este proyecto viene evitando desde el principio. **Mi recomendación es (a)** — que "Ajuste" en el menú de una Deuda abra el formulario de Ajuste real, no una copia. Decime si estás de acuerdo o si tenías en mente otra cosa.

### 0.2 "Ingreso de mercadería" reemplaza a "Compra" en toda la interfaz, no solo en el acceso rápido

Hoy Proveedores dice "Compras" / "Registrar compra" en el Estado de Cuenta (título de sección, botón, mensajes de éxito). Tu pedido de terminología ("Agregar ingreso de mercadería") — para que sea consistente — tiene que reemplazar esas palabras en **todos** los lugares donde aparecen hoy, no solo en el acceso rápido nuevo de Inicio. Asumo que sí, que es un cambio de vocabulario integral, y lo diseño así — decime si en algún lugar puntual preferís mantener "Compra" (por ejemplo, si el motivo de una futura factura de proveedor todavía necesita decir "compra" en algún reporte contable).

---

## 1. Diagnóstico: por qué este cambio tiene sentido

Los accesos rápidos actuales (Nuevo cliente, Nuevo proveedor, Nuevo producto, Importar lista) resuelven **altas de datos maestros** — algo que se hace una vez por cliente/proveedor/producto, no todos los días. Las operaciones que se repiten a diario son movimientos de cuenta corriente: alguien te debe algo, le entra mercadería, cobrás, pagás. Mover el foco de Inicio hacia esas cuatro acciones no es un cambio estético — es alinear la pantalla más vista de la app con lo que el negocio hace más seguido, exactamente el mismo criterio de "ahorrar tiempo" que guía el proyecto desde el brief original.

---

## 2. Pantalla Principal — nuevos accesos rápidos

```
┌─────────────────────────────────────┐
│ Hola, María                          │
├─────────────────────────────────────┤
│ Pendientes                           │
│  No hay pendientes.                  │
├─────────────────────────────────────┤
│ Accesos rápidos                      │
│  ➕ Agregar deuda                     │
│  📦 Agregar ingreso de mercadería     │
│  💵 Registrar cobro                   │
│  💸 Registrar pago                    │
└─────────────────────────────────────┘
```

Las 4 tarjetas ya no navegan a una pantalla de Alta — abren un flujo de 2 pasos (sección 4). "Nuevo cliente", "Nuevo proveedor", "Nuevo producto" e "Importar lista" se sacan de Inicio y quedan **exclusivamente** dentro de sus propios módulos (el FAB de cada Listado, como ya funciona hoy) — dejan de tener acceso directo desde la pantalla principal.

---

## 3. Componente nuevo: selector de entidad con autocompletado

Es la pieza central que falta para que este Sprint funcione. Hoy no existe ningún componente para "buscar y elegir un cliente/proveedor sin entrar a su módulo" — el buscador de `ListView`/`DataTable` filtra una lista que ya se está mostrando en pantalla, no es un selector flotante.

Propongo **un solo componente compartido**, `SelectorEntidadDialog` (en `core/components/`, porque no es un concepto de negocio como "deuda" o "compra" — es un patrón de interfaz genérico: buscar-y-elegir), parametrizado por tipo:

```
Agregar deuda (tap)
  └─► SelectorEntidadDialog (tipo="cliente")
        - Buscador con foco automático
        - Lista de clientes activos, filtrando mientras se escribe
        - Tap en un cliente → cierra el selector
  └─► RegistrarDeudaDialog (ya existe), con el cliente elegido
```

Mismo camino exacto para "Agregar ingreso de mercadería" (`tipo="proveedor"` → `RegistrarCompraDialog`/futuro "Registrar ingreso"), "Registrar cobro" (`tipo="cliente"` → `RegistrarMovimientoDialog` tipo="cobro") y "Registrar pago" (`tipo="proveedor"` → `RegistrarMovimientoDialog` tipo="pago").

**Filtro implícito:** el selector solo muestra clientes/proveedores **activos** (no archivados) — no tiene sentido agregarle deuda a alguien archivado. Si hace falta operar sobre un archivado, se hace desde su Ficha después de restaurarlo, como ya funciona.

**Al guardar:** en vez de volver a Inicio, navega directo al Estado de Cuenta de la entidad elegida — es la continuación natural del flujo que vos mismo dibujaste (Cliente → Agregar deuda → Registrar cobro → Estado de Cuenta), y le muestra al usuario el movimiento que acaba de cargar dentro de su contexto real.

**¿Son "pasos adicionales"?** Buscar y elegir una entidad es un paso mínimo indispensable — no hay forma de cargar una deuda sin decir de quién es. Lo que sí se elimina es cualquier paso de más: no hay que entrar al módulo, no hay que abrir la Ficha, no hay que tocar un botón extra dentro de ella. De la pantalla principal al formulario de carga: dos toques.

---

## 4. Flujo completo — Clientes

```
Inicio
  │
  ├─► "Agregar deuda" ──► Buscar cliente ──► Formulario de deuda
  │                                              (origen: Cuenta del mes / Venta / Factura / Ajuste* / Otro)
  │                                                    │
  │                                                    ▼
  │                                          Guardar ──► saldo se recalcula solo (saldo_cliente(), ya existe)
  │                                                  ──► aparece en el Estado de Cuenta (ya es automático:
  │                                                       es la misma tabla que ya lee esa pantalla)
  │                                                  ──► navega al Estado de Cuenta del cliente
  │
  └─► "Registrar cobro" ──► Buscar cliente ──► Formulario de cobro (Motor de Pagos, sin cambios)
                                                       │
                                                       ▼
                                             Guardar ──► mismo comportamiento automático de arriba
```

*sujeto a la respuesta de la pregunta 0.1.

**Nada de esto es funcionalidad nueva a nivel de datos** — `saldo_cliente()`, la tabla `deudas_clientes`, el Motor de Pagos y el Estado de Cuenta ya existen y ya se actualizan solos (React Query invalida las consultas correctas apenas se guarda un movimiento, desde el Sprint de Cuenta Corriente compartida). Lo que agrega este Sprint es **un nuevo punto de entrada** a flujos que ya funcionan, no un motor nuevo.

---

## 5. Flujo completo — Proveedores

Exactamente la misma filosofía, mismo mecanismo:

```
Inicio
  │
  ├─► "Agregar ingreso de mercadería" ──► Buscar proveedor ──► Formulario de ingreso
  │                                                                (origen: Mercadería / Factura / Ajuste* / Otro)
  │                                                                      │
  │                                                                      ▼
  │                                                            Guardar ──► saldo_proveedor() se recalcula solo
  │                                                                    ──► aparece en el Estado de Cuenta
  │                                                                    ──► navega al Estado de Cuenta del proveedor
  │
  └─► "Registrar pago" ──► Buscar proveedor ──► Formulario de pago (Motor de Pagos, sin cambios)
```

**Nota técnica:** la tabla `compras` ya tiene exactamente esta forma (descripción, monto, fecha, comprobante opcional) — lo único que cambia es agregarle un campo `origen` (igual que `deudas_clientes` ya lo tiene) y renombrar el vocabulario de la interfaz. No hace falta rehacer la tabla, solo extenderla.

---

## 6. Estado de Cuenta — libro contable unificado

Esto sí es una pieza nueva de verdad. Hoy el Estado de Cuenta muestra Deudas/Compras, Pagos y Ajustes en **tres listas separadas** (una por tarjeta). Lo que pedís es una única tabla cronológica con columna de saldo acumulado — el formato de un libro contable real:

```
Fecha         Concepto                          Debe        Haber       Saldo
10/06/2026    Cuenta del mes                     $15.000                 $15.000
15/06/2026    Cobro (MOV-000004)                             $10.000     $5.000
28/06/2026    Ajuste — error de facturación                   $2.000     $3.000
02/07/2026    Venta                               $8.000                 $11.000
```

**Cómo se arma, técnicamente:** las tres fuentes (Deudas, Movimientos, Ajustes) ya existen y ya se consultan por separado. Este Sprint agrega una combinación de esas tres consultas en el cliente (no una tabla ni una consulta nueva a Supabase) — se juntan los tres arrays, se ordenan por fecha, y se calcula el saldo acumulado fila por fila sumando/restando en orden. Es una función de presentación, igual criterio que ya usamos para orden y paginación en `DataTable` — nada de esto toca la base de datos.

**Una decisión que quiero dejar explícita:** para que "saldo acumulado" se lea de forma natural, esta tabla en particular va a mostrar el orden **cronológico ascendente** (lo más viejo arriba) — al revés del resto de las listas de la app (Movimientos, Compras, Ajustes siempre muestran lo más reciente primero). Es una excepción intencional: un saldo acumulado que baja línea por línea en vez de subir no se lee bien. Si preferís mantener "más reciente arriba" en todos lados por consistencia, avisame — technically es un cambio de una línea, pero afecta cómo se lee la columna de saldo.

---

## 7. El Motor de Cuenta Corriente — confirmación, no reconstrucción

Buena noticia: la arquitectura que se aprobó hace dos Sprints (tablas gemelas + Ajustes compartido + funciones de saldo gemelas) ya es exactamente la base que este Sprint necesita. No hay que "crear un motor" — ya existe. Este Sprint solo agrega:
- Un campo `origen` a `compras` (Proveedores) — `deudas_clientes` ya lo tiene.
- El componente compartido `SelectorEntidadDialog` (nuevo, sección 3).
- La vista de libro contable unificado en el Estado de Cuenta (sección 6, presentación pura).
- Los 4 accesos rápidos nuevos en Inicio.

Ningún cambio a `saldo_cliente()`, `saldo_proveedor()`, la auditoría, ni las políticas de RLS.

---

## 8. Impacto en los módulos futuros

### Caja
Cuando exista, va a necesitar saber "cuánto entró y salió hoy en efectivo" — que es un subconjunto del Motor de Pagos (`movimientos` filtrado por `medio_pago = Efectivo`). No hace falta ninguna tabla nueva para Caja apoyarse en esto; es otra consulta sobre datos que ya existen, mismo patrón que el libro contable de la sección 6.

### Stock
"Agregar ingreso de mercadería" es, literalmente, el nombre que un futuro módulo de Stock necesitaría para "entró mercadería" — hoy es un monto sin detalle de productos (decisión ya tomada en el Sprint de Proveedores: compra simple, sin líneas). Cuando Stock exista, ahí sí va a tener sentido reconsiderar si un ingreso de mercadería debería poder desglosarse en productos y cantidades — pero no antes, y no como parte de este Sprint.

### Facturación
Cuando exista, una factura emitida podría generar automáticamente una Deuda con `origen = 'factura'` — el campo `origen` ya está pensado exactamente para poder recibir eso sin cambiar la arquitectura. Facturación pasaría a ser una fuente más que inserta filas en `deudas_clientes`, no un reemplazo de nada de lo que hay hoy.

### Informes
El mismo mecanismo de "combinar 3 fuentes y calcular acumulado" que arma el Estado de Cuenta (sección 6) es reutilizable tal cual para cualquier informe de cuenta corriente agregado (ej. "saldo total de todos los clientes a una fecha") — es la misma lógica de presentación, aplicada a más de una entidad a la vez en vez de una sola.

### Contador
Es el caso menos parecido a los otros dos — honorarios e impuestos no son exactamente "cuenta corriente con un tercero" de la misma forma. Si en algún momento se decide que Contador también necesita su propio saldo (ej. "cuánto le debemos al estudio contable"), el patrón ya probado (tabla gemela de cargos + Ajustes ya soporta agregar una tercera entidad + función de saldo gemela) se extiende sin rediseñar nada — pero **esto ampliaría `movimientos` y `ajustes_cuenta` a una tercera columna de entidad** (`contador_id`), lo cual hoy no está preparado (esas tablas fueron diseñadas para dos entidades, no N). Lo marco como el único punto de la arquitectura actual que no escala gratis a un tercer tipo de cuenta corriente — no es un problema para resolver ahora, es información para cuando llegue ese Sprint.

---

## 9. Riesgos y mejoras que encontré (no los pediste puntualmente, pero me pediste que los busque)

1. **Las preguntas de la sección 0** — son el riesgo principal. Programar sin resolverlas puede terminar en una funcionalidad de "Ajuste" duplicada y confusa, o en una migración de vocabulario a medias que deja "Compra" en algunos lugares y "Ingreso de mercadería" en otros.
2. **El Estado de Cuenta pasa a cargar 3 consultas completas siempre**, en vez de poder cargar cada sección de a una — hoy cada lista (Deudas, Pagos, Ajustes) podía, en teoría, cargar de forma independiente. Con volúmenes de una sola empresa esto no es un problema real, pero lo dejo anotado por si en algún momento el historial de una cuenta crece mucho.
3. **El campo `origen` de "Ingreso de mercadería" (Proveedores) no coincide exactamente con el de "Deuda" (Clientes)** — "Mercadería" vs. "Venta", por ejemplo. Es correcto que sean distintos (son negocios distintos), pero quiero confirmarlo explícitamente para no asumir mal: ¿el origen de Proveedores es exactamente `Mercadería | Factura | Ajuste | Otro` (4 opciones, sin "Cuenta del mes")?
4. **Mejora que propongo, no pedida:** ya que "Registrar cobro" y "Registrar pago" van a usar el mismo `SelectorEntidadDialog`, sugiero que el buscador recuerde el texto tipeado durante la sesión (mismo mecanismo que ya usa `useListState` en los listados) — si alguien registra varios cobros seguidos de clientes con nombres parecidos, no vuelve a escribir desde cero cada vez. Es una mejora chica, la incluyo en la implementación si te parece bien, no cambia el diseño de nada de lo de arriba.

---

## 10. Resumen de lo que necesito para programar

1. Respuesta a 0.1 (Ajuste como origen: ¿redirige al Ajuste real, o es un concepto separado?).
2. Confirmación de 0.2 (reemplazo integral de "Compra" por "Ingreso de mercadería" en toda la interfaz de Proveedores).
3. Confirmación del orden cronológico ascendente en el libro contable del Estado de Cuenta (sección 6).
4. Las 4 opciones exactas de origen para "Ingreso de mercadería" (punto 3 de la sección 9).

Con esas cuatro definiciones, el Sprint queda completamente especificado — no hay ningún otro punto pendiente de diseño.
