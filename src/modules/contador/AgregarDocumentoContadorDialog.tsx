import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { Select } from '@/core/components/Select'
import { TextField } from '@/core/components/TextField'
import { ArchivoAdjunto } from '@/core/components/ArchivoAdjunto'
import { Button } from '@/core/components/Button'
import { useToast } from '@/core/hooks/useToast'
import { useAgregarDocumentoContador } from './api'
import { validarDocumentoContador, hayErrores } from './validaciones'
import { valoresDocumentoContadorVacio, ETIQUETAS_TIPO_DOCUMENTO_CONTADOR, type DocumentoContadorFormValues, type TipoDocumentoContador } from './types'

const OPCIONES_TIPO_DOCUMENTO = Object.entries(ETIQUETAS_TIPO_DOCUMENTO_CONTADOR).map(([value, label]) => ({ value, label }))

export interface AgregarDocumentoContadorDialogProps {
  abierto: boolean
  onOpenChange: (abierto: boolean) => void
}

/** Documentación general del Contador — mismo patrón que Empleados (AgregarDocumentoDialog): el archivo es obligatorio, a diferencia del resto de los adjuntos del sistema. */
export function AgregarDocumentoContadorDialog({ abierto, onOpenChange }: AgregarDocumentoContadorDialogProps) {
  const toast = useToast()
  const agregar = useAgregarDocumentoContador()

  const [valores, setValores] = React.useState<DocumentoContadorFormValues>(valoresDocumentoContadorVacio())
  const [archivo, setArchivo] = React.useState<File | null>(null)
  const [errores, setErrores] = React.useState<ReturnType<typeof validarDocumentoContador>>({})
  const [errorArchivo, setErrorArchivo] = React.useState<string | undefined>()

  React.useEffect(() => {
    if (abierto) {
      setValores(valoresDocumentoContadorVacio())
      setArchivo(null)
      setErrores({})
      setErrorArchivo(undefined)
    }
  }, [abierto])

  function actualizar<K extends keyof DocumentoContadorFormValues>(campo: K, valor: DocumentoContadorFormValues[K]) {
    setValores((actuales) => ({ ...actuales, [campo]: valor }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const erroresValidacion = validarDocumentoContador(valores)
    setErrores(erroresValidacion)
    const faltaArchivo = archivo === null
    setErrorArchivo(faltaArchivo ? 'Adjuntá el archivo del documento.' : undefined)
    if (hayErrores(erroresValidacion) || faltaArchivo) return

    agregar.mutate(
      { valores, archivo: archivo as File },
      {
        onSuccess: () => {
          toast.exito('Documento agregado')
          onOpenChange(false)
        },
        onError: () => toast.error('No se pudo agregar el documento')
      }
    )
  }

  return (
    <Dialog.Root open={abierto} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 animar-entrada-pantalla" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-border bg-surface p-5 shadow-xl animar-entrada-pantalla sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-full sm:max-w-sm sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold text-foreground">Agregar documento</Dialog.Title>
            <Dialog.Close asChild>
              <button aria-label="Cerrar" className="rounded-full p-1 active:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              label="Tipo de documento"
              value={valores.tipo_documento || undefined}
              onValueChange={(v) => actualizar('tipo_documento', v as TipoDocumentoContador)}
              opciones={OPCIONES_TIPO_DOCUMENTO}
              disabled={agregar.isPending}
            />
            {errores.tipo_documento && <p className="-mt-3 text-xs text-error">{errores.tipo_documento}</p>}

            {valores.tipo_documento === 'otro' && (
              <TextField
                label="¿De qué documento se trata?"
                value={valores.descripcion_otro}
                onChange={(e) => actualizar('descripcion_otro', e.target.value)}
                error={errores.descripcion_otro}
                disabled={agregar.isPending}
              />
            )}

            <ArchivoAdjunto
              value={archivo}
              onChange={setArchivo}
              label="Archivo del documento"
              error={errorArchivo}
              disabled={agregar.isPending}
            />

            <div className="flex gap-2 pt-2">
              <Dialog.Close asChild>
                <Button accion="cancelar" type="button" className="flex-1" disabled={agregar.isPending}>
                  Cancelar
                </Button>
              </Dialog.Close>
              <Button accion="guardar" type="submit" className="flex-1" disabled={agregar.isPending}>
                {agregar.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
