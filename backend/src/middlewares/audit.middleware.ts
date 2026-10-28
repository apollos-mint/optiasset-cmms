import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../config/db';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secure-enterprise-jwt-key';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    nombre_usuario: string;
    rol: string;
  };
}

/**
 * Express middleware to authenticate requests using JWT
 */
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. Faltas credenciales de sesión.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado.' });
    }
    req.user = decoded as AuthenticatedRequest['user'];
    next();
  });
}

/**
 * Middleware that populates req.user if token is present, but doesn't block if missing
 */
export function optionalAuthenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (!err && decoded) {
      req.user = decoded as AuthenticatedRequest['user'];
    }
    next();
  });
}

/**
 * Middleware to restrict route access by role
 */
export function requireRole(allowedRoles: string[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado.' });
    }

    // Si el rol del administrador principal ha sido renombrado, podemos verificar 
    // dinámicamente si el rol del usuario posee permisos de gestión de usuarios ('acceder_usuarios')
    if (allowedRoles.includes('Administrador')) {
      try {
        const result = await db.query(
          `SELECT u.permisos, r.permisos AS role_permisos 
           FROM usuarios u 
           JOIN roles r ON u.rol = r.nombre 
           WHERE u.id = $1`,
          [req.user.id]
        );
        if (result.rows.length > 0) {
          const userPerms = result.rows[0].permisos || {};
          const rolePerms = result.rows[0].role_permisos || {};
          if (userPerms.acceder_usuarios === true || rolePerms.acceder_usuarios === true) {
            return next();
          }
        }
      } catch (err) {
        console.error('Error al verificar privilegios de rol dinámico:', err);
      }
    }

    if (!allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({ 
        error: `Acceso restringido. Su rol '${req.user.rol}' no tiene permisos para esta acción.` 
      });
    }

    next();
  };
}

/**
 * Writes an immutable audit log record to the database.
 * This represents the digital signature of the action.
 */
export async function writeAuditLog(params: {
  userId: string | null;
  accion: string;
  tablaAfectada: string;
  registroId: string;
  valoresAnteriores?: any;
  valoresNuevos?: any;
}) {
  const { userId, accion, tablaAfectada, registroId, valoresAnteriores, valoresNuevos } = params;
  
  const queryText = `
    INSERT INTO logs_auditoria (usuario_id, accion, tabla_afectada, registro_id, valores_anteriores, valores_nuevos)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, fecha_accion;
  `;

  try {
    const res = await db.query(queryText, [
      userId,
      accion,
      tablaAfectada,
      registroId,
      valoresAnteriores ? JSON.stringify(valoresAnteriores) : null,
      valoresNuevos ? JSON.stringify(valoresNuevos) : null
    ]);
    console.log(`[Audit Log] Registro de auditoría creado con ID ${res.rows[0].id} para la acción: ${accion}`);
  } catch (error) {
    // No dejamos que un fallo de auditoría detenga la respuesta pero lo registramos severamente
    console.error('[CRITICAL] Error al escribir el log de auditoría inmutable:', error);
  }
}

/**
 * Middleware to restrict route access by user-specific/role-specific permission key
 */
export function requirePermission(permissionKey: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado.' });
    }

    try {
      const result = await db.query(
        `SELECT u.permisos, r.permisos AS role_permisos 
         FROM usuarios u 
         JOIN roles r ON u.rol = r.nombre 
         WHERE u.id = $1`,
        [req.user.id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado.' });
      }

      const userPerms = result.rows[0].permisos || {};
      const rolePerms = result.rows[0].role_permisos || {};

      if (userPerms[permissionKey] === true || rolePerms[permissionKey] === true) {
        return next();
      }

      return res.status(403).json({
        error: `Acceso denegado. No tiene el privilegio '${permissionKey}' para realizar esta acción.`
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error interno al verificar privilegios.' });
    }
  };
}
