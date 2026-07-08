import * as React from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Printer, ExternalLink } from 'lucide-react'
import { usePageTitle } from '@/core/hooks/usePageTitle'
import { useToast } from '@/core/hooks/useToast'
import { useConfirm } from '@/core/hooks/useConfirm'
import { SpinnerPantallaCompleta } from '@/core/components/Spinner'
import { EmptyState } from '@/core/components/EmptyState'
import { Card } from '@/core/components/Card'
import { BadgeArchivado } from '@/core/components/BadgeArchivado'
import { Button } from '@/core/components/Button'
import { TextField } from '@/core/components/TextField'
import { ArchivoAdjunto } from '@/core/components/ArchivoAdjunto'
import { VisorAdjunto } from '@/core/components/VisorAdjunto'
import { CampoTextoLargo } from '@/core/components/FormBlock'
import { formatearMoneda, formatearFecha } from '@/core/lib/format'
import { urlFirmadaAdjunto } from '@/core/lib/adjuntos'
import { useFactura, useFacturaItems, useDeudaDeFactura, useCobroDeFactura, useAnularFactura, useEditarEmisionFactura } from './api'
import { formatearNumeroFactura, calcularNetoEIva, ETIQUETAS_IVA } from './types'
import { formatearNumeroDeuda } from '@/modules/clientes/types'
import { useNumeracion, useDatosNegocio } from '@/modules/configuracion/api'
import { EstadoFacturaBadge } from './EstadoFacturaBadge'

/**
 * Ficha de la factura — datos, líneas, total, estado. "Imprimir/Exportar"
 * usa el diálogo de impresión nativo del navegador (decisión aprobada
 * 5.3): sin librerías de PDF, el usuario elige "Guardar como PDF" desde
 * ahí mismo. Los botones de acción llevan `print:hidden` — al imprimir
 * solo se ve el comprobante en sí (ver también AppShell.tsx, que oculta
 * el Sidebar/TopBar/BottomNav al imprimir).
 *
 * Sección "Emisión" (número real + PDF de ARCA): es la única parte de una
 * factura que se puede editar después de creada — todo lo demás sigue
 * inmutable. El estado (Pendiente de emitir / Emitida) no se controla
 * desde acá, lo calcula solo un trigger en la base según si ambos datos
 * están cargados (ver migración 0036) — nunca se muestra un botón para
 * "marcar como emitida" a mano, sería la misma información duplicada de
 * otra forma y podría desincronizarse.
 */
export function FichaFactura() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const confirmar = useConfirm()
  const { data: factura, isLoading, isError } = useFactura(id)
  const { data: prefijos } = useNumeracion()
  const { data: datosNegocio } = useDatosNegocio()
  const [logoUrl, setLogoUrl] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!datosNegocio?.logo_path) {
      setLogoUrl(null)
      return
    }
    let cancelado = false
    urlFirmadaAdjunto(datosNegocio.logo_path).then((url) => {
      if (!cancelado) setLogoUrl(url)
    })
    return () => {
      cancelado = true
    }
  }, [datosNegocio?.logo_path])
  const { data: items } = useFacturaItems(id)
  const { data: deuda } = useDeudaDeFactura(id)
  const { data: cobro } = useCobroDeFactura(factura?.movimiento_id ?? null)
  const anular = useAnularFactura(factura?.cliente_id ?? '')
  const editarEmision = useEditarEmisionFactura(id ?? '', factura?.cliente_id ?? '')
  const [anulando, setAnulando] = React.useState(false)
  const [motivo, setMotivo] = React.useState('')
  const [numeroExterno, setNumeroExterno] = React.useState('')
  const [archivoArca, setArchivoArca] = React.useState<File | null>(null)

  usePageTitle(factura ? formatearNumeroFactura(factura.numero_interno, prefijos?.facturas) : 'Factura')

  React.useEffect(() => {
    if (factura) setNumeroExterno(factura.numero_externo ?? '')
  }, [factura])

  if (isLoading) return <SpinnerPantallaCompleta />
  if (isError || !factura) {
    return (
      <EmptyState
        mensaje="No se encontró la factura."
        accion={{ texto: 'Volver al listado', onClick: () => navigate('/facturacion') }}
      />
    )
  }

  const yaAnulada = factura.archived_at !== null
  const facturaId = factura.id
  const numeroVisible = factura.numero_externo ?? formatearNumeroFactura(factura.numero_interno, prefijos?.facturas)
  const { neto, importeIva } = calcularNetoEIva(factura.total, factura.iva)

  async function handleConfirmarAnulacion() {
    const confirmado = await confirmar({
      titulo: 'Anular factura',
      mensaje:
        deuda !== null && deuda !== undefined
          ? 'La factura quedará marcada como anulada, y la deuda que generó también se va a anular automáticamente. El saldo del cliente se corrige solo.'
          : 'La factura quedará marcada como anulada. No se elimina y su historial se conserva.',
      textoConfirmar: 'Anular',
      accionConfirmar: 'archivar'
    })
    if (!confirmado) return

    anular.mutate(
      { facturaId, motivo },
      {
        onSuccess: () => toast.exito('Factura anulada'),
        onError: () => toast.error('No se pudo anular la factura')
      }
    )
  }

  function handleGuardarEmision() {
    editarEmision.mutate(
      { numeroExterno, archivo: archivoArca },
      {
        onSuccess: () => {
          toast.exito('Emisión actualizada')
          setArchivoArca(null)
        },
        onError: () => toast.error('No se pudo guardar la emisión')
      }
    )
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4 space-y-4 print:overflow-visible print:p-8">
      <div className="flex items-center justify-between print:hidden">
        <EstadoFacturaBadge estado={factura.estado} />
        <Button accion="neutral" icono={Printer} onClick={() => window.print()}>
          Imprimir / Exportar
        </Button>
      </div>

      <div className="hidden items-start justify-between border-b border-border pb-4 print:flex">
        <div className="flex items-center gap-3">
          {datosNegocio?.logo_path && logoUrl && <img src={logoUrl} alt="" className="h-12 w-12 rounded object-contain" />}
          <div>
            <p className="text-lg font-bold">{datosNegocio?.nombre || 'ADMIN'}</p>
            {datosNegocio?.cuit && <p className="text-xs text-muted-foreground">CUIT {datosNegocio.cuit}</p>}
            {datosNegocio?.direccion && <p className="text-xs text-muted-foreground">{datosNegocio.direccion}</p>}
            <p className="text-xs text-muted-foreground">Comprobante interno — sin validez fiscal</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-base font-semibold">{numeroVisible}</p>
          <p className="text-xs text-muted-foreground">{formatearFecha(factura.fecha)}</p>
        </div>
      </div>

      {yaAnulada && (
        <BadgeArchivado texto="Anulada" className="print:hidden" />
      )}

      <Card className={'space-y-4' + (yaAnulada ? ' opacity-80 print:opacity-100' : '')}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Cliente</p>
            <p className="text-sm font-medium text-foreground">{factura.cliente.nombre_apellido}</p>
          </div>
          <div className="print:hidden">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">N°</p>
            <p className="text-sm font-medium tabular-nums text-foreground">{numeroVisible}</p>
            {factura.numero_externo && (
              <p className="text-xs text-muted-foreground">Interno: {formatearNumeroFactura(factura.numero_interno, prefijos?.facturas)}</p>
            )}
          </div>
          <div className="print:hidden">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Fecha</p>
            <p className="text-sm text-foreground">{formatearFecha(factura.fecha)}</p>
          </div>
        </div>

        <div>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-1.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Descripción</th>
                <th className="py-1.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Cant.</th>
                <th className="py-1.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Precio</th>
                <th className="py-1.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {(items ?? []).map((item) => (
                <tr key={item.id} className="border-b border-border">
                  <td className="py-2 text-foreground">{item.descripcion}</td>
                  <td className="py-2 text-right tabular-nums text-foreground">{item.cantidad}</td>
                  <td className="py-2 text-right tabular-nums text-foreground">{formatearMoneda(item.precio_unitario)}</td>
                  <td className="py-2 text-right tabular-nums text-foreground">{formatearMoneda(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 rounded-lg bg-muted p-4 print:border print:border-border print:bg-transparent">
            {factura.iva !== 'exento' && (
              <>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Neto</span>
                  <span className="tabular-nums">{formatearMoneda(neto)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>IVA ({ETIQUETAS_IVA[factura.iva]})</span>
                  <span className="tabular-nums">{formatearMoneda(importeIva)}</span>
                </div>
                <div className="my-2 border-t border-border" />
              </>
            )}
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-foreground">Total</span>
              <span className="text-2xl font-bold tabular-nums text-foreground">{formatearMoneda(factura.total)}</span>
            </div>
          </div>
        </div>

        {factura.nota && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nota</p>
            <p className="text-sm text-foreground">{factura.nota}</p>
          </div>
        )}
      </Card>

      {deuda && (
        <Link
          to={`/clientes/${factura.cliente_id}/cuenta`}
          className="flex items-center gap-1.5 text-sm font-medium text-primary print:hidden"
        >
          <ExternalLink className="h-4 w-4" />
          Ver la deuda {formatearNumeroDeuda(deuda.numero_interno, prefijos?.deudas)} en el Estado de cuenta
        </Link>
      )}

      {cobro && (
        <Link
          to={`/clientes/${factura.cliente_id}/cuenta`}
          className="flex items-center gap-1.5 text-sm font-medium text-primary print:hidden"
        >
          <ExternalLink className="h-4 w-4" />
          Ver el cobro ({formatearMoneda(cobro.monto)}, {formatearFecha(cobro.fecha)}) en el Estado de cuenta
        </Link>
      )}

      {!yaAnulada && (
        <Card className="space-y-3 print:hidden">
          <h2 className="text-sm font-semibold text-foreground">Emisión</h2>
          <p className="text-xs text-muted-foreground">
            ADMIN no emite comprobantes fiscales. Cuando factures esta operación en ARCA por fuera del sistema, cargá acá el
            número real y el PDF que te haya dado ARCA — la factura pasa a "Emitida" sola, apenas estén los dos.
          </p>
          <TextField label="Número real (ARCA)" value={numeroExterno} onChange={(e) => setNumeroExterno(e.target.value)} />
          <ArchivoAdjunto value={archivoArca} onChange={setArchivoArca} label="Adjuntar PDF de ARCA" />
          {factura.comprobante_path && !archivoArca && <VisorAdjunto ruta={factura.comprobante_path} label="PDF ya cargado" />}
          <Button
            accion="modificar"
            className="w-full"
            onClick={handleGuardarEmision}
            disabled={editarEmision.isPending}
          >
            {editarEmision.isPending ? 'Guardando...' : 'Guardar emisión'}
          </Button>
        </Card>
      )}

      {yaAnulada && (
        <Card className="space-y-2 print:hidden">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Motivo de la anulación</p>
          <p className="text-sm text-foreground">{factura.motivo_anulacion ?? '—'}</p>
        </Card>
      )}

      {!yaAnulada && !anulando && (
        <Button accion="archivar" className="w-full print:hidden" onClick={() => setAnulando(true)}>
          Anular
        </Button>
      )}

      {!yaAnulada && anulando && (
        <div className="space-y-3 print:hidden">
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
