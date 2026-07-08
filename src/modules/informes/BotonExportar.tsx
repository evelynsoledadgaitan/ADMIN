import { FileText, Sheet } from 'lucide-react'
import { exportarExcel, exportarPDF } from './exportar'

export interface ColumnaExportable {
  clave: string
  encabezado: string
}

export interface BotonExportarProps {
  titulo: string
  subtitulo?: string
  columnas: ColumnaExportable[]
  filas: Record<string, string | number>[]
  nombreArchivo: string
}

/**
 * Exportación compartida por todos los informes — mismos datos que ya se
 * ven en pantalla, en dos formatos (pedido explícito). No agrega ninguna
 * consulta nueva: recibe las filas ya cargadas por el informe.
 *
 * Dos botones chicos en vez de un menú desplegable — evita sumar
 * `@radix-ui/react-dropdown-menu` (no estaba instalado) solo para 2
 * opciones, mismo criterio de no agregar dependencias sin necesidad real
 * que ya se usó para elegir impresión nativa en vez de una librería de PDF.
 */
export function BotonExportar({ titulo, subtitulo, columnas, filas, nombreArchivo }: BotonExportarProps) {
  const sinDatos = filas.length === 0

  function handleExcel() {
    const filasParaExcel = filas.map((fila) => Object.fromEntries(columnas.map((c) => [c.encabezado, fila[c.clave]])))
    exportarExcel(filasParaExcel, titulo, nombreArchivo)
  }

  function handlePDF() {
    const filasParaPdf = filas.map((fila) => columnas.map((c) => fila[c.clave]))
    exportarPDF(titulo, columnas.map((c) => c.encabezado), filasParaPdf, subtitulo)
  }

  return (
    <div className="flex gap-1.5">
      <button
        onClick={handlePDF}
        disabled={sinDatos}
        title="Exportar a PDF"
        className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:border-border-strong disabled:opacity-40"
      >
        <FileText className="h-3.5 w-3.5" />
        PDF
      </button>
      <button
        onClick={handleExcel}
        disabled={sinDatos}
        title="Exportar a Excel"
        className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:border-border-strong disabled:opacity-40"
      >
        <Sheet className="h-3.5 w-3.5" />
        Excel
      </button>
    </div>
  )
}
