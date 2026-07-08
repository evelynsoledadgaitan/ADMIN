import * as React from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Card } from '@/core/components/Card'
import { Button } from '@/core/components/Button'
import { useToast } from '@/core/hooks/useToast'
import { useUsuarios, usePermisosUsuario, useCambiarActivoUsuario, useGuardarPermisos } from './api'
import { MODULOS_CON_PERMISO, ETIQUETAS_MODULO_PERMISO } from './types'
import type { Usuario, Permiso } from './types'

type Accion = 'puede_ver' | 'puede_crear' | 'puede_modificar' | 'puede_archivar'
const ACCIONES: { clave: Accion; etiqueta: string }[] = [
  { clave: 'puede_ver', etiqueta: 'Ver' },
  { clave: 'puede_crear', etiqueta: 'Crear' },
  { clave: 'puede_modificar', etiqueta: 'Modificar' },
  { clave: 'puede_archivar', etiqueta: 'Archivar' }
]

function MatrizPermisos({ usuario }: { usuario: Usuario }) {
  const toast = useToast()
  const { data: permisosGuardados } = usePermisosUsuario(usuario.id)
  const guardar = useGuardarPermisos(usuario.id)

  const [matriz, setMatriz] = React.useState<Record<string, Record<Accion, boolean>>>({})

  React.useEffect(() => {
    if (!permisosGuardados) return
    const inicial: Record<string, Record<Accion, boolean>> = {}
    for (const modulo of MODULOS_CON_PERMISO) {
      const existente = permisosGuardados.find((p) => p.modulo === modulo)
      inicial[modulo] = {
        puede_ver: existente?.puede_ver ?? false,
        puede_crear: existente?.puede_crear ?? false,
        puede_modificar: existente?.puede_modificar ?? false,
        puede_archivar: existente?.puede_archivar ?? false
      }
    }
    setMatriz(inicial)
  }, [permisosGuardados])

  function toggle(modulo: string, accion: Accion) {
    setMatriz((actual) => ({ ...actual, [modulo]: { ...actual[modulo], [accion]: !actual[modulo]?.[accion] } }))
  }

  function handleGuardar() {
    const permisos: Omit<Permiso, 'id' | 'usuario_id'>[] = MODULOS_CON_PERMISO.map((modulo) => ({
      modulo,
      ...matriz[modulo]
    }))
    guardar.mutate(permisos, {
      onSuccess: () => toast.exito('Permisos guardados'),
      onError: () => toast.error('No se pudieron guardar los permisos')
    })
  }

  if (usuario.rol === 'admin') {
    return <p className="p-3 text-sm text-muted-foreground">Los administradores tienen acceso total siempre — esta tabla no los afecta.</p>
  }

  return (
    <div className="overflow-x-auto p-3">
      <table className="w-full min-w-[480px] border-collapse text-sm">
        <thead>
          <tr>
            <th className="px-2 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Módulo</th>
            {ACCIONES.map((a) => (
              <th key={a.clave} className="px-2 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {a.etiqueta}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MODULOS_CON_PERMISO.map((modulo) => (
            <tr key={modulo} className="border-t border-border">
              <td className="px-2 py-2 text-foreground">{ETIQUETAS_MODULO_PERMISO[modulo]}</td>
              {ACCIONES.map((a) => (
                <td key={a.clave} className="px-2 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={matriz[modulo]?.[a.clave] ?? false}
                    onChange={() => toggle(modulo, a.clave)}
                    className="h-4 w-4 accent-primary"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <Button accion="guardar" className="mt-3" onClick={handleGuardar} disabled={guardar.isPending}>
        {guardar.isPending ? 'Guardando...' : 'Guardar permisos'}
      </Button>
    </div>
  )
}

/**
 * Usuarios y permisos — administra usuarios ya existentes (activar/
 * desactivar, editar su matriz de permisos por módulo). No da de alta
 * usuarios nuevos: eso sigue siendo manual desde Supabase, un límite
 * técnico real (ver docs/sistemas/configuracion-diseno.md, decisión
 * aprobada 5.2) — el navegador no puede crear cuentas de forma segura.
 */
export function UsuariosPermisos() {
  const toast = useToast()
  const { data: usuarios } = useUsuarios()
  const cambiarActivo = useCambiarActivoUsuario()
  const [expandidoId, setExpandidoId] = React.useState<string | null>(null)

  function handleToggleActivo(usuario: Usuario) {
    cambiarActivo.mutate(
      { id: usuario.id, activo: !usuario.activo },
      {
        onSuccess: () => toast.exito(usuario.activo ? 'Usuario desactivado' : 'Usuario activado'),
        onError: () => toast.error('No se pudo actualizar el usuario')
      }
    )
  }

  return (
    <Card>
      <p className="mb-3 text-sm text-muted-foreground">
        Un usuario nuevo se crea primero desde Supabase — desde acá se administran los que ya existen.
      </p>
      <ul className="divide-y divide-border">
        {(usuarios ?? []).map((usuario) => (
          <li key={usuario.id}>
            <div className="flex items-center justify-between gap-2 py-2.5">
              <button
                onClick={() => setExpandidoId(expandidoId === usuario.id ? null : usuario.id)}
                className="flex flex-1 items-center gap-2 text-left"
              >
                {expandidoId === usuario.id ? (
                  <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span>
                  <span className="block text-sm font-medium text-foreground">{usuario.nombre}</span>
                  <span className="block text-xs text-muted-foreground">
                    {usuario.email} · {usuario.rol === 'admin' ? 'Administrador' : 'Usuario'}
                  </span>
                </span>
              </button>
              <Button accion={usuario.activo ? 'archivar' : 'guardar'} onClick={() => handleToggleActivo(usuario)}>
                {usuario.activo ? 'Desactivar' : 'Activar'}
              </Button>
            </div>
            {expandidoId === usuario.id && (
              <div className="rounded-md border border-border">
                <MatrizPermisos usuario={usuario} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </Card>
  )
}
