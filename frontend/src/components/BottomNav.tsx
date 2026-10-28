import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Home, 
  ClipboardList, 
  FileBarChart2, 
  Menu, 
  Database, 
  Boxes, 
  Users, 
  ShieldAlert, 
  LogOut, 
  X,
  Scale,
  MessageSquarePlus
} from 'lucide-react';
import { UserProfileModal } from './UserProfileModal';

interface BottomNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, setCurrentTab }) => {
  const { user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const checkMenuPermission = (moduleKey: string) => {
    if (user?.rol === 'Administrador') return true;
    const p = user?.permisos || {};

    switch (moduleKey) {
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
      case 'usuarios':
        return !!(p.ver_usuarios || p.editar_usuarios || p.ver_empleados || p.editar_empleados || p.ver_roles || p.editar_roles || (p.acceder_usuarios && p.ver_usuarios !== false));
      case 'auditoria':
        return !!(p.ver_auditoria || p.editar_auditoria || p.ver_auditoria_logs || (p.acceder_auditoria && p.ver_auditoria !== false));
      default:
        return false;
    }
  };

  // Core navigation items in the main bottom bar
  const mainNavItems = [
    { id: 'inicio', name: 'Inicio', icon: Home, moduleKey: 'inicio' },
    { id: 'operaciones', name: 'Operaciones', icon: ClipboardList, moduleKey: 'operaciones' },
    { id: 'reportes', name: 'Reportes', icon: FileBarChart2, moduleKey: 'reportes' },
  ];

  // Drawer items
  const drawerItems = [
    { id: 'procura', name: 'Procura e Import.', icon: Scale, moduleKey: 'procura' },
    { id: 'feedback', name: 'Buzón Feedback', icon: MessageSquarePlus, moduleKey: 'feedback' },
    { id: 'catalogos', name: 'Catálogos Maestros', icon: Database, moduleKey: 'catalogos' },
    { id: 'almacen', name: 'Despeje de Almacén', icon: Boxes, moduleKey: 'almacen' },
    { id: 'usuarios', name: 'Control de Usuarios', icon: Users, moduleKey: 'usuarios' },
    { id: 'auditoria', name: 'Logs de Auditoría', icon: ShieldAlert, moduleKey: 'auditoria' },
  ];

  const handleTabClick = (tabId: string) => {
    setCurrentTab(tabId);
    setDrawerOpen(false);
  };

  return (
    <>
      <nav className="bottom-nav">
        {mainNavItems
          .filter(item => checkMenuPermission(item.moduleKey))
          .map(item => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`bottom-nav-item ${active ? 'active' : ''}`}
                aria-label={item.name}
              >
                <Icon size={20} className="nav-icon" />
                <span className="nav-label">{item.name}</span>
              </button>
            );
          })}
        
        <button
          onClick={() => setDrawerOpen(true)}
          className={`bottom-nav-item ${drawerOpen ? 'active' : ''}`}
          aria-label="Más opciones"
        >
          <Menu size={20} className="nav-icon" />
          <span className="nav-label">Más</span>
        </button>
      </nav>

      {drawerOpen && (
        <div className="mobile-drawer-backdrop" onClick={() => setDrawerOpen(false)}>
          <div className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <div 
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
                onClick={() => setIsProfileModalOpen(true)}
                title="Configuración de Perfil y Sistema"
              >
                <div className="mobile-user-avatar" style={{ overflow: 'hidden', position: 'relative' }}>
                  {user?.foto_perfil ? (
                    <img src={user.foto_perfil} alt={user?.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    user?.nombre.substring(0, 1).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="mobile-user-name">{user?.nombre}</div>
                  <div className="mobile-user-role">{user?.rol}</div>
                </div>
              </div>
              <button className="mobile-drawer-close" onClick={() => setDrawerOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="mobile-drawer-content">
              {drawerItems
                .filter(item => checkMenuPermission(item.moduleKey))
                .map(item => {
                  const Icon = item.icon;
                  const active = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      className={`drawer-menu-item ${active ? 'active' : ''}`}
                    >
                      <Icon size={18} />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              
              <div className="drawer-divider" />
              
              <button onClick={logout} className="drawer-menu-item logout">
                <LogOut size={18} />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <UserProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
    </>
  );
};
