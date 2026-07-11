import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { usePageTitle } from '@/core/hooks/usePageTitle'
import { useToast } from '@/core/hooks/useToast'
import { TextField } from '@/core/components/TextField'
import { DateField } from '@/core/components/DateField'
import { CurrencyField } from '@/core/components/CurrencyField'
import { CampoTextoLargo } from '@/core/components/FormBlock'
import { ArchivoAdjunto } from '@/core/components/ArchivoAdjunto'
import { Button } from '@/core/components/Button'
import { SelectorEntidadDialog, type ItemSelectorEntidad } from '@/core/components/SelectorEntidadDialog'
import { hoyISO } from '@/core/lib/format'
import { useClientes } from '@/modules/clientes/api'
import { useCrearCheque, useAdjuntarComprobanteCheque } from './api'
import { subirAdjunto } from '@/core/lib/adjuntos'
import { validarCheque, hayErrores } from './validaciones'
import { valoresChequeVacio } from './types'
import type { ChequeFormValues } from './types'

/**
 * Alta de un cheque — recibirlo de un cliente genera, en el momento de
 * guardar, un cobro normal en el Motor de Pagos (decisión central
 * aprobada, ver docs/sistemas/cheques-diseno.md). La foto del frente es
 * opcional (decisión aprobada) — se puede subir después desde la Ficha
 * si no se tiene a mano en el momento de cargarlo.
 */
export function AltaCheque() {
  usePageTitle('Nuevo cheque')
  const navigate = useNavigate()
  const toast = useToast()
  const { data: clientes, isLoading: cargandoClientes } = useClientes()
  const crear = useCrearCheque()
  const adjuntar = useAdjuntarComprobanteCheque()

  const [valores, setValores] = React.useState<ChequeFormValues>(() => valoresChequeVacio(hoyISO()))
  const [nombreClienteElegido, setNombreClienteElegido] = React.useState('')
  const [mostrarSelectorCliente, setMostrarSelectorCliente] = React.useState(false)
  const [foto, setFoto] = React.useState<File | null>(null)
  const [errores, setErrores] = React.useState<ReturnType<typeof validarCheque>>({})
  const [mostrarErrores, setMostrarErrores] = React.useState(false)

  const itemsClientes: ItemSelectorEntidad[] = (clientes ?? []).map((c) => ({ id: c.id, nombre: c.nombre_apellido }))

  function manejarElegirCliente(item: ItemSelectorEntidad) {
    actualizar('cliente_id', item.id)
    setNombreClienteElegido(item.nombre)
    setMostrarSelectorCliente(false)
  }

  function actualizar<K extends keyof ChequeFormValues>(campo: K, valor: ChequeFormValues[K]) {
    setValores((actuales) => ({ ...actuales, [campo]: valor }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const erroresValidacion = validarCheque(valores)
    setErrores(erroresValidacion)
    setMostrarErrores(true)
    if (hayErrores(erroresValidacion)) return

    crear.mutate(valores, {
      onSuccess: async (cheque) => {
        if (foto) {
          try {
            const ruta = await subirAdjunto('cheques', 'cheques', cheque.id, foto)
            await adjuntar.mutateAsync({ id: cheque.id, comprobante_path: ruta })
          } catch {
            toast.error('El cheque se guardó, pero no se pudo subir la foto — podés reintentar desde su Ficha.')
          }
        }
        toast.exito('Cheque registrado')
        navigate(`/cheques/${cheque.id}`)
      },
      onError: () => toast.error('No se pudo registrar el cheque')
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4 lg:mx-auto lg:w-full lg:max-w-2xl">
        <h1 className="mb-4 text-xl font-bold tracking-tight text-foreground">Nuevo cheque</h1>

        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Cliente (de quién se recibe)</p>
            <button
              type="button"
              onClick={() => setMostrarSelectorCliente(true)}
              disabled={cargandoClientes}
              className="flex h-11 w-full items-center justify-between rounded-md border border-border px-3 text-left text-sm disabled:opacity-60"
            >
              <span className={nombreClienteElegido ? 'text-foreground' : 'text-muted-foreground'}>
                {cargandoClientes ? 'Cargando...' : nombreClienteElegido || 'Elegir cliente...'}
              </span>
            </button>
            {mostrarErrores && errores.cliente_id && <p className="mt-1 text-xs text-error">{errores.cliente_id}</p>}
          </div>
          <TextField
            label="Banco"
            value={valores.banco}
            onChange={(e) => actualizar('banco', e.target.value)}
            error={mostrarErrores ? errores.banco : undefined}
          />
          <TextField
            label="Número"
            value={valores.numero}
            onChange={(e) => actualizar('numero', e.target.value)}
            error={mostrarErrores ? errores.numero : undefined}
          />
          <CurrencyField
            label="Importe"
            value={valores.importe}
            onValueChange={(v) => actualizar('importe', v)}
            error={mostrarErrores ? errores.importe : undefined}
          />
          <TextField
            label="Titular"
            value={valores.titular}
            onChange={(e) => actualizar('titular', e.target.value)}
            error={mostrarErrores ? errores.titular : undefined}
          />
          <TextField label="CUIT (opcional)" value={valores.cuit} onChange={(e) => actualizar('cuit', e.target.value)} />
          <DateField
            label="Fecha de emisión"
            value={valores.fecha_emision}
            max={hoyISO()}
            onChange={(e) => actualizar('fecha_emision', e.target.value)}
            error={mostrarErrores ? errores.fecha_emision : undefined}
          />
          <DateField
            label="Fecha de vencimiento"
            value={valores.fecha_vencimiento}
            onChange={(e) => actualizar('fecha_vencimiento', e.target.value)}
            error={mostrarErrores ? errores.fecha_vencimiento : undefined}
          />
        </div>

        <div className="mb-4">
          <CampoTextoLargo label="Observaciones (opcional)" value={valores.observaciones} onChange={(e) => actualizar('observaciones', e.target.value)} />
        </div>

        <ArchivoAdjunto value={foto} onChange={setFoto} label="Foto del frente (opcional)" />
      </div>

      <div className="border-t border-border p-4">
        <div className="flex gap-2 lg:mx-auto lg:w-full lg:max-w-2xl">
          <Button accion="cancelar" type="button" className="flex-1" onClick={() => navigate('/cheques')} disabled={crear.isPending}>
            Cancelar
          </Button>
          <Button accion="guardar" type="submit" className="flex-1" disabled={crear.isPending}>
            {crear.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </div>

      <SelectorEntidadDialog
        abierto={mostrarSelectorCliente}
        onOpenChange={setMostrarSelectorCliente}
        titulo="Elegí un cliente"
        items={itemsClientes}
        onSeleccionar={manejarElegirCliente}
        cargando={cargandoClientes}
        placeholderBusqueda="Buscar clientes..."
      />
    </form>
  )
}
