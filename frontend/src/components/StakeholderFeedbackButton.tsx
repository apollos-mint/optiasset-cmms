import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { StakeholderFeedback } from '../types';
import { SpanishSpellAssistant } from './SpanishSpellAssistant';
import { 
  MessageSquarePlus, 
  X, 
  Send, 
  CheckCircle, 
  AlertTriangle, 
  Lightbulb, 
  Flame, 
  Smartphone, 
  Laptop, 
  MapPin, 
  UserCheck, 
  History, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface StakeholderFeedbackButtonProps {
  currentTab: string;
  onNavigateToAdminFeedbacks?: () => void;
}

export const StakeholderFeedbackButton: React.FC<StakeholderFeedbackButtonProps> = ({ 
  currentTab,
  onNavigateToAdminFeedbacks
}) => {
  const { user, token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'nuevo' | 'historial'>('nuevo');
  
  // Form fields
  const [problema, setProblema] = useState('');
  const [solucion, setSolucion] = useState('');
  const [impacto, setImpacto] = useState<'bloqueo' | 'molestia' | 'mejora'>('molestia');
  
  // Submission state
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // User's own feedbacks
  const [myFeedbacks, setMyFeedbacks] = useState<StakeholderFeedback[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Auto-detect device
  const isMobile = typeof window !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  const deviceLabel = isMobile ? 'Dispositivo Móvil' : 'Computador de Escritorio';

  // Format module name in friendly Spanish
  const tabNames: Record<string, string> = {
    inicio: 'Inicio / Mesa Directiva',
    operaciones: 'Operaciones y Taller',
    procura: 'Procura e Importaciones',
    catalogos: 'Catálogos Maestros',
    almacen: 'Despeje de Almacén',
    reportes: 'Reportes y Búsqueda',
    usuarios: 'Gestión de Usuarios y Roles',
    auditoria: 'Logs de Auditoría',
  };

  const friendlyTabName = tabNames[currentTab] || currentTab;

  const fetchMyFeedbacks = async () => {
    if (!token) return;
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/feedback', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setMyFeedbacks(data);
      }
    } catch (err) {
      console.warn('Error fetching feedback history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMyFeedbacks();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!problema.trim()) {
      setErrorMsg('Por favor describe qué intentabas hacer y qué ocurrió.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const payload = {
        modulo_actual: currentTab,
        url_path: window.location.pathname + window.location.search,
        dispositivo: `${deviceLabel} (${navigator.userAgent.slice(0, 70)})`,
        problema_obstaculo: problema.trim(),
        solucion_propuesta: solucion.trim() || null,
        impacto: impacto,
        nombre_usuario: user?.nombre || user?.nombre_usuario || 'Usuario',
        rol_usuario: user?.rol || 'Visitante',
        departamento: user?.departamento || null
      };

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'No se pudo enviar el feedback.');
      }

      const created = await res.json();
      setMyFeedbacks(prev => [created, ...prev]);
      setSuccessMsg(true);
      setProblema('');
      setSolucion('');
      setImpacto('molestia');

      // Auto close or switch to history after 2.5s
      setTimeout(() => {
        setSuccessMsg(false);
      }, 3500);

    } catch (err: any) {
      setErrorMsg(err.message || 'Error al enviar feedback.');
    } finally {
      setLoading(false);
    }
  };

  const [dockSide, setDockSide] = useState<'right' | 'left'>('right');
  const [minimized, setMinimized] = useState(false);

  // Dynamic margin calculation: if the current module has bottom table controls/pagination (like Reportes, Operaciones, etc.),
  // raise the button so it never covers pagination chevrons or table actions!
  const hasBottomTableControls = ['reportes', 'operaciones', 'procura', 'catalogos', 'usuarios', 'almacen', 'auditoria'].includes(currentTab);
  const bottomPos = isMobile 
    ? (hasBottomTableControls ? '90px' : '80px') 
    : (hasBottomTableControls ? '86px' : '24px');

  return (
    <>
      {/* ============================================================== */}
      {/* BOTÓN FLOTANTE INFERIOR CON MARGEN DINÁMICO INTELIGENTE        */}
      {/* ============================================================== */}
      <div 
        className="stakeholder-feedback-trigger-wrapper"
        style={{
          position: 'fixed',
          bottom: bottomPos,
          right: dockSide === 'right' ? (isMobile ? '14px' : '24px') : 'auto',
          left: dockSide === 'left' ? (isMobile ? '14px' : '270px') : 'auto',
          zIndex: 995,
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          transition: 'bottom 0.3s cubic-bezier(0.16, 1, 0.3, 1), right 0.3s ease, left 0.3s ease'
        }}
      >
        <button
          onClick={() => setIsOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'linear-gradient(135deg, #ff9233 0%, #ec7700 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '50px',
            padding: minimized ? '0.65rem' : (isMobile ? '0.65rem 0.9rem' : '0.75rem 1.25rem'),
            boxShadow: '0 8px 24px rgba(236, 119, 0, 0.45), 0 2px 6px rgba(0,0,0,0.2)',
            cursor: 'pointer',
            fontWeight: 800,
            fontSize: '0.85rem',
            letterSpacing: '0.02em',
            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: 'translateY(0)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 12px 28px rgba(236, 119, 0, 0.6), 0 4px 8px rgba(0,0,0,0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(236, 119, 0, 0.45), 0 2px 6px rgba(0,0,0,0.2)';
          }}
          title={minimized ? "Abrir Feedback Piloto" : "Enviar comentario o sugerencia directa sobre esta pantalla"}
          aria-label="Abrir formulario de feedback del piloto"
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <MessageSquarePlus size={isMobile ? 18 : 19} />
            <span 
              style={{
                position: 'absolute',
                top: -3,
                right: -3,
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                boxShadow: '0 0 6px #ffffff'
              }} 
            />
          </div>
          {!minimized && <span>{isMobile ? 'Feedback' : 'Feedback Piloto'}</span>}
        </button>

        {/* Pequeño control para cambiar de lado si tapa algún contenido específico */}
        <button
          type="button"
          onClick={() => setDockSide(prev => prev === 'right' ? 'left' : 'right')}
          style={{
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: 'var(--text-secondary)',
            borderRadius: '50%',
            width: '26px',
            height: '26px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '0.7rem',
            padding: 0
          }}
          title={`Mover botón al lado ${dockSide === 'right' ? 'izquierdo' : 'derecho'}`}
        >
          ⇄
        </button>

        {/* Control para alternar entre texto completo o solo icono compacto */}
        <button
          type="button"
          onClick={() => setMinimized(prev => !prev)}
          style={{
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: 'var(--text-secondary)',
            borderRadius: '50%',
            width: '26px',
            height: '26px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '0.7rem',
            fontWeight: 700,
            padding: 0
          }}
          title={minimized ? "Expandir botón" : "Minimizar a solo icono"}
        >
          {minimized ? '+' : '–'}
        </button>
      </div>

      {/* ============================================================== */}
      {/* MODAL / DRAWER DE FEEDBACK                                     */}
      {/* ============================================================== */}
      {isOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(2, 6, 23, 0.75)',
            backdropFilter: 'blur(5px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: isMobile ? 'flex-end' : 'center',
            justifyContent: 'center',
            padding: isMobile ? '0' : '1.5rem',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => setIsOpen(false)}
        >
          <div 
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: isMobile ? '16px 16px 0 0' : 'var(--radius-lg)',
              maxWidth: '650px',
              width: '100%',
              maxHeight: isMobile ? '90vh' : '92vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-xl), 0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              overflow: 'hidden',
              animation: isMobile ? 'slideUp 0.25s ease-out' : 'scaleIn 0.2s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div 
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(to right, rgba(236, 119, 0, 0.08), transparent)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div 
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #ff9233 0%, #ec7700 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    boxShadow: '0 4px 10px rgba(236, 119, 0, 0.35)'
                  }}
                >
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-title)' }}>
                    Feedback Piloto & Sugerencias
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Canal directo de optimización ágil asistida por IA
                  </span>
                </div>
              </div>

              <button 
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.4rem',
                  borderRadius: '6px',
                  display: 'flex'
                }}
                title="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            {/* Sub-tab Navigation */}
            <div 
              style={{
                display: 'flex',
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: 'rgba(0,0,0,0.1)'
              }}
            >
              <button
                type="button"
                onClick={() => setActiveSubTab('nuevo')}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeSubTab === 'nuevo' ? '3px solid var(--color-primary)' : '3px solid transparent',
                  color: activeSubTab === 'nuevo' ? 'var(--text-title)' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                <MessageSquarePlus size={16} />
                <span>✍️ Nueva Sugerencia</span>
              </button>
              
              <button
                type="button"
                onClick={() => setActiveSubTab('historial')}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeSubTab === 'historial' ? '3px solid var(--color-primary)' : '3px solid transparent',
                  color: activeSubTab === 'historial' ? 'var(--text-title)' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                <History size={16} />
                <span>Mis Aportes ({myFeedbacks.length})</span>
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
              
              {/* Context Pill (Auto-detected) */}
              <div 
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  padding: '0.6rem 0.85rem',
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  marginBottom: '1.25rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <UserCheck size={14} color="var(--color-primary)" />
                  <span style={{ fontWeight: 600 }}>{user?.nombre || user?.nombre_usuario}</span>
                  <span style={{ opacity: 0.7 }}>({user?.rol}{user?.departamento ? ` • ${user.departamento}` : ''})</span>
                </div>
                <span style={{ opacity: 0.4 }}>|</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <MapPin size={14} color="#3b82f6" />
                  <span>Módulo: <strong>{friendlyTabName}</strong></span>
                </div>
                <span style={{ opacity: 0.4 }}>|</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  {isMobile ? <Smartphone size={14} color="#10b981" /> : <Laptop size={14} color="#10b981" />}
                  <span>{deviceLabel}</span>
                </div>
              </div>

              {/* SUCCESS MESSAGE BANNER */}
              {successMsg && (
                <div 
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: '#10b981',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    marginBottom: '1.25rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem'
                  }}
                >
                  <CheckCircle size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ fontSize: '0.9rem', display: 'block', marginBottom: '0.2rem' }}>
                      ¡Feedback registrado con éxito!
                    </strong>
                    <span style={{ fontSize: '0.8rem', lineHeight: '1.4', display: 'block', opacity: 0.9 }}>
                      El arquitecto técnico y el motor de IA evaluarán la viabilidad y priorización de tu solicitud. ¡Gracias por ayudarnos a perfeccionar la herramienta!
                    </span>
                  </div>
                </div>
              )}

              {/* ERROR MESSAGE */}
              {errorMsg && (
                <div 
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem 1rem',
                    marginBottom: '1rem',
                    fontSize: '0.825rem'
                  }}
                >
                  {errorMsg}
                </div>
              )}

              {/* TAB 1: FORMULARIO NUEVA SUGERENCIA */}
              {activeSubTab === 'nuevo' && (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                  
                  {/* Campo 1: Problema / Obstáculo */}
                  <div>
                    <label 
                      style={{ 
                        display: 'block', 
                        fontSize: '0.85rem', 
                        fontWeight: 700, 
                        color: 'var(--text-title)', 
                        marginBottom: '0.4rem' 
                      }}
                    >
                      1. ¿Qué intentabas hacer y qué falló o te frenó? <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <textarea
                      rows={3}
                      className="form-input"
                      style={{ 
                        width: '100%', 
                        resize: 'vertical', 
                        minHeight: '85px',
                        fontSize: '0.85rem',
                        lineHeight: '1.4'
                      }}
                      placeholder="Ej: Quería consultar las proformas de Mack en Procura pero el botón tardó o faltaba un filtro por fecha..."
                      value={problema}
                      onChange={(e) => setProblema(e.target.value)}
                      spellCheck={true}
                      lang="es"
                      required
                    />
                    <SpanishSpellAssistant 
                      text={problema} 
                      onChange={setProblema} 
                      label="Corrector y Gramática en Español"
                      showPreview={true}
                    />
                  </div>

                  {/* Campo 2: Solución propuesta */}
                  <div>
                    <label 
                      style={{ 
                        display: 'block', 
                        fontSize: '0.85rem', 
                        fontWeight: 700, 
                        color: 'var(--text-title)', 
                        marginBottom: '0.4rem' 
                      }}
                    >
                      2. ¿Qué solución o cambio propones tú? <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Opcional)</span>
                    </label>
                    <textarea
                      rows={2}
                      className="form-input"
                      style={{ 
                        width: '100%', 
                        resize: 'vertical', 
                        minHeight: '65px',
                        fontSize: '0.85rem',
                        lineHeight: '1.4'
                      }}
                      placeholder="Ej: Sería ideal tener un buscador rápido arriba o que guarde el último estado..."
                      value={solucion}
                      onChange={(e) => setSolucion(e.target.value)}
                      spellCheck={true}
                      lang="es"
                    />
                    <SpanishSpellAssistant 
                      text={solucion} 
                      onChange={setSolucion} 
                      label="Corrector y Gramática en Español"
                      showPreview={true}
                    />
                  </div>

                  {/* Campo 3: Nivel de Impacto */}
                  <div>
                    <label 
                      style={{ 
                        display: 'block', 
                        fontSize: '0.85rem', 
                        fontWeight: 700, 
                        color: 'var(--text-title)', 
                        marginBottom: '0.5rem' 
                      }}
                    >
                      3. Nivel de impacto en tu trabajo diario:
                    </label>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '0.5rem' }}>
                      
                      {/* Bloqueo */}
                      <button
                        type="button"
                        onClick={() => setImpacto('bloqueo')}
                        style={{
                          padding: '0.65rem 0.75rem',
                          borderRadius: '8px',
                          border: impacto === 'bloqueo' ? '2px solid #ef4444' : '1px solid var(--border-color)',
                          backgroundColor: impacto === 'bloqueo' ? 'rgba(239, 68, 68, 0.12)' : 'var(--bg-primary)',
                          color: impacto === 'bloqueo' ? '#ef4444' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          gap: '0.25rem',
                          textAlign: 'left',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, fontSize: '0.825rem' }}>
                          <Flame size={15} color="#ef4444" />
                          <span>Bloquea mi trabajo</span>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          No puedo continuar mi labor.
                        </span>
                      </button>

                      {/* Molestia */}
                      <button
                        type="button"
                        onClick={() => setImpacto('molestia')}
                        style={{
                          padding: '0.65rem 0.75rem',
                          borderRadius: '8px',
                          border: impacto === 'molestia' ? '2px solid #f59e0b' : '1px solid var(--border-color)',
                          backgroundColor: impacto === 'molestia' ? 'rgba(245, 158, 11, 0.12)' : 'var(--bg-primary)',
                          color: impacto === 'molestia' ? '#f59e0b' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          gap: '0.25rem',
                          textAlign: 'left',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, fontSize: '0.825rem' }}>
                          <AlertTriangle size={15} color="#f59e0b" />
                          <span>Es una molestia</span>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          Puedo trabajar pero es incómodo.
                        </span>
                      </button>

                      {/* Mejora */}
                      <button
                        type="button"
                        onClick={() => setImpacto('mejora')}
                        style={{
                          padding: '0.65rem 0.75rem',
                          borderRadius: '8px',
                          border: impacto === 'mejora' ? '2px solid #3b82f6' : '1px solid var(--border-color)',
                          backgroundColor: impacto === 'mejora' ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-primary)',
                          color: impacto === 'mejora' ? '#3b82f6' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          gap: '0.25rem',
                          textAlign: 'left',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, fontSize: '0.825rem' }}>
                          <Lightbulb size={15} color="#3b82f6" />
                          <span>Idea de mejora</span>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          Ahorraría tiempo o aumentaría valor.
                        </span>
                      </button>

                    </div>
                  </div>

                  {/* Botón de Enviar */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="btn"
                      style={{
                        padding: '0.65rem 1rem',
                        fontSize: '0.85rem'
                      }}
                    >
                      Cancelar
                    </button>
                    
                    <button
                      type="submit"
                      disabled={loading || !problema.trim()}
                      className="btn"
                      style={{
                        padding: '0.65rem 1.25rem',
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        background: 'linear-gradient(135deg, #ff9233 0%, #ec7700 100%)',
                        color: '#ffffff',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(236, 119, 0, 0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        opacity: (!problema.trim() || loading) ? 0.6 : 1
                      }}
                    >
                      <Send size={16} />
                      <span>{loading ? 'Enviando al equipo...' : 'Enviar Feedback'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: HISTORIAL DE MIS APORTES */}
              {activeSubTab === 'historial' && (
                <div>
                  {loadingHistory ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      Cargando historial...
                    </div>
                  ) : myFeedbacks.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                      <MessageSquarePlus size={36} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                      <p style={{ margin: 0, fontWeight: 600 }}>Aún no has enviado sugerencias o feedbacks.</p>
                      <span style={{ fontSize: '0.75rem' }}>Tus reportes aparecerán aquí con su estado de atención.</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {myFeedbacks.map((item) => {
                        const statusColors: Record<string, { bg: string; text: string; label: string }> = {
                          pendiente: { bg: 'rgba(245, 158, 11, 0.12)', text: '#f59e0b', label: '🟡 En Espera' },
                          en_analisis: { bg: 'rgba(59, 130, 246, 0.12)', text: '#3b82f6', label: '🔵 En Evaluación IA' },
                          implementado: { bg: 'rgba(16, 185, 129, 0.12)', text: '#10b981', label: '🟢 Implementado' },
                          descartado: { bg: 'rgba(148, 163, 184, 0.12)', text: '#94a3b8', label: '⚪ Diferido / No Aplica' },
                        };
                        const s = statusColors[item.estado] || statusColors.pendiente;

                        return (
                          <div 
                            key={item.id}
                            style={{
                              backgroundColor: 'var(--bg-primary)',
                              border: '1px solid var(--border-color)',
                              borderRadius: 'var(--radius-md)',
                              padding: '0.85rem 1rem'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {new Date(item.creado_en).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })} • Módulo: <strong>{tabNames[item.modulo_actual] || item.modulo_actual}</strong>
                              </span>
                              <span 
                                style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '20px',
                                  backgroundColor: s.bg,
                                  color: s.text
                                }}
                              >
                                {s.label}
                              </span>
                            </div>

                            <p style={{ margin: '0 0 0.35rem 0', fontSize: '0.825rem', color: 'var(--text-title)', fontWeight: 600 }}>
                              {item.problema_obstaculo}
                            </p>

                            {item.solucion_propuesta && (
                              <p style={{ margin: '0 0 0.35rem 0', fontSize: '0.775rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                💡 Propuesta: "{item.solucion_propuesta}"
                              </p>
                            )}

                            {item.notas_admin && (
                              <div 
                                style={{
                                  marginTop: '0.4rem',
                                  padding: '0.35rem 0.6rem',
                                  backgroundColor: 'rgba(236, 119, 0, 0.08)',
                                  borderLeft: '3px solid var(--color-primary)',
                                  borderRadius: '2px',
                                  fontSize: '0.75rem',
                                  color: 'var(--text-secondary)'
                                }}
                              >
                                <strong>Respuesta del equipo:</strong> {item.notas_admin}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Modal Footer for Admins */}
            {user?.rol === 'Administrador' && (
              <div 
                style={{
                  padding: '0.75rem 1.5rem',
                  borderTop: '1px solid var(--border-color)',
                  backgroundColor: 'rgba(0,0,0,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-primary)' }}>
                  <ShieldCheck size={16} />
                  <span>Modo Administrador Activo</span>
                </div>

                {onNavigateToAdminFeedbacks && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onNavigateToAdminFeedbacks();
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-primary)',
                      cursor: 'pointer',
                      fontWeight: 700,
                      textDecoration: 'underline'
                    }}
                  >
                    Ver Bandeja Completa de Feedbacks ➔
                  </button>
                )}
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
};
