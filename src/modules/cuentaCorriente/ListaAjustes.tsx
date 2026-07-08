import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { CampoSoloLectura } from '@/core/components/CampoSoloLectura'
import { CampoTextoLargo } from '@/core/components/FormBlock'
import { Button } from '@/core/components/Button'
import { useToast } from '@/core/hooks/useToast'
import { useConfirm } from '@/core/hooks/useConfirm'
import { formatearMoneda, formatearFecha } from '@/core/lib/format'
import { useAnularAjuste } from './api'
import { useNumeracion } from '@/modules/configuracion/api'
import { formatearNumeroAjuste, type Ajuste, type TipoEntidadCC } from './types'

export type AjusteConUsuario = Ajuste & { usuario_anulacion: { nombre: string } | null }

/**
 * Detalle de un ajuste puntual, con la acción de anular — se abre al
 * tocar una fila del libro contable unificado (LibroCuentaCorriente, ver
 * docs/sistemas/reorganizacion-flujo-operativo.md). Es el mismo
 * componente para Clientes y Proveedores.
 */
export function DetalleAjusteDialog({
  ajuste,
  tipo,
  entidadId,
  onOpenChange
}: {
  ajuste: AjusteConUsuario | null
  tipo: TipoEntidadCC
  entidadId: string
  onOpenChange: (abierto: boolean) => void
}) {
  const toast = useToast()
  const confirmar = useConfirm()
  const anular = useAnularAjuste(tipo, entidadId)
  const { data: prefijos } = useNumeracion()
  const [anulando, setAnulando] = React.useState(false)
  const [motivo, setMotivo] = React.useState('')

  React.useEffect(() => {
    setAnulando(false)
    setMotivo('')
  }, [ajuste])

  if (!ajuste) return null
  const yaAnulado = ajuste.archived_at !== null
  const ajusteId = ajuste.id

  async function handleConfirmarAnulacion() {
    const confirmado = await confirmar({
      titulo: 'Anular ajuste',
      mensaje: 'El ajuste quedará marcado como anulado. No se elimina y su historial se conserva.',
      textoConfirmar: 'Anular',
      accionConfirmar: 'archivar'
    })
    if (!confirmado) return

    anular.mutate(
      { id: ajusteId, motivo },
      {
        onSuccess: () => {
          toast.exito('Ajuste anulado')
          onOpenChange(false)
        },
        onError: () => toast.error('No se pudo anular el ajuste')
      }
    )
  }

  return (
    <Dialog.Root open={ajuste !== null} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 animar-entrada-pantalla" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-border bg-surface p-5 shadow-xl animar-entrada-pantalla sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-full sm:max-w-sm sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold text-foreground">
              {formatearNumeroAjuste(ajuste.numero_interno, prefijos?.ajustes)}
              {yaAnulado && <span className="ml-2 text-xs font-semibold text-error">ANULADO</span>}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button aria-label="Cerrar" className="rounded-full p-1 active:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <CampoSoloLectura label="Importe" valor={formatearMoneda(ajuste.monto)} />
            <CampoSoloLectura label="Fecha" valor={formatearFecha(ajuste.fecha)} />
          </div>
          <div className="mt-4">
            <CampoSoloLectura label="Motivo" valor={ajuste.motivo} />
          </div>

          {yaAnulado && (
            <div className="mt-4 space-y-2 rounded-md bg-muted p-3">
              <CampoSoloLectura label="Anulado por" valor={ajuste.usuario_anulacion?.nombre} />
              <CampoSoloLectura label="Motivo de la anulación" valor={ajuste.motivo_anulacion} />
            </div>
          )}

          {!yaAnulado && !anulando && (
            <Button accion="archivar" className="mt-5 w-full" onClick={() => setAnulando(true)}>
              Anular
            </Button>
          )}

          {!yaAnulado && anulando && (
            <div className="mt-5 space-y-3">
              <CampoTextoLargo label="Motivo de la anulación (opcional)" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
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
