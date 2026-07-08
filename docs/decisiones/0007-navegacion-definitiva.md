# 0007 — Navegación definitiva

## Decisión
Navegación de dos niveles, fija para todo el proyecto:

- **BottomNav** con exactamente dos accesos: **Inicio** (Pendientes) y **Menú** (grilla con los 9 módulos restantes: Clientes, Proveedores, Productos, Cheques, Empleados, Contador, Notas, Informes, Configuración).
- **TopBar** única en toda la app: título del módulo actual y, salvo en Inicio y Menú, una flecha para volver.

Todo vive dentro de un único layout (`AppShell`), y el contenido de cada pantalla se renderiza en el medio.

## Por qué
El brief pide una barra de acceso a **10** destinos (Inicio + 9 módulos). Poner los 10 en una barra inferior no es viable en un celular: los íconos quedarían demasiado chicos para un buen toque, contradiciendo el pedido explícito de "excelente experiencia táctil" y "botones grandes". Elegir arbitrariamente 4 o 5 módulos "principales" para la barra y dejar el resto en un menú aparte tampoco es una buena opción: el brief no estableció ninguna jerarquía entre módulos, e inventar una hoy es una decisión de producto que no nos corresponde tomar solos.

La solución de **Inicio + Menú** evita ambos problemas: los dos accesos que sí están siempre a un toque del pulgar son exactamente los dos que se usan en cualquier momento (ver pendientes, o ir a cualquier otro lado), y el Menú resuelve el acceso a todo lo demás con tarjetas grandes y coloridas — que además cumplen el pedido de "íconos de colores" mejor que una fila de íconos chicos en una barra.

Esta estructura además escala: si en el futuro se agrega un módulo nuevo, se agrega una tarjeta más a la grilla del Menú (un archivo, `core/theme/modulos.ts`) sin rediseñar la navegación.

## Alternativas descartadas
- **Barra inferior con los 10 módulos**: descartada por no entrar con un tamaño de toque razonable en un celular.
- **Menú lateral tipo "drawer" (hamburguesa)**: es un patrón válido y muy usado, pero es menos alcanzable con el pulgar en pantallas grandes que un ítem fijo en la parte inferior, que es justamente lo que pide "celular primero". Se descartó a favor de la grilla de Menú, que además permite mostrar los íconos de colores como tarjetas grandes en vez de una lista angosta.
- **Curar 4-5 módulos "favoritos" para la barra inferior**: descartada por ser una decisión de producto no pedida ni definida en el brief.

## Nota
El Menú hoy muestra los 9 módulos sin filtrar por permisos, porque el módulo de Usuarios/Permisos todavía no está construido. Cuando se programe ese módulo, el Menú (y el resto de la navegación) deberá filtrar según lo que cada usuario puede ver — el punto de extensión ya existe (`usePermissions`, ver Fase 0), falta conectarlo acá.
