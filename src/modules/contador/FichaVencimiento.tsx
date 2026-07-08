import * as React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useToast } from '@/core/hooks/useToast'
import { useConfirm } from '@/core/hooks/useConfirm'
import { usePageTitle } from '@/core/hooks/usePageTitle'
import { SpinnerPantallaCompleta } from '@/core/components/Spinner'
import { EmptyState } from '@/core/components/EmptyState'
import { Card } from '@/core/components/Card'
import { BadgeArchivado } from '@/core/components/BadgeArchivado'
import { Button } from '@/core/components/Button'
import { CampoSoloLectura } from '@/core/components/CampoSoloLectura'
import { DateField } from '@/core/components/DateField'
import { ArchivoAdjunto } from '@/core/components/ArchivoAdjunto'
import { VisorAdjunto } from '@/core/components/VisorAdjunto'
import { CampoTextoLargo } from '@/core/components/FormBlock'
import { HistorialAuditoria } from '@/core/components/HistorialAuditoria'
import { formatearMoneda, formatearFecha } from '@/core/lib/format'
import { useVencimiento, useMarcarPagada, useAnularVencimiento } from './api'
import { hoyISO } from './validaciones'
import { ETIQUETAS_TIPO, calcularEstadoVencimiento } from './types'
import { EstadoVencimientoBadge } from './EstadoVencimientoBadge'
import { TipoObligacionIcono } from './TipoObligacionIcono'

/**
 * Ficha del vencimiento — datos, estado (color protagonista, pedido
 * explícito), historial simple (vencimiento, fecha de pago, importe,
 * comprobante, observaciones — pedido explícito). "Marcar como pagada" es
 * la única edición que admite después de creado; el resto es inmutable,
 * solo se anula.
 */
export function FichaVencimiento() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const confirmar = useConfirm()
  const { data: obligacion, isLoading, isError } = useVencimiento(id)
  const marcarPagada = useMarcarPagada(id ?? '')
  const anular = useAnularVencimiento()

  const [marcandoPagada, setMarcandoPagada] = React.useState(false)
  const [fechaPago, setFechaPago] = React.useState(hoyISO())
  const [archivo, setArchivo] = React.useState<File | null>(null)
  const [anulando, setAnulando] = React.useState(false)
  const [motivo, setMotivo] = React.useState('')

  usePageTitle(obligacion?.concepto ?? null)

  if (isLoading) return <SpinnerPantallaCompleta />
  if (isError || !obligacion) {
    return (
      <EmptyState
        mensaje="No se encontró el vencimiento."
        accion={{ texto: 'Volver al listado', onClick: () => navigate('/contador') }}
      />
    )
  }

  const yaAnulada = obligacion.archived_at !== null
  const estado = calcularEstadoVencimiento(obligacion, hoyISO())
  const obligacionId = obligacion.id

  function handleGuardarPago() {
    marcarPagada.mutate(
      { fechaPago, archivo },
      {
        onSuccess: () => {
          toast.exito('Vencimiento marcado como pagado')
          setMarcandoPagada(false)
        },
        onError: () => toast.error('No se pudo guardar el pago')
      }
    )
  }

  async function handleConfirmarAnulacion() {
    const confirmado = await confirmar({
      titulo: 'Anular vencimiento',
      mensaje: 'El vencimiento quedará marcado como anulado. No se elimina y su historial se conserva.',
      textoConfirmar: 'Anular',
      accionConfirmar: 'archivar'
    })
    if (!confirmado) return
    anular.mutate(
      { id: obligacionId, motivo },
      {
        onSuccess: () => toast.exito('Vencimiento anulado'),
        onError: () => toast.error('No se pudo anular el vencimiento')
      }
    )
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <EstadoVencimientoBadge estado={estado} className="text-sm" />
        {yaAnulada && (
          <BadgeArchivado texto="Anulado" />
        )}
      </div>

      <Card className={yaAnulada ? 'opacity-80' : ''}>
        <h1 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
          <TipoObligacionIcono tipo={obligacion.tipo} className="h-5 w-5" />
          {obligacion.concepto}
        </h1>
        <div className="grid grid-cols-2 gap-4">
          <CampoSoloLectura label="Tipo" valor={ETIQUETAS_TIPO[obligacion.tipo]} />
          <CampoSoloLectura label="Monto" valor={obligacion.monto !== null ? formatearMoneda(obligacion.monto) : 'Sin monto cargado'} />
          <CampoSoloLectura label="Vencimiento" valor={formatearFecha(obligacion.fecha_vencimiento)} />
          <CampoSoloLectura
            label="Fecha de pago"
            valor={obligacion.fecha_pago ? formatearFecha(obligacion.fecha_pago) : 'Todavía no está pagado'}
          />
        </div>
        {obligacion.nota && (
          <div className="mt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Observaciones</p>
            <p className="text-sm text-foreground">{obligacion.nota}</p>
          </div>
        )}
        {obligacion.comprobante_path && (
          <div className="mt-4">
            <VisorAdjunto ruta={obligacion.comprobante_path} label="Comprobante" />
          </div>
        )}
      </Card>

      {!yaAnulada && obligacion.fecha_pago === null && !marcandoPagada && (
        <Button accion="guardar" className="w-full" onClick={() => setMarcandoPagada(true)}>
          Marcar como pagado
        </Button>
      )}

      {!yaAnulada && marcandoPagada && (
        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Marcar como pagado</h2>
          <DateField label="Fecha de pago" value={fechaPago} max={hoyISO()} onChange={(e) => setFechaPago(e.target.value)} />
          <ArchivoAdjunto value={archivo} onChange={setArchivo} label="Comprobante de pago (opcional)" />
          <div className="flex gap-2">
            <Button accion="cancelar" className="flex-1" onClick={() => setMarcandoPagada(false)} disabled={marcarPagada.isPending}>
              Cancelar
            </Button>
            <Button accion="guardar" className="flex-1" onClick={handleGuardarPago} disabled={marcarPagada.isPending}>
              {marcarPagada.isPending ? 'Guardando...' : 'Confirmar pago'}
            </Button>
          </div>
        </Card>
      )}

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Actividad</h2>
        <HistorialAuditoria tabla="obligaciones_contador" registroId={obligacionId} />
      </Card>

      {yaAnulada && (
        <Card className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Motivo de la anulación</p>
          <p className="text-sm text-foreground">{obligacion.motivo_anulacion ?? '—'}</p>
        </Card>
      )}

      {!yaAnulada && !anulando && (
        <Button accion="archivar" className="w-full" onClick={() => setAnulando(true)}>
          Anular
        </Button>
      )}

      {!yaAnulada && anulando && (
        <div className="space-y-3">
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
    </div>
  )
}
