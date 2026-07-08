import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Download, ArrowRight } from 'lucide-react'
import { usePageTitle } from '@/core/hooks/usePageTitle'
import { useToast } from '@/core/hooks/useToast'
import { FileField } from '@/core/components/FileField'
import { Button } from '@/core/components/Button'
import { Card } from '@/core/components/Card'
import { Spinner } from '@/core/components/Spinner'
import { formatearMoneda } from '@/core/lib/format'
import { leerArchivoProductos, clasificarFilas, generarCSVErrores, type ResultadoParseo } from './csvParser'
import { useImportarProductos, useProductos } from './api'
import type { ResumenImportacion } from './types'

type Paso = 'elegir' | 'previsualizar' | 'resultado'

/**
 * Importar lista de precios — flujo de 3 pasos (ver
 * docs/sistemas/modulo-productos-arquitectura.md sección 6.4). Es una
 * pantalla propia, no un diálogo: es una operación más pesada que
 * Registrar cobro/compra y merece revisión antes de confirmar.
 */
export function ImportarProductos() {
  usePageTitle('Importar lista')
  const navigate = useNavigate()
  const toast = useToast()
  const importar = useImportarProductos()
  const { data: productosActuales } = useProductos()

  const [paso, setPaso] = React.useState<Paso>('elegir')
  const [archivo, setArchivo] = React.useState<File | null>(null)
  const [parseando, setParseando] = React.useState(false)
  const [resultadoParseo, setResultadoParseo] = React.useState<ResultadoParseo | null>(null)
  const [resumenFinal, setResumenFinal] = React.useState<ResumenImportacion | null>(null)

  async function handleArchivo(nuevoArchivo: File | null) {
    setArchivo(nuevoArchivo)
    if (!nuevoArchivo) return

    setParseando(true)
    try {
      const resultado = await leerArchivoProductos(nuevoArchivo)
      setResultadoParseo(resultado)
      setPaso('previsualizar')
    } catch {
      toast.error('No se pudo leer el archivo')
    } finally {
      setParseando(false)
    }
  }

  function handleDescargarErrores() {
    if (!resultadoParseo) return
    const csv = generarCSVErrores(resultadoParseo.filas)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'errores-importacion.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  function handleConfirmarImportacion() {
    if (!resultadoParseo) return
    const filasValidas = resultadoParseo.filas.filter((f) => f.error === null)
    const cantidadErrores = resultadoParseo.filas.length - filasValidas.length

    importar.mutate(
      { filasValidas, cantidadErrores },
      {
        onSuccess: (resumen) => {
          setResumenFinal(resumen)
          setPaso('resultado')
        },
        onError: () => toast.error('No se pudo completar la importación')
      }
    )
  }

  // ---- Paso 1: elegir archivo -------------------------------------------
  if (paso === 'elegir') {
    return (
      <div className="flex h-full flex-col overflow-y-auto p-4">
        <p className="mb-4 text-sm text-muted-foreground">
          Subí un archivo CSV o Excel (.xlsx) con las columnas de código de barras, nombre y precio (en cualquier
          orden — se identifican por el nombre de la columna, no por su posición). El precio acepta cualquier
          formato habitual: con o sin símbolo de moneda, con coma o punto decimal.
        </p>
        <FileField
          label="Archivo CSV o Excel"
          value={archivo}
          onChange={handleArchivo}
          accept=".csv,text/csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        />
        {parseando && (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner className="h-4 w-4" /> Leyendo archivo...
          </div>
        )}
      </div>
    )
  }

  // ---- Paso 2: previsualizar ----------------------------------------------
  if (paso === 'previsualizar' && resultadoParseo) {
    const hayErrorArchivo = resultadoParseo.erroresArchivo.length > 0
    const filasConError = resultadoParseo.filas.filter((f) => f.error !== null)
    const filasValidas = resultadoParseo.filas.filter((f) => f.error === null)
    const puedeImportar = !hayErrorArchivo && filasValidas.length > 0

    const filasClasificadas = clasificarFilas(resultadoParseo.filas, productosActuales ?? [])
    const ejemplosActualizados = filasClasificadas.filter((f) => f.clasificacion === 'actualizado').slice(0, 5)

    return (
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {hayErrorArchivo ? (
            <Card className="space-y-2 border-error">
              <div className="flex items-center gap-2 text-error">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <p className="text-sm font-semibold">No se pudo leer el archivo</p>
              </div>
              <ul className="list-inside list-disc text-sm text-muted-foreground">
                {resultadoParseo.erroresArchivo.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </Card>
          ) : (
            <>
              <Card>
                <p className="text-sm text-muted-foreground">Filas leídas</p>
                <p className="text-2xl font-semibold text-foreground">{resultadoParseo.filas.length}</p>
              </Card>

              {filasConError.length > 0 && (
                <Card className="space-y-3 border-error">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-error">
                      <AlertTriangle className="h-5 w-5 shrink-0" />
                      <p className="text-sm font-semibold">{filasConError.length} fila(s) con error</p>
                    </div>
                    <button
                      onClick={handleDescargarErrores}
                      className="flex items-center gap-1.5 text-sm font-medium text-primary"
                    >
                      <Download className="h-4 w-4" /> Descargar
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Estas filas no se van a importar. Podés corregirlas y volver a intentar.
                  </p>
                </Card>
              )}

              {ejemplosActualizados.length > 0 && (
                <Card className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">Algunos precios que van a cambiar</p>
                  <ul className="space-y-2">
                    {ejemplosActualizados.map((f) => (
                      <li key={f.codigo_barras} className="flex items-center justify-between gap-2 text-sm">
                        <span className="min-w-0 flex-1 truncate text-muted-foreground">{f.nombre}</span>
                        <span className="flex shrink-0 items-center gap-1.5 font-medium text-foreground">
                          {f.precioAnterior !== null ? formatearMoneda(f.precioAnterior) : '—'}
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                          {f.precio !== null ? formatearMoneda(f.precio) : '—'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              <Card>
                <p className="mb-2 text-sm font-semibold text-foreground">{filasValidas.length} fila(s) listas para importar</p>
                <p className="text-xs text-muted-foreground">
                  ADMIN va a crear los productos nuevos, actualizar el precio de los que ya existen (manteniendo su
                  categoría) y reactivar los que estén archivados.
                </p>
              </Card>
            </>
          )}
        </div>

        <div className="flex gap-2 border-t border-border p-4">
          <Button accion="cancelar" className="flex-1" onClick={() => navigate('/productos')} disabled={importar.isPending}>
            Cancelar
          </Button>
          <Button
            accion="guardar"
            className="flex-1"
            onClick={handleConfirmarImportacion}
            disabled={!puedeImportar || importar.isPending}
          >
            {importar.isPending ? 'Importando...' : 'Importar'}
          </Button>
        </div>
      </div>
    )
  }

  // ---- Paso 3: resultado ---------------------------------------------------
  if (paso === 'resultado' && resumenFinal) {
    return (
      <div className="flex h-full flex-col overflow-y-auto p-4 space-y-4">
        <Card className="space-y-3">
          <p className="text-sm font-semibold text-foreground">Importación completada</p>
          <ResumenFila etiqueta="Productos nuevos" valor={resumenFinal.creados} />
          <ResumenFila etiqueta="Productos actualizados" valor={resumenFinal.actualizados} />
          <ResumenFila etiqueta="Productos reactivados" valor={resumenFinal.reactivados} />
          <ResumenFila etiqueta="Filas con errores" valor={resumenFinal.errores} destacar={resumenFinal.errores > 0} />
        </Card>
        <Button accion="guardar" className="w-full" onClick={() => navigate('/productos')}>
          Volver al listado
        </Button>
      </div>
    )
  }

  return null
}

function ResumenFila({ etiqueta, valor, destacar = false }: { etiqueta: string; valor: number; destacar?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{etiqueta}</span>
      <span className={destacar ? 'font-semibold text-error' : 'font-semibold text-foreground'}>{valor}</span>
    </div>
  )
}
