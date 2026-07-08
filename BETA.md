# ADMIN — Release Beta 0.1

Pensada para instalarla en el celular y trabajar con datos reales durante algunos días, antes de seguir sumando módulos nuevos.

## Qué incluye

- ✅ **Login** — autenticación con Supabase Auth.
- ✅ **Clientes** — alta, modificación, archivado, ficha, registro de cobros (Motor de Pagos), historial de actividad.
- ✅ **Proveedores** — alta, modificación, archivado, ficha, registro de compras, registro de pagos (Motor de Pagos), **saldo calculado** (compras − pagos), historial de actividad.
- ✅ **Productos** — catálogo, categorías (creación rápida), historial de precios, **importación de listas por CSV** (con previsualización, resumen y descarga de errores).
- ✅ **Motor de Pagos** — infraestructura común de cobros/pagos, reutilizada sin cambios por Clientes y Proveedores.

## Una aclaración importante antes de usarla

El checklist original decía "Cuenta corriente de clientes ✅" — quiero ser preciso con eso, porque no es exactamente así todavía:

- **Proveedores tiene cuenta corriente real**: un saldo calculado (`saldo_proveedor()`) a partir de Compras menos Pagos. Esto porque "Compras" ya existe como el concepto de deuda hacia un proveedor.
- **Clientes NO tiene saldo todavía** — solo tiene "Movimientos" (los cobros que le registraste) y "Actividad". No hay ningún número de "cuánto te debe" un cliente, porque **no existe en ningún lado del sistema el concepto de deuda de un cliente** (no hay Facturas, no hay cargos). Esto se definió así a propósito en el Sprint 3: el Motor de Pagos registra hechos, y calcular un saldo de cliente sin un concepto de deuda hubiera sido inventar un número que no significa lo que parece significar.

Esto no es un olvido de este Sprint — es una decisión que ya tomamos juntos y que sigue en pie. Lo marco acá con todas las letras porque vas a usar esta Beta con datos reales, y prefiero que sepas exactamente qué esperar de "Cuenta corriente de Clientes" antes de abrirla, no que lo descubras buscando un número que no está.

Si durante estos días de prueba con datos reales te encontrás necesitando ese saldo de cliente, avisame — la conversación natural que sigue es: ¿qué es "deuda" para un cliente en tu negocio? (¿una factura? ¿un monto que cargás a mano?). Esa definición es la que faltaría antes de poder construirlo.

## Qué NO incluye todavía

Ningún otro módulo tiene funcionalidad real — Cheques, Empleados, Contador, Notas e Informes siguen siendo la pantalla vacía del esqueleto (Sprint 1). Tampoco existen todavía:
- Gestión de Usuarios y permisos desde la interfaz (los usuarios y permisos se cargan directo en Supabase por ahora).
- Restaurar un cliente/proveedor/producto archivado.
- Validación del dígito verificador de CUIT.
- Compras con detalle de productos.
- Vínculo entre un movimiento/compra y un cheque, o comprobantes adjuntos (las columnas ya están reservadas en la base, sin la carga implementada).

## Para instalarla y empezar a usarla

1. Seguí los pasos de `README.md` (`npm install`, migraciones de `supabase/migrations/` contra tu proyecto real, `.env.local`).
2. Creá tu usuario admin (ver sección correspondiente del `README.md`).
3. `npm run build && npm run preview`, o desplegala en Vercel.
4. Desde el celular, abrí la URL en Chrome y "Agregar a pantalla de inicio" — ya tiene ícono propio (dejó de ser el genérico del navegador desde esta Beta).

## Qué estaría bueno que observes durante estos días

Algo que valga la pena registrar para la próxima ronda de mejoras:
- ¿La carga de un cliente/proveedor/producto se siente rápida y sin fricción en el uso diario real?
- ¿La importación de listas funciona bien con los archivos reales de tus proveedores, o el formato no calza con lo que ADMIN espera?
- ¿Te faltó algún dato en alguna Ficha que terminaste necesitando de memoria o buscando en otro lado?
- Cualquier pantalla que se sintió más lenta o menos clara de lo esperado.

Todo eso, anotado durante el uso real, va a valer más que cualquier lista de funcionalidades pensada de antemano.
