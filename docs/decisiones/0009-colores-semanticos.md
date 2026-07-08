# 0009 — Colores semánticos de estado (éxito / advertencia / error / información)

## Decisión
Cuatro colores de **estado**, en un namespace separado de los cuatro colores de **acción** definidos en el brief original:

| Color de estado | Uso | Ejemplo |
|---|---|---|
| `exito` (verde) | algo se completó bien | Snackbar "Cliente guardado" |
| `advertencia` (ámbar) | algo necesita atención, no es un error | Snackbar "El CUIT no se pudo validar, se guardó igual" |
| `error` (rojo) | algo falló | Snackbar "No se pudo guardar", mensaje de validación de un campo |
| `info` (azul) | dato neutro para informar | Snackbar "Ya existe un cliente con ese nombre" |

Viven en `src/index.css` como variables CSS (`--estado-exito`, `--estado-advertencia`, `--estado-error`, `--estado-info`) y se exponen en Tailwind como `bg-exito`, `text-error`, etc. Se usan hoy en el Snackbar (`ToastProvider`) y en los mensajes de error de los campos de formulario (`TextField`, `CurrencyField`, `DateField`, `FileField`).

## Por qué
El brief original documentó cuatro colores, pero eran colores de **acción** (qué hace un botón: Guardar, Modificar, Cancelar, Archivar). Nunca hubo un color para comunicar el **resultado** de una acción o el estado de un dato, y ese vacío se iba a llenar tarde o temprano con criterio de cada desarrollador — exactamente el tipo de inconsistencia que el proyecto quiere evitar.

Se reutilizó a propósito el mismo verde de "Guardar" para "Éxito" y el mismo ámbar de "Modificar" para "Advertencia": para el usuario, verde ya significa "esto salió bien" y ámbar ya significa "prestá atención", así que mantener el mismo matiz refuerza el aprendizaje en vez de contradecirlo. Error (rojo) e información (azul) son colores nuevos porque no había ningún equivalente previo.

Aunque acción y estado comparten matiz en dos de los cuatro casos, se mantuvieron como variables CSS separadas (`--accion-guardar` vs `--estado-exito`) — no la misma variable reusada — porque conceptualmente son cosas distintas (una es la etiqueta de un botón, la otra es el resultado de una operación) y en algún momento futuro podrían necesitar diferenciarse sin que eso implique tocar los botones.

## Alternativas descartadas
- **Reusar directamente los colores de acción como colores de estado** (ej. `bg-guardar` también para el Snackbar de éxito): descartado por la razón anterior — son conceptos distintos aunque hoy compartan valor de color.
- **Colores de estado con matices propios, sin relación con los de acción** (ej. un verde distinto para éxito): descartado porque introduciría dos verdes distintos en la misma pantalla sin ninguna razón — puro ruido visual.
