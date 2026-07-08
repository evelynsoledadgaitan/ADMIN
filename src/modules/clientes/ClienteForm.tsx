import * as React from 'react'
import { FormBlock } from '@/core/components/FormBlock'
import { TextField } from '@/core/components/TextField'
import { Select } from '@/core/components/Select'
import { Button, type ButtonProps } from '@/core/components/Button'
import { useConfirm } from '@/core/hooks/useConfirm'
import { useCondicionesIva } from './api'
import { validarCliente, hayErrores, type ErroresCliente } from './validaciones'
import type { ClienteFormValues } from './types'

const OPCIONES_FACTURA_CONFIG = [
  { value: 'siempre', label: 'Siempre factura' },
  { value: 'nunca', label: 'Nunca factura' },
  { value: 'preguntar', label: 'Preguntar cada vez' }
]

export interface ClienteFormProps {
  valoresIniciales: ClienteFormValues
  onGuardar: (valores: ClienteFormValues) => void
  onCancelar: () => void
  enviando: boolean
  accionBoton: Extract<ButtonProps['accion'], 'guardar' | 'modificar'>
  textoBoton: string
  /** true solo en Alta: el campo principal recibe el foco apenas se entra a la pantalla (ver docs/decisiones/0012). */
  autoFocusNombre?: boolean
}

/**
 * Formulario compartido por Alta y Modificación de cliente — son el mismo
 * formulario, solo cambia qué mutación dispara el botón principal y de
 * qué color es (guardar=verde en Alta, modificar=amarillo en Modificación).
 */
export function ClienteForm({
  valoresIniciales,
  onGuardar,
  onCancelar,
  enviando,
  accionBoton,
  textoBoton,
  autoFocusNombre = false
}: ClienteFormProps) {
  const [valores, setValores] = React.useState<ClienteFormValues>(valoresIniciales)
  const [errores, setErrores] = React.useState<ErroresCliente>({})
  const { data: condicionesIva, isLoading: cargandoCatalogo } = useCondicionesIva()
  const confirmar = useConfirm()

  function actualizar<K extends keyof ClienteFormValues>(campo: K, valor: ClienteFormValues[K]) {
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
    const erroresValidacion = validarCliente(valores)
    setErrores(erroresValidacion)
    if (hayErrores(erroresValidacion)) return
    onGuardar(valores)
  }

  const mostrarFacturacion = valores.factura_config !== 'nunca'

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 lg:mx-auto lg:w-full lg:max-w-2xl">
        <FormBlock titulo="Datos del cliente">
          <TextField
            label="Nombre y apellido"
            value={valores.nombre_apellido}
            onChange={(e) => actualizar('nombre_apellido', e.target.value)}
            error={errores.nombre_apellido}
            autoFocus={autoFocusNombre}
            required
            disabled={enviando}
          />
        </FormBlock>

        <FormBlock titulo="Facturación" columnas={2}>
          <Select
            label="¿Factura?"
            value={valores.factura_config}
            onValueChange={(v) => actualizar('factura_config', v as ClienteFormValues['factura_config'])}
            opciones={OPCIONES_FACTURA_CONFIG}
            disabled={enviando}
          />

          {mostrarFacturacion && (
            <>
              <TextField
                label={valores.factura_config === 'siempre' ? 'Razón social *' : 'Razón social'}
                value={valores.razon_social}
                onChange={(e) => actualizar('razon_social', e.target.value)}
                error={errores.razon_social}
                disabled={enviando}
              />
              <TextField
                label={valores.factura_config === 'siempre' ? 'CUIT *' : 'CUIT'}
                value={valores.cuit}
                onChange={(e) => actualizar('cuit', e.target.value)}
                error={errores.cuit}
                inputMode="numeric"
                disabled={enviando}
              />
              <Select
                label={valores.factura_config === 'siempre' ? 'Condición frente al IVA *' : 'Condición frente al IVA'}
                value={valores.condicion_iva_id || undefined}
                onValueChange={(v) => actualizar('condicion_iva_id', v)}
                opciones={(condicionesIva ?? []).map((c) => ({ value: c.id, label: c.nombre }))}
                disabled={enviando || cargandoCatalogo}
                placeholder={cargandoCatalogo ? 'Cargando...' : 'Seleccionar...'}
              />
              {errores.condicion_iva_id && <p className="text-xs text-error">{errores.condicion_iva_id}</p>}
              <TextField
                label="Domicilio fiscal"
                value={valores.domicilio_fiscal}
                onChange={(e) => actualizar('domicilio_fiscal', e.target.value)}
                disabled={enviando}
              />
              <TextField
                label="Email"
                type="email"
                value={valores.email}
                onChange={(e) => actualizar('email', e.target.value)}
                error={errores.email}
                disabled={enviando}
              />
            </>
          )}
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
