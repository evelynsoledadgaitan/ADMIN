import * as React from 'react'
import { Plus, Pencil, Archive, RotateCcw } from 'lucide-react'
import { Card } from '@/core/components/Card'
import { TextField } from '@/core/components/TextField'
import { Button } from '@/core/components/Button'
import { EstadoFiltroTabs, type EstadoFiltro } from '@/core/components/EstadoFiltroTabs'
import { useToast } from '@/core/hooks/useToast'
import { useArchivable } from '@/core/hooks/useArchivable'
import { useRestaurar } from '@/core/hooks/useRestaurar'
import { useCatalogoCompleto, useCrearItemCatalogo, useModificarItemCatalogo } from './api'

type TablaCatalogo = 'condiciones_iva' | 'medios_pago' | 'modalidades_pago_empleado'

/**
 * Una lista de catálogo genérica — Condición de IVA, Medios de pago y
 * Modalidades de pago comparten exactamente la misma forma (`id`,
 * `nombre`, archivable), así que es un único componente parametrizado
 * por tabla en vez de tres casi idénticos. Mismo patrón visual que ya
 * usa Categorías de Productos, que sigue viviendo en Productos — acá no
 * se duplica esa pantalla, se resuelve para los 3 catálogos que todavía
 * no tenían ninguna.
 */
function ListaCatalogo({ tabla, titulo }: { tabla: TablaCatalogo; titulo: string }) {
  const toast = useToast()
  const { data: items } = useCatalogoCompleto(tabla)
  const crear = useCrearItemCatalogo(tabla)
  const modificar = useModificarItemCatalogo(tabla)
  const archivar = useArchivable(tabla)
  const restaurar = useRestaurar(tabla)

  const [estado, setEstado] = React.useState<EstadoFiltro>('activos')
  const [agregando, setAgregando] = React.useState(false)
  const [nombreNuevo, setNombreNuevo] = React.useState('')
  const [editandoId, setEditandoId] = React.useState<string | null>(null)
  const [nombreEditado, setNombreEditado] = React.useState('')

  const activos = (items ?? []).filter((i) => i.archived_at === null)
  const archivados = (items ?? []).filter((i) => i.archived_at !== null)
  const visibles = estado === 'activos' ? activos : archivados

  function handleCrear(e: React.FormEvent) {
    e.preventDefault()
    if (!nombreNuevo.trim()) return
    crear.mutate(nombreNuevo, {
      onSuccess: () => {
        toast.exito('Agregado')
        setNombreNuevo('')
        setAgregando(false)
      },
      onError: () => toast.error('No se pudo agregar')
    })
  }

  function handleGuardarEdicion(id: string) {
    if (!nombreEditado.trim()) return
    modificar.mutate(
      { id, nombre: nombreEditado },
      {
        onSuccess: () => {
          toast.exito('Modificado')
          setEditandoId(null)
        },
        onError: () => toast.error('No se pudo modificar')
      }
    )
  }

  function handleArchivar(id: string) {
    archivar.mutate(id, {
      onSuccess: () => toast.exito('Archivado'),
      onError: () => toast.error('No se pudo archivar')
    })
  }

  function handleRestaurar(id: string) {
    restaurar.mutate(id, {
      onSuccess: () => toast.exito('Restaurado'),
      onError: () => toast.error('No se pudo restaurar')
    })
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{titulo}</h3>
        {estado === 'activos' && !agregando && (
          <Button accion="neutral" icono={Plus} onClick={() => setAgregando(true)}>
            Agregar
          </Button>
        )}
      </div>

      <div className="mb-3">
        <EstadoFiltroTabs valor={estado} onChange={setEstado} cantidadArchivados={archivados.length} />
      </div>

      {agregando && (
        <form onSubmit={handleCrear} className="mb-3 flex items-end gap-2">
          <div className="flex-1">
            <TextField label="" value={nombreNuevo} onChange={(e) => setNombreNuevo(e.target.value)} autoFocus />
          </div>
          <Button accion="guardar" type="submit" disabled={crear.isPending}>
            Guardar
          </Button>
          <Button accion="cancelar" type="button" onClick={() => setAgregando(false)}>
            Cancelar
          </Button>
        </form>
      )}

      {visibles.length === 0 ? (
        <p className="text-sm text-muted-foreground">{estado === 'activos' ? 'Todavía no hay nada cargado.' : 'No hay archivados.'}</p>
      ) : (
        <ul className="divide-y divide-border">
          {visibles.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2 py-2">
              {editandoId === item.id ? (
                <>
                  <div className="flex-1">
                    <TextField label="" value={nombreEditado} onChange={(e) => setNombreEditado(e.target.value)} autoFocus />
                  </div>
                  <Button accion="guardar" onClick={() => handleGuardarEdicion(item.id)} disabled={modificar.isPending}>
                    Guardar
                  </Button>
                  <Button accion="cancelar" onClick={() => setEditandoId(null)}>
                    Cancelar
                  </Button>
                </>
              ) : (
                <>
                  <span className="text-sm text-foreground">{item.nombre}</span>
                  <div className="flex items-center gap-1">
                    {estado === 'activos' ? (
                      <>
                        <button
                          onClick={() => {
                            setEditandoId(item.id)
                            setNombreEditado(item.nombre)
                          }}
                          aria-label="Editar"
                          className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleArchivar(item.id)} aria-label="Archivar" className="rounded-full p-1.5 text-muted-foreground hover:bg-muted">
                          <Archive className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <button onClick={() => handleRestaurar(item.id)} aria-label="Restaurar" className="rounded-full p-1.5 text-muted-foreground hover:bg-muted">
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export function CatalogosGenerales() {
  return (
    <div className="space-y-4">
      <ListaCatalogo tabla="condiciones_iva" titulo="Condición de IVA" />
      <ListaCatalogo tabla="medios_pago" titulo="Medios de pago" />
      <ListaCatalogo tabla="modalidades_pago_empleado" titulo="Modalidades de pago (Empleados)" />
    </div>
  )
}
