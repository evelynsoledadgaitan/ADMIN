# 0008 — Sistema de componentes (Sprint 1.5)

## Decisión
Se completó el catálogo de componentes reutilizables de `core/components/` antes de programar ningún módulo funcional. Lista completa y para qué sirve cada uno en `docs/sistema-de-componentes.md`.

Regla de trabajo a partir de acá: **antes de escribir un elemento de interfaz nuevo dentro de un módulo, revisar si ya existe en `core/components/`.** Si existe algo parecido pero no exactamente lo que hace falta, se extiende el componente de `core`, no se crea uno paralelo dentro del módulo. La única interfaz que un módulo debería construir por su cuenta es la disposición particular de sus propios campos (qué `TextField`, `Select`, etc. van en qué orden), nunca el aspecto de esos campos.

## Por qué
Este es exactamente el pedido del cliente: terminar el Design System completo antes de tocar lógica de negocio, para que cuando empecemos Clientes (y todo lo que sigue) sea ensamblar piezas ya resueltas, no inventar de nuevo el aspecto de un campo de texto por décima vez.

## Alternativas descartadas
- **Ir armando los componentes a medida que cada módulo los necesita**: es lo que hubiéramos hecho por defecto, pero el cliente pidió explícitamente lo contrario — y tiene sentido para este proyecto puntual, porque son muchos módulos con los mismos tipos de campos (montos, fechas, catálogos) y conviene resolverlos una sola vez con cuidado, en vez de ir parchando sobre la marcha.
