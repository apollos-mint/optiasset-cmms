import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/audit.middleware';
import { db } from '../config/db';

export class NotificationsController {
  /**
   * Obtener notificaciones del usuario en sesión
   */
  static async getNotifications(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'No autenticado.' });

      const notifsRes = await db.query(
        `SELECT 
          n.*,
          u.nombre as remitente_nombre,
          u.rol as remitente_rol
        FROM notificaciones_usuario n
        LEFT JOIN usuarios u ON n.remitente_id = u.id
        WHERE n.usuario_id = $1
        ORDER BY n.fecha_creacion DESC
        LIMIT 50`,
        [userId]
      );

      const unreadCountRes = await db.query(
        `SELECT COUNT(*) as unread_count 
         FROM notificaciones_usuario 
         WHERE usuario_id = $1 AND leido = FALSE`,
        [userId]
      );

      return res.json({
        notificaciones: notifsRes.rows,
        no_leidas: parseInt(unreadCountRes.rows[0]?.unread_count || '0', 10)
      });
    } catch (error: any) {
      console.error('Error al obtener notificaciones:', error);
      return res.status(500).json({ error: 'Error al consultar notificaciones.' });
    }
  }

  /**
   * Marcar notificación específica o todas como leídas
   */
  static async markAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'No autenticado.' });

      const { id } = req.params;

      if (id === 'all') {
        await db.query(
          `UPDATE notificaciones_usuario 
           SET leido = TRUE, fecha_lectura = CURRENT_TIMESTAMP 
           WHERE usuario_id = $1 AND leido = FALSE`,
          [userId]
        );
        return res.json({ message: 'Todas las notificaciones fueron marcadas como leídas.' });
      }

      await db.query(
        `UPDATE notificaciones_usuario 
         SET leido = TRUE, fecha_lectura = CURRENT_TIMESTAMP 
         WHERE id = $1 AND usuario_id = $2`,
        [id, userId]
      );

      return res.json({ message: 'Notificación marcada como leída.' });
    } catch (error: any) {
      console.error('Error al marcar notificación:', error);
      return res.status(500).json({ error: 'Error al actualizar notificación.' });
    }
  }
}
