import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { AuthController } from './controllers/auth.controller';
import { AssetsController } from './controllers/assets.controller';
import { ChecklistsController } from './controllers/checklists.controller';
import { OrdersController } from './controllers/orders.controller';
import { HistoryController } from './controllers/history.controller';
import { ProfitController } from './controllers/profit.controller';
import { ProfitDiagnosticsController } from './controllers/profitDiagnostics.controller';
import { SolicitudesController } from './controllers/solicitudes.controller';
import { TicketsController } from './controllers/tickets.controller';
import { NotificationsController } from './controllers/notifications.controller';
import { PerformanceController } from './controllers/performance.controller';
import { ProcuraController } from './controllers/procura.controller';
import { DepartmentsController } from './controllers/departments.controller';
import { FeedbacksController } from './controllers/feedbacks.controller';
import { authenticateToken, optionalAuthenticateToken, requireRole, requirePermission, writeAuditLog } from './middlewares/audit.middleware';
import { MileageService } from './services/mileage.service';
import { db } from './config/db';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Setup Multer for memory buffer storage (multimedia uploads)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // Limite de 20 MB para imágenes/videos cortos
  }
});

// ==========================================
// RUTAS DE AUTENTICACIÓN Y USUARIOS (Módulo 1)
// ==========================================
app.post('/api/auth/login', AuthController.login);
app.get('/api/auth/me', authenticateToken, AuthController.getMe);
app.put('/api/auth/me/avatar', authenticateToken, AuthController.updateAvatar);

app.get('/api/auth/users', authenticateToken, AuthController.getUsers);
app.post('/api/auth/users', authenticateToken, requireRole(['Administrador']), AuthController.createUser);
app.put('/api/auth/users/:id', authenticateToken, requireRole(['Administrador']), AuthController.updateUser);
app.patch('/api/auth/users/:id/toggle', authenticateToken, requireRole(['Administrador']), AuthController.toggleUserStatus);
app.delete('/api/auth/users/:id', authenticateToken, requireRole(['Administrador']), AuthController.deleteUser);

// RUTAS DE ROLES Y PERMISOS (Módulo 1 - Roles)
app.get('/api/roles', authenticateToken, requireRole(['Administrador']), AuthController.getRoles);
app.post('/api/roles', authenticateToken, requireRole(['Administrador']), AuthController.createRole);
app.put('/api/roles/:id', authenticateToken, requireRole(['Administrador']), AuthController.updateRole);
app.delete('/api/roles/:id', authenticateToken, requireRole(['Administrador']), AuthController.deleteRole);

// RUTAS DE DEPARTAMENTOS Y PRIVILEGIOS DE MÓDULO (Módulo 1 - Departamentos)
app.get('/api/departamentos', authenticateToken, DepartmentsController.getDepartments);
app.post('/api/departamentos', authenticateToken, requireRole(['Administrador']), DepartmentsController.createDepartment);
app.put('/api/departamentos/:id', authenticateToken, requireRole(['Administrador']), DepartmentsController.updateDepartment);
app.delete('/api/departamentos/:id', authenticateToken, requireRole(['Administrador']), DepartmentsController.deleteDepartment);
app.post('/api/departamentos/:id/usuarios', authenticateToken, requireRole(['Administrador']), DepartmentsController.assignUsersToDepartment);

// ==========================================
// RUTAS DE ACTIVOS (Módulos 2 y 4)
// ==========================================
app.get('/api/assets', authenticateToken, AssetsController.getAssets);
app.get('/api/assets/:id', authenticateToken, AssetsController.getAssetById);
app.post('/api/assets', authenticateToken, requireRole(['Administrador']), AssetsController.createAsset);
app.put('/api/assets/:id', authenticateToken, requireRole(['Administrador']), AssetsController.updateAsset);
app.delete('/api/assets/:id', authenticateToken, requireRole(['Administrador']), AssetsController.deleteAsset);
app.get('/api/assets/:id/max-readings', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const readings = await MileageService.getCurrentMaxReadings(id);
    res.json(readings);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al obtener lecturas máximas.' });
  }
});

// Campaña de Despeje de Almacén (Selector de Destino)
app.patch('/api/assets/:id/warehouse-destination', authenticateToken, requireRole(['Administrador', 'Operador Logístico']), AssetsController.updateWarehouseDestination);

// ==========================================
// RUTAS DE CATÁLOGO DE REPUESTOS (Módulo 2)
// ==========================================
app.get('/api/profit/inventory', authenticateToken, ProfitController.getProfitInventory);
app.get('/api/profit-diagnostics/activity', authenticateToken, ProfitDiagnosticsController.getActivity);
app.get('/api/profit-diagnostics/purchases-analysis', authenticateToken, ProfitDiagnosticsController.getPurchasesAnalysis);
app.get('/api/profit-diagnostics/currencies-summary', authenticateToken, ProfitDiagnosticsController.getCurrenciesSummary);
app.get('/api/profit-diagnostics/document/:type/:id', authenticateToken, ProfitDiagnosticsController.getDocumentDetails);
app.get('/api/profit-diagnostics/dropdowns', authenticateToken, ProfitDiagnosticsController.getDropdowns);
app.get('/api/profit-diagnostics/delivery-notes', authenticateToken, ProfitDiagnosticsController.getDeliveryNotes);
app.get('/api/profit-diagnostics/reception-notes', authenticateToken, ProfitDiagnosticsController.getReceptionNotes);
app.get('/api/profit/exchange-rate', authenticateToken, (req, res) => {
  const { ExchangeRateService } = require('./services/exchangeRate.service');
  res.json(ExchangeRateService.getDetails());
});

app.get('/api/repuestos', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM catalogo_repuestos WHERE activo = TRUE AND eliminado_en IS NULL ORDER BY descripcion ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el catálogo de repuestos.' });
  }
});

app.post('/api/repuestos', authenticateToken, requireRole(['Administrador', 'Operador Logístico']), async (req: any, res) => {
  const { descripcion, unidad_medida, precio_referencia, stock_actual, proveedor } = req.body;
  if (!descripcion || !unidad_medida || precio_referencia === undefined) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }
  try {
    const result = await db.query(
      `INSERT INTO catalogo_repuestos (descripcion, unidad_medida, precio_referencia, stock_actual, proveedor) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [descripcion, unidad_medida, parseFloat(precio_referencia), parseFloat(stock_actual || 0), proveedor || '']
    );
    
    await writeAuditLog({
      userId: req.user?.id || null,
      accion: 'AGREGAR_CATALOGO_REPUESTO',
      tablaAfectada: 'catalogo_repuestos',
      registroId: result.rows[0].id.toString(),
      valoresNuevos: result.rows[0]
    });

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ error: 'Error al agregar repuesto al catálogo.' });
  }
});

app.put('/api/repuestos/:id', authenticateToken, requireRole(['Administrador', 'Operador Logístico']), async (req: any, res) => {
  const { id } = req.params;
  const { descripcion, unidad_medida, precio_referencia, stock_actual, proveedor } = req.body;
  try {
    const oldRes = await db.query('SELECT * FROM catalogo_repuestos WHERE id = $1', [id]);
    if (oldRes.rows.length === 0) {
      return res.status(404).json({ error: 'Repuesto no encontrado.' });
    }
    const result = await db.query(
      `UPDATE catalogo_repuestos 
       SET descripcion = $1, unidad_medida = $2, precio_referencia = $3, stock_actual = $4, proveedor = $5 
       WHERE id = $6 RETURNING *`,
      [descripcion, unidad_medida, parseFloat(precio_referencia), parseFloat(stock_actual || 0), proveedor || '', id]
    );

    await writeAuditLog({
      userId: req.user?.id || null,
      accion: 'MODIFICAR_CATALOGO_REPUESTO',
      tablaAfectada: 'catalogo_repuestos',
      registroId: id,
      valoresAnteriores: oldRes.rows[0],
      valoresNuevos: result.rows[0]
    });

    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ error: 'Error al actualizar catálogo de repuesto.' });
  }
});

app.delete('/api/repuestos/:id', authenticateToken, requireRole(['Administrador', 'Operador Logístico']), async (req: any, res) => {
  const { id } = req.params;
  const userId = req.user?.id;
  try {
    const oldRes = await db.query('SELECT * FROM catalogo_repuestos WHERE id = $1 AND eliminado_en IS NULL', [id]);
    if (oldRes.rows.length === 0) {
      return res.status(404).json({ error: 'Repuesto no encontrado o ya eliminado.' });
    }
    
    await db.query(
      'UPDATE catalogo_repuestos SET eliminado_en = CURRENT_TIMESTAMP, activo = FALSE, eliminado_por = $1 WHERE id = $2',
      [userId || null, id]
    );

    await writeAuditLog({
      userId: userId || null,
      accion: 'ELIMINAR_CATALOGO_REPUESTO',
      tablaAfectada: 'catalogo_repuestos',
      registroId: id,
      valoresAnteriores: oldRes.rows[0],
      valoresNuevos: { activo: false, eliminado_en: new Date().toISOString(), eliminado_por: userId }
    });

    return res.json({ message: 'Repuesto retirado y archivado del catálogo.' });
  } catch (error) {
    console.error('Error deleting repuesto:', error);
    return res.status(500).json({ error: 'Error al eliminar repuesto del catálogo.' });
  }
});

app.delete('/api/orders/:id', authenticateToken, requireRole(['Administrador']), async (req: any, res) => {
  const { id } = req.params;
  const userId = req.user?.id;
  try {
    const oldRes = await db.query('SELECT * FROM ordenes_servicio WHERE id = $1 AND eliminado_en IS NULL', [id]);
    if (oldRes.rows.length === 0) {
      return res.status(404).json({ error: 'Orden de servicio no encontrada o ya eliminada.' });
    }

    await db.query(
      'UPDATE ordenes_servicio SET eliminado_en = CURRENT_TIMESTAMP, eliminado_por = $1 WHERE id = $2',
      [userId || null, id]
    );

    await writeAuditLog({
      userId: userId || null,
      accion: 'ELIMINAR_ORDEN_SERVICIO',
      tablaAfectada: 'ordenes_servicio',
      registroId: id,
      valoresAnteriores: oldRes.rows[0],
      valoresNuevos: { eliminado_en: new Date().toISOString(), eliminado_por: userId }
    });

    return res.json({ message: 'Orden de servicio eliminada correctamente del sistema.' });
  } catch (error) {
    console.error('Error deleting order:', error);
    return res.status(500).json({ error: 'Error al eliminar la orden de servicio.' });
  }
});

// ==========================================
// RUTAS DE INSPECCIONES / CHECKLISTS (Módulo 3)
// ==========================================
app.get('/api/checklists', authenticateToken, ChecklistsController.getChecklists);
app.post('/api/checklists', authenticateToken, ChecklistsController.createChecklist);
app.post('/api/checklists/upload', authenticateToken, upload.single('multimedia'), ChecklistsController.uploadMedia);
app.delete('/api/checklists/:id', authenticateToken, requirePermission('borrar_checklists'), ChecklistsController.deleteChecklist);
app.post('/api/checklists/:id/sign', authenticateToken, requirePermission('firmar_checklists'), ChecklistsController.signChecklist);

// ==========================================
// RUTAS DE ÓRDENES DE SERVICIO (Módulos 3 y 5)
// ==========================================
app.get('/api/orders', authenticateToken, OrdersController.getOrders);
app.get('/api/orders/:id', authenticateToken, OrdersController.getOrderById);
app.post('/api/orders', authenticateToken, OrdersController.createOrder);
app.put('/api/orders/:id', authenticateToken, OrdersController.updateOrder);
app.post('/api/orders/:id/insumos', authenticateToken, OrdersController.addInsumo);

// ==========================================
// RUTAS DE SOLICITUDES DE MANTENIMIENTO
// ==========================================
app.get('/api/solicitudes', authenticateToken, SolicitudesController.getSolicitudes);
app.post('/api/solicitudes', authenticateToken, SolicitudesController.createSolicitud);
app.delete('/api/solicitudes/:id', authenticateToken, requireRole(['Administrador']), SolicitudesController.deleteSolicitud);

// Exportar Reporte PDF (Buscador y Reportes)
app.get('/api/orders/:id/pdf', authenticateToken, OrdersController.exportPDF);

// ==========================================
// RUTA DE AUDITORÍA INMUTABLE (Módulo de Logs)
// ==========================================
app.get('/api/audit-logs', authenticateToken, requireRole(['Administrador']), async (req, res) => {
  const { usuario_id, fecha_inicio, fecha_fin } = req.query;
  let queryText = `
    SELECT l.*, u.nombre, u.nombre_usuario, u.rol 
    FROM logs_auditoria l
    LEFT JOIN usuarios u ON l.usuario_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];
  let paramIndex = 1;

  if (usuario_id) {
    queryText += ` AND l.usuario_id = $${paramIndex}`;
    params.push(usuario_id);
    paramIndex++;
  }

  if (fecha_inicio) {
    queryText += ` AND l.fecha_accion >= $${paramIndex}`;
    params.push(fecha_inicio);
    paramIndex++;
  }

  if (fecha_fin) {
    queryText += ` AND l.fecha_accion <= $${paramIndex}`;
    params.push(`${fecha_fin}T23:59:59.999Z`);
    paramIndex++;
  }

  queryText += ' ORDER BY l.fecha_accion DESC LIMIT 200';

  try {
    const result = await db.query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al consultar logs de auditoría.' });
  }
});

// RUTAS DE CONSULTAS HISTÓRICAS DE MANTENIMIENTO E INSUMOS
app.get('/api/assets/:id/parts-history', authenticateToken, HistoryController.getAssetPartsHistory);
app.get('/api/repuestos/:id/usage-history', authenticateToken, HistoryController.getRepuestoUsageHistory);

// ==========================================
// RUTAS DE TICKETS CORPORATIVOS Y PROJECT MANAGEMENT
// ==========================================
app.get('/api/tickets', authenticateToken, TicketsController.getTickets);
app.get('/api/tickets/:id', authenticateToken, TicketsController.getTicketById);
app.post('/api/tickets', authenticateToken, TicketsController.createTicket);
app.put('/api/tickets/:id/status', authenticateToken, TicketsController.updateTicketStatus);
app.post('/api/tickets/:id/comments', authenticateToken, TicketsController.addComment);
app.delete('/api/tickets/:id', authenticateToken, TicketsController.deleteTicket);

// ==========================================
// RUTAS DE NOTIFICACIONES Y BUZÓN
// ==========================================
app.get('/api/notifications', authenticateToken, NotificationsController.getNotifications);
app.patch('/api/notifications/:id/read', authenticateToken, NotificationsController.markAsRead);

// ==========================================
// RUTAS DE EVALUACIÓN DE RENDIMIENTO Y WARNINGS (Solo Administrador)
// ==========================================
app.get('/api/performance/stats', authenticateToken, requireRole(['Administrador']), PerformanceController.getEmployeePerformanceStats);
app.get('/api/performance/warnings', authenticateToken, requireRole(['Administrador']), PerformanceController.getWarningsList);
app.post('/api/performance/warnings', authenticateToken, requireRole(['Administrador']), PerformanceController.createWarning);

// ==========================================
// RUTAS DE PROCURA E IMPORTACIONES (Intérprete Inteligente)
// ==========================================
app.post('/api/procura/parse-proforma', optionalAuthenticateToken, upload.single('file'), ProcuraController.parseProforma);

// ==========================================
// RUTAS DE FEEDBACK Y SUGERENCIAS DEL PILOTO
// ==========================================
app.get('/api/feedback', authenticateToken, FeedbacksController.getFeedbacks);
app.post('/api/feedback', authenticateToken, FeedbacksController.createFeedback);
app.patch('/api/feedback/:id/status', authenticateToken, FeedbacksController.updateFeedbackStatus);
app.delete('/api/feedback/:id', authenticateToken, FeedbacksController.deleteFeedback);

// ==========================================
// SERVICIO DE ASSETS ESTÁTICOS Y SPA (FRONTEND)
// ==========================================
import path from 'path';
const frontendDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
    if (err) {
      next();
    }
  });
});

export default app;
