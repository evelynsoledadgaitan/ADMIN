/**
 * Muestra un dato en modo lectura con el mismo aspecto visual (label
 * arriba, valor abajo) que un TextField pero sin input — para toda
 * pantalla de Ficha (Clientes, y después Proveedores/Productos/Empleados).
 * Si el valor es null/undefined/vacío, no se renderiza nada — una Ficha no
 * debería mostrar "Email: -" para cada dato opcional sin completar; eso es
 * ruido, no información (ver docs/decisiones/0012).
 */
export function CampoSoloLectura({ label, valor }: { label: string; valor: string | null | undefined }) {
  if (!valor) return null
  return (
    <div className="grid gap-0.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{valor}</span>
    </div>
  )
}
