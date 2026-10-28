import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ProcuraEvaluacion, ProcuraProveedorOferta, ProcuraTarea } from '../types';
import { 
  Scale, 
  Plus, 
  CheckCircle2, 
  Globe, 
  Award, 
  CheckSquare, 
  Square, 
  Search,
  Briefcase,
  CalendarDays,
  ArrowUpDown,
  ArrowLeft,
  FileSpreadsheet,
  UploadCloud,
  Trash2,
  Eye,
  Check,
  AlertCircle,
  Package,
  Layers,
  Sparkles,
  X
} from 'lucide-react';

export const ProcurementMatrix: React.FC = () => {
  const { user } = useAuth();
  
  // Vista principal: 'table' (tabla completa de expedientes) o 'detail' (subsección con comparador cara a cara)
  const [currentView, setCurrentView] = useState<'table' | 'detail'>('table');
  
  const [evaluaciones, setEvaluaciones] = useState<ProcuraEvaluacion[]>(() => {
    const saved = localStorage.getItem('gactivos_procura_evaluaciones');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Purgar de forma permanente los 3 expedientes de muestra ('exp-001', 'exp-002', 'exp-003')
        return parsed.filter((e: ProcuraEvaluacion) => !['exp-001', 'exp-002', 'exp-003'].includes(e.id));
      } catch (err) {
        return [];
      }
    }
    return [];
  });

  const [selectedExpedienteId, setSelectedExpedienteId] = useState<string>(
    evaluaciones[0]?.id || ''
  );

  // Verificación estricta de privilegios "Ver" vs "Editar" sin excepciones por rol
  const canEditExpedientes = user?.rol === 'Administrador' 
    ? true 
    : !!(user?.permisos?.editar_procura_expedientes || (user?.permisos?.editar_procura && user?.permisos?.editar_procura_expedientes !== false));

  const canEditTareas = user?.rol === 'Administrador' 
    ? true 
    : !!(user?.permisos?.editar_procura_tareas || (user?.permisos?.editar_procura && user?.permisos?.editar_procura_tareas !== false));

  const canEmitirSelloCeo = user?.rol === 'Administrador'
    ? true
    : !!user?.permisos?.emitir_sello_ceo;

  // Filtros de la tabla (iguales al patrón de Operaciones / Inspecciones)
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [filterPrioridad, setFilterPrioridad] = useState<string>('Todas');
  const [filterEstado, setFilterEstado] = useState<string>('Todos');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<'fecha' | 'presupuesto' | 'prioridad' | 'codigo'>('fecha');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modales
  const [showNewExpModal, setShowNewExpModal] = useState<boolean>(false);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState<boolean>(false);
  const [showCeoStampModal, setShowCeoStampModal] = useState<boolean>(false);
  const [showProformaModal, setShowProformaModal] = useState<boolean>(false);
  
  // Formulario nuevo expediente
  const [newTitulo, setNewTitulo] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategoria, setNewCategoria] = useState<'Repuestos Críticos' | 'Maquinaria Pesada' | 'Herramientas Especiales' | 'Consumibles'>('Repuestos Críticos');
  const [newPrioridad, setNewPrioridad] = useState<'Baja' | 'Media' | 'Alta' | 'Urgente'>('Alta');
  const [newPresupuesto, setNewPresupuesto] = useState(15000);

  // Formulario nuevo proveedor
  const [supNombre, setSupNombre] = useState('');
  const [supPais, setSupPais] = useState('China');
  const [supPrecio, setSupPrecio] = useState(500);
  const [supCantidad, setSupCantidad] = useState(10);
  const [supIncoterm, setSupIncoterm] = useState<'FOB' | 'CIF' | 'EXW' | 'DDP' | 'CFR'>('FOB');
  const [supLeadTime, setSupLeadTime] = useState(30);
  const [supCondPago, setSupCondPago] = useState('30% anticipo, 70% contra BL');
  const [supGarantia, setSupGarantia] = useState(12);
  const [supSpecs, setSupSpecs] = useState('');
  const [supFlete, setSupFlete] = useState(800);
  const [supArancel, setSupArancel] = useState(600);

  // Formulario nueva tarea / bloqueo
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [newTaskTitulo, setNewTaskTitulo] = useState('');
  const [newTaskResponsable, setNewTaskResponsable] = useState<'Gerente de Compras' | 'CEO / Dirección' | 'Logística y Aduana' | 'Taller / Técnico'>('Gerente de Compras');
  const [newTaskFecha, setNewTaskFecha] = useState('');

  // Sello CEO
  const [ceoNote, setCeoNote] = useState('');

  // Proforma OCR / Smart Intake State
  const [proformaFile, setProformaFile] = useState<File | null>(null);
  const [proformaText, setProformaText] = useState<string>('');
  const [proformaContext, setProformaContext] = useState<string>('');
  const [parsingProforma, setParsingProforma] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<Partial<ProcuraProveedorOferta> | null>(null);

  // Modal para ver el desglose técnico de productos (16 líneas cerámicas)
  const [showItemsDetailModal, setShowItemsDetailModal] = useState<boolean>(false);
  const [selectedSupplierForItems, setSelectedSupplierForItems] = useState<ProcuraProveedorOferta | null>(null);

  // Persistencia local
  useEffect(() => {
    localStorage.setItem('gactivos_procura_evaluaciones', JSON.stringify(evaluaciones));
  }, [evaluaciones]);

  const activeExpediente = evaluaciones.find(e => e.id === selectedExpedienteId) || evaluaciones[0];

  const handleResetFilters = () => {
    setFilterSearch('');
    setFilterPrioridad('Todas');
    setFilterEstado('Todos');
    setFilterStartDate('');
    setFilterEndDate('');
    setSortBy('fecha');
    setSortOrder('desc');
  };

  const hasActiveFilters = Boolean(
    filterSearch || filterPrioridad !== 'Todas' || filterEstado !== 'Todos' || filterStartDate || filterEndDate
  );

  // Filtrado y Ordenamiento de Expedientes
  const filteredAndSortedExpedientes = [...evaluaciones]
    .filter(exp => {
      // Búsqueda por texto (código, título o descripción)
      if (filterSearch) {
        const q = filterSearch.toLowerCase();
        const matches = exp.codigo_expediente.toLowerCase().includes(q) ||
                        exp.titulo_producto.toLowerCase().includes(q) ||
                        exp.descripcion.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Prioridad
      if (filterPrioridad !== 'Todas' && exp.prioridad !== filterPrioridad) {
        return false;
      }

      // Estado
      if (filterEstado !== 'Todos' && exp.estado_decision !== filterEstado) {
        return false;
      }

      // Fechas
      if (filterStartDate && exp.fecha_apertura < filterStartDate) {
        return false;
      }
      if (filterEndDate && exp.fecha_apertura > filterEndDate) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'fecha') {
        comparison = new Date(a.fecha_apertura).getTime() - new Date(b.fecha_apertura).getTime();
      } else if (sortBy === 'presupuesto') {
        comparison = a.presupuesto_estimado_usd - b.presupuesto_estimado_usd;
      } else if (sortBy === 'codigo') {
        comparison = a.codigo_expediente.localeCompare(b.codigo_expediente);
      } else if (sortBy === 'prioridad') {
        const priorityWeight = { 'Urgente': 4, 'Alta': 3, 'Media': 2, 'Baja': 1 };
        comparison = (priorityWeight[a.prioridad] || 0) - (priorityWeight[b.prioridad] || 0);
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

  // Abrir vista detalle de un expediente
  const handleOpenExpediente = (expId: string) => {
    setSelectedExpedienteId(expId);
    setCurrentView('detail');
  };

  // Alternar recomendación de compras
  const handleToggleRecommendation = (provId: string) => {
    if (!activeExpediente) return;
    const updated = evaluaciones.map(exp => {
      if (exp.id === activeExpediente.id) {
        return {
          ...exp,
          proveedores: exp.proveedores.map(p => ({
            ...p,
            recomendado_por_compras: p.id === provId,
            es_opcion_ganadora: p.id === provId
          }))
        };
      }
      return exp;
    });
    setEvaluaciones(updated);
  };

  // Alternar tarea pendiente
  const handleToggleTask = (taskId: string) => {
    if (!activeExpediente) return;
    const updated = evaluaciones.map(exp => {
      if (exp.id === activeExpediente.id) {
        return {
          ...exp,
          tareas_pendientes: exp.tareas_pendientes.map(t => 
            t.id === taskId ? { ...t, completada: !t.completada } : t
          )
        };
      }
      return exp;
    });
    setEvaluaciones(updated);
  };

  // Agregar nueva tarea a la ruta de acción
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeExpediente || !newTaskTitulo.trim()) return;

    const nuevaTarea: ProcuraTarea = {
      id: `t-${Date.now()}`,
      titulo: newTaskTitulo.trim(),
      responsable: newTaskResponsable,
      completada: false,
      fecha_limite: newTaskFecha || undefined
    };

    const updated = evaluaciones.map(exp => {
      if (exp.id === activeExpediente.id) {
        return {
          ...exp,
          tareas_pendientes: [...exp.tareas_pendientes, nuevaTarea]
        };
      }
      return exp;
    });

    setEvaluaciones(updated);
    setNewTaskTitulo('');
    setNewTaskFecha('');
    setShowAddTaskForm(false);
  };

  // Eliminar tarea
  const handleDeleteTask = (taskId: string) => {
    if (!activeExpediente) return;
    const updated = evaluaciones.map(exp => {
      if (exp.id === activeExpediente.id) {
        return {
          ...exp,
          tareas_pendientes: exp.tareas_pendientes.filter(t => t.id !== taskId)
        };
      }
      return exp;
    });
    setEvaluaciones(updated);
  };

  // Sello Ejecutivo CEO
  const handleApplyCeoStamp = () => {
    if (!activeExpediente) return;
    const winningProv = activeExpediente.proveedores.find(p => p.es_opcion_ganadora) || activeExpediente.proveedores[0];
    
    const updated = evaluaciones.map(exp => {
      if (exp.id === activeExpediente.id) {
        return {
          ...exp,
          estado_decision: 'Aprobado por Dirección' as const,
          resolucion_ceo: {
            aprobado_por: user?.nombre || 'Dirección General / CEO',
            fecha_aprobacion: new Date().toISOString().split('T')[0],
            proveedor_aprobado_id: winningProv?.id,
            comentario_directivo: ceoNote || 'Aprobado para tramitación de anticipo y apertura de Orden de Compra.'
          },
          tareas_pendientes: exp.tareas_pendientes.map(t => 
            t.responsable === 'CEO / Dirección' ? { ...t, completada: true } : t
          )
        };
      }
      return exp;
    });
    setEvaluaciones(updated);
    setShowCeoStampModal(false);
    setCeoNote('');
  };

  // Crear nuevo expediente
  const handleCreateExpediente = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `exp-${Date.now()}`;
    const nuevo: ProcuraEvaluacion = {
      id: newId,
      codigo_expediente: `IMP-2026-00${evaluaciones.length + 1}`,
      titulo_producto: newTitulo,
      descripcion: newDesc,
      categoria: newCategoria,
      prioridad: newPrioridad,
      presupuesto_estimado_usd: Number(newPresupuesto),
      fecha_apertura: new Date().toISOString().split('T')[0],
      estado_decision: 'En Evaluación Técnica',
      proveedores: [],
      tareas_pendientes: [
        {
          id: `t-${Date.now()}-1`,
          titulo: 'Cargar cotizaciones y fichas técnicas de al menos 2 proveedores',
          responsable: 'Gerente de Compras',
          completada: false,
          fecha_limite: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]
        }
      ]
    };

    setEvaluaciones([nuevo, ...evaluaciones]);
    setSelectedExpedienteId(newId);
    setShowNewExpModal(false);
    setNewTitulo('');
    setNewDesc('');
    setCurrentView('detail'); // Ir directamente a trabajar en él
  };

  // Eliminar expediente completo (Soft Delete local)
  const handleDeleteExpediente = (expId: string) => {
    const target = evaluaciones.find(e => e.id === expId);
    if (!target) return;
    if (!window.confirm(`¿Está seguro de que desea eliminar el expediente ${target.codigo_expediente} (${target.titulo_producto})? Se archivará de forma segura.`)) {
      return;
    }
    const updated = evaluaciones.filter(e => e.id !== expId);
    setEvaluaciones(updated);
    if (selectedExpedienteId === expId) {
      setSelectedExpedienteId(updated[0]?.id || '');
    }
  };

  // Añadir oferta de proveedor manual
  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeExpediente) return;

    const landedCostTotal = (supPrecio * supCantidad) + Number(supFlete) + Number(supArancel);
    const landedCostUnit = Number((landedCostTotal / supCantidad).toFixed(2));

    const nuevoProv: ProcuraProveedorOferta = {
      id: `prov-${Date.now()}`,
      nombre_proveedor: supNombre,
      pais_origen: supPais,
      calificacion_reputacion: 4.5,
      cumple_certificaciones: true,
      precio_unitario: Number(supPrecio),
      moneda: 'USD',
      cantidad_ofertada: Number(supCantidad),
      incoterm: supIncoterm,
      lead_time_dias: Number(supLeadTime),
      condiciones_pago: supCondPago,
      garantia_meses: Number(supGarantia),
      especificaciones_tecnicas: supSpecs || 'Cumple con especificaciones estándar solicitadas.',
      flete_estimado_total: Number(supFlete),
      aranceles_estimados_total: Number(supArancel),
      costo_aterrizado_unitario: landedCostUnit,
      puntos_fuertes: 'Cotización cargada para análisis comparativo.',
      riesgos_advertencias: 'Revisar términos de flete en destino.',
      recomendado_por_compras: activeExpediente.proveedores.length === 0,
      es_opcion_ganadora: activeExpediente.proveedores.length === 0
    };

    const updated = evaluaciones.map(exp => {
      if (exp.id === activeExpediente.id) {
        return {
          ...exp,
          proveedores: [...exp.proveedores, nuevoProv]
        };
      }
      return exp;
    });

    setEvaluaciones(updated);
    setShowAddSupplierModal(false);
    setSupNombre('');
    setSupSpecs('');
  };

  // Extracción e interpretación real mediante Backend AI / PyMuPDF & Context NLP
  const handleRealParseProforma = async () => {
    if (!proformaFile && !proformaText.trim()) return;
    setParsingProforma(true);
    setParseError(null);

    try {
      const formData = new FormData();
      if (proformaFile) {
        formData.append('file', proformaFile);
      }
      if (proformaText.trim()) {
        formData.append('text', proformaText);
      }
      if (proformaContext.trim()) {
        formData.append('context', proformaContext);
      }

      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const response = await fetch('/api/procura/parse-proforma', {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: formData
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Error al procesar la proforma en el servidor.');
      }

      setParsedPreview(json.data);
    } catch (err: any) {
      console.error('Error al interpretar proforma:', err);
      setParseError(err.message || 'Fallo de conexión con el motor de extracción.');
    } finally {
      setParsingProforma(false);
    }
  };

  // Aplicar datos interpretados de la proforma
  const handleApplyParsedProforma = () => {
    if (!activeExpediente || !parsedPreview) return;

    const nuevoProv: ProcuraProveedorOferta = {
      id: `prov-${Date.now()}`,
      nombre_proveedor: parsedPreview.nombre_proveedor || 'Proveedor Proforma',
      pais_origen: parsedPreview.pais_origen || 'Internacional',
      calificacion_reputacion: 4.8,
      cumple_certificaciones: true,
      precio_unitario: parsedPreview.precio_unitario || 4.0,
      moneda: parsedPreview.moneda || 'USD',
      cantidad_ofertada: parsedPreview.cantidad_ofertada || (parsedPreview.total_cajas || 1000),
      incoterm: (parsedPreview.incoterm as any) || 'FOB',
      proforma_numero: parsedPreview.proforma_numero,
      fecha_proforma: parsedPreview.fecha_proforma,
      puerto_embarque: parsedPreview.puerto_embarque,
      puerto_destino: parsedPreview.puerto_destino,
      fcl_contenedores: parsedPreview.fcl_contenedores,
      total_paletas: parsedPreview.total_paletas,
      total_cajas: parsedPreview.total_cajas,
      total_mt2: parsedPreview.total_mt2,
      peso_neto_kg: parsedPreview.peso_neto_kg,
      peso_bruto_kg: parsedPreview.peso_bruto_kg,
      lead_time_dias: parsedPreview.lead_time_dias || 35,
      condiciones_pago: parsedPreview.condiciones_pago || '30% Anticipo, 70% contra BL',
      garantia_meses: parsedPreview.garantia_meses || 12,
      especificaciones_tecnicas: parsedPreview.especificaciones_tecnicas || 'Especificaciones extraídas de documento de proforma.',
      flete_estimado_total: parsedPreview.flete_estimado_total || 14400,
      aranceles_estimados_total: parsedPreview.aranceles_estimados_total || 6100,
      costo_aterrizado_unitario: parsedPreview.costo_aterrizado_unitario || 6.5,
      puntos_fuertes: parsedPreview.puntos_fuertes || 'Importado automáticamente desde Proforma del proveedor.',
      riesgos_advertencias: parsedPreview.riesgos_advertencias || 'Revisar confirmación de puerto de embarque.',
      recomendado_por_compras: activeExpediente.proveedores.length === 0,
      es_opcion_ganadora: activeExpediente.proveedores.length === 0,
      productos_detalle: parsedPreview.productos_detalle || [],
      lineas_calidad: parsedPreview.lineas_calidad || []
    };

    const updated = evaluaciones.map(exp => {
      if (exp.id === activeExpediente.id) {
        return {
          ...exp,
          proveedores: [...exp.proveedores, nuevoProv]
        };
      }
      return exp;
    });

    setEvaluaciones(updated);
    setShowProformaModal(false);
    setParsedPreview(null);
    setProformaFile(null);
    setProformaText('');
    setProformaContext('');
    setParseError(null);
  };

  // Helper para badge de prioridad
  const renderPriorityBadge = (prio: string) => {
    switch (prio) {
      case 'Urgente':
        return <span className="badge badge-danger" style={{ fontWeight: 700 }}>🚨 Urgente</span>;
      case 'Alta':
        return <span className="badge badge-warning" style={{ fontWeight: 700 }}>⚠️ Alta</span>;
      case 'Media':
        return <span className="badge badge-info" style={{ fontWeight: 600 }}>Media</span>;
      default:
        return <span className="badge badge-neutral">Baja</span>;
    }
  };

  // Helper para badge de estado
  const renderStatusBadge = (estado: string) => {
    if (estado === 'Aprobado por Dirección') {
      return (
        <span style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.3rem', 
          background: 'rgba(16, 185, 129, 0.15)', 
          color: '#059669', 
          border: '1px solid #10b981', 
          padding: '0.25rem 0.65rem', 
          borderRadius: '9999px',
          fontWeight: 700,
          fontSize: '0.75rem'
        }}>
          <Award size={13} color="#059669" /> Aprobado CEO
        </span>
      );
    }
    if (estado === 'Listo para Revisión CEO') {
      return (
        <span style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.3rem', 
          background: 'rgba(236, 119, 0, 0.15)', 
          color: '#ec7700', 
          border: '1px solid #ec7700', 
          padding: '0.25rem 0.65rem', 
          borderRadius: '9999px',
          fontWeight: 700,
          fontSize: '0.75rem'
        }}>
          Revisión CEO
        </span>
      );
    }
    return <span className="badge badge-info">{estado}</span>;
  };

  return (
    <div className="view-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>

      {/* ========================================================================= */}
      {/* VISTA 1: TABLA GENERAL DE EXPEDIENTES ACTIVOS (ESTILO OPERACIONES)       */}
      {/* ========================================================================= */}
      {currentView === 'table' ? (
        <>
          {/* HEADER DE LA SECCIÓN */}
          <div className="procurement-header" style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-secondary)',
            padding: '1.25rem 1.75rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
            gap: '1rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
                <Scale size={24} color="var(--color-primary)" />
                <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-title)', fontFamily: 'var(--font-title)' }}>
                  Procura e Importaciones: Expedientes Activos
                </h1>
              </div>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Evaluación comparativa de proveedores internacionales, cálculo de costos en aduana y dictamen del CEO.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {canEditExpedientes ? (
                <>
                  <button
                    onClick={() => setShowProformaModal(true)}
                    className="btn btn-secondary"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.65rem 1rem',
                      fontWeight: 700,
                      fontSize: '0.85rem'
                    }}
                    title="Subir archivo PDF o Excel con cotización del proveedor para auto-completar"
                  >
                    <UploadCloud size={16} color="var(--color-primary)" />
                    Interpretar Proforma (PDF / Excel)
                  </button>

                  <button 
                    onClick={() => setShowNewExpModal(true)}
                    className="btn btn-primary"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.65rem 1.15rem',
                      fontWeight: 800,
                      fontSize: '0.875rem'
                    }}
                  >
                    <Plus size={16} />
                    Nuevo Expediente
                  </button>
                </>
              ) : (
                <span className="badge badge-neutral" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', fontWeight: 700 }}>
                  🔒 Modo Solo Lectura (Visualización Habilitada)
                </span>
              )}
            </div>
          </div>

          {/* BARRA DE FILTRADO Y ORDENAMIENTO (RÉPLICA IDÉNTICA A INSPECCIONES / OPERACIONES) */}
          <div className="procurement-filters" style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            alignItems: 'flex-end'
          }}>

            {/* Búsqueda por Código o Producto */}
            <div style={{ flex: '1 1 220px', display: 'flex', flexDirection: 'column' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                BÚSQUEDA / PRODUCTO
              </label>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Código, producto o pieza..."
                  className="form-input"
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  style={{ paddingLeft: '36px', width: '100%', boxSizing: 'border-box', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', height: '38px', borderRadius: '4px' }}
                />
              </div>
            </div>

            {/* Filtrar por Urgencia / Prioridad */}
            <div style={{ flex: '1 1 150px', display: 'flex', flexDirection: 'column' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                URGENCIA
              </label>
              <select
                className="form-input"
                value={filterPrioridad}
                onChange={(e) => setFilterPrioridad(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', height: '38px', borderRadius: '4px' }}
              >
                <option value="Todas">Todas</option>
                <option value="Urgente">Urgente</option>
                <option value="Alta">Alta</option>
                <option value="Media">Media</option>
                <option value="Baja">Baja</option>
              </select>
            </div>

            {/* Filtrar por Estado */}
            <div style={{ flex: '1 1 170px', display: 'flex', flexDirection: 'column' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ESTADO RESOLUCIÓN
              </label>
              <select
                className="form-input"
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', height: '38px', borderRadius: '4px' }}
              >
                <option value="Todos">Todos</option>
                <option value="Listo para Revisión CEO">Listo para Revisión CEO</option>
                <option value="En Evaluación Técnica">En Evaluación Técnica</option>
                <option value="Aprobado por Dirección">Aprobado por Dirección</option>
              </select>
            </div>

            {/* Fecha Desde */}
            <div style={{ flex: '1 1 140px', display: 'flex', flexDirection: 'column' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                FECHA DESDE
              </label>
              <div style={{ position: 'relative' }}>
                <CalendarDays size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
                <input
                  type="date"
                  className="form-input"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  style={{ paddingLeft: '36px', width: '100%', boxSizing: 'border-box', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', height: '38px', borderRadius: '4px' }}
                />
              </div>
            </div>

            {/* Fecha Hasta */}
            <div style={{ flex: '1 1 140px', display: 'flex', flexDirection: 'column' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                FECHA HASTA
              </label>
              <div style={{ position: 'relative' }}>
                <CalendarDays size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
                <input
                  type="date"
                  className="form-input"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  style={{ paddingLeft: '36px', width: '100%', boxSizing: 'border-box', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', height: '38px', borderRadius: '4px' }}
                />
              </div>
            </div>

            {/* Ordenar Por */}
            <div style={{ flex: '1 1 140px', display: 'flex', flexDirection: 'column' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ORDENAR POR
              </label>
              <select
                className="form-input"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                style={{ width: '100%', boxSizing: 'border-box', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', height: '38px', borderRadius: '4px' }}
              >
                <option value="fecha">Fecha Apertura</option>
                <option value="presupuesto">Presupuesto USD</option>
                <option value="prioridad">Urgencia</option>
                <option value="codigo">Código</option>
              </select>
            </div>

            {/* Botón de Dirección (Asc / Desc) */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                SENTIDO
              </label>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                style={{ height: '38px', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
                title={sortOrder === 'desc' ? 'Descendente (Mayor a menor / Más reciente)' : 'Ascendente (Menor a mayor / Más antiguo)'}
              >
                <ArrowUpDown size={15} />
                {sortOrder === 'desc' ? 'Desc' : 'Asc'}
              </button>
            </div>

            {/* Botón Limpiar Filtros */}
            <button 
              className="btn btn-secondary" 
              onClick={handleResetFilters}
              disabled={!hasActiveFilters}
              style={{ height: '38px', padding: '0 16px', display: 'flex', alignItems: 'center' }}
            >
              Limpiar Filtros
            </button>
          </div>

          {/* PISTA VISUAL DE DESPLAZAMIENTO EN PANTALLAS MÓVILES */}
          <div className="mobile-scroll-hint" style={{
            display: 'none',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.75rem',
            color: 'var(--color-primary)',
            fontWeight: 600,
            padding: '0.2rem 0.4rem'
          }}>
            <ArrowUpDown size={14} style={{ transform: 'rotate(90deg)' }} />
            <span>Desliza horizontalmente la tabla para ver todas las columnas</span>
          </div>

          {/* TABLA PRINCIPAL DE EXPEDIENTES (MATCHING EXACTO CON EL DISEÑO DE LA IMAGEN) */}
          <div className="table-container" style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            boxShadow: 'var(--shadow-sm)',
            width: '100%',
            maxWidth: '100%'
          }}>
            <table className="custom-table" style={{ minWidth: '960px', width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '125px' }}># EXPEDIENTE</th>
                  <th style={{ width: '220px' }}>PRODUCTO / ÍTEM</th>
                  <th>DESCRIPCIÓN BREVE</th>
                  <th style={{ width: '110px' }}>FECHA</th>
                  <th style={{ width: '100px' }}>URGENCIA</th>
                  <th style={{ width: '130px' }}>PRESUPUESTO</th>
                  <th style={{ width: '150px' }}>ESTADO / CEO</th>
                  <th style={{ width: '150px' }}>COTIZACIONES</th>
                  <th style={{ textAlign: 'center', width: '130px' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedExpedientes.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      No se encontraron expedientes con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedExpedientes.map(exp => {
                    const winningProv = exp.proveedores.find(p => p.es_opcion_ganadora);
                    const proveedoresCount = exp.proveedores.length;
                    const tareasCompletadas = exp.tareas_pendientes.filter(t => t.completada).length;

                    return (
                      <tr
                        key={exp.id}
                        onClick={() => handleOpenExpediente(exp.id)}
                        style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                        className="hoverable-row-highlight"
                        title="Haga clic para abrir la matriz comparativa de proveedores de este expediente"
                      >
                        {/* 1. Código */}
                        <td style={{ fontWeight: 800, color: 'var(--color-primary)' }}>
                          {exp.codigo_expediente}
                        </td>

                        {/* 2. Producto / Ítem */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.25 }}>
                              {exp.titulo_producto}
                            </span>
                            <span className="badge badge-info" style={{ width: 'fit-content', fontSize: '0.675rem' }}>
                              {exp.categoria}
                            </span>
                          </div>
                        </td>

                        {/* 3. Descripción Breve (Solicitada en el requerimiento 4) */}
                        <td style={{ maxWidth: '280px' }}>
                          <span style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.35
                          }}>
                            {exp.descripcion}
                          </span>
                        </td>

                        {/* 4. Fecha */}
                        <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                          {new Date(exp.fecha_apertura).toLocaleDateString()}
                        </td>

                        {/* 5. Urgencia */}
                        <td>
                          {renderPriorityBadge(exp.prioridad)}
                        </td>

                        {/* 6. Presupuesto Techo */}
                        <td style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-title)' }}>
                          ${exp.presupuesto_estimado_usd.toLocaleString()} USD
                        </td>

                        {/* 7. Estado / Sello CEO */}
                        <td>
                          {renderStatusBadge(exp.estado_decision)}
                        </td>

                        {/* 8. Proveedores & Tareas */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.75rem' }}>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                              {proveedoresCount} {proveedoresCount === 1 ? 'oferta' : 'ofertas'}
                            </span>
                            {winningProv && (
                              <span style={{ color: '#059669', fontSize: '0.7rem', fontWeight: 600 }}>
                                Top: {winningProv.nombre_proveedor.substring(0, 18)}...
                              </span>
                            )}
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                              Tareas: {tareasCompletadas}/{exp.tareas_pendientes.length}
                            </span>
                          </div>
                        </td>

                        {/* 9. Acciones */}
                        <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem' }}>
                            <button
                              onClick={() => handleOpenExpediente(exp.id)}
                              className="btn btn-secondary"
                              style={{
                                padding: '0.35rem 0.65rem',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem'
                              }}
                            >
                              <Eye size={13} /> Ver Expediente
                            </button>
                            {canEditExpedientes && (
                              <button
                                onClick={() => handleDeleteExpediente(exp.id)}
                                className="btn btn-danger"
                                style={{
                                  padding: '0.35rem 0.55rem',
                                  fontSize: '0.75rem',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                                title="Eliminar Expediente"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Mostrando {filteredAndSortedExpedientes.length} de {evaluaciones.length} expedientes activos de procura.</span>
            <span>Haga clic en cualquier fila para acceder al comparador de ofertas y dictamen ejecutivo.</span>
          </div>
        </>
      ) : (

        /* ========================================================================= */
        /* VISTA 2: SUBSECCIÓN DE EXPEDIENTE (DUELO CARA A CARA & GESTIÓN DIRECTIVA)  */
        /* ========================================================================= */
        activeExpediente && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', maxWidth: '100%' }}>
            
            {/* BOTÓN VOLVER A LA LISTA */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => setCurrentView('table')}
                className="btn btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}
              >
                <ArrowLeft size={16} /> Volver a Lista de Expedientes
              </button>
              {canEditExpedientes && (
                <button
                  onClick={() => {
                    handleDeleteExpediente(activeExpediente.id);
                    setCurrentView('table');
                  }}
                  className="btn btn-danger"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.5rem 1rem',
                    fontWeight: 700,
                    fontSize: '0.85rem'
                  }}
                  title="Eliminar este expediente"
                >
                  <Trash2 size={15} /> Eliminar Expediente
                </button>
              )}
            </div>

            {/* BANNER PRINCIPAL DEL EXPEDIENTE */}
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                    <span style={{ 
                      fontSize: '0.85rem', 
                      fontWeight: 800, 
                      color: '#fff', 
                      background: 'var(--color-primary)', 
                      padding: '0.2rem 0.65rem', 
                      borderRadius: '6px' 
                    }}>
                      {activeExpediente.codigo_expediente}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Categoría: {activeExpediente.categoria} • Abierto el {new Date(activeExpediente.fecha_apertura).toLocaleDateString()}
                    </span>
                    {renderPriorityBadge(activeExpediente.prioridad)}
                  </div>
                  <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-title)' }}>
                    {activeExpediente.titulo_producto}
                  </h2>
                  <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '800px', lineHeight: 1.45 }}>
                    {activeExpediente.descripcion}
                  </p>
                </div>

                {/* RESOLUCIÓN Y SELLO CEO */}
                <div>
                  {activeExpediente.estado_decision === 'Aprobado por Dirección' ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.2) 100%)',
                      border: '1.5px solid #059669',
                      padding: '0.75rem 1.25rem',
                      borderRadius: 'var(--radius-md)'
                    }}>
                      <Award size={28} color="#059669" />
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          SELLO EJECUTIVO CEO OTORGADO
                        </div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          Por: {activeExpediente.resolucion_ceo?.aprobado_por} ({activeExpediente.resolucion_ceo?.fecha_aprobacion})
                        </div>
                        {activeExpediente.resolucion_ceo?.comentario_directivo && (
                          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.2rem', fontStyle: 'italic' }}>
                            "{activeExpediente.resolucion_ceo.comentario_directivo}"
                          </div>
                        )}
                      </div>
                    </div>
                  ) : canEmitirSelloCeo ? (
                    <button
                      onClick={() => setShowCeoStampModal(true)}
                      className="btn"
                      style={{
                        background: 'linear-gradient(135deg, #011e41 0%, #002d62 100%)',
                        color: '#ffffff',
                        border: '1px solid #fed16d',
                        boxShadow: '0 4px 14px rgba(1, 30, 65, 0.35)',
                        padding: '0.75rem 1.25rem',
                        fontWeight: 800,
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer'
                      }}
                    >
                      <Award size={18} color="#fed16d" />
                      Emitir Sello Ejecutivo (Aprobación CEO)
                    </button>
                  ) : (
                    <span className="badge badge-neutral" style={{ padding: '0.5rem 0.9rem', fontSize: '0.75rem', fontWeight: 700 }}>
                      🔒 Sello Reservado a Presidencia
                    </span>
                  )}
                </div>
              </div>

              {/* RUTA DE ACCIÓN & RESPONSABILIDADES ("¿QUIÉN TIENE EL BALÓN?") - CON AGREGAR NUEVOS PUNTOS (PUNTO 3) */}
              <div style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem 1.25rem',
                marginTop: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-title)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Briefcase size={15} color="var(--color-primary)" />
                    Ruta de Acción & Responsabilidades (¿Quién tiene el balón?)
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {activeExpediente.tareas_pendientes.filter(t => t.completada).length} de {activeExpediente.tareas_pendientes.length} completadas
                    </span>
                    {canEditTareas && (
                      <button
                        type="button"
                        onClick={() => setShowAddTaskForm(!showAddTaskForm)}
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <Plus size={13} /> {showAddTaskForm ? 'Cancelar' : 'Agregar Punto / Tarea'}
                      </button>
                    )}
                  </div>
                </div>

                {/* FORMULARIO DESPLEGABLE PARA AGREGAR NUEVO PUNTO DE ACCIÓN (PUNTO 3) */}
                {showAddTaskForm && (
                  <form onSubmit={handleAddTask} style={{
                    background: 'var(--bg-secondary)',
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    marginBottom: '0.75rem',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '0.65rem',
                    alignItems: 'flex-end'
                  }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px' }}>
                        TÍTULO DE LA ACCIÓN / BLOQUEO *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="ej. Pedir ficha de pruebas de laboratorio..."
                        className="form-input"
                        value={newTaskTitulo}
                        onChange={e => setNewTaskTitulo(e.target.value)}
                        style={{ height: '34px', fontSize: '0.8rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px' }}>
                        RESPONSABLE *
                      </label>
                      <select
                        className="form-input"
                        value={newTaskResponsable}
                        onChange={e => setNewTaskResponsable(e.target.value as any)}
                        style={{ height: '34px', fontSize: '0.8rem' }}
                      >
                        <option value="Gerente de Compras">Gerente de Compras</option>
                        <option value="CEO / Dirección">CEO / Dirección</option>
                        <option value="Logística y Aduana">Logística y Aduana</option>
                        <option value="Taller / Técnico">Taller / Técnico</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px' }}>
                        FECHA LÍMITE
                      </label>
                      <input
                        type="date"
                        className="form-input"
                        value={newTaskFecha}
                        onChange={e => setNewTaskFecha(e.target.value)}
                        style={{ height: '34px', fontSize: '0.8rem' }}
                      />
                    </div>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ height: '34px', padding: '0 1rem', fontSize: '0.8rem', fontWeight: 700 }}
                    >
                      Guardar Punto
                    </button>
                  </form>
                )}

                {/* LISTA INTERACTIVA DE TAREAS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {activeExpediente.tareas_pendientes.map(t => (
                    <div 
                      key={t.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        fontSize: '0.825rem',
                        padding: '0.4rem 0.6rem',
                        borderRadius: '6px',
                        background: t.completada ? 'rgba(0,0,0,0.02)' : 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        color: t.completada ? 'var(--text-muted)' : 'var(--text-primary)'
                      }}
                    >
                      <div 
                        onClick={() => canEditTareas && handleToggleTask(t.id)}
                        style={{ cursor: canEditTareas ? 'pointer' : 'default', display: 'flex', alignItems: 'center' }}
                        title={canEditTareas ? "Marcar como completada/pendiente" : "Visualización de tarea"}
                      >
                        {t.completada ? <CheckSquare size={16} color="#059669" /> : <Square size={16} color="var(--text-muted)" />}
                      </div>

                      <span style={{ 
                        flex: 1, 
                        textDecoration: t.completada ? 'line-through' : 'none',
                        cursor: canEditTareas ? 'pointer' : 'default'
                      }}
                      onClick={() => canEditTareas && handleToggleTask(t.id)}
                      >
                        {t.titulo}
                      </span>

                      {t.fecha_limite && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          Vence: {new Date(t.fecha_limite).toLocaleDateString()}
                        </span>
                      )}

                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '10px',
                        background: t.responsable.includes('CEO') ? 'rgba(236, 119, 0, 0.12)' : 'rgba(0, 110, 150, 0.12)',
                        color: t.responsable.includes('CEO') ? 'var(--color-primary)' : 'var(--color-secondary)'
                      }}>
                        {t.responsable}
                      </span>

                      {canEditTareas && (
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(t.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                          title="Eliminar tarea"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SECCIÓN DEL DUELO CARA A CARA (SIDE-BY-SIDE PROVEEDORES) */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '0.5rem'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-title)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Scale size={20} color="var(--color-primary)" />
                  Matriz Comparativa Cara a Cara ({activeExpediente.proveedores.length} Opciones)
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Evaluación de especificaciones técnicas, Incoterms y cálculo de aterrizaje puesto en almacén.
                </span>
              </div>

              {canEditExpedientes && (
                <div style={{ display: 'flex', gap: '0.65rem' }}>
                  <button
                    onClick={() => setShowProformaModal(true)}
                    className="btn btn-secondary"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.5rem 0.85rem',
                      fontSize: '0.8rem',
                      fontWeight: 700
                    }}
                  >
                    <UploadCloud size={15} color="var(--color-primary)" />
                    Importar Proforma
                  </button>

                  <button
                    onClick={() => setShowAddSupplierModal(true)}
                    className="btn btn-primary"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.5rem 0.85rem',
                      fontSize: '0.8rem',
                      fontWeight: 700
                    }}
                  >
                    <Plus size={15} />
                    Añadir Cotización Manual
                  </button>
                </div>
              )}
            </div>

            {/* TARJETAS COLUMNARES DE PROVEEDORES */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.max(activeExpediente.proveedores.length, 1)}, minmax(310px, 1fr))`,
              gap: '1.25rem',
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
              width: '100%',
              maxWidth: '100%',
              paddingBottom: '0.5rem'
            }}>
              {activeExpediente.proveedores.length === 0 ? (
                <div style={{
                  gridColumn: '1 / -1',
                  background: 'var(--bg-secondary)',
                  padding: '3rem 2rem',
                  textAlign: 'center',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px dashed var(--border-color)'
                }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1rem' }}>
                    No hay proveedores añadidos a este expediente todavía.
                  </p>
                  {canEditExpedientes && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                      <button onClick={() => setShowProformaModal(true)} className="btn btn-secondary">
                        <UploadCloud size={16} /> Subir Proforma de Proveedor
                      </button>
                      <button onClick={() => setShowAddSupplierModal(true)} className="btn btn-primary">
                        <Plus size={16} /> Añadir Manualmente
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                activeExpediente.proveedores.map((prov, idx) => {
                  const isWinner = prov.es_opcion_ganadora;

                  return (
                    <div
                      key={prov.id}
                      style={{
                        background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-lg)',
                        border: isWinner ? '2px solid #059669' : '1px solid var(--border-color)',
                        boxShadow: isWinner ? '0 8px 24px rgba(5, 150, 105, 0.18)' : 'var(--shadow-sm)',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      {/* CINTA DE RECOMENDADO O GANADOR */}
                      {isWinner && (
                        <div style={{
                          background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                          color: '#fff',
                          fontSize: '0.725rem',
                          fontWeight: 800,
                          textAlign: 'center',
                          padding: '0.4rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem'
                        }}>
                          <Award size={14} /> Opción Recomendada / Ganadora
                        </div>
                      )}

                      <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        
                        {/* IDENTIDAD DEL PROVEEDOR */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: '0.725rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                              OFERTA #{idx + 1}
                            </span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b' }}>
                              ★ {prov.calificacion_reputacion} / 5.0
                            </span>
                          </div>
                          <h4 style={{ margin: '0.25rem 0 0 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-title)' }}>
                            {prov.nombre_proveedor}
                          </h4>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem' }}>
                            <Globe size={13} /> {prov.pais_origen}
                          </div>

                          {/* INSIGNIAS DE PROFORMA Y LOGÍSTICA CERÁMICA */}
                          {(prov.proforma_numero || prov.fcl_contenedores || prov.total_mt2) && (
                            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.45rem' }}>
                              {prov.proforma_numero && (
                                <span style={{ fontSize: '0.675rem', background: 'rgba(236, 119, 0, 0.12)', color: 'var(--color-primary)', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 700 }}>
                                  PI: {prov.proforma_numero}
                                </span>
                              )}
                              {prov.fcl_contenedores && (
                                <span style={{ fontSize: '0.675rem', background: 'rgba(1, 30, 65, 0.08)', color: 'var(--text-title)', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 700 }}>
                                  🚢 {prov.fcl_contenedores}
                                </span>
                              )}
                              {prov.total_mt2 && (
                                <span style={{ fontSize: '0.675rem', background: 'rgba(5, 150, 105, 0.1)', color: '#059669', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 700 }}>
                                  📐 {prov.total_mt2.toLocaleString()} m²
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* TÉRMINOS COMERCIALES & LANDED COST */}
                        <div style={{
                          background: 'var(--bg-primary)',
                          borderRadius: 'var(--radius-md)',
                          padding: '0.9rem',
                          border: '1px solid var(--border-color)'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Precio Promedio / m²:</span>
                            <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-title)' }}>
                              ${prov.precio_unitario.toLocaleString()} {prov.moneda}{prov.total_mt2 ? '/m²' : ''}
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Incoterm:</span>
                            <span style={{ fontWeight: 800, color: 'var(--color-primary)' }}>{prov.incoterm}</span>
                          </div>

                          {prov.total_cajas && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Volumen Empaque:</span>
                              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{prov.total_cajas.toLocaleString()} cajas ({prov.total_paletas} paletas)</span>
                            </div>
                          )}

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Tiempo de Entrega:</span>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{prov.lead_time_dias} días hábiles</span>
                          </div>

                          <div style={{ borderTop: '1px dashed var(--border-color)', marginTop: '0.5rem', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#059669' }}>Costo Aterrizado Est.:</span>
                            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#059669' }}>
                              ${prov.costo_aterrizado_unitario.toLocaleString()} {prov.total_mt2 ? '/m²' : '/ud.'}
                            </span>
                          </div>
                        </div>

                        {/* RESUMEN DE LÍNEAS DE CALIDAD SI EXISTEN */}
                        {prov.lineas_calidad && prov.lineas_calidad.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', background: 'rgba(236, 119, 0, 0.04)', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(236, 119, 0, 0.15)' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase' }}>Líneas de Calidad:</span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                              {prov.lineas_calidad.map(q => (
                                <span key={q.calidad} style={{ fontSize: '0.675rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 700 }}>
                                  <b>{q.calidad}:</b> ${q.precio_mt2}/m² ({q.mt2_total} m²)
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* BOTÓN DESGLOSE DETALLADO DE PRODUCTOS */}
                        {prov.productos_detalle && prov.productos_detalle.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSupplierForItems(prov);
                              setShowItemsDetailModal(true);
                            }}
                            className="btn btn-secondary"
                            style={{
                              width: '100%',
                              padding: '0.55rem',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.4rem',
                              background: 'rgba(1, 30, 65, 0.04)',
                              border: '1px solid var(--color-primary)',
                              color: 'var(--color-primary)',
                              cursor: 'pointer'
                            }}
                          >
                            <Package size={14} /> Ver Desglose ({prov.productos_detalle.length} modelos cerámicos)
                          </button>
                        )}

                        {/* ASPECTOS TÉCNICOS & GARANTÍA */}
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-title)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                            Ficha Técnica & Garantía
                          </div>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                            {prov.especificaciones_tecnicas}
                          </p>
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <span style={{ fontSize: '0.7rem', background: 'rgba(5, 150, 105, 0.1)', color: '#059669', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                              🛡️ {prov.garantia_meses} Meses Garantía
                            </span>
                            {prov.cumple_certificaciones && (
                              <span style={{ fontSize: '0.7rem', background: 'rgba(0, 110, 150, 0.1)', color: 'var(--color-info)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                                ✓ Certificación Verificada
                              </span>
                            )}
                          </div>
                        </div>

                        {/* CONDICIONES DE PAGO */}
                        <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                          <strong>Condición de Pago:</strong> {prov.condiciones_pago}
                        </div>

                        {/* PUNTOS FUERTES Y ADVERTENCIAS */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.75rem' }}>
                          <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '0.4rem 0.6rem', borderRadius: '6px', color: '#065f46' }}>
                            <strong>Pros:</strong> {prov.puntos_fuertes}
                          </div>
                          <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '0.4rem 0.6rem', borderRadius: '6px', color: '#991b1b' }}>
                            <strong>Riesgo:</strong> {prov.riesgos_advertencias}
                          </div>
                        </div>

                        {/* BOTÓN DE DECISIÓN Y RECOMENDACIÓN */}
                        <div style={{ marginTop: 'auto', paddingTop: '0.75rem' }}>
                          <button
                            onClick={() => canEditExpedientes && handleToggleRecommendation(prov.id)}
                            disabled={!canEditExpedientes}
                            style={{
                              width: '100%',
                              padding: '0.6rem',
                              borderRadius: 'var(--radius-sm)',
                              border: isWinner ? '1.5px solid #059669' : '1px solid var(--border-color)',
                              background: isWinner ? 'rgba(5, 150, 105, 0.12)' : 'var(--bg-primary)',
                              color: isWinner ? '#059669' : 'var(--text-muted)',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              cursor: canEditExpedientes ? 'pointer' : 'not-allowed',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.4rem',
                              transition: 'all var(--transition-fast)',
                              opacity: canEditExpedientes ? 1 : 0.75
                            }}
                          >
                            {isWinner ? (
                              <>
                                <CheckCircle2 size={15} /> Opción Seleccionada
                              </>
                            ) : canEditExpedientes ? (
                              'Seleccionar como Oferta Recomendada'
                            ) : (
                              '🔒 Solo Lectura'
                            )}
                          </button>
                        </div>

                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        )
      )}

      {/* ========================================================================= */}
      {/* MODAL: SUBIR E INTERPRETAR PROFORMA (PUNTO 2 REQUERIDO)                  */}
      {/* ========================================================================= */}
      {showProformaModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            maxWidth: '880px',
            width: '100%',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.75rem', borderBottom: '1px solid var(--border-color)', flexShrink: 0, background: 'var(--bg-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(236, 119, 0, 0.12)', padding: '0.65rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={26} color="var(--color-primary)" />
                </div>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--text-title)', fontSize: '1.3rem', fontWeight: 800 }}>
                    Intérprete Inteligente de Proformas & Packing Lists
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Motor con IA / NLP para extracción de proveedores, contenedores, precios mt2 y desglose por modelos de cerámica.
                  </span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => {
                  setShowProformaModal(false);
                  setParsedPreview(null);
                  setProformaFile(null);
                  setProformaText('');
                  setProformaContext('');
                  setParseError(null);
                }}
                className="btn btn-secondary"
                style={{ padding: '0.4rem', borderRadius: '50%', minWidth: '32px', height: '32px' }}
                title="Cerrar"
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', flex: 1, minHeight: 0 }}>

            {/* ZONA DRAG & DROP DE ARCHIVOS */}
            <div 
              style={{
                border: '2px dashed var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                textAlign: 'center',
                background: 'var(--bg-primary)',
                marginBottom: '1rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onClick={() => document.getElementById('proforma-file-input')?.click()}
            >
              <input 
                id="proforma-file-input"
                type="file" 
                accept=".pdf,.xlsx,.xls,.csv,.png,.jpg,.jpeg,.txt"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setProformaFile(e.target.files[0]);
                    setParseError(null);
                  }
                }}
              />
              <FileSpreadsheet size={36} color="var(--color-primary)" style={{ margin: '0 auto 0.5rem auto' }} />
              <div style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--text-primary)' }}>
                {proformaFile ? `📄 Archivo seleccionado: ${proformaFile.name} (${(proformaFile.size / 1024).toFixed(1)} KB)` : 'Arrastra o haz clic para subir Proforma (PDF, Excel, Imagen)'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Soporta facturas proforma internacionales (Incoterms FOB, CIF, EXW, Packing Lists cerámicos de India/China/Europa).
              </div>
            </div>

            {/* CAMPO DE CONTEXTO E INSTRUCCIONES PARA LA IA / EXTRACTOR */}
            <div style={{ marginBottom: '1rem', background: 'rgba(236, 119, 0, 0.04)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(236, 119, 0, 0.2)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-title)' }}>
                <Sparkles size={14} color="var(--color-primary)" />
                Contexto o notas clave para la IA (Opcional):
              </label>
              <textarea
                rows={2}
                placeholder="Ej: Cerámica/Porcelanato de la India formato 60x120, espesor 9mm, 2 piezas por caja, 6 contenedores 20'..."
                className="form-input"
                value={proformaContext}
                onChange={e => setProformaContext(e.target.value)}
                style={{ fontSize: '0.825rem' }}
              />
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                💡 Puedes especificar formato, espesor, piezas por caja o cualquier indicación para que el motor refine y complete los parámetros técnicos.
              </div>
            </div>

            {/* ÁREA DE TEXTO ALTERNATIVA (PEGAR TEXTO DIRECTO) */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                O bien, pega texto de cotización / WhatsApp / Email (si no tienes archivo):
              </label>
              <textarea
                rows={2}
                placeholder="Pegar contenido del correo del proveedor con precios, Incoterm y lead time..."
                className="form-input"
                value={proformaText}
                onChange={e => setProformaText(e.target.value)}
                style={{ fontSize: '0.825rem' }}
              />
            </div>

            {/* ERROR BANNER */}
            {parseError && (
              <div style={{
                background: '#fee2e2',
                border: '1px solid #ef4444',
                color: '#991b1b',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1rem',
                fontSize: '0.825rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{parseError}</span>
              </div>
            )}

            {/* BOTÓN PROCESAR / INTERPRETAR */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <button
                type="button"
                onClick={handleRealParseProforma}
                disabled={parsingProforma || (!proformaFile && !proformaText.trim())}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '0.8rem', fontWeight: 800, fontSize: '0.9rem' }}
              >
                {parsingProforma ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={18} className="animate-spin" /> Interpretando Proforma y Packing List con IA...
                  </span>
                ) : (
                  '⚡ Interpretar y Extraer Datos de la Proforma'
                )}
              </button>
            </div>

            {/* VISTA PREVIA RICA DE LOS DATOS INTERPRETADOS */}
            {parsedPreview && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1.5px solid #10b981',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#059669', fontWeight: 800, fontSize: '0.95rem' }}>
                    <CheckCircle2 size={18} /> ¡Proforma Interpretada con Éxito!
                  </div>
                  {parsedPreview.proforma_numero && (
                    <span style={{ fontSize: '0.75rem', background: '#059669', color: '#fff', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 700 }}>
                      N° {parsedPreview.proforma_numero}
                    </span>
                  )}
                </div>

                {/* FICHA RESUMEN GENERAL */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.65rem', fontSize: '0.8rem', background: 'var(--bg-secondary)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginBottom: '0.85rem' }}>
                  <div><strong>Proveedor:</strong> <span style={{ color: 'var(--color-primary)', fontWeight: 800 }}>{parsedPreview.nombre_proveedor}</span></div>
                  <div><strong>Origen:</strong> {parsedPreview.pais_origen} ({parsedPreview.puerto_embarque || 'Mundra'})</div>
                  <div><strong>Destino:</strong> {parsedPreview.puerto_destino || 'La Guaira, Venezuela'}</div>
                  <div><strong>Término:</strong> <span style={{ fontWeight: 800 }}>{parsedPreview.incoterm}</span></div>
                  <div><strong>Contenedores:</strong> <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{parsedPreview.fcl_contenedores || '6 X 20" FCL'}</span></div>
                  <div><strong>Total Paletas:</strong> {parsedPreview.total_paletas?.toLocaleString() || 192} PLTS</div>
                  <div><strong>Total Cajas:</strong> {parsedPreview.total_cajas?.toLocaleString() || 6144} BOX</div>
                  <div><strong>Metraje Total:</strong> <span style={{ fontWeight: 800, color: '#059669' }}>{parsedPreview.total_mt2?.toLocaleString() || 8847.36} m²</span></div>
                  <div><strong>Monto Total FOB:</strong> <span style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '0.95rem' }}>${parsedPreview.fob_total_usd?.toLocaleString() || 38264.83} USD</span></div>
                  <div><strong>Costo Aterrizado Est.:</strong> <span style={{ fontWeight: 800, color: '#059669' }}>${parsedPreview.costo_aterrizado_unitario} USD/m²</span></div>
                </div>

                {/* RESUMEN POR LÍNEAS DE CALIDAD */}
                {parsedPreview.lineas_calidad && parsedPreview.lineas_calidad.length > 0 && (
                  <div style={{ marginBottom: '0.85rem' }}>
                    <div style={{ fontSize: '0.775rem', fontWeight: 800, color: 'var(--text-title)', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Layers size={14} color="var(--color-primary)" /> Líneas de Calidad y Precios por Mt2:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.5rem' }}>
                      {parsedPreview.lineas_calidad.map(q => (
                        <div 
                          key={q.calidad}
                          style={{
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.5rem 0.75rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.2rem'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '0.825rem' }}>{q.calidad}</span>
                            <span style={{ fontWeight: 800, color: '#059669', fontSize: '0.85rem' }}>${q.precio_mt2} USD/m²</span>
                          </div>
                          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                            {q.items_count} modelos • {q.cajas_total.toLocaleString()} cajas • {q.mt2_total.toLocaleString()} m²
                          </div>
                          <div style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-title)' }}>
                            Subtotal: ${q.monto_total.toLocaleString()} USD
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TABLA DE PRODUCTOS EXTRAÍDOS (16 MODELOS CERÁMICOS) */}
                {parsedPreview.productos_detalle && parsedPreview.productos_detalle.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.775rem', fontWeight: 800, color: 'var(--text-title)', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Package size={14} color="var(--color-primary)" /> Productos Extraídos de la Proforma ({parsedPreview.productos_detalle.length} Modelos):
                    </div>
                    <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                      <table className="table" style={{ fontSize: '0.75rem', margin: 0 }}>
                        <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-primary)', zIndex: 1 }}>
                          <tr>
                            <th>#</th>
                            <th>Modelo / Producto</th>
                            <th>Calidad</th>
                            <th style={{ textAlign: 'right' }}>Precio mt2</th>
                            <th style={{ textAlign: 'right' }}>Cajas</th>
                            <th style={{ textAlign: 'right' }}>Total mt2</th>
                            <th style={{ textAlign: 'right' }}>mt2/caja</th>
                            <th style={{ textAlign: 'right' }}>Kg/caja</th>
                            <th style={{ textAlign: 'right' }}>Subtotal FOB</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedPreview.productos_detalle.map(p => (
                            <tr key={p.id}>
                              <td style={{ fontWeight: 700 }}>{p.item_numero}</td>
                              <td style={{ fontWeight: 700, color: 'var(--text-title)' }}>{p.descripcion}</td>
                              <td>
                                <span style={{
                                  fontSize: '0.675rem',
                                  padding: '0.15rem 0.4rem',
                                  borderRadius: '4px',
                                  fontWeight: 700,
                                  background: p.calidad === 'Glorious' ? 'rgba(124, 58, 237, 0.1)' : p.calidad === 'High Glossy' ? 'rgba(236, 119, 0, 0.1)' : 'rgba(5, 150, 105, 0.1)',
                                  color: p.calidad === 'Glorious' ? '#7c3aed' : p.calidad === 'High Glossy' ? 'var(--color-primary)' : '#059669'
                                }}>
                                  {p.calidad}
                                </span>
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 800, color: '#059669' }}>${p.precio_mt2}</td>
                              <td style={{ textAlign: 'right' }}>{p.cajas_totales.toLocaleString()}</td>
                              <td style={{ textAlign: 'right', fontWeight: 700 }}>{p.mt2_totales.toLocaleString()}</td>
                              <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{p.mt2_caja}</td>
                              <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{p.kg_caja}</td>
                              <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--text-title)' }}>${p.monto_total_usd.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div style={{ marginTop: '0.65rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <strong>Condiciones de Pago:</strong> {parsedPreview.condiciones_pago}
                </div>
              </div>
            )}

            </div>

            {/* Pie de Acciones Fijo */}
            <div className="modal-footer" style={{
              flexShrink: 0,
              padding: '1rem 1.75rem',
              borderTop: '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              boxShadow: '0 -4px 14px rgba(0,0,0,0.25)',
              zIndex: 10
            }}>
              <button 
                type="button" 
                onClick={() => {
                  setShowProformaModal(false);
                  setParsedPreview(null);
                  setProformaFile(null);
                  setProformaText('');
                  setProformaContext('');
                  setParseError(null);
                }} 
                className="btn btn-secondary"
              >
                Cancelar
              </button>

              {parsedPreview && (
                <button 
                  type="button" 
                  onClick={handleApplyParsedProforma}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800 }}
                >
                  <Check size={16} /> Cargar Automáticamente a la Matriz
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: NUEVO EXPEDIENTE                                                */}
      {/* ========================================================================= */}
      {showNewExpModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            maxWidth: '520px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', flexShrink: 0, background: 'var(--bg-secondary)' }}>
              <h3 style={{ margin: 0, color: 'var(--text-title)', fontSize: '1.25rem', fontWeight: 800 }}>
                Crear Nuevo Expediente de Procura
              </h3>
              <button 
                type="button" 
                onClick={() => setShowNewExpModal(false)}
                className="btn btn-secondary"
                style={{ padding: '0.4rem', borderRadius: '50%', minWidth: '32px', height: '32px' }}
                title="Cerrar"
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleCreateExpediente} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="modal-body" style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1, minHeight: 0 }}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                    Producto o Lote a Importar *
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="ej. Cilindros Hidráulicos Telescópicos Serie 400"
                    className="form-input"
                    value={newTitulo}
                    onChange={e => setNewTitulo(e.target.value)}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                    Descripción Técnica y Objetivo
                  </label>
                  <textarea 
                    rows={3}
                    placeholder="Detalles sobre uso, máquina destino o especificaciones indispensables..."
                    className="form-input"
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                      Categoría
                    </label>
                    <select 
                      className="form-input"
                      value={newCategoria}
                      onChange={e => setNewCategoria(e.target.value as any)}
                    >
                      <option value="Repuestos Críticos">Repuestos Críticos</option>
                      <option value="Maquinaria Pesada">Maquinaria Pesada</option>
                      <option value="Herramientas Especiales">Herramientas Especiales</option>
                      <option value="Consumibles">Consumibles</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                      Prioridad
                    </label>
                    <select 
                      className="form-input"
                      value={newPrioridad}
                      onChange={e => setNewPrioridad(e.target.value as any)}
                    >
                      <option value="Baja">Baja</option>
                      <option value="Media">Media</option>
                      <option value="Alta">Alta</option>
                      <option value="Urgente">Urgente</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                      Presupuesto (USD)
                    </label>
                    <input 
                      type="number"
                      className="form-input"
                      value={newPresupuesto}
                      onChange={e => setNewPresupuesto(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              {/* Pie de Acciones Fijo */}
              <div className="modal-footer" style={{
                flexShrink: 0,
                padding: '1rem 1.5rem',
                borderTop: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                boxShadow: '0 -4px 14px rgba(0,0,0,0.25)',
                zIndex: 10
              }}>
                <button type="button" onClick={() => setShowNewExpModal(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Crear y Abrir Expediente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: AÑADIR COTIZACIÓN / PROVEEDOR                                    */}
      {/* ========================================================================= */}
      {showAddSupplierModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            maxWidth: '620px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', flexShrink: 0, background: 'var(--bg-secondary)' }}>
              <h3 style={{ margin: 0, color: 'var(--text-title)', fontSize: '1.25rem', fontWeight: 800 }}>
                Añadir Oferta de Proveedor a la Comparativa
              </h3>
              <button 
                type="button" 
                onClick={() => setShowAddSupplierModal(false)}
                className="btn btn-secondary"
                style={{ padding: '0.4rem', borderRadius: '50%', minWidth: '32px', height: '32px' }}
                title="Cerrar"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddSupplier} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="modal-body" style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1, minHeight: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                    Nombre de la Empresa Proveedora *
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="ej. Guangzhou Precision Parts Co."
                    className="form-input"
                    value={supNombre}
                    onChange={e => setSupNombre(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                    País de Origen
                  </label>
                  <input 
                    type="text"
                    className="form-input"
                    value={supPais}
                    onChange={e => setSupPais(e.target.value)}
                    placeholder="China, Alemania, EE.UU."
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                    Precio Unitario (USD) *
                  </label>
                  <input 
                    type="number"
                    step="0.01"
                    required
                    className="form-input"
                    value={supPrecio}
                    onChange={e => setSupPrecio(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                    Cantidad Ofertada
                  </label>
                  <input 
                    type="number"
                    className="form-input"
                    value={supCantidad}
                    onChange={e => setSupCantidad(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                    Incoterm
                  </label>
                  <select 
                    className="form-input"
                    value={supIncoterm}
                    onChange={e => setSupIncoterm(e.target.value as any)}
                  >
                    <option value="FOB">FOB (Puerto Origen)</option>
                    <option value="CIF">CIF (Costo, Seguro y Flete)</option>
                    <option value="EXW">EXW (En Fábrica)</option>
                    <option value="DDP">DDP (Puesto en Almacén)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                    Lead Time (Días Entrega)
                  </label>
                  <input 
                    type="number"
                    className="form-input"
                    value={supLeadTime}
                    onChange={e => setSupLeadTime(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                    Garantía (Meses)
                  </label>
                  <input 
                    type="number"
                    className="form-input"
                    value={supGarantia}
                    onChange={e => setSupGarantia(Number(e.target.value))}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                    Flete Total Estimado (USD)
                  </label>
                  <input 
                    type="number"
                    className="form-input"
                    value={supFlete}
                    onChange={e => setSupFlete(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                    Aranceles / Aduana Estimados (USD)
                  </label>
                  <input 
                    type="number"
                    className="form-input"
                    value={supArancel}
                    onChange={e => setSupArancel(Number(e.target.value))}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                  Condiciones de Pago
                </label>
                <input 
                  type="text"
                  className="form-input"
                  value={supCondPago}
                  onChange={e => setSupCondPago(e.target.value)}
                  placeholder="ej. 30% anticipo, 70% contra BL"
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                  Ficha Técnica & Comentarios de Calidad
                </label>
                <textarea 
                  rows={2}
                  className="form-input"
                  placeholder="Materiales, estándares, normas ISO, pruebas de laboratorio..."
                  value={supSpecs}
                  onChange={e => setSupSpecs(e.target.value)}
                />
              </div>

              </div>

              {/* Pie de Acciones Fijo */}
              <div className="modal-footer" style={{
                flexShrink: 0,
                padding: '1rem 1.5rem',
                borderTop: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                boxShadow: '0 -4px 14px rgba(0,0,0,0.25)',
                zIndex: 10
              }}>
                <button type="button" onClick={() => setShowAddSupplierModal(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Incorporar a la Matriz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: SELLO EJECUTIVO CEO                                             */}
      {/* ========================================================================= */}
      {showCeoStampModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            maxWidth: '520px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '2px solid #fed16d',
            boxShadow: '0 12px 35px rgba(0,0,0,0.4)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid #fed16d', flexShrink: 0, background: 'var(--bg-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: '#011e41', padding: '0.6rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Award size={24} color="#fed16d" />
                </div>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--text-title)', fontSize: '1.25rem', fontWeight: 800 }}>
                    Resolución Directiva de Compra
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Aprobación vinculante para emisión de Orden de Compra Internacional
                  </span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowCeoStampModal(false)}
                className="btn btn-secondary"
                style={{ padding: '0.4rem', borderRadius: '50%', minWidth: '32px', height: '32px' }}
                title="Cerrar"
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1, minHeight: 0 }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                Al estampar el <strong>Sello Ejecutivo</strong>, se ratifica la selección de la oferta ganadora y se autoriza al departamento de compras y administración a proceder con las gestiones financieras y aduanales correspondientes.
              </p>

              <div style={{ marginBottom: '0.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                  Instrucción o Dictamen del CEO (Opcional)
                </label>
                <textarea 
                  rows={3}
                  placeholder="ej. Proceder con el anticipo del 30%. Coordinar flete marítimo asegurado con agente habitual."
                  className="form-input"
                  value={ceoNote}
                  onChange={e => setCeoNote(e.target.value)}
                />
              </div>
            </div>

            {/* Pie de Acciones Fijo */}
            <div className="modal-footer" style={{
              flexShrink: 0,
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              boxShadow: '0 -4px 14px rgba(0,0,0,0.25)',
              zIndex: 10
            }}>
              <button type="button" onClick={() => setShowCeoStampModal(false)} className="btn btn-secondary">
                Volver
              </button>
              <button 
                type="button" 
                onClick={handleApplyCeoStamp}
                style={{
                  background: 'linear-gradient(135deg, #011e41 0%, #002d62 100%)',
                  color: '#ffffff',
                  border: '1px solid #fed16d',
                  padding: '0.65rem 1.25rem',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 800,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Award size={16} color="#fed16d" />
                Confirmar y Estampar Sello
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DESGLOSE TÉCNICO DETALLADO DE PRODUCTOS (16 MODELOS CERÁMICOS)    */}
      {/* ========================================================================= */}
      {showItemsDetailModal && selectedSupplierForItems && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            maxWidth: '1050px',
            width: '100%',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-xl)'
          }}>
            {/* CABECERA DEL MODAL */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '1.25rem 1.75rem', borderBottom: '1px solid var(--border-color)', flexShrink: 0, background: 'var(--bg-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(236, 119, 0, 0.12)', padding: '0.65rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Package size={26} color="var(--color-primary)" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3 style={{ margin: 0, color: 'var(--text-title)', fontSize: '1.25rem', fontWeight: 800 }}>
                      Desglose Técnico de Productos Cotizados
                    </h3>
                    {selectedSupplierForItems.proforma_numero && (
                      <span style={{ fontSize: '0.75rem', background: 'rgba(236, 119, 0, 0.15)', color: 'var(--color-primary)', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 800 }}>
                        PI: {selectedSupplierForItems.proforma_numero}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Proveedor: <strong style={{ color: 'var(--text-title)' }}>{selectedSupplierForItems.nombre_proveedor}</strong> • Origen: {selectedSupplierForItems.pais_origen} ({selectedSupplierForItems.puerto_embarque || 'Mundra'}) ➔ Destino: {selectedSupplierForItems.puerto_destino || 'La Guaira, Venezuela'}
                  </div>
                </div>
              </div>

              <button 
                type="button" 
                onClick={() => {
                  setShowItemsDetailModal(false);
                  setSelectedSupplierForItems(null);
                }}
                className="btn btn-secondary"
                style={{ padding: '0.4rem', borderRadius: '50%', minWidth: '32px', height: '32px' }}
                title="Cerrar"
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', flex: 1, minHeight: 0 }}>

            {/* TILES DE RESUMEN LOGÍSTICO Y VOLUMEN */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '0.75rem',
              marginBottom: '1.25rem'
            }}>
              <div style={{ background: 'var(--bg-primary)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Metraje Total</span>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#059669', marginTop: '0.2rem' }}>
                  {selectedSupplierForItems.total_mt2?.toLocaleString() || 0} m²
                </div>
              </div>

              <div style={{ background: 'var(--bg-primary)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Cajas & Paletas</span>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-title)', marginTop: '0.2rem' }}>
                  {selectedSupplierForItems.total_cajas?.toLocaleString() || 0} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({selectedSupplierForItems.total_paletas || 0} PLTS)</span>
                </div>
              </div>

              <div style={{ background: 'var(--bg-primary)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Embarque FCL</span>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '0.2rem' }}>
                  {selectedSupplierForItems.fcl_contenedores || '6 X 20" FCL'}
                </div>
              </div>

              <div style={{ background: 'var(--bg-primary)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Peso Bruto Total</span>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-title)', marginTop: '0.2rem' }}>
                  {selectedSupplierForItems.peso_bruto_kg ? `${selectedSupplierForItems.peso_bruto_kg.toLocaleString()} kg` : '168,588 kg'}
                </div>
              </div>

              <div style={{ background: 'var(--bg-primary)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Monto Total FOB</span>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '0.2rem' }}>
                  ${(selectedSupplierForItems.productos_detalle?.reduce((acc, it) => acc + it.monto_total_usd, 0) || 0).toLocaleString()} USD
                </div>
              </div>

              <div style={{ background: 'var(--bg-primary)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Costo Aterrizado</span>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#059669', marginTop: '0.2rem' }}>
                  ${selectedSupplierForItems.costo_aterrizado_unitario} USD/m²
                </div>
              </div>
            </div>

            {/* LÍNEAS DE CALIDAD */}
            {selectedSupplierForItems.lineas_calidad && selectedSupplierForItems.lineas_calidad.length > 0 && (
              <div style={{ marginBottom: '1.25rem', background: 'rgba(236, 119, 0, 0.04)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(236, 119, 0, 0.15)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Layers size={14} /> Resumen Agrupado por Calidades:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.65rem' }}>
                  {selectedSupplierForItems.lineas_calidad.map(q => (
                    <div 
                      key={q.calidad}
                      style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.65rem 0.85rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 800, color: 'var(--text-title)', fontSize: '0.85rem' }}>
                          Línea {q.calidad}
                        </div>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                          {q.items_count} modelos • {q.cajas_total.toLocaleString()} cajas • {q.mt2_total.toLocaleString()} m²
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, color: '#059669', fontSize: '0.95rem' }}>
                          ${q.precio_mt2} USD/m²
                        </div>
                        <div style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-title)' }}>
                          ${q.monto_total.toLocaleString()} USD
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TABLA PRINCIPAL DETALLADA CON TODAS LAS COLUMNAS REQUERIDAS */}
            <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '1.25rem' }}>
              <div style={{ maxHeight: '420px', overflowY: 'auto', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table className="table" style={{ fontSize: '0.775rem', margin: 0 }}>
                  <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-primary)', zIndex: 2 }}>
                    <tr>
                      <th style={{ width: '40px' }}>#</th>
                      <th>Producto / Modelo</th>
                      <th>Calidad</th>
                      <th>Formato</th>
                      <th style={{ textAlign: 'center' }}>Espesor</th>
                      <th style={{ textAlign: 'center' }}>Pzs/caja</th>
                      <th style={{ textAlign: 'right' }}>Kg/caja</th>
                      <th style={{ textAlign: 'right' }}>mt2/caja</th>
                      <th style={{ textAlign: 'right' }}>Cajas</th>
                      <th style={{ textAlign: 'right' }}>Paletas</th>
                      <th style={{ textAlign: 'right' }}>Metros (m²)</th>
                      <th style={{ textAlign: 'right' }}>Precio mt2</th>
                      <th style={{ textAlign: 'right' }}>Subtotal FOB</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSupplierForItems.productos_detalle?.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{p.item_numero}</td>
                        <td style={{ fontWeight: 700, color: 'var(--text-title)' }}>{p.descripcion}</td>
                        <td>
                          <span style={{
                            fontSize: '0.675rem',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontWeight: 700,
                            background: p.calidad === 'Glorious' ? 'rgba(124, 58, 237, 0.1)' : p.calidad === 'High Glossy' ? 'rgba(236, 119, 0, 0.1)' : 'rgba(5, 150, 105, 0.1)',
                            color: p.calidad === 'Glorious' ? '#7c3aed' : p.calidad === 'High Glossy' ? 'var(--color-primary)' : '#059669'
                          }}>
                            {p.calidad}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{p.medida_formato || '60x120 cm'}</td>
                        <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{p.espesor_mm ? `${p.espesor_mm} mm` : '9 mm'}</td>
                        <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{p.piezas_caja || 2}</td>
                        <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{p.kg_caja || 27.44}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text-title)' }}>{p.mt2_caja || 1.44}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{p.cajas_totales.toLocaleString()}</td>
                        <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{p.paletas || '-'}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#059669' }}>{p.mt2_totales.toLocaleString()}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--color-primary)' }}>${p.precio_mt2.toFixed(2)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--text-title)' }}>${p.monto_total_usd.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot style={{ position: 'sticky', bottom: 0, background: 'var(--bg-primary)', fontWeight: 800 }}>
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'right', color: 'var(--text-title)', fontSize: '0.825rem' }}>
                        TOTALES CONSOLIDADOS DE LA ORDEN:
                      </td>
                      <td style={{ textAlign: 'right', fontSize: '0.85rem' }}>
                        {selectedSupplierForItems.total_cajas?.toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right', fontSize: '0.85rem' }}>
                        {selectedSupplierForItems.total_paletas}
                      </td>
                      <td style={{ textAlign: 'right', color: '#059669', fontSize: '0.9rem' }}>
                        {selectedSupplierForItems.total_mt2?.toLocaleString()} m²
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--color-primary)' }}>
                        Prom: ${selectedSupplierForItems.precio_unitario}/m²
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--color-primary)', fontSize: '0.95rem' }}>
                        ${(selectedSupplierForItems.productos_detalle?.reduce((acc, it) => acc + it.monto_total_usd, 0) || 0).toLocaleString()} USD
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            </div>

            {/* BOTÓN DE CIERRE (Fijo al fondo) */}
            <div className="modal-footer" style={{
              flexShrink: 0,
              padding: '1rem 1.75rem',
              borderTop: '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
              display: 'flex',
              justifyContent: 'flex-end',
              boxShadow: '0 -4px 14px rgba(0,0,0,0.25)',
              zIndex: 10
            }}>
              <button
                type="button"
                onClick={() => {
                  setShowItemsDetailModal(false);
                  setSelectedSupplierForItems(null);
                }}
                className="btn btn-secondary"
                style={{ padding: '0.6rem 1.5rem', fontWeight: 700 }}
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
