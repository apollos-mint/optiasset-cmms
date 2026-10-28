import { Response } from 'express';
import { AuthenticatedRequest, writeAuditLog } from '../middlewares/audit.middleware';
import { db } from '../config/db';

export class PerformanceController {
  /**
   * Obtener métricas consolidadas de rendimiento por empleado (Solo Administración)
   */
  static async getEmployeePerformanceStats(req: AuthenticatedRequest, res: Response) {
    try {
      // 1. Obtener todos los usuarios activos excepto los puramente externos si los hay
      const usersRes = await db.query(
        `SELECT id, nombre, nombre_usuario, rol, activo, fecha_creacion
         FROM usuarios 
         WHERE activo = TRUE
         ORDER BY nombre ASC`
      );

      const users = usersRes.rows;

      // 2. Para cada usuario, calcular métricas de tickets corporativos y warnings
      const stats = await Promise.all(
        users.map(async (u) => {
          const ticketsRes = await db.query(
            `SELECT 
              COUNT(*) as total_asignados,
              COUNT(*) FILTER (WHERE estado = 'Completado') as completados,
              COUNT(*) FILTER (WHERE estado = 'Pendiente' OR estado = 'En Proceso') as pendientes,
              COUNT(*) FILTER (WHERE (estado = 'Completado' AND cumplio_deadline = TRUE)) as a_tiempo,
              COUNT(*) FILTER (WHERE (estado = 'Completado' AND cumplio_deadline = FALSE) OR (estado != 'Completado' AND deadline < CURRENT_TIMESTAMP)) as vencidos,
              AVG(minutos_para_abrir) as avg_minutos_abrir,
              AVG(minutos_para_completar) as avg_minutos_completar,
              MIN(minutos_para_abrir) as min_minutos_abrir,
              MAX(minutos_para_abrir) as max_minutos_abrir
            FROM tickets_corporativos 
            WHERE asignado_a_id = $1`,
            [u.id]
          );

          const tData = ticketsRes.rows[0];
          const totalAsignados = parseInt(tData.total_asignados || '0', 10);
          const completados = parseInt(tData.completados || '0', 10);
          const pendientes = parseInt(tData.pendientes || '0', 10);
          const aTiempo = parseInt(tData.a_tiempo || '0', 10);
          const vencidos = parseInt(tData.vencidos || '0', 10);

          const avgMinutosAbrir = tData.avg_minutos_abrir ? Math.round(parseFloat(tData.avg_minutos_abrir)) : null;
          const avgMinutosCompletar = tData.avg_minutos_completar ? Math.round(parseFloat(tData.avg_minutos_completar)) : null;

          // Warnings e incentivos
          const warningsRes = await db.query(
            `SELECT 
              COUNT(*) FILTER (WHERE tipo != 'Incentivo / Mérito') as warnings_count,
              COUNT(*) FILTER (WHERE tipo = 'Incentivo / Mérito') as incentivos_count
             FROM warnings_empleados
             WHERE empleado_id = $1`,
            [u.id]
          );

          const warningsCount = parseInt(warningsRes.rows[0]?.warnings_count || '0', 10);
          const incentivosCount = parseInt(warningsRes.rows[0]?.incentivos_count || '0', 10);

          // Tasa de cumplimiento de deadline
          let tasaCumplimiento = 100;
          if (completados > 0) {
            tasaCumplimiento = Math.round((aTiempo / completados) * 100);
          } else if (vencidos > 0) {
            tasaCumplimiento = 0;
          }

          // Algoritmo de Score de Eficiencia (0 - 100)
          let score = 85; // Base estándar

          // Penalización por lentitud en abrir mensajes
          if (avgMinutosAbrir !== null) {
            if (avgMinutosAbrir > 480) { // más de 8 horas
              score -= 25;
            } else if (avgMinutosAbrir > 180) { // más de 3 horas
              score -= 15;
            } else if (avgMinutosAbrir > 60) { // más de 1 hora
              score -= 5;
            } else if (avgMinutosAbrir < 15) { // menos de 15 minutos (rápido)
              score += 5;
            }
          }

          // Penalización por tareas vencidas o fuera de plazo
          if (totalAsignados > 0) {
            const porcentajeVencidas = (vencidos / totalAsignados) * 100;
            if (porcentajeVencidas > 40) {
              score -= 25;
            } else if (porcentajeVencidas > 20) {
              score -= 15;
            } else if (porcentajeVencidas === 0 && completados > 0) {
              score += 10;
            }
          }

          // Impacto de amonestaciones y reconocimientos
          score -= (warningsCount * 12);
          score += (incentivosCount * 10);

          // Limitar entre 5 y 100
          score = Math.max(5, Math.min(100, Math.round(score)));

          // Dictamen analítico para toma de decisiones empresariales
          let recomendacion = 'Rendimiento Aceptable - Mantener Supervisión Habitual';
          let estadoSemaforo: 'Optimo' | 'Observacion' | 'Critico' = 'Optimo';

          if (score >= 88) {
            recomendacion = '⭐ Excelente Desempeño - Candidato a Reconocimiento / Bonificación';
            estadoSemaforo = 'Optimo';
          } else if (score >= 65) {
            recomendacion = '👍 Cumplimiento Regular - Mantener Supervisión Habitual';
            estadoSemaforo = 'Optimo';
          } else if (score >= 45) {
            recomendacion = '⚠️ En Observación - Requiere Llamado de Atención o Formación';
            estadoSemaforo = 'Observacion';
          } else {
            recomendacion = '🚨 Desempeño Crítico - Evaluar Desvinculación o Sanción Formal';
            estadoSemaforo = 'Critico';
          }

          return {
            usuario_id: u.id,
            nombre: u.nombre,
            nombre_usuario: u.nombre_usuario,
            rol: u.rol,
            total_asignados: totalAsignados,
            completados,
            pendientes,
            a_tiempo: aTiempo,
            vencidos,
            avg_minutos_abrir: avgMinutosAbrir,
            avg_minutos_completar: avgMinutosCompletar,
            tasa_cumplimiento: tasaCumplimiento,
            warnings_count: warningsCount,
            incentivos_count: incentivosCount,
            score_eficiencia: score,
            recomendacion,
            estado_semaforo: estadoSemaforo
          };
        })
      );

      return res.json(stats);
    } catch (error: any) {
      console.error('Error al calcular estadísticas de rendimiento:', error);
      return res.status(500).json({ error: 'Error al consultar métricas de rendimiento del personal.' });
    }
  }

  /**
   * Registrar un warning, queja o reconocimiento (Solo Administración)
   */
  static async createWarning(req: AuthenticatedRequest, res: Response) {
    try {
      const emisorId = req.user?.id;
      const { empleado_id, tipo, motivo, acciones_requeridas, ticket_id } = req.body;

      if (!empleado_id || !tipo || !motivo) {
        return res.status(400).json({ error: 'Empleado, tipo de evaluación y motivo son obligatorios.' });
      }

      const insertRes = await db.query(
        `INSERT INTO warnings_empleados (
          empleado_id, emisor_id, ticket_id, tipo, motivo, acciones_requeridas
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [empleado_id, emisorId, ticket_id || null, tipo, motivo, acciones_requeridas || null]
      );

      const nuevoWarning = insertRes.rows[0];

      // Notificar al empleado
      const esIncentivo = tipo === 'Incentivo / Mérito';
      const tituloNotif = esIncentivo
        ? `🌟 ¡Felicitaciones! Has recibido un Reconocimiento`
        : `⚠️ Notificación Disciplinaria de Administración: ${tipo}`;

      const mensajeNotif = esIncentivo
        ? `Se ha registrado una nota de mérito en tu expediente: "${motivo}"`
        : `Se ha emitido un ${tipo} a tu atención: "${motivo}". Revisa las acciones requeridas.`;

      await db.query(
        `INSERT INTO notificaciones_usuario (
          usuario_id, remitente_id, tipo, titulo, mensaje
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
          empleado_id,
          emisorId,
          esIncentivo ? 'INCENTIVO' : 'WARNING',
          tituloNotif,
          mensajeNotif
        ]
      );

      await writeAuditLog({
        userId: emisorId || null,
        accion: esIncentivo ? 'EMITIR_INCENTIVO_EMPLEADO' : 'EMITIR_WARNING_EMPLEADO',
        tablaAfectada: 'warnings_empleados',
        registroId: nuevoWarning.id.toString(),
        valoresNuevos: nuevoWarning
      });

      return res.status(201).json(nuevoWarning);
    } catch (error: any) {
      console.error('Error al registrar warning:', error);
      return res.status(500).json({ error: 'Error al emitir evaluación/warning.' });
    }
  }

  /**
   * Obtener listado histórico de warnings y quejas
   */
  static async getWarningsList(req: AuthenticatedRequest, res: Response) {
    try {
      const { empleado_id } = req.query;
      let query = `
        SELECT 
          w.*,
          ue.nombre as empleado_nombre,
          ue.rol as empleado_rol,
          um.nombre as emisor_nombre,
          t.titulo as ticket_titulo
        FROM warnings_empleados w
        JOIN usuarios ue ON w.empleado_id = ue.id
        LEFT JOIN usuarios um ON w.emisor_id = um.id
        LEFT JOIN tickets_corporativos t ON w.ticket_id = t.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (empleado_id) {
        query += ` AND w.empleado_id = $1`;
        params.push(empleado_id);
      }

      query += ` ORDER BY w.fecha_creacion DESC LIMIT 100`;

      const result = await db.query(query, params);
      return res.json(result.rows);
    } catch (error: any) {
      console.error('Error al listar warnings:', error);
      return res.status(500).json({ error: 'Error al consultar historial disciplinario.' });
    }
  }
}
