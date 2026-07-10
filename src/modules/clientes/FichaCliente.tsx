import { useNavigate, useParams, Link } from 'react-router-dom'
import { RotateCcw } from 'lucide-react'
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
import { formatearMoneda } from '@/core/lib/format'
import { useSaldoCliente } from '@/modules/cuentaCorriente'
import { useCliente, useCondicionesIva, useDeudasCliente } from './api'

const ETIQUETAS_FACTURA = {
  siempre: 'Siempre factura',
  nunca: 'Nunca factura',
  preguntar: 'Pregunta cada vez'
} as const

/**
 * Ficha del cliente — ver docs/sistemas/modulo-clientes-arquitectura.md
 * sección 2.4. Etapa 3: agrega el estado archivado (insignia + Restaurar
 * en vez de Modificar/Archivar) — `useCliente(id)` ya traía el registro
 * sin filtrar por `archived_at`, así que no hace falta ninguna consulta
 * nueva para esto, solo la rama visual.
 */
export function FichaCliente() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const confirmar = useConfirm()
  const { data: cliente, isLoading, isError } = useCliente(id)
  const { data: condicionesIva } = useCondicionesIva()
  const { data: saldo } = useSaldoCliente(id ?? '')
  const { data: deudas } = useDeudasCliente(id ?? '')
  const archivar = useArchivable('clientes')
  const restaurar = useRestaurar('clientes')

  usePageTitle(cliente?.nombre_apellido ?? null)

  if (isLoading) return <SpinnerPantallaCompleta />
  if (isError || !cliente) {
    return (
      <EmptyState
        mensaje="No se encontró el cliente."
        accion={{ texto: 'Volver al listado', onClick: () => navigate('/clientes') }}
      />
    )
  }

  const nombreCondicionIva = condicionesIva?.find((c) => c.id === cliente.condicion_iva_id)?.nombre
  const clienteId = cliente.id
  const archivado = cliente.archived_at !== null
  const deudasPendientesFacturar = (deudas ?? []).filter((d) => d.archived_at === null && d.factura_id === null)

  async function handleArchivar() {
    const confirmado = await confirmar({
      titulo: 'Archivar cliente',
      mensaje: 'El cliente dejará de aparecer en el listado principal. Su historial se conservará y podrá restaurarse más adelante.',
      textoConfirmar: 'Archivar',
      accionConfirmar: 'archivar'
    })
    if (!confirmado) return

    archivar.mutate(clienteId, {
      onSuccess: () => {
        toast.exito('Cliente archivado')
        navigate('/clientes')
      },
      onError: () => toast.error('No se pudo archivar el cliente')
    })
  }

  function handleRestaurar() {
    restaurar.mutate(clienteId, {
      onSuccess: () => toast.exito('Cliente restaurado'),
      onError: () => toast.error('No se pudo restaurar el cliente')
    })
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4 space-y-4">
      {archivado && (
        <BadgeArchivado icono fecha={cliente.archived_at} />
      )}

      <Card className={'space-y-4' + (archivado ? ' opacity-80' : '')}>
        <div>
          <h1 className="text-lg font-semibold text-foreground">{cliente.nombre_apellido}</h1>
          {cliente.razon_social && <p className="text-sm text-muted-foreground">{cliente.razon_social}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <CampoSoloLectura label="Facturación" valor={ETIQUETAS_FACTURA[cliente.factura_config]} />
          <CampoSoloLectura label="CUIT" valor={cliente.cuit} />
          <CampoSoloLectura label="Condición frente al IVA" valor={nombreCondicionIva} />
          <CampoSoloLectura label="Email" valor={cliente.email} />
          <CampoSoloLectura label="Domicilio fiscal" valor={cliente.domicilio_fiscal} />
        </div>
      </Card>

      {!archivado && (
        <Card>
          <CampoSoloLectura label="Saldo" valor={saldo !== undefined ? formatearMoneda(saldo) : undefined} />
        </Card>
      )}

      {!archivado && cliente.factura_config === 'siempre' && deudasPendientesFacturar.length > 0 && (
        <Card className="border-advertencia/40 bg-advertencia/5">
          <p className="text-sm text-foreground">
            Facturación pendiente: {deudasPendientesFacturar.length} deuda{deudasPendientesFacturar.length === 1 ? '' : 's'}
          </p>
          <Link to={`/clientes/${cliente.id}/cuenta`} className="text-xs font-medium text-primary">
            Ver en el Estado de Cuenta
          </Link>
        </Card>
      )}

      {!archivado && (
        <Button accion="neutral" className="w-full" onClick={() => navigate(`/clientes/${cliente.id}/cuenta`)}>
          Estado de cuenta
        </Button>
      )}

      {archivado ? (
        <Button accion="archivar" icono={RotateCcw} className="w-full" onClick={handleRestaurar} disabled={restaurar.isPending}>
          {restaurar.isPending ? 'Restaurando...' : 'Restaurar cliente'}
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button accion="modificar" className="flex-1" onClick={() => navigate(`/clientes/${cliente.id}/editar`)}>
            Modificar
          </Button>
          <Button accion="archivar" className="flex-1" onClick={handleArchivar} disabled={archivar.isPending}>
            Archivar
          </Button>
        </div>
      )}
    </div>
  )
}
