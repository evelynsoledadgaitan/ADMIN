import * as React from 'react'
import { FormBlock } from '@/core/components/FormBlock'
import { TextField } from '@/core/components/TextField'
import { CurrencyField } from '@/core/components/CurrencyField'
import { Select } from '@/core/components/Select'
import { Button, type ButtonProps } from '@/core/components/Button'
import { useConfirm } from '@/core/hooks/useConfirm'
import { useModalidadesPago } from './api'
import { validarEmpleado, hayErrores, type ErroresEmpleado } from './validaciones'
import { ETIQUETAS_FRECUENCIA_PAGO, type EmpleadoFormValues, type FrecuenciaPago } from './types'

const OPCIONES_FRECUENCIA = Object.entries(ETIQUETAS_FRECUENCIA_PAGO).map(([value, label]) => ({ value, label }))

export interface EmpleadoFormProps {
  valoresIniciales: EmpleadoFormValues
  onGuardar: (valores: EmpleadoFormValues) => void
  onCancelar: () => void
  enviando: boolean
  accionBoton: Extract<ButtonProps['accion'], 'guardar' | 'modificar'>
  textoBoton: string
  autoFocusNombre?: boolean
}

/**
 * Formulario compartido por Alta y Modificación de empleado — mismo
 * patrón que ClienteForm/ProveedorForm. "Valor" sirve tanto para "por
 * hora" como para "importe fijo" (mismo campo, la etiqueta cambia según
 * la modalidad elegida) — ver docs/sistemas/bloque4a-empleados-diseno.md.
 */
export function EmpleadoForm({
  valoresIniciales,
  onGuardar,
  onCancelar,
  enviando,
  accionBoton,
  textoBoton,
  autoFocusNombre = false
}: EmpleadoFormProps) {
  const [valores, setValores] = React.useState<EmpleadoFormValues>(valoresIniciales)
  const [errores, setErrores] = React.useState<ErroresEmpleado>({})
  const { data: modalidades, isLoading: cargandoCatalogo } = useModalidadesPago()
  const confirmar = useConfirm()

  const modalidadElegida = modalidades?.find((m) => m.id === valores.modalidad_pago_id)
  const etiquetaValor = modalidadElegida?.nombre === 'Por hora' ? 'Valor por hora' : 'Importe fijo'

  function actualizar<K extends keyof EmpleadoFormValues>(campo: K, valor: EmpleadoFormValues[K]) {
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
    const erroresValidacion = validarEmpleado(valores)
    setErrores(erroresValidacion)
    if (hayErrores(erroresValidacion)) return
    onGuardar(valores)
  }

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4 lg:mx-auto lg:w-full lg:max-w-2xl">
        <FormBlock titulo="Datos del empleado" columnas={2}>
          <TextField
            label="Nombre y apellido"
            value={valores.nombre_apellido}
            onChange={(e) => actualizar('nombre_apellido', e.target.value)}
            error={errores.nombre_apellido}
            autoFocus={autoFocusNombre}
            required
            disabled={enviando}
          />
          <TextField
            label="Cargo (opcional)"
            value={valores.cargo}
            onChange={(e) => actualizar('cargo', e.target.value)}
            disabled={enviando}
          />
          <Select
            label="Modalidad de pago"
            value={valores.modalidad_pago_id || undefined}
            onValueChange={(v) => actualizar('modalidad_pago_id', v)}
            opciones={(modalidades ?? []).map((m) => ({ value: m.id, label: m.nombre }))}
            disabled={enviando || cargandoCatalogo}
            placeholder={cargandoCatalogo ? 'Cargando...' : 'Seleccionar...'}
          />
          <CurrencyField
            label={etiquetaValor}
            value={valores.valor}
            onValueChange={(v) => actualizar('valor', v)}
            error={errores.valor}
            disabled={enviando}
          />
          <Select
            label="Frecuencia de pago (opcional)"
            value={valores.frecuencia_pago || undefined}
            onValueChange={(v) => actualizar('frecuencia_pago', v as FrecuenciaPago)}
            opciones={OPCIONES_FRECUENCIA}
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
