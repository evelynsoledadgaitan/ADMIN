import { ModuleEmptyScreen } from "@/core/components/ModuleEmptyScreen"
import { MODULOS } from "@/core/theme/modulos"

const modulo = MODULOS.find((m) => m.key === "cheques")!

/**
 * Pantalla inicial de cheques (Sprint 1 — esqueleto, sin funcionalidad de
 * negocio todavía). Ver core/components/ModuleEmptyScreen para el porqué.
 */
export function ChequesScreen() {
  return <ModuleEmptyScreen modulo={modulo} />
}
