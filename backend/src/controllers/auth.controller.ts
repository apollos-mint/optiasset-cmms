import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/db';
import { AuthenticatedRequest, writeAuditLog } from '../middlewares/audit.middleware';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secure-enterprise-jwt-key';

export class AuthController {
  
  /**
   * User login endpoint generating session token
   */
  static async login(req: AuthenticatedRequest, res: Response) {
    const { nombre_usuario, contrasena } = req.body;

    if (!nombre_usuario || !contrasena) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos.' });
    }

    try {
      const userRes = await db.query(
        `SELECT u.*, COALESCE(u.permisos, r.permisos) AS permisos 
         FROM usuarios u 
         LEFT JOIN roles r ON u.rol = r.nombre
         WHERE u.nombre_usuario = $1`,
        [nombre_usuario]
      );

      if (userRes.rows.length === 0) {
        return res.status(401).json({ error: 'Credenciales inválidas.' });
      }

      const user = userRes.rows[0];

      if (!user.activo) {
        return res.status(403).json({ error: 'Esta cuenta ha sido desactivada. Consulte al administrador.' });
      }

      const isPasswordValid = await bcrypt.compare(contrasena, user.contrasena_hash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Credenciales inválidas.' });
      }

      const token = jwt.sign(
        { id: user.id, nombre_usuario: user.nombre_usuario, rol: user.rol },
        JWT_SECRET,
        { expiresIn: '8h' }
      );

      // Escribir log inmutable de login
      await writeAuditLog({
        userId: user.id,
        accion: 'INICIO_SESION',
        tablaAfectada: 'usuarios',
        registroId: user.id
      });

      return res.json({
        token,
        usuario: {
          id: user.id,
          nombre: user.nombre,
          nombre_usuario: user.nombre_usuario,
          rol: user.rol,
          departamento: user.departamento || null,
          cargo: user.cargo || null,
          cumpleanos: user.cumpleanos || null,
          foto_perfil: user.foto_perfil || null,
          permisos: user.permisos || {}
        }
      });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: 'Error del servidor durante el login.' });
    }
  }

  /**
   * Get authenticated user profile and fresh permissions
   */
  static async getMe(req: AuthenticatedRequest, res: Response) {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Usuario no autenticado.' });
    }

    try {
      const userRes = await db.query(
        `SELECT u.id, u.nombre, u.nombre_usuario, u.rol, u.activo, u.foto_perfil,
                COALESCE(u.departamento, d.nombre) AS departamento,
                u.departamento_id, u.cargo, u.cumpleanos,
                COALESCE(u.permisos, d.permisos, r.permisos) AS permisos,
                d.permisos AS dept_permisos,
                r.permisos AS role_permisos
         FROM usuarios u
         LEFT JOIN roles r ON u.rol = r.nombre
         LEFT JOIN departamentos d ON (u.departamento_id = d.id OR (u.departamento_id IS NULL AND LOWER(TRIM(u.departamento)) = LOWER(TRIM(d.nombre))))
         WHERE u.id = $1`,
        [req.user.id]
      );

      if (userRes.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado.' });
      }

      const user = userRes.rows[0];
      if (!user.activo) {
        return res.status(403).json({ error: 'Cuenta inactiva.' });
      }

      // Fusionar permisos: rol base -> departamento default -> personalizaciones del usuario
      const mergedPermisos = {
        ...(user.role_permisos || {}),
        ...(user.dept_permisos || {}),
        ...(user.permisos || {})
      };

      return res.json({
        id: user.id,
        nombre: user.nombre,
        nombre_usuario: user.nombre_usuario,
        rol: user.rol,
        foto_perfil: user.foto_perfil || null,
        departamento: user.departamento || null,
        departamento_id: user.departamento_id || null,
        cargo: user.cargo || null,
        cumpleanos: user.cumpleanos || null,
        permisos: mergedPermisos
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error al obtener datos de perfil.' });
    }
  }

  /**
   * Update current user avatar / profile picture
   */
  static async updateAvatar(req: AuthenticatedRequest, res: Response) {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Usuario no autenticado.' });
    }

    const { foto_perfil } = req.body;

    try {
      await db.query('UPDATE usuarios SET foto_perfil = $1 WHERE id = $2', [foto_perfil || null, req.user.id]);

      await writeAuditLog({
        userId: req.user.id,
        accion: 'ACTUALIZAR_AVATAR',
        tablaAfectada: 'usuarios',
        registroId: req.user.id,
        valoresNuevos: { foto_perfil: foto_perfil ? '[IMAGEN_ACTUALIZADA]' : null }
      });

      return res.json({
        message: 'Foto de perfil actualizada correctamente.',
        foto_perfil: foto_perfil || null
      });
    } catch (error) {
      console.error('Error al actualizar avatar:', error);
      return res.status(500).json({ error: 'Error interno al actualizar la foto de perfil.' });
    }
  }

  /**
   * Get all users (Authenticated company members)
   */
  static async getUsers(req: AuthenticatedRequest, res: Response) {
    try {
      const isAdmin = req.user?.rol === 'Administrador' || req.user?.rol === 'Administrador de Sistema';
      const usersRes = await db.query(
        `SELECT u.id, u.nombre, u.nombre_usuario, u.rol, u.activo,
                ${isAdmin ? 'u.contrasena_plana,' : "'' AS contrasena_plana,"}
                u.fecha_creacion, u.foto_perfil,
                COALESCE(u.departamento, d.nombre) AS departamento,
                u.departamento_id, u.cargo, u.cumpleanos,
                COALESCE(u.permisos, d.permisos, r.permisos) AS permisos
         FROM usuarios u
         LEFT JOIN roles r ON u.rol = r.nombre
         LEFT JOIN departamentos d ON (u.departamento_id = d.id OR (u.departamento_id IS NULL AND LOWER(TRIM(u.departamento)) = LOWER(TRIM(d.nombre))))
         ORDER BY LOWER(u.nombre) DESC`
      );
      return res.json(usersRes.rows);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error al obtener usuarios.' });
    }
  }

  /**
   * Create a new employee account (Admin only)
   */
  static async createUser(req: AuthenticatedRequest, res: Response) {
    const { nombre, nombre_usuario, contrasena, rol, departamento, departamento_id, permisos } = req.body;

    if (!nombre || !nombre_usuario || !contrasena || !rol) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    try {
      const existingUser = await db.query('SELECT id FROM usuarios WHERE nombre_usuario = $1', [nombre_usuario]);
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'El nombre de usuario ya está registrado.' });
      }

      let finalDeptId = departamento_id ? Number(departamento_id) : null;
      let finalDeptName = departamento ? departamento.trim() : null;

      if (finalDeptId && !finalDeptName) {
        const dRes = await db.query('SELECT nombre FROM departamentos WHERE id = $1', [finalDeptId]);
        finalDeptName = dRes.rows[0]?.nombre || null;
      } else if (!finalDeptId && finalDeptName) {
        const dRes = await db.query('SELECT id FROM departamentos WHERE LOWER(TRIM(nombre)) = LOWER(TRIM($1))', [finalDeptName]);
        finalDeptId = dRes.rows[0]?.id || null;
      }

      let finalPermisos = permisos;
      if (!finalPermisos || Object.keys(finalPermisos).length === 0) {
        if (finalDeptId) {
          const deptRes = await db.query('SELECT permisos FROM departamentos WHERE id = $1', [finalDeptId]);
          finalPermisos = deptRes.rows[0]?.permisos || {};
        }
        if (!finalPermisos || Object.keys(finalPermisos).length === 0) {
          const roleRes = await db.query('SELECT permisos FROM roles WHERE nombre = $1', [rol]);
          finalPermisos = roleRes.rows[0]?.permisos || {};
        }
      }

      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(contrasena, salt);

      const insertRes = await db.query(
        `INSERT INTO usuarios (nombre, nombre_usuario, contrasena_hash, contrasena_plana, rol, departamento, departamento_id, permisos) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         RETURNING id, nombre, nombre_usuario, rol, departamento, departamento_id, activo, permisos, contrasena_plana`,
        [nombre, nombre_usuario, hash, contrasena, rol, finalDeptName, finalDeptId, JSON.stringify(finalPermisos)]
      );

      const newUser = insertRes.rows[0];

      // Auditoría inmutable de la firma del administrador
      await writeAuditLog({
        userId: req.user?.id || null,
        accion: 'CREAR_USUARIO',
        tablaAfectada: 'usuarios',
        registroId: newUser.id,
        valoresNuevos: { nombre, nombre_usuario, rol, departamento: finalDeptName, permisos: finalPermisos }
      });

      return res.status(201).json(newUser);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error al crear el usuario.' });
    }
  }

  /**
   * Edit user details (Admin only)
   */
  static async updateUser(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const { nombre, rol, departamento, departamento_id, permisos, contrasena } = req.body;

    try {
      const oldUserRes = await db.query('SELECT nombre, rol, departamento, departamento_id, permisos, contrasena_plana FROM usuarios WHERE id = $1', [id]);
      if (oldUserRes.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado.' });
      }

      const oldUser = oldUserRes.rows[0];

      let finalDeptId = departamento_id !== undefined ? (departamento_id ? Number(departamento_id) : null) : oldUser.departamento_id;
      let finalDeptName = departamento !== undefined ? (departamento ? departamento.trim() : null) : oldUser.departamento;

      if (finalDeptId && !finalDeptName) {
        const dRes = await db.query('SELECT nombre FROM departamentos WHERE id = $1', [finalDeptId]);
        finalDeptName = dRes.rows[0]?.nombre || null;
      } else if (finalDeptName && !finalDeptId) {
        const dRes = await db.query('SELECT id FROM departamentos WHERE LOWER(TRIM(nombre)) = LOWER(TRIM($1))', [finalDeptName]);
        finalDeptId = dRes.rows[0]?.id || null;
      }

      let query = 'UPDATE usuarios SET nombre = $1, rol = $2, departamento = $3, departamento_id = $4, permisos = $5';
      const params: any[] = [nombre, rol, finalDeptName, finalDeptId, JSON.stringify(permisos || {})];

      if (contrasena) {
        query += `, contrasena_hash = $${params.length + 1}, contrasena_plana = $${params.length + 2}`;
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(contrasena, salt);
        params.push(hash, contrasena);
      }

      query += ` WHERE id = $${params.length + 1}`;
      params.push(id);

      await db.query(query, params);

      await writeAuditLog({
        userId: req.user?.id || null,
        accion: 'MODIFICAR_USUARIO',
        tablaAfectada: 'usuarios',
        registroId: id,
        valoresAnteriores: oldUser,
        valoresNuevos: { nombre, rol, departamento: finalDeptName, permisos, contrasena: contrasena ? '********' : undefined }
      });

      return res.json({ message: 'Usuario actualizado correctamente.' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error al actualizar el usuario.' });
    }
  }

  /**
   * Toggle active/inactive status of an employee account (Admin only)
   */
  static async toggleUserStatus(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const { activo } = req.body;

    if (activo === undefined) {
      return res.status(400).json({ error: 'El estado de activación es requerido.' });
    }

    try {
      const userRes = await db.query('SELECT activo FROM usuarios WHERE id = $1', [id]);
      if (userRes.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado.' });
      }

      await db.query('UPDATE usuarios SET activo = $1 WHERE id = $2', [activo, id]);

      await writeAuditLog({
        userId: req.user?.id || null,
        accion: activo ? 'ACTIVAR_USUARIO' : 'DESACTIVAR_USUARIO',
        tablaAfectada: 'usuarios',
        registroId: id
      });

      return res.json({ message: `Usuario ${activo ? 'activado' : 'desactivado'} con éxito.` });
    } catch (error) {
      return res.status(500).json({ error: 'Error al cambiar estado del usuario.' });
    }
  }

  /**
   * Physically delete user or fall back to deactivation if operational dependencies exist
   */
  static async deleteUser(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;

    if (id === req.user?.id) {
      return res.status(400).json({ error: 'No puede eliminarse a sí mismo de la sesión activa.' });
    }

    try {
      // Intentar borrado físico
      await db.query('DELETE FROM usuarios WHERE id = $1', [id]);

      await writeAuditLog({
        userId: req.user?.id || null,
        accion: 'ELIMINAR_USUARIO_FISICO',
        tablaAfectada: 'usuarios',
        registroId: id
      });

      return res.json({ message: 'Usuario eliminado permanentemente del sistema.' });
    } catch (error: any) {
      // Si falla por FK (código 23503 en Postgres)
      if (error.code === '23503') {
        // Ejecutar deactivación automática en su lugar
        await db.query('UPDATE usuarios SET activo = FALSE WHERE id = $1', [id]);

        await writeAuditLog({
          userId: req.user?.id || null,
          accion: 'DESACTIVAR_USUARIO_FORZADO',
          tablaAfectada: 'usuarios',
          registroId: id
        });

        return res.json({ 
          warning: true,
          message: 'El empleado posee firmas operativas históricas y no puede ser borrado físicamente. Su cuenta ha sido desactivada en su lugar.' 
        });
      }
      
      console.error(error);
      return res.status(500).json({ error: 'Error al intentar eliminar el usuario.' });
    }
  }

  /**
   * Fetch all roles (Admin only)
   */
  static async getRoles(req: AuthenticatedRequest, res: Response) {
    try {
      const result = await db.query('SELECT * FROM roles ORDER BY nombre ASC');
      return res.json(result.rows);
    } catch (error) {
      return res.status(500).json({ error: 'Error al obtener los roles.' });
    }
  }

  /**
   * Create a new role with permissions (Admin only)
   */
  static async createRole(req: AuthenticatedRequest, res: Response) {
    const { nombre, permisos } = req.body;
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre del rol es obligatorio.' });
    }

    try {
      const existing = await db.query('SELECT id FROM roles WHERE nombre = $1', [nombre]);
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'Ya existe un rol con ese nombre.' });
      }

      const result = await db.query(
        `INSERT INTO roles (nombre, permisos) 
         VALUES ($1, $2) RETURNING *`,
        [nombre, JSON.stringify(permisos || {})]
      );

      await writeAuditLog({
        userId: req.user?.id || null,
        accion: 'CREAR_ROL',
        tablaAfectada: 'roles',
        registroId: result.rows[0].id.toString(),
        valoresNuevos: result.rows[0]
      });

      return res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error al crear el rol.' });
    }
  }

  /**
   * Update role permissions and/or name (Admin only)
   */
  static async updateRole(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const { nombre, permisos } = req.body;

    try {
      const oldRes = await db.query('SELECT * FROM roles WHERE id = $1', [id]);
      if (oldRes.rows.length === 0) {
        return res.status(404).json({ error: 'Rol no encontrado.' });
      }
      const oldRole = oldRes.rows[0];

      // Allow changing the name of any role, including 'Administrador'
      const finalNombre = nombre || oldRole.nombre;

      const result = await db.query(
        `UPDATE roles 
         SET nombre = $1, permisos = $2 
         WHERE id = $3 RETURNING *`,
        [finalNombre, JSON.stringify(permisos || oldRole.permisos), id]
      );

      // Propagate the role name change to all associated users
      if (oldRole.nombre !== finalNombre) {
        await db.query('UPDATE usuarios SET rol = $1 WHERE rol = $2', [finalNombre, oldRole.nombre]);
      }

      await writeAuditLog({
        userId: req.user?.id || null,
        accion: 'MODIFICAR_ROL',
        tablaAfectada: 'roles',
        registroId: id,
        valoresAnteriores: oldRole,
        valoresNuevos: result.rows[0]
      });

      return res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error al actualizar el rol.' });
    }
  }

  /**
   * Delete a role (Admin only)
   */
  static async deleteRole(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;

    try {
      const checkRes = await db.query('SELECT * FROM roles WHERE id = $1', [id]);
      if (checkRes.rows.length === 0) {
        return res.status(404).json({ error: 'Rol no encontrado.' });
      }
      const role = checkRes.rows[0];

      if (role.nombre === 'Administrador' || id === '1' || role.id === 1) {
        return res.status(400).json({ error: 'No se puede eliminar el rol principal de Administrador del sistema.' });
      }

      await db.query('DELETE FROM roles WHERE id = $1', [id]);

      await writeAuditLog({
        userId: req.user?.id || null,
        accion: 'ELIMINAR_ROL',
        tablaAfectada: 'roles',
        registroId: id,
        valoresAnteriores: role
      });

      return res.json({ message: 'Rol eliminado con éxito.' });
    } catch (error: any) {
      if (error.code === '23503') {
        return res.status(400).json({ error: 'No se puede eliminar este rol porque existen usuarios asignados a él.' });
      }
      return res.status(500).json({ error: 'Error al eliminar el rol.' });
    }
  }
}
