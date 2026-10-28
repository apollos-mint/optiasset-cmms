import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { EmployeePerformance, EmployeeWarning } from '../types';
import { 
  BarChart3, 
  AlertTriangle, 
  Award, 
  Clock, 
  CheckCircle2, 
  ShieldAlert, 
  Plus, 
  History
} from 'lucide-react';

export const AdminPerformancePanel: React.FC = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState<EmployeePerformance[]>([]);
  const [warningsList, setWarningsList] = useState<EmployeeWarning[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'ranking' | 'historial'>('ranking');

  // Modal para emitir warning / incentivo
  const [showWarningModal, setShowWarningModal] = useState<boolean>(false);
  const [targetEmployeeId, setTargetEmployeeId] = useState<string>('');
  const [evalType, setEvalType] = useState<'Warning Leve' | 'Warning Grave' | 'Queja Formal' | 'Incentivo / Mérito'>('Warning Leve');
  const [evalReason, setEvalReason] = useState<string>('');
  const [evalActions, setEvalActions] = useState<string>('');
  const [submittingEval, setSubmittingEval] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchStats = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch('/api/performance/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        if (data.length > 0 && !targetEmployeeId) {
          setTargetEmployeeId(data[0].usuario_id);
        }
      }
    } catch (err) {
      console.error('Error al obtener estadísticas de rendimiento:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarnings = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/performance/warnings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWarningsList(data);
      }
    } catch (err) {
      console.error('Error al obtener historial de warnings:', err);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchWarnings();
  }, [token]);

  const handleCreateWarning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmittingEval(true);
    setModalError(null);

    try {
      const res = await fetch('/api/performance/warnings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          empleado_id: targetEmployeeId,
          tipo: evalType,
          motivo: evalReason,
          acciones_requeridas: evalActions
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al emitir evaluación.');
      }

      setShowWarningModal(false);
      setEvalReason('');
      setEvalActions('');
      fetchStats();
      fetchWarnings();
    } catch (err: any) {
      setModalError(err.message || 'Error al guardar evaluación.');
    } finally {
      setSubmittingEval(false);
    }
  };

  const openEvaluationModalForUser = (userId: string) => {
    setTargetEmployeeId(userId);
    setShowWarningModal(true);
  };

  // Cálculos globales
  const avgReadTime = stats.filter(s => s.avg_minutos_abrir !== null).length > 0
    ? Math.round(stats.reduce((acc, s) => acc + (s.avg_minutos_abrir || 0), 0) / stats.filter(s => s.avg_minutos_abrir !== null).length)
    : 0;
  const avgCompliance = stats.length > 0
    ? Math.round(stats.reduce((acc, s) => acc + s.tasa_cumplimiento, 0) / stats.length)
    : 100;
  const totalWarnings = stats.reduce((acc, s) => acc + s.warnings_count, 0);
  const totalIncentives = stats.reduce((acc, s) => acc + s.incentivos_count, 0);

  const formatMinutes = (mins: number | null) => {
    if (mins === null || mins === undefined) return 'Sin registros';
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    const rest = mins % 60;
    return `${hours}h ${rest > 0 ? `${rest}m` : ''}`;
  };

  return (
    <div>
      {/* Banner de Cabecera */}
      <div 
        className="card" 
        style={{ 
          padding: '1.5rem', 
          marginBottom: '1.5rem',
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(249, 115, 22, 0.05) 100%)',
          borderLeft: '4px solid var(--color-danger)'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <ShieldAlert size={20} style={{ color: 'var(--color-danger)' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-danger)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Módulo Exclusivo de Dirección & Administración
              </span>
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: 'var(--text-title)' }}>
              Panel de Evaluación de Personal, Latencia SLA & Decisiones Laborales
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, maxWidth: '750px' }}>
              Auditoría del tiempo que tarda cada trabajador en abrir solicitudes, tasa de resolución de tareas a tiempo, índice de amonestaciones/quejas e información para retención o incentivos.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowWarningModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#b91c1c', borderColor: '#b91c1c', fontWeight: 700 }}
          >
            <Plus size={16} />
            <span>Emitir Warning / Reconocimiento</span>
          </button>
        </div>
      </div>

      {/* Tarjetas KPI de Resumen General */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {/* KPI 1 */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Latencia Media de Lectura</span>
            <h3 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0 }}>{formatMinutes(avgReadTime)}</h3>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Cumplimiento de Plazo</span>
            <h3 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--color-success)' }}>{avgCompliance}%</h3>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Warnings Activos</span>
            <h3 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--color-danger)' }}>{totalWarnings}</h3>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Incentivos Registrados</span>
            <h3 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: '#eab308' }}>{totalIncentives}</h3>
          </div>
        </div>
      </div>

      {/* Pestañas de Vista */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button
          type="button"
          className={`btn ${activeTab === 'ranking' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('ranking')}
          style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <BarChart3 size={15} />
          <span>Matriz de Rendimiento de Empleados</span>
        </button>

        <button
          type="button"
          className={`btn ${activeTab === 'historial' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('historial')}
          style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <History size={15} />
          <span>Historial de Warnings y Quejas ({warningsList.length})</span>
        </button>
      </div>

      {/* Contenido según pestaña */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner" style={{ width: '36px', height: '36px' }}></div>
        </div>
      ) : activeTab === 'ranking' ? (
        <div className="card" style={{ padding: '1.25rem', overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem 0.5rem' }}>Empleado / Cargo</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Tareas (Asignadas / Hechas)</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Latencia Apertura (SLA)</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Cumplimiento Plazo</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Warnings / Incentivos</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Score Eficiencia</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Diagnóstico Empresarial</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {stats.map(s => {
                const isCritical = s.estado_semaforo === 'Critico';
                const isWarning = s.estado_semaforo === 'Observacion';

                return (
                  <tr 
                    key={s.usuario_id}
                    style={{ 
                      borderBottom: '1px solid var(--border-color)',
                      background: isCritical ? 'rgba(239, 68, 68, 0.04)' : 'transparent'
                    }}
                  >
                    <td style={{ padding: '0.85rem 0.5rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-title)' }}>{s.nombre}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{s.nombre_usuario} • {s.rol}</div>
                    </td>

                    <td style={{ padding: '0.85rem 0.5rem' }}>
                      <div style={{ fontWeight: 600 }}>
                        {s.completados} / {s.total_asignados}
                        {s.pendientes > 0 && <span style={{ color: 'var(--color-warning)', marginLeft: '0.3rem' }}>({s.pendientes} pend)</span>}
                      </div>
                      {s.vencidos > 0 && (
                        <div style={{ fontSize: '0.725rem', color: 'var(--color-danger)', fontWeight: 600 }}>
                          {s.vencidos} fuera de plazo
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '0.85rem 0.5rem' }}>
                      <div style={{ 
                        fontWeight: 700, 
                        color: (s.avg_minutos_abrir || 0) > 180 ? 'var(--color-danger)' : (s.avg_minutos_abrir || 0) > 60 ? 'var(--color-warning)' : 'var(--color-success)'
                      }}>
                        {formatMinutes(s.avg_minutos_abrir)}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Resolución: {formatMinutes(s.avg_minutos_completar)}
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <div style={{ flex: 1, minWidth: '60px', height: '6px', background: 'rgba(0,0,0,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div 
                            style={{ 
                              height: '100%', 
                              width: `${s.tasa_cumplimiento}%`, 
                              background: s.tasa_cumplimiento >= 80 ? 'var(--color-success)' : s.tasa_cumplimiento >= 50 ? 'var(--color-warning)' : 'var(--color-danger)'
                            }} 
                          />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.775rem' }}>{s.tasa_cumplimiento}%</span>
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 0.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <span className="badge" style={{ background: s.warnings_count > 0 ? '#ef4444' : 'rgba(255,255,255,0.05)', color: s.warnings_count > 0 ? '#fff' : 'var(--text-muted)' }}>
                          {s.warnings_count} warns
                        </span>
                        <span className="badge" style={{ background: s.incentivos_count > 0 ? '#eab308' : 'rgba(255,255,255,0.05)', color: s.incentivos_count > 0 ? '#000' : 'var(--text-muted)' }}>
                          {s.incentivos_count} méritos
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 0.5rem' }}>
                      <div style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        fontWeight: 800,
                        fontSize: '0.95rem',
                        background: isCritical ? 'rgba(239, 68, 68, 0.15)' : isWarning ? 'rgba(234, 179, 8, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: isCritical ? 'var(--color-danger)' : isWarning ? '#eab308' : 'var(--color-success)',
                        border: `2px solid ${isCritical ? 'var(--color-danger)' : isWarning ? '#eab308' : 'var(--color-success)'}`
                      }}>
                        {s.score_eficiencia}
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 0.5rem', maxWidth: '240px' }}>
                      <span style={{ fontSize: '0.775rem', fontWeight: 600, color: isCritical ? 'var(--color-danger)' : isWarning ? 'var(--color-warning)' : 'var(--text-title)' }}>
                        {s.recomendacion}
                      </span>
                    </td>

                    <td style={{ padding: '0.85rem 0.5rem', textAlign: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.725rem' }}
                        onClick={() => openEvaluationModalForUser(s.usuario_id)}
                        title="Emitir llamada de atención, warning formal o reconocimiento"
                      >
                        Evaluar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Historial de Warnings Emitidos */
        <div className="card" style={{ padding: '1.25rem' }}>
          {warningsList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              No se han emitido amonestaciones, warnings ni incentivos en el sistema.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {warningsList.map(w => {
                const isMerit = w.tipo === 'Incentivo / Mérito';
                return (
                  <div
                    key={w.id}
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      borderLeft: `4px solid ${isMerit ? '#eab308' : '#ef4444'}`,
                      background: 'rgba(255,255,255,0.02)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className={`badge ${isMerit ? 'badge-warning' : 'badge-danger'}`} style={{ fontWeight: 700 }}>
                          {w.tipo}
                        </span>
                        <span style={{ fontWeight: 700, color: 'var(--text-title)', fontSize: '0.9rem' }}>
                          {w.empleado_nombre} ({w.empleado_rol})
                        </span>
                      </div>
                      <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                        {new Date(w.fecha_creacion).toLocaleString()}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.5rem 0' }}>
                      <b>Motivo:</b> {w.motivo}
                    </div>

                    {w.acciones_requeridas && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)', background: 'rgba(236, 119, 0, 0.05)', padding: '0.4rem 0.6rem', borderRadius: '4px', marginBottom: '0.4rem' }}>
                        <b>Acción / Plan Requerido:</b> {w.acciones_requeridas}
                      </div>
                    )}

                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                      Emitido por: {w.emisor_nombre || 'Dirección General'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EMITIR WARNING / INCENTIVO / LLAMADO DE ATENCIÓN  */}
      {/* ========================================================= */}
      {showWarningModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '550px', width: '90%' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.15rem' }}>
                <AlertTriangle style={{ color: evalType === 'Incentivo / Mérito' ? '#eab308' : 'var(--color-danger)' }} />
                <span>Registro de Evaluación & Dictamen Disciplinario</span>
              </h3>
              <button 
                type="button" 
                className="modal-close" 
                onClick={() => setShowWarningModal(false)}
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div style={{ margin: '1rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateWarning} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="modal-body" style={{ padding: '1.25rem', overflowY: 'auto', flex: 1, minHeight: 0 }}>
              <div className="form-group">
                <label className="form-label">Empleado a Evaluar *</label>
                <select 
                  className="form-input"
                  value={targetEmployeeId}
                  onChange={e => setTargetEmployeeId(e.target.value)}
                  required
                >
                  {stats.map(s => (
                    <option key={s.usuario_id} value={s.usuario_id}>
                      {s.nombre} (@{s.nombre_usuario} - {s.rol})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Tipo de Notificación *</label>
                <select 
                  className="form-input"
                  value={evalType}
                  onChange={e => setEvalType(e.target.value as any)}
                  required
                >
                  <option value="Warning Leve">⚠️ Warning Leve (Llamado de atención por tardanza/descuido)</option>
                  <option value="Warning Grave">🚨 Warning Grave (Incumplimiento reiterado de entregas / apertura)</option>
                  <option value="Queja Formal">📋 Queja Formal (Amonestación disciplinaria de RRHH)</option>
                  <option value="Incentivo / Mérito">🌟 Incentivo / Mérito (Reconocimiento por rapidez y excelencia)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Motivo y Justificación *</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Detalla el motivo del warning (ej: Demoró más de 12 horas en abrir solicitud urgente de reparación; incumplió deadline de entrega...)"
                  value={evalReason}
                  onChange={e => setEvalReason(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Acciones Requeridas o Plan de Formación / Corrección</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Compromiso de apertura en menos de 30 min; sesión de capacitación técnica..."
                  value={evalActions}
                  onChange={e => setEvalActions(e.target.value)}
                />
              </div>

              </div>

              {/* Pie de Acciones Fijo */}
              <div className="modal-footer" style={{
                flexShrink: 0,
                padding: '1rem 1.25rem',
                borderTop: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                boxShadow: '0 -4px 12px rgba(0,0,0,0.15)',
                zIndex: 10
              }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowWarningModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    background: evalType === 'Incentivo / Mérito' ? '#eab308' : '#b91c1c',
                    borderColor: evalType === 'Incentivo / Mérito' ? '#eab308' : '#b91c1c'
                  }}
                  disabled={submittingEval}
                >
                  {submittingEval ? 'Registrando...' : 'Emitir y Notificar al Empleado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
