import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Checklist } from '../types';
import { 
  Home, 
  ClipboardList, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  ArrowRight,
  UserCheck,
  BarChart3,
  PlayCircle
} from 'lucide-react';
import { CorporateTicketsHub } from './CorporateTicketsHub';
import { AdminPerformancePanel } from './AdminPerformancePanel';

interface HomeDashboardProps {
  onViewReport: (checklistId: string) => void;
  selectedTicketId?: string | null;
  onClearSelectedTicketId?: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({ 
  onViewReport, 
  selectedTicketId, 
  onClearSelectedTicketId 
}) => {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'proyectos' | 'inspecciones' | 'rendimiento'>('proyectos');
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChecklists = async () => {
      try {
        const res = await fetch('/api/checklists', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (!res.ok) throw new Error('Fallo al cargar checklists');
        const data = await res.json();
        setChecklists(data);
      } catch (err: any) {
        setError(err.message || 'Error al obtener datos');
      } finally {
        setLoading(false);
      }
    };

    fetchChecklists();
  }, [token]);

  useEffect(() => {
    if (selectedTicketId) {
      setActiveTab('proyectos');
    }
  }, [selectedTicketId]);

  // Calculations for stats
  const totalInspections = checklists.length;
  const auditedChecklists = checklists.filter(c => !!c.respuestas_detalle?.firma_auditoria);
  const pendingChecklists = checklists.filter(c => !c.respuestas_detalle?.firma_auditoria);
  const totalAudited = auditedChecklists.length;
  const totalPending = pendingChecklists.length;

  // Recent checklists (last 5)
  const recentChecklists = checklists.slice(0, 5);

  // Pending audit (last 5 or all)
  const recentPending = pendingChecklists.slice(0, 5);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '6rem' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--color-primary)', borderRadius: '50%' }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="view-container">
        <div className="card" style={{ padding: '2rem', border: '1px solid var(--color-danger)', background: 'rgba(177, 32, 40, 0.08)', borderRadius: 'var(--radius-md)' }}>
          <h3 style={{ color: 'var(--color-danger)', marginBottom: '0.5rem' }}>Error al cargar el panel</h3>
          <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="view-container">
      {/* Selector de Sub-pestañas en Home */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', marginBottom: '1.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
        <button
          type="button"
          className={`btn ${activeTab === 'proyectos' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('proyectos')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 700 }}
        >
          <Home size={16} />
          <span>Home</span>
        </button>

        <button
          type="button"
          className={`btn ${activeTab === 'inspecciones' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('inspecciones')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 700 }}
        >
          <ClipboardList size={16} />
          <span>Inspecciones & Flota</span>
        </button>

        {(user?.rol === 'Administrador' || user?.permisos?.acceder_rendimiento) && (
          <button
            type="button"
            className={`btn ${activeTab === 'rendimiento' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('rendimiento')}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              fontSize: '0.85rem', 
              fontWeight: 700,
              background: activeTab === 'rendimiento' ? '#b91c1c' : undefined,
              borderColor: activeTab === 'rendimiento' ? '#b91c1c' : undefined,
              color: activeTab === 'rendimiento' ? '#fff' : undefined
            }}
          >
            <BarChart3 size={16} />
            <span>Auditoría de Rendimiento & Warnings</span>
          </button>
        )}

        <a
          href="/guia_presidencia_v3.mp4"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            fontSize: '0.825rem',
            fontWeight: 700,
            marginLeft: 'auto',
            background: 'linear-gradient(135deg, rgba(255, 146, 51, 0.15) 0%, rgba(236, 119, 0, 0.25) 100%)',
            borderColor: '#ff9233',
            color: '#ff9233',
            textDecoration: 'none',
            padding: '0.4rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 2px 8px rgba(236, 119, 0, 0.2)'
          }}
          title="Ver o reproducir Video Guía para Presidencia y Dirección"
        >
          <PlayCircle size={16} />
          <span>📹 Video Guía Presidencia</span>
        </a>
      </div>

      {activeTab === 'proyectos' && (
        <CorporateTicketsHub 
          initialTicketId={selectedTicketId} 
          onClearInitialTicket={onClearSelectedTicketId} 
        />
      )}

      {activeTab === 'rendimiento' && (
        <AdminPerformancePanel />
      )}

      {activeTab === 'inspecciones' && (
        <>
          {/* KPI Stats Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        
        {/* KPI 1 */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: 'var(--radius-sm)', 
            background: 'rgba(59, 130, 246, 0.1)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'var(--color-primary)'
          }}>
            <ClipboardList size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Inspecciones</span>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>{totalInspections}</h3>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: 'var(--radius-sm)', 
            background: 'rgba(16, 185, 129, 0.1)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'var(--color-success)'
          }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Auditados / Firmados</span>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--color-success)' }}>{totalAudited}</h3>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: 'var(--radius-sm)', 
            background: '#fed16d', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#011e41'
          }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Pendientes de Auditoría</span>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: '#011e41', background: '#fed16d', padding: '0.1rem 0.5rem', borderRadius: '6px', display: 'inline-block' }}>{totalPending}</h3>
          </div>
        </div>

      </div>

      {/* Main Grid: Pending vs Recent */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: '1.5rem' }}>
        
        {/* Column 1: Pending Audit Checklists */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserCheck size={18} style={{ color: 'var(--color-warning)' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Pendientes de Firma de Auditoría</h3>
            </div>
            <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
              {totalPending} pendientes
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
            {recentPending.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', gap: '0.5rem', flex: 1 }}>
                <CheckCircle2 size={32} style={{ color: 'var(--color-success)' }} />
                <span style={{ fontSize: '0.85rem' }}>¡Todos los checklists están firmados y auditados!</span>
              </div>
            ) : (
              recentPending.map(c => {
                const isFuga = c.respuestas_detalle.fugas?.aceite === 'Si' || 
                               c.respuestas_detalle.fugas?.combustible === 'Si' || 
                               c.respuestas_detalle.fugas?.refrigerante === 'Si';
                return (
                  <div key={c.id} style={{ 
                    padding: '1rem', 
                    background: 'rgba(255,255,255,0.02)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all var(--transition-fast)'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span className="badge badge-info" style={{ fontWeight: 600 }}>{c.placa || 'Interno'}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(c.fecha).toLocaleDateString()} {new Date(c.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <span>Inspector: <b>{c.inspector}</b></span>
                        {isFuga && <span style={{ marginLeft: '0.5rem', color: 'var(--color-danger)', fontWeight: 600 }}>⚠️ Fuga Detectada</span>}
                      </div>
                    </div>
                    
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }} 
                      onClick={() => onViewReport(c.id)}
                    >
                      <span>Revisar y Firmar</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 2: Recent Checklists Completed */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={18} style={{ color: 'var(--color-primary)' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Últimos Checklists Completados</h3>
            </div>
            <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
              Total: {totalInspections}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
            {recentChecklists.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', gap: '0.5rem', flex: 1 }}>
                <ClipboardList size={32} />
                <span style={{ fontSize: '0.85rem' }}>Aún no se han completado checklists</span>
              </div>
            ) : (
              recentChecklists.map(c => {
                const hasFirma = !!c.respuestas_detalle?.firma_auditoria;
                return (
                  <div key={c.id} style={{ 
                    padding: '1rem', 
                    background: 'rgba(255,255,255,0.02)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all var(--transition-fast)'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span className="badge badge-info" style={{ fontWeight: 600 }}>{c.placa || 'Interno'}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(c.fecha).toLocaleDateString()} {new Date(c.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <span>Inspector: <b>{c.inspector}</b></span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {hasFirma ? (
                        <span style={{ color: 'var(--color-success)', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: 600 }}>
                          <CheckCircle2 size={12} />
                          <span>Auditado</span>
                        </span>
                      ) : (
                        <span style={{ color: '#011e41', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: 700, background: '#fed16d', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                          <AlertTriangle size={12} style={{ color: '#011e41' }} />
                          <span>Pendiente</span>
                        </span>
                      )}
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }} 
                        onClick={() => onViewReport(c.id)}
                      >
                        <span>Ver</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

        </>
      )}

    </div>
  );
};
