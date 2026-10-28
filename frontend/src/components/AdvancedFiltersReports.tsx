import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { OrdenServicio } from '../types';
import { Search, RotateCcw, Download, Eye, Trash2 } from 'lucide-react';
import { Pagination } from './Pagination';

export const AdvancedFiltersReports: React.FC = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState<OrdenServicio[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [operador, setOperador] = useState('');
  const [activo, setActivo] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [tipoActivo, setTipoActivo] = useState('');
  const [estado, setEstado] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const { user } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const isAdmin = user?.rol === 'Administrador' || 
                  !!user?.permisos?.editar_reportes;

  const fetchOrderDetail = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSelectedOrder(await res.json());
      } else {
        alert('Error al cargar detalles de la orden.');
      }
    } catch (err) {
      alert('Error de conexión.');
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!window.confirm('¿Está seguro de eliminar esta orden de servicio permanentemente? Se borrarán también sus registros de insumos.')) return;
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        alert('Orden de servicio eliminada con éxito.');
        fetchFilteredOrders();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al eliminar la orden.');
      }
    } catch (err) {
      alert('Error de red.');
    }
  };

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [operador, activo, tipoActivo, estado, fechaInicio, fechaFin]);

  const fetchFilteredOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (operador) params.append('operador', operador);
      if (activo) params.append('activo', activo);
      if (fechaInicio) params.append('fecha_inicio', fechaInicio);
      if (fechaFin) params.append('fecha_fin', fechaFin);
      if (tipoActivo) params.append('tipo_activo', tipoActivo);
      if (estado) params.append('estado', estado);

      const res = await fetch(`/api/orders?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setOrders(await res.json());
      } else {
        setError('Error al consultar las órdenes filtradas.');
      }
    } catch (err) {
      setError('Fallo de red al buscar en la base de datos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchFilteredOrders();
  }, [token]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFilteredOrders();
  };

  const handleReset = () => {
    setOperador('');
    setActivo('');
    setFechaInicio('');
    setFechaFin('');
    setTipoActivo('');
    setEstado('');
    // Trigger reloading with empty filters
    setTimeout(() => {
      fetchFilteredOrders();
    }, 0);
  };

  const downloadPdf = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Error al descargar el reporte PDF.');

      // Crear un blob para descargar
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orden-mantenimiento-${orderId.substring(0,8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Error al exportar archivo.');
    }
  };

  return (
    <div className="view-container">
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="title-main">Buscador y Reportes de Taller</h1>
        <p className="subtitle-main">Consulte la bitácora histórica de reparaciones mediante filtros combinados y genere reportes oficiales.</p>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(177, 32, 40, 0.08)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-sm)', color: 'var(--color-danger)', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* Filter panel */}
      <form onSubmit={handleSearch} className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Técnico Mecánico</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Ej: Mecánico Líder" 
              value={operador} 
              onChange={e => setOperador(e.target.value)} 
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Identificación Activo (Placa/SN)</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Ej: ABC-123" 
              value={activo} 
              onChange={e => setActivo(e.target.value)} 
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Tipo Activo</label>
            <select className="form-select" value={tipoActivo} onChange={e => setTipoActivo(e.target.value)}>
              <option value="">-- Todos --</option>
              <option value="Vehículo">Vehículo</option>
              <option value="Maquinaria">Maquinaria</option>
              <option value="Edificio">Edificio</option>
              <option value="Stock Almacén">Stock Almacén</option>
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Estado Orden</label>
            <select className="form-select" value={estado} onChange={e => setEstado(e.target.value)}>
              <option value="">-- Todos --</option>
              <option value="Abierta">Abierta</option>
              <option value="En Proceso">En Proceso</option>
              <option value="Completada">Completada</option>
              <option value="Cancelada">Cancelada</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', marginTop: '1rem', alignItems: 'end' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Fecha Inicio</label>
            <input type="date" className="form-input" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
          </div>
          
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Fecha Fin</label>
            <input type="date" className="form-input" value={fechaFin} onChange={e => setFechaFin(e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={handleReset}>
              <RotateCcw size={16} />
              <span>Limpiar</span>
            </button>
            <button type="submit" className="btn btn-primary">
              <Search size={16} />
              <span>Buscar</span>
            </button>
          </div>
        </div>
      </form>

      {/* Results table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--color-primary)', borderRadius: '50%' }}></div>
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Código OT</th>
                <th>Tipo Activo</th>
                <th>Identificador</th>
                <th>Fecha Ingreso</th>
                <th>Mecánico Firma</th>
                <th>Estado</th>
                <th>Total Factura</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map(order => (
                <tr key={order.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-secondary)' }}>{order.id}</td>
                  <td>
                    <span className={`badge ${order.tipo_activo === 'Vehículo' ? 'badge-info' : 'badge-warning'}`}>
                      {order.tipo_activo}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{order.placa || order.marca || 'Equipamiento'}</td>
                  <td>{new Date(order.fecha_inicio).toLocaleDateString()}</td>
                  <td>{order.mecanico}</td>
                  <td>
                    <span className={`badge ${
                      order.estado === 'Abierta' ? 'badge-info' : 
                      order.estado === 'En Proceso' ? 'badge-warning' : 
                      order.estado === 'Completada' ? 'badge-success' : 'badge-neutral'
                    }`}>
                      {order.estado}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--color-success)' }}>
                    ${parseFloat(order.total_facturado.toString()).toFixed(2)}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '0.4rem', display: 'inline-flex', alignItems: 'center' }} 
                        onClick={() => fetchOrderDetail(order.id)}
                        title="Ver Detalles de la Orden"
                      >
                        <Eye size={14} />
                      </button>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '0.4rem', display: 'inline-flex', alignItems: 'center' }} 
                        onClick={() => downloadPdf(order.id)}
                        title="Descargar Reporte PDF"
                      >
                        <Download size={14} />
                      </button>
                      {isAdmin && (
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.4rem', display: 'inline-flex', alignItems: 'center', color: 'var(--color-danger)' }} 
                          onClick={() => deleteOrder(order.id)}
                          title="Eliminar Orden de Servicio"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {orders.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No se encontraron órdenes de servicio con los filtros especificados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <Pagination
            totalItems={orders.length}
            itemsPerPage={rowsPerPage}
            setItemsPerPage={setRowsPerPage}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        </div>
      )}

      {/* Modal Detalle de Orden (Lectura/Auditoría) */}
      {selectedOrder && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '800px', width: '95%' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>Detalle de Orden de Servicio: {selectedOrder.id}</span>
              </h3>
              <button className="btn btn-secondary" style={{ padding: '0.25rem' }} onClick={() => setSelectedOrder(null)}>✕</button>
            </div>
            
            <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', maxHeight: '500px', overflowY: 'auto' }}>
              <div>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--color-info)', marginBottom: '0.75rem', fontWeight: 600 }}>Diagnóstico Inicial e Insumos</h4>
                <div className="card" style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.01)', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>DIAGNÓSTICO REPORTADO:</span>
                  <p style={{ fontSize: '0.85rem', marginTop: '0.25rem', color: 'var(--text-primary)' }}>
                    {(() => {
                      try {
                        const parsed = JSON.parse(selectedOrder.diagnostico);
                        return parsed.diagnostico_inicial || selectedOrder.diagnostico;
                      } catch (e) {
                        return selectedOrder.diagnostico;
                      }
                    })()}
                  </p>
                </div>

                <h5 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Insumos y Repuestos Consumidos</h5>
                <div className="table-container" style={{ border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                  <table className="custom-table" style={{ fontSize: '0.75rem', margin: 0 }}>
                    <thead>
                      <tr>
                        <th>Descripción</th>
                        <th>Cant</th>
                        <th>Costo Unit.</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.insumos && selectedOrder.insumos.length > 0 ? (
                        selectedOrder.insumos.map((ins: any) => (
                          <tr key={ins.id}>
                            <td style={{ fontWeight: 600 }}>{ins.descripcion}</td>
                            <td>{ins.cantidad_usada} {ins.unidad_medida}</td>
                            <td>${parseFloat(ins.costo_unitario_historico).toFixed(2)}</td>
                            <td style={{ fontWeight: 700 }}>
                              ${(parseFloat(ins.cantidad_usada) * parseFloat(ins.costo_unitario_historico)).toFixed(2)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Ningún repuesto asociado a esta orden.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--color-success)', marginBottom: '0.75rem', fontWeight: 600 }}>Cierre y Liquidación de Taller</h4>
                <div className="card" style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.01)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>MECÁNICO ASIGNADO:</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{selectedOrder.mecanico_nombre}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>TRABAJO EJECUTADO / INFORME:</span>
                    <p style={{ fontSize: '0.85rem', marginTop: '0.25rem', color: 'var(--text-primary)' }}>{selectedOrder.reparacion_ejecutada || 'Pendiente / En Proceso'}</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>HORAS TALLER:</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{selectedOrder.horas_taller || 0} hrs</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>TASA POR HORA:</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>${parseFloat(selectedOrder.tasa_hora_taller || 0).toFixed(2)}</span>
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Total General Facturado:</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-success)' }}>
                      ${parseFloat(selectedOrder.total_facturado || 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                <h4 style={{ fontSize: '0.95rem', color: 'var(--color-primary)', marginTop: '1.25rem', marginBottom: '0.75rem', fontWeight: 600 }}>Firmas de Validación</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ padding: '0.6rem', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'rgba(255,255,255,0.01)', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'block', fontSize: '0.7rem' }}>CREADOR DE LA ORDEN:</span>
                    {selectedOrder.firma_creador ? (
                      <span>✓ {selectedOrder.firma_creador.nombre_usuario} ({new Date(selectedOrder.firma_creador.fecha).toLocaleDateString()})</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Firma faltante</span>
                    )}
                  </div>
                  <div style={{ padding: '0.6rem', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'rgba(255,255,255,0.01)', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'block', fontSize: '0.7rem' }}>AUDITORÍA / CONFORMIDAD:</span>
                    {selectedOrder.firma_auditoria ? (
                      <span>✓ {selectedOrder.firma_auditoria.nombre_usuario} ({new Date(selectedOrder.firma_auditoria.fecha).toLocaleDateString()})</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Pendiente de firma de auditoría</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-primary" onClick={() => setSelectedOrder(null)}>Cerrar Detalle</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
