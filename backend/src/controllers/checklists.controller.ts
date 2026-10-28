import { Response } from 'express';
import { db } from '../config/db';
import { AuthenticatedRequest, writeAuditLog } from '../middlewares/audit.middleware';
import { MileageService } from '../services/mileage.service';
import { uploadToCloudStorage } from '../config/storage';

export class ChecklistsController {

  /**
   * Retrieves checklists, with optional asset filtering
   */
  static async getChecklists(req: AuthenticatedRequest, res: Response) {
    const { activo_id } = req.query;
    let queryText = `
      SELECT c.*, a.tipo_activo, a.datos_especificos->>'placa' as placa, a.datos_especificos->>'marca' as marca, a.datos_especificos->>'modelo' as modelo, u.nombre as inspector
      FROM checklists c
      JOIN activos a ON c.activo_id = a.id
      JOIN usuarios u ON c.usuario_id = u.id
      WHERE c.eliminado_en IS NULL
    `;
    const params: any[] = [];

    if (activo_id) {
      queryText += ' AND c.activo_id = $1';
      params.push(activo_id);
    }

    queryText += ' ORDER BY c.fecha DESC';

    try {
      const result = await db.query(queryText, params);
      return res.json(result.rows);
    } catch (error) {
      return res.status(500).json({ error: 'Error al consultar checklists.' });
    }
  }

  /**
   * Submit a new inspection checklist
   */
  static async createChecklist(req: AuthenticatedRequest, res: Response) {
    const { activo_id, kilometraje_registro, horometro_registro, observaciones, respuestas_detalle } = req.body;
    const inspectorId = req.user?.id;

    if (!activo_id || !inspectorId) {
      return res.status(400).json({ error: 'ID del activo e Inspector son obligatorios.' });
    }

    const km = kilometraje_registro !== undefined && kilometraje_registro !== null ? parseFloat(kilometraje_registro) : undefined;
    const hr = horometro_registro !== undefined && horometro_registro !== null ? parseFloat(horometro_registro) : undefined;

    try {
      // REGLA DE NEGOCIO: Validación de Kilometraje/Horómetro Incremental
      await MileageService.validateIncrement({
        activoId: activo_id,
        kilometraje: km,
        horometro: hr,
      });

      const queryText = `
        INSERT INTO checklists (activo_id, usuario_id, kilometraje_registro, horometro_registro, observaciones, respuestas_detalle)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const result = await db.query(queryText, [
        activo_id,
        inspectorId,
        km || null,
        hr || null,
        observaciones || null,
        JSON.stringify(respuestas_detalle || {})
      ]);

      const newChecklist = result.rows[0];

      // Logs de Auditoría inmutables (Firma del inspector vinculada automáticamente)
      await writeAuditLog({
        userId: inspectorId,
        accion: 'REGISTRAR_CHECKLIST',
        tablaAfectada: 'checklists',
        registroId: newChecklist.id,
        valoresNuevos: newChecklist
      });

      return res.status(201).json(newChecklist);
    } catch (error: any) {
      console.error(error);
      return res.status(400).json({ error: error.message || 'Error al procesar el checklist.' });
    }
  }

  /**
   * Upload multimedia endpoint (S3/Cloudinary)
   */
  static async uploadMedia(req: AuthenticatedRequest, res: Response) {
    if (!req.file) {
      return res.status(400).json({ error: 'Ningún archivo fue recibido.' });
    }

    try {
      // Subir el archivo al Storage y obtener su URL inalterable
      const fileUrl = await uploadToCloudStorage(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      // Registrar auditoría de carga multimedia
      await writeAuditLog({
        userId: req.user?.id || null,
        accion: 'CARGAR_MULTIMEDIA',
        tablaAfectada: 'multimedia',
        registroId: req.file.originalname,
        valoresNuevos: { fileUrl, size: req.file.size }
      });

      return res.json({ url: fileUrl });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: 'Error interno al subir el archivo multimedia.' });
    }
  }

  /**
   * Delete a checklist (Admin/Authorized only)
   */
  static async deleteChecklist(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const userId = req.user?.id;

    try {
      const checkRes = await db.query('SELECT * FROM checklists WHERE id = $1 AND eliminado_en IS NULL', [id]);
      if (checkRes.rows.length === 0) {
        return res.status(404).json({ error: 'Checklist no encontrado o ya eliminado.' });
      }

      const checklist = checkRes.rows[0];

      // Si el checklist ya ha sido firmado/auditado, denegar la eliminación excepto para el Administrador
      if (checklist.respuestas_detalle?.firma_auditoria && req.user?.rol !== 'Administrador') {
        return res.status(400).json({ error: 'Un checklist auditado no puede ser eliminado por su rol.' });
      }

      await db.query(
        'UPDATE checklists SET eliminado_en = CURRENT_TIMESTAMP, eliminado_por = $1 WHERE id = $2',
        [userId || null, id]
      );

      await writeAuditLog({
        userId: userId || null,
        accion: 'ELIMINAR_CHECKLIST',
        tablaAfectada: 'checklists',
        registroId: id,
        valoresAnteriores: checklist,
        valoresNuevos: { eliminado_en: new Date().toISOString(), eliminado_por: userId }
      });

      return res.json({ message: 'Checklist eliminado correctamente del sistema.' });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: 'Error interno al eliminar el checklist.' });
    }
  }

  /**
   * Sign/audit a checklist (Asistente/Authorized only)
   */
  static async signChecklist(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const auditorId = req.user?.id;
    const auditorNombre = req.user?.nombre_usuario || 'Auditor';

    try {
      const checkRes = await db.query(
        'SELECT c.*, u.nombre as auditor_real_name FROM checklists c JOIN usuarios u ON u.id = $1 WHERE c.id = $2',
        [auditorId, id]
      );
      if (checkRes.rows.length === 0) {
        return res.status(404).json({ error: 'Checklist no encontrado.' });
      }

      const checklist = checkRes.rows[0];
      const auditorRealName = checklist.auditor_real_name || auditorNombre;

      // Si el checklist ya ha sido firmado/auditado, denegar la acción
      if (checklist.respuestas_detalle?.firma_auditoria) {
        return res.status(400).json({ error: 'Checklist ya ha sido auditado y firmado anteriormente.' });
      }

      const firma_auditoria = {
        usuario_id: auditorId,
        nombre_usuario: auditorRealName,
        fecha: new Date().toISOString(),
        completada: true
      };

      const updatedRespuestas = {
        ...(checklist.respuestas_detalle || {}),
        firma_auditoria
      };

      await db.query(
        'UPDATE checklists SET respuestas_detalle = $1 WHERE id = $2',
        [JSON.stringify(updatedRespuestas), id]
      );

      await writeAuditLog({
        userId: auditorId || null,
        accion: 'AUDITAR_CHECKLIST',
        tablaAfectada: 'checklists',
        registroId: id,
        valoresNuevos: { firma_auditoria }
      });

      return res.json({ 
        message: 'Checklist firmado y auditado con éxito.', 
        firma_auditoria 
      });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: 'Error interno al firmar el checklist.' });
    }
  }
}
