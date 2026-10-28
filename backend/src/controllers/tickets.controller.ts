import { Response } from 'express';
import { AuthenticatedRequest, writeAuditLog } from '../middlewares/audit.middleware';
import { db } from '../config/db';

export class TicketsController {
  /**
   * Obtener lista de tickets con filtros avanzados
   */
  static async getTickets(req: AuthenticatedRequest, res: Response) {
    try {
      const { departamento, prioridad, estado, solo_mis_tickets, search } = req.query;
      const currentUserId = req.user?.id;

      let query = `
        SELECT 
          t.*,
          uc.nombre as creador_nombre,
          uc.rol as creador_rol,
          ua.nombre as asignado_nombre,
          ua.rol as asignado_rol,
          (SELECT COUNT(*) FROM ticket_comentarios tc WHERE tc.ticket_id = t.id) as total_comentarios
        FROM tickets_corporativos t
        LEFT JOIN usuarios uc ON t.creador_id = uc.id
        LEFT JOIN usuarios ua ON t.asignado_a_id = ua.id
        WHERE t.eliminado_en IS NULL
      `;
      const params: any[] = [];
      let pIdx = 1;

      if (departamento && departamento !== 'Todos') {
        query += ` AND t.departamento = $${pIdx}`;
        params.push(departamento);
        pIdx++;
      }

      if (prioridad && prioridad !== 'Todas') {
        query += ` AND t.prioridad = $${pIdx}`;
        params.push(prioridad);
        pIdx++;
      }

      if (estado && estado !== 'Todos') {
        query += ` AND t.estado = $${pIdx}`;
        params.push(estado);
        pIdx++;
      }

      if (solo_mis_tickets === 'true' && currentUserId) {
        query += ` AND (t.asignado_a_id = $${pIdx} OR t.creador_id = $${pIdx} OR t.stakeholders::text ILIKE $${pIdx + 1})`;
        params.push(currentUserId, `%"id":"${currentUserId}"%`);
        pIdx += 2;
      }

      if (search) {
        query += ` AND (t.titulo ILIKE $${pIdx} OR t.descripcion ILIKE $${pIdx} OR t.id ILIKE $${pIdx})`;
        params.push(`%${search}%`);
        pIdx++;
      }

      query += ` ORDER BY t.fecha_creacion DESC`;

      const result = await db.query(query, params);
      return res.json(result.rows);
    } catch (error: any) {
      console.error('Error al obtener tickets:', error);
      return res.status(500).json({ error: 'Error al consultar tickets corporativos.' });
    }
  }

  /**
   * Obtener un ticket por ID con comentarios y registrar PRIMERA APERTURA (tracking de lectura)
   */
  static async getTicketById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const currentUserId = req.user?.id;

      const ticketRes = await db.query(
        `SELECT 
          t.*,
          uc.nombre as creador_nombre,
          uc.rol as creador_rol,
          ua.nombre as asignado_nombre,
          ua.rol as asignado_rol
        FROM tickets_corporativos t
        LEFT JOIN usuarios uc ON t.creador_id = uc.id
        LEFT JOIN usuarios ua ON t.asignado_a_id = ua.id
        WHERE t.id = $1 AND t.eliminado_en IS NULL`,
        [id]
      );

      if (ticketRes.rows.length === 0) {
        return res.status(404).json({ error: 'Ticket no encontrado.' });
      }

      const ticket = ticketRes.rows[0];

      // TRACKING DE PERFORMANCE: Si quien lo abre es el asignado y aún no tenía fecha de primera lectura
      if (currentUserId && ticket.asignado_a_id === currentUserId && !ticket.primera_lectura_at) {
        const updateReadRes = await db.query(
          `UPDATE tickets_corporativos 
           SET 
             primera_lectura_at = CURRENT_TIMESTAMP,
             minutos_para_abrir = ROUND(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - fecha_creacion)) / 60)::integer
           WHERE id = $1
           RETURNING primera_lectura_at, minutos_para_abrir`,
          [id]
        );

        ticket.primera_lectura_at = updateReadRes.rows[0].primera_lectura_at;
        ticket.minutos_para_abrir = updateReadRes.rows[0].minutos_para_abrir;

        // Marcar notificaciones correspondientes como leídas
        await db.query(
          `UPDATE notificaciones_usuario 
           SET leido = TRUE, fecha_lectura = CURRENT_TIMESTAMP 
           WHERE ticket_id = $1 AND usuario_id = $2`,
          [id, currentUserId]
        );
      }

      // Obtener comentarios
      const commentsRes = await db.query(
        `SELECT c.*, u.nombre as autor_nombre, u.rol as autor_rol
         FROM ticket_comentarios c
         LEFT JOIN usuarios u ON c.usuario_id = u.id
         WHERE c.ticket_id = $1
         ORDER BY c.fecha_creacion ASC`,
        [id]
      );

      return res.json({
        ...ticket,
        comentarios: commentsRes.rows
      });
    } catch (error: any) {
      console.error('Error al obtener detalle del ticket:', error);
      return res.status(500).json({ error: 'Error al consultar detalle del ticket.' });
    }
  }

  /**
   * Crear nuevo ticket de proyecto/intercomunicación
   */
  static async createTicket(req: AuthenticatedRequest, res: Response) {
    try {
      const creadorId = req.user?.id;
      if (!creadorId) {
        return res.status(401).json({ error: 'Usuario no autenticado.' });
      }

      const {
        titulo,
        descripcion,
        departamento,
        prioridad = 'Media',
        deadline,
        asignado_a_id,
        asignados = [],
        stakeholders = [],
        necesita_de = ''
      } = req.body;

      const deptFormatted = Array.isArray(departamento) ? departamento.join(', ') : departamento;
      const primaryAssigneeId = asignado_a_id || (Array.isArray(asignados) && asignados.length > 0 ? (asignados[0]?.id || asignados[0]) : null);

      if (!titulo || !descripcion || !deptFormatted || !deadline || !primaryAssigneeId) {
        return res.status(400).json({ error: 'Título, descripción, departamento, deadline y al menos un usuario asignado son obligatorios.' });
      }

      // Obtener datos del creador para la notificación
      const creadorRes = await db.query('SELECT nombre FROM usuarios WHERE id = $1', [creadorId]);
      const creadorNombre = creadorRes.rows[0]?.nombre || 'Un colega';

      const insertRes = await db.query(
        `INSERT INTO tickets_corporativos (
          titulo,
          descripcion,
          departamento,
          prioridad,
          deadline,
          creador_id,
          asignado_a_id,
          asignados,
          stakeholders,
          necesita_de
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          titulo,
          descripcion,
          deptFormatted,
          prioridad,
          deadline,
          creadorId,
          primaryAssigneeId,
          JSON.stringify(Array.isArray(asignados) && asignados.length > 0 ? asignados : [{ id: primaryAssigneeId }]),
          JSON.stringify(stakeholders),
          necesita_de
        ]
      );

      const nuevoTicket = insertRes.rows[0];

      // Formatear fecha límite amigable
      const deadlineDate = new Date(deadline);
      const deadlineFormatted = `${deadlineDate.toLocaleDateString()} a las ${deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

      // 1. Notificación a todos los asignados
      const allAssigneeIds = new Set<string>();
      if (primaryAssigneeId) allAssigneeIds.add(primaryAssigneeId);
      if (Array.isArray(asignados)) {
        asignados.forEach((a: any) => {
          const id = typeof a === 'string' ? a : a?.id;
          if (id) allAssigneeIds.add(id);
        });
      }

      for (const aId of Array.from(allAssigneeIds)) {
        await db.query(
          `INSERT INTO notificaciones_usuario (
            usuario_id,
            ticket_id,
            remitente_id,
            tipo,
            titulo,
            mensaje
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            aId,
            nuevoTicket.id,
            creadorId,
            'NUEVO_TICKET',
            `Nueva Solicitud: [${prioridad.toUpperCase()}] ${titulo}`,
            `${creadorNombre} te asignó la tarea "${titulo}". Fecha límite requerida: ${deadlineFormatted}.`
          ]
        );
      }

      // 2. Notificación a los Stakeholders (si los hay)
      if (Array.isArray(stakeholders)) {
        for (const st of stakeholders) {
          if (st.id && st.id !== asignado_a_id && st.id !== creadorId) {
            await db.query(
              `INSERT INTO notificaciones_usuario (
                usuario_id,
                ticket_id,
                remitente_id,
                tipo,
                titulo,
                mensaje
              ) VALUES ($1, $2, $3, $4, $5, $6)`,
              [
                st.id,
                nuevoTicket.id,
                creadorId,
                'STAKEHOLDER',
                `Involucrado en Solicitud: ${titulo}`,
                `${creadorNombre} te añadió como stakeholder en la solicitud "${titulo}" (Asignado a: ${st.asignado_nombre || 'un colega'}).`
              ]
            );
          }
        }
      }

      await writeAuditLog({
        userId: creadorId,
        accion: 'CREAR_TICKET_CORPORATIVO',
        tablaAfectada: 'tickets_corporativos',
        registroId: nuevoTicket.id,
        valoresNuevos: nuevoTicket
      });

      return res.status(201).json(nuevoTicket);
    } catch (error: any) {
      console.error('Error al crear ticket:', error);
      return res.status(500).json({ error: 'Error al crear ticket corporativo.' });
    }
  }

  /**
   * Actualizar estado del ticket (En Proceso, Completado, Rechazado)
   */
  static async updateTicketStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { estado } = req.body;
      const userId = req.user?.id;

      if (!['Pendiente', 'En Proceso', 'Completado', 'Rechazado'].includes(estado)) {
        return res.status(400).json({ error: 'Estado inválido.' });
      }

      const ticketRes = await db.query('SELECT * FROM tickets_corporativos WHERE id = $1', [id]);
      if (ticketRes.rows.length === 0) {
        return res.status(404).json({ error: 'Ticket no encontrado.' });
      }
      const ticket = ticketRes.rows[0];

      let updateQuery = `
        UPDATE tickets_corporativos
        SET estado = $1, fecha_actualizacion = CURRENT_TIMESTAMP
      `;
      const params: any[] = [estado];
      let pIdx = 2;

      // Si se marca como completado, calcular tiempos de resolución y cumplimiento de deadline
      if (estado === 'Completado' && ticket.estado !== 'Completado') {
        updateQuery += `,
          completado_at = CURRENT_TIMESTAMP,
          minutos_para_completar = ROUND(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - fecha_creacion)) / 60)::integer,
          cumplio_deadline = (CURRENT_TIMESTAMP <= deadline)
        `;
      }

      updateQuery += ` WHERE id = $${pIdx} RETURNING *`;
      params.push(id);

      const updateRes = await db.query(updateQuery, params);
      const updatedTicket = updateRes.rows[0];

      // Notificar al creador del ticket si es diferente a quien lo actualiza
      if (userId && ticket.creador_id !== userId) {
        const updaterRes = await db.query('SELECT nombre FROM usuarios WHERE id = $1', [userId]);
        const updaterName = updaterRes.rows[0]?.nombre || 'El asignado';

        await db.query(
          `INSERT INTO notificaciones_usuario (
            usuario_id, ticket_id, remitente_id, tipo, titulo, mensaje
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            ticket.creador_id,
            id,
            userId,
            'ESTADO_ACTUALIZADO',
            `Ticket ${estado}: ${ticket.titulo}`,
            `${updaterName} cambió el estado de tu solicitud a "${estado}".`
          ]
        );
      }

      await writeAuditLog({
        userId: userId || null,
        accion: 'ACTUALIZAR_ESTADO_TICKET',
        tablaAfectada: 'tickets_corporativos',
        registroId: id,
        valoresAnteriores: { estado: ticket.estado },
        valoresNuevos: { estado }
      });

      return res.json(updatedTicket);
    } catch (error: any) {
      console.error('Error al actualizar estado de ticket:', error);
      return res.status(500).json({ error: 'Error al actualizar estado del ticket.' });
    }
  }

  /**
   * Agregar comentario al ticket
   */
  static async addComment(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { mensaje } = req.body;
      const userId = req.user?.id;

      if (!userId) return res.status(401).json({ error: 'No autenticado.' });
      if (!mensaje || !mensaje.trim()) {
        return res.status(400).json({ error: 'El mensaje no puede estar vacío.' });
      }

      const ticketRes = await db.query('SELECT * FROM tickets_corporativos WHERE id = $1', [id]);
      if (ticketRes.rows.length === 0) {
        return res.status(404).json({ error: 'Ticket no encontrado.' });
      }
      const ticket = ticketRes.rows[0];

      const insertRes = await db.query(
        `INSERT INTO ticket_comentarios (ticket_id, usuario_id, mensaje)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [id, userId, mensaje.trim()]
      );

      const nuevoComentario = insertRes.rows[0];

      // Datos de quien comentó
      const userRes = await db.query('SELECT nombre, rol FROM usuarios WHERE id = $1', [userId]);
      const autor = userRes.rows[0];

      // Determinar a quién notificar (al creador si comentó el asignado, al asignado si comentó el creador)
      const destinatarioId = (userId === ticket.asignado_a_id) ? ticket.creador_id : ticket.asignado_a_id;

      if (destinatarioId && destinatarioId !== userId) {
        await db.query(
          `INSERT INTO notificaciones_usuario (
            usuario_id, ticket_id, remitente_id, tipo, titulo, mensaje
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            destinatarioId,
            id,
            userId,
            'COMENTARIO',
            `Nuevo mensaje en: ${ticket.titulo}`,
            `${autor.nombre}: "${mensaje.substring(0, 90)}${mensaje.length > 90 ? '...' : ''}"`
          ]
        );
      }

      return res.status(201).json({
        ...nuevoComentario,
        autor_nombre: autor.nombre,
        autor_rol: autor.rol
      });
    } catch (error: any) {
      console.error('Error al agregar comentario:', error);
      return res.status(500).json({ error: 'Error al agregar comentario.' });
    }
  }

  /**
   * Eliminar un ticket (Soft Delete para Admin o Creador)
   */
  static async deleteTicket(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.rol;

    try {
      const ticketRes = await db.query('SELECT * FROM tickets_corporativos WHERE id = $1 AND eliminado_en IS NULL', [id]);
      if (ticketRes.rows.length === 0) {
        return res.status(404).json({ error: 'Ticket corporativo no encontrado o ya eliminado.' });
      }

      const oldTicket = ticketRes.rows[0];

      // Solo el Administrador o el creador del ticket pueden eliminarlo
      if (userRole !== 'Administrador' && oldTicket.creador_id !== userId) {
        return res.status(403).json({ error: 'Solo el Administrador o el creador del ticket pueden eliminarlo.' });
      }

      await db.query(
        'UPDATE tickets_corporativos SET eliminado_en = CURRENT_TIMESTAMP, eliminado_por = $1 WHERE id = $2',
        [userId || null, id]
      );

      await writeAuditLog({
        userId: userId || null,
        accion: 'ELIMINAR_TICKET',
        tablaAfectada: 'tickets_corporativos',
        registroId: id,
        valoresAnteriores: oldTicket,
        valoresNuevos: { eliminado_en: new Date().toISOString(), eliminado_por: userId }
      });

      return res.json({ message: 'Ticket corporativo eliminado correctamente del sistema.' });
    } catch (error: any) {
      console.error('Error al eliminar ticket:', error);
      return res.status(500).json({ error: 'Error al eliminar ticket corporativo.' });
    }
  }
}
