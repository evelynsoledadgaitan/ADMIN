# 0006 — Sistema de diseño y componentes `core`

## Decisión
Paleta neutra ("planilla de trabajo"): fondo gris muy claro, tarjetas blancas, texto casi negro, un único acento de marca (azul tinta, `#2E44C6`) reservado para foco/interactividad — y **ningún otro color decorativo**. Los únicos colores con significado son los cuatro definidos en el brief: verde (Guardar), amarillo (Modificar), gris (Cancelar), negro (Archivar). Tipografía Inter para texto general (con números tabulares activados, importante porque la app maneja mucho dato numérico: precios, CUIT, importes de cheques) y IBM Plex Mono para códigos.

Todo se define una sola vez en `src/index.css` (variables CSS) y `tailwind.config.ts` (mapeo a clases), nunca como color hardcodeado (`bg-[#16A34A]`) dentro de un componente de módulo.

Los cuatro elementos de interfaz que el brief pide como reglas transversales — botón semántico, listado con buscador fijo y FAB, bloque de formulario, campo de texto con auto-grow — existen como **un** componente cada uno en `core/components/`, consumido por todos los módulos.

## Por qué
El propio brief es explícito: *"muy limpio, muy simple… no quiero dashboards recargados, no quiero gráficos innecesarios… toda la aplicación debe sentirse uniforme"*. Una paleta amplia o decorativa contradice ese pedido — acá el color se reserva exclusivamente para comunicar una acción (qué botón es peligroso, cuál guarda, cuál archiva), no para decorar. Esa restricción es intencional y no un descuido.

Centralizar `ListView`, `FormBlock`, `Button` y `CampoTextoLargo` es lo único que garantiza en el código lo que el brief pide en el diseño: que Clientes, Proveedores, Cheques o cualquier módulo futuro se comporten y se vean exactamente igual, sin que dependa de que cada desarrollador copie bien el patrón del módulo anterior.

## Alternativas descartadas
- **Paleta de marca más amplia** (colores distintos por módulo, gráficos con múltiples colores): descartada porque el brief pide explícitamente lo contrario ("no quiero gráficos innecesarios").
- **Componentes de shadcn/ui sin envolver**, usados directo en cada módulo: descartado porque no fuerza la regla de negocio (por ejemplo, que el botón "Archivar" sea siempre negro) — cualquiera podría pasar un color distinto por accidente. Envolviéndolos en `core/components/Button` con variantes fijas, esa regla no se puede romper sin querer.
