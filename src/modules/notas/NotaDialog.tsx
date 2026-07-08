import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { TextField } from '@/core/components/TextField'
import { DateField } from '@/core/components/DateField'
import { CampoTextoLargo } from '@/core/components/FormBlock'
import { Button } from '@/core/components/Button'
import { useToast } from '@/core/hooks/useToast'
import { useCrearNota, useModificarNota } from './api'
import { validarNota, hayErrores } from './validaciones'
import { valoresNotaVacio, notaAFormValues } from './types'
import type { Nota, NotaFormValues } from './types'

export interface NotaDialogProps {
  /** null = crear una nota nueva. Con una nota, se edita esa misma — un único diálogo para las dos acciones (decisión aprobada). */
  nota: Nota | null
  abierto: boolean
  onOpenChange: (abierto: boolean) => void
}

/**
 * Crear/editar una nota — el único diálogo del módulo, sin ninguna Ficha
 * aparte (decisión aprobada). Editar guarda directo, sin anular: es la
 * primera y única excepción a la inmutabilidad de todo ADMIN (ver
 * docs/sistemas/notas-diseno.md).
 */
export function NotaDialog({ nota, abierto, onOpenChange }: NotaDialogProps) {
  const toast = useToast()
  const crear = useCrearNota()
  const modificar = useModificarNota(nota?.id ?? '')
  const enviando = crear.isPending || modificar.isPending

  const [valores, setValores] = React.useState<NotaFormValues>(valoresNotaVacio())
  const [errores, setErrores] = React.useState<ReturnType<typeof validarNota>>({})

  React.useEffect(() => {
    if (abierto) {
      setValores(nota ? notaAFormValues(nota) : valoresNotaVacio())
      setErrores({})
    }
  }, [abierto, nota])

  function actualizar<K extends keyof NotaFormValues>(campo: K, valor: NotaFormValues[K]) {
    setValores((actuales) => ({ ...actuales, [campo]: valor }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const erroresValidacion = validarNota(valores)
    setErrores(erroresValidacion)
    if (hayErrores(erroresValidacion)) return

    const mutacion = nota ? modificar : crear
    mutacion.mutate(valores, {
      onSuccess: () => {
        toast.exito(nota ? 'Nota guardada' : 'Nota creada')
        onOpenChange(false)
      },
      onError: () => toast.error('No se pudo guardar la nota')
    })
  }

  return (
    <Dialog.Root open={abierto} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 animar-entrada-pantalla" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-border bg-surface p-5 shadow-xl animar-entrada-pantalla sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-full sm:max-w-sm sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold text-foreground">{nota ? 'Editar nota' : 'Nueva nota'}</Dialog.Title>
            <Dialog.Close asChild>
              <button aria-label="Cerrar" className="rounded-full p-1 active:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <TextField
              label="Título"
              value={valores.titulo}
              onChange={(e) => actualizar('titulo', e.target.value)}
              error={errores.titulo}
              disabled={enviando}
              autoFocus
            />
            <CampoTextoLargo
              label="Descripción (opcional)"
              value={valores.descripcion}
              onChange={(e) => actualizar('descripcion', e.target.value)}
              disabled={enviando}
            />
            <DateField
              label="Fecha (opcional)"
              value={valores.fecha}
              onChange={(e) => actualizar('fecha', e.target.value)}
              disabled={enviando}
            />
            <DateField
              label="Recordatorio (opcional)"
              value={valores.recordatorio}
              onChange={(e) => actualizar('recordatorio', e.target.value)}
              disabled={enviando}
            />

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
