/**
 * Validación compartida — si algún campo del formulario tiene un mensaje
 * de error cargado. Centralizada acá (Etapa 1 de limpieza interna) —
 * antes estaba copiada, carácter por carácter, en 8 módulos.
 */
export function hayErrores(errores: Record<string, string | undefined>): boolean {
  return Object.values(errores).some((v) => v !== undefined)
}

/** Formato de email — no confirma que la casilla exista, solo la forma. */
export function esFormatoEmailValido(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())
}
