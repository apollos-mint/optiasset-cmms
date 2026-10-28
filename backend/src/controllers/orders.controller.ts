import { Response } from 'express';
import PDFDocument from 'pdfkit';
import { db } from '../config/db';
import { AuthenticatedRequest, writeAuditLog } from '../middlewares/audit.middleware';
import { MileageService } from '../services/mileage.service';
import { ProfitSyncService } from '../services/profitSync.service';

const safeFloat = (val: any): number | null => {
  if (val === undefined || val === null || val === '') return null;
  const parsed = parseFloat(val);
  return isNaN(parsed) ? null : parsed;
};

export class OrdersController {

  /**
   * Search and filter work orders with combined parameters (Module 5)
   */
  static async getOrders(req: AuthenticatedRequest, res: Response) {
    const { operador, activo, fecha_inicio, fecha_fin, tipo_activo, estado } = req.query;
    
    let queryText = `
      SELECT o.*, 
             a.tipo_activo, 
             a.datos_especificos->>'placa' as placa,
             a.datos_especificos->>'marca' as marca,
             a.datos_especificos->>'modelo' as modelo,
             u.nombre as mecanico
      FROM ordenes_servicio o
      JOIN activos a ON o.activo_id = a.id
      JOIN usuarios u ON o.usuario_id = u.id
      WHERE o.eliminado_en IS NULL
    `;
    
    const params: any[] = [];
    let paramIndex = 1;

    if (operador) {
      queryText += ` AND (u.nombre ILIKE $${paramIndex} OR u.nombre_usuario ILIKE $${paramIndex})`;
      params.push(`%${operador}%`);
      paramIndex++;
    }

    if (activo) {
      queryText += ` AND (a.datos_especificos->>'placa' ILIKE $${paramIndex} 
                     OR a.datos_especificos->>'numero_serie' ILIKE $${paramIndex}
                     OR a.datos_especificos->>'nombre_item' ILIKE $${paramIndex})`;
      params.push(`%${activo}%`);
      paramIndex++;
    }

    if (fecha_inicio) {
      queryText += ` AND o.fecha_inicio >= $${paramIndex}`;
      params.push(fecha_inicio);
      paramIndex++;
    }

    if (fecha_fin) {
      queryText += ` AND o.fecha_inicio <= $${paramIndex}`;
      params.push(fecha_fin);
      paramIndex++;
    }

    if (tipo_activo) {
      queryText += ` AND a.tipo_activo = $${paramIndex}`;
      params.push(tipo_activo);
      paramIndex++;
    }

    if (estado) {
      queryText += ` AND o.estado = $${paramIndex}`;
      params.push(estado);
      paramIndex++;
    }

    queryText += ' ORDER BY o.fecha_inicio DESC';

    try {
      const result = await db.query(queryText, params);
      return res.json(result.rows);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error al filtrar órdenes de servicio.' });
    }
  }

  /**
   * Fetch details for a specific order (including spare parts list)
   */
  static async getOrderById(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    try {
      const orderRes = await db.query(
        `SELECT o.*, u.nombre as mecanico_nombre, a.tipo_activo, a.datos_especificos 
         FROM ordenes_servicio o 
         JOIN usuarios u ON o.usuario_id = u.id
         JOIN activos a ON o.activo_id = a.id
         WHERE o.id = $1 AND o.eliminado_en IS NULL`, 
        [id]
      );

      if (orderRes.rows.length === 0) {
        return res.status(404).json({ error: 'Orden de servicio no encontrada.' });
      }

      const insumosRes = await db.query(
        `SELECT i.*, r.descripcion, r.unidad_medida 
         FROM insumos_orden i
         JOIN catalogo_repuestos r ON i.repuesto_id = r.id
         WHERE i.orden_id = $1`, 
        [id]
      );

      return res.json({
        ...orderRes.rows[0],
        insumos: insumosRes.rows
      });
    } catch (error) {
      return res.status(500).json({ error: 'Error al obtener detalles de la orden.' });
    }
  }

  /**
   * Create new work order (phase 1: Abierta)
   */
  static async createOrder(req: AuthenticatedRequest, res: Response) {
    const { activo_id, diagnostico, tasa_hora_taller, kilometraje_registro, horometro_registro } = req.body;
    const mecanicoId = req.user?.id;

    if (!activo_id || !diagnostico || !mecanicoId) {
      return res.status(400).json({ error: 'Activo, diagnóstico e identificación de mecánico son requeridos.' });
    }

    const km = kilometraje_registro ? parseFloat(kilometraje_registro) : undefined;
    const hr = horometro_registro ? parseFloat(horometro_registro) : undefined;

    try {
      // REGLA DE NEGOCIO: Odométro/Horómetro incremental
      await MileageService.validateIncrement({
        activoId: activo_id,
        kilometraje: km,
        horometro: hr
      });

      const firmaCreador = {
        nombre_usuario: req.user?.nombre_usuario || 'desconocido',
        fecha: new Date()
      };

      const queryText = `
        INSERT INTO ordenes_servicio (activo_id, usuario_id, diagnostico, tasa_hora_taller, kilometraje_registro, horometro_registro, firma_creador)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      const result = await db.query(queryText, [
        activo_id,
        mecanicoId,
        diagnostico,
        tasa_hora_taller || 0.00,
        km || null,
        hr || null,
        JSON.stringify(firmaCreador)
      ]);

      const newOrder = result.rows[0];

      await writeAuditLog({
        userId: mecanicoId,
        accion: 'CREAR_ORDEN_SERVICIO',
        tablaAfectada: 'ordenes_servicio',
        registroId: newOrder.id,
        valoresNuevos: newOrder
      });

      return res.status(201).json(newOrder);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Error al crear la orden de servicio.' });
    }
  }

  /**
   * Edit/Sign work order (supports multiple phases and users signing changes)
   */
  static async updateOrder(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const { reparacion_ejecutada, tasa_hora_taller, horas_taller, estado, fecha_fin } = req.body;
    const editorId = req.user?.id || null;

    try {
      const oldRes = await db.query('SELECT * FROM ordenes_servicio WHERE id = $1', [id]);
      if (oldRes.rows.length === 0) {
        return res.status(404).json({ error: 'Orden no encontrada.' });
      }
      const oldOrder = oldRes.rows[0];

      if (oldOrder.estado === 'Completada' && req.user?.rol !== 'Administrador') {
        return res.status(403).json({ error: 'Solo los administradores pueden modificar una orden completada/facturada.' });
      }

      // Query para actualización general
      let queryText = '';
      let params = [];

      if (estado === 'Completada') {
        const auditorFirma = JSON.stringify({
          nombre_usuario: req.user?.nombre_usuario || 'admin',
          fecha: new Date()
        });
        queryText = `
          UPDATE ordenes_servicio 
          SET reparacion_ejecutada = COALESCE($1, reparacion_ejecutada),
              tasa_hora_taller = COALESCE($2, tasa_hora_taller),
              horas_taller = COALESCE($3, horas_taller),
              estado = COALESCE($4, estado),
              fecha_fin = COALESCE($5, fecha_fin),
              firma_auditoria = $6
          WHERE id = $7
          RETURNING *
        `;
        params = [
          reparacion_ejecutada || null,
          safeFloat(tasa_hora_taller),
          safeFloat(horas_taller),
          estado || null,
          fecha_fin || null,
          auditorFirma,
          id
        ];
      } else {
        queryText = `
          UPDATE ordenes_servicio 
          SET reparacion_ejecutada = COALESCE($1, reparacion_ejecutada),
              tasa_hora_taller = COALESCE($2, tasa_hora_taller),
              horas_taller = COALESCE($3, horas_taller),
              estado = COALESCE($4, estado),
              fecha_fin = COALESCE($5, fecha_fin),
              firma_auditoria = CASE WHEN $4 IS NOT NULL AND $4 != 'Completada' THEN NULL ELSE firma_auditoria END
          WHERE id = $6
          RETURNING *
        `;
        params = [
          reparacion_ejecutada || null,
          safeFloat(tasa_hora_taller),
          safeFloat(horas_taller),
          estado || null,
          fecha_fin || null,
          id
        ];
      }

      const result = await db.query(queryText, params);

      await OrdersController.recalculateOrderTotal(id);
      const updatedRes = await db.query('SELECT * FROM ordenes_servicio WHERE id = $1', [id]);
      const updatedOrder = updatedRes.rows[0];

      // Sincronización automática con Profit Plus al auditar y completar (Fase 2)
      if (estado === 'Completada') {
        try {
          const insumosRes = await db.query(
            `SELECT i.*, r.descripcion, r.unidad_medida, r.profit_co_art 
             FROM insumos_orden i
             JOIN catalogo_repuestos r ON i.repuesto_id = r.id
             WHERE i.orden_id = $1`,
            [id]
          );
          
          const activeRes = await db.query(
            `SELECT a.datos_especificos->>'placa' as placa FROM activos a WHERE a.id = $1`,
            [updatedOrder.activo_id]
          );
          
          const orderWithPlaca = {
            ...updatedOrder,
            placa: activeRes.rows[0]?.placa || ''
          };
          
          const docNum = await ProfitSyncService.syncOrderToProfit(orderWithPlaca, insumosRes.rows);
          
          await db.query('UPDATE ordenes_servicio SET profit_doc_num = $1 WHERE id = $2', [docNum, id]);
          updatedOrder.profit_doc_num = docNum;
          console.log(`[Profit Sync] Sincronización exitosa. Documento generado: ${docNum}`);
        } catch (syncErr) {
          console.error('[Profit Sync] Error de sincronización al auditar orden:', syncErr);
        }
      }

      // Firma digital registrada en logs inmutables
      await writeAuditLog({
        userId: editorId,
        accion: `ACTUALIZAR_ORDEN_${estado || updatedOrder.estado}`,
        tablaAfectada: 'ordenes_servicio',
        registroId: id,
        valoresAnteriores: oldOrder,
        valoresNuevos: updatedOrder
      });

      return res.json(updatedOrder);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error al actualizar orden de servicio.' });
    }
  }

  /**
   * Add spare parts to order (Freezing historical unit cost)
   */
  static async addInsumo(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params; // order id
    const { repuesto_id, cantidad_usada } = req.body;

    if (!repuesto_id || !cantidad_usada) {
      return res.status(400).json({ error: 'Repuesto y cantidad usada son obligatorios.' });
    }

    try {
      // 1. Obtener precio actual de referencia
      const repuestoRes = await db.query('SELECT precio_referencia FROM catalogo_repuestos WHERE id = $1', [repuesto_id]);
      if (repuestoRes.rows.length === 0) {
        return res.status(404).json({ error: 'Repuesto no encontrado en catálogo maestro.' });
      }
      const costoHistorico = repuestoRes.rows[0].precio_referencia;

      // 2. Insertar insumo congelando precio
      const insertQuery = `
        INSERT INTO insumos_orden (orden_id, repuesto_id, cantidad_usada, costo_unitario_historico)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      const insumoResult = await db.query(insertQuery, [id, repuesto_id, cantidad_usada, costoHistorico]);

      // 3. Recalcular total de la orden
      await OrdersController.recalculateOrderTotal(id);

      await writeAuditLog({
        userId: req.user?.id || null,
        accion: 'AGREGAR_INSUMO_ORDEN',
        tablaAfectada: 'insumos_orden',
        registroId: insumoResult.rows[0].id.toString(),
        valoresNuevos: insumoResult.rows[0]
      });

      return res.status(201).json(insumoResult.rows[0]);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error al agregar insumo.' });
    }
  }

  /**
   * Helper function to recalculate the invoice total of a work order
   */
  private static async recalculateOrderTotal(ordenId: string): Promise<void> {
    const costRes = await db.query('SELECT total_calculado FROM vista_costos_orden WHERE orden_id = $1', [ordenId]);
    if (costRes.rows.length > 0) {
      const nuevoTotal = parseFloat(costRes.rows[0].total_calculado) || 0.00;
      await db.query('UPDATE ordenes_servicio SET total_facturado = $1 WHERE id = $2', [nuevoTotal, ordenId]);
    }
  }

  /**
   * PDFKit Document Stream Generator (Module 5)
   */
  static async exportPDF(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;

    try {
      const orderRes = await db.query(
        `SELECT o.*, u.nombre as mecanico_nombre, a.tipo_activo, a.datos_especificos 
         FROM ordenes_servicio o 
         JOIN usuarios u ON o.usuario_id = u.id
         JOIN activos a ON o.activo_id = a.id
         WHERE o.id = $1`, 
        [id]
      );

      if (orderRes.rows.length === 0) {
        return res.status(404).json({ error: 'Orden no encontrada.' });
      }

      const order = orderRes.rows[0];
      const insumosRes = await db.query(
        `SELECT i.*, r.descripcion, r.unidad_medida 
         FROM insumos_orden i
         JOIN catalogo_repuestos r ON i.repuesto_id = r.id
         WHERE i.orden_id = $1`, 
        [id]
      );
      const insumos = insumosRes.rows;

      // Crear documento PDF
      const doc = new PDFDocument({ margin: 50 });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=orden-mantenimiento-${id}.pdf`);
      doc.pipe(res);

      // --- Cabecera ---
      doc.fillColor('#1e293b').fontSize(20).text('REPORTE DE MANTENIMIENTO TÉCNICO', { align: 'center' });
      doc.fontSize(10).text(`Orden ID: ${order.id}`, { align: 'center' });
      doc.moveDown(1.5);

      // --- Info del Activo ---
      doc.fillColor('#0f172a').fontSize(14).text('1. Datos del Activo', { underline: true });
      doc.fontSize(10).fillColor('#334155');
      doc.text(`Tipo de Activo: ${order.tipo_activo}`);
      doc.text(`Marca/Modelo: ${order.datos_especificos.marca || 'N/D'} - ${order.datos_especificos.modelo || 'N/D'}`);
      if (order.tipo_activo === 'Vehículo') {
        doc.text(`Placa: ${order.datos_especificos.placa || 'N/D'}`);
        doc.text(`Kilometraje registrado: ${order.kilometraje_registro || 'N/D'} km`);
      } else {
        doc.text(`Horómetro registrado: ${order.horometro_registro || 'N/D'} hrs`);
      }
      doc.moveDown(1);

      // --- Info de Diagnóstico ---
      doc.fillColor('#0f172a').fontSize(14).text('2. Diagnóstico y Reparación', { underline: true });
      doc.fontSize(10).fillColor('#334155');
      doc.text(`Estado actual: ${order.estado}`);
      doc.text(`Fecha de Inicio: ${new Date(order.fecha_inicio).toLocaleDateString()}`);
      doc.text(`Fecha de Cierre: ${order.fecha_fin ? new Date(order.fecha_fin).toLocaleDateString() : 'En Proceso'}`);
      doc.moveDown(0.5);
      let diagnosticoText = order.diagnostico;
      let initialItems: any[] = [];
      try {
        const parsed = JSON.parse(order.diagnostico);
        diagnosticoText = parsed.diagnostico_inicial || order.diagnostico;
        initialItems = parsed.items || [];
      } catch (e) {
        // Fallback for older plain-text data
      }

      doc.fillColor('#1e293b').font('Helvetica-Bold').text('Descripción del Diagnóstico:').font('Helvetica');
      doc.fillColor('#475569').text(diagnosticoText);
      doc.moveDown(0.5);

      if (initialItems.length > 0) {
        doc.fillColor('#1e293b').font('Helvetica-Bold').text('Insumos Iniciales Requeridos:').font('Helvetica');
        initialItems.forEach((item: any) => {
          const total = (parseFloat(item.cantidad) || 0) * (parseFloat(item.costo_unitario) || 0);
          doc.fillColor('#475569').text(`• ${item.descripcion} — Cantidad: ${item.cantidad}, Proveedor: ${item.proveedor}, Costo Unitario: $${parseFloat(item.costo_unitario).toFixed(2)} (Subtotal: $${total.toFixed(2)})`);
        });
        doc.moveDown(0.5);
      }

      doc.fillColor('#1e293b').font('Helvetica-Bold').text('Trabajo Ejecutado:').font('Helvetica');
      doc.fillColor('#475569').text(order.reparacion_ejecutada || 'Pendiente de finalización');
      doc.moveDown(1);

      // --- Insumos y Repuestos ---
      doc.fillColor('#0f172a').fontSize(14).text('3. Desglose de Insumos', { underline: true });
      doc.moveDown(0.5);
      
      let y = doc.y;
      doc.fillColor('#0f172a').fontSize(10);
      doc.text('Descripción', 50, y);
      doc.text('Cant', 280, y);
      doc.text('Costo Unit.', 340, y);
      doc.text('Subtotal', 420, y);
      
      doc.moveTo(50, y + 15).lineTo(500, y + 15).stroke();
      doc.moveDown(1);

      let totalInsumos = 0;
      insumos.forEach((insumo: any) => {
        const sub = parseFloat(insumo.cantidad_usada) * parseFloat(insumo.costo_unitario_historico);
        totalInsumos += sub;
        doc.text(insumo.descripcion, 50, doc.y);
        doc.text(`${insumo.cantidad_usada} ${insumo.unidad_medida}`, 280, doc.y - 10);
        doc.text(`$${parseFloat(insumo.costo_unitario_historico).toFixed(2)}`, 340, doc.y - 10);
        doc.text(`$${sub.toFixed(2)}`, 420, doc.y - 10);
        doc.moveDown(0.5);
      });
      doc.moveDown(1);

      // --- Costos Totales ---
      doc.fillColor('#0f172a').fontSize(14).text('4. Liquidación Económica', { underline: true });
      doc.moveDown(0.5);
      
      const costoManoObra = parseFloat(order.horas_taller) * parseFloat(order.tasa_hora_taller);
      doc.fontSize(10).fillColor('#334155');
      doc.text(`Horas de taller dedicadas: ${order.horas_taller} hrs`);
      doc.text(`Costo hora taller contratado: $${parseFloat(order.tasa_hora_taller).toFixed(2)}`);
      doc.text(`Total Mano de Obra: $${costoManoObra.toFixed(2)}`);
      doc.text(`Total Materiales/Insumos: $${totalInsumos.toFixed(2)}`);
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor('#0f172a').font('Helvetica-Bold').text(`Costo Total Facturado: $${parseFloat(order.total_facturado).toFixed(2)}`).font('Helvetica');
      doc.moveDown(2);

      // --- Firmas Digitales de Auditoría ---
      doc.fontSize(10).fillColor('#1e293b').text('FIRMANTES DIGITALES REGISTRADOS EN SESIÓN:', { underline: true });
      doc.fontSize(8).fillColor('#64748b');
      doc.text(`Firma Mecánico Responsable: ${order.mecanico_nombre} (ID: ${order.usuario_id})`);
      doc.text(`Fecha y hora de auditoría del servidor: ${new Date().toLocaleString()}`);

      doc.end();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al exportar reporte PDF.' });
    }
  }
}
