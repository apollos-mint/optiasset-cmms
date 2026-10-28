export interface Usuario {
  id: string;
  nombre: string;
  nombre_usuario: string;
  rol: string;
  activo: boolean;
  foto_perfil?: string | null;
  departamento?: string | null;
  departamento_id?: number | null;
  cargo?: string | null;
  cumpleanos?: string | null;
  permisos?: Record<string, boolean>;
  contrasena_plana?: string;
  fecha_creacion?: string;
}

export interface Departamento {
  id: number;
  nombre: string;
  descripcion?: string | null;
  permisos: Record<string, boolean>;
  creado_en?: string;
  total_usuarios?: number;
  usuarios?: Array<{
    id: string;
    nombre: string;
    nombre_usuario: string;
    rol: string;
    activo: boolean;
  }>;
}

export interface Activo {
  id: string;
  tipo_activo: 'Vehículo' | 'Maquinaria' | 'Edificio' | 'Stock Almacén';
  fecha_compra: string;
  datos_especificos: {
    placa?: string;
    numero_serie?: string;
    marca?: string;
    modelo?: string;
    anio?: number;
    color?: string;
    kilometraje_inicial?: number;
    horometro_inicial?: number;
    nombre_item?: string;
    ubicacion_fisica?: string;
    serial?: string;
    [key: string]: any;
  };
  destino_almacen?: 'Para Venta' | 'Para Reciclaje' | 'Para Mantenimiento' | 'Para Eliminación' | null;
  fecha_creacion?: string;
}

export interface CatalogoRepuesto {
  id: string | number;
  descripcion: string;
  unidad_medida: 'Unidades' | 'Litros' | 'Galones' | 'Kits' | string;
  precio_referencia: number;
  costo_compra?: number;
  stock_actual: number;
  proveedor?: string;
  activo: boolean;
}

export interface Checklist {
  id: string;
  activo_id: string;
  usuario_id: string;
  fecha: string;
  kilometraje_registro?: number;
  horometro_registro?: number;
  observaciones?: string;
  respuestas_detalle: {
    niveles?: {
      aceite_motor?: 'Full' | 'Medio' | 'Bajo';
      refrigerante?: 'Full' | 'Medio' | 'Bajo';
      limpia_parabrisas?: 'Full' | 'Medio' | 'Bajo';
      combustible_nivel?: 'Full' | 'Medio' | 'Bajo';
      combustible_cant?: string;
      agua_bateria?: 'Full' | 'Medio' | 'Bajo';
    };
    luces?: {
      freno?: 'Bueno' | 'Malo';
      bajas?: 'Bueno' | 'Malo';
      altas?: 'Bueno' | 'Malo';
      bombillos_quemados?: 'Bueno' | 'Malo';
      micas_rotas?: 'Bueno' | 'Malo';
      faros_rotos?: 'Bueno' | 'Malo';
      cruce?: {
        dd?: boolean;
        di?: boolean;
        td?: boolean;
        ti?: boolean;
      };
      explicacion_luces?: string;
    };
    fugas?: {
      combustible?: 'Si' | 'No';
      refrigerante?: 'Si' | 'No';
      aceite?: 'Si' | 'No';
      otro?: 'Si' | 'No';
      explicacion?: string;
    };
    ruedas?: {
      presion_aire?: 'Bueno' | 'Malo';
      condicion_rines?: 'Bueno' | 'Malo';
      condicion_tuercas?: 'Bueno' | 'Malo';
      puntas_ejes?: 'Bueno' | 'Malo';
      estado_llantas?: Record<string, 'A' | 'B' | 'C' | 'D'>;
    };
    generales?: {
      ruido_motor?: 'Si' | 'No';
      tornillos_suspension?: 'Si' | 'No';
      drenar_tanques?: 'Si' | 'No';
      quinta_rueda?: 'Si' | 'No';
    };
    seguridad?: {
      botiquin?: 'Si' | 'No';
      gato?: 'Si' | 'No';
      extintor?: 'Si' | 'No';
      llave_rueda?: 'Si' | 'No';
      lona?: 'Si' | 'No';
      triangulo?: 'Si' | 'No';
      reproductor?: 'Si' | 'No';
      mecate?: 'Si' | 'No';
    };
    funcionamiento?: {
      bateria?: 'Bueno' | 'Reg' | 'Malo';
      frenos?: 'Bueno' | 'Reg' | 'Malo';
      corneta?: 'Bueno' | 'Reg' | 'Malo';
      aire_acondicionado?: 'Bueno' | 'Reg' | 'Malo';
      limpia_parabrisas?: 'Bueno' | 'Reg' | 'Malo';
      pedales?: 'Bueno' | 'Reg' | 'Malo';
      retroceso?: 'Bueno' | 'Reg' | 'Malo';
      cambios?: 'Bueno' | 'Reg' | 'Malo';
    };
    lubricacion?: {
      caja_cambio?: 'Bueno' | 'Malo';
      motor?: 'Bueno' | 'Malo';
      diferencial?: 'Bueno' | 'Malo';
      direccion?: 'Bueno' | 'Malo';
      chasis?: 'Bueno' | 'Malo';
      suspension?: 'Bueno' | 'Malo';
    };
    ajustes?: {
      vidrios?: {
        f?: boolean;
        tr?: boolean;
        ld?: boolean;
        li?: boolean;
      };
      espejos?: {
        ld?: boolean;
        li?: boolean;
        int?: boolean;
      };
      asientos?: 'Bueno' | 'Malo';
    };
    medidores?: {
      presion_aire?: string;
      presion_aceite?: string;
      voltimetro?: string;
      temperatura?: string;
    };
    partes?: {
      motor?: string;
      enfriamiento?: string;
      escape?: string;
      combustible?: string;
      frenos?: string;
      electrico?: string;
      eje_delantero?: string;
      transmision?: string;
      eje_trasero?: string;
      aire?: string;
      otra1?: string;
      otra2?: string;
    };
    comentarios_generales?: string;
    multimedia_url?: string | null;
    multimedia_urls?: string[];
    firma_auditoria?: {
      usuario_id: string;
      nombre_usuario: string;
      fecha: string;
      completada: boolean;
    } | null;
  };
  // Extra fields populated by join queries
  tipo_activo?: string;
  placa?: string;
  inspector?: string;
  marca?: string;
  modelo?: string;
}

export interface InsumoOrden {
  id?: number;
  orden_id?: string;
  repuesto_id: number;
  cantidad_usada: number;
  costo_unitario_historico: number;
  // Join extensions
  descripcion?: string;
  unidad_medida?: string;
}

export interface OrdenServicio {
  id: string;
  activo_id: string;
  usuario_id: string;
  fecha_inicio: string;
  fecha_fin?: string;
  diagnostico: string;
  reparacion_ejecutada?: string;
  tasa_hora_taller: number;
  horas_taller: number;
  total_facturado: number;
  kilometraje_registro?: number;
  horometro_registro?: number;
  estado: 'Abierta' | 'En Proceso' | 'Completada' | 'Cancelada';
  firma_creador?: { nombre_usuario: string; fecha: string };
  firma_auditoria?: { nombre_usuario: string; fecha: string };
  // Join extensions
  tipo_activo?: string;
  placa?: string;
  marca?: string;
  modelo?: string;
  mecanico?: string;
  insumos?: InsumoOrden[];
}

export interface AuditLog {
  id: string;
  usuario_id: string | null;
  accion: string;
  tabla_afectada: string;
  registro_id: string;
  valores_anteriores?: any;
  valores_nuevos?: any;
  fecha_accion: string;
  nombre?: string;
  nombre_usuario?: string;
  rol?: string;
}

// ==========================================
// TIPOS DEL ÓRGANO DE PROJECT MANAGEMENT & TICKETS
// ==========================================
export interface Stakeholder {
  id: string;
  nombre: string;
  rol?: string;
}

export interface TicketComment {
  id: number;
  ticket_id: string;
  usuario_id: string;
  mensaje: string;
  fecha_creacion: string;
  autor_nombre?: string;
  autor_rol?: string;
}

export interface CorporateTicket {
  id: string;
  titulo: string;
  descripcion: string;
  departamento: string;
  prioridad: 'Baja' | 'Media' | 'Alta' | 'Critica';
  deadline: string;
  creador_id: string;
  asignado_a_id: string;
  asignados?: Array<{ id: string; nombre?: string; rol?: string }>;
  stakeholders: Stakeholder[];
  necesita_de?: string;
  estado: 'Pendiente' | 'En Proceso' | 'Completado' | 'Rechazado';
  primera_lectura_at?: string;
  completado_at?: string;
  minutos_para_abrir?: number;
  minutos_para_completar?: number;
  cumplio_deadline?: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
  creador_nombre?: string;
  creador_rol?: string;
  asignado_nombre?: string;
  asignado_rol?: string;
  total_comentarios?: number;
  comentarios?: TicketComment[];
}

export interface UserNotification {
  id: number;
  usuario_id: string;
  ticket_id?: string;
  remitente_id?: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  leido: boolean;
  fecha_creacion: string;
  fecha_lectura?: string;
  remitente_nombre?: string;
  remitente_rol?: string;
}

export interface EmployeePerformance {
  usuario_id: string;
  nombre: string;
  nombre_usuario: string;
  rol: string;
  total_asignados: number;
  completados: number;
  pendientes: number;
  a_tiempo: number;
  vencidos: number;
  avg_minutos_abrir: number | null;
  avg_minutos_completar: number | null;
  tasa_cumplimiento: number;
  warnings_count: number;
  incentivos_count: number;
  score_eficiencia: number;
  recomendacion: string;
  estado_semaforo: 'Optimo' | 'Observacion' | 'Critico';
}

export interface EmployeeWarning {
  id: number;
  empleado_id: string;
  emisor_id: string;
  ticket_id?: string;
  tipo: 'Warning Leve' | 'Warning Grave' | 'Queja Formal' | 'Incentivo / Mérito';
  motivo: string;
  acciones_requeridas?: string;
  fecha_creacion: string;
  empleado_nombre?: string;
  empleado_rol?: string;
  emisor_nombre?: string;
  ticket_titulo?: string;
}

// ==========================================
// MÓDULO DE PROCURA E IMPORTACIONES
// ==========================================
export interface ProcuraProductoItem {
  id: string;
  item_numero: number;
  descripcion: string;
  calidad: string; // ej: 'Glossy', 'High Glossy', 'Glorious', 'Mate', 'Pulido'
  paletas?: number;
  cajas_totales: number;
  mt2_totales: number;
  precio_mt2: number;
  monto_total_usd: number;
  mt2_caja?: number;
  kg_caja?: number;
  piezas_caja?: number;
  espesor_mm?: number;
  medida_formato?: string;
}

export interface ProcuraLineaCalidadResumen {
  calidad: string;
  precio_mt2: number;
  mt2_total: number;
  cajas_total: number;
  monto_total: number;
  items_count: number;
}

export interface ProcuraProveedorOferta {
  id: string;
  nombre_proveedor: string;
  pais_origen: string;
  calificacion_reputacion: number; // 1-5 estrellas
  cumple_certificaciones: boolean; // ej: ISO / CE
  precio_unitario: number;
  moneda: string; // 'USD' | 'EUR' | 'CNY'
  cantidad_ofertada: number;
  incoterm: 'FOB' | 'CIF' | 'EXW' | 'DDP' | 'CFR';
  proforma_numero?: string;
  fecha_proforma?: string;
  puerto_embarque?: string;
  puerto_destino?: string;
  fcl_contenedores?: string;
  total_paletas?: number;
  total_cajas?: number;
  total_mt2?: number;
  peso_neto_kg?: number;
  peso_bruto_kg?: number;
  fob_total_usd?: number;
  lead_time_dias: number; // Tiempo entrega en días
  condiciones_pago: string; // ej: '30% anticipo / 70% contra BL'
  garantia_meses: number;
  especificaciones_tecnicas: string;
  flete_estimado_total: number;
  aranceles_estimados_total: number;
  costo_aterrizado_unitario: number; // Landed cost por unidad
  puntos_fuertes: string;
  riesgos_advertencias: string;
  recomendado_por_compras: boolean;
  es_opcion_ganadora?: boolean;
  productos_detalle?: ProcuraProductoItem[];
  lineas_calidad?: ProcuraLineaCalidadResumen[];
}

export interface ProcuraTarea {
  id: string;
  titulo: string;
  responsable: 'Gerente de Compras' | 'CEO / Dirección' | 'Logística y Aduana' | 'Taller / Técnico';
  completada: boolean;
  fecha_limite?: string;
}

export interface ProcuraEvaluacion {
  id: string;
  codigo_expediente: string; // ej: "IMP-2026-001"
  titulo_producto: string;
  descripcion: string;
  categoria: 'Repuestos Críticos' | 'Maquinaria Pesada' | 'Herramientas Especiales' | 'Consumibles';
  prioridad: 'Baja' | 'Media' | 'Alta' | 'Urgente';
  presupuesto_estimado_usd: number;
  fecha_apertura: string;
  estado_decision: 'En Evaluación Técnica' | 'Listo para Revisión CEO' | 'Aprobado por Dirección' | 'Orden Emitida' | 'Descartado';
  proveedores: ProcuraProveedorOferta[];
  tareas_pendientes: ProcuraTarea[];
  resolucion_ceo?: {
    aprobado_por: string;
    fecha_aprobacion?: string;
    proveedor_aprobado_id?: string;
    comentario_directivo?: string;
  };
}

export interface StakeholderFeedback {
  id: number;
  usuario_id?: string | null;
  nombre_usuario?: string;
  nombre_completo?: string;
  handle_usuario?: string;
  foto_perfil?: string | null;
  rol_usuario?: string;
  departamento?: string | null;
  modulo_actual: string;
  url_path?: string | null;
  dispositivo?: string | null;
  problema_obstaculo: string;
  solucion_propuesta?: string | null;
  impacto: 'bloqueo' | 'molestia' | 'mejora';
  estado: 'pendiente' | 'en_analisis' | 'implementado' | 'descartado';
  notas_admin?: string | null;
  creado_en: string;
  actualizado_en?: string;
}



