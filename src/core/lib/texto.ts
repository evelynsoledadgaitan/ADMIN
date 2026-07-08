/**
 * Normaliza texto para ordenar sin que los acentos alteren el orden
 * alfabético ("Álvarez" antes que "Beltrán", no después). Centralizada
 * acá (Etapa 1 de limpieza interna) — antes estaba copiada, carácter por
 * carácter, en 4 listados.
 */
export function normalizarParaOrden(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}
