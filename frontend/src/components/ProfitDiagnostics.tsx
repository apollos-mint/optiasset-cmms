import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, Calendar, RefreshCw, CalendarDays, Eye, FileText } from 'lucide-react';
import { Pagination } from './Pagination';


interface ActivityLog {
  Accion: string;
  Usuario: string;
  Fecha: string;
  Documento_Nro: string;
  Documento_Tipo: string;
  Detalle: string;
}

interface PurchaseAnalysis {
  id: string;
  descripcion: string;
  stock_actual: number;
  ultima_compra_fecha: string | null;
  ultima_compra_costo: number;
  ultima_compra_cantidad: number;
  ultima_compra_moneda: string | null;
}

interface CurrencySummary {
  moneda: string;
  total_facturas: number;
  monto_total: number;
}

interface DeliveryNote {
  doc_num: string;
  fec_emis: string;
  fec_reg: string;
  tasa: number;
  co_mone: string;
  total_bruto: number;
  total_neto: number;
  co_cli: string;
  cli_des: string;
  descrip: string;
  co_us_in: string;
  us_nom?: string;
}

interface DocumentDetail {
  header: {
    doc_num: string;
    fec_emis: string;
    fec_reg: string;
    tasa: number;
    co_mone: string;
    total_bruto: number;
    total_neto: number;
    co_prov: string;
    prov_des: string;
    descrip: string;
  };
  rows: Array<{
    reng_num: number;
    co_art: string;
    des_art: string;
    total_art: number;
    cost_unit: number;
    cost_unit_om: number;
    reng_neto: number;
  }>;
}

// Searchable Multi-Select Tag Dropdown
const SearchableMultiSelect: React.FC<{
  label: string;
  placeholder: string;
  options: { id: string; name: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
}> = ({ label, placeholder, options, selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt =>
    opt.id.toLowerCase().includes(search.toLowerCase()) ||
    opt.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(item => item !== id));
    } else {
      onChange([...selected, id]);
    }
    setSearch('');
  };

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter(item => item !== id));
  };

  return (
    <div ref={containerRef} style={{ flex: '1 1 240px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </label>
      
      <div 
        onClick={() => setIsOpen(true)}
        style={{
          minHeight: '38px',
          background: 'var(--input-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          padding: '4px 8px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px',
          alignItems: 'center',
          cursor: 'text',
          position: 'relative'
        }}
      >
        {selected.map(id => {
          const opt = options.find(o => o.id === id);
          return (
            <span key={id} style={{
              background: 'var(--color-primary)',
              color: '#fff',
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: '4px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              {opt ? `${opt.id} - ${opt.name.slice(0, 15)}` : id}
              <button 
                onClick={(e) => handleRemove(id, e)}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, fontSize: '10px', display: 'flex', alignItems: 'center' }}
              >
                ✕
              </button>
            </span>
          );
        })}
        
        <input
          type="text"
          placeholder={selected.length === 0 ? placeholder : ''}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontSize: '0.85rem',
            flex: 1,
            minWidth: '60px',
            padding: '2px 0'
          }}
        />
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '4px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          maxHeight: '200px',
          overflowY: 'auto',
          zIndex: 1000,
          boxShadow: 'var(--shadow-md)'
        }}>
          {filteredOptions.length === 0 ? (
            <div style={{ padding: '8px 12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              No se encontraron resultados
            </div>
          ) : (
            filteredOptions.map(opt => {
              const isSelected = selected.includes(opt.id);
              return (
                <div
                  key={opt.id}
                  onClick={() => handleSelect(opt.id)}
                  style={{
                    padding: '8px 12px',
                    fontSize: '0.85rem',
                    color: isSelected ? 'var(--color-primary)' : 'var(--text-primary)',
                    background: isSelected ? 'var(--bg-gradient-accent)' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid var(--border-color)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-gradient-accent)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = isSelected ? 'var(--bg-gradient-accent)' : 'transparent'}
                >
                  <span style={{ fontWeight: isSelected ? 'bold' : 'normal' }}>
                    {opt.id} - {opt.name}
                  </span>
                  {isSelected && <span style={{ fontSize: '10px' }}>✓</span>}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

interface ProfitDiagnosticsProps {
  inlineMode?: boolean;
}

export const ProfitDiagnostics: React.FC<ProfitDiagnosticsProps> = ({ inlineMode = false }) => {
  const { token, user } = useAuth();
  const canEdit = !!(user?.permisos && user.permisos['modificar_profit_diagnostics']);
  const [activeTab, setActiveTab] = useState<'activity' | 'deliveries' | 'receptions' | 'purchases' | 'currencies'>(
    inlineMode ? 'deliveries' : 'activity'
  );
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dropdown Lists for filters
  const [dropdownVehicles, setDropdownVehicles] = useState<{ id: string; name: string }[]>([]);
  const [dropdownUsers, setDropdownUsers] = useState<{ id: string; name: string }[]>([]);

  // Selected Filter States
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedUsersActivity, setSelectedUsersActivity] = useState<string[]>([]);

  // Data States
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>([]);
  const [receptionNotes, setReceptionNotes] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<PurchaseAnalysis[]>([]);
  const [currencies, setCurrencies] = useState<CurrencySummary[]>([]);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // Filters
  const [filterFechaInicio, setFilterFechaInicio] = useState('');
  const [filterFechaFin, setFilterFechaFin] = useState('');
  const [filterDocNum, setFilterDocNum] = useState('');
  const [selectedSubTab, setSelectedSubTab] = useState<string>('Todos');

  // Simulator Modal States
  interface OpenProfitDoc {
    type: string;
    id: string;
    details: DocumentDetail | null;
    minimized: boolean;
    loading: boolean;
  }
  const [openDocs, setOpenDocs] = useState<OpenProfitDoc[]>([]);

  // Load dropdown lists once
  useEffect(() => {
    if (token) {
      fetch('/api/profit-diagnostics/dropdowns', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          setDropdownVehicles((data.vehicles || []).map((v: any) => ({ id: v.co_cli, name: v.cli_des })));
          setDropdownUsers((data.users || []).map((u: any) => ({ id: u.Cod_Usuario, name: u.Desc_Usuario })));
        })
        .catch(err => console.error('Error loading filters:', err));
    }
  }, [token]);

  const fetchData = async (isInitial = false) => {
    if (isInitial) {
      setInitialLoading(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      if (activeTab === 'activity') {
        const queryParams = new URLSearchParams();
        if (selectedUsersActivity.length > 0) {
          queryParams.append('usuario', selectedUsersActivity.join(','));
        }
        if (filterFechaInicio) queryParams.append('fecha_inicio', filterFechaInicio);
        if (filterFechaFin) queryParams.append('fecha_fin', filterFechaFin);
        if (selectedSubTab && selectedSubTab !== 'Todos') {
          queryParams.append('tipo_documento', selectedSubTab);
        }

        const res = await fetch(`/api/profit-diagnostics/activity?${queryParams.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) setActivities(await res.json());
      } else if (activeTab === 'deliveries') {
        const queryParams = new URLSearchParams();
        if (filterFechaInicio) queryParams.append('fecha_inicio', filterFechaInicio);
        if (filterFechaFin) queryParams.append('fecha_fin', filterFechaFin);
        if (selectedVehicles.length > 0) queryParams.append('vehiculos', selectedVehicles.join(','));
        if (selectedUsers.length > 0) queryParams.append('usuarios', selectedUsers.join(','));
        if (filterDocNum.trim()) queryParams.append('doc_num', filterDocNum.trim());

        const res = await fetch(`/api/profit-diagnostics/delivery-notes?${queryParams.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) setDeliveryNotes(await res.json());
      } else if (activeTab === 'receptions') {
        const queryParams = new URLSearchParams();
        if (filterFechaInicio) queryParams.append('fecha_inicio', filterFechaInicio);
        if (filterFechaFin) queryParams.append('fecha_fin', filterFechaFin);
        if (selectedUsers.length > 0) queryParams.append('usuarios', selectedUsers.join(','));
        if (filterDocNum.trim()) queryParams.append('doc_num', filterDocNum.trim());

        const res = await fetch(`/api/profit-diagnostics/reception-notes?${queryParams.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) setReceptionNotes(await res.json());
      } else if (activeTab === 'purchases') {
        const res = await fetch('/api/profit-diagnostics/purchases-analysis', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) setPurchases(await res.json());
      } else if (activeTab === 'currencies') {
        const res = await fetch('/api/profit-diagnostics/currencies-summary', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) setCurrencies(await res.json());
      }
    } catch (err) {
      setError('Error al sincronizar datos de Enterprise ERP.');
    } finally {
      setInitialLoading(false);
      setLoading(false);
    }
  };

  // Re-fetch when date/search filters change (Debounced to avoid rapid queries)
  useEffect(() => {
    if (token && (activeTab === 'activity' || activeTab === 'deliveries' || activeTab === 'receptions')) {
      const delayDebounceFn = setTimeout(() => {
        fetchData();
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [filterFechaInicio, filterFechaFin, filterDocNum, token]);

  // Re-fetch instantly when selected sub-tab or multi-select changes
  useEffect(() => {
    if (token && activeTab === 'activity') {
      fetchData();
    }
  }, [selectedSubTab]);

  useEffect(() => {
    if (token && activeTab === 'activity') {
      fetchData();
    }
  }, [selectedUsersActivity]);

  useEffect(() => {
    if (token && (activeTab === 'deliveries' || activeTab === 'receptions')) {
      fetchData();
    }
  }, [selectedVehicles, selectedUsers]);

  // Initial fetch on main tab change
  useEffect(() => {
    if (token) {
      fetchData(true);
    }
  }, [token, activeTab]);

  // Reset page on tab/search/subtab/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, selectedSubTab, selectedVehicles, selectedUsers, selectedUsersActivity, filterDocNum]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-VE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleClearFilters = () => {
    setFilterFechaInicio('');
    setFilterFechaFin('');
    setFilterDocNum('');
    setSelectedSubTab('Todos');
    setSelectedVehicles([]);
    setSelectedUsers([]);
    setSelectedUsersActivity([]);
  };

  // Maps user code to full display name. If us_nom is provided from backend, uses it directly.
  const getUserDisplayName = (userCode: string, fullName?: string) => {
    if (!userCode) return '-';
    const trimmed = userCode.trim();
    // Prefer the resolved full name from the backend JOIN or the dropdown lookup
    const resolvedName = fullName && fullName !== trimmed ? fullName : (dropdownUsers.find(u => u.id === trimmed)?.name);
    if (resolvedName) {
      return (
        <span style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{trimmed}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>{resolvedName}</span>
        </span>
      );
    }
    return <span style={{ fontWeight: 600 }}>{trimmed}</span>;
  };

  const handleViewDocument = async (type: string, id: string) => {
    if (openDocs.some(d => d.type === type && d.id === id)) {
      setOpenDocs(prev => prev.map(d => (d.type === type && d.id === id) ? { ...d, minimized: false } : d));
      return;
    }

    const newDoc: OpenProfitDoc = { type, id, details: null, minimized: false, loading: true };
    setOpenDocs(prev => [...prev, newDoc]);

    try {
      const res = await fetch(`/api/profit-diagnostics/document/${encodeURIComponent(type)}/${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOpenDocs(prev => prev.map(d => (d.type === type && d.id === id) ? { ...d, details: data, loading: false } : d));
      } else {
        setError('No se pudo cargar el detalle del documento.');
        setOpenDocs(prev => prev.filter(d => !(d.type === type && d.id === id)));
      }
    } catch (err) {
      setError('Error al consultar el detalle del documento.');
      setOpenDocs(prev => prev.filter(d => !(d.type === type && d.id === id)));
    }
  };

  const isFilterActive = !!(filterDocNum.trim() || selectedVehicles.length > 0 || selectedUsers.length > 0 || filterFechaInicio || filterFechaFin);

  return (
    <div className={inlineMode ? "" : "view-container"} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Tab Buttons (Only in full mode) */}
      {!inlineMode && (
        <div className="tabs-container" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button
              onClick={() => setActiveTab('activity')}
              className={`tab-btn-link ${activeTab === 'activity' ? 'active' : ''}`}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: activeTab === 'activity' ? 'var(--color-primary)' : 'var(--text-secondary)',
                fontSize: '1rem',
                fontWeight: 600,
                padding: '8px 16px',
                cursor: 'pointer',
                borderBottom: activeTab === 'activity' ? '2px solid var(--color-primary)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              Bitácora de Usuarios
            </button>
            <button
              onClick={() => setActiveTab('deliveries')}
              className={`tab-btn-link ${activeTab === 'deliveries' ? 'active' : ''}`}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: activeTab === 'deliveries' ? 'var(--color-primary)' : 'var(--text-secondary)',
                fontSize: '1rem',
                fontWeight: 600,
                padding: '8px 16px',
                cursor: 'pointer',
                borderBottom: activeTab === 'deliveries' ? '2px solid var(--color-primary)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              Notas de Entrega (Flota)
            </button>
            <button
              onClick={() => setActiveTab('purchases')}
              className={`tab-btn-link ${activeTab === 'purchases' ? 'active' : ''}`}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: activeTab === 'purchases' ? 'var(--color-primary)' : 'var(--text-secondary)',
                fontSize: '1rem',
                fontWeight: 600,
                padding: '8px 16px',
                cursor: 'pointer',
                borderBottom: activeTab === 'purchases' ? '2px solid var(--color-primary)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              Trazabilidad de Compras (Stock 0)
            </button>
            <button
              onClick={() => setActiveTab('currencies')}
              className={`tab-btn-link ${activeTab === 'currencies' ? 'active' : ''}`}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: activeTab === 'currencies' ? 'var(--color-primary)' : 'var(--text-secondary)',
                fontSize: '1rem',
                fontWeight: 600,
                padding: '8px 16px',
                cursor: 'pointer',
                borderBottom: activeTab === 'currencies' ? '2px solid var(--color-primary)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              Distribución de Divisas
            </button>
          </div>
        </div>
      )}

      {/* Inline Mode Sub-tabs (Pill selection like Screenshot 22-15-36) */}
      {inlineMode && (
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <button
            onClick={() => {
              setActiveTab('deliveries');
              handleClearFilters();
            }}
            style={{
              background: activeTab === 'deliveries' ? 'var(--color-primary)' : 'rgba(120, 120, 120, 0.08)',
              color: activeTab === 'deliveries' ? '#fff' : 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              padding: '6px 14px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Notas de Entrega
          </button>
          <button
            onClick={() => {
              setActiveTab('receptions');
              handleClearFilters();
            }}
            style={{
              background: activeTab === 'receptions' ? 'var(--color-primary)' : 'rgba(120, 120, 120, 0.08)',
              color: activeTab === 'receptions' ? '#fff' : 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              padding: '6px 14px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Notas de Recepción
          </button>
        </div>
      )}

      {/* Title & Header Section (Only in full mode) */}
      {!inlineMode && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
              {activeTab === 'activity' && 'Auditoría y Bitácora de Transacciones'}
              {activeTab === 'deliveries' && 'Notas de Entrega y Despacho de Repuestos'}
              {activeTab === 'purchases' && 'Inventario de Repuestos e Insumos Comunes'}
              {activeTab === 'currencies' && 'Distribución de Divisas en Compras'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px', marginBottom: 0 }}>
              {activeTab === 'activity' && 'Consulte los registros históricos de movimientos, ajustes e insumos en Enterprise ERP.'}
              {activeTab === 'deliveries' && 'Consulte todos los despachos y entregas de repuestos emitidos a la flota de vehículos.'}
              {activeTab === 'purchases' && 'Consulte el stock en tiempo real y precios de referencia sincronizados para la liquidación de reparaciones.'}
              {activeTab === 'currencies' && 'Análisis global de compras registradas en moneda extranjera y nacional.'}
            </p>
          </div>
          <button 
            className="btn btn-secondary" 
            onClick={() => fetchData()} 
            disabled={loading || !canEdit} 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: !canEdit ? 'not-allowed' : 'pointer', opacity: !canEdit ? 0.6 : 1 }}
            title={!canEdit ? "No tienes permisos para sincronizar" : "Actualizar datos desde Enterprise ERP"}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            {canEdit ? 'Sincronizar' : 'Sincronizar (Bloqueado)'}
          </button>
        </div>
      )}

      {/* Inline Mode Filter Panel */}
      {inlineMode && (
        <div className={`filter-panel filter-bar-branded ${isFilterActive ? 'active' : ''}`} style={{ 
          padding: '16px', 
          marginBottom: '16px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          alignItems: 'flex-end'
        }}>
          {/* Buscar por número de documento */}
          <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              BUSCAR POR # DOCUMENTO
            </label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Nro. de documento..."
                className="form-control"
                value={filterDocNum}
                onChange={(e) => setFilterDocNum(e.target.value)}
                style={{ paddingLeft: '36px', width: '100%', boxSizing: 'border-box', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', height: '38px', borderRadius: '4px' }}
              />
            </div>
          </div>

          {/* Vehiculos (solo para Notas de Entrega) */}
          {activeTab === 'deliveries' && (
            <SearchableMultiSelect
              label="Vehículos / Equipos"
              placeholder="Seleccione vehículos..."
              options={dropdownVehicles}
              selected={selectedVehicles}
              onChange={setSelectedVehicles}
            />
          )}

          {/* Usuarios */}
          <SearchableMultiSelect
            label="Usuarios Profit"
            placeholder="Seleccione usuarios..."
            options={dropdownUsers}
            selected={selectedUsers}
            onChange={setSelectedUsers}
          />

          {/* Fecha Desde */}
          <div style={{ flex: '1 1 180px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              FECHA DESDE
            </label>
            <div style={{ position: 'relative' }}>
              <CalendarDays size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
              <input
                type="date"
                className="form-control"
                value={filterFechaInicio}
                onChange={(e) => setFilterFechaInicio(e.target.value)}
                style={{ paddingLeft: '36px', width: '100%', boxSizing: 'border-box', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', height: '38px', borderRadius: '4px' }}
              />
            </div>
          </div>

          {/* Fecha Hasta */}
          <div style={{ flex: '1 1 180px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              FECHA HASTA
            </label>
            <div style={{ position: 'relative' }}>
              <CalendarDays size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
              <input
                type="date"
                className="form-control"
                value={filterFechaFin}
                onChange={(e) => setFilterFechaFin(e.target.value)}
                style={{ paddingLeft: '36px', width: '100%', boxSizing: 'border-box', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', height: '38px', borderRadius: '4px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => fetchData()} 
              disabled={loading} 
              style={{ height: '38px', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Actualizar datos desde Enterprise ERP"
            >
              <RefreshCw size={16} className={loading ? 'spin' : ''} />
              <span>Sincronizar</span>
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={handleClearFilters}
              disabled={selectedVehicles.length === 0 && selectedUsers.length === 0 && !filterFechaInicio && !filterFechaFin && !filterDocNum}
              style={{ height: '38px', padding: '0 16px', display: 'flex', alignItems: 'center' }}
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      )}

      {error && <div className="alert alert-danger" style={{ marginBottom: '20px' }}>{error}</div>}

      {initialLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="tab-content" style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
          
          {/* TAB: ACTIVITY */}
          {activeTab === 'activity' && (
            <div>
              {/* Filter Panel */}
              {!inlineMode && (
                <div className="filter-panel filter-bar-branded" style={{ 
                  padding: '16px', 
                  marginBottom: '24px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '16px',
                  alignItems: 'flex-end'
                }}>
                  {/* Searchable Multi-Select Dropdown for Activity Users */}
                  <SearchableMultiSelect
                    label="Filtrar por Usuario"
                    placeholder="Seleccione usuarios..."
                    options={dropdownUsers}
                    selected={selectedUsersActivity}
                    onChange={setSelectedUsersActivity}
                  />

                  <div style={{ flex: '1 1 180px' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      FECHA DESDE
                    </label>
                    <div style={{ position: 'relative' }}>
                      <CalendarDays size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
                      <input
                        type="date"
                        className="form-control"
                        value={filterFechaInicio}
                        onChange={(e) => setFilterFechaInicio(e.target.value)}
                        style={{ paddingLeft: '36px', width: '100%', boxSizing: 'border-box', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', height: '38px', borderRadius: '4px' }}
                      />
                    </div>
                  </div>

                  <div style={{ flex: '1 1 180px' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      FECHA HASTA
                    </label>
                    <div style={{ position: 'relative' }}>
                      <CalendarDays size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
                      <input
                        type="date"
                        className="form-control"
                        value={filterFechaFin}
                        onChange={(e) => setFilterFechaFin(e.target.value)}
                        style={{ paddingLeft: '36px', width: '100%', boxSizing: 'border-box', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', height: '38px', borderRadius: '4px' }}
                      />
                    </div>
                  </div>

                  <button 
                    className="btn btn-secondary" 
                    onClick={handleClearFilters}
                    disabled={selectedUsersActivity.length === 0 && !filterFechaInicio && !filterFechaFin && selectedSubTab === 'Todos'}
                    style={{ height: '38px', padding: '0 16px', display: 'flex', alignItems: 'center' }}
                  >
                    Limpiar Filtros
                  </button>
                </div>
              )}

              {/* Sub-tabs for Document Types */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                {['Todos', 'Recepción de Compra', 'Compra Registrada', 'Ajuste de Inventario', 'Catálogo'].map((subtab) => (
                  <button
                    key={subtab}
                    onClick={() => setSelectedSubTab(subtab)}
                    style={{
                      background: selectedSubTab === subtab ? 'var(--color-primary)' : 'rgba(120, 120, 120, 0.08)',
                      color: selectedSubTab === subtab ? '#fff' : 'var(--text-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '20px',
                      padding: '6px 14px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {subtab === 'Catálogo' ? 'Catálogo de Artículos' : subtab}
                  </button>
                ))}
              </div>

              {/* Table */}
              <div className="table-responsive" style={{ border: 'none', background: 'transparent' }}>
                <table className="table" style={{ borderCollapse: 'separate', borderSpacing: '0 12px', width: '100%', margin: 0 }}>
                  <thead>
                    <tr style={{ background: 'transparent' }}>
                      <th style={{ padding: '0 16px 8px 16px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', border: 'none' }}>Acción</th>
                      <th style={{ padding: '0 16px 8px 16px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', border: 'none' }}>Usuario</th>
                      <th style={{ padding: '0 16px 8px 16px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', border: 'none' }}>Fecha Real</th>
                      <th style={{ padding: '0 16px 8px 16px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', border: 'none' }}>Documento</th>
                      <th style={{ padding: '0 16px 8px 16px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', border: 'none' }}>Nro. Doc</th>
                      <th style={{ padding: '0 16px 8px 16px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', border: 'none' }}>Detalle / Concepto</th>
                      <th style={{ padding: '0 16px 8px 16px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', border: 'none', textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '24px', background: 'var(--bg-secondary)', color: 'var(--text-muted)', borderRadius: '6px' }}>
                          No se encontraron registros de auditoría.
                        </td>
                      </tr>
                    ) : (
                      activities
                        .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
                        .map((act, index) => (
                          <tr key={index} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s' }}>
                            <td style={{ padding: '16px', borderRadius: '6px 0 0 6px', border: 'none' }}>
                              <span className={`badge ${
                                act.Accion.includes('Creación') || act.Accion.includes('Creacion') ? 'badge-success' : 
                                act.Accion.includes('Compra') || act.Accion.includes('Recepción') || act.Accion.includes('Recepcion') ? 'badge-info' : 'badge-warning'
                              }`} style={{ fontSize: '0.725rem', fontWeight: 700, padding: '4px 8px' }}>
                                {act.Accion}
                              </span>
                            </td>
                            <td style={{ padding: '16px', fontWeight: 600, color: 'var(--text-primary)', border: 'none' }}>
                              {getUserDisplayName(act.Usuario)}
                            </td>
                            <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '0.85rem', border: 'none' }}>{formatDate(act.Fecha)}</td>
                            <td style={{ padding: '16px', border: 'none' }}>
                              <span style={{ 
                                  background: 'var(--badge-info-bg)', 
                                  color: 'var(--badge-info-text)', 
                                  padding: '4px 8px', 
                                  borderRadius: '4px',
                                  fontSize: '0.725rem',
                                  fontWeight: 700,
                                  border: '1px solid var(--badge-info-border)'
                                }}>
                                {act.Documento_Tipo || '-'}
                              </span>
                            </td>
                            <td style={{ padding: '16px', fontFamily: 'monospace', color: '#006e96', fontWeight: 800, border: 'none' }}>
                              {act.Documento_Nro || '-'}
                            </td>
                            <td style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-primary)', border: 'none', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={act.Detalle}>
                              {act.Detalle}
                            </td>
                            <td style={{ padding: '16px', borderRadius: '0 6px 6px 0', border: 'none', textAlign: 'center' }}>
                              <button 
                                className="btn btn-secondary" 
                                onClick={() => handleViewDocument(act.Documento_Tipo, act.Documento_Nro)}
                                style={{ padding: '6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}
                                title="Ver Documento en Enterprise ERP"
                              >
                                <Eye size={15} color="#006e96" />
                              </button>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                totalItems={activities.length}
                itemsPerPage={rowsPerPage}
                setItemsPerPage={setRowsPerPage}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
              />
            </div>
          )}

          {/* TAB: DELIVERIES (Notas de Entrega / Flota) */}
          {activeTab === 'deliveries' && (
            <div>
              {/* Advanced Searchable Multi-Select Filter Panel */}
              {!inlineMode && (
                <div className="filter-panel filter-bar-branded" style={{ 
                  padding: '16px', 
                  marginBottom: '24px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '16px',
                  alignItems: 'flex-end'
                }}>
                  {/* Vehiculos MultiSelect Dropdown */}
                  <SearchableMultiSelect
                    label="Vehículos / Equipos"
                    placeholder="Seleccione vehículos..."
                    options={dropdownVehicles}
                    selected={selectedVehicles}
                    onChange={setSelectedVehicles}
                  />

                  {/* Usuarios MultiSelect Dropdown */}
                  <SearchableMultiSelect
                    label="Usuarios Profit"
                    placeholder="Seleccione usuarios..."
                    options={dropdownUsers}
                    selected={selectedUsers}
                    onChange={setSelectedUsers}
                  />

                  <div style={{ flex: '1 1 180px' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      FECHA DESDE
                    </label>
                    <div style={{ position: 'relative' }}>
                      <CalendarDays size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
                      <input
                        type="date"
                        className="form-control"
                        value={filterFechaInicio}
                        onChange={(e) => setFilterFechaInicio(e.target.value)}
                        style={{ paddingLeft: '36px', width: '100%', boxSizing: 'border-box', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', height: '38px', borderRadius: '4px' }}
                      />
                    </div>
                  </div>

                  <div style={{ flex: '1 1 180px' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      FECHA HASTA
                    </label>
                    <div style={{ position: 'relative' }}>
                      <CalendarDays size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
                      <input
                        type="date"
                        className="form-control"
                        value={filterFechaFin}
                        onChange={(e) => setFilterFechaFin(e.target.value)}
                        style={{ paddingLeft: '36px', width: '100%', boxSizing: 'border-box', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', height: '38px', borderRadius: '4px' }}
                      />
                    </div>
                  </div>

                  <button 
                    className="btn btn-secondary" 
                    onClick={handleClearFilters}
                    disabled={selectedVehicles.length === 0 && selectedUsers.length === 0 && !filterFechaInicio && !filterFechaFin}
                    style={{ height: '38px', padding: '0 16px', display: 'flex', alignItems: 'center' }}
                  >
                    Limpiar Filtros
                  </button>
                </div>
              )}

              {/* Delivery Notes Table */}
              <div className="table-responsive" style={{ border: 'none', background: 'transparent' }}>
                <table className="table" style={{ borderCollapse: 'separate', borderSpacing: '0 12px', width: '100%', margin: 0 }}>
                  <thead>
                    <tr style={{ background: 'transparent' }}>
                      <th style={{ padding: '0 16px 8px 16px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', border: 'none' }}>Nro. Documento</th>
                      <th style={{ padding: '0 16px 8px 16px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', border: 'none' }}>Fecha Emisión</th>
                      <th style={{ padding: '0 16px 8px 16px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', border: 'none' }}>Vehículo / Cliente</th>
                      <th style={{ padding: '0 16px 8px 16px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', border: 'none' }}>Usuario</th>
                      <th style={{ padding: '0 16px 8px 16px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', border: 'none' }}>Descripción / Concepto</th>
                      <th style={{ padding: '0 16px 8px 16px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', border: 'none', textAlign: 'right' }}>Total (Bs.)</th>
                      <th style={{ padding: '0 16px 8px 16px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', border: 'none', textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveryNotes.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '24px', background: 'var(--bg-secondary)', color: 'var(--text-muted)', borderRadius: '6px' }}>
                          No se encontraron Notas de Entrega con los filtros actuales.
                        </td>
                      </tr>
                    ) : (
                      deliveryNotes
                        .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
                        .map((note, index) => (
                          <tr key={index} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s' }}>
                            <td style={{ padding: '16px', borderRadius: '6px 0 0 6px', border: 'none', fontFamily: 'monospace', color: '#006e96', fontWeight: 800 }}>
                              {note.doc_num}
                            </td>
                            <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '0.85rem', border: 'none' }}>{formatDate(note.fec_emis)}</td>
                            <td style={{ padding: '16px', color: 'var(--text-primary)', border: 'none', fontWeight: 600 }}>
                              <span style={{ color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 'bold', display: 'block' }}>{note.co_cli}</span>
                              <span style={{ fontSize: '0.85rem' }}>{note.cli_des || 'Sin descripción'}</span>
                            </td>
                            <td style={{ padding: '16px', color: 'var(--text-primary)', border: 'none', fontWeight: 600 }}>
                              {getUserDisplayName(note.co_us_in, note.us_nom)}
                            </td>
                            <td style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)', border: 'none', maxWidth: '260px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={note.descrip}>
                              {note.descrip}
                            </td>
                            <td style={{ padding: '16px', color: '#005a7c', fontWeight: 'bold', textAlign: 'right', border: 'none', fontFamily: 'monospace' }}>
                              Bs. {note.total_neto.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: '16px', borderRadius: '0 6px 6px 0', border: 'none', textAlign: 'center' }}>
                              <button 
                                className="btn btn-secondary" 
                                onClick={() => handleViewDocument('Nota de Entrega', note.doc_num)}
                                style={{ padding: '6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}
                                title="Ver Nota de Entrega en Profit"
                              >
                                <Eye size={15} color="#006e96" />
                              </button>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                totalItems={deliveryNotes.length}
                itemsPerPage={rowsPerPage}
                setItemsPerPage={setRowsPerPage}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
              />
            </div>
          )}

          {/* TAB: RECEPTIONS (Notas de Recepción) */}
          {activeTab === 'receptions' && (
            <div>
              {/* Receptions Table */}
              <div className="table-responsive" style={{ border: 'none', background: 'transparent' }}>
                <table className="table" style={{ borderCollapse: 'separate', borderSpacing: '0 12px', width: '100%', margin: 0 }}>
                  <thead>
                    <tr style={{ background: 'transparent' }}>
                      <th style={{ padding: '0 16px 8px 16px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', border: 'none' }}>Nro. Documento</th>
                      <th style={{ padding: '0 16px 8px 16px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', border: 'none' }}>Fecha Emisión</th>
                      <th style={{ padding: '0 16px 8px 16px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', border: 'none' }}>Proveedor</th>
                      <th style={{ padding: '0 16px 8px 16px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', border: 'none' }}>Usuario</th>
                      <th style={{ padding: '0 16px 8px 16px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', border: 'none' }}>Descripción / Concepto</th>
                      <th style={{ padding: '0 16px 8px 16px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', border: 'none', textAlign: 'right' }}>Total (Bs.)</th>
                      <th style={{ padding: '0 16px 8px 16px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', border: 'none', textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receptionNotes.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '24px', background: 'var(--bg-secondary)', color: 'var(--text-muted)', borderRadius: '6px' }}>
                          No se encontraron Notas de Recepción con los filtros actuales.
                        </td>
                      </tr>
                    ) : (
                      receptionNotes
                        .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
                        .map((note, index) => (
                          <tr key={index} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s' }}>
                            <td style={{ padding: '16px', borderRadius: '6px 0 0 6px', border: 'none', fontFamily: 'monospace', color: '#006e96', fontWeight: 800 }}>
                              {note.doc_num}
                            </td>
                            <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '0.85rem', border: 'none' }}>{formatDate(note.fec_emis)}</td>
                            <td style={{ padding: '16px', color: 'var(--text-primary)', border: 'none', fontWeight: 600 }}>
                              <span style={{ color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 'bold', display: 'block' }}>{note.co_prov}</span>
                              <span style={{ fontSize: '0.85rem' }}>{note.prov_des || 'Sin descripción'}</span>
                            </td>
                            <td style={{ padding: '16px', color: 'var(--text-primary)', border: 'none', fontWeight: 600 }}>
                              {getUserDisplayName(note.co_us_in, note.us_nom)}
                            </td>
                            <td style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)', border: 'none', maxWidth: '260px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={note.descrip}>
                              {note.descrip}
                            </td>
                            <td style={{ padding: '16px', color: '#005a7c', fontWeight: 'bold', textAlign: 'right', border: 'none', fontFamily: 'monospace' }}>
                              Bs. {note.total_neto.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: '16px', borderRadius: '0 6px 6px 0', border: 'none', textAlign: 'center' }}>
                              <button 
                                className="btn btn-secondary" 
                                onClick={() => handleViewDocument('Nota de Recepción', note.doc_num)}
                                style={{ padding: '6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}
                                title="Ver Nota de Recepción en Profit"
                              >
                                <Eye size={15} color="#006e96" />
                              </button>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                totalItems={receptionNotes.length}
                itemsPerPage={rowsPerPage}
                setItemsPerPage={setRowsPerPage}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
              />
            </div>
          )}

          {/* TAB: PURCHASES */}
          {activeTab === 'purchases' && (
            <div>
              {/* Search Bar */}
              <div className="search-box" style={{ display: 'flex', gap: '10px', marginBottom: '20px', maxWidth: '400px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Buscar repuesto por descripción..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: '35px', width: '100%', boxSizing: 'border-box', background: 'var(--input-bg)', border: '2px solid var(--input-border)', color: 'var(--input-text)' }}
                  />
                </div>
              </div>

              <div className="table-responsive" style={{ border: 'none', background: 'transparent' }}>
                <table className="table" style={{ borderCollapse: 'separate', borderSpacing: '0 12px', width: '100%', margin: 0 }}>
                  <thead>
                    <tr style={{ background: 'transparent' }}>
                      <th style={{ padding: '0 16px 8px 16px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', border: 'none' }}>Descripción</th>
                      <th style={{ padding: '0 16px 8px 16px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', border: 'none' }}>Stock Actual</th>
                      <th style={{ padding: '0 16px 8px 16px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', border: 'none' }}>Fecha Última Compra</th>
                      <th style={{ padding: '0 16px 8px 16px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', border: 'none' }}>Costo Última Compra</th>
                      <th style={{ padding: '0 16px 8px 16px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', border: 'none' }}>Cantidad Comprada</th>
                      <th style={{ padding: '0 16px 8px 16px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', border: 'none' }}>Moneda</th>
                      <th style={{ padding: '0 16px 8px 16px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', border: 'none' }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases
                      .filter(p => p.descripcion.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((p) => {
                        const hasHistory = p.ultima_compra_fecha !== null;
                        return (
                          <tr key={p.id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                            <td style={{ padding: '16px', fontWeight: 600, color: 'var(--text-primary)', borderRadius: '6px 0 0 6px', border: 'none' }}>{p.descripcion}</td>
                            <td style={{ padding: '16px', border: 'none' }}>
                              <span className={p.stock_actual > 0 ? 'text-success' : 'text-danger'} style={{ fontWeight: 'bold' }}>
                                {p.stock_actual}
                              </span>
                            </td>
                            <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '0.85rem', border: 'none' }}>{formatDate(p.ultima_compra_fecha)}</td>
                            <td style={{ padding: '16px', border: 'none', color: hasHistory ? 'var(--color-primary)' : 'var(--text-primary)', fontWeight: hasHistory ? 'bold' : 'normal' }}>
                              {hasHistory ? `$${p.ultima_compra_costo.toFixed(2)}` : '-'}
                            </td>
                            <td style={{ padding: '16px', color: 'var(--text-primary)', border: 'none' }}>{hasHistory ? p.ultima_compra_cantidad : '-'}</td>
                            <td style={{ padding: '16px', border: 'none' }}>
                              {hasHistory ? (
                                <span className={`badge ${p.ultima_compra_moneda === 'US$' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.725rem', fontWeight: 700 }}>
                                  {p.ultima_compra_moneda}
                                </span>
                              ) : '-'}
                            </td>
                            <td style={{ padding: '16px', borderRadius: '0 6px 6px 0', border: 'none' }}>
                              {hasHistory ? (
                                <span className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content', fontSize: '0.725rem', fontWeight: 700 }}>
                                  <Calendar size={12} /> Comprado antes
                                </span>
                              ) : (
                                <span className="badge badge-danger" style={{ width: 'fit-content', fontSize: '0.725rem', fontWeight: 700 }}>
                                  Nunca Comprado
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              <Pagination
                totalItems={purchases.filter(p => p.descripcion.toLowerCase().includes(searchQuery.toLowerCase())).length}
                itemsPerPage={rowsPerPage}
                setItemsPerPage={setRowsPerPage}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
              />
            </div>
          )}

          {/* TAB: CURRENCIES */}
          {activeTab === 'currencies' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                {currencies.map((curr, idx) => (
                  <div key={idx} className="card" style={{ padding: '20px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span className="card-subtitle" style={{ fontSize: '14px', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-muted)' }}>
                        Moneda: {curr.moneda === 'US$' ? 'Dólares (US$)' : curr.moneda === 'BSS' ? 'Bolívares (BSS)' : curr.moneda}
                      </span>
                      <span className={`badge ${curr.moneda === 'US$' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '14px', fontWeight: 700 }}>
                        {curr.moneda}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '28px', margin: '5px 0', color: 'var(--text-primary)', fontWeight: 700 }}>
                      {curr.moneda === 'US$' ? '$' : 'Bs. '}{curr.monto_total.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h3>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '13px' }}>
                      Total Facturas: <strong>{curr.total_facturas}</strong> transacciones registradas.
                    </p>
                  </div>
                ))}
              </div>

              <div className="alert alert-info" style={{ marginTop: '20px', padding: '16px', borderRadius: '8px' }}>
                💡 <strong>Análisis Técnico:</strong> La distribución muestra que la base de datos de compras está masivamente expresada en <strong>Dólares Americanos (US$)</strong>. Esto confirma que los costos históricos y los precios de referencia consultados por nuestra aplicación web reflejan los montos reales en divisas, garantizando coherencia para la liquidación de las órdenes de servicio.
              </div>
            </div>
          )}
        </div>
      )}

      {/* CLON INTERACTIVO SIMULADOR DE PROFIT PLUS MODAL */}
      {openDocs.map(doc => {
        if (doc.minimized || !doc.details) return null;

        return (
          <div key={`${doc.type}-${doc.id}`} className="doc-modal-backdrop-print" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}>
            <div className="profit-print-container" style={{
              background: '#e0e0e0', // Classic light grey of Windows/Profit GUI
              width: '100%',
              maxWidth: '900px',
              borderRadius: '4px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              border: '2px solid #808080',
              overflow: 'hidden',
              fontFamily: 'Arial, sans-serif',
              color: '#000'
            }}>
              {/* Title Bar styled like Windows 98 / classic Windows */}
              <div className="profit-titlebar-print" style={{
                background: 'linear-gradient(90deg, #000080 0%, #1084d0 100%)', // Classic Windows Blue
                color: '#fff',
                padding: '6px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontWeight: 'bold',
                fontSize: '13px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={16} />
                  <span>{doc.type} [Nro: {doc.id}] - Enterprise ERP 8.5 (Ambiente Sandbox)</span>
                </div>
                <div style={{ display: 'flex', gap: '2px' }}>
                  <button 
                    onClick={() => setOpenDocs(prev => prev.map(d => (d.type === doc.type && d.id === doc.id) ? { ...d, minimized: true } : d))}
                    style={{ 
                      background: '#c0c0c0', 
                      border: '1px solid #fff', 
                      borderRightColor: '#808080', 
                      borderBottomColor: '#808080', 
                      color: '#000',
                      fontWeight: 'bold',
                      fontSize: '11px',
                      padding: '2px 6px',
                      cursor: 'pointer'
                    }}
                    title="Minimizar"
                  >
                    –
                  </button>
                  <button 
                    onClick={() => setOpenDocs(prev => prev.filter(d => !(d.type === doc.type && d.id === doc.id)))}
                    style={{ 
                      background: '#c0c0c0', 
                      border: '1px solid #fff', 
                      borderRightColor: '#808080', 
                      borderBottomColor: '#808080', 
                      color: '#000',
                      fontWeight: 'bold',
                      fontSize: '11px',
                      padding: '2px 6px',
                      cursor: 'pointer'
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Profit Style Toolbar Ribbon */}
              <div className="profit-toolbar-print" style={{
                background: '#d4d0c8',
                padding: '6px 12px',
                borderBottom: '1px solid #808080',
                display: 'flex',
                gap: '12px'
              }}>
                <button disabled style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', background: '#c0c0c0', border: '1px solid #808080', padding: '3px 8px', color: '#777' }}>
                  💾 Guardar
                </button>
                <button disabled style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', background: '#c0c0c0', border: '1px solid #808080', padding: '3px 8px', color: '#777' }}>
                  📄 Nuevo
                </button>
                <button 
                  onClick={() => {
                    const originalTitle = document.title;
                    document.title = new Date().toLocaleString();
                    window.print();
                    setTimeout(() => {
                      document.title = originalTitle;
                    }, 500);
                  }} 
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', background: '#e0e0e0', border: '1px solid #fff', borderRightColor: '#808080', borderBottomColor: '#808080', padding: '3px 8px', color: '#000', cursor: 'pointer' }}
                >
                  🖨️ Imprimir
                </button>
                <div style={{ borderLeft: '1px solid #808080', height: '18px' }}></div>
                <button onClick={() => setOpenDocs(prev => prev.filter(d => !(d.type === doc.type && d.id === doc.id)))} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', background: '#e0e0e0', border: '1px solid #fff', borderRightColor: '#808080', borderBottomColor: '#808080', padding: '3px 8px', color: '#c00', cursor: 'pointer', fontWeight: 'bold' }}>
                  ✕ Salir
                </button>
              </div>

              {doc.loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', background: '#f0f0f0', gap: '12px' }}>
                  <div className="spinner" style={{ borderColor: '#808080', borderTopColor: '#000080' }}></div>
                  <span style={{ fontSize: '12px', color: '#333' }}>Consultando SQL Server en Linux...</span>
                </div>
              ) : doc.details ? (
                <div style={{ padding: '16px', background: '#d4d0c8', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Fila superior: Documento, Fecha, Tasa */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', background: '#d4d0c8', border: '1px solid #808080', padding: '12px', borderRadius: '2px', boxShadow: 'inset 1px 1px 0 #fff' }}>
                    <div>
                      <label style={{ fontSize: '11px', display: 'block', marginBottom: '3px', fontWeight: 'bold' }}>Documento Nro:</label>
                      <input readOnly type="text" value={doc.details.header.doc_num} style={{ width: '100%', background: '#fff', border: '1px solid #808080', padding: '3px', fontWeight: 'bold', color: '#000080' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', display: 'block', marginBottom: '3px', fontWeight: 'bold' }}>Fecha Emisión:</label>
                      <input readOnly type="text" value={formatDate(doc.details.header.fec_emis)} style={{ width: '100%', background: '#fff', border: '1px solid #808080', padding: '3px' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', display: 'block', marginBottom: '3px', fontWeight: 'bold' }}>Fecha Registro:</label>
                      <input readOnly type="text" value={formatDate(doc.details.header.fec_reg)} style={{ width: '100%', background: '#fff', border: '1px solid #808080', padding: '3px' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', display: 'block', marginBottom: '3px', fontWeight: 'bold' }}>Tasa Cambio:</label>
                      <input readOnly type="text" value={`Bs. ${(doc.details.header.tasa || 1).toFixed(2)}`} style={{ width: '100%', background: '#fff', border: '1px solid #808080', padding: '3px', fontFamily: 'monospace' }} />
                    </div>
                  </div>

                  {/* Fila intermedia: Moneda, Proveedor */}
                  <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '12px', background: '#d4d0c8', border: '1px solid #808080', padding: '12px', borderRadius: '2px', boxShadow: 'inset 1px 1px 0 #fff' }}>
                    <div>
                      <label style={{ fontSize: '11px', display: 'block', marginBottom: '3px', fontWeight: 'bold' }}>Código Moneda:</label>
                      <input readOnly type="text" value={doc.details.header.co_mone || ''} style={{ width: '100%', background: '#fff', border: '1px solid #808080', padding: '3px', fontWeight: 'bold' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', display: 'block', marginBottom: '3px', fontWeight: 'bold' }}>Proveedor / Cliente:</label>
                      <input readOnly type="text" value={`${doc.details.header.co_prov || ''} - ${doc.details.header.prov_des || ''}`} style={{ width: '100%', background: '#fff', border: '1px solid #808080', padding: '3px' }} />
                    </div>
                  </div>

                  {/* Fila Descripción */}
                  <div style={{ background: '#d4d0c8', border: '1px solid #808080', padding: '12px', borderRadius: '2px', boxShadow: 'inset 1px 1px 0 #fff' }}>
                    <label style={{ fontSize: '11px', display: 'block', marginBottom: '3px', fontWeight: 'bold' }}>Descripción / Concepto:</label>
                    <input readOnly type="text" value={doc.details.header.descrip || ''} style={{ width: '100%', background: '#fff', border: '1px solid #808080', padding: '3px' }} />
                  </div>

                  {/* Tabla de Renglones */}
                  <div style={{ background: '#fff', border: '1px solid #808080', borderRadius: '2px', overflowX: 'auto' }}>
                    <div style={{ padding: '6px 12px', background: '#c0c0c0', borderBottom: '1px solid #808080', fontSize: '11px', fontWeight: 'bold' }}>
                      Renglones del Documento:
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: '#d4d0c8', borderBottom: '1px solid #808080', color: '#000' }}>
                          <th style={{ padding: '6px 8px', borderRight: '1px solid #808080' }}>Reng</th>
                          <th style={{ padding: '6px 8px', borderRight: '1px solid #808080' }}>Código Artículo</th>
                          <th style={{ padding: '6px 8px', borderRight: '1px solid #808080' }}>Descripción del Artículo</th>
                          <th style={{ padding: '6px 8px', borderRight: '1px solid #808080', textAlign: 'right' }}>Cantidad</th>
                          <th style={{ padding: '6px 8px', borderRight: '1px solid #808080', textAlign: 'right' }}>Costo Unit (Bs.)</th>
                          <th style={{ padding: '6px 8px', borderRight: '1px solid #808080', textAlign: 'right', color: '#008000', fontWeight: 'bold' }}>Costo Unit ($)</th>
                          <th style={{ padding: '6px 8px', textAlign: 'right' }}>Total (Bs.)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {doc.details.rows.map((row, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #e0e0e0', color: '#000' }}>
                            <td style={{ padding: '6px 8px', borderRight: '1px solid #e0e0e0', textAlign: 'center' }}>{row.reng_num}</td>
                            <td style={{ padding: '6px 8px', borderRight: '1px solid #e0e0e0', fontFamily: 'monospace' }}>{row.co_art}</td>
                            <td style={{ padding: '6px 8px', borderRight: '1px solid #e0e0e0' }}>{row.des_art}</td>
                            <td style={{ padding: '6px 8px', borderRight: '1px solid #e0e0e0', textAlign: 'right', fontWeight: 'bold' }}>{row.total_art.toFixed(2)}</td>
                            <td style={{ padding: '6px 8px', borderRight: '1px solid #e0e0e0', textAlign: 'right', fontFamily: 'monospace' }}>{row.cost_unit.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                            <td style={{ padding: '6px 8px', borderRight: '1px solid #e0e0e0', textAlign: 'right', color: '#008000', fontWeight: 'bold', fontFamily: 'monospace' }}>${(row.cost_unit / (doc.details!.header.tasa || 1)).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                            <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold', fontFamily: 'monospace' }}>{(row.total_art * row.cost_unit).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Bloque inferior: Comentario Sandbox y Totales */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '20px', alignItems: 'end' }}>
                    <div style={{ fontSize: '11px', color: '#555', fontStyle: 'italic', padding: '10px 0' }}>
                      * Documento consultado de forma segura vía T-SQL en el Servidor Docker Linux.
                    </div>
                    <div style={{
                      background: '#d4d0c8',
                      border: '1px solid #808080',
                      padding: '10px 14px',
                      borderRadius: '2px',
                      boxShadow: 'inset 1px 1px 0 #fff',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      fontSize: '11px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Subtotal Bruto:</span>
                        <strong style={{ fontFamily: 'monospace' }}>Bs. {(doc.details.header.total_bruto || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Monto IVA:</span>
                        <strong style={{ fontFamily: 'monospace' }}>Bs. {((doc.details.header.total_neto || 0) - (doc.details.header.total_bruto || 0)).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</strong>
                      </div>
                      <div style={{ borderBottom: '1px solid #808080', margin: '4px 0' }}></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#000080', fontWeight: 'bold' }}>
                        <span>Total Neto (Bs.):</span>
                        <span style={{ fontFamily: 'monospace' }}>Bs. {(doc.details.header.total_neto || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#008000', fontWeight: 'bold', marginTop: '2px' }}>
                        <span>Total Neto (USD):</span>
                        <span style={{ fontFamily: 'monospace' }}>${((doc.details.header.total_neto || 0) / (doc.details.header.tasa || 1)).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                <div style={{ padding: '30px', textAlign: 'center', background: '#fff', color: '#777' }}>
                  No se pudo cargar la información del documento.
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Dock para simuladores Profit minimizados */}
      {openDocs.some(d => d.minimized) && (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          alignItems: 'flex-end',
          pointerEvents: 'none'
        }}>
          {openDocs.filter(d => d.minimized).map(doc => (
            <div 
              key={`${doc.type}-${doc.id}`}
              style={{
                background: 'var(--bg-secondary)',
                border: '2px solid var(--color-primary)',
                borderRadius: '8px',
                boxShadow: '0 8px 30px rgba(236, 119, 0, 0.25)',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                animation: 'slideUp 0.3s ease',
                pointerEvents: 'auto',
                width: '320px'
              }}
            >
              <span style={{ fontSize: '1.25rem' }}>🖥️</span>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {doc.type}: {doc.id}
                </span>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Ventana de Profit minimizada</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', marginLeft: '8px' }}>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', fontWeight: 700 }}
                  onClick={() => setOpenDocs(prev => prev.map(d => (d.type === doc.type && d.id === doc.id) ? { ...d, minimized: false } : d))}
                >
                  Abrir
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', minWidth: 'auto', color: 'var(--color-danger)' }}
                  onClick={() => setOpenDocs(prev => prev.filter(d => !(d.type === doc.type && d.id === doc.id)))}
                  title="Cerrar y descartar"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
