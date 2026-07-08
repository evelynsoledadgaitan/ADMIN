import * as React from 'react'
import { useSearchParams } from 'react-router-dom'
import { Square, CheckSquare, Archive, RotateCcw } from 'lucide-react'
import { ListView } from '@/core/components/ListView'
import { EstadoFiltroTabs, type EstadoFiltro } from '@/core/components/EstadoFiltroTabs'
import { useToast } from '@/core/hooks/useToast'
import { useArchivable } from '@/core/hooks/useArchivable'
import { useRestaurar } from '@/core/hooks/useRestaurar'
import { formatearFecha } from '@/core/lib/format'
import { useNotas, useNotasArchivadas, useNota, useToggleRealizada } from './api'
import { NotaDialog } from './NotaDialog'
import type { Nota } from './types'

function FilaNota({
  nota,
  archivada,
  onToggleRealizada,
  onClick
}: {
  nota: Nota
  archivada: boolean
  onToggleRealizada: () => void
  onClick: () => void
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      {!archivada && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleRealizada()
          }}
          aria-label={nota.realizada ? 'Marcar como no realizada' : 'Marcar como realizada'}
          className="mt-0.5 shrink-0 text-muted-foreground active:text-primary"
        >
          {nota.realizada ? <CheckSquare className="h-5 w-5 text-exito" /> : <Square className="h-5 w-5" />}
        </button>
      )}
      <button onClick={onClick} className="min-w-0 flex-1 text-left">
        <p className={`truncate text-sm font-medium ${nota.realizada ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
          {nota.titulo}
        </p>
        {nota.descripcion && <p className="truncate text-xs text-muted-foreground">{nota.descripcion}</p>}
        {(nota.fecha || nota.recordatorio) && (
          <p className="text-xs text-muted-foreground">
            {nota.fecha && `${formatearFecha(nota.fecha)}`}
            {nota.fecha && nota.recordatorio && ' · '}
            {nota.recordatorio && `Recordatorio: ${formatearFecha(nota.recordatorio)}`}
          </p>
        )}
      </button>
    </div>
  )
}

/**
 * Notas — el módulo más simple de ADMIN. Una sola vista de lista para
 * cualquier tamaño de pantalla (sin duplicar en una tabla de escritorio
 * aparte, a propósito) — mismo criterio de simplicidad que ya se usó
 * para el libro contable y los informes.
 *
 * Soporta `?abrir=ID` en la URL — así la tarjeta de Pendientes en Inicio
 * puede llevar directo a la nota, sin que exista ninguna Ficha propia.
 */
export function ListadoNotas() {
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const [estado, setEstado] = React.useState<EstadoFiltro>('activos')
  const [notaEnEdicion, setNotaEnEdicion] = React.useState<Nota | null>(null)
  const [dialogoAbierto, setDialogoAbierto] = React.useState(false)

  const { data: activas, isLoading: cargandoActivas, isError, refetch } = useNotas()
  const { data: archivadas, isLoading: cargandoArchivadas } = useNotasArchivadas()
  const archivar = useArchivable('notas')
  const restaurar = useRestaurar('notas')
  const toggleRealizada = useToggleRealizada()

  const idAAbrir = searchParams.get('abrir')
  const { data: notaDesdeUrl } = useNota(idAAbrir ?? undefined)

  React.useEffect(() => {
    if (notaDesdeUrl) {
      setNotaEnEdicion(notaDesdeUrl)
      setDialogoAbierto(true)
      searchParams.delete('abrir')
      setSearchParams(searchParams, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo debe correr cuando llega la nota pedida por URL, no en cada cambio de searchParams
  }, [notaDesdeUrl])

  const items = estado === 'activos' ? activas ?? [] : archivadas ?? []
  const cargando = estado === 'activos' ? cargandoActivas : cargandoArchivadas

  function abrirNueva() {
    setNotaEnEdicion(null)
    setDialogoAbierto(true)
  }

  function abrirEdicion(nota: Nota) {
    setNotaEnEdicion(nota)
    setDialogoAbierto(true)
  }

  function handleToggleRealizada(nota: Nota) {
    toggleRealizada.mutate(
      { id: nota.id, realizada: !nota.realizada },
      { onError: () => toast.error('No se pudo actualizar la nota') }
    )
  }

  function handleArchivar(nota: Nota) {
    archivar.mutate(nota.id, {
      onSuccess: () => toast.exito('Nota archivada'),
      onError: () => toast.error('No se pudo archivar la nota')
    })
  }

  function handleRestaurar(nota: Nota) {
    restaurar.mutate(nota.id, {
      onSuccess: () => toast.exito('Nota restaurada'),
      onError: () => toast.error('No se pudo restaurar la nota')
    })
  }

  return (
    <div className="flex h-full flex-col">
      <div className="hidden shrink-0 px-6 pb-2 pt-5 lg:block">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Notas</h1>
        <div className="mt-3">
          <EstadoFiltroTabs valor={estado} onChange={setEstado} cantidadArchivados={archivadas?.length} />
        </div>
      </div>
      <div className="border-b border-border px-4 pb-3 pt-3 lg:hidden">
        <EstadoFiltroTabs valor={estado} onChange={setEstado} cantidadArchivados={archivadas?.length} />
      </div>

      <div className="min-h-0 flex-1">
        <ListView
          listKey={`notas-${estado}`}
          items={items}
          getKey={(n) => n.id}
          getSearchableText={(n) => `${n.titulo} ${n.descripcion ?? ''}`}
          renderItem={(n) => (
            <div className="group relative">
              <FilaNota
                nota={n}
                archivada={estado === 'archivados'}
                onToggleRealizada={() => handleToggleRealizada(n)}
                onClick={() => abrirEdicion(n)}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (estado === 'activos') {
                    handleArchivar(n)
                  } else {
                    handleRestaurar(n)
                  }
                }}
                aria-label={estado === 'activos' ? 'Archivar' : 'Restaurar'}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              >
                {estado === 'activos' ? <Archive className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
              </button>
            </div>
          )}
          onAgregar={abrirNueva}
          placeholderBusqueda="Buscar por título o descripción..."
          emptyState={estado === 'activos' ? 'No hay notas.' : 'No hay notas archivadas.'}
          cargando={cargando}
          error={isError ? { mensaje: 'No se pudieron cargar las notas.', onReintentar: refetch } : undefined}
        />
      </div>

      <NotaDialog nota={notaEnEdicion} abierto={dialogoAbierto} onOpenChange={setDialogoAbierto} />
    </div>
  )
}
