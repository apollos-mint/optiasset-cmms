import { Response } from 'express';
import { db } from '../config/db';
import { AuthenticatedRequest, writeAuditLog } from '../middlewares/audit.middleware';

export class AssetsController {

  /**
   * Retrieves assets, filtered optionally by type
   */
  static async getAssets(req: AuthenticatedRequest, res: Response) {
    const { tipo } = req.query;
    let queryText = 'SELECT * FROM activos WHERE eliminado_en IS NULL';
    const params: any[] = [];

    if (tipo) {
      const typesList = (tipo as string).split(',').map(t => t.trim()).filter(Boolean);
      if (typesList.length > 0) {
        queryText += ' AND tipo_activo = ANY($1)';
        params.push(typesList);
      }
    }
    
    queryText += ' ORDER BY fecha_creacion DESC';

    try {
      const result = await db.query(queryText, params);
      return res.json(result.rows);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error al obtener los activos.' });
    }
  }

  /**
   * Fetch one asset by ID
   */
  static async getAssetById(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    try {
      const result = await db.query('SELECT * FROM activos WHERE id = $1 AND eliminado_en IS NULL', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Activo no encontrado.' });
      }
      return res.json(result.rows[0]);
    } catch (error) {
      return res.status(500).json({ error: 'Error al buscar el activo.' });
    }
  }

  /**
   * Create a new asset
   */
  static async createAsset(req: AuthenticatedRequest, res: Response) {
    const { tipo_activo, fecha_compra, datos_especificos, destino_almacen } = req.body;

    if (!tipo_activo || !fecha_compra) {
      return res.status(400).json({ error: 'Tipo de activo y fecha de compra son obligatorios.' });
    }

    try {
      const queryText = `
        INSERT INTO activos (tipo_activo, fecha_compra, datos_especificos, destino_almacen)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      const result = await db.query(queryText, [
        tipo_activo,
        fecha_compra,
        JSON.stringify(datos_especificos || {}),
        destino_almacen || null
      ]);

      const newAsset = result.rows[0];

      await writeAuditLog({
        userId: req.user?.id || null,
        accion: 'CREAR_ACTIVO',
        tablaAfectada: 'activos',
        registroId: newAsset.id,
        valoresNuevos: newAsset
      });

      return res.status(201).json(newAsset);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error al registrar el activo.' });
    }
  }

  /**
   * Update an existing asset
   */
  static async updateAsset(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const { fecha_compra, datos_especificos } = req.body;

    try {
      const oldRes = await db.query('SELECT * FROM activos WHERE id = $1', [id]);
      if (oldRes.rows.length === 0) {
        return res.status(404).json({ error: 'Activo no encontrado.' });
      }
      const oldAsset = oldRes.rows[0];

      const queryText = `
        UPDATE activos 
        SET fecha_compra = $1, datos_especificos = $2
        WHERE id = $3
        RETURNING *
      `;
      const result = await db.query(queryText, [
        fecha_compra || oldAsset.fecha_compra,
        datos_especificos ? JSON.stringify(datos_especificos) : oldAsset.datos_especificos,
        id
      ]);

      const updatedAsset = result.rows[0];

      await writeAuditLog({
        userId: req.user?.id || null,
        accion: 'MODIFICAR_ACTIVO',
        tablaAfectada: 'activos',
        registroId: id,
        valoresAnteriores: oldAsset,
        valoresNuevos: updatedAsset
      });

      return res.json(updatedAsset);
    } catch (error) {
      return res.status(500).json({ error: 'Error al actualizar el activo.' });
    }
  }

  /**
   * Module 4: Categorize warehouse stock items by destination
   */
  static async updateWarehouseDestination(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const { destino_almacen } = req.body;

    const validDestinations = ['Para Venta', 'Para Reciclaje', 'Para Mantenimiento', 'Para Eliminación'];
    if (destino_almacen !== null && !validDestinations.includes(destino_almacen)) {
      return res.status(400).json({ error: `Destino inválido. Debe ser uno de: ${validDestinations.join(', ')} o null` });
    }

    try {
      const oldRes = await db.query('SELECT * FROM activos WHERE id = $1', [id]);
      if (oldRes.rows.length === 0) {
        return res.status(404).json({ error: 'Activo no encontrado.' });
      }
      const oldAsset = oldRes.rows[0];

      if (oldAsset.tipo_activo !== 'Stock Almacén') {
        return res.status(400).json({ error: 'La asignación de destino de almacén solo aplica a activos de tipo "Stock Almacén".' });
      }

      const queryText = `
        UPDATE activos 
        SET destino_almacen = $1
        WHERE id = $2
        RETURNING *
      `;
      const result = await db.query(queryText, [destino_almacen, id]);
      const updatedAsset = result.rows[0];

      // Audit logs (digital signature from logged user/admin)
      await writeAuditLog({
        userId: req.user?.id || null,
        accion: 'ASIGNAR_DESTINO_ALMACEN',
        tablaAfectada: 'activos',
        registroId: id,
        valoresAnteriores: { destino_almacen: oldAsset.destino_almacen },
        valoresNuevos: { destino_almacen: updatedAsset.destino_almacen }
      });

      return res.json(updatedAsset);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error al actualizar el destino del stock.' });
    }
  }

  static async deleteAsset(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const userId = req.user?.id;
    try {
      const checkRes = await db.query('SELECT * FROM activos WHERE id = $1 AND eliminado_en IS NULL', [id]);
      if (checkRes.rows.length === 0) {
        return res.status(404).json({ error: 'Activo no encontrado o ya eliminado.' });
      }

      const oldAsset = checkRes.rows[0];

      await db.query(
        'UPDATE activos SET eliminado_en = CURRENT_TIMESTAMP, eliminado_por = $1 WHERE id = $2',
        [userId || null, id]
      );

      await writeAuditLog({
        userId: userId || null,
        accion: 'ELIMINAR_ACTIVO',
        tablaAfectada: 'activos',
        registroId: id,
        valoresAnteriores: oldAsset,
        valoresNuevos: { eliminado_en: new Date().toISOString(), eliminado_por: userId }
      });

      return res.json({ message: 'Activo eliminado correctamente del sistema.' });
    } catch (error) {
      console.error('Error al eliminar activo:', error);
      return res.status(500).json({ error: 'Error interno al procesar la eliminación del activo.' });
    }
  }
}
