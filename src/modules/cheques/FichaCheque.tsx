import * as React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { usePageTitle } from '@/core/hooks/usePageTitle'
import { useToast } from '@/core/hooks/useToast'
import { useConfirm } from '@/core/hooks/useConfirm'
import { SpinnerPantallaCompleta } from '@/core/components/Spinner'
import { EmptyState } from '@/core/components/EmptyState'
import { Card } from '@/core/components/Card'
import { Button } from '@/core/components/Button'
import { CampoSoloLectura } from '@/core/components/CampoSoloLectura'
import { ArchivoAdjunto } from '@/core/components/ArchivoAdjunto'
import { VisorAdjunto } from '@/core/components/VisorAdjunto'
import { HistorialAuditoria } from '@/core/components/HistorialAuditoria'
import { SelectorEntidadDialog, type ItemSelectorEntidad } from '@/core/components/SelectorEntidadDialog'
import { subirAdjunto } from '@/core/lib/adjuntos'
import { formatearMoneda, formatearFecha } from '@/core/lib/format'
import { useProveedores } from '@/modules/proveedores/api'
import { formatearNumeroMovimiento } from '@/modules/pagos/types'
import {
  useCheque,
  useMovimientosDeCheque,
  useDepositarCheque,
  useMarcarAcreditado,
  useMarcarRechazado,
  useEntregarAProveedor,
  useAnularCheque,
  useAdjuntarComprobanteCheque
} from './api'
import { EstadoChequeBadge } from './EstadoChequeBadge'
import type { Cheque } from './types'

/**
 * Ficha del cheque — datos, estado, trazabilidad completa (de qué cobro
 * vino, a qué proveedor se entregó — pedido explícito) y las acciones
 * que corresponden según el estado actual. Ver
 * docs/sistemas/cheques-cartera-pagos-compuestos-diseno.md.
 */
export function FichaCheque() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const confirmar = useConfirm()
  const chequeId = id ?? ''

  const { data: cheque, isLoading, isError } = useCheque(id)
  const { data: movimientos } = useMovimientosDeCheque(chequeId)
  const { data: proveedores, isLoading: cargandoProveedores } = useProveedores()
  const depositar = useDepositarCheque()
  const marcarAcreditado = useMarcarAcreditado()
  const marcarRechazado = useMarcarRechazado()
  const entregar = useEntregarAProveedor(chequeId)
  const anular = useAnularCheque()
  const adjuntar = useAdjuntarComprobanteCheque()

  const [mostrarSelectorProveedor, setMostrarSelectorProveedor] = React.useState(false)
  const [foto, setFoto] = React.useState<File | null>(null)
  const [subiendoFoto, setSubiendoFoto] = React.useState(false)

  usePageTitle(cheque ? `${cheque.banco} · ${cheque.numero}` : 'Cheque')

  if (isLoading) return <SpinnerPantallaCompleta />
  if (isError || !cheque) {
    return <EmptyState mensaje="No se encontró el cheque." accion={{ texto: 'Volver al listado', onClick: () => navigate('/cheques') }} />
  }

  async function handleDepositar() {
    const confirmado = await confirmar({
      titulo: 'Depositar cheque',
      mensaje: 'Pasa a "Depositado" — no genera ningún cobro nuevo, el ingreso ya quedó registrado cuando se usó en el cobro.',
      textoConfirmar: 'Depositar',
      accionConfirmar: 'guardar'
    })
    if (!confirmado) return
    depositar.mutate(chequeId, {
      onSuccess: () => toast.exito('Cheque depositado'),
      onError: () => toast.error('No se pudo actualizar el cheque')
    })
  }

  async function handleMarcarAcreditado() {
    const confirmado = await confirmar({
      titulo: 'Marcar como acreditado',
      mensaje: 'Confirma que el banco acreditó el cheque.',
      textoConfirmar: 'Confirmar',
      accionConfirmar: 'guardar'
    })
    if (!confirmado) return
    marcarAcreditado.mutate(chequeId, {
      onSuccess: () => toast.exito('Cheque acreditado'),
      onError: () => toast.error('No se pudo actualizar el cheque')
    })
  }

  async function handleMarcarRechazado(chequeActual: Cheque) {
    const mensaje =
      chequeActual.estado === 'depositado'
        ? 'El cobro que se había registrado al usar este cheque se va a anular — el saldo del cliente vuelve a subir.'
        : 'El pago al proveedor que se había registrado al entregar este cheque se va a anular.'
    const confirmado = await confirmar({
      titulo: 'Marcar como rechazado',
      mensaje,
      textoConfirmar: 'Confirmar rechazo',
      accionConfirmar: 'archivar'
    })
    if (!confirmado) return
    marcarRechazado.mutate(chequeActual, {
      onSuccess: () => toast.exito('Cheque marcado como rechazado'),
      onError: () => toast.error('No se pudo actualizar el cheque')
    })
  }

  function handleElegirProveedor(chequeActual: Cheque, item: ItemSelectorEntidad) {
    setMostrarSelectorProveedor(false)
    entregar.mutate(
      { proveedorId: item.id, importe: chequeActual.importe, numero: chequeActual.numero, banco: chequeActual.banco },
      {
        onSuccess: () => toast.exito('Cheque entregado al proveedor'),
        onError: () => toast.error('No se pudo entregar el cheque')
      }
    )
  }

  async function handleAnular(chequeActual: Cheque) {
    const confirmado = await confirmar({
      titulo: 'Anular cheque',
      mensaje: 'Se anula cualquier cobro y/o pago que haya usado este cheque. El cheque no se elimina, queda marcado como anulado.',
      textoConfirmar: 'Anular',
      accionConfirmar: 'archivar'
    })
    if (!confirmado) return
    anular.mutate(chequeActual, {
      onSuccess: () => toast.exito('Cheque anulado'),
      onError: () => toast.error('No se pudo anular el cheque')
    })
  }

  async function handleSubirFoto() {
    if (!foto) return
    setSubiendoFoto(true)
    try {
      const ruta = await subirAdjunto('cheques', 'cheques', chequeId, foto)
      await adjuntar.mutateAsync({ id: chequeId, comprobante_path: ruta })
      toast.exito('Foto guardada')
      setFoto(null)
    } catch {
      toast.error('No se pudo subir la foto')
    } finally {
      setSubiendoFoto(false)
    }
  }

  const itemsProveedores: ItemSelectorEntidad[] = (proveedores ?? []).map((p) => ({ id: p.id, nombre: p.nombre }))
  const esEstadoFinal = cheque.estado === 'acreditado' || cheque.estado === 'rechazado' || cheque.estado === 'anulado'
  const cobro = movimientos?.find((m) => m.tipo === 'cobro')
  const pago = movimientos?.find((m) => m.tipo === 'pago')

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4 space-y-4">
      <EstadoChequeBadge estado={cheque.estado} className="text-sm" />

      <Card>
        <h1 className="mb-3 text-lg font-semibold text-foreground">
          {cheque.banco} · {cheque.numero}
        </h1>
        <div className="grid grid-cols-2 gap-4">
          <CampoSoloLectura label="Importe" valor={formatearMoneda(cheque.importe)} />
          <CampoSoloLectura label="Titular" valor={cheque.titular} />
          <CampoSoloLectura label="CUIT" valor={cheque.cuit ?? undefined} />
          <CampoSoloLectura label="Fecha de emisión" valor={formatearFecha(cheque.fecha_emision)} />
          <CampoSoloLectura label="Fecha de vencimiento" valor={formatearFecha(cheque.fecha_vencimiento)} />
        </div>
        {cheque.observaciones && (
          <div className="mt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Observaciones</p>
            <p className="text-sm text-foreground">{cheque.observaciones}</p>
          </div>
        )}
      </Card>

      {/* Trazabilidad completa — de qué cobro vino, a quién se entregó (pedido explícito) */}
      {(cobro || pago) && (
        <Card className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Trazabilidad</p>
          {cobro && (
            <div>
              <p className="text-sm text-foreground">
                Recibido de <strong>{cheque.cliente?.nombre_apellido ?? '—'}</strong>
                {cobro.archived_at && <span className="ml-2 text-xs font-semibold text-error">ANULADO</span>}
              </p>
              <Link
                to={`/clientes/${cobro.cliente_id}/cuenta`}
                className="flex items-center gap-1.5 text-sm font-medium text-primary"
              >
                <ExternalLink className="h-4 w-4" />
                Ver el cobro {formatearNumeroMovimiento(cobro.numero_interno)} en su Estado de Cuenta
              </Link>
            </div>
          )}
          {pago && (
            <div>
              <p className="text-sm text-foreground">
                Entregado a <strong>{cheque.proveedor?.nombre ?? '—'}</strong>
                {pago.archived_at && <span className="ml-2 text-xs font-semibold text-error">ANULADO</span>}
              </p>
              <Link
                to={`/proveedores/${pago.proveedor_id}/cuenta`}
                className="flex items-center gap-1.5 text-sm font-medium text-primary"
              >
                <ExternalLink className="h-4 w-4" />
                Ver el pago {formatearNumeroMovimiento(pago.numero_interno)} en su Estado de Cuenta
              </Link>
            </div>
          )}
        </Card>
      )}

      <Card>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Comprobante</p>
        {cheque.comprobante_path ? (
          <VisorAdjunto ruta={cheque.comprobante_path} label="Foto del frente" />
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Todavía no se cargó la foto del frente.</p>
            <ArchivoAdjunto value={foto} onChange={setFoto} label="Subir foto del frente" disabled={subiendoFoto} />
            {foto && (
              <Button accion="guardar" onClick={handleSubirFoto} disabled={subiendoFoto}>
                {subiendoFoto ? 'Subiendo...' : 'Guardar foto'}
              </Button>
            )}
          </div>
        )}
      </Card>

      {!esEstadoFinal && (
        <Card className="space-y-2">
          <h2 className="mb-1 text-sm font-semibold text-foreground">Acciones</h2>
          {cheque.estado === 'en_cartera' && (
            <p className="text-sm text-muted-foreground">
              Todavía no se usó — se vincula a un cliente o proveedor desde "Registrar cobro" o "Registrar pago", eligiéndolo de la
              cartera.
            </p>
          )}
          {cheque.estado === 'disponible' && (
            <>
              <Button accion="guardar" className="w-full" onClick={handleDepositar} disabled={depositar.isPending}>
                Depositar
              </Button>
              <Button
                accion="neutral"
                className="w-full"
                onClick={() => setMostrarSelectorProveedor(true)}
                disabled={cargandoProveedores || entregar.isPending}
              >
                Entregar a un proveedor
              </Button>
            </>
          )}
          {cheque.estado === 'depositado' && (
            <>
              <Button accion="guardar" className="w-full" onClick={handleMarcarAcreditado} disabled={marcarAcreditado.isPending}>
                Marcar acreditado
              </Button>
              <Button accion="archivar" className="w-full" onClick={() => handleMarcarRechazado(cheque)} disabled={marcarRechazado.isPending}>
                Marcar rechazado
              </Button>
            </>
          )}
          {cheque.estado === 'entregado' && (
            <Button accion="archivar" className="w-full" onClick={() => handleMarcarRechazado(cheque)} disabled={marcarRechazado.isPending}>
              Marcar rechazado
            </Button>
          )}
          <Button accion="cancelar" className="w-full" onClick={() => handleAnular(cheque)} disabled={anular.isPending}>
            Anular
          </Button>
        </Card>
      )}

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Actividad</h2>
        <HistorialAuditoria tabla="cheques" registroId={chequeId} />
      </Card>

      <SelectorEntidadDialog
        abierto={mostrarSelectorProveedor}
        onOpenChange={setMostrarSelectorProveedor}
        titulo="Elegí el proveedor"
        items={itemsProveedores}
        onSeleccionar={(item) => handleElegirProveedor(cheque, item)}
        cargando={cargandoProveedores}
        placeholderBusqueda="Buscar proveedores..."
      />
    </div>
  )
}
