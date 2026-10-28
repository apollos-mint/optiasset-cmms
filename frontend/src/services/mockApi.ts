/**
 * OptiAsset CMMS - Standalone Demo Mock Engine
 * Intercepts /api/* requests on Vercel or standalone preview environments
 * to provide a persistent, fully interactive demo experience without an on-premise MSSQL/PostgreSQL server.
 */

export const isDemoMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    import.meta.env.VITE_DEMO_MODE === 'true' ||
    window.location.hostname.includes('vercel.app') ||
    window.location.hostname.includes('netlify.app') ||
    localStorage.getItem('optiasset_demo_mode') === 'true'
  );
};

// Seed realistic enterprise demo assets
const DEFAULT_ASSETS = [
  {
    id: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c01",
    tipo_activo: "Vehículo",
    fecha_compra: "2023-03-15",
    datos_especificos: {
      placa: "IND-8421",
      marca: "Toyota Industrial",
      modelo: "8FBE20 2.5T Electric Forklift",
      anio: 2023,
      color: "Naranja Industrial",
      kilometraje_inicial: 12450,
      ubicacion: "Planta Principal - Bahía de Carga 2"
    },
    destino_almacen: null,
    fecha_creacion: "2023-03-15T08:00:00Z"
  },
  {
    id: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c02",
    tipo_activo: "Maquinaria",
    fecha_compra: "2022-08-20",
    datos_especificos: {
      numero_serie: "HP-200-STAMP-440",
      marca: "Schuler Automation",
      modelo: "Hydraulic Stamping Press HP-200",
      anio: 2022,
      horometro_inicial: 3420,
      ubicacion: "Línea 1 - Estampado y Prensado"
    },
    destino_almacen: null,
    fecha_creacion: "2022-08-20T10:30:00Z"
  },
  {
    id: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c03",
    tipo_activo: "Maquinaria",
    fecha_compra: "2023-11-10",
    datos_especificos: {
      numero_serie: "AC-GA75-VSD-9912",
      marca: "Atlas Copco",
      modelo: "GA-75 VSD Rotary Screw Compressor",
      anio: 2023,
      horometro_inicial: 1850,
      ubicacion: "Sala de Compresores Neumáticos #1"
    },
    destino_almacen: null,
    fecha_creacion: "2023-11-10T14:15:00Z"
  },
  {
    id: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c04",
    tipo_activo: "Stock Almacén",
    fecha_compra: "2024-01-18",
    datos_especificos: {
      nombre_item: "Bomba Hidráulica de Engranajes Rexroth 25cc",
      serial: "BHE-84930-A",
      marca: "Bosch Rexroth",
      ubicacion_fisica: "Almacén Central - Rack B4"
    },
    destino_almacen: "Para Mantenimiento",
    fecha_creacion: "2024-01-18T09:00:00Z"
  }
];

const DEFAULT_ORDERS = [
  {
    id: "ord-8801-maint",
    activo_id: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c01",
    usuario_id: "usr-demo-admin",
    tipo_activo: "Vehículo",
    datos_especificos: {
      marca: "Toyota Industrial",
      modelo: "8FBE20 2.5T Electric Forklift",
      placa: "IND-8421"
    },
    fecha_inicio: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    fecha_fin: null,
    diagnostico: JSON.stringify({
      diagnostico_inicial: "Mantenimiento preventivo 250 horas: Cambio de fluido hidráulico y revisión de mástil.",
      items: [
        { descripcion: "Fluido Hidráulico ISO VG 46", cantidad: 20, unidad: "Litros" },
        { descripcion: "Filtro de Retorno Hidráulico", cantidad: 1, unidad: "Unidades" }
      ]
    }),
    reparacion_ejecutada: "Limpieza de conectores de batería y purga de circuito hidráulico.",
    tasa_hora_taller: 45.0,
    horas_taller: 3.5,
    total_facturado: 297.5,
    kilometraje_registro: 12510,
    horometro_registro: null,
    estado: "En Proceso"
  },
  {
    id: "ord-8794-maint",
    activo_id: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c02",
    usuario_id: "usr-demo-admin",
    tipo_activo: "Maquinaria",
    datos_especificos: {
      marca: "Schuler Automation",
      modelo: "Hydraulic Stamping Press HP-200",
      numero_serie: "HP-200-STAMP-440"
    },
    fecha_inicio: new Date(Date.now() - 120 * 3600 * 1000).toISOString(),
    fecha_fin: new Date(Date.now() - 96 * 3600 * 1000).toISOString(),
    diagnostico: "Calibración de presión en vástago principal y recambio de empaquetaduras de sellado.",
    reparacion_ejecutada: "Reemplazo de kit de sellos y prueba de carga completada a 200 toneladas.",
    tasa_hora_taller: 60.0,
    horas_taller: 6.0,
    total_facturado: 620.0,
    kilometraje_registro: null,
    horometro_registro: 3432,
    estado: "Completada"
  }
];

export const initDemoMockEngine = () => {
  if (!isDemoMode()) return;
  console.log("⚡ [OptiAsset CMMS] Standalone Demo Mock Engine Activated (Zero-Cloud Mode)");

  // Local storage cache initialization
  if (!localStorage.getItem('optiasset_mock_assets')) {
    localStorage.setItem('optiasset_mock_assets', JSON.stringify(DEFAULT_ASSETS));
  }
  if (!localStorage.getItem('optiasset_mock_orders')) {
    localStorage.setItem('optiasset_mock_orders', JSON.stringify(DEFAULT_ORDERS));
  }

  const originalFetch = window.fetch;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    // Only intercept /api/*
    if (url.startsWith('/api/') || url.includes('/api/')) {
      const method = (init?.method || 'GET').toUpperCase();

      // 1. Auth Me
      if (url.includes('/api/auth/me')) {
        const storedUser = sessionStorage.getItem('user');
        const user = storedUser ? JSON.parse(storedUser) : {
          id: "usr-demo-admin",
          nombre: "Eduardo De Sousa (Demo Admin)",
          nombre_usuario: "admin",
          rol: "Administrador",
          activo: true,
          permisos: {
            acceder_operaciones: true,
            acceder_catalogos: true,
            acceder_almacen: true,
            acceder_reportes: true,
            acceder_usuarios: true,
            acceder_auditoria: true,
            borrar_checklists: true,
            firmar_checklists: true,
            acceder_checklists: true,
            acceder_ordenes: true,
            acceder_profit_diagnostics: true,
            modificar_profit_diagnostics: true,
            ver_profit_diagnostics: true
          }
        };
        return new Response(JSON.stringify(user), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      // 2. Auth Login
      if (url.includes('/api/auth/login') && method === 'POST') {
        const body = init?.body ? JSON.parse(init.body as string) : {};
        const isAdmin = (body.username || '').toLowerCase().includes('admin') || !body.username;
        const mockUser = {
          id: isAdmin ? "usr-demo-admin" : "usr-demo-tech",
          nombre: isAdmin ? "Eduardo De Sousa (Lead Architect)" : "Técnico Especialista #01",
          nombre_usuario: body.username || (isAdmin ? "admin" : "mecanico1"),
          rol: isAdmin ? "Administrador" : "Mecánico",
          activo: true,
          permisos: {
            acceder_operaciones: true,
            acceder_catalogos: isAdmin,
            acceder_almacen: true,
            acceder_reportes: true,
            acceder_usuarios: isAdmin,
            acceder_auditoria: isAdmin,
            borrar_checklists: isAdmin,
            firmar_checklists: true,
            acceder_checklists: true,
            acceder_ordenes: true,
            acceder_profit_diagnostics: true,
            modificar_profit_diagnostics: isAdmin,
            ver_profit_diagnostics: true
          }
        };
        return new Response(JSON.stringify({
          token: "demo-jwt-token-optiasset-verified-6sigma",
          usuario: mockUser
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      // 3. Exchange Rate
      if (url.includes('/api/profit/exchange-rate')) {
        return new Response(JSON.stringify({ rate: 709.69, date: new Date().toISOString() }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 4. Assets
      if (url.includes('/api/assets')) {
        const assets = JSON.parse(localStorage.getItem('optiasset_mock_assets') || JSON.stringify(DEFAULT_ASSETS));
        return new Response(JSON.stringify(assets), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      // 5. Work Orders
      if (url.includes('/api/orders')) {
        if (method === 'POST') {
          const body = init?.body ? JSON.parse(init.body as string) : {};
          const orders = JSON.parse(localStorage.getItem('optiasset_mock_orders') || JSON.stringify(DEFAULT_ORDERS));
          const newOrder = {
            id: `ord-${Math.floor(1000 + Math.random() * 9000)}-maint`,
            activo_id: body.activo_id,
            usuario_id: "usr-demo-admin",
            tipo_activo: body.tipo_activo || "Vehículo",
            datos_especificos: body.datos_especificos || {},
            fecha_inicio: new Date().toISOString(),
            fecha_fin: null,
            diagnostico: body.diagnostico || "Revisión programada",
            reparacion_ejecutada: null,
            tasa_hora_taller: body.tasa_hora_taller || 45.0,
            horas_taller: 0,
            total_facturado: 0,
            kilometraje_registro: body.kilometraje_registro || null,
            horometro_registro: body.horometro_registro || null,
            estado: "Abierta"
          };
          orders.unshift(newOrder);
          localStorage.setItem('optiasset_mock_orders', JSON.stringify(orders));
          return new Response(JSON.stringify(newOrder), { status: 201, headers: { 'Content-Type': 'application/json' } });
        }
        const orders = JSON.parse(localStorage.getItem('optiasset_mock_orders') || JSON.stringify(DEFAULT_ORDERS));
        return new Response(JSON.stringify(orders), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      // 6. Checklists
      if (url.includes('/api/checklists')) {
        const mockChecklists = [
          {
            id: "chk-092-ok",
            activo_id: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c01",
            usuario_id: "usr-demo-admin",
            fecha: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
            kilometraje_registro: 12510,
            horometro_registro: null,
            observaciones: "Inspección pre-operacional 100% conforme. Batería al 94%.",
            respuestas_detalle: {
              luces: "Bien",
              frenos: "Bien",
              nivel_aceite: "Bien",
              fugas: "No presenta"
            }
          }
        ];
        return new Response(JSON.stringify(mockChecklists), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      // 7. Catalogs / Spare parts
      if (url.includes('/api/repuestos')) {
        return new Response(JSON.stringify([
          { id: 1, descripcion: "Aceite Hidráulico ISO VG 46", unidad_medida: "Litros", precio_referencia: 6.80 },
          { id: 2, descripcion: "Filtro de Aceite Heavy Duty PH8A", unidad_medida: "Unidades", precio_referencia: 14.50 },
          { id: 3, descripcion: "Batería Industrial LiFePO4 48V 400Ah", unidad_medida: "Unidades", precio_referencia: 1850.00 },
          { id: 4, descripcion: "Kit de Empaquetaduras de Nitrilo", unidad_medida: "Kits", precio_referencia: 38.00 }
        ]), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      // 8. ERP Diagnostics simulated documents
      if (url.includes('/api/profit-diagnostics/')) {
        return new Response(JSON.stringify({
          success: true,
          status: "connected",
          erpVersion: "Apex Core ERP Gateway 8.5 (Sandbox)",
          totalRecordsSync: 1240,
          lastSyncTimestamp: new Date().toISOString(),
          items: [
            { doc_num: "NE-2024-0012", fecha: "2024-03-12", cliente: "Apex Industrial Plant 1", monto: 1240.50, estado: "Sincronizado" },
            { doc_num: "NE-2024-0015", fecha: "2024-03-14", cliente: "Línea de Ensamble B", monto: 860.00, estado: "Sincronizado" }
          ]
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      // Generic fallback for any other GET/POST endpoint
      return new Response(JSON.stringify({ success: true, message: "Demo mode simulated response" }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return originalFetch(input, init);
  };
};
