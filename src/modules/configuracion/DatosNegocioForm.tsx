import * as React from 'react'
import { TextField } from '@/core/components/TextField'
import { Select } from '@/core/components/Select'
import { CampoTextoLargo } from '@/core/components/FormBlock'
import { ArchivoAdjunto } from '@/core/components/ArchivoAdjunto'
import { VisorAdjunto } from '@/core/components/VisorAdjunto'
import { Button } from '@/core/components/Button'
import { Card } from '@/core/components/Card'
import { useToast } from '@/core/hooks/useToast'
import { hayErrores, esFormatoEmailValido } from '@/core/lib/validacion'
import { useCondicionesIva } from '@/modules/clientes/api'
import { useDatosNegocio, useGuardarDatosNegocio } from './api'
import { DATOS_NEGOCIO_VACIO } from './types'
import type { DatosNegocio } from './types'

type ErroresDatosNegocio = Partial<Record<'nombre' | 'email', string>>

function validar(valores: DatosNegocio): ErroresDatosNegocio {
  const errores: ErroresDatosNegocio = {}
  if (!valores.nombre.trim()) {
    errores.nombre = 'Este dato es obligatorio.'
  }
  if (valores.email.trim() && !esFormatoEmailValido(valores.email)) {
    errores.email = 'El email no tiene un formato válido.'
  }
  return errores
}

/**
 * Datos del negocio — se reutilizan en cualquier documento futuro
 * (empieza por el encabezado de la factura impresa/exportada, que hoy
 * dice "ADMIN" fijo). Se guarda en `configuracion` (clave='datos_negocio'),
 * sin ninguna tabla nueva. El logo usa el mismo sistema de adjuntos de
 * siempre, con lectura abierta (migración 0051) — tiene que poder verse
 * en documentos que genera cualquier usuario, no solo quien administra
 * Configuración.
 */
export function DatosNegocioForm() {
  const toast = useToast()
  const { data: datosGuardados, isLoading } = useDatosNegocio()
  const { data: condicionesIva } = useCondicionesIva()
  const guardar = useGuardarDatosNegocio()

  const [valores, setValores] = React.useState<DatosNegocio>(DATOS_NEGOCIO_VACIO)
  const [logo, setLogo] = React.useState<File | null>(null)
  const [errores, setErrores] = React.useState<ErroresDatosNegocio>({})

  React.useEffect(() => {
    if (datosGuardados) setValores(datosGuardados)
  }, [datosGuardados])

  function actualizar<K extends keyof DatosNegocio>(campo: K, valor: DatosNegocio[K]) {
    setValores((actuales) => ({ ...actuales, [campo]: valor }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const erroresValidacion = validar(valores)
    setErrores(erroresValidacion)
    if (hayErrores(erroresValidacion)) return

    guardar.mutate(
      { valores, logo },
      {
        onSuccess: () => {
          toast.exito('Datos del negocio guardados')
          setLogo(null)
        },
        onError: () => toast.error('No se pudieron guardar los datos')
      }
    )
  }

  if (isLoading) return null

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="Nombre del negocio" value={valores.nombre} onChange={(e) => actualizar('nombre', e.target.value)} error={errores.nombre} />
          <TextField label="CUIT (opcional)" value={valores.cuit} onChange={(e) => actualizar('cuit', e.target.value)} />
          <TextField label="Dirección (opcional)" value={valores.direccion} onChange={(e) => actualizar('direccion', e.target.value)} />
          <TextField label="Teléfono (opcional)" value={valores.telefono} onChange={(e) => actualizar('telefono', e.target.value)} />
          <TextField label="Correo electrónico (opcional)" value={valores.email} onChange={(e) => actualizar('email', e.target.value)} error={errores.email} />
          <TextField label="Ciudad (opcional)" value={valores.ciudad} onChange={(e) => actualizar('ciudad', e.target.value)} />
          <TextField label="Provincia (opcional)" value={valores.provincia} onChange={(e) => actualizar('provincia', e.target.value)} />
          <Select
            label="Condición frente al IVA (opcional)"
            value={valores.condicion_iva_id || undefined}
            onValueChange={(v) => actualizar('condicion_iva_id', v)}
            opciones={(condicionesIva ?? []).map((c) => ({ value: c.id, label: c.nombre }))}
          />
        </div>

        <CampoTextoLargo
          label="Observaciones (opcional)"
          value={valores.observaciones}
          onChange={(e) => actualizar('observaciones', e.target.value)}
        />

        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Logo</p>
          {valores.logo_path && !logo && (
            <div className="mb-2">
              <VisorAdjunto ruta={valores.logo_path} label="" />
            </div>
          )}
          <ArchivoAdjunto value={logo} onChange={setLogo} label={valores.logo_path ? 'Reemplazar logo' : 'Subir logo'} />
        </div>

        <Button accion="guardar" type="submit" disabled={guardar.isPending}>
          {guardar.isPending ? 'Guardando...' : 'Guardar'}
        </Button>
      </form>
    </Card>
  )
}
