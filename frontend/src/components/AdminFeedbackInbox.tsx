import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { StakeholderFeedback } from '../types';
import { 
  MessageSquare, 
  Copy, 
  Check, 
  Trash2, 
  AlertTriangle, 
  Flame, 
  Lightbulb, 
  Sparkles, 
  RefreshCw, 
  Search,
  User,
  Calendar,
  Clock,
  Layers,
  XCircle
} from 'lucide-react';

export const AdminFeedbackInbox: React.FC = () => {
  const { token } = useAuth();
  const [feedbacks, setFeedbacks] = useState<StakeholderFeedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Filters
  const [filterUsuario, setFilterUsuario] = useState<string>('todos');
  const [filterFecha, setFilterFecha] = useState<string>('todos');
  const [filterImpacto, setFilterImpacto] = useState<string>('todos');
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [filterModulo, setFilterModulo] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Editing note states
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const fetchFeedbacks = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/feedback', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setFeedbacks(data);
      }
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, [token]);

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/feedback/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ estado: newStatus })
      });
      if (res.ok) {
        const updated = await res.json();
        setFeedbacks(prev => prev.map(f => f.id === id ? updated : f));
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleSaveNote = async (id: number) => {
    setSavingNote(true);
    try {
      const res = await fetch(`/api/feedback/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notas_admin: noteText })
      });
      if (res.ok) {
        const updated = await res.json();
        setFeedbacks(prev => prev.map(f => f.id === id ? updated : f));
        setEditingNoteId(null);
        setNoteText('');
      }
    } catch (err) {
      console.error('Error saving note:', err);
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteFeedback = async (id: number) => {
    if (!window.confirm('¿Seguro que deseas eliminar este registro de feedback?')) return;
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setFeedbacks(prev => prev.filter(f => f.id !== id));
      }
    } catch (err) {
      console.error('Error deleting feedback:', err);
    }
  };

  const copyAiPrompt = (f: StakeholderFeedback) => {
    const prompt = `# EVALUACIÓN AGÉNTICA DE FEEDBACK PILOTO

## CONTEXTO DEL STAKEHOLDER
- **Usuario**: ${f.nombre_usuario || 'Desconocido'}
- **Rol Ejecutivo**: ${f.rol_usuario || 'Usuario'}
- **Departamento**: ${f.departamento || 'Sin especificar'}
- **Módulo Afectado**: ${f.modulo_actual}
- **URL / Ruta**: ${f.url_path || 'N/A'}
- **Dispositivo**: ${f.dispositivo || 'N/A'}
- **Impacto Reportado**: ${f.impacto.toUpperCase()}
- **Fecha y Hora**: ${new Date(f.creado_en).toLocaleString('es-ES')}

## REPORTE DEL STAKEHOLDER
### 1. Problema u Obstáculo:
> "${f.problema_obstaculo}"

### 2. Solución Propuesta por el Usuario:
> "${f.solucion_propuesta ? f.solucion_propuesta : 'No propuso solución técnica específica.'}"

---
## INSTRUCCIONES PARA EL ASISTENTE IA (ANTIGRAVITY):
Actúa como Arquitecto de Software Principal y Negociador Ejecutivo. Analiza este feedback y genera:
1. **Diagnóstico Técnico & Viabilidad**: ¿Afecta base de datos, backend o solo frontend? Nivel de riesgo y estimación de esfuerzo.
2. **Causa Raíz vs Síntoma**: ¿La solución que plantea el stakeholder resuelve la raíz o solo un síntoma? ¿Cuál es la solución óptima y más rápida?
3. **Estrategia de Negociación e Influencia**:
   - Cómo redactarle la respuesta al stakeholder (${f.rol_usuario || 'Usuario'}).
   - Justificación ejecutiva (enfoque en tiempo, costos o confiabilidad).
   - Qué acordar de inmediato y qué diferir de forma diplomática.
4. **Plan de Acción y Código**: Propón las modificaciones exactas listas para aplicar.`;

    navigator.clipboard.writeText(prompt);
    setCopiedId(f.id);
    setTimeout(() => {
      setCopiedId(null);
    }, 3000);
  };

  // Distinct list of authors for the user filter
  const uniqueAuthors = useMemo(() => {
    const map = new Map<string, { id?: string | null; name: string; role: string }>();
    feedbacks.forEach(f => {
      const displayName = f.nombre_usuario || f.nombre_completo || 'Anónimo';
      const key = f.usuario_id || displayName;
      if (!map.has(key)) {
        map.set(key, {
          id: f.usuario_id,
          name: displayName,
          role: f.rol_usuario || 'Usuario'
        });
      }
    });
    return Array.from(map.values());
  }, [feedbacks]);

  // Filter feedbacks
  const filtered = useMemo(() => {
    return feedbacks.filter(f => {
      // 1. Filtro Usuario
      if (filterUsuario !== 'todos') {
        const authorName = f.nombre_usuario || f.nombre_completo || '';
        const matchesUser = authorName === filterUsuario || 
                            f.usuario_id === filterUsuario || 
                            f.handle_usuario === filterUsuario;
        if (!matchesUser) return false;
      }

      // 2. Filtro Estado
      if (filterEstado !== 'todos' && f.estado !== filterEstado) return false;

      // 3. Filtro Impacto / Urgencia
      if (filterImpacto !== 'todos' && f.impacto !== filterImpacto) return false;

      // 4. Filtro Módulo
      if (filterModulo !== 'todos' && f.modulo_actual !== filterModulo) return false;

      // 5. Filtro Fecha
      if (filterFecha !== 'todos') {
        const feedbackDate = new Date(f.creado_en);
        const now = new Date();
        if (filterFecha === 'hoy') {
          const isSameDay = feedbackDate.toDateString() === now.toDateString();
          if (!isSameDay) return false;
        } else if (filterFecha === 'semana') {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(now.getDate() - 7);
          if (feedbackDate < sevenDaysAgo) return false;
        } else if (filterFecha === 'mes') {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(now.getDate() - 30);
          if (feedbackDate < thirtyDaysAgo) return false;
        }
      }

      // 6. Barra de Búsqueda por texto (nombre, handle, rol, problema, solucion, modulo)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchText = (f.problema_obstaculo || '').toLowerCase() + 
                          ' ' + (f.solucion_propuesta || '').toLowerCase() + 
                          ' ' + (f.nombre_usuario || '').toLowerCase() + 
                          ' ' + (f.nombre_completo || '').toLowerCase() + 
                          ' ' + (f.handle_usuario || '').toLowerCase() + 
                          ' ' + (f.rol_usuario || '').toLowerCase() + 
                          ' ' + (f.modulo_actual || '').toLowerCase();
        if (!matchText.includes(term)) return false;
      }

      return true;
    });
  }, [feedbacks, filterUsuario, filterEstado, filterImpacto, filterModulo, filterFecha, searchTerm]);

  const hasActiveFilters = filterUsuario !== 'todos' || 
                          filterEstado !== 'todos' || 
                          filterImpacto !== 'todos' || 
                          filterModulo !== 'todos' || 
                          filterFecha !== 'todos' || 
                          Boolean(searchTerm.trim());

  const handleClearFilters = () => {
    setFilterUsuario('todos');
    setFilterEstado('todos');
    setFilterImpacto('todos');
    setFilterModulo('todos');
    setFilterFecha('todos');
    setSearchTerm('');
  };

  const pendingCount = feedbacks.filter(f => f.estado === 'pendiente').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Top Banner / Stats */}
      <div 
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          padding: '1.25rem 1.5rem',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div 
            style={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #ff9233 0%, #ec7700 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(236, 119, 0, 0.35)'
            }}
          >
            <Sparkles size={22} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-title)' }}>
              Buzón de Feedbacks del Piloto (Stakeholders & Directivos)
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Supervisión consolidada de observaciones ({feedbacks.length} registradas en el sistema).
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {pendingCount > 0 && (
            <div 
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '0.4rem 0.85rem',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Flame size={14} />
              <span>{pendingCount} {pendingCount === 1 ? 'pendiente de revisión' : 'pendientes de revisión'}</span>
            </div>
          )}

          <button
            onClick={fetchFeedbacks}
            className="btn"
            style={{
              padding: '0.45rem 0.85rem',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
            title="Refrescar lista"
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refrescar</span>
          </button>
        </div>
      </div>

      {/* Filters Bar Completo: Usuario, Fecha, Urgencia, Estado, Módulo y Búsqueda */}
      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          backgroundColor: 'var(--bg-secondary)',
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)'
        }}
      >
        {/* Fila 1: Barra de búsqueda */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px', position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2rem', width: '100%', fontSize: '0.825rem' }}
              placeholder="Buscar por texto, usuario (ej. Presidente), cargo, problema o módulo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="btn"
              style={{
                padding: '0.4rem 0.75rem',
                fontSize: '0.775rem',
                color: 'var(--color-danger)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
              title="Restablecer todos los filtros"
            >
              <XCircle size={14} />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>

        {/* Fila 2: Selectores de Filtro Específicos */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', alignItems: 'center' }}>
          
          {/* 1. Filtro Usuario */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <User size={13} color="var(--color-primary)" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Usuario:</span>
            <select
              className="form-select"
              style={{ fontSize: '0.775rem', padding: '0.35rem 0.65rem' }}
              value={filterUsuario}
              onChange={(e) => setFilterUsuario(e.target.value)}
            >
              <option value="todos">Todos los usuarios ({uniqueAuthors.length})</option>
              {uniqueAuthors.map(a => (
                <option key={a.name} value={a.name}>
                  {a.name} ({a.role})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Filtro Fecha */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Calendar size={13} color="#3b82f6" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Fecha:</span>
            <select
              className="form-select"
              style={{ fontSize: '0.775rem', padding: '0.35rem 0.65rem' }}
              value={filterFecha}
              onChange={(e) => setFilterFecha(e.target.value)}
            >
              <option value="todos">Cualquier fecha</option>
              <option value="hoy">Hoy</option>
              <option value="semana">Últimos 7 días</option>
              <option value="mes">Últimos 30 días</option>
            </select>
          </div>

          {/* 3. Filtro Urgencia / Impacto */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Flame size={13} color="#ef4444" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Urgencia:</span>
            <select
              className="form-select"
              style={{ fontSize: '0.775rem', padding: '0.35rem 0.65rem' }}
              value={filterImpacto}
              onChange={(e) => setFilterImpacto(e.target.value)}
            >
              <option value="todos">Todos los impactos</option>
              <option value="bloqueo">🚨 Bloquea mi trabajo</option>
              <option value="molestia">⚠️ Es una molestia</option>
              <option value="mejora">💡 Idea de mejora</option>
            </select>
          </div>

          {/* 4. Filtro Estado */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Estado:</span>
            <select
              className="form-select"
              style={{ fontSize: '0.775rem', padding: '0.35rem 0.65rem' }}
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
            >
              <option value="todos">Todos los estados</option>
              <option value="pendiente">🟡 Pendiente</option>
              <option value="en_analisis">🔵 En Evaluación IA</option>
              <option value="implementado">🟢 Implementado</option>
              <option value="descartado">⚪ Descartado</option>
            </select>
          </div>

          {/* 5. Filtro Módulo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Layers size={13} color="var(--text-secondary)" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Módulo:</span>
            <select
              className="form-select"
              style={{ fontSize: '0.775rem', padding: '0.35rem 0.65rem' }}
              value={filterModulo}
              onChange={(e) => setFilterModulo(e.target.value)}
            >
              <option value="todos">Todos los módulos</option>
              <option value="inicio">Inicio / Mesa Directiva</option>
              <option value="operaciones">Operaciones y Taller</option>
              <option value="procura">Procura e Importaciones</option>
              <option value="catalogos">Catálogos Maestros</option>
              <option value="almacen">Despeje de Almacén</option>
              <option value="reportes">Filtros y Reportes PDF</option>
              <option value="usuarios">Gestión de Usuarios</option>
              <option value="auditoria">Logs de Auditoría</option>
            </select>
          </div>

        </div>
      </div>

      {/* Feedbacks List */}
      {loading && feedbacks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Cargando observaciones registradas...
        </div>
      ) : filtered.length === 0 ? (
        <div 
          style={{
            textAlign: 'center',
            padding: '3.5rem 1.5rem',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--border-color)',
            color: 'var(--text-muted)'
          }}
        >
          <MessageSquare size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
          <h4 style={{ margin: '0 0 0.4rem 0', color: 'var(--text-title)' }}>No hay feedbacks con los filtros seleccionados</h4>
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.825rem' }}>
            {hasActiveFilters ? 'Prueba ajustando o limpiando los filtros para ver todos los aportes.' : 'Aún no se han enviado observaciones en este entorno.'}
          </p>
          {hasActiveFilters && (
            <button onClick={handleClearFilters} className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}>
              Limpiar filtros aplicados
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map((item) => {
            const isCopied = copiedId === item.id;

            // Badges colors
            const impactConfig: Record<string, { label: string; bg: string; text: string; icon: any }> = {
              bloqueo: { label: '🚨 Bloqueo Operativo', bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', icon: Flame },
              molestia: { label: '⚠️ Molestia / Fricción', bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', icon: AlertTriangle },
              mejora: { label: '💡 Idea de Mejora', bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', icon: Lightbulb },
            };

            const impactMeta = impactConfig[item.impacto] || impactConfig.molestia;
            const ImpactIcon = impactMeta.icon;

            return (
              <div 
                key={item.id}
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: item.estado === 'pendiente' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.25rem 1.5rem',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.9rem',
                  position: 'relative'
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                  
                  {/* User info & badges */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                    {/* Avatar circle */}
                    <div 
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #011e41 0%, #002d62 100%)',
                        border: '2px solid #ff9233',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ff9233',
                        fontWeight: 800,
                        fontSize: '1rem',
                        flexShrink: 0,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        overflow: 'hidden'
                      }}
                    >
                      {item.foto_perfil ? (
                        <img src={item.foto_perfil} alt={item.nombre_usuario} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        (item.nombre_usuario || 'U').charAt(0).toUpperCase()
                      )}
                    </div>

                    <div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-title)' }}>
                          {item.nombre_usuario || 'Usuario Anónimo'}
                        </span>

                        {item.handle_usuario && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            @{item.handle_usuario}
                          </span>
                        )}
                        
                        <span 
                          style={{
                            backgroundColor: 'rgba(236, 119, 0, 0.15)',
                            color: 'var(--color-primary)',
                            border: '1px solid rgba(236, 119, 0, 0.35)',
                            padding: '0.15rem 0.6rem',
                            borderRadius: '12px',
                            fontSize: '0.725rem',
                            fontWeight: 700
                          }}
                        >
                          {item.rol_usuario || 'Usuario'}
                        </span>

                        {item.departamento && (
                          <span 
                            style={{
                              backgroundColor: 'rgba(100, 116, 139, 0.15)',
                              color: 'var(--text-secondary)',
                              padding: '0.15rem 0.55rem',
                              borderRadius: '12px',
                              fontSize: '0.725rem',
                              fontWeight: 600
                            }}
                          >
                            {item.departamento}
                          </span>
                        )}

                        <span 
                          style={{
                            backgroundColor: impactMeta.bg,
                            color: impactMeta.text,
                            padding: '0.15rem 0.55rem',
                            borderRadius: '12px',
                            fontSize: '0.725rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                        >
                          <ImpactIcon size={12} />
                          <span>{impactMeta.label}</span>
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', fontSize: '0.75rem', color: 'var(--text-muted)', alignItems: 'center' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Calendar size={13} color="#3b82f6" />
                          <span>{new Date(item.creado_en).toLocaleDateString('es-VE', { year: 'numeric', month: '2-digit', day: '2-digit' })}</span>
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Clock size={13} color="#10b981" />
                          <span>{new Date(item.creado_en).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</span>
                        </span>
                        <span>•</span>
                        <span>Módulo: <strong style={{ color: 'var(--text-primary)' }}>{item.modulo_actual}</strong></span>
                        {item.dispositivo && (
                          <>
                            <span>•</span>
                            <span>{item.dispositivo.split('(')[0]}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions: COPY FOR AI & STATUS SELECT */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    
                    {/* THE MAGIC BUTTON */}
                    <button
                      type="button"
                      onClick={() => copyAiPrompt(item)}
                      style={{
                        padding: '0.45rem 0.85rem',
                        borderRadius: '6px',
                        border: isCopied ? '1px solid #10b981' : '1px solid var(--color-primary)',
                        backgroundColor: isCopied ? 'rgba(16, 185, 129, 0.15)' : 'rgba(236, 119, 0, 0.12)',
                        color: isCopied ? '#10b981' : 'var(--color-primary)',
                        cursor: 'pointer',
                        fontWeight: 800,
                        fontSize: '0.775rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                      }}
                      title="Copia la ficha completa optimizada para analizar y resolver con Antigravity AI"
                    >
                      {isCopied ? <Check size={14} /> : <Copy size={14} />}
                      <span>{isCopied ? '¡Copiado para IA!' : '📋 Copiar Formato IA'}</span>
                    </button>

                    {/* Estado selector */}
                    <select
                      className="form-select"
                      style={{ 
                        fontSize: '0.775rem', 
                        padding: '0.4rem 0.65rem',
                        fontWeight: 700,
                        borderRadius: '6px'
                      }}
                      value={item.estado}
                      onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                    >
                      <option value="pendiente">🟡 Pendiente</option>
                      <option value="en_analisis">🔵 En Evaluación IA</option>
                      <option value="implementado">🟢 Implementado</option>
                      <option value="descartado">⚪ Descartado</option>
                    </select>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteFeedback(item.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '0.35rem',
                        borderRadius: '4px'
                      }}
                      title="Eliminar registro"
                    >
                      <Trash2 size={16} />
                    </button>

                  </div>

                </div>

                {/* Content: Problem & Solution */}
                <div 
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem'
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.725rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Problema / Fricción detectada:
                    </span>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-title)', lineHeight: '1.45', fontWeight: 500 }}>
                      {item.problema_obstaculo}
                    </p>
                  </div>

                  {item.solucion_propuesta && (
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                      <span style={{ fontSize: '0.725rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        💡 Solución propuesta por el usuario:
                      </span>
                      <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.45', fontStyle: 'italic' }}>
                        "{item.solucion_propuesta}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Admin notes & feedback to user */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.775rem' }}>
                  {editingNoteId === item.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
                      <input 
                        type="text" 
                        className="form-input" 
                        style={{ flex: 1, fontSize: '0.775rem', padding: '0.35rem 0.6rem' }}
                        placeholder="Escribe una respuesta o nota visible para el usuario..."
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                      />
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                        disabled={savingNote}
                        onClick={() => handleSaveNote(item.id)}
                      >
                        Guardar
                      </button>
                      <button 
                        className="btn" 
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                        onClick={() => { setEditingNoteId(null); setNoteText(''); }}
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <span style={{ color: item.notas_admin ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                        {item.notas_admin ? (
                          <><strong>Nota para el usuario:</strong> "{item.notas_admin}"</>
                        ) : (
                          'Sin notas de respuesta para el usuario.'
                        )}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingNoteId(item.id);
                          setNoteText(item.notas_admin || '');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-primary)',
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          textDecoration: 'underline'
                        }}
                      >
                        {item.notas_admin ? 'Editar respuesta' : '+ Añadir respuesta'}
                      </button>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
