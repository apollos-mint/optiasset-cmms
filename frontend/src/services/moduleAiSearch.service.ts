export interface ModuleSearchResult {
  id: string;
  name: string;
  moduleKey: string;
  matchType: 'direct' | 'semantic';
  matchedKeyword?: string;
  explanation?: string;
  score: number;
}

interface ModuleDefinition {
  id: string;
  name: string;
  moduleKey: string;
  semanticKeywords: {
    keyword: string;
    weight: number;
    explanation: string;
  }[];
}

const MODULE_SEMANTIC_KNOWLEDGE: ModuleDefinition[] = [
  {
    id: 'inicio',
    name: 'Inicio',
    moduleKey: 'inicio',
    semanticKeywords: [
      { keyword: 'inicio', weight: 1.0, explanation: 'Módulo Principal' },
      { keyword: 'home', weight: 1.0, explanation: 'Página de Inicio' },
      { keyword: 'mesa', weight: 0.95, explanation: 'Mesa de Proyectos' },
      { keyword: 'proyectos', weight: 0.95, explanation: 'Mesa de Proyectos y Tareas' },
      { keyword: 'ticket', weight: 0.95, explanation: 'Gestión de Tickets y Casos' },
      { keyword: 'tickets', weight: 0.95, explanation: 'Gestión de Tickets y Casos' },
      { keyword: 'solicitud', weight: 0.9, explanation: 'Solicitudes Interdepartamentales' },
      { keyword: 'solicitudes', weight: 0.9, explanation: 'Solicitudes Interdepartamentales' },
      { keyword: 'intercomunicacion', weight: 0.9, explanation: 'Comunicación entre Departamentos' },
      { keyword: 'urgencia', weight: 0.85, explanation: 'Prioridades y Urgencias' },
      { keyword: 'prioridad', weight: 0.85, explanation: 'Niveles de Prioridad' },
      { keyword: 'rendimiento', weight: 0.8, explanation: 'Evaluación y Desempeño' },
      { keyword: 'dashboard', weight: 0.8, explanation: 'Panel de Control General' },
      { keyword: 'resumen', weight: 0.75, explanation: 'Resumen Ejecutivo' }
    ]
  },
  {
    id: 'operaciones',
    name: 'Operaciones (Mantenimiento)',
    moduleKey: 'operaciones',
    semanticKeywords: [
      { keyword: 'operaciones', weight: 1.0, explanation: 'Mantenimiento y Taller' },
      { keyword: 'mantenimiento', weight: 1.0, explanation: 'Mantenimiento Preventivo y Correctivo' },
      { keyword: 'reparacion', weight: 0.98, explanation: 'Reparaciones y Trabajos Mecánicos' },
      { keyword: 'reparaciones', weight: 0.98, explanation: 'Reparaciones y Trabajos Mecánicos' },
      { keyword: 'reparar', weight: 0.95, explanation: 'Reparación de Equipos' },
      { keyword: 'taller', weight: 0.95, explanation: 'Taller Mecánico y Servicios' },
      { keyword: 'mecanica', weight: 0.95, explanation: 'Área Mecánica' },
      { keyword: 'mecanico', weight: 0.95, explanation: 'Asignación a Mecánicos' },
      { keyword: 'falla', weight: 0.92, explanation: 'Diagnóstico de Fallas y Averías' },
      { keyword: 'fallas', weight: 0.92, explanation: 'Diagnóstico de Fallas y Averías' },
      { keyword: 'averia', weight: 0.92, explanation: 'Reporte de Averías' },
      { keyword: 'averias', weight: 0.92, explanation: 'Reporte de Averías' },
      { keyword: 'flota', weight: 0.9, explanation: 'Inspección de Flota Automotor' },
      { keyword: 'camion', weight: 0.9, explanation: 'Mantenimiento de Camiones y Chutos' },
      { keyword: 'camiones', weight: 0.9, explanation: 'Mantenimiento de Camiones y Chutos' },
      { keyword: 'vehiculo', weight: 0.9, explanation: 'Inspección de Vehículos' },
      { keyword: 'vehiculos', weight: 0.9, explanation: 'Inspección de Vehículos' },
      { keyword: 'checklist', weight: 0.9, explanation: 'Listas de Chequeo y Vueltas de Inspección' },
      { keyword: 'inspeccion', weight: 0.9, explanation: 'Inspección Física de Activos' },
      { keyword: 'inspecciones', weight: 0.9, explanation: 'Inspección Física de Activos' },
      { keyword: 'orden', weight: 0.88, explanation: 'Órdenes de Trabajo de Mantenimiento' },
      { keyword: 'ordenes', weight: 0.88, explanation: 'Órdenes de Trabajo de Mantenimiento' },
      { keyword: 'ot', weight: 0.88, explanation: 'Órdenes de Trabajo (OT)' },
      { keyword: 'aceite', weight: 0.85, explanation: 'Cambio de Aceite y Filtros' },
      { keyword: 'frenos', weight: 0.85, explanation: 'Sistema de Frenos' },
      { keyword: 'motor', weight: 0.85, explanation: 'Reparación de Motores' },
      { keyword: 'transmision', weight: 0.85, explanation: 'Transmisión y Cajas' },
      { keyword: 'cauchos', weight: 0.85, explanation: 'Inspección de Neumáticos' },
      { keyword: 'neumaticos', weight: 0.85, explanation: 'Inspección de Neumáticos' },
      { keyword: 'bateria', weight: 0.85, explanation: 'Sistema Eléctrico y Baterías' },
      { keyword: 'profit', weight: 0.82, explanation: 'Diagnósticos Enterprise ERP' },
      { keyword: 'kilometraje', weight: 0.82, explanation: 'Lectura de Odómetros' },
      { keyword: 'odometro', weight: 0.82, explanation: 'Lectura de Odómetros' }
    ]
  },
  {
    id: 'procura',
    name: 'Procura e Importaciones',
    moduleKey: 'procura',
    semanticKeywords: [
      { keyword: 'procura', weight: 1.0, explanation: 'Procura y Compras' },
      { keyword: 'compra', weight: 0.98, explanation: 'Gestión de Compras y Cotizaciones' },
      { keyword: 'compras', weight: 0.98, explanation: 'Gestión de Compras y Cotizaciones' },
      { keyword: 'importacion', weight: 0.98, explanation: 'Importaciones y Logística Internacional' },
      { keyword: 'importaciones', weight: 0.98, explanation: 'Importaciones y Logística Internacional' },
      { keyword: 'importar', weight: 0.95, explanation: 'Importación de Mercancía' },
      { keyword: 'proveedor', weight: 0.95, explanation: 'Evaluación de Proveedores' },
      { keyword: 'proveedores', weight: 0.95, explanation: 'Evaluación de Proveedores' },
      { keyword: 'adquisicion', weight: 0.9, explanation: 'Adquisición de Insumos y Repuestos' },
      { keyword: 'adquisiciones', weight: 0.9, explanation: 'Adquisición de Insumos y Repuestos' },
      { keyword: 'proforma', weight: 0.95, explanation: 'Análisis de Facturas Proforma' },
      { keyword: 'proformas', weight: 0.95, explanation: 'Análisis de Facturas Proforma' },
      { keyword: 'cotizacion', weight: 0.92, explanation: 'Comparativa de Cotizaciones' },
      { keyword: 'cotizaciones', weight: 0.92, explanation: 'Comparativa de Cotizaciones' },
      { keyword: 'aduana', weight: 0.9, explanation: 'Trámites Aduanales y Aranceles' },
      { keyword: 'aduanas', weight: 0.9, explanation: 'Trámites Aduanales y Aranceles' },
      { keyword: 'arancel', weight: 0.9, explanation: 'Aranceles e Impuestos de Importación' },
      { keyword: 'aranceles', weight: 0.9, explanation: 'Aranceles e Impuestos de Importación' },
      { keyword: 'china', weight: 0.88, explanation: 'Importaciones desde China y Asia' },
      { keyword: 'panama', weight: 0.88, explanation: 'Importaciones desde Panamá' },
      { keyword: 'flete', weight: 0.85, explanation: 'Fletes Marítimos y Aéreos' },
      { keyword: 'maritimo', weight: 0.85, explanation: 'Fletes Marítimos' },
      { keyword: 'aereo', weight: 0.85, explanation: 'Fletes Aéreos' },
      { keyword: 'dolares', weight: 0.85, explanation: 'Costos en Divisas' },
      { keyword: 'divisas', weight: 0.85, explanation: 'Costos en Divisas' },
      { keyword: 'sello', weight: 0.9, explanation: 'Sello CEO de Aprobación de Compra' },
      { keyword: 'sello ceo', weight: 0.95, explanation: 'Sello CEO de Aprobación de Compra' },
      { keyword: 'expediente', weight: 0.85, explanation: 'Expedientes de Compra' },
      { keyword: 'expedientes', weight: 0.85, explanation: 'Expedientes de Compra' }
    ]
  },
  {
    id: 'catalogos',
    name: 'Catálogos Maestros',
    moduleKey: 'catalogos',
    semanticKeywords: [
      { keyword: 'catalogo', weight: 1.0, explanation: 'Catálogos del Sistema' },
      { keyword: 'catalogos', weight: 1.0, explanation: 'Catálogos del Sistema' },
      { keyword: 'activos', weight: 0.98, explanation: 'Catálogo de Activos Fijos y Maquinaria' },
      { keyword: 'activo', weight: 0.98, explanation: 'Catálogo de Activos Fijos' },
      { keyword: 'repuesto', weight: 0.98, explanation: 'Catálogo de Repuestos y Partes' },
      { keyword: 'repuestos', weight: 0.98, explanation: 'Catálogo de Repuestos y Partes' },
      { keyword: 'piezas', weight: 0.92, explanation: 'Inventario de Repuestos y Piezas' },
      { keyword: 'partes', weight: 0.92, explanation: 'Partes de Vehículos' },
      { keyword: 'maquinaria', weight: 0.9, explanation: 'Maquinaria Pesada y Equipos' },
      { keyword: 'equipos', weight: 0.9, explanation: 'Equipos y Unidades' },
      { keyword: 'batea', weight: 0.9, explanation: 'Bateas y Remolques' },
      { keyword: 'bateas', weight: 0.9, explanation: 'Bateas y Remolques' },
      { keyword: 'chuto', weight: 0.9, explanation: 'Chutos y Tractocamiones' },
      { keyword: 'chutos', weight: 0.9, explanation: 'Chutos y Tractocamiones' },
      { keyword: 'remolque', weight: 0.88, explanation: 'Remolques y Plataformas' },
      { keyword: 'inventario', weight: 0.85, explanation: 'Registro y Clasificación de Bienes' },
      { keyword: 'serial', weight: 0.85, explanation: 'Seriales de Motor y Chasis' },
      { keyword: 'vin', weight: 0.85, explanation: 'Número VIN / Chasis' },
      { keyword: 'marca', weight: 0.8, explanation: 'Marcas y Modelos' },
      { keyword: 'modelo', weight: 0.8, explanation: 'Marcas y Modelos' }
    ]
  },
  {
    id: 'almacen',
    name: 'Despeje de Almacén',
    moduleKey: 'almacen',
    semanticKeywords: [
      { keyword: 'almacen', weight: 1.0, explanation: 'Almacén y Galpones' },
      { keyword: 'almacenes', weight: 1.0, explanation: 'Almacén y Galpones' },
      { keyword: 'despeje', weight: 1.0, explanation: 'Campaña de Despeje y Limpieza' },
      { keyword: 'chatarra', weight: 0.98, explanation: 'Gestión y Venta de Chatarra' },
      { keyword: 'chatarrizacion', weight: 0.98, explanation: 'Proceso de Chatarrización' },
      { keyword: 'obsoleto', weight: 0.95, explanation: 'Bienes y Partes Obsoletas' },
      { keyword: 'obsoletos', weight: 0.95, explanation: 'Bienes y Partes Obsoletas' },
      { keyword: 'baja', weight: 0.92, explanation: 'Desincorporación y Baja de Activos' },
      { keyword: 'desincorporacion', weight: 0.92, explanation: 'Desincorporación de Bienes' },
      { keyword: 'galpon', weight: 0.9, explanation: 'Espacio Físico de Galpones' },
      { keyword: 'galpones', weight: 0.9, explanation: 'Espacio Físico de Galpones' },
      { keyword: 'limpieza', weight: 0.88, explanation: 'Orden y Limpieza de Almacén' },
      { keyword: 'sobrante', weight: 0.85, explanation: 'Material Sobrante y Merma' },
      { keyword: 'sobrantes', weight: 0.85, explanation: 'Material Sobrante y Merma' },
      { keyword: 'reciclaje', weight: 0.85, explanation: 'Reciclaje de Metales' },
      { keyword: 'deposito', weight: 0.8, explanation: 'Depósitos y Patios' }
    ]
  },
  {
    id: 'reportes',
    name: 'Filtros y Reportes',
    moduleKey: 'reportes',
    semanticKeywords: [
      { keyword: 'reporte', weight: 1.0, explanation: 'Reportes del Sistema' },
      { keyword: 'reportes', weight: 1.0, explanation: 'Generación de Reportes' },
      { keyword: 'filtro', weight: 0.98, explanation: 'Filtros de Búsqueda Avanzada' },
      { keyword: 'filtros', weight: 0.98, explanation: 'Filtros de Búsqueda Avanzada' },
      { keyword: 'pdf', weight: 0.98, explanation: 'Exportación a Formato PDF' },
      { keyword: 'imprimir', weight: 0.95, explanation: 'Impresión de Documentos y Actas' },
      { keyword: 'exportar', weight: 0.95, explanation: 'Exportación de Datos' },
      { keyword: 'excel', weight: 0.9, explanation: 'Exportación de Tablas' },
      { keyword: 'estadistica', weight: 0.9, explanation: 'Estadísticas y Métricas' },
      { keyword: 'estadisticas', weight: 0.9, explanation: 'Estadísticas y Métricas' },
      { keyword: 'metricas', weight: 0.9, explanation: 'Indicadores y Métricas' },
      { keyword: 'kpi', weight: 0.9, explanation: 'Indicadores de Desempeño' },
      { keyword: 'kpis', weight: 0.9, explanation: 'Indicadores de Desempeño' },
      { keyword: 'graficos', weight: 0.85, explanation: 'Gráficos y Visualizaciones' },
      { keyword: 'consultas', weight: 0.85, explanation: 'Consultas Avanzadas' },
      { keyword: 'descargar', weight: 0.85, explanation: 'Descargas de Archivos' }
    ]
  },
  {
    id: 'usuarios',
    name: 'Control de Usuarios y Roles',
    moduleKey: 'usuarios',
    semanticKeywords: [
      { keyword: 'usuario', weight: 1.0, explanation: 'Gestión de Cuentas de Usuario' },
      { keyword: 'usuarios', weight: 1.0, explanation: 'Gestión de Cuentas de Usuario' },
      { keyword: 'roles', weight: 1.0, explanation: 'Roles y Privilegios' },
      { keyword: 'rol', weight: 1.0, explanation: 'Roles y Privilegios' },
      { keyword: 'permiso', weight: 0.98, explanation: 'Matriz de Permisos' },
      { keyword: 'permisos', weight: 0.98, explanation: 'Matriz de Permisos' },
      { keyword: 'departamento', weight: 0.98, explanation: 'Departamentos Corporativos' },
      { keyword: 'departamentos', weight: 0.98, explanation: 'Departamentos Corporativos' },
      { keyword: 'empleado', weight: 0.95, explanation: 'Directorio de Empleados' },
      { keyword: 'empleados', weight: 0.95, explanation: 'Directorio de Empleados' },
      { keyword: 'personal', weight: 0.95, explanation: 'Gestión del Personal' },
      { keyword: 'cargo', weight: 0.9, explanation: 'Cargos y Posiciones' },
      { keyword: 'cargos', weight: 0.9, explanation: 'Cargos y Posiciones' },
      { keyword: 'password', weight: 0.88, explanation: 'Cambio de Claves de Acceso' },
      { keyword: 'contraseña', weight: 0.88, explanation: 'Cambio de Claves de Acceso' },
      { keyword: 'acceso', weight: 0.85, explanation: 'Control de Acceso y Credenciales' },
      { keyword: 'feedback', weight: 0.85, explanation: 'Buzón de Observaciones de Stakeholders' },
      { keyword: 'feedbacks', weight: 0.85, explanation: 'Buzón de Observaciones de Stakeholders' }
    ]
  },
  {
    id: 'auditoria',
    name: 'Logs de Auditoría',
    moduleKey: 'auditoria',
    semanticKeywords: [
      { keyword: 'auditoria', weight: 1.0, explanation: 'Logs Inmutables de Auditoría' },
      { keyword: 'logs', weight: 1.0, explanation: 'Trazabilidad y Registros del Sistema' },
      { keyword: 'log', weight: 1.0, explanation: 'Trazabilidad y Registros del Sistema' },
      { keyword: 'seguridad', weight: 0.95, explanation: 'Seguridad y Registro de Actividad' },
      { keyword: 'trazabilidad', weight: 0.95, explanation: 'Trazabilidad de Acciones' },
      { keyword: 'quien', weight: 0.92, explanation: 'Identificación de Autor de Cambios' },
      { keyword: 'quien borro', weight: 0.95, explanation: 'Auditoría de Registros Eliminados' },
      { keyword: 'quien modifico', weight: 0.95, explanation: 'Auditoría de Modificaciones' },
      { keyword: 'quien creo', weight: 0.95, explanation: 'Auditoría de Creaciones' },
      { keyword: 'borrado', weight: 0.9, explanation: 'Historial de Registros Borrados' },
      { keyword: 'historial', weight: 0.9, explanation: 'Historial Cronológico de Cambios' },
      { keyword: 'inmutable', weight: 0.9, explanation: 'Registros Inalterables' },
      { keyword: 'ip', weight: 0.85, explanation: 'Direcciones IP y Sesiones' },
      { keyword: 'eventos', weight: 0.85, explanation: 'Eventos del Sistema' }
    ]
  },
  {
    id: 'feedback',
    name: 'Buzón de Feedback',
    moduleKey: 'feedback',
    semanticKeywords: [
      { keyword: 'feedback', weight: 1.0, explanation: 'Buzón de Sugerencias y Reportes' },
      { keyword: 'sugerencia', weight: 0.98, explanation: 'Sugerencias de Usuarios' },
      { keyword: 'sugerencias', weight: 0.98, explanation: 'Sugerencias de Usuarios' },
      { keyword: 'opinion', weight: 0.95, explanation: 'Opiniones y Retroalimentación' },
      { keyword: 'opiniones', weight: 0.95, explanation: 'Opiniones y Retroalimentación' },
      { keyword: 'queja', weight: 0.95, explanation: 'Quejas y Molestias Reportadas' },
      { keyword: 'quejas', weight: 0.95, explanation: 'Quejas y Molestias Reportadas' },
      { keyword: 'buzon', weight: 0.95, explanation: 'Buzón de Entrada de Stakeholders' },
      { keyword: 'aporte', weight: 0.9, explanation: 'Aportes y Mejoras' },
      { keyword: 'aportes', weight: 0.9, explanation: 'Aportes y Mejoras' },
      { keyword: 'problema', weight: 0.85, explanation: 'Reporte de Problemas u Obstáculos' },
      { keyword: 'critica', weight: 0.85, explanation: 'Críticas Constructivas' },
      { keyword: 'evaluacion', weight: 0.8, explanation: 'Evaluación del Sistema' },
      { keyword: 'stakeholder', weight: 0.8, explanation: 'Retroalimentación de Stakeholders' }
    ]
  }
];

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Motor de Búsqueda Semántica Asistida por IA para los módulos de la aplicación.
 * Evalúa coincidencias directas y analogías conceptuales (ej: "reparación" -> Operaciones).
 */
export function searchModulesWithAI(query: string, allowedModuleKeys?: string[]): ModuleSearchResult[] {
  const cleanQuery = normalizeText(query);
  if (!cleanQuery) return [];

  const results: ModuleSearchResult[] = [];

  for (const mod of MODULE_SEMANTIC_KNOWLEDGE) {
    if (allowedModuleKeys && !allowedModuleKeys.includes(mod.moduleKey)) {
      continue;
    }

    const cleanModName = normalizeText(mod.name);

    // 1. Coincidencia directa con el nombre del módulo
    if (cleanModName.includes(cleanQuery)) {
      results.push({
        id: mod.id,
        name: mod.name,
        moduleKey: mod.moduleKey,
        matchType: 'direct',
        explanation: `Nombre del módulo`,
        score: 1.0
      });
      continue;
    }

    // 2. Coincidencia semántica con conceptos operativos
    let bestKeywordMatch: { keyword: string; weight: number; explanation: string } | null = null;
    let highestScore = 0;

    for (const item of mod.semanticKeywords) {
      const cleanKeyword = normalizeText(item.keyword);

      if (cleanKeyword === cleanQuery) {
        if (item.weight > highestScore) {
          highestScore = item.weight;
          bestKeywordMatch = item;
        }
      } else if (cleanKeyword.includes(cleanQuery) || cleanQuery.includes(cleanKeyword)) {
        const partialWeight = item.weight * 0.85;
        if (partialWeight > highestScore) {
          highestScore = partialWeight;
          bestKeywordMatch = item;
        }
      }
    }

    if (bestKeywordMatch && highestScore > 0.4) {
      results.push({
        id: mod.id,
        name: mod.name,
        moduleKey: mod.moduleKey,
        matchType: 'semantic',
        matchedKeyword: bestKeywordMatch.keyword,
        explanation: `IA: Asociado a "${bestKeywordMatch.keyword}" (${bestKeywordMatch.explanation})`,
        score: highestScore
      });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}
