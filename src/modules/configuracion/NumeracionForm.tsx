import * as React from 'react'
import { TextField } from '@/core/components/TextField'
import { Button } from '@/core/components/Button'
import { Card } from '@/core/components/Card'
import { useToast } from '@/core/hooks/useToast'
import { hayErrores } from '@/core/lib/validacion'
import { useNumeracion, useGuardarNumeracion } from './api'
import { PREFIJOS_DEFAULT, ETIQUETAS_PREFIJO } from './types'
import type { PrefijosNumeracion } from './types'

const CAMPOS = Object.keys(ETIQUETAS_PREFIJO) as (keyof PrefijosNumeracion)[]

function validar(valores: PrefijosNumeracion): Partial<Record<keyof PrefijosNumeracion, string>> {
  const errores: Partial<Record<keyof PrefijosNumeracion, string>> = {}
  for (const campo of CAMPOS) {
    if (!valores[campo].trim()) errores[campo] = 'No puede quedar vacío.'
  }
  return errores
}

/**
 * Numeración — prefijo editable de cada comprobante (decisión aprobada
 * 5.1: sí, aunque implique leer el valor desde `configuracion` en los
 * módulos ya cerrados que arman estos números). Un cambio acá solo afecta
 * a los comprobantes nuevos — los ya emitidos guardan su descripción tal
 * como se generó en su momento, no se reescriben.
 */
export function NumeracionForm() {
  const toast = useToast()
  const { data: guardados, isLoading } = useNumeracion()
  const guardar = useGuardarNumeracion()
  const [valores, setValores] = React.useState<PrefijosNumeracion>(PREFIJOS_DEFAULT)
  const [errores, setErrores] = React.useState<Partial<Record<keyof PrefijosNumeracion, string>>>({})

  React.useEffect(() => {
    if (guardados) setValores(guardados)
  }, [guardados])

  function actualizar(campo: keyof PrefijosNumeracion, valor: string) {
    setValores((actuales) => ({ ...actuales, [campo]: valor }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const erroresValidacion = validar(valores)
    setErrores(erroresValidacion)
    if (hayErrores(erroresValidacion)) return

    guardar.mutate(valores, {
      onSuccess: () => toast.exito('Numeración guardada'),
      onError: () => toast.error('No se pudo guardar la numeración')
    })
  }

  if (isLoading) return null

  return (
    <Card>
      <p className="mb-4 text-sm text-muted-foreground">
        El prefijo de cada comprobante — un cambio acá solo afecta a los que se generen de ahora en adelante.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {CAMPOS.map((campo) => (
            <TextField
              key={campo}
              label={ETIQUETAS_PREFIJO[campo]}
              value={valores[campo]}
              onChange={(e) => actualizar(campo, e.target.value)}
              error={errores[campo]}
            />
          ))}
        </div>
        <Button accion="guardar" type="submit" disabled={guardar.isPending}>
          {guardar.isPending ? 'Guardando...' : 'Guardar'}
        </Button>
      </form>
    </Card>
  )
}
