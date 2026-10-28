/**
 * Servicio Ampliado de Sugerencias y Corrección Ortográfica / Gramatical en Español
 * Optimizado para formularios corporativos, tickets de soporte y feedbacks de stakeholders.
 */

// Diccionario base amplio de palabras en español (comunes + técnicas corporativas / UI / mantenimiento / procura)
const DICCIONARIO_BASE = new Set<string>([
  // Términos corporativos, operativos, técnicos y mecánicos
  'activo', 'activos', 'administración', 'administrador', 'aduana', 'aduanas', 'aceite', 'acelerador',
  'alarma', 'almacén', 'almacenes', 'alternador', 'amortiguador', 'amortiguadores', 'año', 'años',
  'aprobación', 'aprobado', 'aprobada', 'aprobados', 'arancel', 'aranceles', 'archivo', 'archivos',
  'arranque', 'artículo', 'artículos', 'asiento', 'asientos', 'auditoría', 'auditorías', 'auditor',
  'automático', 'automática', 'autorización', 'autorizado', 'avería', 'averías', 'ayuda',
  'balance', 'banco', 'bancos', 'batería', 'baterías', 'bloque', 'bloqueo', 'bloqueado', 'bloquear',
  'bobina', 'bobinas', 'bomba', 'bombas', 'bombillo', 'bombillos', 'botiquín', 'buje', 'bujes',
  'bujía', 'bujías', 'caja', 'cajas', 'calidad', 'calidades', 'cambio', 'cambios', 'camión', 'camiones',
  'camioneta', 'camionetas', 'cancelado', 'cancelada', 'cantidad', 'capacitación', 'carga', 'cargador',
  'cargo', 'cargos', 'carrocería', 'catálogo', 'catálogos', 'chasis', 'chofer', 'choferes',
  'cierre', 'cilindro', 'cilindros', 'clasificación', 'cliente', 'clientes', 'clutch', 'código', 'códigos',
  'combustible', 'comentario', 'comentarios', 'comisión', 'compactador', 'compañía', 'completado', 'completada',
  'compra', 'compras', 'comprobante', 'conductor', 'conductores', 'conformidad', 'conector', 'conectores',
  'congelante', 'consumible', 'consumibles', 'contenedor', 'contenedores', 'continuar', 'contraseña', 'contrato',
  'control', 'coordinación', 'coordinador', 'corona', 'correa', 'correas', 'correo', 'correos',
  'costo', 'costos', 'cotización', 'cotizaciones', 'creación', 'crítico', 'crítica', 'críticos', 'críticas',
  'cuenta', 'cuentas', 'cumplimiento', 'daño', 'daños', 'debe', 'declaración', 'defecto', 'defectos',
  'departamento', 'departamentos', 'descuento', 'desgaste', 'despacho', 'desperfecto', 'detalle', 'detalles',
  'diagnóstico', 'diagnósticos', 'diferencial', 'dimensión', 'dirección', 'director', 'directorio', 'directiva',
  'disco', 'discos', 'disponible', 'disponibilidad', 'documento', 'documentos', 'dólar', 'dólares',
  'ejecución', 'ejecutado', 'ejecutada', 'eléctrico', 'eléctrica', 'eléctricos', 'eléctricas',
  'embalaje', 'emergencia', 'emisión', 'empleado', 'empleados', 'empresa', 'empresas', 'engranaje',
  'entrega', 'entregado', 'equipo', 'equipos', 'error', 'errores', 'escape', 'escáner', 'especificación',
  'especificaciones', 'específico', 'específica', 'espejo', 'espejos', 'espera', 'estado', 'estados',
  'estándar', 'estatus', 'evaluación', 'evaluaciones', 'evidencia', 'evidencias', 'exceso', 'expediente', 'expedientes',
  'fabricante', 'factura', 'facturas', 'facturado', 'falla', 'fallas', 'faro', 'faros', 'fecha', 'fechas',
  'financiero', 'financiera', 'finanzas', 'firma', 'firmas', 'firmado', 'fiscal', 'flota', 'formato',
  'flete', 'fletes', 'freno', 'frenos', 'fuga', 'fugas', 'función', 'funciones', 'fusible', 'fusibles',
  'galón', 'galones', 'ganador', 'garantía', 'garantías', 'gasolina', 'gasto', 'gastos', 'gato', 'generador',
  'gerencia', 'gerente', 'gestión', 'grasa', 'grupo', 'grupos', 'guía', 'guías',
  'haber', 'había', 'hacer', 'hacia', 'hasta', 'herramienta', 'herramientas', 'hidráulico', 'hidráulica',
  'hoja', 'hora', 'horas', 'horómetro', 'horómetros',
  'id', 'impacto', 'importación', 'importaciones', 'impuesto', 'impuestos', 'informe', 'informes',
  'ingreso', 'ingresos', 'inicial', 'inspección', 'inspecciones', 'inspector', 'inspectores',
  'instalación', 'insumo', 'insumos', 'inventario', 'inventarios', 'inversión',
  'jefe', 'jornada', 'junta', 'justificación',
  'kilo', 'kilogramo', 'kilogramos', 'kilómetro', 'kilómetros', 'kilometraje', 'kit', 'kits',
  'laboral', 'lámina', 'latonería', 'lectura', 'licencia', 'líder', 'límite', 'línea', 'líneas',
  'limpieza', 'líquido', 'líquidos', 'lista', 'litro', 'litros', 'logística', 'lote', 'lotes', 'lubricante', 'lubricación',
  'manguera', 'mangueras', 'mantenimiento', 'manual', 'maquinaria', 'maquinarias', 'marca', 'marcas',
  'material', 'materiales', 'matriz', 'mecánico', 'mecánicos', 'medida', 'medidas', 'medidor', 'medidores',
  'memoria', 'mensaje', 'mensajes', 'mercancía', 'mercancías', 'métrica', 'métricas', 'minuto', 'minutos',
  'modelo', 'modelos', 'módulo', 'módulos', 'moneda', 'monto', 'montos', 'motor', 'motores',
  'movimiento', 'multimedia',
  'nacional', 'necesario', 'necesaria', 'neumático', 'neumáticos', 'nivel', 'niveles', 'nombre', 'nombres',
  'norma', 'normas', 'nota', 'notas', 'notificación', 'notificaciones', 'número', 'números',
  'observación', 'observaciones', 'oferta', 'ofertas', 'oficina', 'operación', 'operaciones',
  'operativo', 'operativa', 'operador', 'operadores', 'orden', 'órdenes', 'origen',
  'pago', 'pagos', 'paleta', 'paletas', 'panel', 'pantalla', 'pantallas', 'parabrisas', 'partida', 'pasador',
  'pastilla', 'pastillas', 'patio', 'pedido', 'pedidos', 'pendiente', 'pendientes', 'perfil', 'perfiles',
  'permiso', 'permisos', 'personal', 'peso', 'pieza', 'piezas', 'pintura', 'pistón', 'pistones',
  'placa', 'placas', 'planta', 'plazo', 'plazos', 'póliza', 'política', 'políticas', 'porcentaje',
  'precio', 'precios', 'presidencia', 'presidente', 'presión', 'presupuesto', 'presupuestos',
  'preventivo', 'prioridad', 'prioridades', 'problema', 'problemas', 'procedimiento', 'proceso', 'procesos',
  'procura', 'producto', 'productos', 'proforma', 'proformas', 'programa', 'proveedor', 'proveedores',
  'prueba', 'pruebas', 'puerto', 'puertos',
  'químico', 'químicos', 'quincena',
  'radiador', 'rango', 'razón', 'reactivo', 'recambio', 'recambios', 'recibo', 'recibos', 'reclamación',
  'recomendación', 'recomendaciones', 'reemplazo', 'refrigerante', 'registro', 'registros', 'regla', 'reglas',
  'remolque', 'rendimiento', 'reparación', 'reparaciones', 'reporte', 'reportes', 'repuesto', 'repuestos',
  'requerimiento', 'requerimientos', 'requisito', 'resolución', 'responsable', 'responsables',
  'resultado', 'resultados', 'resumen', 'retención', 'revisión', 'revisiones', 'riesgo', 'riesgos',
  'rodamiento', 'rodamientos', 'rol', 'roles', 'rotación', 'ruta', 'rutas',
  'saldo', 'salida', 'satisfacción', 'sección', 'secciones', 'seguridad', 'seguro', 'seguros',
  'sello', 'sellos', 'semana', 'semáforo', 'sensor', 'sensores', 'serie', 'servicio', 'servicios',
  'sistema', 'sistemas', 'solicitud', 'solicitudes', 'solución', 'soluciones', 'soporte', 'soportes',
  'stock', 'submódulo', 'submódulos', 'sucursal', 'suministro', 'suministros', 'supervisor', 'supervisores',
  'suspensión',
  'tabla', 'tablas', 'taller', 'talleres', 'tanque', 'tanques', 'tarifa', 'tarea', 'tareas', 'tasa', 'tasas',
  'técnico', 'técnica', 'técnicos', 'técnicas', 'tecnología', 'teléfono', 'temperatura', 'tiempo', 'tiempos',
  'tipo', 'tipos', 'título', 'títulos', 'total', 'totales', 'trabajo', 'trabajos', 'tránsito', 'transmisión',
  'transporte', 'traslado', 'trasero', 'trasera', 'trazabilidad', 'tubo', 'tubos', 'tuerca', 'tuercas',
  'unidad', 'unidades', 'urgente', 'urgencia', 'usuario', 'usuarios', 'utilidad',
  'valor', 'valores', 'válvula', 'válvulas', 'vehículo', 'vehículos', 'velocidad', 'vencimiento',
  'venta', 'ventas', 'verificación', 'verificado', 'viaje', 'viajes', 'vidrio', 'vidrios', 'vigencia',
  'voltaje', 'volumen',

  // Palabras frecuentes de Interfaz de Usuario (UI) y Feedback
  'botón', 'botones', 'cuadro', 'cuadros', 'menú', 'menús', 'desplegable', 'desplegables',
  'fila', 'filas', 'columna', 'columnas', 'flecha', 'flechas', 'clic', 'click',
  'buscar', 'búsqueda', 'búsquedas', 'buscador', 'filtrar', 'filtro', 'filtros',
  'descarga', 'descargar', 'descargado', 'imprimir', 'impresión', 'pdf', 'excel',
  'guardar', 'guardado', 'guardando', 'cancelar', 'editar', 'editando', 'eliminar', 'eliminando',
  'modificar', 'abrir', 'abierto', 'abriendo', 'cerrar', 'cerrado', 'cerrando',
  'mostrar', 'mostrando', 'ocultar', 'ocultando', 'tapar', 'tapando', 'tapa', 'tapan',
  'cubrir', 'cubriendo', 'sobreponer', 'sobrepone', 'chocar', 'choca', 'choque',
  'arriba', 'abajo', 'izquierda', 'derecha', 'centro', 'esquina', 'margen', 'márgenes',
  'móvil', 'móviles', 'escritorio', 'celular', 'celulares', 'laptop', 'laptops',
  'sesión', 'sesiones', 'inicio', 'iniciar', 'entrar', 'ingresar', 'clave', 'claves',
  'apellido', 'apellidos', 'texto', 'textos', 'campo', 'campos', 'formulario', 'formularios',
  'opción', 'opciones', 'selector', 'selectores', 'casilla', 'casillas', 'marcar', 'marcado',
  'desmarcar', 'activar', 'activado', 'desactivar', 'desactivado', 'habilitar', 'habilitado',
  'deshabilitar', 'deshabilitado', 'fricción', 'molestia', 'molestias', 'mejora', 'mejoras',
  'mejorar', 'rápido', 'rápida', 'rápidos', 'rápidas', 'lento', 'lenta', 'lentos', 'lentas',
  'pesado', 'liviano', 'funciona', 'funcionan', 'funcionó', 'funcionar', 'sirve', 'sirven',
  'sirvió', 'servir', 'intentar', 'intento', 'intentó', 'intentaba', 'intenté', 'intentando',
  'quise', 'quiso', 'quería', 'pude', 'pudo', 'podía', 'podría', 'sugiero', 'sugerencia',
  'sugerencias', 'proponer', 'propuesta', 'propuestas', 'versión', 'versiones', 'actualización',

  // Conectores, verbos comunes y pronombres en español
  'a', 'al', 'ante', 'bajo', 'cabe', 'con', 'contra', 'de', 'del', 'desde', 'durante', 'en', 'entre',
  'hacia', 'hasta', 'mediante', 'para', 'por', 'según', 'sin', 'so', 'sobre', 'tras', 'versus', 'vía',
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'lo',
  'yo', 'tú', 'él', 'ella', 'usted', 'nosotros', 'nosotras', 'vosotros', 'vosotras', 'ellos', 'ellas', 'ustedes',
  'este', 'esta', 'estos', 'estas', 'esto', 'ese', 'esa', 'esos', 'esas', 'eso', 'aquel', 'aquella', 'aquellos', 'aquellas', 'aquello',
  'mi', 'tu', 'su', 'mis', 'tus', 'sus', 'nuestro', 'nuestra', 'nuestros', 'nuestras',
  'que', 'qué', 'cual', 'cuál', 'cuales', 'cuáles', 'quien', 'quién', 'quienes', 'quiénes',
  'cuyo', 'cuya', 'cuyos', 'cuyas', 'donde', 'dónde', 'cuando', 'cuándo', 'como', 'cómo', 'cuanto', 'cuánto',
  'es', 'son', 'era', 'eran', 'fue', 'fueron', 'ser', 'será', 'serán', 'ha', 'han', 'hay', 'había', 'habían',
  'hubo', 'habrá', 'habrán', 'está', 'están', 'estaba', 'estaban', 'estuvo', 'estuvieron', 'estar', 'estará', 'estarán',
  'tiene', 'tienen', 'tenía', 'tenían', 'tuvo', 'tuvieron', 'tener', 'tendrá', 'tendrán',
  'hace', 'hacen', 'hacía', 'hacían', 'hizo', 'hicieron', 'hacer', 'hará', 'harán', 'haciendo', 'hecho',
  'puede', 'pueden', 'podía', 'podían', 'pudo', 'pudieron', 'poder', 'podrá', 'podrán',
  'dice', 'dicen', 'decía', 'decían', 'dijo', 'dijeron', 'decir', 'dirá', 'dirán',
  'va', 'van', 'iba', 'iban', 'ir', 'irá', 'irán', 'yendo',
  've', 'ven', 'veía', 'veían', 'vio', 'vieron', 'ver', 'verá', 'verán', 'viendo', 'visto',
  'da', 'dan', 'daba', 'daban', 'dio', 'dieron', 'dar', 'dará', 'darán',
  'sabe', 'saben', 'sabía', 'sabían', 'supo', 'supieron', 'saber', 'sabrá', 'sabrán',
  'quiere', 'quieren', 'querer', 'querrá', 'querrán',
  'llega', 'llegan', 'llegó', 'llegaron', 'llegar', 'pasar', 'pasó', 'deber',
  'poner', 'puso', 'pusieron', 'parece', 'parecer', 'quedar', 'quedó', 'creer', 'cree', 'hablar', 'llevar',
  'dejar', 'seguir', 'sigue', 'encontrar', 'encontró', 'llamar', 'llamó', 'venir', 'vino', 'pensar',
  'bien', 'mal', 'muy', 'más', 'menos', 'mucho', 'mucha', 'muchos', 'muchas', 'poco', 'poca', 'pocos', 'pocas',
  'tan', 'tanto', 'tanta', 'tantos', 'tantas', 'bastante', 'bastantes', 'demasiado', 'demasiada',
  'sí', 'no', 'nunca', 'jamás', 'siempre', 'también', 'tampoco', 'acá', 'aquí', 'allá', 'allí',
  'cerca', 'lejos', 'delante', 'detrás', 'dentro', 'fuera', 'antes', 'después', 'luego', 'pronto', 'tarde',
  'temprano', 'todavía', 'aún', 'ya', 'así', 'despacio', 'deprisa', 'apenas', 'claro', 'exacto', 'correcto',
  'pero', 'mas', 'sino', 'aunque', 'porque', 'pues', 'ya que', 'puesto que', 'si', 'o', 'u', 'y', 'e', 'ni'
]);

// Mapa de corrección directa de patrones comunes / faltas ortográficas frecuentes
const CORRECCIONES_DIRECTAS: Record<string, string> = {
  // Acentos faltantes en sustantivos y adjetivos
  'boton': 'botón',
  'botn': 'botón',
  'botnes': 'botones',
  'camion': 'camión',
  'reparacion': 'reparación',
  'vehiculo': 'vehículo',
  'vehiculos': 'vehículos',
  'mecanico': 'mecánico',
  'mecanicos': 'mecánicos',
  'diagnostico': 'diagnóstico',
  'diagnosticos': 'diagnósticos',
  'almacen': 'almacén',
  'almacenes': 'almacenes',
  'auditoria': 'auditoría',
  'auditorias': 'auditorías',
  'garantia': 'garantía',
  'garantias': 'garantías',
  'ordenes': 'órdenes',
  'inspeccion': 'inspección',
  'inspecciones': 'inspecciones',
  'kilometros': 'kilómetros',
  'kilometro': 'kilómetro',
  'horometro': 'horómetro',
  'horometros': 'horómetros',
  'cotizacion': 'cotización',
  'cotizaciones': 'cotizaciones',
  'bateria': 'batería',
  'baterias': 'baterías',
  'presion': 'presión',
  'electrico': 'eléctrico',
  'electrica': 'eléctrica',
  'electricos': 'eléctricos',
  'electricas': 'eléctricas',
  'liquido': 'líquido',
  'liquidos': 'líquidos',
  'transmision': 'transmisión',
  'suspension': 'suspensión',
  'direccion': 'dirección',
  'operacion': 'operación',
  'operaciones': 'operaciones',
  'piston': 'pistón',
  'pistones': 'pistones',
  'valvula': 'válvula',
  'valvulas': 'válvulas',
  'numero': 'número',
  'numeros': 'números',
  'codigo': 'código',
  'codigos': 'códigos',
  'modulo': 'módulo',
  'modulos': 'módulos',
  'submodulo': 'submódulo',
  'submodulos': 'submódulos',
  'critico': 'crítico',
  'critica': 'crítica',
  'criticos': 'críticos',
  'criticas': 'críticas',
  'catalogo': 'catálogo',
  'catalogos': 'catálogos',
  'articulo': 'artículo',
  'articulos': 'artículos',
  'observacion': 'observación',
  'observaciones': 'observaciones',
  'aprobacion': 'aprobación',
  'revision': 'revisión',
  'revisiones': 'revisiones',
  'autorizacion': 'autorización',
  'notificacion': 'notificación',
  'notificaciones': 'notificaciones',
  'evaluacion': 'evaluación',
  'evaluaciones': 'evaluaciones',
  'clasificacion': 'clasificación',
  'funcion': 'función',
  'funciones': 'funciones',
  'informacion': 'información',
  'atencion': 'atención',
  'resolucion': 'resolución',
  'emision': 'emisión',
  'recepcion': 'recepción',
  'mercancia': 'mercancía',
  'mercancias': 'mercancías',
  'guia': 'guía',
  'guias': 'guías',
  'dia': 'día',
  'dias': 'días',
  'ano': 'año',
  'anos': 'años',
  'facil': 'fácil',
  'faciles': 'fáciles',
  'dificil': 'difícil',
  'dificiles': 'difíciles',
  'tambien': 'también',
  'ademas': 'además',
  'despues': 'después',
  'aqui': 'aquí',
  'alla': 'allá',
  'estan': 'están',
  'menu': 'menú',
  'menus': 'menús',
  'titulo': 'título',
  'titulos': 'títulos',
  'pagina': 'página',
  'paginas': 'páginas',
  'linea': 'línea',
  'lineas': 'líneas',
  'limite': 'límite',
  'limites': 'límites',
  'politica': 'política',
  'politicas': 'políticas',
  'movil': 'móvil',
  'moviles': 'móviles',
  'sesion': 'sesión',
  'sesiones': 'sesiones',
  'seccion': 'sección',
  'secciones': 'secciones',
  'rapido': 'rápido',
  'rapida': 'rápida',
  'rapidos': 'rápidos',
  'rapidas': 'rápidas',
  'autenticacion': 'autenticación',
  'configuracion': 'configuración',
  'administracion': 'administración',
  'friccion': 'fricción',
  'solucion': 'solución',
  'soluciones': 'soluciones',
  'intento': 'intentó',
  'fallo': 'falló',

  // Faltas ortográficas fonéticas clásicas (s/c/z, b/v, h, ll/y)
  'finciona': 'funciona',
  'funsiona': 'funciona',
  'funsionando': 'funcionando',
  'funsiono': 'funcionó',
  'fuciono': 'funcionó',
  'haser': 'hacer',
  'aser': 'hacer',
  'hasiendo': 'haciendo',
  'asiendo': 'haciendo',
  'echo': 'hecho',
  'aora': 'ahora',
  'asta': 'hasta',
  'servisio': 'servicio',
  'servisios': 'servicios',
  'nesesito': 'necesito',
  'nesecito': 'necesito',
  'nesesita': 'necesita',
  'nesesitamos': 'necesitamos',
  'nesesario': 'necesario',
  'nesecario': 'necesario',
  'desicion': 'decisión',
  'desisiones': 'decisiones',
  'cotisacion': 'cotización',
  'cotisaciones': 'cotizaciones',
  'espesifico': 'específico',
  'espesifica': 'específica',
  'balbula': 'válvula',
  'balbulas': 'válvulas',
  'vomba': 'bomba',
  'mobible': 'movible',
  'cavina': 'cabina',
  'pantaya': 'pantalla',
  'pantayas': 'pantallas',
  'fleca': 'flecha',
  'bloqeo': 'bloqueo',
  'bloquedo': 'bloqueado',
  'urgensia': 'urgencia',
  'sobrpone': 'sobrepone',
  'reparasion': 'reparación',
  'reparasiones': 'reparaciones'
};

export interface SpellSuggestion {
  word: string;
  startIndex: number;
  endIndex: number;
  suggestions: string[];
  explanation: string;
}

/**
 * Calcula la distancia Levenshtein entre dos cadenas.
 */
function levenshtein(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix: number[][] = [];

  for (let i = 0; i <= bn; ++i) {
    matrix[i] = [i];
  }
  for (let i = 0; i <= an; ++i) {
    matrix[0][i] = i;
  }

  for (let i = 1; i <= bn; ++i) {
    for (let j = 1; j <= an; ++j) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // sustitución
          Math.min(
            matrix[i][j - 1] + 1,     // inserción
            matrix[i - 1][j] + 1      // eliminación
          )
        );
      }
    }
  }
  return matrix[bn][an];
}

/**
 * Normaliza una palabra para búsqueda eliminando tildes y diéresis.
 */
function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Encuentra candidatos sugeridos para una palabra mal escrita.
 */
function findSuggestions(rawWord: string): string[] {
  const lower = rawWord.toLowerCase();

  // 1. Verificar si tiene corrección directa que sea distinta de la palabra misma
  if (CORRECCIONES_DIRECTAS[lower] && CORRECCIONES_DIRECTAS[lower] !== lower) {
    return [CORRECCIONES_DIRECTAS[lower]];
  }

  // 2. Si la palabra sin tildes coincide con alguna con tildes común (-cion, -ia, -ico, etc.)
  if (lower.endsWith('cion')) {
    const candidate = lower.slice(0, -4) + 'ción';
    if (DICCIONARIO_BASE.has(candidate)) return [candidate];
  }
  if (lower.endsWith('ciones')) {
    const candidate = lower.slice(0, -6) + 'ciones';
    if (DICCIONARIO_BASE.has(candidate)) return [candidate];
  }
  if (lower.endsWith('ia') && lower.length > 4) {
    const candidate = lower.slice(0, -2) + 'ía';
    if (DICCIONARIO_BASE.has(candidate)) return [candidate];
  }

  // 3. Probar reemplazos fonéticos comunes (s/c/z, b/v, h inicial)
  const variants = new Set<string>();
  if (lower.includes('s')) variants.add(lower.replace(/s/g, 'c'));
  if (lower.includes('c')) variants.add(lower.replace(/c/g, 's'));
  if (lower.includes('z')) variants.add(lower.replace(/z/g, 's'));
  if (lower.includes('b')) variants.add(lower.replace(/b/g, 'v'));
  if (lower.includes('v')) variants.add(lower.replace(/v/g, 'b'));
  if (!lower.startsWith('h')) variants.add('h' + lower);
  if (lower.startsWith('h')) variants.add(lower.slice(1));

  for (const variant of variants) {
    if (DICCIONARIO_BASE.has(variant)) {
      return [variant];
    }
    if (CORRECCIONES_DIRECTAS[variant] && CORRECCIONES_DIRECTAS[variant] !== lower) {
      return [CORRECCIONES_DIRECTAS[variant]];
    }
  }

  // 4. Distancia Levenshtein con el diccionario base (máx distancia 2)
  const candidates: Array<{ word: string; dist: number }> = [];
  const normalizedLower = removeAccents(lower);

  for (const dictWord of DICCIONARIO_BASE) {
    // Si la versión sin tildes es idéntica y difiere solo en acento, es prioridad absoluta
    if (removeAccents(dictWord) === normalizedLower && dictWord !== lower) {
      candidates.push({ word: dictWord, dist: 0.1 });
      continue;
    }

    if (Math.abs(dictWord.length - lower.length) > 2) continue;

    const dist = levenshtein(lower, dictWord);
    if (dist <= 2) {
      candidates.push({ word: dictWord, dist });
    }
  }

  candidates.sort((a, b) => a.dist - b.dist);
  return candidates.slice(0, 3).map(c => c.word);
}

/**
 * Analiza un texto y devuelve una lista de sugerencias ortográficas.
 */
export function checkSpanishText(text: string): SpellSuggestion[] {
  if (!text || text.trim().length === 0) return [];

  const results: SpellSuggestion[] = [];
  // Tokenizar palabras preservando caracteres españoles y posiciones
  const regex = /([a-záéíóúüñA-ZÁÉÍÓÚÜÑ]+)/gu;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const rawWord = match[0];
    const startIndex = match.index;
    const endIndex = startIndex + rawWord.length;

    // Ignorar palabras de 1 letra (excepto vocales comunes), siglas y números
    if (rawWord.length === 1 && !['a', 'e', 'o', 'u', 'y'].includes(rawWord.toLowerCase())) {
      continue;
    }
    if (rawWord.length >= 2 && rawWord === rawWord.toUpperCase()) {
      // Es una sigla o acrónimo tipo "OT", "CEO", "BL", "KPI", "USD", "ISO", "PDF"
      continue;
    }

    // Ignorar si contiene números o parece código técnico (ej. IMP-2026, 4x4)
    if (/\d/.test(rawWord)) continue;

    const lower = rawWord.toLowerCase();

    // ¿Tiene corrección directa explícita?
    const directCorrection = CORRECCIONES_DIRECTAS[lower];
    const isDirectCorrection = Boolean(directCorrection && directCorrection !== lower);

    // ¿Es palabra válida conocida?
    const isValid = DICCIONARIO_BASE.has(lower);

    if (isValid && !isDirectCorrection) {
      continue;
    }

    // Si no es válida o tiene corrección directa requerida
    const suggestions = findSuggestions(rawWord);
    if (suggestions.length > 0) {
      // Ajustar mayúscula inicial si la palabra original la tenía
      const formattedSuggestions = suggestions.map(sug => {
        if (rawWord[0] === rawWord[0].toUpperCase() && rawWord.length > 1 && rawWord[1] === rawWord[1].toLowerCase()) {
          return sug.charAt(0).toUpperCase() + sug.slice(1);
        }
        return sug;
      });

      let explanation = 'Posible error de ortografía';
      if (lower.endsWith('cion') || lower.endsWith('ia') || lower.endsWith('ano')) {
        explanation = 'Falta de tilde o acentuación gráfica';
      } else if (isDirectCorrection) {
        explanation = 'Reemplazo ortográfico recomendado';
      }

      results.push({
        word: rawWord,
        startIndex,
        endIndex,
        suggestions: formattedSuggestions,
        explanation
      });
    }
  }

  return results;
}

/**
 * Reemplaza una palabra en el texto por la sugerencia seleccionada.
 */
export function applySuggestion(
  fullText: string,
  suggestion: SpellSuggestion,
  chosenWord: string
): string {
  return (
    fullText.substring(0, suggestion.startIndex) +
    chosenWord +
    fullText.substring(suggestion.endIndex)
  );
}

/**
 * Aplica todas las primeras sugerencias de forma masiva.
 */
export function applyAllSuggestions(
  fullText: string,
  suggestions: SpellSuggestion[]
): string {
  if (!suggestions || suggestions.length === 0) return fullText;

  // Ordenar de final a inicio para no alterar los índices durante reemplazos
  const sorted = [...suggestions].sort((a, b) => b.startIndex - a.startIndex);
  let updated = fullText;

  for (const sug of sorted) {
    if (sug.suggestions && sug.suggestions.length > 0) {
      const best = sug.suggestions[0];
      updated =
        updated.substring(0, sug.startIndex) +
        best +
        updated.substring(sug.endIndex);
    }
  }

  return updated;
}
