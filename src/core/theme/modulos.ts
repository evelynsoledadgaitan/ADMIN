import {
  Home, Users, Truck, Package, Landmark, IdCard,
  Calculator, StickyNote, BarChart3, Settings, Receipt, type LucideIcon
} from 'lucide-react'

/**
 * Registro único de módulos de ADMIN: ruta, ícono, color y nombre singular
 * (para el mensaje "No hay ___."). El Menú principal, el Sidebar y cada
 * pantalla de módulo leen de ACÁ — así agregar/quitar un módulo, o
 * cambiarle el color o el ícono, se hace en un solo lugar y queda igual
 * en toda la app.
 *
 * Nota sobre color: el sistema de diseño reserva el color para comunicar
 * algo, nunca para decorar (ver docs/decisiones/0006). Acá el color tiene
 * un propósito funcional distinto al de los botones de acción: ayuda a
 * reconocer un módulo de un vistazo — es wayfinding, no decoración. Por
 * eso son colores apagados (no neón) y cada uno se usa en un solo lugar:
 * el ícono de su propio módulo (y, desde la identidad visual definitiva,
 * también el acceso rápido correspondiente en la Pantalla Principal).
 */
export interface ModuloInfo {
  key: string
  ruta: string
  nombre: string
  nombreSingular: string
  icono: LucideIcon
  color: string // clase de Tailwind, ej "text-emerald-600"
  fondo: string // clase de Tailwind para el fondo del ícono
  borde: string // clase de Tailwind para el detalle de borde (accesos rápidos, Etapa 2 ajustes)
}

export const MODULOS: ModuloInfo[] = [
  { key: 'clientes', ruta: '/clientes', nombre: 'Clientes', nombreSingular: 'clientes', icono: Users, color: 'text-teal-600', fondo: 'bg-teal-50', borde: 'border-teal-500' },
  { key: 'proveedores', ruta: '/proveedores', nombre: 'Proveedores', nombreSingular: 'proveedores', icono: Truck, color: 'text-orange-600', fondo: 'bg-orange-50', borde: 'border-orange-500' },
  { key: 'productos', ruta: '/productos', nombre: 'Productos', nombreSingular: 'productos', icono: Package, color: 'text-violet-600', fondo: 'bg-violet-50', borde: 'border-violet-500' },
  { key: 'facturacion', ruta: '/facturacion', nombre: 'Facturación', nombreSingular: 'facturas', icono: Receipt, color: 'text-emerald-600', fondo: 'bg-emerald-50', borde: 'border-emerald-500' },
  { key: 'cheques', ruta: '/cheques', nombre: 'Cheques', nombreSingular: 'cheques', icono: Landmark, color: 'text-sky-600', fondo: 'bg-sky-50', borde: 'border-sky-500' },
  { key: 'empleados', ruta: '/empleados', nombre: 'Empleados', nombreSingular: 'empleados', icono: IdCard, color: 'text-rose-600', fondo: 'bg-rose-50', borde: 'border-rose-500' },
  { key: 'contador', ruta: '/contador', nombre: 'Contador', nombreSingular: 'trámites', icono: Calculator, color: 'text-amber-700', fondo: 'bg-amber-50', borde: 'border-amber-600' },
  { key: 'notas', ruta: '/notas', nombre: 'Notas', nombreSingular: 'notas', icono: StickyNote, color: 'text-indigo-600', fondo: 'bg-indigo-50', borde: 'border-indigo-500' },
  { key: 'informes', ruta: '/informes', nombre: 'Informes', nombreSingular: 'informes', icono: BarChart3, color: 'text-cyan-700', fondo: 'bg-cyan-50', borde: 'border-cyan-600' },
  { key: 'configuracion', ruta: '/configuracion', nombre: 'Configuración', nombreSingular: 'opciones', icono: Settings, color: 'text-zinc-600', fondo: 'bg-zinc-100', borde: 'border-zinc-400' }
]

export const INICIO: ModuloInfo = {
  key: 'inicio', ruta: '/', nombre: 'Inicio', nombreSingular: 'pendientes',
  icono: Home, color: 'text-primary', fondo: 'bg-primary/10', borde: 'border-primary'
}

export function moduloPorRuta(pathname: string): ModuloInfo | undefined {
  if (pathname === '/') return INICIO
  return MODULOS.find((m) => pathname.startsWith(m.ruta))
}

/**
 * Agrupación por categorías del Sidebar de escritorio (identidad visual
 * definitiva, Etapa 1) — puramente visual/organizativa: no cambia rutas,
 * ni permisos, ni la lista de módulos, solo cómo se agrupan al mostrarlos.
 * Configuración queda deliberadamente afuera de esta lista — se renderiza
 * aparte, junto a la sesión del usuario (ver Sidebar.tsx).
 */
export interface CategoriaSidebar {
  nombre: string
  modulos: string[] // keys de MODULOS
}

export const CATEGORIAS_SIDEBAR: CategoriaSidebar[] = [
  { nombre: 'Comercial', modulos: ['clientes', 'proveedores', 'productos', 'facturacion'] },
  { nombre: 'Operaciones', modulos: ['cheques', 'contador'] },
  { nombre: 'Personal', modulos: ['empleados'] },
  { nombre: 'Gestión', modulos: ['notas', 'informes'] }
]

export function moduloPorKey(key: string): ModuloInfo | undefined {
  return MODULOS.find((m) => m.key === key)
}
