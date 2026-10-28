import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { OperationsVehicles } from './components/OperationsVehicles';
import { MasterCatalogs } from './components/MasterCatalogs';
import { WarehouseClearout } from './components/WarehouseClearout';
import { AdvancedFiltersReports } from './components/AdvancedFiltersReports';
import { AdminPanel } from './components/AdminPanel';
import { AuditLogsViewer } from './components/AuditLogsViewer';
import { HomeDashboard } from './components/HomeDashboard';
import { ProcurementMatrix } from './components/ProcurementMatrix';
import { ShieldAlert } from 'lucide-react';
import { BottomNav } from './components/BottomNav';
import { StakeholderFeedbackButton } from './components/StakeholderFeedbackButton';
import { AdminFeedbackInbox } from './components/AdminFeedbackInbox';
import logoImg from './assets/logo.png';
import './assets/index.css';

const MainLayout: React.FC = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState('inicio');
  const [adminInitialTab, setAdminInitialTab] = useState<'usuarios' | 'roles' | 'departamentos' | 'feedback'>('usuarios');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const isTabAllowed = (tab: string) => {
    if (user?.rol === 'Administrador') return true;
    const p = user?.permisos || {};

    switch (tab) {
      case 'inicio':
        return !!(p.ver_inicio || p.editar_inicio || p.ver_tickets || p.editar_tickets || p.ver_rendimiento || (p.acceder_inicio && p.ver_inicio !== false));
      case 'operaciones':
        return !!(p.ver_operaciones || p.editar_operaciones || p.ver_checklists || p.editar_checklists || p.ver_ordenes || p.editar_ordenes || p.ver_solicitudes || p.editar_solicitudes || (p.acceder_operaciones && p.ver_operaciones !== false));
      case 'procura':
        return !!(p.ver_procura || p.editar_procura || p.ver_procura_expedientes || p.editar_procura_expedientes || p.ver_procura_tareas || p.editar_procura_tareas || p.emitir_sello_ceo || (p.acceder_procura && p.ver_procura !== false));
      case 'catalogos':
        return !!(p.ver_catalogos || p.editar_catalogos || p.ver_activos || p.editar_activos || p.ver_repuestos || p.editar_repuestos || (p.acceder_catalogos && p.ver_catalogos !== false));
      case 'almacen':
        return !!(p.ver_almacen || p.editar_almacen || (p.acceder_almacen && p.ver_almacen !== false));
      case 'reportes':
        return !!(p.ver_reportes || p.editar_reportes || (p.acceder_reportes && p.ver_reportes !== false));
      case 'usuarios':
        return !!(p.ver_usuarios || p.editar_usuarios || p.ver_empleados || p.editar_empleados || p.ver_roles || p.editar_roles || (p.acceder_usuarios && p.ver_usuarios !== false));
      case 'auditoria':
        return !!(p.ver_auditoria || p.editar_auditoria || p.ver_auditoria_logs || (p.acceder_auditoria && p.ver_auditoria !== false));
      case 'feedback':
        return !!(
          user?.rol === 'Administrador' ||
          user?.rol === 'Presidente' ||
          user?.rol === 'Director General' ||
          user?.rol === 'Gerente General' ||
          p.ver_feedbacks ||
          p.editar_feedbacks ||
          p.ver_inicio ||
          p.acceder_inicio
        );
      default:
        return false;
    }
  };

  React.useEffect(() => {
    if (!isTabAllowed(currentTab)) {
      const allTabs = ['inicio', 'procura', 'operaciones', 'catalogos', 'almacen', 'reportes', 'feedback', 'usuarios', 'auditoria'];
      const firstAllowed = allTabs.find(t => isTabAllowed(t));
      if (firstAllowed && firstAllowed !== currentTab) {
        setCurrentTab(firstAllowed);
      }
    }
  }, [user, currentTab]);

  const handleViewReportFromDashboard = (checklistId: string) => {
    setSelectedReportId(checklistId);
    setCurrentTab('operaciones');
  };

  const handleOpenTicketFromHeader = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setCurrentTab('inicio');
  };

  const renderContent = () => {
    if (!isTabAllowed(currentTab)) {
      return (
        <div style={{ padding: '3rem 1.5rem', textAlign: 'center', maxWidth: '540px', margin: '4rem auto', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <ShieldAlert size={44} color="#ef4444" style={{ marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-title)', marginBottom: '0.5rem' }}>
            Acceso No Autorizado
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Su rol ({user?.rol}) no dispone de permisos para visualizar este módulo en su configuración actual.
          </p>
          <button 
            onClick={() => {
              const allTabs = ['inicio', 'procura', 'operaciones', 'catalogos', 'almacen', 'reportes', 'feedback', 'usuarios', 'auditoria'];
              const firstAllowed = allTabs.find(t => isTabAllowed(t)) || 'inicio';
              setCurrentTab(firstAllowed);
            }}
            className="btn btn-primary"
          >
            Ir a Módulo Autorizado
          </button>
        </div>
      );
    }

    switch (currentTab) {
      case 'inicio':
        return (
          <HomeDashboard 
            onViewReport={handleViewReportFromDashboard} 
            selectedTicketId={selectedTicketId}
            onClearSelectedTicketId={() => setSelectedTicketId(null)}
          />
        );
      case 'operaciones':
        return <OperationsVehicles selectedReportId={selectedReportId} clearSelectedReportId={() => setSelectedReportId(null)} />;
      case 'procura':
        return <ProcurementMatrix />;
      case 'catalogos':
        return <MasterCatalogs />;
      case 'almacen':
        return <WarehouseClearout />;
      case 'reportes':
        return <AdvancedFiltersReports />;
      case 'feedback':
        return <AdminFeedbackInbox />;
      case 'usuarios':
        return <AdminPanel initialTab={adminInitialTab} onTabChange={setAdminInitialTab} />;
      case 'auditoria':
        return <AuditLogsViewer />;
      default:
        return (
          <HomeDashboard 
            onViewReport={handleViewReportFromDashboard} 
            selectedTicketId={selectedTicketId}
            onClearSelectedTicketId={() => setSelectedTicketId(null)}
          />
        );
    }
  };

  return (
    <div className="app-container">
      {/* Dynamic gradient definitions for SVG Lucide Icons */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-primary)" />
          <stop offset="100%" stopColor="var(--color-info)" />
        </linearGradient>
      </svg>
      
      <Sidebar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        collapsed={sidebarCollapsed} 
        setCollapsed={setSidebarCollapsed} 
      />
      <div className="main-content">
        <Header currentTab={currentTab} onOpenTicket={handleOpenTicketFromHeader} />
        <main style={{ flex: 1, minWidth: 0, width: '100%', maxWidth: '100%' }}>
          {renderContent()}
        </main>
      </div>
      <BottomNav currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Botón flotante inferior para Feedback de Stakeholders */}
      <StakeholderFeedbackButton 
        currentTab={currentTab} 
        onNavigateToAdminFeedbacks={() => {
          setAdminInitialTab('feedback');
          setCurrentTab('usuarios');
        }}
      />
    </div>
  );
};

const LoginScreen: React.FC = () => {
  const { login, error, clearError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(username, password);
    } catch (err) {
      // Error handled by AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      background: 'radial-gradient(circle at center, #ff9233 0%, #ec7700 100%)',
      padding: '1rem'
    }}>
      <div style={{ 
        maxWidth: '420px', 
        width: '100%', 
        padding: '2.5rem', 
        borderRadius: 'var(--radius-lg)', 
        background: '#011e41', 
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: 'var(--shadow-lg), 0 20px 40px rgba(0, 0, 0, 0.3)',
        color: '#ffffff'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <img 
            src={logoImg} 
            alt="Logo OptiAsset CMMS" 
            style={{ 
              height: '90px', 
              width: 'auto', 
              borderRadius: '6px', 
              marginBottom: '1rem'
            }} 
          />
          <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.75rem', fontWeight: 800, textAlign: 'center', color: '#ffffff' }}>
            OPTIASSET CMMS
          </h2>
          <span style={{ color: '#cbd5e1', fontSize: '0.875rem', textAlign: 'center', marginTop: '0.25rem' }}>
            Gestión de Activos y Mantenimiento Industrial
          </span>
        </div>

        {error && (
          <div style={{ 
            padding: '0.75rem 1rem', 
            background: 'rgba(239, 68, 68, 0.12)', 
            border: '1px solid rgba(239, 68, 68, 0.3)', 
            borderRadius: 'var(--radius-sm)', 
            color: 'var(--color-danger)', 
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <ShieldAlert size={16} />
            <span style={{ flex: 1 }}>{error}</span>
            <button style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontWeight: 'bold' }} onClick={clearError}>✕</button>
          </div>
        )}

        <form onSubmit={handleFormSubmit}>
          <div className="form-group">
            <label className="form-label" style={{ color: '#f1f5f9' }}>Nombre de Usuario</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="admin, mecanico1, chofer1" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              required 
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label className="form-label" style={{ color: '#f1f5f9' }}>Contraseña</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="••••••••" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required 
            />
          </div>

          <button 
            type="submit" 
            className="btn" 
            style={{ 
              width: '100%', 
              justifyContent: 'center', 
              padding: '0.75rem',
              background: 'linear-gradient(135deg, #ff9233 0%, #ec7700 100%)',
              color: '#ffffff',
              border: 'none',
              boxShadow: '0 4px 12px rgba(236, 119, 0, 0.3)',
              fontWeight: 800
            }}
            disabled={submitting}
          >
            {submitting ? 'Verificando firmas...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Quick Demo Access for Recruiters / Reviewers */}
        <div style={{ marginTop: '1.25rem', padding: '0.75rem', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.15)' }}>
          <div style={{ fontSize: '0.72rem', color: '#ff9233', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', textAlign: 'center' }}>
            ⚡ Acceso Rápido Sandbox / Demo
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => { setUsername('admin'); setPassword('admin123'); login('admin', 'admin123'); }}
              style={{ padding: '0.45rem', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '4px', cursor: 'pointer' }}
            >
              Demo Admin
            </button>
            <button
              type="button"
              onClick={() => { setUsername('mecanico1'); setPassword('admin123'); login('mecanico1', 'admin123'); }}
              style={{ padding: '0.45rem', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '4px', cursor: 'pointer' }}
            >
              Demo Mecánico
            </button>
          </div>
        </div>
        
        <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>
          Entorno de producción certificado de logs inmutables.
        </div>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
        <div className="spinner" style={{ width: '50px', height: '50px', border: '5px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--color-primary)', borderRadius: '50%' }}></div>
      </div>
    );
  }

  return token ? <MainLayout /> : <LoginScreen />;
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
