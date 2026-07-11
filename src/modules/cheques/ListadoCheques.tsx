import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye } from 'lucide-react'
import { ListView } from '@/core/components/ListView'
import { DataTable, type ColumnaDataTable, type AccionDataTable } from '@/core/components/DataTable'
import { Button } from '@/core/components/Button'
import { formatearMoneda, formatearFecha } from '@/core/lib/format'
import { useCheques } from './api'
import { EstadoChequeBadge } from './EstadoChequeBadge'
import { ETIQUETAS_ESTADO_CHEQUE, type EstadoCheque } from './types'
import type { Cheque } from './types'

type ChequeConEntidad = Cheque & { cliente: { nombre_apellido: string } | null; proveedor: { nombre: string } | null }

const PESTANAS: { key: EstadoCheque | 'todos'; etiqueta: string }[] = [
  { key: 'disponible', etiqueta: 'Disponibles' },
  { key: 'entregado', etiqueta: 'Entregados' },
  { key: 'depositado', etiqueta: 'Depositados' },
  { key: 'acreditado', etiqueta: 'Acreditados' },
  { key: 'rechazado', etiqueta: 'Rechazados' },
  { key: 'anulado', etiqueta: 'Anulados' },
  { key: 'todos', etiqueta: 'Todos' }
]

function FilaChequeMovil({ cheque, onClick }: { cheque: ChequeConEntidad; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left active:bg-muted/50">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">
          {cheque.banco} · {cheque.numero}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {cheque.titular} — {cheque.cliente?.nombre_apellido ?? '—'}
          {cheque.proveedor && ` → ${cheque.proveedor.nombre}`}
        </p>
        <p className="text-xs text-muted-foreground">Vence {formatearFecha(cheque.fecha_vencimiento)}</p>
        <div className="mt-1">
          <EstadoChequeBadge estado={cheque.estado} />
        </div>
      </div>
      <span className="shrink-0 text-sm font-medium text-foreground">{formatearMoneda(cheque.importe)}</span>
    </button>
  )
}

/**
 * Listado de Cheques — pestañas por estado (Disponibles/Entregados/...
 * /Anulados/Todos), no el patrón Activos/Archivados habitual: "Anulado"
 * es uno de los 6 estados, siempre visible en su propia pestaña, nunca
 * escondido (decisión aprobada — ver docs/sistemas/cheques-diseno.md).
 */
export function ListadoCheques() {
  const navigate = useNavigate()
  const { data: cheques, isLoading, isError, refetch } = useCheques()
  const [pestana, setPestana] = React.useState<EstadoCheque | 'todos'>('disponible')

  const items = React.useMemo(() => {
    if (!cheques) return []
    if (pestana === 'todos') return cheques
    return cheques.filter((c) => c.estado === pestana)
  }, [cheques, pestana])

  function accionesFila(_c: ChequeConEntidad): AccionDataTable<ChequeConEntidad>[] {
    return [{ icono: Eye, etiqueta: 'Ver', onClick: (c) => navigate(`/cheques/${c.id}`) }]
  }

  const columnas: ColumnaDataTable<ChequeConEntidad>[] = [
    { key: 'banco', encabezado: 'Banco', render: (c) => c.banco },
    { key: 'numero', encabezado: 'Número', render: (c) => c.numero },
    { key: 'titular', encabezado: 'Titular', render: (c) => c.titular },
    {
      key: 'entidad',
      encabezado: 'Cliente / Proveedor',
      render: (c) => (c.proveedor ? c.proveedor.nombre : (c.cliente?.nombre_apellido ?? '—'))
    },
    { key: 'importe', encabezado: 'Importe', alineacion: 'right', render: (c) => formatearMoneda(c.importe) },
    { key: 'emision', encabezado: 'Emisión', render: (c) => formatearFecha(c.fecha_emision) },
    { key: 'vencimiento', encabezado: 'Vencimiento', render: (c) => formatearFecha(c.fecha_vencimiento) },
    { key: 'estado', encabezado: 'Estado', render: (c) => <EstadoChequeBadge estado={c.estado} /> }
  ]

  return (
    <div className="flex h-full flex-col">
      <div className="hidden shrink-0 px-6 pb-2 pt-5 lg:block">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Cheques</h1>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          {(cheques ?? []).length} cheque{(cheques ?? []).length === 1 ? '' : 's'}
        </p>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-border px-4 pb-0 pt-3 lg:px-6">
        {PESTANAS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPestana(p.key)}
            className={`shrink-0 border-b-2 px-3 py-2 text-sm font-medium ${
              pestana === p.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
            }`}
          >
            {p.etiqueta}
          </button>
        ))}
      </div>

      <div className="hidden min-h-0 flex-1 px-6 pb-6 pt-4 lg:block">
        <DataTable
          items={items}
          getKey={(c) => c.id}
          columnas={columnas}
          getSearchableText={(c) => `${c.banco} ${c.numero} ${c.titular} ${c.cliente?.nombre_apellido ?? ''} ${c.proveedor?.nombre ?? ''}`}
          acciones={accionesFila}
          onRowClick={(c) => navigate(`/cheques/${c.id}`)}
          placeholderBusqueda="Buscar por banco, número, titular..."
          emptyMensaje={`No hay cheques ${pestana === 'todos' ? '' : ETIQUETAS_ESTADO_CHEQUE[pestana].toLowerCase()}.`}
          cargando={isLoading}
          accionPrincipal={
            <Button accion="guardar" icono={Plus} onClick={() => navigate('/cheques/nuevo')}>
              Nuevo cheque
            </Button>
          }
        />
      </div>

      <div className="min-h-0 flex-1 lg:hidden">
        <ListView
          listKey={`cheques-${pestana}`}
          items={items}
          getKey={(c) => c.id}
          getSearchableText={(c) => `${c.banco} ${c.numero} ${c.titular} ${c.cliente?.nombre_apellido ?? ''} ${c.proveedor?.nombre ?? ''}`}
          renderItem={(c) => <FilaChequeMovil cheque={c} onClick={() => navigate(`/cheques/${c.id}`)} />}
          onAgregar={() => navigate('/cheques/nuevo')}
          placeholderBusqueda="Buscar por banco, número, titular..."
          emptyState={`No hay cheques ${pestana === 'todos' ? '' : ETIQUETAS_ESTADO_CHEQUE[pestana].toLowerCase()}.`}
          cargando={isLoading}
          error={isError ? { mensaje: 'No se pudieron cargar los cheques.', onReintentar: refetch } : undefined}
        />
      </div>
    </div>
  )
}
