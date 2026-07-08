import * as React from 'react'
import { FormBlock } from '@/core/components/FormBlock'
import { TextField } from '@/core/components/TextField'
import { Select } from '@/core/components/Select'
import { CurrencyField } from '@/core/components/CurrencyField'
import { Button, type ButtonProps } from '@/core/components/Button'
import { useConfirm } from '@/core/hooks/useConfirm'
import { useCategoriasProductos, useCrearCategoria } from './api'
import { validarProducto, hayErrores, type ErroresProducto } from './validaciones'
import type { ProductoFormValues } from './types'

export interface ProductoFormProps {
  valoresIniciales: ProductoFormValues
  onGuardar: (valores: ProductoFormValues) => void
  onCancelar: () => void
  enviando: boolean
  accionBoton: Extract<ButtonProps['accion'], 'guardar' | 'modificar'>
  textoBoton: string
  autoFocusCodigo?: boolean
}

/**
 * Formulario compartido por Alta y Modificación de producto. La categoría
 * es obligatoria acá (alta/modificación manual) — en la importación queda
 * opcional a propósito, ver docs/sistemas/modulo-productos-arquitectura.md.
 */
export function ProductoForm({
  valoresIniciales,
  onGuardar,
  onCancelar,
  enviando,
  accionBoton,
  textoBoton,
  autoFocusCodigo = false
}: ProductoFormProps) {
  const [valores, setValores] = React.useState<ProductoFormValues>(valoresIniciales)
  const [errores, setErrores] = React.useState<ErroresProducto>({})
  const { data: categorias, isLoading: cargandoCategorias } = useCategoriasProductos()
  const crearCategoria = useCrearCategoria()
  const confirmar = useConfirm()

  function actualizar<K extends keyof ProductoFormValues>(campo: K, valor: ProductoFormValues[K]) {
    setValores((actuales) => ({ ...actuales, [campo]: valor }))
  }

  async function handleCancelar() {
    const hayCambios = JSON.stringify(valores) !== JSON.stringify(valoresIniciales)
    if (!hayCambios) {
      onCancelar()
      return
    }
    const descartar = await confirmar({
      titulo: 'Descartar cambios',
      mensaje: 'Perdés lo que modificaste en este formulario.',
      textoConfirmar: 'Descartar',
      accionConfirmar: 'archivar'
    })
    if (descartar) onCancelar()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const erroresValidacion = validarProducto(valores)
    setErrores(erroresValidacion)
    if (hayErrores(erroresValidacion)) return
    onGuardar(valores)
  }

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4 lg:mx-auto lg:w-full lg:max-w-2xl">
        <FormBlock titulo="Datos del producto" columnas={2}>
          <TextField
            label="Código de barras"
            value={valores.codigo_barras}
            onChange={(e) => actualizar('codigo_barras', e.target.value)}
            error={errores.codigo_barras}
            autoFocus={autoFocusCodigo}
            required
            disabled={enviando}
          />
          <TextField
            label="Nombre"
            value={valores.nombre}
            onChange={(e) => actualizar('nombre', e.target.value)}
            error={errores.nombre}
            required
            disabled={enviando}
          />
          <Select
            label="Categoría"
            value={valores.categoria_id || undefined}
            onValueChange={(v) => actualizar('categoria_id', v)}
            opciones={(categorias ?? []).map((c) => ({ value: c.id, label: c.nombre }))}
            disabled={enviando || cargandoCategorias}
            placeholder={cargandoCategorias ? 'Cargando...' : 'Seleccionar...'}
            onCrearOpcion={(texto) => crearCategoria.mutateAsync(texto).then((c) => c.id)}
            textoCrearOpcion="Nueva categoría"
          />
          {errores.categoria_id && <p className="-mt-3 text-xs text-error">{errores.categoria_id}</p>}
          <CurrencyField
            label="Precio"
            value={valores.precio}
            onValueChange={(v) => actualizar('precio', v)}
            error={errores.precio}
            disabled={enviando}
          />
        </FormBlock>
      </div>

      <div className="border-t border-border p-4">
        <div className="flex gap-2 lg:mx-auto lg:w-full lg:max-w-2xl">
        <Button accion="cancelar" type="button" className="flex-1" onClick={handleCancelar} disabled={enviando}>
          Cancelar
        </Button>
        <Button accion={accionBoton} type="submit" className="flex-1" disabled={enviando}>
          {enviando ? 'Guardando...' : textoBoton}
        </Button>
        </div>
      </div>
    </form>
  )
}
