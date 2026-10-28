import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AuditLog, Usuario } from '../types';
import { Search, RotateCcw, Eye, FileJson } from 'lucide-react';
import { Pagination } from './Pagination';

export const AuditLogsViewer: React.FC = () => {
  const { token } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [usersList, setUsersList] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLogForInspection, setSelectedLogForInspection] = useState<AuditLog | null>(null);

  // Filters State
  const [selectedUsuarioId, setSelectedUsuarioId] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedUsuarioId, fechaInicio, fechaFin]);

  const fetchLogs = async (uId = selectedUsuarioId, fIni = fechaInicio, fFin = fechaFin) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (uId) params.append('usuario_id', uId);
      if (fIni) params.append('fecha_inicio', fIni);
      if (fFin) params.append('fecha_fin', fFin);

      const res = await fetch(`/api/audit-logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setLogs(await res.json());
      } else {
        setError('Error al obtener la bitácora de auditoría.');
      }
    } catch (err) {
      setError('Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/auth/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setUsersList(await res.json());
      }
    } catch (err) {
      console.error('Error al obtener lista de usuarios para filtros:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchLogs();
      fetchUsers();
    }
  }, [token]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const handleReset = () => {
    setSelectedUsuarioId('');
    setFechaInicio('');
    setFechaFin('');
    fetchLogs('', '', '');
  };

  return (
    <div className="view-container">
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="title-main">Bitácora de Auditoría Inmutable</h1>
        <p className="subtitle-main">Registro estricto y secuencial de firmas digitales y transacciones ejecutadas en la base de datos.</p>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(177, 32, 40, 0.08)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-sm)', color: 'var(--color-danger)', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* Barra de Filtros de Auditoría */}
      <form onSubmit={handleSearch} className="card filter-bar-branded" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Filtrar por Usuario</label>
            <select 
              className="form-select" 
              value={selectedUsuarioId} 
              onChange={e => setSelectedUsuarioId(e.target.value)}
            >
              <option value="">-- Todos los Usuarios --</option>
              {usersList.map(u => (
                <option key={u.id} value={u.id}>@{u.nombre_usuario} ({u.nombre})</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Fecha Desde</label>
            <input 
              type="date" 
              className="form-input" 
              value={fechaInicio} 
              onChange={e => setFechaInicio(e.target.value)} 
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Fecha Hasta</label>
            <input 
              type="date" 
              className="form-input" 
              value={fechaFin} 
              onChange={e => setFechaFin(e.target.value)} 
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={handleReset}>
              <RotateCcw size={16} />
              <span>Limpiar</span>
            </button>
            <button type="submit" className="btn btn-primary">
              <Search size={16} />
              <span>Filtrar</span>
            </button>
          </div>
        </div>
      </form>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--color-primary)', borderRadius: '50%' }}></div>
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table" style={{ fontSize: '0.8rem' }}>
            <thead>
              <tr>
                <th>Fecha Servidor</th>
                <th>Usuario</th>
                <th>Acción</th>
                <th>Tabla Afectada</th>
                <th>Registro ID</th>
                <th>Detalles de Firma</th>
              </tr>
            </thead>
            <tbody>
              {logs.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map(log => (
                <tr key={log.id}>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {new Date(log.fecha_accion).toLocaleString()}
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    <div style={{ color: 'var(--text-title)' }}>{log.nombre || log.nombre_usuario || 'Desconocido'}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '1px' }}>
                      <span>@{log.nombre_usuario}</span>
                      <span className="badge badge-neutral" style={{ fontSize: '0.62rem', padding: '0.05rem 0.35rem' }}>
                        {log.rol}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${
                      log.accion.startsWith('CREAR') ? 'badge-success' : 
                      log.accion.startsWith('MODIFICAR') || log.accion.startsWith('ACTUALIZAR') ? 'badge-warning' : 
                      log.accion.startsWith('ELIMINAR') ? 'badge-danger' : 'badge-info'
                    }`} style={{ fontSize: '0.7rem' }}>
                      {log.accion}
                    </span>
                  </td>
                  <td><code>{log.tabla_afectada}</code></td>
                  <td><code>{log.registro_id.substring(0, 12)}</code></td>
                  <td>
                    {log.valores_nuevos || log.valores_anteriores ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.7rem' }}>
                        <div style={{ color: 'var(--text-secondary)' }}>
                          {log.valores_anteriores && <span><b>Anterior:</b> {JSON.stringify(log.valores_anteriores).substring(0, 60)}...</span>}
                          {log.valores_nuevos && <span><b>Nuevo:</b> {JSON.stringify(log.valores_nuevos).substring(0, 60)}...</span>}
                        </div>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{
                            padding: '0.2rem 0.5rem',
                            fontSize: '0.675rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            width: 'fit-content'
                          }}
                          onClick={() => setSelectedLogForInspection(log)}
                        >
                          <Eye size={11} /> Inspeccionar Snapshot
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>Firma Básica de Sesión</span>
                    )}
                  </td>
                </tr>
              ))}

              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    No se han registrado eventos de auditoría que coincidan con los filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <Pagination
            totalItems={logs.length}
            itemsPerPage={rowsPerPage}
            setItemsPerPage={setRowsPerPage}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        </div>
      )}

      {/* MODAL DE INSPECCIÓN FORENSE DE AUDITORÍA */}
      {selectedLogForInspection && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '750px', width: '92%', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileJson size={20} color="var(--color-primary)" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-title)' }}>
                    Inspección Forense de Auditoría #{selectedLogForInspection.id}
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Acción: <b>{selectedLogForInspection.accion}</b> • Tabla: <code>{selectedLogForInspection.tabla_afectada}</code> • ID: <code>{selectedLogForInspection.registro_id}</code>
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setSelectedLogForInspection(null)}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.775rem' }}>
                <div><b>Ejecutado por:</b> @{selectedLogForInspection.nombre_usuario || 'Desconocido'} ({selectedLogForInspection.rol})</div>
                <div><b>Fecha Servidor:</b> {new Date(selectedLogForInspection.fecha_accion).toLocaleString()}</div>
              </div>

              {selectedLogForInspection.valores_anteriores && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
                    <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>FOTOGRAFÍA DIGITAL PREVIA (VALORES ANTERIORES)</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Respaldo exacto antes de la modificación o eliminación</span>
                  </div>
                  <pre style={{
                    background: '#1e293b',
                    color: '#f8fafc',
                    padding: '1rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                    overflowX: 'auto',
                    maxHeight: '260px'
                  }}>
                    {JSON.stringify(selectedLogForInspection.valores_anteriores, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLogForInspection.valores_nuevos && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
                    <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>VALORES NUEVOS / RESULTANTES</span>
                  </div>
                  <pre style={{
                    background: '#0f172a',
                    color: '#38bdf8',
                    padding: '1rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                    overflowX: 'auto',
                    maxHeight: '260px'
                  }}>
                    {JSON.stringify(selectedLogForInspection.valores_nuevos, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ padding: '0.75rem 1.25rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedLogForInspection(null)}
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
