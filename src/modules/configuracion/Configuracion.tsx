import * as React from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import { Button } from '@/core/components/Button'
import { DatosNegocioForm } from './DatosNegocioForm'
import { UsuariosPermisos } from './UsuariosPermisos'
import { CatalogosGenerales } from './CatalogosGenerales'
import { NumeracionForm } from './NumeracionForm'

type Seccion = 'negocio' | 'usuarios' | 'catalogos' | 'numeracion'

const SECCIONES: { key: Seccion; etiqueta: string }[] = [
  { key: 'negocio', etiqueta: 'Datos del negocio' },
  { key: 'usuarios', etiqueta: 'Usuarios y permisos' },
  { key: 'catalogos', etiqueta: 'Categorías generales' },
  { key: 'numeracion', etiqueta: 'Numeración' }
]

/**
 * Configuración — parámetros generales de ADMIN, nunca funciones
 * operativas del negocio (ver docs/sistemas/configuracion-diseno.md).
 * El cierre de sesión ya existía desde antes de este Sprint — se
 * mantiene arriba de todo, sin cambios.
 */
export function Configuracion() {
  const { usuario, logout } = useAuth()
  const [seccion, setSeccion] = React.useState<Seccion>('negocio')

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="border-b border-border px-4 py-4 lg:px-6">
        <p className="text-sm text-muted-foreground">Sesión iniciada como</p>
        <p className="text-sm font-medium text-foreground">{usuario?.email}</p>
        <Button accion="cancelar" onClick={logout} className="mt-3">
          Cerrar sesión
        </Button>
      </div>

      <div className="p-4 lg:p-6">
        <h1 className="mb-4 text-2xl font-bold tracking-tight text-foreground">Configuración</h1>

        <div className="mb-4 flex gap-1 overflow-x-auto border-b border-border">
          {SECCIONES.map((s) => (
            <button
              key={s.key}
              onClick={() => setSeccion(s.key)}
              className={`shrink-0 border-b-2 px-3 py-2 text-sm font-medium ${
                seccion === s.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
              }`}
            >
              {s.etiqueta}
            </button>
          ))}
        </div>

        {seccion === 'negocio' && <DatosNegocioForm />}
        {seccion === 'usuarios' && <UsuariosPermisos />}
        {seccion === 'catalogos' && <CatalogosGenerales />}
        {seccion === 'numeracion' && <NumeracionForm />}
      </div>
    </div>
  )
}
