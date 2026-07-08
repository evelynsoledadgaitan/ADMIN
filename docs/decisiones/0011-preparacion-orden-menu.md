# 0011 — Preparación para ordenar el Menú (alfabético / frecuentes)

## Decisión
El Menú ya no ordena los módulos "a mano" — pasa el arreglo de módulos por el hook `useModuloOrden(modulos, estrategia)` (`core/hooks/useModuloOrden.ts`), que admite tres estrategias: `'definido'` (el orden manual actual), `'alfabetico'` (ya funciona) y `'frecuentes'` (placeholder: por ahora devuelve el mismo orden que `'definido'`). Hoy el Menú siempre pide `'definido'` — no hay ningún control visible para que el usuario cambie el orden todavía.

## Por qué
El cliente pidió dejar el mecanismo listo sin construir la funcionalidad completa. `'alfabetico'` no depende de ningún dato que no exista ya (el nombre del módulo), así que se implementó completo aunque no esté conectado a ningún control visual. `'frecuentes'` sí depende de algo que hoy no existe: un registro de cuántas veces cada usuario entra a cada módulo. Ese tracking probablemente conviene resolverlo junto con el módulo de Usuarios (una tabla `aperturas_modulo` o un contador en `usuarios`), no antes — hacerlo ahora sería construir infraestructura de datos para una funcionalidad que todavía no existe, lo que el cliente pidió evitar.

Cuando se quiera activar esto de verdad, el trabajo pendiente es acotado:
1. Guardar la preferencia de orden elegida por el usuario (probablemente en `configuracion` o en una columna de `usuarios`).
2. Si se implementa `'frecuentes'`, sumar el tracking de aperturas.
3. En `Menu.tsx`, leer la preferencia guardada en vez del `'definido'` fijo que hay hoy.

Ningún componente nuevo hace falta — el mecanismo ya está armado.

## Alternativas descartadas
- **No tocar nada hasta que se pida la funcionalidad completa**: descartado porque el cliente pidió explícitamente dejar el sistema preparado en este Sprint.
- **Implementar también 'frecuentes' ya mismo**: descartado por requerir tablas y lógica de tracking que son, en sí mismas, una pieza de funcionalidad de negocio — justo lo que este Sprint pidió evitar.
