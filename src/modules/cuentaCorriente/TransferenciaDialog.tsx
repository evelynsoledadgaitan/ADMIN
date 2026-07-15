import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { CurrencyField } from '@/core/components/CurrencyField'
import { DateField } from '@/core/components/DateField'
import { CampoTextoLargo } from '@/core/components/FormBlock'
import { Button } from '@/core/components/Button'
import { SelectorEntidadDialog, type ItemSelectorEntidad } from '@/core/components/SelectorEntidadDialog'
import { useToast } from '@/core/hooks/useToast'
import { useConfirm } from '@/core/hooks/useConfirm'
import { formatearMoneda } from '@/core/lib/format'
import { useClientes } from '@/modules/clientes/api'
import { useRegistrarTransferencia } from './api'
import { hoyISO } from './validaciones'
import { valoresTransferenciaVacio, type TransferenciaFormValues } from './types'

export interface TransferenciaDialogProps {
  origenClienteId: string
  nombreOrigen: string
  abierto: boolean
  onOpenChange: (abierto: boolean) => void
  onGuardado?: () => void
}

/**
 * Transferencia entre cuentas — aplicar el saldo a favor de un cliente
 * para reducir la deuda de otro (decisión aprobada, ver
 * docs/sistemas/cheques-cartera-pagos-compuestos-diseno.md). Pide
 * confirmación explícita antes de ejecutar (pedido explícito) porque
 * mueve saldo entre dos cuentas distintas a la vez, algo que no tiene
 * vuelta atrás simple.
 */
export function TransferenciaDialog({ origenClienteId, nombreOrigen, abierto, onOpenChange, onGuardado }: TransferenciaDialogProps) {
  const toast = useToast()
  const confirmar = useConfirm()
  const { data: clientes, isLoading: cargandoClientes } = useClientes()
  const registrar = useRegistrarTransferencia(origenClienteId, nombreOrigen)

  const [valores, setValores] = React.useState<TransferenciaFormValues>(() => valoresTransferenciaVacio(hoyISO()))
  const [nombreDestino, setNombreDestino] = React.useState('')
  const [mostrarSelectorDestino, setMostrarSelectorDestino] = React.useState(false)
  const [error, setError] = React.useState<string | undefined>()

  React.useEffect(() => {
    if (abierto) {
      setValores(valoresTransferenciaVacio(hoyISO()))
      setNombreDestino('')
      setError(undefined)
    }
  }, [abierto])

  function actualizar<K extends keyof TransferenciaFormValues>(campo: K, valor: TransferenciaFormValues[K]) {
    setValores((actuales) => ({ ...actuales, [campo]: valor }))
  }

  function manejarElegirDestino(item: ItemSelectorEntidad) {
    actualizar('destino_cliente_id', item.id)
    setNombreDestino(item.nombre)
    setMostrarSelectorDestino(false)
  }

  const itemsClientes: ItemSelectorEntidad[] = (clientes ?? []).filter((c) => c.id !== origenClienteId).map((c) => ({ id: c.id, nombre: c.nombre_apellido }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valores.destino_cliente_id) {
      setError('Elegí a qué cuenta transferir.')
      return
    }
    if (valores.importe === null || valores.importe <= 0) {
      setError('Ingresá un importe mayor a cero.')
      return
    }
    setError(undefined)

    const confirmado = await confirmar({
      titulo: 'Confirmar transferencia',
      mensaje: `Se va a transferir ${formatearMoneda(valores.importe)} de la cuenta de ${nombreOrigen} hacia la cuenta de ${nombreDestino}. Esta operación queda registrada en las dos cuentas.`,
      textoConfirmar: 'Transferir',
      accionConfirmar: 'guardar'
    })
    if (!confirmado) return

    registrar.mutate(
      { valores, nombreDestino },
      {
        onSuccess: () => {
          toast.exito('Transferencia registrada')
          onOpenChange(false)
          onGuardado?.()
        },
        onError: () => toast.error('No se pudo registrar la transferencia')
      }
    )
  }

  return (
    <Dialog.Root open={abierto} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 animar-entrada-pantalla" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-border bg-surface p-5 shadow-xl animar-entrada-pantalla sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-full sm:max-w-sm sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold text-foreground">Transferir a otra cuenta</Dialog.Title>
            <Dialog.Close asChild>
              <button aria-label="Cerrar" className="rounded-full p-1 active:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              De la cuenta de <strong className="text-foreground">{nombreOrigen}</strong> hacia:
            </p>

            <div>
              <button
                type="button"
                onClick={() => setMostrarSelectorDestino(true)}
                disabled={cargandoClientes}
                className="flex h-11 w-full items-center justify-between rounded-md border border-border px-3 text-left text-sm disabled:opacity-60"
              >
                <span className={nombreDestino ? 'text-foreground' : 'text-muted-foreground'}>
                  {cargandoClientes ? 'Cargando...' : nombreDestino || 'Elegir cliente destino...'}
                </span>
              </button>
            </div>

            <CurrencyField
              label="Importe"
              value={valores.importe}
              onValueChange={(v) => actualizar('importe', v)}
              disabled={registrar.isPending}
            />
            <DateField
              label="Fecha"
              value={valores.fecha}
              max={hoyISO()}
              onChange={(e) => actualizar('fecha', e.target.value)}
              disabled={registrar.isPending}
            />
            <CampoTextoLargo
              label="Motivo (opcional, recomendado)"
              value={valores.motivo}
              onChange={(e) => actualizar('motivo', e.target.value)}
              disabled={registrar.isPending}
            />
            {error && <p className="text-xs text-error">{error}</p>}

            <div className="flex gap-2 pt-2">
              <Dialog.Close asChild>
                <Button accion="cancelar" type="button" className="flex-1" disabled={registrar.isPending}>
                  Cancelar
                </Button>
              </Dialog.Close>
              <Button accion="guardar" type="submit" className="flex-1" disabled={registrar.isPending}>
                {registrar.isPending ? 'Transfiriendo...' : 'Transferir'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>

      <SelectorEntidadDialog
        abierto={mostrarSelectorDestino}
        onOpenChange={setMostrarSelectorDestino}
        titulo="Elegí el cliente destino"
        items={itemsClientes}
        onSeleccionar={manejarElegirDestino}
        cargando={cargandoClientes}
        placeholderBusqueda="Buscar clientes..."
      />
    </Dialog.Root>
  )
}
