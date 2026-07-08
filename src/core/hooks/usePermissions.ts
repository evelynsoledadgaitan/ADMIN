import { useAuth } from '@/app/providers/AuthProvider'

export type Modulo =
  | 'clientes' | 'proveedores' | 'productos' | 'cheques' | 'empleados'
  | 'contador' | 'notas' | 'informes' | 'usuarios' | 'configuracion'
  | 'ajustes'      // permiso independiente (Cuenta Corriente) — sin pantalla ni ruta propia
  | 'facturacion'  // permiso propio de Facturación, no heredado de Clientes

export type Accion = 'ver' | 'crear' | 'modificar' | 'archivar'

/**
 * Único punto de la app que decide si el usuario puede hacer algo.
 * Ningún componente debe leer el rol o los permisos "a mano" — siempre a
 * través de este hook, para que la lógica de permisos viva en un solo lugar.
 *
 * El admin siempre tiene acceso total (regla del brief). Los demás usuarios
 * se rigen por la tabla `permisos` (ver/crear/modificar/archivar por módulo).
 */
export function usePermissions() {
  const { usuario, permisos } = useAuth()

  function puede(modulo: Modulo, accion: Accion): boolean {
    if (!usuario) return false
    if (usuario.rol === 'admin') return true
    const permiso = permisos.find((p) => p.modulo === modulo)
    if (!permiso) return false
    if (accion === 'ver') return permiso.puede_ver
    if (accion === 'crear') return permiso.puede_crear
    if (accion === 'modificar') return permiso.puede_modificar
    return permiso.puede_archivar
  }

  return { puede }
}
