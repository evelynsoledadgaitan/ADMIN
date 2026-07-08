import * as React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, AlertTriangle, Trash2, RotateCcw } from 'lucide-react'
import { usePageTitle } from '@/core/hooks/usePageTitle'
import { useToast } from '@/core/hooks/useToast'
import { useConfirm } from '@/core/hooks/useConfirm'
import { useArchivable } from '@/core/hooks/useArchivable'
import { useRestaurar } from '@/core/hooks/useRestaurar'
import { SpinnerPantallaCompleta } from '@/core/components/Spinner'
import { EmptyState } from '@/core/components/EmptyState'
import { Card } from '@/core/components/Card'
import { BadgeArchivado } from '@/core/components/BadgeArchivado'
import { Button } from '@/core/components/Button'
import { CampoSoloLectura } from '@/core/components/CampoSoloLectura'
import { HistorialAuditoria } from '@/core/components/HistorialAuditoria'
import { formatearMoneda, formatearFecha } from '@/core/lib/format'
import { urlFirmadaAdjunto } from '@/core/lib/adjuntos'
import { useMediosPago } from '@/modules/pagos/api'
import {
  useEmpleado,
  useModalidadesPago,
  useDocumentosEmpleado,
  useAnularDocumento,
  usePagosEmpleado,
  useAnularPagoEmpleado,
  useUltimoPagoEmpleado
} from './api'
import { AgregarDocumentoDialog } from './AgregarDocumentoDialog'
import { RegistrarPagoEmpleadoDialog } from './RegistrarPagoEmpleadoDialog'
import { ETIQUETAS_TIPO_DOCUMENTO, ETIQUETAS_FRECUENCIA_PAGO, DOCUMENTOS_REQUERIDOS, type TipoDocumento } from './types'

/**
 * Ficha del empleado — resumen (cargo, modalidad, valor, último pago,
 * último adelanto), Documentación (con indicador de completa/faltan) y
 * Pagos y adelantos (historial cronológico, sin saldo — ver
 * docs/sistemas/bloque4a-empleados-diseno.md).
 */
export function FichaEmpleado() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const confirmar = useConfirm()
  const empleadoId = id ?? ''

  const { data: empleado, isLoading, isError } = useEmpleado(id)
  const { data: modalidades } = useModalidadesPago()
  const { data: mediosPago } = useMediosPago()
  const { data: documentos } = useDocumentosEmpleado(empleadoId)
  const { data: pagos } = usePagosEmpleado(empleadoId)
  const { data: ultimoPago } = useUltimoPagoEmpleado(empleadoId, 'pago')
  const { data: ultimoAdelanto } = useUltimoPagoEmpleado(empleadoId, 'adelanto')

  const archivar = useArchivable('empleados')
  const restaurar = useRestaurar('empleados')
  const anularDocumento = useAnularDocumento(empleadoId)
  const anularPago = useAnularPagoEmpleado(empleadoId)

  const [agregandoDocumento, setAgregandoDocumento] = React.useState(false)
  const [registrandoPago, setRegistrandoPago] = React.useState(false)
  const [registrandoAdelanto, setRegistrandoAdelanto] = React.useState(false)

  usePageTitle(empleado?.nombre_apellido ?? null)

  if (isLoading) return <SpinnerPantallaCompleta />
  if (isError || !empleado) {
    return (
      <EmptyState
        mensaje="No se encontró el empleado."
        accion={{ texto: 'Volver al listado', onClick: () => navigate('/empleados') }}
      />
    )
  }

  const archivado = empleado.archived_at !== null
  const nombreModalidad = modalidades?.find((m) => m.id === empleado.modalidad_pago_id)?.nombre
  const etiquetaValor = nombreModalidad === 'Por hora' ? 'Valor por hora' : 'Importe fijo'

  const documentosActivos = (documentos ?? []).filter((d) => d.archived_at === null)
  const tiposPresentes = new Set(documentosActivos.map((d) => d.tipo_documento))
  const faltantes = DOCUMENTOS_REQUERIDOS.filter((t) => !tiposPresentes.has(t))
  const documentacionCompleta = faltantes.length === 0

  async function handleVerDocumento(ruta: string) {
    const url = await urlFirmadaAdjunto(ruta)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  async function handleAnularDocumento(docId: string) {
    const confirmado = await confirmar({
      titulo: 'Anular documento',
      mensaje: 'El documento quedará marcado como anulado. Podés subir uno nuevo para reemplazarlo.',
      textoConfirmar: 'Anular',
      accionConfirmar: 'archivar'
    })
    if (!confirmado) return
    anularDocumento.mutate(
      { id: docId, motivo: '' },
      {
        onSuccess: () => toast.exito('Documento anulado'),
        onError: () => toast.error('No se pudo anular el documento')
      }
    )
  }

  async function handleAnularPago(pagoId: string) {
    const confirmado = await confirmar({
      titulo: 'Anular registro',
      mensaje: 'El registro quedará marcado como anulado. No se elimina y su historial se conserva.',
      textoConfirmar: 'Anular',
      accionConfirmar: 'archivar'
    })
    if (!confirmado) return
    anularPago.mutate(
      { id: pagoId, motivo: '' },
      {
        onSuccess: () => toast.exito('Registro anulado'),
        onError: () => toast.error('No se pudo anular el registro')
      }
    )
  }

  async function handleArchivarEmpleado() {
    const confirmado = await confirmar({
      titulo: 'Archivar empleado',
      mensaje: 'El empleado dejará de aparecer en el listado principal. Su historial se conservará y podrá restaurarse más adelante.',
      textoConfirmar: 'Archivar',
      accionConfirmar: 'archivar'
    })
    if (!confirmado) return
    archivar.mutate(empleadoId, {
      onSuccess: () => {
        toast.exito('Empleado archivado')
        navigate('/empleados')
      },
      onError: () => toast.error('No se pudo archivar el empleado')
    })
  }

  function handleRestaurarEmpleado() {
    restaurar.mutate(empleadoId, {
      onSuccess: () => toast.exito('Empleado restaurado'),
      onError: () => toast.error('No se pudo restaurar el empleado')
    })
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4 space-y-4">
      {archivado && (
        <BadgeArchivado />
      )}

      {/* Resumen */}
      <Card className={archivado ? 'opacity-80' : ''}>
        <h1 className="mb-3 text-lg font-semibold text-foreground">{empleado.nombre_apellido}</h1>
        <div className="grid grid-cols-2 gap-4">
          <CampoSoloLectura label="Cargo" valor={empleado.cargo} />
          <CampoSoloLectura label="Modalidad de pago" valor={nombreModalidad} />
          <CampoSoloLectura label={etiquetaValor} valor={empleado.valor !== null ? formatearMoneda(empleado.valor) : undefined} />
          <CampoSoloLectura
            label="Frecuencia de pago"
            valor={empleado.frecuencia_pago ? ETIQUETAS_FRECUENCIA_PAGO[empleado.frecuencia_pago] : undefined}
          />
          <CampoSoloLectura
            label="Último pago"
            valor={ultimoPago ? `${formatearFecha(ultimoPago.fecha)} (${formatearMoneda(ultimoPago.monto)})` : 'Sin pagos registrados'}
          />
          <CampoSoloLectura
            label="Último adelanto"
            valor={ultimoAdelanto ? `${formatearFecha(ultimoAdelanto.fecha)} (${formatearMoneda(ultimoAdelanto.monto)})` : 'Sin adelantos registrados'}
          />
        </div>
      </Card>

      {/* Documentación */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Documentación</h2>
          {!archivado && (
            <Button accion="neutral" onClick={() => setAgregandoDocumento(true)}>
              Agregar
            </Button>
          )}
        </div>

        <div
          className={
            'mb-3 flex items-center gap-2 rounded-md px-3 py-2 text-sm ' +
            (documentacionCompleta ? 'bg-exito/10 text-exito' : 'bg-advertencia/10 text-advertencia')
          }
        >
          {documentacionCompleta ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
          {documentacionCompleta
            ? 'Documentación completa'
            : `Faltan: ${faltantes.map((t) => ETIQUETAS_TIPO_DOCUMENTO[t]).join(', ')}`}
        </div>

        {documentosActivos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay documentos cargados.</p>
        ) : (
          <ul className="divide-y divide-border">
            {documentosActivos.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between gap-3 py-2.5">
                <button onClick={() => handleVerDocumento(doc.comprobante_path)} className="text-left">
                  <p className="text-sm font-medium text-primary">
                    {doc.tipo_documento === 'otro' ? doc.descripcion_otro : ETIQUETAS_TIPO_DOCUMENTO[doc.tipo_documento as TipoDocumento]}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatearFecha(doc.created_at)}</p>
                </button>
                {!archivado && (
                  <button
                    onClick={() => handleAnularDocumento(doc.id)}
                    aria-label="Anular documento"
                    className="shrink-0 text-muted-foreground hover:text-error"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Pagos y adelantos */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Pagos y adelantos</h2>
          {!archivado && (
            <div className="flex gap-2">
              <Button accion="neutral" onClick={() => setRegistrandoPago(true)}>
                Registrar pago
              </Button>
              <Button accion="neutral" onClick={() => setRegistrandoAdelanto(true)}>
                Registrar adelanto
              </Button>
            </div>
          )}
        </div>

        {!pagos || pagos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay pagos ni adelantos registrados.</p>
        ) : (
          <ul className="divide-y divide-border">
            {pagos.map((p) => {
              const anulado = p.archived_at !== null
              const nombreMedio = mediosPago?.find((m) => m.id === p.medio_pago_id)?.nombre
              return (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className={anulado ? 'opacity-50' : ''}>
                    <p className="text-sm font-medium text-foreground">
                      {p.tipo === 'pago' ? 'Pago' : 'Adelanto'} · {formatearMoneda(p.monto)}
                      {anulado && <span className="ml-2 text-xs font-semibold text-error">ANULADO</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatearFecha(p.fecha)} · {p.concepto}
                      {nombreMedio && ` · ${nombreMedio}`}
                      {p.numero_comprobante && ` · Comp. ${p.numero_comprobante}`}
                    </p>
                    {p.descuento !== null && (
                      <p className="text-xs text-advertencia">
                        Bruto {formatearMoneda(p.monto + p.descuento)} − descuento {formatearMoneda(p.descuento)}
                        {p.motivo_descuento && ` (${p.motivo_descuento})`}
                      </p>
                    )}
                    {p.comprobante_path && !anulado && (
                      <button
                        onClick={async () => window.open(await urlFirmadaAdjunto(p.comprobante_path as string), '_blank', 'noopener,noreferrer')}
                        className="mt-0.5 text-xs font-medium text-primary"
                      >
                        Ver comprobante
                      </button>
                    )}
                  </div>
                  {!anulado && (
                    <button
                      onClick={() => handleAnularPago(p.id)}
                      aria-label="Anular registro"
                      className="shrink-0 text-muted-foreground hover:text-error"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      {/* Actividad */}
      <Card>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Actividad</h2>
        <HistorialAuditoria tabla="empleados" registroId={empleado.id} />
      </Card>

      {archivado ? (
        <Button accion="archivar" icono={RotateCcw} className="w-full" onClick={handleRestaurarEmpleado} disabled={restaurar.isPending}>
          {restaurar.isPending ? 'Restaurando...' : 'Restaurar empleado'}
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button accion="modificar" className="flex-1" onClick={() => navigate(`/empleados/${empleado.id}/editar`)}>
            Modificar
          </Button>
          <Button accion="archivar" className="flex-1" onClick={handleArchivarEmpleado} disabled={archivar.isPending}>
            Archivar
          </Button>
        </div>
      )}

      <AgregarDocumentoDialog empleadoId={empleadoId} abierto={agregandoDocumento} onOpenChange={setAgregandoDocumento} />
      <RegistrarPagoEmpleadoDialog
        empleadoId={empleadoId}
        tipo="pago"
        nombreModalidad={nombreModalidad}
        valorAcordado={empleado.valor}
        abierto={registrandoPago}
        onOpenChange={setRegistrandoPago}
      />
      <RegistrarPagoEmpleadoDialog
        empleadoId={empleadoId}
        tipo="adelanto"
        nombreModalidad={nombreModalidad}
        valorAcordado={empleado.valor}
        abierto={registrandoAdelanto}
        onOpenChange={setRegistrandoAdelanto}
      />
    </div>
  )
}
