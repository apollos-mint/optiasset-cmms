import { Response } from 'express';
import { db } from '../config/db';
import { AuthenticatedRequest } from '../middlewares/audit.middleware';

export class HistoryController {
  /**
   * Get history of parts/supplies consumed for a specific asset
   */
  static async getAssetPartsHistory(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;

    try {
      const queryText = `
        SELECT i.id, i.cantidad_usada, i.costo_unitario_historico, r.descripcion, r.unidad_medida, 
               o.id AS orden_id, o.fecha_inicio, o.fecha_fin, u.nombre AS mecanico_nombre
        FROM insumos_orden i
        JOIN ordenes_servicio o ON i.orden_id = o.id
        JOIN catalogo_repuestos r ON i.repuesto_id = r.id
        LEFT JOIN usuarios u ON o.usuario_id = u.id
        WHERE o.activo_id = $1 AND o.estado = 'Completada'
        ORDER BY o.fecha_fin DESC
      `;
      const result = await db.query(queryText, [id]);
      return res.json(result.rows);
    } catch (error) {
      console.error('Error fetching asset parts history:', error);
      return res.status(500).json({ error: 'Error al obtener el historial de repuestos del activo.' });
    }
  }

  /**
   * Get history of assets that consumed a specific spare part/supply
   */
  static async getRepuestoUsageHistory(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;

    try {
      const queryText = `
        SELECT i.id, i.cantidad_usada, i.costo_unitario_historico, 
               a.id AS activo_id, a.tipo_activo, a.datos_especificos,
               o.id AS orden_id, o.fecha_inicio, o.fecha_fin, u.nombre AS mecanico_nombre
        FROM insumos_orden i
        JOIN ordenes_servicio o ON i.orden_id = o.id
        JOIN activos a ON o.activo_id = a.id
        LEFT JOIN usuarios u ON o.usuario_id = u.id
        WHERE i.repuesto_id = $1 AND o.estado = 'Completada'
        ORDER BY o.fecha_fin DESC
      `;
      const result = await db.query(queryText, [id]);
      return res.json(result.rows);
    } catch (error) {
      console.error('Error fetching spare part usage history:', error);
      return res.status(500).json({ error: 'Error al obtener el historial de uso del insumo.' });
    }
  }
}
