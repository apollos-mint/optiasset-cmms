import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Activo } from '../types';
import { ShieldAlert, Info, Search } from 'lucide-react';
import { Pagination } from './Pagination';

export const WarehouseClearout: React.FC = () => {
  const { token, user } = useAuth();
  const [stockItems, setStockItems] = useState<Activo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDestination, setFilterDestination] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // Reset pagination on filters changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDestination]);

  const fetchStock = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/assets?tipo=Stock Almacén', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setStockItems(await res.json());
      } else {
        setError('Error al obtener el inventario de almacén.');
      }
    } catch (err) {
      setError('Fallo de red al consultar catálogo de almacén.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchStock();
  }, [token]);

  const handleDestinationChange = async (id: string, newDest: string | null) => {
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/assets/${id}/warehouse-destination`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ destino_almacen: newDest || null })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar clasificación.');

      setSuccessMsg('Clasificación de destino guardada e inscripta en logs de auditoría.');
      
      // Auto close message
      setTimeout(() => setSuccessMsg(null), 3000);
      
      // Update state local list
      setStockItems(prev => prev.map(item => item.id === id ? { ...item, destino_almacen: newDest as any } : item));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const isAuthorized = user?.rol === 'Administrador' || 
                       !!user?.permisos?.editar_almacen;

  const filteredStock = stockItems.filter(item => {
    const spec = item.datos_especificos || {};
    const name = (spec.nombre_item || '').toLowerCase();
    const id = item.id.toLowerCase();
    const loc = (spec.ubicacion_fisica || '').toLowerCase();
    const sn = (spec.serial || '').toLowerCase();
    
    const query = searchTerm.toLowerCase();
    
    const matchesSearch = name.includes(query) || id.includes(query) || loc.includes(query) || sn.includes(query);
    
    const matchesFilter = filterDestination === '' 
      ? true 
      : filterDestination === 'Unclassified' 
        ? !item.destino_almacen 
        : item.destino_almacen === filterDestination;
        
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="view-container">
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="title-main">Campaña de Despeje de Almacén</h1>
        <p className="subtitle-main">Clasifique de forma obligatoria los ítems de stock inactivos para optimizar espacio físico y costes.</p>
      </div>

      {/* Alertas */}
      {error && (
        <div style={{ padding: '1rem', background: 'rgba(177, 32, 40, 0.08)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-sm)', color: 'var(--color-danger)', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}
      {successMsg && (
        <div style={{ padding: '1rem', background: 'rgba(0, 110, 150, 0.08)', border: '1px solid var(--color-success)', borderRadius: 'var(--radius-sm)', color: 'var(--color-success)', marginBottom: '1.5rem' }}>
          {successMsg}
        </div>
      )}

      <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--color-primary)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '2rem' }}>
        <Info size={24} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
        <span style={{ fontSize: '0.875rem' }}>
          <b>Aviso Operativo:</b> Para despejar stock acumulado (bombas, tanques, herramientas), el <b>Administrador</b> o el <b>Operador Logístico</b> deben seleccionar el destino correspondiente de descarte o reparación. Cada cambio queda registrado en la bitácora inmutable de auditoría del servidor.
        </span>
      </div>

      {/* Buscador y Filtrado */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Buscar por Descripción, ID, Ubicación o Lote..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            style={{ margin: 0, paddingLeft: '2.5rem' }}
          />
          <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>
        <div style={{ width: '220px' }}>
          <select 
            className="form-select" 
            value={filterDestination} 
            onChange={e => setFilterDestination(e.target.value)}
            style={{ margin: 0 }}
          >
            <option value="">Todos los Destinos</option>
            <option value="Unclassified">-- Sin Clasificar --</option>
            <option value="Para Venta">Para Venta</option>
            <option value="Para Reciclaje">Para Reciclaje</option>
            <option value="Para Mantenimiento">Para Mantenimiento</option>
            <option value="Para Eliminación">Para Eliminación</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--color-primary)', borderRadius: '50%' }}></div>
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '130px' }}>ID de Stock</th>
                <th>Descripción del Artículo</th>
                <th>Ubicación</th>
                <th>S/N o Lote</th>
                <th style={{ width: '280px' }}>Destino Asignado</th>
              </tr>
            </thead>
            <tbody>
              {filteredStock.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map(item => {
                const spec = item.datos_especificos || {};
                return (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {item.id.substring(0, 8).toUpperCase()}...
                    </td>
                    <td style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                      {spec.nombre_item || 'Artículo sin Nombre'}
                    </td>
                    <td>{spec.ubicacion_fisica || 'No especificada'}</td>
                    <td>{spec.serial || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <select 
                          className="form-select"
                          value={item.destino_almacen || ''} 
                          onChange={e => handleDestinationChange(item.id, e.target.value || null)}
                          disabled={!isAuthorized}
                          style={{ 
                            borderColor: item.destino_almacen ? 'var(--color-success)' : 'var(--color-warning)',
                            fontWeight: 600,
                            padding: '0.35rem 0.5rem',
                            fontSize: '0.8rem',
                            margin: 0
                          }}
                        >
                          <option value="">-- Sin Clasificar --</option>
                          <option value="Para Venta">Para Venta</option>
                          <option value="Para Reciclaje">Para Reciclaje</option>
                          <option value="Para Mantenimiento">Para Mantenimiento</option>
                          <option value="Para Eliminación">Para Eliminación (Desguace)</option>
                        </select>
                        {!isAuthorized && (
                          <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                            <ShieldAlert size={10} />
                            <span>Solo Lectura (Requiere Admin/Logística)</span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredStock.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    No se encontraron ítems de Stock de Almacén con los filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <Pagination
            totalItems={filteredStock.length}
            itemsPerPage={rowsPerPage}
            setItemsPerPage={setRowsPerPage}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
};
