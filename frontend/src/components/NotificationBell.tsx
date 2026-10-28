import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserNotification } from '../types';
import { 
  Bell, 
  Check, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  MessageSquare, 
  Award,
  ExternalLink,
  X
} from 'lucide-react';

interface NotificationBellProps {
  onOpenTicket?: (ticketId: string) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onOpenTicket }) => {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(() => typeof window !== 'undefined' && window.innerWidth < 640);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notificaciones || []);
        setUnreadCount(data.no_leidas || 0);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Polling ligero cada 25 segundos para avisos en tiempo real
    const interval = setInterval(fetchNotifications, 25000);
    return () => clearInterval(interval);
  }, [token]);

  const handleMarkAsRead = async (id: number | 'all', ticketId?: string) => {
    if (!token) return;
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
      if (ticketId && onOpenTicket) {
        setIsOpen(false);
        onOpenTicket(ticketId);
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const getNotificationIcon = (tipo: string) => {
    switch (tipo) {
      case 'WARNING':
        return <AlertTriangle size={16} style={{ color: 'var(--color-danger)' }} />;
      case 'INCENTIVO':
        return <Award size={16} style={{ color: '#eab308' }} />;
      case 'ESTADO_ACTUALIZADO':
        return <CheckCircle2 size={16} style={{ color: 'var(--color-success)' }} />;
      case 'COMENTARIO':
        return <MessageSquare size={16} style={{ color: 'var(--color-primary)' }} />;
      default:
        return <Clock size={16} style={{ color: 'var(--color-info)' }} />;
    }
  };

  const toggleDropdown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(prev => {
      const next = !prev;
      if (next) fetchNotifications();
      return next;
    });
  };

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem' }} ref={dropdownRef}>
      {/* Texto Notificaciones a la izquierda de la campana */}
      <span
        onClick={toggleDropdown}
        style={{
          fontSize: '0.825rem',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'color var(--transition-fast)',
          whiteSpace: 'nowrap'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-primary)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
        title="Buzón de Notificaciones"
      >
        Notificaciones
      </span>

      {/* Botón Campana con Badge */}
      <button
        type="button"
        onClick={toggleDropdown}
        style={{
          background: isOpen ? 'rgba(236, 119, 0, 0.15)' : 'rgba(120, 120, 120, 0.08)',
          border: isOpen ? '1px solid var(--color-primary)' : '1px solid var(--border-color)',
          borderRadius: '50%',
          width: '38px',
          height: '38px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: unreadCount > 0 ? 'var(--color-primary)' : 'var(--text-secondary)',
          cursor: 'pointer',
          position: 'relative',
          transition: 'all var(--transition-fast)',
          flexShrink: 0
        }}
        title={unreadCount > 0 ? `Tienes ${unreadCount} avisos no leídos` : 'Buzón de notificaciones'}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#ef4444',
              color: '#ffffff',
              fontSize: '0.68rem',
              fontWeight: 800,
              borderRadius: '10px',
              padding: '1px 6px',
              minWidth: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 5px rgba(239, 68, 68, 0.5)',
              border: '2px solid var(--bg-secondary)'
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover / Menú Desplegable con Backdrop */}
      {isOpen && (
        <>
          {/* Backdrop semitransparente que garantiza cerrar al tocar fuera en cualquier pantalla */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 99998,
              background: 'rgba(0, 0, 0, 0.35)',
              cursor: 'pointer'
            }}
            onClick={() => setIsOpen(false)}
          />

          <div
            onClick={(e) => e.stopPropagation()}
            style={isMobile ? {
              position: 'fixed',
              top: '56px',
              left: '10px',
              right: '10px',
              maxHeight: 'calc(100vh - 75px)',
              backgroundColor: 'var(--bg-secondary)',
              border: '1.5px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 16px 40px rgba(0,0,0,0.7), 0 4px 16px rgba(0,0,0,0.4)',
              zIndex: 99999,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            } : {
              position: 'absolute',
              top: '46px',
              right: 0,
              width: '380px',
              maxWidth: 'calc(100vw - 32px)',
              maxHeight: '480px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 12px 36px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.25)',
              zIndex: 99999,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Cabecera del Buzón */}
            <div
              style={{
                padding: '0.9rem 1.2rem',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'var(--bg-primary)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bell size={16} style={{ color: 'var(--color-primary)' }} />
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-title)' }}>
                  Buzón de Avisos & Tareas
                </span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => handleMarkAsRead('all')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-primary)',
                      fontSize: '0.725rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.2rem'
                    }}
                  >
                    <Check size={12} />
                    <span>Marcar todo leído</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px'
                  }}
                  title="Cerrar"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

          {/* Lista de Notificaciones */}
          <div
            style={{
              overflowY: 'auto',
              flex: 1,
              maxHeight: '380px',
              backgroundColor: 'var(--bg-secondary)'
            }}
          >
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: '3rem 1.5rem',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem'
                }}
              >
                <Bell size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                <p style={{ margin: 0 }}>No tienes notificaciones registradas</p>
              </div>
            ) : (
              notifications.map((n) => {
                const dateObj = new Date(n.fecha_creacion);
                const dateStr = dateObj.toLocaleDateString('es-ES', { 
                  weekday: 'short', 
                  day: 'numeric', 
                  month: 'short' 
                });
                const timeStr = dateObj.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                });

                return (
                  <div
                    key={n.id}
                    onClick={() => handleMarkAsRead(n.id, n.ticket_id)}
                    style={{
                      padding: '0.85rem 1.1rem',
                      borderBottom: '1px solid var(--border-color)',
                      backgroundColor: n.leido ? 'var(--bg-secondary)' : 'rgba(236, 119, 0, 0.12)',
                      cursor: 'pointer',
                      transition: 'background var(--transition-fast)',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-primary)')}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = n.leido ? 'var(--bg-secondary)' : 'rgba(236, 119, 0, 0.12)')
                    }
                  >
                    {!n.leido && (
                      <div
                        style={{
                          position: 'absolute',
                          left: '6px',
                          top: '16px',
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: 'var(--color-primary)'
                        }}
                      />
                    )}

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                      <div style={{ marginTop: '2px', flexShrink: 0 }}>
                        {getNotificationIcon(n.tipo)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                          <span style={{ fontSize: '0.825rem', fontWeight: n.leido ? 600 : 700, color: 'var(--text-title)' }}>
                            {n.titulo}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', margin: '0 0 0.4rem 0', lineHeight: 1.35 }}>
                          {n.mensaje}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          <span>
                            {n.remitente_nombre ? `Por: ${n.remitente_nombre}` : 'Sistema Automático'}
                          </span>
                          <span>
                            {dateStr} • {timeStr}
                          </span>
                        </div>
                        {n.ticket_id && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-primary)', fontSize: '0.72rem', marginTop: '0.35rem', fontWeight: 600 }}>
                            <span>Abrir Solicitud ({n.ticket_id})</span>
                            <ExternalLink size={10} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pie del desplegable */}
          <div
            style={{
              padding: '0.65rem 1rem',
              backgroundColor: 'var(--bg-primary)',
              borderTop: '1px solid var(--border-color)',
              textAlign: 'center',
              fontSize: '0.7rem',
              color: 'var(--text-muted)'
            }}
          >
            Trazabilidad y auditoría de lecturas en tiempo real
          </div>
        </div>
      </>
    )}
  </div>
);
};
