import type { Config } from 'tailwindcss'

// Los valores de color NO se hardcodean en los componentes.
// Todo componente usa estas clases semánticas (bg-guardar, bg-modificar, etc.)
// definidas a partir de las variables CSS en src/index.css.
// Fuente única de verdad: src/core/theme/tokens.ts + src/index.css.
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        'border-strong': 'hsl(var(--border-strong))',
        background: 'hsl(var(--background))',
        surface: 'hsl(var(--surface))',
        foreground: 'hsl(var(--foreground))',
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        // Colores semánticos de acción — definidos una sola vez en todo el proyecto.
        guardar: { DEFAULT: 'hsl(var(--accion-guardar))', foreground: 'hsl(var(--accion-guardar-foreground))' },
        modificar: { DEFAULT: 'hsl(var(--accion-modificar))', foreground: 'hsl(var(--accion-modificar-foreground))' },
        cancelar: { DEFAULT: 'hsl(var(--accion-cancelar))', foreground: 'hsl(var(--accion-cancelar-foreground))' },
        archivar: { DEFAULT: 'hsl(var(--accion-archivar))', foreground: 'hsl(var(--accion-archivar-foreground))' },
        // Colores semánticos de ESTADO — namespace separado de los de acción.
        exito: { DEFAULT: 'hsl(var(--estado-exito))', foreground: 'hsl(var(--estado-exito-foreground))' },
        advertencia: { DEFAULT: 'hsl(var(--estado-advertencia))', foreground: 'hsl(var(--estado-advertencia-foreground))' },
        error: { DEFAULT: 'hsl(var(--estado-error))', foreground: 'hsl(var(--estado-error-foreground))' },
        info: { DEFAULT: 'hsl(var(--estado-info))', foreground: 'hsl(var(--estado-info-foreground))' },
        // Riel de navegación (Sidebar/BottomNav) — identidad visual definitiva.
        riel: {
          DEFAULT: 'hsl(var(--riel))',
          hover: 'hsl(var(--riel-hover))',
          texto: 'hsl(var(--riel-texto))',
          activo: 'hsl(var(--riel-texto-activo))',
          indicador: 'hsl(var(--riel-indicador))'
        },
        'panel-calido': 'hsl(var(--panel-calido))'
      },
      borderRadius: {
        sm: 'calc(var(--radius) - 4px)',
        md: 'calc(var(--radius) - 2px)',
        lg: 'var(--radius)'
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace']
      }
    }
  },
  plugins: []
} satisfies Config
