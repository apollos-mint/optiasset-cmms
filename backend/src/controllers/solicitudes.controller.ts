import { Response } from 'express';
import { db } from '../config/db';
import { AuthenticatedRequest, writeAuditLog } from '../middlewares/audit.middleware';

export class SolicitudesController {
  static async getSolicitudes(req: AuthenticatedRequest, res: Response) {
    try {
      const result = await db.query(`
        SELECT s.*, 
               a.datos_especificos->>'placa' as placa,
               a.datos_especificos->>'marca' as marca,
               a.datos_especificos->>'modelo' as modelo,
               u.nombre as usuario_nombre,
               u.nombre_usuario as usuario_username,
               o.id as orden_id
        FROM solicitudes_mantenimiento s
        JOIN activos a ON s.activo_id = a.id
        JOIN usuarios u ON s.usuario_id = u.id
        LEFT JOIN ordenes_servicio o ON o.solicitud_id = s.id
        WHERE s.eliminado_en IS NULL
        ORDER BY s.fecha DESC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener solicitudes de mantenimiento.' });
    }
  }

  static async createSolicitud(req: AuthenticatedRequest, res: Response) {
    const { checklist_id, activo_id, detalles_fallas, auditor_sugerido } = req.body;
    const usuarioId = req.user?.id;

    if (!activo_id || !detalles_fallas || !usuarioId) {
      return res.status(400).json({ error: 'Activo y detalles de fallas son requeridos.' });
    }

    try {
      // 1. Insert maintenance request (SDM)
      const sdmQuery = `
        INSERT INTO solicitudes_mantenimiento (checklist_id, activo_id, usuario_id, detalles_fallas, auditor_sugerido)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      const sdmRes = await db.query(sdmQuery, [checklist_id || null, activo_id, usuarioId, detalles_fallas, auditor_sugerido || null]);
      const newSdm = sdmRes.rows[0];

      // 2. Automatically create associated open work order (Orden de Servicio)
      const firmaCreador = {
        nombre_usuario: req.user?.nombre_usuario || 'desconocido',
        fecha: new Date()
      };
      
      const orderQuery = `
        INSERT INTO ordenes_servicio (activo_id, usuario_id, diagnostico, solicitud_id, estado, firma_creador)
        VALUES ($1, $2, $3, $4, 'Abierta', $5)
        RETURNING *
      `;
      const orderRes = await db.query(orderQuery, [
        activo_id,
        usuarioId,
        `Orden generada automáticamente por Solicitud de Mantenimiento ${newSdm.id}.\nFallas reportadas:\n${detalles_fallas}`,
        newSdm.id,
        JSON.stringify(firmaCreador)
      ]);
      const newOrder = orderRes.rows[0];

      // Write audit logs
      await writeAuditLog({
        userId: usuarioId,
        accion: 'CREAR_SOLICITUD_MANTENIMIENTO',
        tablaAfectada: 'solicitudes_mantenimiento',
        registroId: newSdm.id,
        valoresNuevos: newSdm
      });

      await writeAuditLog({
        userId: usuarioId,
        accion: 'AUTO_CREAR_ORDEN_DESDE_SDM',
        tablaAfectada: 'ordenes_servicio',
        registroId: newOrder.id,
        valoresNuevos: newOrder
      });

      res.status(201).json({ sdm: newSdm, order: newOrder });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al registrar solicitud de mantenimiento.' });
    }
  }

  static async deleteSolicitud(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const userId = req.user?.id;

    try {
      const sdmRes = await db.query('SELECT * FROM solicitudes_mantenimiento WHERE id = $1 AND eliminado_en IS NULL', [id]);
      if (sdmRes.rows.length === 0) {
        return res.status(404).json({ error: 'Solicitud de mantenimiento no encontrada o ya eliminada.' });
      }

      const oldSdm = sdmRes.rows[0];

      await db.query(
        'UPDATE solicitudes_mantenimiento SET eliminado_en = CURRENT_TIMESTAMP, eliminado_por = $1 WHERE id = $2',
        [userId || null, id]
      );

      await writeAuditLog({
        userId: userId || null,
        accion: 'ELIMINAR_SOLICITUD_MANTENIMIENTO',
        tablaAfectada: 'solicitudes_mantenimiento',
        registroId: id,
        valoresAnteriores: oldSdm,
        valoresNuevos: { eliminado_en: new Date().toISOString(), eliminado_por: userId }
      });

      return res.json({ message: 'Solicitud de mantenimiento eliminada correctamente del sistema.' });
    } catch (error) {
      console.error('Error al eliminar solicitud:', error);
      return res.status(500).json({ error: 'Error al eliminar solicitud de mantenimiento.' });
    }
  }
}
