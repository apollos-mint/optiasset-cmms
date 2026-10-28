import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Activo, CatalogoRepuesto } from '../types';
import { Plus, Edit3, Trash2, History } from 'lucide-react';
import { Pagination } from './Pagination';

export const MasterCatalogs: React.FC = () => {
  const { token, user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'activos' | 'repuestos'>('activos');
  
  // Data lists
  const [activos, setActivos] = useState<Activo[]>([]);
  const [repuestos, setRepuestos] = useState<CatalogoRepuesto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination states
  const [activosPage, setActivosPage] = useState(1);
  const [activosRowsPerPage, setActivosRowsPerPage] = useState(20);
  const [repuestosPage, setRepuestosPage] = useState(1);
  const [repuestosRowsPerPage, setRepuestosRowsPerPage] = useState(20);

  // History Modal states
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyType, setHistoryType] = useState<'activo' | 'repuesto'>('activo');
  const [historyTitle, setHistoryTitle] = useState('');
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Asset Filter fields
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['Vehículo', 'Maquinaria', 'Edificio', 'Stock Almacén']);

  // Reset page to 1 when filters change
  useEffect(() => {
    setActivosPage(1);
    setRepuestosPage(1);
  }, [activeSubTab, selectedTypes]);

  // Asset Form fields
  const [assetId, setAssetId] = useState('');
  const [isEditAsset, setIsEditAsset] = useState(false);
  const [tipoActivo, setTipoActivo] = useState<Activo['tipo_activo']>('Vehículo');
  const [fechaCompra, setFechaCompra] = useState('');
  
  // JSONB attributes for assets (datos_especificos)
  const [placa, setPlaca] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [kilometrajeInicial, setKilometrajeInicial] = useState('0');
  const [horometroInicial, setHorometroInicial] = useState('0');
  const [numeroSerie, setNumeroSerie] = useState('');
  const [nombreItem, setNombreItem] = useState('');
  const [ubicacionFisica, setUbicacionFisica] = useState('');

  // Repuesto Form fields
  const [repuestoId, setRepuestoId] = useState<string | number | null>(null);
  const [isEditRepuesto, setIsEditRepuesto] = useState(false);
  const [descripcion, setDescripcion] = useState('');
  const [unidadMedida, setUnidadMedida] = useState<CatalogoRepuesto['unidad_medida']>('Unidades');
  const [precioReferencia, setPrecioReferencia] = useState('0.00');
  const [stockActual, setStockActual] = useState('0');
  const [proveedor, setProveedor] = useState('');

  // Search filters
  const [searchDesc, setSearchDesc] = useState('');
  const [searchProv, setSearchProv] = useState('');

  // Reset page to 1 when search changes
  useEffect(() => {
    setRepuestosPage(1);
  }, [searchDesc, searchProv]);

  const canEditActivos = user?.rol === 'Administrador' || 
                         !!user?.permisos?.editar_activos || 
                         (!!user?.permisos?.editar_catalogos && user?.permisos?.editar_activos !== false);

  const canEditRepuestos = user?.rol === 'Administrador' || 
                           !!user?.permisos?.editar_repuestos || 
                           (!!user?.permisos?.editar_catalogos && user?.permisos?.editar_repuestos !== false);

  const canEditCurrent = activeSubTab === 'activos' ? canEditActivos : canEditRepuestos;
  const isAdmin = canEditCurrent;

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeSubTab === 'activos') {
        const queryParams = selectedTypes.length > 0 ? `?tipo=${selectedTypes.join(',')}` : '?tipo=none';
        const res = await fetch(`/api/assets${queryParams}`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setActivos(await res.json());
      } else {
        const res = await fetch('/api/profit/inventory', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setRepuestos(await res.json());
      }
    } catch (err) {
      setError('Error al sincronizar datos del servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token, activeSubTab, selectedTypes]);

  const fetchHistory = async (type: 'activo' | 'repuesto', id: string | number, name: string) => {
    setHistoryLoading(true);
    setHistoryError(null);
    setHistoryType(type);
    setHistoryTitle(type === 'activo' ? `Historial de Repuestos: ${name}` : `Historial de Consumo: ${name}`);
    setShowHistoryModal(true);

    const url = type === 'activo' ? `/api/assets/${id}/parts-history` : `/api/repuestos/${id}/usage-history`;

    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setHistoryData(await res.json());
      } else {
        const err = await res.json();
        setHistoryError(err.error || 'Error al obtener el historial.');
      }
    } catch (err) {
      setHistoryError('Error de red al consultar el historial.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Build JSONB specifics based on selected type
    const datos_especificos: Record<string, any> = {};
    if (tipoActivo === 'Vehículo') {
      datos_especificos.placa = placa;
      datos_especificos.marca = marca;
      datos_especificos.modelo = modelo;
      datos_especificos.kilometraje_inicial = parseFloat(kilometrajeInicial) || 0;
    } else if (tipoActivo === 'Maquinaria') {
      datos_especificos.numero_serie = numeroSerie;
      datos_especificos.marca = marca;
      datos_especificos.modelo = modelo;
      datos_especificos.horometro_inicial = parseFloat(horometroInicial) || 0;
    } else if (tipoActivo === 'Stock Almacén') {
      datos_especificos.nombre_item = nombreItem;
      datos_especificos.ubicacion_fisica = ubicacionFisica;
      datos_especificos.serial = numeroSerie;
    } else {
      datos_especificos.marca = marca;
      datos_especificos.ubicacion_fisica = ubicacionFisica;
    }

    const method = isEditAsset ? 'PUT' : 'POST';
    const url = isEditAsset ? `/api/assets/${assetId}` : '/api/assets';
    const payload = { tipo_activo: tipoActivo, fecha_compra: fechaCompra, datos_especificos };

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al procesar el activo.');
      }

      setShowModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRepuestoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const method = isEditRepuesto ? 'PUT' : 'POST';
    const url = isEditRepuesto ? `/api/repuestos/${repuestoId}` : '/api/repuestos';
    const payload = { 
      descripcion, 
      unidad_medida: unidadMedida, 
      precio_referencia: parseFloat(precioReferencia) || 0,
      stock_actual: parseFloat(stockActual) || 0,
      proveedor
    };

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al procesar el repuesto.');
      }

      setShowModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteAsset = async (id: string) => {
    if (!window.confirm('¿Está seguro de eliminar este activo? Se comprobará su integridad.')) return;
    try {
      const res = await fetch(`/api/assets/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      alert('Error de red.');
    }
  };

  const deleteRepuesto = async (id: string | number) => {
    if (!window.confirm('¿Está seguro de eliminar este repuesto del catálogo? Se comprobará si tiene dependencias.')) return;
    try {
      const res = await fetch(`/api/repuestos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        if (data.message && data.message.includes('desactivado')) {
          alert(data.message);
        }
        fetchData();
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Error de red.');
    }
  };

  const handleEditAssetOpen = (item: Activo) => {
    setIsEditAsset(true);
    setAssetId(item.id);
    setTipoActivo(item.tipo_activo);
    setFechaCompra(item.fecha_compra.split('T')[0]);
    
    // Populate form specifics
    setPlaca(item.datos_especificos.placa || '');
    setMarca(item.datos_especificos.marca || '');
    setModelo(item.datos_especificos.modelo || '');
    setKilometrajeInicial((item.datos_especificos.kilometraje_inicial || 0).toString());
    setHorometroInicial((item.datos_especificos.horometro_inicial || 0).toString());
    setNumeroSerie(item.datos_especificos.numero_serie || item.datos_especificos.serial || '');
    setNombreItem(item.datos_especificos.nombre_item || '');
    setUbicacionFisica(item.datos_especificos.ubicacion_fisica || '');
    
    setShowModal(true);
  };

  const handleCreateAssetOpen = () => {
    setIsEditAsset(false);
    setAssetId('');
    setTipoActivo('Vehículo');
    setFechaCompra(new Date().toISOString().split('T')[0]);
    setPlaca('');
    setMarca('');
    setModelo('');
    setKilometrajeInicial('0');
    setHorometroInicial('0');
    setNumeroSerie('');
    setNombreItem('');
    setUbicacionFisica('');
    setShowModal(true);
  };

  const handleEditRepuestoOpen = (item: CatalogoRepuesto) => {
    setIsEditRepuesto(true);
    setRepuestoId(item.id);
    setDescripcion(item.descripcion);
    setUnidadMedida(item.unidad_medida);
    setPrecioReferencia(item.precio_referencia.toString());
    setStockActual((item.stock_actual || 0).toString());
    setProveedor(item.proveedor || '');
    setShowModal(true);
  };

  const handleCreateRepuestoOpen = () => {
    setIsEditRepuesto(false);
    setRepuestoId(null);
    setDescripcion('');
    setUnidadMedida('Unidades');
    setPrecioReferencia('0.00');
    setStockActual('0');
    setProveedor('');
    setShowModal(true);
  };

  return (
    <div className="view-container">
      {/* Sub-tabs menu */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem' }}>
        <button 
          className={`btn`} 
          style={{ 
            background: 'none', 
            color: activeSubTab === 'activos' ? 'var(--text-title)' : 'var(--text-secondary)',
            borderBottom: activeSubTab === 'activos' ? '3px solid var(--color-primary)' : '3px solid transparent',
            borderRadius: 0,
            padding: '0.75rem 1.5rem',
            fontWeight: 700
          }}
          onClick={() => setActiveSubTab('activos')}
        >
          Maestro de Activos
        </button>
        <button 
          className={`btn`} 
          style={{ 
            background: 'none', 
            color: activeSubTab === 'repuestos' ? 'var(--text-title)' : 'var(--text-secondary)',
            borderBottom: activeSubTab === 'repuestos' ? '3px solid var(--color-primary)' : '3px solid transparent',
            borderRadius: 0,
            padding: '0.75rem 1.5rem',
            fontWeight: 700
          }}
          onClick={() => setActiveSubTab('repuestos')}
        >
          Inventario de Repuestos e Insumos Comunes
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            {activeSubTab === 'activos' ? 'Control de Flota y Maquinaria' : 'Inventario de Repuestos e Insumos Comunes'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {activeSubTab === 'activos' 
              ? 'Administre vehículos de transporte, maquinaria pesada e infraestructura física.' 
              : 'Consulte el stock en tiempo real y precios de referencia sincronizados para la liquidación de reparaciones.'}
          </p>
        </div>

        {isAdmin && (
          <button 
            className="btn btn-primary" 
            onClick={activeSubTab === 'activos' ? handleCreateAssetOpen : handleCreateRepuestoOpen}
          >
            <Plus size={16} />
            <span>{activeSubTab === 'activos' ? 'Nuevo Activo' : 'Nuevo Repuesto'}</span>
          </button>
        )}
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(177, 32, 40, 0.08)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-sm)', color: 'var(--color-danger)', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {activeSubTab === 'activos' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1rem 1.5rem', marginBottom: '1.5rem', gap: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-info)' }}>Filtrar por Tipo de Activo (Selección Múltiple):</span>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            {['Vehículo', 'Maquinaria', 'Edificio', 'Stock Almacén'].map(type => {
              const isChecked = selectedTypes.includes(type);
              return (
                <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    style={{ cursor: 'pointer' }}
                    onChange={() => {
                      if (isChecked) {
                        setSelectedTypes(prev => prev.filter(t => t !== type));
                      } else {
                        setSelectedTypes(prev => [...prev, type]);
                      }
                    }}
                  />
                  <span>{type === 'Vehículo' ? 'Vehículos de Flota' : type === 'Maquinaria' ? 'Maquinaria Pesada' : type === 'Edificio' ? 'Edificios/Infraestructura' : 'Stock de Almacén'}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--color-primary)', borderRadius: '50%' }}></div>
        </div>
      ) : (
        <div className="table-container">
          {activeSubTab === 'activos' ? (
            <>
              <table className="custom-table">
              <thead>
                <tr>
                  <th>Tipo Activo</th>
                  <th>Identificación Principal</th>
                  <th>Especificaciones Adicionales</th>
                  <th>Fecha Registro</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {activos.slice((activosPage - 1) * activosRowsPerPage, activosPage * activosRowsPerPage).map(item => {
                  const data = item.datos_especificos;
                  return (
                    <tr key={item.id}>
                      <td>
                        <span className={`badge ${item.tipo_activo === 'Vehículo' ? 'badge-info' : item.tipo_activo === 'Maquinaria' ? 'badge-warning' : 'badge-neutral'}`}>
                          {item.tipo_activo}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {item.tipo_activo === 'Vehículo' && `Placa: ${data.placa || 'S/P'}`}
                        {item.tipo_activo === 'Maquinaria' && `S/N: ${data.numero_serie || 'S/S'}`}
                        {item.tipo_activo === 'Stock Almacén' && `Stock: ${data.nombre_item || 'S/N'}`}
                        {item.tipo_activo === 'Edificio' && `Sede: ${data.ubicacion_fisica || 'S/D'}`}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {item.tipo_activo === 'Vehículo' && `${data.marca || ''} ${data.modelo || ''} (${data.kilometraje_inicial || 0} km)`}
                        {item.tipo_activo === 'Maquinaria' && `${data.marca || ''} ${data.modelo || ''} (${data.horometro_inicial || 0} hrs)`}
                        {item.tipo_activo === 'Stock Almacén' && `Fila: ${data.ubicacion_fisica || 'N/D'} | S/N: ${data.serial || 'N/D'}`}
                        {item.tipo_activo === 'Edificio' && `Ubicación: ${data.ubicacion_fisica || 'N/D'}`}
                      </td>
                      <td>{new Date(item.fecha_compra).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.4rem' }} 
                            onClick={() => {
                              const name = item.tipo_activo === 'Vehículo' ? data.placa : 
                                           item.tipo_activo === 'Maquinaria' ? data.numero_serie :
                                           item.tipo_activo === 'Edificio' ? data.ubicacion_fisica : item.id;
                              fetchHistory('activo', item.id, name || item.id);
                            }}
                            title="Ver Historial de Reemplazos"
                          >
                            <History size={14} />
                          </button>
                          {canEditActivos && (
                            <>
                              <button className="btn btn-secondary" style={{ padding: '0.4rem' }} onClick={() => handleEditAssetOpen(item)}>
                                <Edit3 size={14} />
                              </button>
                              <button className="btn btn-secondary" style={{ padding: '0.4rem', color: 'var(--color-danger)' }} onClick={() => deleteAsset(item.id)}>
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Pagination
              totalItems={activos.length}
              itemsPerPage={activosRowsPerPage}
              setItemsPerPage={setActivosRowsPerPage}
              currentPage={activosPage}
              setCurrentPage={setActivosPage}
            />
            </>
          ) : (
            <>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Buscar por descripción (ej. aceite)..." 
                  value={searchDesc}
                  onChange={e => setSearchDesc(e.target.value)}
                  style={{ flex: 1 }}
                />
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Buscar por categoría/proveedor..." 
                  value={searchProv}
                  onChange={e => setSearchProv(e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>
              <table className="custom-table">
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th>Medida</th>
                  <th>Proveedor</th>
                  <th>Precio Venta</th>
                  <th>Costo Compra</th>
                  <th>Stock Actual</th>
                  <th>Valor Total</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {repuestos
                  .filter(item => 
                    item.descripcion.toLowerCase().includes(searchDesc.toLowerCase()) &&
                    (item.proveedor || '').toLowerCase().includes(searchProv.toLowerCase())
                  )
                  .slice((repuestosPage - 1) * repuestosRowsPerPage, repuestosPage * repuestosRowsPerPage)
                  .map(item => {
                  const costoReal = item.costo_compra && item.costo_compra > 0 ? item.costo_compra : (item.precio_referencia || 0);
                  const valorTotal = (parseFloat((item.stock_actual || 0).toString()) * parseFloat(costoReal.toString()));
                  return (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600 }}>{item.descripcion}</td>
                      <td>
                        <span className="badge badge-info">{item.unidad_medida}</span>
                      </td>
                      <td>{item.proveedor || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin proveedor</span>}</td>
                      <td style={{ fontWeight: 'bold', color: 'var(--color-success)' }}>
                        ${parseFloat((item.precio_referencia || 0).toString()).toFixed(2)}
                      </td>
                      <td style={{ fontWeight: 'bold', color: '#4ade80' }}>
                        ${parseFloat((item.costo_compra || 0).toString()).toFixed(2)}
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {parseFloat((item.stock_actual || 0).toString())}
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--color-success)' }}>
                        ${valorTotal.toFixed(2)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.4rem' }} 
                            onClick={() => fetchHistory('repuesto', item.id, item.descripcion)}
                            title="Ver Historial de Consumo"
                          >
                            <History size={14} />
                          </button>
                          {canEditRepuestos && (
                            <>
                              <button className="btn btn-secondary" style={{ padding: '0.4rem' }} onClick={() => handleEditRepuestoOpen(item)} title="Editar Insumo">
                                <Edit3 size={14} />
                              </button>
                              <button className="btn btn-secondary" style={{ padding: '0.4rem', color: 'var(--color-danger)' }} onClick={() => deleteRepuesto(item.id)} title="Borrar Insumo">
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Pagination
              totalItems={repuestos.filter(item => item.descripcion.toLowerCase().includes(searchDesc.toLowerCase()) && (item.proveedor || '').toLowerCase().includes(searchProv.toLowerCase())).length}
              itemsPerPage={repuestosRowsPerPage}
              setItemsPerPage={setRepuestosRowsPerPage}
              currentPage={repuestosPage}
              setCurrentPage={setRepuestosPage}
            />
            </>
          )}
        </div>
      )}

      {/* Modal de Historial de Reemplazos / Consumo */}
      {showHistoryModal && (
        <div className="modal-backdrop" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '850px', width: '95%' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <History size={20} style={{ color: 'var(--color-primary)' }} />
                <span>{historyTitle}</span>
              </h3>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.25rem' }} 
                onClick={() => setShowHistoryModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body" style={{ minHeight: '200px' }}>
              {historyError && (
                <div style={{ padding: '1rem', background: 'rgba(177, 32, 40, 0.08)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-sm)', color: 'var(--color-danger)', marginBottom: '1.5rem' }}>
                  {historyError}
                </div>
              )}

              {historyLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                  <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--color-primary)', borderRadius: '50%' }}></div>
                </div>
              ) : historyData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                  No se registran transacciones de repuestos o instalación para este elemento.
                </div>
              ) : (
                <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <table className="custom-table" style={{ fontSize: '0.8rem' }}>
                    <thead>
                      {historyType === 'activo' ? (
                        <tr>
                          <th>Fecha</th>
                          <th>Insumo / Repuesto</th>
                          <th>Cant. Instalada</th>
                          <th>Costo Unit.</th>
                          <th>Costo Total</th>
                          <th>Mecánico Responsable</th>
                          <th>Orden ID</th>
                        </tr>
                      ) : (
                        <tr>
                          <th>Fecha</th>
                          <th>Activo Beneficiado</th>
                          <th>Tipo Activo</th>
                          <th>Cant. Consumida</th>
                          <th>Costo Unit.</th>
                          <th>Costo Total</th>
                          <th>Mecánico Responsable</th>
                          <th>Orden ID</th>
                        </tr>
                      )}
                    </thead>
                    <tbody>
                      {historyData.map((row) => {
                        const subtotal = parseFloat(row.cantidad_usada) * parseFloat(row.costo_unitario_historico);
                        return (
                          <tr key={row.id}>
                            <td style={{ color: 'var(--text-secondary)' }}>
                              {new Date(row.fecha_fin || row.fecha_inicio).toLocaleDateString()}
                            </td>
                            {historyType === 'activo' ? (
                              <>
                                <td style={{ fontWeight: 600 }}>{row.descripcion}</td>
                                <td>
                                  <span className="badge badge-info">
                                    {row.cantidad_usada} {row.unidad_medida}
                                  </span>
                                </td>
                              </>
                            ) : (
                              <>
                                <td style={{ fontWeight: 600 }}>
                                  {row.tipo_activo === 'Vehículo' && `Placa: ${row.datos_especificos?.placa || 'S/P'}`}
                                  {row.tipo_activo === 'Maquinaria' && `S/N: ${row.datos_especificos?.numero_serie || 'S/S'}`}
                                  {row.tipo_activo === 'Stock Almacén' && `Stock: ${row.datos_especificos?.nombre_item || 'S/N'}`}
                                  {row.tipo_activo === 'Edificio' && `Sede: ${row.datos_especificos?.ubicacion_fisica || 'S/D'}`}
                                </td>
                                <td>
                                  <span className={`badge ${row.tipo_activo === 'Vehículo' ? 'badge-info' : row.tipo_activo === 'Maquinaria' ? 'badge-warning' : 'badge-neutral'}`}>
                                    {row.tipo_activo}
                                  </span>
                                </td>
                                <td>
                                  <span className="badge badge-info">
                                    {row.cantidad_usada} {row.unidad_medida || 'Unidades'}
                                  </span>
                                </td>
                              </>
                            )}
                            <td style={{ color: 'var(--text-secondary)' }}>
                              ${parseFloat(row.costo_unitario_historico).toFixed(2)}
                            </td>
                            <td style={{ fontWeight: 700, color: 'var(--color-success)' }}>
                              ${subtotal.toFixed(2)}
                            </td>
                            <td>{row.mecanico_nombre || 'S/D'}</td>
                            <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                              {row.orden_id.substring(0, 8)}...
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={() => setShowHistoryModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Assets Create/Edit */}
      {showModal && activeSubTab === 'activos' && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3>{isEditAsset ? 'Actualizar Activo Fijo' : 'Cargar Activo Operativo'}</h3>
              <button className="btn btn-secondary" style={{ padding: '0.25rem' }} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAssetSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Tipo Activo</label>
                    <select 
                      className="form-select" 
                      value={tipoActivo} 
                      onChange={e => setTipoActivo(e.target.value as Activo['tipo_activo'])}
                      disabled={isEditAsset}
                    >
                      <option value="Vehículo">Vehículo de Flota</option>
                      <option value="Maquinaria">Maquinaria Pesada</option>
                      <option value="Edificio">Edificio/Infraestructura</option>
                      <option value="Stock Almacén">Stock Almacén (Auditable)</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Fecha de Compra/Puesta en Marcha</label>
                    <input type="date" className="form-input" value={fechaCompra} onChange={e => setFechaCompra(e.target.value)} required />
                  </div>
                </div>

                <hr style={{ borderColor: 'var(--border-color)', margin: '1rem 0' }} />
                <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--color-info)' }}>
                  Especificaciones Técnicas (JSONB Flexible)
                </h4>

                {/* Form Fields changing dynamically */}
                {tipoActivo === 'Vehículo' && (
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Número de Placa</label>
                        <input type="text" className="form-input" placeholder="ABC-123" value={placa} onChange={e => setPlaca(e.target.value.toUpperCase())} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Kilometraje Inicial</label>
                        <input type="number" className="form-input" value={kilometrajeInicial} onChange={e => setKilometrajeInicial(e.target.value)} required />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Marca</label>
                        <input type="text" className="form-input" placeholder="Toyota, Mercedes, etc." value={marca} onChange={e => setMarca(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Modelo</label>
                        <input type="text" className="form-input" placeholder="Hilux, Atego, etc." value={modelo} onChange={e => setModelo(e.target.value)} required />
                      </div>
                    </div>
                  </>
                )}

                {tipoActivo === 'Maquinaria' && (
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Número de Serie (S/N)</label>
                        <input type="text" className="form-input" placeholder="CAT-992G-XXXX" value={numeroSerie} onChange={e => setNumeroSerie(e.target.value.toUpperCase())} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Horómetro Inicial (Hrs)</label>
                        <input type="number" className="form-input" value={horometroInicial} onChange={e => setHorometroInicial(e.target.value)} required />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Marca</label>
                        <input type="text" className="form-input" placeholder="Caterpillar, Komatsu" value={marca} onChange={e => setMarca(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Modelo</label>
                        <input type="text" className="form-input" placeholder="Excavadora 320" value={modelo} onChange={e => setModelo(e.target.value)} required />
                      </div>
                    </div>
                  </>
                )}

                {tipoActivo === 'Stock Almacén' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Nombre del Ítem</label>
                      <input type="text" className="form-input" placeholder="Bomba Hidráulica, Tanque de Acero, etc." value={nombreItem} onChange={e => setNombreItem(e.target.value)} required />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Ubicación Física en Almacén</label>
                        <input type="text" className="form-input" placeholder="Pasillo A - Estante 4" value={ubicacionFisica} onChange={e => setUbicacionFisica(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Número de Serie o Lote</label>
                        <input type="text" className="form-input" value={numeroSerie} onChange={e => setNumeroSerie(e.target.value)} />
                      </div>
                    </div>
                  </>
                )}

                {tipoActivo === 'Edificio' && (
                  <div className="form-group">
                    <label className="form-label">Ubicación Física / Dirección</label>
                    <input type="text" className="form-input" placeholder="Planta Central - Oficina 10" value={ubicacionFisica} onChange={e => setUbicacionFisica(e.target.value)} required />
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Registrar Activo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Spare parts Create/Edit */}
      {showModal && activeSubTab === 'repuestos' && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{isEditRepuesto ? 'Actualizar Repuesto Catálogo' : 'Añadir Insumo o Repuesto Nuevo'}</h3>
              <button className="btn btn-secondary" style={{ padding: '0.25rem' }} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleRepuestoSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Descripción Técnica</label>
                  <input type="text" className="form-input" value={descripcion} onChange={e => setDescripcion(e.target.value)} required />
                </div>
                
                 <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Unidad de Medida</label>
                    <select className="form-select" value={unidadMedida} onChange={e => setUnidadMedida(e.target.value as CatalogoRepuesto['unidad_medida'])}>
                      <option value="Unidades">Unidades (Piezas)</option>
                      <option value="Litros">Litros</option>
                      <option value="Galones">Galones</option>
                      <option value="Kits">Kits (Conjunto)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Precio Referencia ($)</label>
                    <input type="number" step="0.01" className="form-input" value={precioReferencia} onChange={e => setPrecioReferencia(e.target.value)} required />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Stock Actual (Para sincronización ERP Enterprise ERP)</label>
                  <input type="number" step="any" className="form-input" value={stockActual} onChange={e => setStockActual(e.target.value)} required />
                </div>

                <div className="form-group">
                  <label className="form-label">Proveedor (Fabricante / Distribuidor)</label>
                  <input type="text" className="form-input" placeholder="Ej: Distribuidora Repuestos C.A." value={proveedor} onChange={e => setProveedor(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Repuesto</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
