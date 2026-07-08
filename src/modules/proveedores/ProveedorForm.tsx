import * as React from 'react'
import { FormBlock } from '@/core/components/FormBlock'
import { TextField } from '@/core/components/TextField'
import { Select } from '@/core/components/Select'
import { Button, type ButtonProps } from '@/core/components/Button'
import { useConfirm } from '@/core/hooks/useConfirm'
import { useCondicionesIva } from '@/modules/clientes/api'
import { validarProveedor, hayErrores, type ErroresProveedor } from './validaciones'
import type { ProveedorFormValues } from './types'

export interface ProveedorFormProps {
  valoresIniciales: ProveedorFormValues
  onGuardar: (valores: ProveedorFormValues) => void
  onCancelar: () => void
  enviando: boolean
  accionBoton: Extract<ButtonProps['accion'], 'guardar' | 'modificar'>
  textoBoton: string
  autoFocusNombre?: boolean
}

/**
 * Formulario compartido por Alta y Modificación de proveedor. Más simple
 * que ClienteForm a propósito: no existe `factura_config` ni campos
 * condicionales — no se abstrajo un formulario común entre los dos
 * módulos porque esa lógica condicional es justo lo que los diferencia
 * (ver docs/sistemas/modulo-proveedores-arquitectura.md, sección 4.2).
 */
export function ProveedorForm({
  valoresIniciales,
  onGuardar,
  onCancelar,
  enviando,
  accionBoton,
  textoBoton,
  autoFocusNombre = false
}: ProveedorFormProps) {
  const [valores, setValores] = React.useState<ProveedorFormValues>(valoresIniciales)
  const [errores, setErrores] = React.useState<ErroresProveedor>({})
  const { data: condicionesIva, isLoading: cargandoCatalogo } = useCondicionesIva()
  const confirmar = useConfirm()

  function actualizar<K extends keyof ProveedorFormValues>(campo: K, valor: ProveedorFormValues[K]) {
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
    const erroresValidacion = validarProveedor(valores)
    setErrores(erroresValidacion)
    if (hayErrores(erroresValidacion)) return
    onGuardar(valores)
  }

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4 lg:mx-auto lg:w-full lg:max-w-2xl">
        <FormBlock titulo="Datos del proveedor" columnas={2}>
          <TextField
            label="Nombre"
            value={valores.nombre}
            onChange={(e) => actualizar('nombre', e.target.value)}
            error={errores.nombre}
            autoFocus={autoFocusNombre}
            required
            disabled={enviando}
          />
          <TextField
            label="Razón social"
            value={valores.razon_social}
            onChange={(e) => actualizar('razon_social', e.target.value)}
            disabled={enviando}
          />
          <TextField
            label="CUIT"
            value={valores.cuit}
            onChange={(e) => actualizar('cuit', e.target.value)}
            error={errores.cuit}
            inputMode="numeric"
            disabled={enviando}
          />
          <Select
            label="Condición frente al IVA"
            value={valores.condicion_iva_id || undefined}
            onValueChange={(v) => actualizar('condicion_iva_id', v)}
            opciones={(condicionesIva ?? []).map((c) => ({ value: c.id, label: c.nombre }))}
            disabled={enviando || cargandoCatalogo}
            placeholder={cargandoCatalogo ? 'Cargando...' : 'Seleccionar...'}
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
