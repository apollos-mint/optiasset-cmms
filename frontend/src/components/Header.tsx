import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Calendar } from 'lucide-react';
import { NotificationBell } from './NotificationBell';

interface HeaderProps {
  currentTab: string;
  onOpenTicket?: (ticketId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onOpenTicket }) => {
  const { user, exchangeRate, syncExchangeRate } = useAuth();
  
  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'inicio': return 'Panel de Inicio y Control';
      case 'operaciones': return 'Operaciones de Mantenimiento';
      case 'procura': return 'Procura e Importaciones: Matriz de Evaluación';
      case 'catalogos': return 'Catálogos Maestros de Activos y Repuestos';
      case 'almacen': return 'Campaña de Despeje de Almacén';
      case 'reportes': return 'Filtros de Búsqueda Avanzada y Reportes PDF';
      case 'usuarios': return 'Administración de Cuentas y Empleados';
      case 'auditoria': return 'Logs de Auditoría Inmutables de Base de Datos';
      case 'profit-diagnostics': return 'Módulo Enterprise ERP';
      default: return 'Panel Principal';
    }
  };

  return (
    <header 
      className="header" 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        gap: '0.75rem', 
        padding: '0 1rem', 
        overflow: 'visible',
        position: 'relative',
        zIndex: 1000
      }}
    >
      <div style={{ flex: '1 1 auto', minWidth: 0, marginRight: '0.5rem' }}>
        <h2 
          style={{ 
            fontSize: '1.02rem', 
            fontWeight: 700, 
            fontFamily: 'var(--font-title)', 
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            margin: 0,
            color: 'var(--text-title)'
          }}
          title={getTabTitle(currentTab)}
        >
          {getTabTitle(currentTab)}
        </h2>
      </div>
      
      <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'nowrap' }}>
        {/* Buzón de Notificaciones en Tiempo Real */}
        <NotificationBell onOpenTicket={onOpenTicket} />

        {/* Conexión segura e indicación de firma activa */}
        <div 
          className="header-badge-connection" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.35rem', 
            color: 'var(--color-success)', 
            fontSize: '0.72rem', 
            fontWeight: 600, 
            whiteSpace: 'nowrap',
            background: 'rgba(16, 185, 129, 0.08)',
            padding: '3px 7px',
            borderRadius: '5px',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}
          title={`Firma digital y sesión activa: ${user?.nombre || user?.nombre_usuario} (${user?.rol})`}
        >
          <ShieldCheck size={13} />
          <span>@{user?.nombre_usuario}</span>
        </div>

        {/* Calendario conciso */}
        <div 
          className="header-calendar" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.3rem', 
            color: 'var(--text-secondary)', 
            fontSize: '0.72rem', 
            whiteSpace: 'nowrap' 
          }}
          title={new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        >
          <Calendar size={13} />
          <span style={{ textTransform: 'capitalize' }}>
            {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>

        {/* Botón de Tasa Cambiaria del Día (BCV) */}
        <button
          onClick={syncExchangeRate}
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'linear-gradient(135deg, rgba(236, 119, 0, 0.08) 0%, rgba(236, 119, 0, 0.16) 100%)',
            border: '1px solid var(--color-primary)',
            color: 'var(--color-primary)',
            borderRadius: '14px',
            padding: '3px 8px',
            fontSize: '0.72rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 6px rgba(236, 119, 0, 0.12)'
          }}
          title="Tasa de Cambio Oficial de Referencia (BCV). Haz clic para actualizar."
        >
          Tasa BCV: $1 = Bs. {exchangeRate.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </button>
      </div>
    </header>
  );
};
