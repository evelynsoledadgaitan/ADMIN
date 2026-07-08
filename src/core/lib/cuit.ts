/**
 * Validación del CUIT/CUIL argentino — función pura y compartida (Bloque
 * 1, ver docs/decisiones y docs/sistemas/roadmap-bloques-funcionales.md).
 * No es lógica de Clientes ni de Proveedores, es un algoritmo fiscal
 * genérico (módulo 11) — cualquier módulo futuro que necesite un CUIT
 * (Facturación, Empleados con CUIL...) reutiliza esto mismo.
 */

const COEFICIENTES = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]

/** Deja solo dígitos — el usuario puede tipear el CUIT con o sin guiones. */
export function normalizarCuit(cuit: string): string {
  return cuit.replace(/\D/g, '')
}

/**
 * true si el dígito verificador (el último de los 11) es matemáticamente
 * correcto para los primeros 10 — no confirma que el CUIT exista
 * realmente en AFIP/ARCA (eso requeriría un servicio externo, fuera del
 * alcance del proyecto, ver decisión 0025), solo que tiene la forma
 * válida de un CUIT real.
 */
export function validarDigitoVerificadorCuit(cuit: string): boolean {
  const digitos = normalizarCuit(cuit)
  if (digitos.length !== 11) return false

  const suma = COEFICIENTES.reduce((acc, coef, i) => acc + coef * Number(digitos[i]), 0)
  const resto = suma % 11
  const verificador = resto === 0 ? 0 : 11 - resto

  if (verificador === 10) return false // matemáticamente posible, pero ningún CUIT real cae acá
  return verificador === Number(digitos[10])
}
