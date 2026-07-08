import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { CampoSoloLectura } from '@/core/components/CampoSoloLectura'
import { VisorAdjunto } from '@/core/components/VisorAdjunto'
import { CampoTextoLargo } from '@/core/components/FormBlock'
import { Button } from '@/core/components/Button'
import { useToast } from '@/core/hooks/useToast'
import { useConfirm } from '@/core/hooks/useConfirm'
import { formatearMoneda, formatearFecha } from '@/core/lib/format'
import { useAnularDeuda } from './api'
import { useNumeracion } from '@/modules/configuracion/api'
import { ETIQUETAS_ORIGEN_DEUDA, formatearNumeroDeuda, type Deuda } from './types'

export type DeudaConUsuario = Deuda & { usuario_anulacion: { nombre: string } | null }

/**
 * Detalle de una deuda puntual, con la acción de anular — se abre al
 * tocar una fila del libro contable unificado (LibroCuentaCorriente,
 * ver docs/sistemas/reorganizacion-flujo-operativo.md). Antes vivía
 * dentro de una lista propia (ListaDeudas); esa lista ya no se renderiza
 * — el libro reemplaza esa vista — pero el detalle/anulación de un
 * registro puntual sigue haciendo falta, así que se conserva acá.
 */
export function DetalleDeudaDialog({
  deuda,
  clienteId,
  onOpenChange
}: {
  deuda: DeudaConUsuario | null
  clienteId: string
  onOpenChange: (abierto: boolean) => void
}) {
  const toast = useToast()
  const confirmar = useConfirm()
  const anular = useAnularDeuda(clienteId)
  const { data: prefijos } = useNumeracion()
  const [anulando, setAnulando] = React.useState(false)
  const [motivo, setMotivo] = React.useState('')

  React.useEffect(() => {
    setAnulando(false)
    setMotivo('')
  }, [deuda])

  if (!deuda) return null
  const yaAnulada = deuda.archived_at !== null
  const deudaId = deuda.id

  async function handleConfirmarAnulacion() {
    const confirmado = await confirmar({
      titulo: 'Anular deuda',
      mensaje: 'La deuda quedará marcada como anulada. No se elimina y su historial se conserva.',
      textoConfirmar: 'Anular',
      accionConfirmar: 'archivar'
    })
    if (!confirmado) return

    anular.mutate(
      { id: deudaId, motivo },
      {
        onSuccess: () => {
          toast.exito('Deuda anulada')
          onOpenChange(false)
        },
        onError: () => toast.error('No se pudo anular la deuda')
      }
    )
  }

  return (
    <Dialog.Root open={deuda !== null} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 animar-entrada-pantalla" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-border bg-surface p-5 shadow-xl animar-entrada-pantalla sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-full sm:max-w-sm sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold text-foreground">
              {formatearNumeroDeuda(deuda.numero_interno, prefijos?.deudas)}
              {yaAnulada && <span className="ml-2 text-xs font-semibold text-error">ANULADA</span>}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button aria-label="Cerrar" className="rounded-full p-1 active:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <CampoSoloLectura label="Origen" valor={ETIQUETAS_ORIGEN_DEUDA[deuda.origen]} />
            <CampoSoloLectura label="Importe" valor={formatearMoneda(deuda.monto)} />
            <CampoSoloLectura label="Fecha" valor={formatearFecha(deuda.fecha)} />
            <CampoSoloLectura label="N° de comprobante" valor={deuda.numero_comprobante} />
          </div>
          <div className="mt-4">
            <CampoSoloLectura label="Descripción" valor={deuda.descripcion} />
          </div>

          <div className="mt-4">
            <VisorAdjunto ruta={deuda.comprobante_path} />
          </div>

          {yaAnulada && (
            <div className="mt-4 space-y-2 rounded-md bg-muted p-3">
              <CampoSoloLectura label="Anulada por" valor={deuda.usuario_anulacion?.nombre} />
              <CampoSoloLectura label="Motivo" valor={deuda.motivo_anulacion} />
            </div>
          )}

          {!yaAnulada && !anulando && (
            <Button accion="archivar" className="mt-5 w-full" onClick={() => setAnulando(true)}>
              Anular
            </Button>
          )}

          {!yaAnulada && anulando && (
            <div className="mt-5 space-y-3">
              <CampoTextoLargo label="Motivo (opcional)" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
              <div className="flex gap-2">
                <Button accion="cancelar" className="flex-1" onClick={() => setAnulando(false)} disabled={anular.isPending}>
                  Volver
                </Button>
                <Button accion="archivar" className="flex-1" onClick={handleConfirmarAnulacion} disabled={anular.isPending}>
                  {anular.isPending ? 'Anulando...' : 'Confirmar anulación'}
                </Button>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
