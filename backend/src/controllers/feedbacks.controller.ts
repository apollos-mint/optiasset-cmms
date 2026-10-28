import { Response } from 'express';
import { db } from '../config/db';
import { AuthenticatedRequest, writeAuditLog } from '../middlewares/audit.middleware';

/**
 * Valida si un usuario posee privilegios de supervisión/gestión sobre los feedbacks.
 * Tienen acceso automático: Administrador, Administrador de Sistema, Presidente, Director General, Gerente General.
 * También aquellos usuarios que tengan explícitamente en sus permisos: ver_feedbacks o editar_feedbacks.
 */
async function checkFeedbackPermissions(userId?: string, userRole?: string): Promise<{ canViewAll: boolean; canEdit: boolean }> {
  if (!userId) return { canViewAll: false, canEdit: false };

  const roleClean = (userRole || '').trim().toLowerCase();
  if (
    roleClean.includes('admin') || 
    roleClean.includes('presidente') || 
    roleClean.includes('director') || 
    roleClean.includes('gerente general')
  ) {
    return { canViewAll: true, canEdit: true };
  }

  try {
    const res = await db.query(
      `SELECT u.permisos, r.permisos AS role_permisos 
       FROM usuarios u 
       LEFT JOIN roles r ON u.rol = r.nombre 
       WHERE u.id = $1`,
      [userId]
    );

    if (res.rows.length > 0) {
      const uPerms = res.rows[0].permisos || {};
      const rPerms = res.rows[0].role_permisos || {};
      const canEdit = !!(
        uPerms.editar_feedbacks === true || 
        rPerms.editar_feedbacks === true || 
        uPerms.acceder_usuarios === true || 
        rPerms.acceder_usuarios === true
      );
      const canViewAll = canEdit || !!(
        uPerms.ver_feedbacks === true || 
        rPerms.ver_feedbacks === true || 
        uPerms.ver_usuarios === true || 
        rPerms.ver_usuarios === true
      );
      return { canViewAll, canEdit };
    }
  } catch (err) {
    console.error('Error al verificar permisos para feedback:', err);
  }

  return { canViewAll: false, canEdit: false };
}

export class FeedbacksController {
  /**
   * Crear nuevo feedback de stakeholder
   */
  static async createFeedback(req: AuthenticatedRequest, res: Response) {
    const { 
      modulo_actual, 
      url_path, 
      dispositivo, 
      problema_obstaculo, 
      solucion_propuesta, 
      impacto,
      nombre_usuario: bodyNombre,
      rol_usuario: bodyRol,
      departamento: bodyDepto
    } = req.body;

    if (!problema_obstaculo || !problema_obstaculo.trim()) {
      return res.status(400).json({ error: 'La descripción del problema u obstáculo es obligatoria.' });
    }

    const userId = req.user?.id || null;
    let nombreUsuario = bodyNombre || req.user?.nombre_usuario || 'Anónimo';
    let rolUsuario = bodyRol || req.user?.rol || 'Visitante';
    let departamentoUsuario: string | null = bodyDepto || null;

    if (userId) {
      try {
        const uRes = await db.query('SELECT nombre, nombre_usuario, rol, departamento FROM usuarios WHERE id = $1', [userId]);
        if (uRes.rows.length > 0) {
          nombreUsuario = uRes.rows[0].nombre || bodyNombre || uRes.rows[0].nombre_usuario || req.user?.nombre_usuario || 'Usuario';
          rolUsuario = uRes.rows[0].rol || bodyRol || req.user?.rol || 'Visitante';
          departamentoUsuario = uRes.rows[0].departamento || bodyDepto || null;
        }
      } catch (err) {
        console.warn('Advertencia al consultar detalles de usuario para feedback:', err);
      }
    }

    try {
      const result = await db.query(
        `INSERT INTO stakeholder_feedbacks 
         (usuario_id, nombre_usuario, rol_usuario, departamento, modulo_actual, url_path, dispositivo, problema_obstaculo, solucion_propuesta, impacto, estado)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pendiente')
         RETURNING *`,
        [
          userId,
          nombreUsuario,
          rolUsuario,
          departamentoUsuario,
          modulo_actual || 'general',
          url_path || null,
          dispositivo || null,
          problema_obstaculo.trim(),
          solucion_propuesta ? solucion_propuesta.trim() : null,
          impacto || 'molestia'
        ]
      );

      const newFeedback = result.rows[0];

      await writeAuditLog({
        userId: userId,
        accion: 'CREAR_FEEDBACK_PILOTO',
        tablaAfectada: 'stakeholder_feedbacks',
        registroId: newFeedback.id.toString(),
        valoresNuevos: {
          id: newFeedback.id,
          usuario_id: userId,
          autor_nombre: nombreUsuario,
          autor_rol: rolUsuario,
          departamento: departamentoUsuario,
          modulo_actual: newFeedback.modulo_actual,
          impacto: newFeedback.impacto,
          problema_obstaculo: newFeedback.problema_obstaculo,
          solucion_propuesta: newFeedback.solucion_propuesta,
          fecha_hora_creacion: newFeedback.creado_en
        }
      });

      return res.status(201).json(newFeedback);
    } catch (error) {
      console.error('Error al guardar feedback:', error);
      return res.status(500).json({ error: 'Error interno al guardar el feedback del stakeholder.' });
    }
  }

  /**
   * Obtener feedbacks con filtros avanzados y control de permisos granular
   */
  static async getFeedbacks(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    const userRole = req.user?.rol;
    const { canViewAll } = await checkFeedbackPermissions(userId, userRole);
    const { estado, impacto, modulo, usuario_id, periodo, busqueda } = req.query;

    try {
      let queryText = `
        SELECT 
          f.*,
          COALESCE(u.nombre, f.nombre_usuario, 'Usuario') AS nombre_usuario,
          COALESCE(u.rol, f.rol_usuario, 'Visitante') AS rol_usuario,
          COALESCE(u.departamento, f.departamento) AS departamento,
          u.nombre_usuario AS handle_usuario,
          u.foto_perfil
        FROM stakeholder_feedbacks f
        LEFT JOIN usuarios u ON f.usuario_id = u.id
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramIdx = 1;

      if (!canViewAll) {
        // Si no tiene permisos de supervisión, ve únicamente sus propios feedbacks
        if (!userId) {
          return res.status(401).json({ error: 'No autorizado.' });
        }
        queryText += ` AND f.usuario_id = $${paramIdx}`;
        params.push(userId);
        paramIdx++;
      } else {
        // Supervisor: puede ver todos y aplicar filtros avanzados
        if (usuario_id && typeof usuario_id === 'string' && usuario_id !== 'todos') {
          queryText += ` AND (f.usuario_id = $${paramIdx} OR f.nombre_usuario = $${paramIdx} OR u.nombre = $${paramIdx})`;
          params.push(usuario_id);
          paramIdx++;
        }
        if (estado && typeof estado === 'string' && estado !== 'todos') {
          queryText += ` AND f.estado = $${paramIdx}`;
          params.push(estado);
          paramIdx++;
        }
        if (impacto && typeof impacto === 'string' && impacto !== 'todos') {
          queryText += ` AND f.impacto = $${paramIdx}`;
          params.push(impacto);
          paramIdx++;
        }
        if (modulo && typeof modulo === 'string' && modulo !== 'todos') {
          queryText += ` AND f.modulo_actual = $${paramIdx}`;
          params.push(modulo);
          paramIdx++;
        }
        if (periodo && typeof periodo === 'string') {
          if (periodo === 'hoy') {
            queryText += ` AND f.creado_en >= CURRENT_DATE`;
          } else if (periodo === 'semana') {
            queryText += ` AND f.creado_en >= (CURRENT_DATE - INTERVAL '7 days')`;
          } else if (periodo === 'mes') {
            queryText += ` AND f.creado_en >= (CURRENT_DATE - INTERVAL '30 days')`;
          }
        }
        if (busqueda && typeof busqueda === 'string' && busqueda.trim()) {
          queryText += ` AND (
            f.nombre_usuario ILIKE $${paramIdx} OR 
            u.nombre ILIKE $${paramIdx} OR 
            u.nombre_usuario ILIKE $${paramIdx} OR 
            f.rol_usuario ILIKE $${paramIdx} OR 
            f.problema_obstaculo ILIKE $${paramIdx} OR 
            COALESCE(f.solucion_propuesta, '') ILIKE $${paramIdx} OR 
            f.modulo_actual ILIKE $${paramIdx}
          )`;
          params.push(`%${busqueda.trim()}%`);
          paramIdx++;
        }
      }

      queryText += ' ORDER BY f.creado_en DESC LIMIT 200';

      const result = await db.query(queryText, params);
      return res.json(result.rows);
    } catch (error) {
      console.error('Error al consultar feedbacks:', error);
      return res.status(500).json({ error: 'Error al consultar feedbacks.' });
    }
  }

  /**
   * Actualizar estado o notas de un feedback (Requiere permiso de edición)
   */
  static async updateFeedbackStatus(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const { estado, notas_admin } = req.body;
    const { canEdit } = await checkFeedbackPermissions(req.user?.id, req.user?.rol);

    if (!canEdit) {
      return res.status(403).json({ error: 'No dispone de privilegios para gestionar o responder feedbacks.' });
    }

    try {
      const oldRes = await db.query('SELECT * FROM stakeholder_feedbacks WHERE id = $1', [id]);
      if (oldRes.rows.length === 0) {
        return res.status(404).json({ error: 'Feedback no encontrado.' });
      }

      const oldFeedback = oldRes.rows[0];
      const newEstado = estado || oldFeedback.estado;
      const newNotas = notas_admin !== undefined ? notas_admin : oldFeedback.notas_admin;

      const result = await db.query(
        `UPDATE stakeholder_feedbacks 
         SET estado = $1, notas_admin = $2, actualizado_en = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING *`,
        [newEstado, newNotas, id]
      );

      const updated = result.rows[0];

      await writeAuditLog({
        userId: req.user?.id || null,
        accion: 'ACTUALIZAR_ESTADO_FEEDBACK',
        tablaAfectada: 'stakeholder_feedbacks',
        registroId: id,
        valoresAnteriores: oldFeedback,
        valoresNuevos: updated
      });

      return res.json(updated);
    } catch (error) {
      console.error('Error al actualizar estado del feedback:', error);
      return res.status(500).json({ error: 'Error al actualizar estado del feedback.' });
    }
  }

  /**
   * Eliminar feedback (Requiere permiso de edición)
   */
  static async deleteFeedback(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const { canEdit } = await checkFeedbackPermissions(req.user?.id, req.user?.rol);

    if (!canEdit) {
      return res.status(403).json({ error: 'No dispone de privilegios para eliminar feedbacks.' });
    }

    try {
      const oldRes = await db.query('SELECT * FROM stakeholder_feedbacks WHERE id = $1', [id]);
      if (oldRes.rows.length === 0) {
        return res.status(404).json({ error: 'Feedback no encontrado.' });
      }

      await db.query('DELETE FROM stakeholder_feedbacks WHERE id = $1', [id]);

      await writeAuditLog({
        userId: req.user?.id || null,
        accion: 'ELIMINAR_FEEDBACK',
        tablaAfectada: 'stakeholder_feedbacks',
        registroId: id,
        valoresAnteriores: oldRes.rows[0]
      });

      return res.json({ message: 'Feedback eliminado correctamente.' });
    } catch (error) {
      console.error('Error al eliminar feedback:', error);
      return res.status(500).json({ error: 'Error al eliminar feedback.' });
    }
  }
}
