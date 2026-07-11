/**
 * Tipos de la base de datos escritos a mano para que el proyecto compile
 * desde el día uno, reflejando exactamente las migraciones en
 * supabase/migrations/. En cuanto exista un proyecto Supabase real y
 * migrado, reemplazar este archivo por completo con:
 *
 *   npm run gen:types
 *
 * A partir de ese momento este archivo se regenera solo y no se edita a mano.
 *
 * Nota técnica: cada tabla declara `Relationships` (aunque esté vacío) y,
 * cuando corresponde, la relación real (ej. audit_log.usuario_id ->
 * usuarios.id) — supabase-js lo exige para tipar bien tanto `.insert()` /
 * `.update()` como los `select` con joins embebidos (`usuario:usuarios(nombre)`).
 * Sin esto, TypeScript no logra resolver el tipo y todo colapsa a `never`.
 */

type Timestamp = string

export interface Database {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string
          nombre: string
          email: string
          rol: 'admin' | 'usuario'
          activo: boolean
          created_at: Timestamp
          updated_at: Timestamp
        }
        Insert: Partial<Database['public']['Tables']['usuarios']['Row']> & {
          id: string
          nombre: string
          email: string
        }
        Update: Partial<Database['public']['Tables']['usuarios']['Row']>
        Relationships: []
      }
      permisos: {
        Row: {
          id: string
          usuario_id: string
          modulo: string
          puede_ver: boolean
          puede_crear: boolean
          puede_modificar: boolean
          puede_archivar: boolean
        }
        Insert: Partial<Database['public']['Tables']['permisos']['Row']> & {
          usuario_id: string
          modulo: string
        }
        Update: Partial<Database['public']['Tables']['permisos']['Row']>
        Relationships: [
          {
            foreignKeyName: 'permisos_usuario_id_fkey'
            columns: ['usuario_id']
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          }
        ]
      }
      clientes: {
        Row: {
          id: string
          nombre_apellido: string
          factura_config: 'siempre' | 'nunca' | 'preguntar'
          razon_social: string | null
          cuit: string | null
          condicion_iva_id: string | null
          domicilio_fiscal: string | null
          email: string | null
          archived_at: Timestamp | null
          created_at: Timestamp
          updated_at: Timestamp
        }
        Insert: Partial<Database['public']['Tables']['clientes']['Row']> & {
          nombre_apellido: string
        }
        Update: Partial<Database['public']['Tables']['clientes']['Row']>
        Relationships: [
          {
            foreignKeyName: 'clientes_condicion_iva_id_fkey'
            columns: ['condicion_iva_id']
            referencedRelation: 'condiciones_iva'
            referencedColumns: ['id']
          }
        ]
      }
      proveedores: {
        Row: {
          id: string
          nombre: string
          razon_social: string | null
          cuit: string | null
          condicion_iva_id: string | null
          archived_at: Timestamp | null
          created_at: Timestamp
          updated_at: Timestamp
        }
        Insert: Partial<Database['public']['Tables']['proveedores']['Row']> & {
          nombre: string
        }
        Update: Partial<Database['public']['Tables']['proveedores']['Row']>
        Relationships: [
          {
            foreignKeyName: 'proveedores_condicion_iva_id_fkey'
            columns: ['condicion_iva_id']
            referencedRelation: 'condiciones_iva'
            referencedColumns: ['id']
          }
        ]
      }
      productos: {
        Row: {
          id: string
          codigo_barras: string
          nombre: string
          categoria_id: string | null
          precio_actual: number
          archived_at: Timestamp | null
          created_at: Timestamp
          updated_at: Timestamp
        }
        Insert: Partial<Database['public']['Tables']['productos']['Row']> & {
          codigo_barras: string
          nombre: string
          precio_actual: number
        }
        Update: Partial<Database['public']['Tables']['productos']['Row']>
        Relationships: [
          {
            foreignKeyName: 'productos_categoria_id_fkey'
            columns: ['categoria_id']
            referencedRelation: 'categorias_productos'
            referencedColumns: ['id']
          }
        ]
      }
      historial_precios: {
        Row: { id: string; producto_id: string; precio: number; fecha: Timestamp }
        Insert: Partial<Database['public']['Tables']['historial_precios']['Row']> & {
          producto_id: string
          precio: number
        }
        Update: Partial<Database['public']['Tables']['historial_precios']['Row']>
        Relationships: [
          {
            foreignKeyName: 'historial_precios_producto_id_fkey'
            columns: ['producto_id']
            referencedRelation: 'productos'
            referencedColumns: ['id']
          }
        ]
      }
      condiciones_iva: {
        Row: { id: string; nombre: string; orden: number; archived_at: Timestamp | null; created_at: Timestamp; updated_at: Timestamp }
        Insert: Partial<Database['public']['Tables']['condiciones_iva']['Row']> & { nombre: string }
        Update: Partial<Database['public']['Tables']['condiciones_iva']['Row']>
        Relationships: []
      }
      categorias_productos: {
        Row: {
          id: string
          nombre: string
          archived_at: Timestamp | null
          created_at: Timestamp
          updated_at: Timestamp
        }
        Insert: Partial<Database['public']['Tables']['categorias_productos']['Row']> & { nombre: string }
        Update: Partial<Database['public']['Tables']['categorias_productos']['Row']>
        Relationships: []
      }
      estados_cheque: {
        Row: { id: string; nombre: string; orden: number }
        Insert: Partial<Database['public']['Tables']['estados_cheque']['Row']> & { nombre: string }
        Update: Partial<Database['public']['Tables']['estados_cheque']['Row']>
        Relationships: []
      }
      modalidades_pago_empleado: {
        Row: { id: string; nombre: string; archived_at: Timestamp | null; created_at: Timestamp; updated_at: Timestamp }
        Insert: Partial<Database['public']['Tables']['modalidades_pago_empleado']['Row']> & { nombre: string }
        Update: Partial<Database['public']['Tables']['modalidades_pago_empleado']['Row']>
        Relationships: []
      }
      empleados: {
        Row: {
          id: string
          nombre_apellido: string
          cargo: string | null
          modalidad_pago_id: string | null
          valor: number | null
          frecuencia_pago: 'semanal' | 'quincenal' | 'mensual' | 'por_hora' | 'por_jornada' | 'otro' | null
          archived_at: Timestamp | null
          anulado_por: string | null
          motivo_anulacion: string | null
          created_at: Timestamp
          updated_at: Timestamp
        }
        Insert: Partial<Database['public']['Tables']['empleados']['Row']> & { nombre_apellido: string }
        Update: Partial<Database['public']['Tables']['empleados']['Row']>
        Relationships: [
          {
            foreignKeyName: 'empleados_modalidad_pago_id_fkey'
            columns: ['modalidad_pago_id']
            referencedRelation: 'modalidades_pago_empleado'
            referencedColumns: ['id']
          }
        ]
      }
      documentos_empleados: {
        Row: {
          id: string
          empleado_id: string
          tipo_documento: 'dni' | 'contrato' | 'apto_medico' | 'cv' | 'certificado' | 'otro'
          descripcion_otro: string | null
          comprobante_path: string
          archived_at: Timestamp | null
          anulado_por: string | null
          motivo_anulacion: string | null
          created_at: Timestamp
        }
        Insert: Partial<Database['public']['Tables']['documentos_empleados']['Row']> & {
          empleado_id: string
          tipo_documento: 'dni' | 'contrato' | 'apto_medico' | 'cv' | 'certificado' | 'otro'
          comprobante_path: string
        }
        Update: Partial<Database['public']['Tables']['documentos_empleados']['Row']>
        Relationships: [
          {
            foreignKeyName: 'documentos_empleados_empleado_id_fkey'
            columns: ['empleado_id']
            referencedRelation: 'empleados'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'documentos_empleados_anulado_por_fkey'
            columns: ['anulado_por']
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          }
        ]
      }
      notas: {
        Row: {
          id: string
          titulo: string
          descripcion: string | null
          fecha: string | null
          recordatorio: string | null
          realizada: boolean
          archived_at: Timestamp | null
          created_at: Timestamp
          updated_at: Timestamp
        }
        Insert: Partial<Database['public']['Tables']['notas']['Row']> & { titulo: string }
        Update: Partial<Database['public']['Tables']['notas']['Row']>
        Relationships: []
      }
      pagos_empleados: {
        Row: {
          id: string
          numero_interno: number
          empleado_id: string
          tipo: 'pago' | 'adelanto'
          monto: number
          fecha: string
          medio_pago_id: string | null
          concepto: string
          numero_comprobante: string | null
          descuento: number | null
          motivo_descuento: string | null
          comprobante_path: string | null
          archived_at: Timestamp | null
          anulado_por: string | null
          motivo_anulacion: string | null
          created_at: Timestamp
          updated_at: Timestamp
        }
        Insert: Partial<Database['public']['Tables']['pagos_empleados']['Row']> & {
          empleado_id: string
          tipo: 'pago' | 'adelanto'
          monto: number
          concepto: string
        }
        Update: Partial<Database['public']['Tables']['pagos_empleados']['Row']>
        Relationships: [
          {
            foreignKeyName: 'pagos_empleados_empleado_id_fkey'
            columns: ['empleado_id']
            referencedRelation: 'empleados'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pagos_empleados_medio_pago_id_fkey'
            columns: ['medio_pago_id']
            referencedRelation: 'medios_pago'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pagos_empleados_anulado_por_fkey'
            columns: ['anulado_por']
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          }
        ]
      }
      obligaciones_contador: {
        Row: {
          id: string
          tipo: 'impuesto' | 'honorario' | 'otro'
          concepto: string
          monto: number | null
          fecha_vencimiento: string
          fecha_pago: string | null
          comprobante_path: string | null
          nota: string | null
          archived_at: Timestamp | null
          anulado_por: string | null
          motivo_anulacion: string | null
          created_at: Timestamp
          updated_at: Timestamp
        }
        Insert: Partial<Database['public']['Tables']['obligaciones_contador']['Row']> & {
          tipo: 'impuesto' | 'honorario' | 'otro'
          concepto: string
          fecha_vencimiento: string
        }
        Update: Partial<Database['public']['Tables']['obligaciones_contador']['Row']>
        Relationships: [
          {
            foreignKeyName: 'obligaciones_contador_anulado_por_fkey'
            columns: ['anulado_por']
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          }
        ]
      }
      documentos_contador: {
        Row: {
          id: string
          tipo_documento: 'contrato_servicios' | 'poder' | 'constancia_inscripcion' | 'otro'
          descripcion_otro: string | null
          comprobante_path: string
          archived_at: Timestamp | null
          anulado_por: string | null
          motivo_anulacion: string | null
          created_at: Timestamp
        }
        Insert: Partial<Database['public']['Tables']['documentos_contador']['Row']> & {
          tipo_documento: 'contrato_servicios' | 'poder' | 'constancia_inscripcion' | 'otro'
          comprobante_path: string
        }
        Update: Partial<Database['public']['Tables']['documentos_contador']['Row']>
        Relationships: [
          {
            foreignKeyName: 'documentos_contador_anulado_por_fkey'
            columns: ['anulado_por']
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          }
        ]
      }
      configuracion: {
        Row: { clave: string; valor: unknown; updated_at: Timestamp }
        Insert: { clave: string; valor: unknown }
        Update: Partial<Database['public']['Tables']['configuracion']['Row']>
        Relationships: []
      }
      audit_log: {
        Row: {
          id: string
          tabla: string
          registro_id: string
          usuario_id: string | null
          accion: 'insert' | 'update' | 'archive'
          datos_anteriores: unknown
          datos_nuevos: unknown
          fecha: Timestamp
        }
        Insert: never // se escribe solo desde triggers, nunca desde la app
        Update: never
        Relationships: [
          {
            foreignKeyName: 'audit_log_usuario_id_fkey'
            columns: ['usuario_id']
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          }
        ]
      }
      medios_pago: {
        Row: { id: string; nombre: string; orden: number; archived_at: Timestamp | null; created_at: Timestamp; updated_at: Timestamp }
        Insert: Partial<Database['public']['Tables']['medios_pago']['Row']> & { nombre: string }
        Update: Partial<Database['public']['Tables']['medios_pago']['Row']>
        Relationships: []
      }
      movimientos: {
        Row: {
          id: string
          numero_interno: number
          tipo: 'cobro' | 'pago'
          cliente_id: string | null
          proveedor_id: string | null
          monto: number
          fecha: string
          medio_pago_id: string
          cheque_id: string | null
          comprobante_path: string | null
          nota: string | null
          archived_at: Timestamp | null
          anulado_por: string | null
          motivo_anulacion: string | null
          created_at: Timestamp
          updated_at: Timestamp
        }
        Insert: Partial<Database['public']['Tables']['movimientos']['Row']> & {
          tipo: 'cobro' | 'pago'
          monto: number
          medio_pago_id: string
        }
        Update: Partial<Database['public']['Tables']['movimientos']['Row']>
        Relationships: [
          {
            foreignKeyName: 'movimientos_cliente_id_fkey'
            columns: ['cliente_id']
            referencedRelation: 'clientes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'movimientos_proveedor_id_fkey'
            columns: ['proveedor_id']
            referencedRelation: 'proveedores'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'movimientos_medio_pago_id_fkey'
            columns: ['medio_pago_id']
            referencedRelation: 'medios_pago'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'movimientos_anulado_por_fkey'
            columns: ['anulado_por']
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          }
        ]
      }
      compras: {
        Row: {
          id: string
          numero_interno: number
          proveedor_id: string
          origen: 'mercaderia' | 'factura' | 'otro'
          descripcion: string
          numero_comprobante: string | null
          monto: number
          fecha: string
          comprobante_path: string | null
          archived_at: Timestamp | null
          anulado_por: string | null
          motivo_anulacion: string | null
          created_at: Timestamp
          updated_at: Timestamp
        }
        Insert: Partial<Database['public']['Tables']['compras']['Row']> & {
          proveedor_id: string
          origen: 'mercaderia' | 'factura' | 'otro'
          descripcion: string
          monto: number
        }
        Update: Partial<Database['public']['Tables']['compras']['Row']>
        Relationships: [
          {
            foreignKeyName: 'compras_proveedor_id_fkey'
            columns: ['proveedor_id']
            referencedRelation: 'proveedores'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'compras_anulado_por_fkey'
            columns: ['anulado_por']
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          }
        ]
      }
      facturas: {
        Row: {
          id: string
          numero_interno: number
          numero_externo: string | null
          estado: 'pendiente_emitir' | 'emitida'
          cliente_id: string
          fecha: string
          total: number
          nota: string | null
          comprobante_path: string | null
          movimiento_id: string | null
          archived_at: Timestamp | null
          anulado_por: string | null
          motivo_anulacion: string | null
          created_at: Timestamp
          updated_at: Timestamp
        }
        Insert: Partial<Database['public']['Tables']['facturas']['Row']> & {
          cliente_id: string
          total: number
        }
        Update: Partial<Database['public']['Tables']['facturas']['Row']>
        Relationships: [
          {
            foreignKeyName: 'facturas_cliente_id_fkey'
            columns: ['cliente_id']
            referencedRelation: 'clientes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'facturas_anulado_por_fkey'
            columns: ['anulado_por']
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'facturas_movimiento_id_fkey'
            columns: ['movimiento_id']
            referencedRelation: 'movimientos'
            referencedColumns: ['id']
          }
        ]
      }
      factura_items: {
        Row: {
          id: string
          factura_id: string
          producto_id: string | null
          descripcion: string
          cantidad: number
          precio_unitario: number
          iva: 'exento' | '10.5' | '21' | '27'
          subtotal: number
          created_at: Timestamp
        }
        Insert: Partial<Database['public']['Tables']['factura_items']['Row']> & {
          factura_id: string
          descripcion: string
          cantidad: number
          precio_unitario: number
          iva: 'exento' | '10.5' | '21' | '27'
          subtotal: number
        }
        Update: Partial<Database['public']['Tables']['factura_items']['Row']>
        Relationships: [
          {
            foreignKeyName: 'factura_items_factura_id_fkey'
            columns: ['factura_id']
            referencedRelation: 'facturas'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'factura_items_producto_id_fkey'
            columns: ['producto_id']
            referencedRelation: 'productos'
            referencedColumns: ['id']
          }
        ]
      }
      deudas_clientes: {
        Row: {
          id: string
          numero_interno: number
          cliente_id: string
          origen: 'cuenta_mes' | 'venta' | 'factura' | 'otro'
          factura_id: string | null
          descripcion: string
          numero_comprobante: string | null
          monto: number
          fecha: string
          comprobante_path: string | null
          archived_at: Timestamp | null
          anulado_por: string | null
          motivo_anulacion: string | null
          created_at: Timestamp
          updated_at: Timestamp
        }
        Insert: Partial<Database['public']['Tables']['deudas_clientes']['Row']> & {
          cliente_id: string
          origen: 'cuenta_mes' | 'venta' | 'factura' | 'otro'
          descripcion: string
          monto: number
        }
        Update: Partial<Database['public']['Tables']['deudas_clientes']['Row']>
        Relationships: [
          {
            foreignKeyName: 'deudas_clientes_cliente_id_fkey'
            columns: ['cliente_id']
            referencedRelation: 'clientes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'deudas_clientes_anulado_por_fkey'
            columns: ['anulado_por']
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          }
        ]
      }
      ajustes_cuenta: {
        Row: {
          id: string
          numero_interno: number
          cliente_id: string | null
          proveedor_id: string | null
          monto: number
          motivo: string
          fecha: string
          archived_at: Timestamp | null
          anulado_por: string | null
          motivo_anulacion: string | null
          created_at: Timestamp
          updated_at: Timestamp
        }
        Insert: Partial<Database['public']['Tables']['ajustes_cuenta']['Row']> & {
          monto: number
          motivo: string
        }
        Update: Partial<Database['public']['Tables']['ajustes_cuenta']['Row']>
        Relationships: [
          {
            foreignKeyName: 'ajustes_cuenta_cliente_id_fkey'
            columns: ['cliente_id']
            referencedRelation: 'clientes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ajustes_cuenta_proveedor_id_fkey'
            columns: ['proveedor_id']
            referencedRelation: 'proveedores'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ajustes_cuenta_anulado_por_fkey'
            columns: ['anulado_por']
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          }
        ]
      }
      importaciones: {
        Row: {
          id: string
          usuario_id: string | null
          cantidad_procesados: number
          cantidad_creados: number
          cantidad_actualizados: number
          cantidad_reactivados: number
          cantidad_errores: number
          created_at: Timestamp
        }
        Insert: Partial<Database['public']['Tables']['importaciones']['Row']> & {
          cantidad_procesados: number
          cantidad_creados: number
          cantidad_actualizados: number
          cantidad_reactivados: number
          cantidad_errores: number
        }
        Update: Partial<Database['public']['Tables']['importaciones']['Row']>
        Relationships: [
          {
            foreignKeyName: 'importaciones_usuario_id_fkey'
            columns: ['usuario_id']
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      tiene_permiso: {
        Args: { p_modulo: string; p_accion: string }
        Returns: boolean
      }
      saldo_proveedor: {
        Args: { p_proveedor_id: string }
        Returns: number
      }
      saldo_cliente: {
        Args: { p_cliente_id: string }
        Returns: number
      }
      saldos_clientes: {
        Args: Record<string, never>
        Returns: { cliente_id: string; saldo: number }[]
      }
      saldos_proveedores: {
        Args: Record<string, never>
        Returns: { proveedor_id: string; saldo: number }[]
      }
      importar_productos: {
        Args: { p_filas: unknown }
        Returns: { creados: number; actualizados: number; reactivados: number }[]
      }
    }
    Enums: Record<string, never>
  }
}
