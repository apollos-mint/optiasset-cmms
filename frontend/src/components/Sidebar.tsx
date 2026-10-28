import React, { useRef, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/logo.png';
import { 
  Home,
  ClipboardList, 
  Database, 
  Boxes, 
  FileBarChart2, 
  Users, 
  ShieldAlert, 
  LogOut,
  ChevronLeft,
  Scale,
  Search,
  Sparkles,
  MessageSquarePlus,
  X
} from 'lucide-react';
import { UserProfileModal } from './UserProfileModal';
import { searchModulesWithAI } from '../services/moduleAiSearch.service';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentTab, 
  setCurrentTab,
  collapsed,
  setCollapsed
}) => {
  const { user, logout } = useAuth();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!collapsed && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setCollapsed(true);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [collapsed, setCollapsed]);


  const menuItems = [
    { id: 'inicio',      name: 'Inicio',                     emoji: '🏠', icon: Home,              moduleKey: 'inicio' },
    { id: 'operaciones', name: 'Operaciones (Mantenimiento)', emoji: '📋', icon: ClipboardList,     moduleKey: 'operaciones' },
    { id: 'procura',     name: 'Procura e Importaciones',    emoji: '🚢', icon: Scale,             moduleKey: 'procura' },
    { id: 'catalogos',   name: 'Catálogos Maestros',          emoji: '🗄️', icon: Database,          moduleKey: 'catalogos' },
    { id: 'almacen',     name: 'Despeje de Almacén',          emoji: '📦', icon: Boxes,             moduleKey: 'almacen' },
    { id: 'reportes',    name: 'Filtros y Reportes',          emoji: '📊', icon: FileBarChart2,     moduleKey: 'reportes' },
    { id: 'feedback',    name: 'Buzón de Feedback',          emoji: '💬', icon: MessageSquarePlus, moduleKey: 'feedback' },
  ];

  // Elementos de administración exclusivos
  const adminItems = [
    { id: 'usuarios',  name: 'Control de Usuarios y Roles', emoji: '👥', icon: Users,       moduleKey: 'usuarios'  },
    { id: 'auditoria', name: 'Logs de Auditoría',           emoji: '🛡️', icon: ShieldAlert, moduleKey: 'auditoria' },
  ];

  const checkMenuPermission = (moduleKey: string) => {
    if (user?.rol === 'Administrador') return true;

    const p = user?.permisos || {};

    switch (moduleKey) {
      case 'inicio':
        return !!(
          p.ver_inicio || p.editar_inicio || 
          p.ver_tickets || p.editar_tickets || 
          p.ver_rendimiento || p.editar_rendimiento ||
          (p.acceder_inicio && p.ver_inicio !== false)
        );

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

      case 'operaciones':
        return !!(
          p.ver_operaciones || p.editar_operaciones ||
          p.ver_checklists || p.editar_checklists ||
          p.ver_ordenes || p.editar_ordenes ||
          p.ver_solicitudes || p.editar_solicitudes ||
          p.ver_profit_diagnostics || p.modificar_profit_diagnostics ||
          (p.acceder_operaciones && p.ver_operaciones !== false)
        );

      case 'procura':
        return !!(
          p.ver_procura || p.editar_procura ||
          p.ver_procura_expedientes || p.editar_procura_expedientes ||
          p.ver_procura_tareas || p.editar_procura_tareas ||
          p.emitir_sello_ceo ||
          (p.acceder_procura && p.ver_procura !== false)
        );

      case 'catalogos':
        return !!(
          p.ver_catalogos || p.editar_catalogos ||
          p.ver_activos || p.editar_activos ||
          p.ver_repuestos || p.editar_repuestos ||
          (p.acceder_catalogos && p.ver_catalogos !== false)
        );

      case 'almacen':
        return !!(
          p.ver_almacen || p.editar_almacen ||
          (p.acceder_almacen && p.ver_almacen !== false)
        );

      case 'reportes':
        return !!(
          p.ver_reportes || p.editar_reportes ||
          (p.acceder_reportes && p.ver_reportes !== false)
        );

      case 'usuarios':
        return !!(
          p.ver_usuarios || p.editar_usuarios ||
          p.ver_empleados || p.editar_empleados ||
          p.ver_roles || p.editar_roles ||
          (p.acceder_usuarios && p.ver_usuarios !== false)
        );

      case 'auditoria':
        return !!(
          p.ver_auditoria || p.editar_auditoria ||
          p.ver_auditoria_logs ||
          (p.acceder_auditoria && p.ver_auditoria !== false)
        );

      default:
        return false;
    }
  };

  const allowedKeys = [...menuItems, ...adminItems]
    .filter(item => checkMenuPermission(item.moduleKey))
    .map(item => item.moduleKey);
  const aiSearchResults = searchModulesWithAI(searchQuery, allowedKeys);

  return (
    <div ref={sidebarRef} className={`sidebar ${collapsed ? 'collapsed' : ''}`}>

      <div 
        className="sidebar-logo" 
        style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: collapsed ? '0.25rem 0.2rem' : '0.12rem 0.4rem 0.08rem 0.4rem',
          position: 'relative',
          cursor: 'pointer',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          transition: 'all var(--transition-normal)',
          boxSizing: 'border-box',
          width: '100%'
        }} 
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? "Expandir menú" : "Colapsar menú"}
      >
        <img 
          src={`${logoImg}?v=4`} 
          alt="Logo OptiAsset CMMS" 
          style={{ 
            height: collapsed ? '30px' : '90px', 
            maxWidth: '92%',
            width: 'auto', 
            borderRadius: '4px', 
            transition: 'all var(--transition-normal)',
            flexShrink: 0,
            objectFit: 'contain'
          }} 
        />
        {!collapsed && (
          <span style={{ 
            fontSize: '0.72rem', 
            fontWeight: 800, 
            letterSpacing: '0.06em', 
            color: '#ff9233', 
            margin: '1px 0',
            lineHeight: 1,
            textAlign: 'center'
          }}>
            OPTIASSET CMMS
          </span>
        )}
        {!collapsed && (
          <button 
            type="button" 
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed(true);
            }} 
            style={{ 
              position: 'absolute',
              top: '0.2rem',
              right: '0.3rem',
              background: 'none', 
              border: 'none', 
              color: 'rgba(255, 255, 255, 0.7)', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              padding: '0.2rem',
              borderRadius: '50%',
              transition: 'all var(--transition-fast)'
            }}
            title="Colapsar menú"
          >
            <ChevronLeft size={14} />
          </button>
        )}
      </div>

      {/* Barra de Búsqueda Inteligente Asistida por IA (Ubicada sobre Inicio) */}
      <div style={{ padding: collapsed ? '0.3rem 0.25rem' : '0.25rem 0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', position: 'relative' }}>
        {collapsed ? (
          <button
            type="button"
            onClick={() => {
              setCollapsed(false);
              setTimeout(() => searchInputRef.current?.focus(), 150);
            }}
            style={{
              width: '100%',
              height: '28px',
              borderRadius: '5px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#ff9233',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title="Buscar módulo con IA..."
          >
            <Search size={13} />
          </button>
        ) : (
          <div style={{ position: 'relative', width: '100%' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              borderRadius: '5px',
              padding: '0.2rem 0.45rem',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)'
            }}>
              <Sparkles size={12} style={{ color: '#ff9233', flexShrink: 0 }} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && aiSearchResults.length > 0) {
                    setCurrentTab(aiSearchResults[0].id);
                    setSearchQuery('');
                  } else if (e.key === 'Escape') {
                    setSearchQuery('');
                  }
                }}
                placeholder="Buscar módulo con IA..."
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#fff',
                  fontSize: '0.74rem',
                  padding: 0
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.5)',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Limpiar búsqueda"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Panel de Coincidencias Semánticas IA */}
            {searchQuery.trim() && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 60,
                background: '#011e41',
                border: '1px solid #ff9233',
                borderRadius: '6px',
                marginTop: '4px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.75)',
                padding: '0.3rem',
                maxHeight: '220px',
                overflowY: 'auto'
              }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#ff9233', padding: '0.15rem 0.35rem 0.3rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Sparkles size={11} /> Coincidencia Inteligente IA:
                </div>
                {aiSearchResults.length === 0 ? (
                  <div style={{ padding: '0.45rem 0.35rem', fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
                    Sin coincidencias para "{searchQuery}"
                  </div>
                ) : (
                  aiSearchResults.map(res => (
                    <div
                      key={res.id}
                      onClick={() => {
                        setCurrentTab(res.id);
                        setSearchQuery('');
                      }}
                      style={{
                        padding: '0.35rem 0.45rem',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginBottom: '2px',
                        transition: 'all 0.15s ease',
                        background: currentTab === res.id ? 'rgba(255, 146, 51, 0.3)' : 'transparent'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 146, 51, 0.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = currentTab === res.id ? 'rgba(255, 146, 51, 0.3)' : 'transparent'}
                    >
                      <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#fff' }}>
                        {res.name}
                      </div>
                      {res.explanation && (
                        <div style={{ fontSize: '0.64rem', color: '#ff9233', marginTop: '1px' }}>
                          {res.explanation}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      <ul className="sidebar-menu">
        {menuItems
          .filter(item => checkMenuPermission(item.moduleKey))
          .map(item => {
            const isActive = currentTab === item.id;
            const isAiMatched = searchQuery.trim().length > 0 && aiSearchResults.some(r => r.id === item.id);
            return (
              <li key={item.id}>
                <button 
                  onClick={() => {
                    setCurrentTab(item.id);
                    setSearchQuery('');
                  }}
                  className={`menu-item ${isActive ? 'active' : ''}`}
                  style={{ 
                    width: '100%', 
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    background: isActive ? 'linear-gradient(135deg, #ff9233 0%, #ec7700 100%)' : (isAiMatched ? 'rgba(255, 146, 51, 0.15)' : 'transparent'),
                    borderColor: isActive ? '#ff9233' : (isAiMatched ? '#ff9233' : 'rgba(255, 255, 255, 0.12)'),
                    color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.85)',
                    fontWeight: isActive ? 700 : 500,
                    boxShadow: isActive ? '0 2px 8px rgba(236, 119, 0, 0.35)' : (isAiMatched ? '0 0 8px rgba(255, 146, 51, 0.4)' : 'none'),
                    padding: collapsed ? '0.45rem 0.2rem' : '0.28rem 0.55rem',
                    fontSize: '0.76rem',
                    gap: collapsed ? 0 : '0.5rem',
                    minHeight: '30px'
                  }}
                  title={collapsed ? item.name : undefined}
                >
                  <span className="menu-item-emoji" style={{ fontSize: collapsed ? '1.2rem' : '0.88rem', flexShrink: 0, lineHeight: 1 }} title={item.name}>{item.emoji}</span>
                  {!collapsed && <span className="menu-item-text" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>}
                </button>
              </li>
            );
          })}

        {/* Sección de administración si tiene privilegios */}
        {(checkMenuPermission('usuarios') || checkMenuPermission('auditoria')) && (
          <>
            {!collapsed ? (
              <div style={{ padding: '0.35rem 0.55rem 0.1rem 0.55rem', fontSize: '0.62rem', fontWeight: 700, color: 'var(--sidebar-header-color)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Administración
              </div>
            ) : (
              <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.3)', margin: '0.3rem 0.4rem' }} />
            )}
            {adminItems
              .filter(item => checkMenuPermission(item.moduleKey))
              .map(item => {
                const isActive = currentTab === item.id;
                const isAiMatched = searchQuery.trim().length > 0 && aiSearchResults.some(r => r.id === item.id);
                return (
                  <li key={item.id}>
                    <button 
                      onClick={() => {
                        setCurrentTab(item.id);
                        setSearchQuery('');
                      }}
                      className={`menu-item ${isActive ? 'active' : ''}`}
                      style={{ 
                        width: '100%', 
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        background: isActive ? 'linear-gradient(135deg, #ff9233 0%, #ec7700 100%)' : (isAiMatched ? 'rgba(255, 146, 51, 0.15)' : 'transparent'),
                        borderColor: isActive ? '#ff9233' : (isAiMatched ? '#ff9233' : 'rgba(255, 255, 255, 0.12)'),
                        color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.85)',
                        fontWeight: isActive ? 700 : 500,
                        boxShadow: isActive ? '0 2px 8px rgba(236, 119, 0, 0.35)' : (isAiMatched ? '0 0 8px rgba(255, 146, 51, 0.4)' : 'none'),
                        padding: collapsed ? '0.45rem 0.2rem' : '0.28rem 0.55rem',
                        fontSize: '0.76rem',
                        gap: collapsed ? 0 : '0.5rem',
                        minHeight: '30px'
                      }}
                      title={collapsed ? item.name : undefined}
                    >
                      <span className="menu-item-emoji" style={{ fontSize: collapsed ? '1.2rem' : '0.88rem', flexShrink: 0, lineHeight: 1 }} title={item.name}>{item.emoji}</span>
                      {!collapsed && <span className="menu-item-text" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>}
                    </button>
                  </li>
                );
              })}
          </>
        )}
      </ul>

      <div className="sidebar-footer" style={{ padding: '0.45rem 0.65rem', gap: '0.35rem' }}>
        <div 
          className="user-profile"
          onClick={() => setIsProfileModalOpen(true)}
          title="Configuración de Perfil y Sistema"
          style={{ cursor: 'pointer', gap: '0.5rem' }}
        >
          <div className="user-avatar-wrapper" style={{ width: '32px', height: '32px' }}>
            {user?.foto_perfil ? (
              <img src={user.foto_perfil} alt={user?.nombre} className="user-avatar-img" style={{ width: '32px', height: '32px' }} />
            ) : (
              <div className="user-avatar" style={{ width: '32px', height: '32px', fontSize: '0.85rem' }}>
                {user?.nombre ? user.nombre.substring(0, 1).toUpperCase() : 'U'}
              </div>
            )}
          </div>

          {!collapsed && (
            <div className="user-info">
              <span className="user-name" style={{ fontSize: '0.78rem' }} title={user?.nombre}>{user?.nombre}</span>
              <span className="user-role" style={{ fontSize: '0.67rem' }} title={user?.rol}>{user?.rol}</span>
            </div>
          )}
        </div>

        {/* Cerrar Sesión y su botón abajo del avatar y nombre de usuario */}
        <div 
          onClick={logout}
          className="sidebar-logout-card"
          title="Cerrar Sesión"
          style={{ padding: '0.25rem 0.5rem' }}
        >
          {!collapsed && (
            <span className="sidebar-logout-label" style={{ fontSize: '0.74rem' }}>
              Cerrar Sesión
            </span>
          )}
          <button 
            type="button" 
            className="sidebar-logout-btn" 
            title="Cerrar Sesión"
            style={{ width: '24px', height: '24px' }}
            onClick={(e) => {
              e.stopPropagation();
              logout();
            }}
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>

      <UserProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
    </div>
  );
};
