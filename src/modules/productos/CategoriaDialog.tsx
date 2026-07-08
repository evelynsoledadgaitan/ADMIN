import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { TextField } from '@/core/components/TextField'
import { Button } from '@/core/components/Button'
import { useToast } from '@/core/hooks/useToast'
import { useCrearCategoria, useModificarCategoria } from './api'
import type { CategoriaProducto } from './types'

export interface CategoriaDialogProps {
  abierto: boolean
  onOpenChange: (abierto: boolean) => void
  /** Si se pasa, el diálogo edita esa categoría — si no, crea una nueva. */
  categoria?: CategoriaProducto | null
}

/**
 * Alta/edición de categoría — un único diálogo para las dos acciones
 * (Bloque 2, administración de categorías). Categoría es solo un nombre,
 * así que no justifica una pantalla propia como Cliente/Proveedor/Producto.
 */
export function CategoriaDialog({ abierto, onOpenChange, categoria }: CategoriaDialogProps) {
  const toast = useToast()
  const crear = useCrearCategoria()
  const modificar = useModificarCategoria()
  const enviando = crear.isPending || modificar.isPending
  const esEdicion = !!categoria

  const [nombre, setNombre] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (abierto) {
      setNombre(categoria?.nombre ?? '')
      setError(null)
    }
  }, [abierto, categoria])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) {
      setError('Este dato es obligatorio.')
      return
    }

    if (esEdicion) {
      modificar.mutate(
        { id: categoria!.id, nombre: nombre.trim() },
        {
          onSuccess: () => {
            toast.exito('Categoría modificada')
            onOpenChange(false)
          },
          onError: () => toast.error('No se pudo modificar la categoría')
        }
      )
    } else {
      crear.mutate(nombre.trim(), {
        onSuccess: () => {
          toast.exito('Categoría creada')
          onOpenChange(false)
        },
        onError: () => toast.error('No se pudo crear la categoría')
      })
    }
  }

  return (
    <Dialog.Root open={abierto} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 animar-entrada-pantalla" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-border bg-surface p-5 shadow-xl animar-entrada-pantalla sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-full sm:max-w-sm sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold text-foreground">
              {esEdicion ? 'Editar categoría' : 'Nueva categoría'}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button aria-label="Cerrar" className="rounded-full p-1 active:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <TextField label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} error={error ?? undefined} disabled={enviando} />

            <div className="flex gap-2 pt-2">
              <Dialog.Close asChild>
                <Button accion="cancelar" type="button" className="flex-1" disabled={enviando}>
                  Cancelar
                </Button>
              </Dialog.Close>
              <Button accion="guardar" type="submit" className="flex-1" disabled={enviando}>
                {enviando ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
