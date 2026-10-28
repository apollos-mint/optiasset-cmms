import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CorporateTicket } from '../types';
import { 
  FolderKanban, 
  Plus, 
  Filter, 
  Eye, 
  Send, 
  Link as LinkIcon, 
  Calendar, 
  ArrowRight,
  MessageSquare,
  Trash2,
  Search,
  FileText,
  Users
} from 'lucide-react';
import { SpanishSpellAssistant } from './SpanishSpellAssistant';

interface CorporateTicketsHubProps {
  initialTicketId?: string | null;
  onClearInitialTicket?: () => void;
}

export const CorporateTicketsHub: React.FC<CorporateTicketsHubProps> = ({ 
  initialTicketId, 
  onClearInitialTicket 
}) => {
  const { token, user } = useAuth();
  const [tickets, setTickets] = useState<CorporateTicket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [usersList, setUsersList] = useState<Array<{ 
    id: string; 
    nombre: string; 
    rol: string; 
    departamento?: string; 
    cargo?: string; 
    foto_perfil?: string;
  }>>([]);
  
  // Filtros
  const [deptFilter, setDeptFilter] = useState<string>('Todos');
  const [priorityFilter, setPriorityFilter] = useState<string>('Todas');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [onlyMine, setOnlyMine] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Privilegios Ver vs Editar (estricto)
  const canEditTickets = user?.rol === 'Administrador' 
    ? true 
    : !!user?.permisos?.editar_tickets || (!!user?.permisos?.editar_inicio && user?.permisos?.editar_tickets !== false);

  // Modales
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [selectedTicket, setSelectedTicket] = useState<CorporateTicket | null>(null);
  const [newCommentText, setNewCommentText] = useState<string>('');

  // Formulario nuevo ticket
  const [formTitle, setFormTitle] = useState<string>('');
  const [formDesc, setFormDesc] = useState<string>('');
  const [formDept, setFormDept] = useState<string>('Operaciones');
  const [formPriority, setFormPriority] = useState<'Baja' | 'Media' | 'Alta' | 'Critica'>('Media');
  const [formDeadline, setFormDeadline] = useState<string>('');
  const [formAssignees, setFormAssignees] = useState<string[]>([]);
  const [formStakeholders, setFormStakeholders] = useState<string[]>([]);
  const [stakeholderSearch, setStakeholderSearch] = useState<string>('');
  const [formNeedsOf, setFormNeedsOf] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [departments, setDepartments] = useState<string[]>([
    'Presidencia y Dirección',
    'Operaciones y Mantenimiento',
    'Procura e Importaciones',
    'Administración y Finanzas',
    'Almacén y Repuestos',
    'Taller / Mantenimiento', 
    'Logística'
  ]);

  useEffect(() => {
    if (!token) return;
    fetch('/api/departamentos', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.ok ? res.json() : [])
      .then((data: Array<{ nombre: string }>) => {
        if (data && data.length > 0) {
          const names = Array.from(new Set([...data.map(d => d.nombre), ...departments]));
          setDepartments(names);
        }
      })
      .catch(() => {});
  }, [token]);

  const fetchTickets = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (deptFilter !== 'Todos') params.append('departamento', deptFilter);
      if (priorityFilter !== 'Todas') params.append('prioridad', priorityFilter);
      if (statusFilter !== 'Todos') params.append('estado', statusFilter);
      if (onlyMine) params.append('solo_mis_tickets', 'true');
      if (searchTerm) params.append('search', searchTerm);

      const res = await fetch(`/api/tickets?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (err) {
      console.error('Error cargando tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/auth/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
        if (data.length > 0) {
          setFormAssignees(prev => {
            if (prev.length > 0) return prev;
            const currentInList = data.find((u: any) => u.id === user?.id);
            return [currentInList ? currentInList.id : data[0].id];
          });
        }
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [token, deptFilter, priorityFilter, statusFilter, onlyMine, searchTerm]);

  useEffect(() => {
    fetchUsers();
  }, [token]);

  useEffect(() => {
    if (showCreateModal) {
      fetchUsers();
    }
  }, [showCreateModal]);

  // Si se pasa un ticket inicial para abrir (por ejemplo desde una notificación)
  useEffect(() => {
    if (initialTicketId) {
      openTicketDetail(initialTicketId);
      if (onClearInitialTicket) onClearInitialTicket();
    }
  }, [initialTicketId]);

  const openTicketDetail = async (ticketId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedTicket(data);
        // Refrescar lista para reflejar que ya fue visto
        fetchTickets();
      }
    } catch (err) {
      console.error('Error al abrir detalle:', err);
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!window.confirm("¿Está seguro de que desea eliminar este ticket corporativo? Se archivará de forma segura en la bitácora de auditoría.")) {
      return;
    }
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al eliminar el ticket corporativo.');
      }
      alert(data.message || 'Ticket eliminado correctamente.');
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(null);
      }
      fetchTickets();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setFormError(null);

    if (formAssignees.length === 0) {
      setFormError('Por favor asigne al menos un empleado responsable.');
      return;
    }

    if (!formDeadline) {
      setFormError('Por favor especifique la fecha y hora límite (deadline).');
      return;
    }

    setSubmitting(true);

    try {
      const selectedAssigneeObjects = usersList
        .filter(u => formAssignees.includes(u.id))
        .map(u => ({ id: u.id, nombre: u.nombre, rol: u.rol }));

      const selectedStakeholderObjects = usersList
        .filter(u => formStakeholders.includes(u.id))
        .map(u => ({ id: u.id, nombre: u.nombre, rol: u.rol }));

      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          titulo: formTitle,
          descripcion: formDesc,
          departamento: formDept,
          prioridad: formPriority,
          deadline: formDeadline,
          asignado_a_id: formAssignees[0],
          asignados: selectedAssigneeObjects,
          stakeholders: selectedStakeholderObjects,
          necesita_de: formNeedsOf
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al crear solicitud.');
      }

      setShowCreateModal(false);
      // Reset form
      setFormTitle('');
      setFormDesc('');
      setFormNeedsOf('');
      setFormStakeholders([]);
      setStakeholderSearch('');
      if (usersList.length > 0) {
        setFormAssignees([usersList[0].id]);
      } else {
        setFormAssignees([]);
      }
      fetchTickets();
    } catch (err: any) {
      setFormError(err.message || 'Error al guardar.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (ticketId: string, nuevoEstado: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/tickets/${ticketId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      if (res.ok) {
        openTicketDetail(ticketId);
        fetchTickets();
      }
    } catch (err) {
      console.error('Error actualizando estado:', err);
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedTicket || !newCommentText.trim()) return;

    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ mensaje: newCommentText })
      });
      if (res.ok) {
        setNewCommentText('');
        openTicketDetail(selectedTicket.id);
      }
    } catch (err) {
      console.error('Error enviando comentario:', err);
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'Critica':
        return <span className="badge" style={{ background: '#ef4444', color: '#fff', fontWeight: 700 }}>Crítica</span>;
      case 'Alta':
        return <span className="badge" style={{ background: '#f97316', color: '#fff', fontWeight: 700 }}>Alta</span>;
      case 'Media':
        return <span className="badge" style={{ background: '#3b82f6', color: '#fff', fontWeight: 600 }}>Media</span>;
      default:
        return <span className="badge" style={{ background: '#64748b', color: '#fff', fontWeight: 600 }}>Baja</span>;
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'Completado':
        return <span className="badge badge-success" style={{ fontWeight: 700 }}>✓ Completado</span>;
      case 'En Proceso':
        return <span className="badge badge-info" style={{ fontWeight: 700 }}>En Proceso</span>;
      case 'Rechazado':
        return <span className="badge badge-danger" style={{ fontWeight: 700 }}>Rechazado</span>;
      default:
        return <span className="badge badge-warning" style={{ fontWeight: 700 }}>Pendiente</span>;
    }
  };

  return (
    <div>
      {/* Barra de Acciones y Filtros */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FolderKanban style={{ color: 'var(--color-primary)' }} />
              <span>Mesa de Proyectos & Intercomunicación Corporativa</span>
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0.25rem 0 0 0' }}>
              Control de solicitudes interdepartamentales, dependencias operativas y auditoría de tiempos de respuesta.
            </p>
          </div>

          {canEditTickets && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}
            >
              <Plus size={16} />
              <span>Crear Solicitud / Ticket PM</span>
            </button>
          )}
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <Filter size={14} />
            <span>Filtros:</span>
          </div>

          <select 
            className="form-input" 
            style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
          >
            <option value="Todos">Todos los Departamentos</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <select 
            className="form-input" 
            style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
          >
            <option value="Todas">Todas las Prioridades</option>
            <option value="Critica">Crítica</option>
            <option value="Alta">Alta</option>
            <option value="Media">Media</option>
            <option value="Baja">Baja</option>
          </select>

          <select 
            className="form-input" 
            style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="Todos">Todos los Estados</option>
            <option value="Pendiente">Pendiente</option>
            <option value="En Proceso">En Proceso</option>
            <option value="Completado">Completado</option>
            <option value="Rechazado">Rechazado</option>
          </select>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <input 
              type="checkbox" 
              checked={onlyMine} 
              onChange={e => setOnlyMine(e.target.checked)} 
            />
            <span>Mis asignaciones y creados</span>
          </label>

          <div style={{ flex: 1, minWidth: '180px' }}>
            <input
              type="text"
              className="form-input"
              style={{ width: '100%', padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
              placeholder="Buscar por título, ID o descripción..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Lista de Tickets */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner" style={{ width: '36px', height: '36px' }}></div>
        </div>
      ) : tickets.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <FolderKanban size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
          <h4 style={{ margin: '0 0 0.5rem 0' }}>No se encontraron solicitudes o tickets</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Crea un nuevo ticket para coordinar tareas entre departamentos.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {tickets.map(t => {
            const isAssignedToMe = t.asignado_a_id === user?.id;
            const deadlineDate = new Date(t.deadline);
            const isOverdue = t.estado !== 'Completado' && new Date() > deadlineDate;

            return (
              <div 
                key={t.id} 
                className="card" 
                style={{ 
                  padding: '1.25rem',
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  borderLeft: `4px solid ${
                    t.prioridad === 'Critica' ? '#ef4444' : 
                    t.prioridad === 'Alta' ? '#f97316' : 
                    t.prioridad === 'Media' ? '#3b82f6' : '#64748b'
                  }`,
                  position: 'relative'
                }}
              >
                <div>
                  {/* Encabezado del Ticket */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-primary)' }}>{t.id}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>• {t.departamento}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      {getPriorityBadge(t.prioridad)}
                      {getStatusBadge(t.estado)}
                    </div>
                  </div>

                  {/* Título y descripción */}
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-title)' }}>
                    {t.titulo}
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 1rem 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {t.descripcion}
                  </p>

                  {/* Dependencia si existe */}
                  {t.necesita_de && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.4rem', 
                      fontSize: '0.75rem', 
                      color: 'var(--color-warning)', 
                      background: 'rgba(234, 179, 8, 0.08)',
                      padding: '0.35rem 0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: '0.75rem'
                    }}>
                      <LinkIcon size={12} />
                      <span><b>Necesita de:</b> {t.necesita_de}</span>
                    </div>
                  )}

                  {/* Asignado y Creador */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block' }}>Asignado a:</span>
                      <span style={{ fontWeight: 600, color: isAssignedToMe ? 'var(--color-primary)' : 'var(--text-title)' }}>
                        {t.asignado_nombre} {isAssignedToMe && '(Tú)'}
                        {Array.isArray(t.asignados) && t.asignados.length > 1 && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '0.25rem', fontWeight: 500 }}>
                            (+{t.asignados.length - 1} más)
                          </span>
                        )}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block' }}>Solicitante:</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-title)' }}>
                        {t.creador_nombre}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pie de Auditoría y SLA */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.725rem', marginBottom: '0.65rem' }}>
                    {/* Fecha Límite */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: isOverdue ? 'var(--color-danger)' : 'var(--text-secondary)', fontWeight: isOverdue ? 700 : 500 }}>
                      <Calendar size={13} />
                      <span>Plazo: {deadlineDate.toLocaleDateString()} {deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {isOverdue && <span style={{ color: 'var(--color-danger)' }}>⚠️ Vencido</span>}
                    </div>

                    {/* Trazabilidad de Lectura */}
                    <div>
                      {t.primera_lectura_at ? (
                        <span style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: 600 }} title={`Visto el ${new Date(t.primera_lectura_at).toLocaleString()}`}>
                          <Eye size={12} />
                          <span>Abierto en {t.minutos_para_abrir !== undefined ? `${t.minutos_para_abrir}m` : 'tiempo'}</span>
                        </span>
                      ) : (
                        <span style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
                          Sin abrir aún
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      <MessageSquare size={13} />
                      <span>{t.total_comentarios || 0} mensajes</span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                        onClick={() => openTicketDetail(t.id)}
                      >
                        <span>Gestionar</span>
                        <ArrowRight size={12} />
                      </button>
                      {(user?.rol === 'Administrador' || t.creador_id === user?.id) && (
                        <button
                          type="button"
                          className="btn btn-danger"
                          style={{ padding: '0.35rem 0.55rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center' }}
                          onClick={() => handleDeleteTicket(t.id)}
                          title="Eliminar Ticket"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREAR NUEVA SOLICITUD / TICKET PM                   */}
      {/* ========================================================= */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div 
            className="modal-content" 
            style={{ 
              maxWidth: '720px', 
              width: '94%', 
              maxHeight: '92vh', 
              display: 'flex', 
              flexDirection: 'column', 
              padding: 0, 
              overflow: 'hidden',
              borderRadius: '16px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.45)'
            }}
          >
            {/* Cabecera Naranja */}
            <div 
              className="modal-header" 
              style={{
                background: 'linear-gradient(135deg, #ff9233 0%, #ec7700 100%)',
                color: '#ffffff',
                padding: '1.15rem 1.5rem',
                borderBottom: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0
              }}
            >
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.2rem', color: '#ffffff', fontWeight: 800 }}>
                <Plus style={{ color: '#ffffff' }} size={22} />
                <span>Nueva Solicitud Interdepartamental / Ticket PM</span>
              </h3>
              <button 
                type="button" 
                className="modal-close" 
                style={{ color: '#ffffff', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>

            {formError && (
              <div style={{ margin: '0.75rem 1.5rem 0 1.5rem', padding: '0.65rem 0.85rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="modal-body" style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              
              {/* ========================================================= */}
              {/* SECCIÓN 1: ASPECTOS DESCRIPTIVOS DE LA SOLICITUD          */}
              {/* ========================================================= */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.65rem', 
                  padding: '0.5rem 0.75rem', 
                  background: 'rgba(236, 119, 0, 0.08)', 
                  borderRadius: '8px', 
                  borderLeft: '4px solid var(--color-primary)' 
                }}>
                  <div style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center' }}>
                    <FileText size={18} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-title)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      1. Aspectos Descriptivos de la Solicitud
                    </h4>
                    <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                      Identificación, departamento destino, prioridad requerida y fecha límite.
                    </span>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Título / Asunto de la Solicitud *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: Despeje y traslado de repuestos a Taller Central"
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    spellCheck={true}
                    lang="es"
                    required
                  />
                  <SpanishSpellAssistant text={formTitle} onChange={setFormTitle} label="Título del ticket" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>Departamento Destino *</label>
                    <select 
                      className="form-input" 
                      value={formDept}
                      onChange={e => setFormDept(e.target.value)}
                      required
                    >
                      {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>Nivel de Urgencia / Prioridad *</label>
                    <select 
                      className="form-input" 
                      value={formPriority}
                      onChange={e => setFormPriority(e.target.value as any)}
                      required
                    >
                      <option value="Baja">Baja (Planificable)</option>
                      <option value="Media">Media (Estándar)</option>
                      <option value="Alta">Alta (Requiere pronto despacho)</option>
                      <option value="Critica">Crítica (Detiene operaciones)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Fecha y Hora Límite (Deadline) *</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={formDeadline}
                    onChange={e => setFormDeadline(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Detalle y Especificaciones de la Tarea *</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder="Describe con precisión qué se debe ejecutar, requerimientos y condiciones de entrega..."
                    value={formDesc}
                    onChange={e => setFormDesc(e.target.value)}
                    spellCheck={true}
                    lang="es"
                    required
                  />
                  <SpanishSpellAssistant text={formDesc} onChange={setFormDesc} label="Detalle de la tarea" showPreview={true} />
                </div>
              </div>

              {/* ========================================================= */}
              {/* LÍNEA SEPARADORA DE PROCESO (FASE 1 -> FASE 2)            */}
              {/* ========================================================= */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.85rem', 
                margin: '0.25rem 0' 
              }}>
                <div style={{ flex: 1, height: '1.5px', background: 'linear-gradient(90deg, transparent, var(--border-color), var(--border-color))' }} />
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  Fase de Personal &bull; Responsables y Notificados
                </span>
                <div style={{ flex: 1, height: '1.5px', background: 'linear-gradient(90deg, var(--border-color), var(--border-color), transparent)' }} />
              </div>

              {/* ========================================================= */}
              {/* SECCIÓN 2: ASIGNACIÓN DE PERSONAL Y DIFUSIÓN              */}
              {/* ========================================================= */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.65rem', 
                  padding: '0.5rem 0.75rem', 
                  background: 'rgba(59, 130, 246, 0.08)', 
                  borderRadius: '8px', 
                  borderLeft: '4px solid #3b82f6' 
                }}>
                  <div style={{ color: '#3b82f6', display: 'flex', alignItems: 'center' }}>
                    <Users size={18} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-title)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      2. Asignación de Personal y Responsables
                    </h4>
                    <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                      Designación de ejecutores directos de la tarea y colaboradores con notificación activa.
                    </span>
                  </div>
                </div>

                {/* Empleados Asignados (Multi-selección) */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label className="form-label" style={{ marginBottom: 0, fontWeight: 600 }}>
                      Empleados Asignados (Responsables) *
                    </label>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 700 }}>
                      {formAssignees.length} seleccionado{formAssignees.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Chips de asignados */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.45rem', minHeight: '32px', alignItems: 'center' }}>
                    {formAssignees.length === 0 ? (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        Sin responsables asignados aún. Selecciona al menos uno.
                      </span>
                    ) : (
                      formAssignees.map(aId => {
                        const userObj = usersList.find(u => u.id === aId);
                        if (!userObj) return null;
                        return (
                          <span
                            key={aId}
                            style={{
                              background: 'rgba(236, 119, 0, 0.15)',
                              border: '1px solid rgba(236, 119, 0, 0.4)',
                              color: 'var(--text-primary)',
                              padding: '0.25rem 0.6rem',
                              borderRadius: '16px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem'
                            }}
                          >
                            <span>{userObj.nombre}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.725rem' }}>({userObj.cargo || userObj.rol})</span>
                            <button
                              type="button"
                              onClick={() => {
                                if (formAssignees.length > 1) {
                                  setFormAssignees(formAssignees.filter(id => id !== aId));
                                } else {
                                  alert('Debe quedar al menos un empleado asignado.');
                                }
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--color-danger)',
                                cursor: 'pointer',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                padding: 0,
                                marginLeft: '0.2rem'
                              }}
                              title="Remover responsable"
                            >
                              ✕
                            </button>
                          </span>
                        );
                      })
                    )}
                  </div>

                  <select 
                    className="form-input"
                    value=""
                    onChange={e => {
                      const id = e.target.value;
                      if (id && !formAssignees.includes(id)) {
                        setFormAssignees([...formAssignees, id]);
                        setFormStakeholders(formStakeholders.filter(sId => sId !== id));
                      }
                    }}
                  >
                    <option value="">+ Asignar a otro empleado responsable...</option>
                    {usersList
                      .filter(u => !formAssignees.includes(u.id))
                      .map(u => (
                        <option key={u.id} value={u.id}>
                          {u.nombre} ({u.cargo || u.rol}) {u.departamento ? `• ${u.departamento}` : ''}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Stakeholders Involucrados - Tabla Nombre / Rol / Departamento */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label className="form-label" style={{ marginBottom: 0, fontWeight: 600 }}>
                      Stakeholders Involucrados / Notificados ({formStakeholders.length})
                    </label>
                    <div style={{ position: 'relative', width: '240px' }}>
                      <Search size={13} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        placeholder="Buscar nombre, rol o depto..."
                        value={stakeholderSearch}
                        onChange={e => setStakeholderSearch(e.target.value)}
                        className="form-input"
                        style={{
                          padding: '0.25rem 0.5rem 0.25rem 1.7rem',
                          fontSize: '0.75rem',
                          height: '28px'
                        }}
                      />
                      {stakeholderSearch && (
                        <button
                          type="button"
                          onClick={() => setStakeholderSearch('')}
                          style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '11px' }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ 
                    maxHeight: '145px', 
                    overflowY: 'auto', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: 'var(--radius-sm)', 
                    background: 'rgba(0,0,0,0.1)'
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                      <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left', fontSize: '0.725rem', textTransform: 'uppercase' }}>
                          <th style={{ padding: '0.45rem 0.6rem', width: '32px', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={
                                usersList.filter(u => !formAssignees.includes(u.id)).length > 0 &&
                                usersList
                                  .filter(u => !formAssignees.includes(u.id))
                                  .every(u => formStakeholders.includes(u.id))
                              }
                              onChange={e => {
                                const available = usersList.filter(u => !formAssignees.includes(u.id));
                                if (e.target.checked) {
                                  setFormStakeholders(Array.from(new Set([...formStakeholders, ...available.map(u => u.id)])));
                                } else {
                                  const availIds = new Set(available.map(u => u.id));
                                  setFormStakeholders(formStakeholders.filter(id => !availIds.has(id)));
                                }
                              }}
                              title="Seleccionar todos"
                            />
                          </th>
                          <th style={{ padding: '0.45rem 0.6rem' }}>Nombre</th>
                          <th style={{ padding: '0.45rem 0.6rem' }}>Cargo / Rol</th>
                          <th style={{ padding: '0.45rem 0.6rem' }}>Departamento</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const filtered = usersList
                            .filter(u => !formAssignees.includes(u.id))
                            .filter(u => {
                              if (!stakeholderSearch.trim()) return true;
                              const q = stakeholderSearch.toLowerCase();
                              return (
                                u.nombre.toLowerCase().includes(q) || 
                                u.rol.toLowerCase().includes(q) ||
                                (u.cargo && u.cargo.toLowerCase().includes(q)) ||
                                (u.departamento && u.departamento.toLowerCase().includes(q))
                              );
                            });

                          if (filtered.length === 0) {
                            return (
                              <tr>
                                <td colSpan={4} style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                  {usersList.length === 0 ? 'Cargando directorio de colaboradores...' : 'No hay usuarios disponibles.'}
                                </td>
                              </tr>
                            );
                          }

                          return filtered.map(u => {
                            const isChecked = formStakeholders.includes(u.id);
                            return (
                              <tr 
                                key={u.id}
                                onClick={() => {
                                  if (isChecked) {
                                    setFormStakeholders(formStakeholders.filter(id => id !== u.id));
                                  } else {
                                    setFormStakeholders([...formStakeholders, u.id]);
                                  }
                                }}
                                style={{
                                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                                  cursor: 'pointer',
                                  background: isChecked ? 'rgba(236, 119, 0, 0.08)' : 'transparent'
                                }}
                              >
                                <td style={{ padding: '0.4rem 0.6rem', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={e => {
                                      if (e.target.checked) {
                                        setFormStakeholders([...formStakeholders, u.id]);
                                      } else {
                                        setFormStakeholders(formStakeholders.filter(id => id !== u.id));
                                      }
                                    }}
                                  />
                                </td>
                                <td style={{ padding: '0.4rem 0.6rem', fontWeight: 600, color: isChecked ? 'var(--color-primary)' : 'var(--text-primary)' }}>
                                  {u.nombre}
                                </td>
                                <td style={{ padding: '0.4rem 0.6rem', color: 'var(--text-secondary)' }}>
                                  {u.cargo || u.rol}
                                </td>
                                <td style={{ padding: '0.4rem 0.6rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                  {u.departamento || 'General'}
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* ========================================================= */}
              {/* LÍNEA SEPARADORA DE PROCESO (FASE 2 -> FASE 3)            */}
              {/* ========================================================= */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.85rem', 
                margin: '0.25rem 0' 
              }}>
                <div style={{ flex: 1, height: '1.5px', background: 'linear-gradient(90deg, transparent, var(--border-color), var(--border-color))' }} />
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  Fase de Viabilidad &bull; Dependencias
                </span>
                <div style={{ flex: 1, height: '1.5px', background: 'linear-gradient(90deg, var(--border-color), var(--border-color), transparent)' }} />
              </div>

              {/* ========================================================= */}
              {/* SECCIÓN 3: DEPENDENCIAS Y CONDICIONES OPERATIVAS          */}
              {/* ========================================================= */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.65rem', 
                  padding: '0.5rem 0.75rem', 
                  background: 'rgba(16, 185, 129, 0.08)', 
                  borderRadius: '8px', 
                  borderLeft: '4px solid #10b981' 
                }}>
                  <div style={{ color: '#10b981', display: 'flex', alignItems: 'center' }}>
                    <LinkIcon size={18} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-title)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      3. Dependencias y Condiciones Operativas
                    </h4>
                    <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                      Requisitos previos, aprobaciones o insumos que deben estar concluidos antes de iniciar.
                    </span>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Dependencias ("Necesita de...")</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: Aprobación previa de compras / Llegada del camión FVR / Factura 0375"
                    value={formNeedsOf}
                    onChange={e => setFormNeedsOf(e.target.value)}
                  />
                </div>
              </div>

              </div>

              {/* Pie de Acciones Fijo al Fondo */}
              <div className="modal-footer" style={{ 
                flexShrink: 0, 
                padding: '1rem 1.5rem', 
                borderTop: '1px solid var(--border-color)', 
                background: 'var(--bg-primary)', 
                display: 'flex', 
                justifyContent: 'flex-end', 
                gap: '0.75rem',
                boxShadow: '0 -4px 14px rgba(0, 0, 0, 0.25)',
                zIndex: 10
              }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
                >
                  <Send size={14} />
                  <span>{submitting ? 'Emitiendo y Notificando...' : 'Crear y Notificar Solicitud'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: DETALLE DE TICKET, SLA & CONVERSACIÓN              */}
      {/* ========================================================= */}
      {selectedTicket && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '750px', width: '92%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-primary)' }}>{selectedTicket.id}</span>
                  {getPriorityBadge(selectedTicket.prioridad)}
                  {getStatusBadge(selectedTicket.estado)}
                </div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-title)' }}>
                  {selectedTicket.titulo}
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {(user?.rol === 'Administrador' || selectedTicket.creador_id === user?.id) && (
                  <button 
                    type="button" 
                    className="btn btn-danger" 
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                    onClick={() => handleDeleteTicket(selectedTicket.id)}
                    title="Eliminar este ticket"
                  >
                    <Trash2 size={13} />
                    <span>Eliminar</span>
                  </button>
                )}
                <button 
                  type="button" 
                  className="modal-close" 
                  onClick={() => setSelectedTicket(null)}
                >
                  ✕
                </button>
              </div>
            </div>

            <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1 }}>
              {/* Bloque de Métricas de Performance y Auditoría */}
              <div style={{ 
                background: 'rgba(59, 130, 246, 0.05)', 
                border: '1px solid rgba(59, 130, 246, 0.2)', 
                borderRadius: 'var(--radius-sm)', 
                padding: '1rem', 
                marginBottom: '1.25rem' 
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Trazabilidad Inmutable & Métricas de Auditoría
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginTop: '0.5rem', fontSize: '0.8rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Fecha de Emisión:</span>
                    <span style={{ fontWeight: 600 }}>{new Date(selectedTicket.fecha_creacion).toLocaleString()}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Primera Apertura / Lectura:</span>
                    {selectedTicket.primera_lectura_at ? (
                      <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>
                        Visto tras {selectedTicket.minutos_para_abrir} min ({new Date(selectedTicket.primera_lectura_at).toLocaleTimeString()})
                      </span>
                    ) : (
                      <span style={{ color: '#ef4444', fontWeight: 700 }}>Pendiente de apertura</span>
                    )}
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Plazo Límite (Deadline):</span>
                    <span style={{ fontWeight: 600 }}>{new Date(selectedTicket.deadline).toLocaleString()}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Resolución:</span>
                    {selectedTicket.completado_at ? (
                      <span style={{ color: selectedTicket.cumplio_deadline ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 700 }}>
                        {selectedTicket.cumplio_deadline ? '✓ En tiempo' : '⚠️ Fuera de plazo'} ({selectedTicket.minutos_para_completar} min)
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>En curso</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Descripción */}
              <div style={{ marginBottom: '1.25rem' }}>
                <h5 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0 0 0.4rem 0', color: 'var(--text-title)' }}>
                  Descripción de la Tarea:
                </h5>
                <div style={{ background: 'rgba(0,0,0,0.05)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {selectedTicket.descripcion}
                </div>
              </div>

              {/* Dependencias y Stakeholders */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem', fontSize: '0.8rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontWeight: 600, marginBottom: '0.2rem' }}>
                    Requisitos Previos ("Necesita de"):
                  </span>
                  <div style={{ background: 'rgba(0,0,0,0.03)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                    {selectedTicket.necesita_de || 'Ninguno especificado'}
                  </div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontWeight: 600, marginBottom: '0.2rem' }}>
                    Stakeholders Notificados:
                  </span>
                  <div style={{ background: 'rgba(0,0,0,0.03)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                    {Array.isArray(selectedTicket.stakeholders) && selectedTicket.stakeholders.length > 0 ? (
                      selectedTicket.stakeholders.map((s, idx) => (
                        <span key={idx} className="badge badge-info" style={{ marginRight: '0.3rem', marginBottom: '0.2rem', display: 'inline-block' }}>
                          {s.nombre}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>Sin stakeholders adicionales</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Botones de Cambio de Estado */}
              {canEditTickets ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, marginRight: 'auto' }}>Cambiar Estado:</span>
                  {selectedTicket.estado !== 'En Proceso' && selectedTicket.estado !== 'Completado' && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
                      onClick={() => handleUpdateStatus(selectedTicket.id, 'En Proceso')}
                    >
                      Iniciar Trabajo (En Proceso)
                    </button>
                  )}
                  {selectedTicket.estado !== 'Completado' && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem', background: '#10b981', borderColor: '#10b981' }}
                      onClick={() => handleUpdateStatus(selectedTicket.id, 'Completado')}
                    >
                      Marcar como Completado
                    </button>
                  )}
                  {selectedTicket.estado !== 'Rechazado' && selectedTicket.estado !== 'Completado' && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem', color: 'var(--color-danger)' }}
                      onClick={() => handleUpdateStatus(selectedTicket.id, 'Rechazado')}
                    >
                      Rechazar / Cancelar
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  🔒 Modo de solo lectura: Su rol no cuenta con privilegios para modificar el estado de esta solicitud.
                </div>
              )}

              {/* Hilo de Mensajes y Comentarios */}
              <div>
                <h5 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MessageSquare size={16} />
                  <span>Historial de Mensajes & Seguimiento</span>
                </h5>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1rem', maxHeight: '250px', overflowY: 'auto' }}>
                  {(!selectedTicket.comentarios || selectedTicket.comentarios.length === 0) ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      No hay mensajes en esta solicitud.
                    </div>
                  ) : (
                    selectedTicket.comentarios.map(c => (
                      <div key={c.id} style={{ 
                        padding: '0.75rem', 
                        background: c.usuario_id === user?.id ? 'rgba(236, 119, 0, 0.08)' : 'rgba(255,255,255,0.03)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-color)',
                        alignSelf: c.usuario_id === user?.id ? 'flex-end' : 'flex-start',
                        maxWidth: '85%'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '0.25rem', fontSize: '0.725rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                            {c.autor_nombre} ({c.autor_rol})
                          </span>
                          <span style={{ color: 'var(--text-muted)' }}>
                            {new Date(c.fecha_creacion).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-title)', whiteSpace: 'pre-wrap' }}>
                          {c.mensaje}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Caja para enviar comentario */}
                {canEditTickets ? (
                  <div>
                    <form onSubmit={handleSendComment} style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        className="form-input"
                        style={{ flex: 1, fontSize: '0.85rem' }}
                        placeholder="Escribe un mensaje o actualización técnica..."
                        value={newCommentText}
                        onChange={e => setNewCommentText(e.target.value)}
                        spellCheck={true}
                        lang="es"
                      />
                      <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
                        <Send size={15} />
                      </button>
                    </form>
                    <SpanishSpellAssistant text={newCommentText} onChange={setNewCommentText} label="Mensaje" />
                  </div>
                ) : (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '0.5rem' }}>
                    🔒 Visualización activa. Añadir comentarios restringido a usuarios con permiso de edición.
                  </div>
                )}
              </div>
            </div>

            {/* Pie de Acciones Fijo */}
            <div className="modal-footer" style={{ 
              flexShrink: 0, 
              padding: '0.75rem 1.25rem', 
              borderTop: '1px solid var(--border-color)', 
              background: 'var(--bg-primary)', 
              display: 'flex', 
              justifyContent: 'flex-end', 
              boxShadow: '0 -4px 12px rgba(0,0,0,0.15)' 
            }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setSelectedTicket(null)}
              >
                Cerrar Visor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
