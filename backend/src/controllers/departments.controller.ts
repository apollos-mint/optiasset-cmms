import { Response } from 'express';
import { db } from '../config/db';
import { AuthenticatedRequest, writeAuditLog } from '../middlewares/audit.middleware';

export class DepartmentsController {
  /**
   * Obtener todos los departamentos con conteo de usuarios y usuarios asignados
   */
  static async getDepartments(req: AuthenticatedRequest, res: Response) {
    try {
      const result = await db.query(`
        SELECT d.id, d.nombre, d.descripcion, d.permisos, d.creado_en,
               COUNT(u.id)::int AS total_usuarios,
               COALESCE(
                 json_agg(
                   json_build_object(
                     'id', u.id, 
                     'nombre', u.nombre, 
                     'nombre_usuario', u.nombre_usuario, 
                     'rol', u.rol, 
                     'activo', u.activo
                   )
                 ) FILTER (WHERE u.id IS NOT NULL), '[]'::json
               ) AS usuarios
        FROM departamentos d
        LEFT JOIN usuarios u ON (u.departamento_id = d.id OR (u.departamento_id IS NULL AND LOWER(TRIM(u.departamento)) = LOWER(TRIM(d.nombre))))
        GROUP BY d.id
        ORDER BY d.nombre ASC
      `);

      return res.json(result.rows);
    } catch (error) {
      console.error('Error al obtener departamentos:', error);
      return res.status(500).json({ error: 'Error interno al consultar departamentos.' });
    }
  }

  /**
   * Crear un nuevo departamento con matriz de permisos por módulo
   */
  static async createDepartment(req: AuthenticatedRequest, res: Response) {
    const { nombre, descripcion, permisos } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre del departamento es obligatorio.' });
    }

    const cleanNombre = nombre.trim();

    try {
      const existing = await db.query('SELECT id FROM departamentos WHERE LOWER(TRIM(nombre)) = LOWER(TRIM($1))', [cleanNombre]);
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'Ya existe un departamento con ese nombre.' });
      }

      const result = await db.query(
        `INSERT INTO departamentos (nombre, descripcion, permisos)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [cleanNombre, descripcion ? descripcion.trim() : null, JSON.stringify(permisos || {})]
      );

      const newDept = result.rows[0];

      await writeAuditLog({
        userId: req.user?.id || null,
        accion: 'CREAR_DEPARTAMENTO',
        tablaAfectada: 'departamentos',
        registroId: newDept.id.toString(),
        valoresNuevos: newDept
      });

      return res.status(201).json({
        ...newDept,
        total_usuarios: 0,
        usuarios: []
      });
    } catch (error) {
      console.error('Error al crear departamento:', error);
      return res.status(500).json({ error: 'Error interno al crear el departamento.' });
    }
  }

  /**
   * Actualizar departamento (nombre, descripción, permisos de módulos)
   */
  static async updateDepartment(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const { nombre, descripcion, permisos, aplicar_a_usuarios } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre del departamento es obligatorio.' });
    }

    const cleanNombre = nombre.trim();

    try {
      const checkRes = await db.query('SELECT * FROM departamentos WHERE id = $1', [id]);
      if (checkRes.rows.length === 0) {
        return res.status(404).json({ error: 'Departamento no encontrado.' });
      }

      const oldDept = checkRes.rows[0];

      // Verificar unicidad de nombre si cambió
      if (LOWER_EQ(oldDept.nombre, cleanNombre) === false) {
        const dupRes = await db.query('SELECT id FROM departamentos WHERE LOWER(TRIM(nombre)) = LOWER(TRIM($1)) AND id != $2', [cleanNombre, id]);
        if (dupRes.rows.length > 0) {
          return res.status(400).json({ error: 'Ya existe otro departamento con ese nombre.' });
        }
      }

      const result = await db.query(
        `UPDATE departamentos
         SET nombre = $1, descripcion = $2, permisos = $3
         WHERE id = $4
         RETURNING *`,
        [cleanNombre, descripcion !== undefined ? (descripcion ? descripcion.trim() : null) : oldDept.descripcion, JSON.stringify(permisos || oldDept.permisos), id]
      );

      const updatedDept = result.rows[0];

      // Sincronizar nombre en la tabla usuarios
      await db.query('UPDATE usuarios SET departamento = $1 WHERE departamento_id = $2', [cleanNombre, id]);

      // Si el administrador marcó aplicar permisos a los usuarios existentes del departamento
      const shouldPropagate = aplicar_a_usuarios || req.body.propagar_a_usuarios;
      if (shouldPropagate) {
        await db.query(
          `UPDATE usuarios
           SET permisos = $1
           WHERE departamento_id = $2`,
          [JSON.stringify(permisos || {}), id]
        );
      }

      await writeAuditLog({
        userId: req.user?.id || null,
        accion: 'MODIFICAR_DEPARTAMENTO',
        tablaAfectada: 'departamentos',
        registroId: id,
        valoresAnteriores: oldDept,
        valoresNuevos: updatedDept
      });

      return res.json(updatedDept);
    } catch (error) {
      console.error('Error al actualizar departamento:', error);
      return res.status(500).json({ error: 'Error interno al actualizar el departamento.' });
    }
  }

  /**
   * Eliminar departamento (desvincula usuarios de forma segura)
   */
  static async deleteDepartment(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;

    try {
      const checkRes = await db.query('SELECT * FROM departamentos WHERE id = $1', [id]);
      if (checkRes.rows.length === 0) {
        return res.status(404).json({ error: 'Departamento no encontrado.' });
      }

      const dept = checkRes.rows[0];

      // Desvincular usuarios asociados sin borrarlos
      await db.query('UPDATE usuarios SET departamento_id = NULL, departamento = NULL WHERE departamento_id = $1', [id]);

      // Borrar departamento
      await db.query('DELETE FROM departamentos WHERE id = $1', [id]);

      await writeAuditLog({
        userId: req.user?.id || null,
        accion: 'ELIMINAR_DEPARTAMENTO',
        tablaAfectada: 'departamentos',
        registroId: id,
        valoresAnteriores: dept
      });

      return res.json({ message: 'Departamento eliminado y usuarios desvinculados exitosamente.' });
    } catch (error) {
      console.error('Error al eliminar departamento:', error);
      return res.status(500).json({ error: 'Error interno al eliminar el departamento.' });
    }
  }

  /**
   * Asignar usuarios a un departamento
   */
  static async assignUsersToDepartment(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const userIds = req.body.userIds || req.body.usuario_ids; // array de IDs de usuarios

    if (!Array.isArray(userIds)) {
      return res.status(400).json({ error: 'Se requiere una lista de identificadores de usuario (userIds o usuario_ids).' });
    }

    try {
      const deptRes = await db.query('SELECT id, nombre, permisos FROM departamentos WHERE id = $1', [id]);
      if (deptRes.rows.length === 0) {
        return res.status(404).json({ error: 'Departamento no encontrado.' });
      }

      const dept = deptRes.rows[0];

      // Desvincular usuarios que ya no estén en la lista para este departamento
      await db.query(
        `UPDATE usuarios 
         SET departamento_id = NULL, departamento = NULL 
         WHERE departamento_id = $1 AND NOT (id = ANY($2::uuid[]))`,
        [id, userIds]
      );

      // Asignar los nuevos usuarios
      if (userIds.length > 0) {
        await db.query(
          `UPDATE usuarios 
           SET departamento_id = $1, departamento = $2
           WHERE id = ANY($3::uuid[])`,
          [id, dept.nombre, userIds]
        );
      }

      await writeAuditLog({
        userId: req.user?.id || null,
        accion: 'ASIGNAR_USUARIOS_DEPARTAMENTO',
        tablaAfectada: 'departamentos',
        registroId: id,
        valoresNuevos: { departamento: dept.nombre, userIds }
      });

      return res.json({ 
        message: `Usuarios asignados con éxito al departamento ${dept.nombre}.`,
        departamento_id: Number(id),
        total_asignados: userIds.length 
      });
    } catch (error) {
      console.error('Error al asignar usuarios al departamento:', error);
      return res.status(500).json({ error: 'Error interno al asignar usuarios.' });
    }
  }
}

function LOWER_EQ(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}
