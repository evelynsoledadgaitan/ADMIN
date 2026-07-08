# 0013 — CHANGELOG.md por Sprint

## Decisión
`CHANGELOG.md` en la raíz del repositorio, una entrada por Sprint, más reciente arriba, con cuatro secciones fijas: `✅ Agregado`, `🔧 Cambios`, `🐞 Errores corregidos`, `⚠️ Pendiente`. Se completa al **cerrar** un Sprint (cuando el cliente lo aprueba), no en cada commit individual.

## Por qué
A medida que el proyecto crezca a 20 o 30 Sprints, nadie va a poder reconstruir "qué cambió y cuándo" leyendo migraciones y componentes sueltos — un historial legible en un solo archivo es mucho más barato de mantener que reconstruir esa información después. La sección `⚠️ Pendiente` cumple, además, una función que no es solo informativa: es donde quedan anotadas las promesas hechas en la interfaz que todavía no tienen funcionalidad detrás (por ejemplo, "un cliente archivado podrá restaurarse más adelante" — un mensaje que ya existe en el Sprint 2 sin que exista todavía la pantalla de restaurar). Sin ese registro, ese tipo de deuda es fácil de perder de vista.

## Alternativas descartadas
- **Generarlo automáticamente a partir de los commits de git**: descartado por ahora — un changelog automático tiende a listar cambios técnicos ("refactor de ListView") en vez de lo que le importa a quien lee el historial más adelante (qué funcionalidad nueva existe, qué se rompió y se arregló). Se puede reconsiderar si el proceso de commits se vuelve lo bastante disciplinado como para que valga la pena.
