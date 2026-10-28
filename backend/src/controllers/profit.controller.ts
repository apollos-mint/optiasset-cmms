import { Request, Response } from 'express';
import { getProfitDb } from '../config/profitDb';

export class ProfitController {
  static async getProfitInventory(req: Request, res: Response) {
    try {
      const pool = await getProfitDb();
      
      const result = await pool.request().query(`
        SELECT 
          RTRIM(a.co_art) AS id,
          RTRIM(a.art_des) AS descripcion,
          'Unidades' AS unidad_medida,
          ISNULL((SELECT TOP 1 monto FROM saArtPrecio p WHERE p.co_art = a.co_art ORDER BY p.co_precio ASC), 0) AS precio_referencia,
          ISNULL((SELECT TOP 1 costo FROM saCostoHistoricoEntrada c WHERE c.cod_articulo_rowguid = a.rowguid ORDER BY c.fecha_emision DESC), 0) AS costo_compra,
          ISNULL((SELECT SUM(stock) FROM saStockAlmacen s WHERE s.co_art = a.co_art), 0) AS stock_actual, 
          RTRIM(l.lin_des) AS proveedor,
          CAST(1 AS BIT) AS activo
        FROM saArticulo a
        LEFT JOIN saLineaArticulo l ON a.co_lin = l.co_lin
        WHERE a.tipo != 'S'
        ORDER BY a.art_des ASC
      `);

      res.json(result.recordset);
    } catch (error) {
      console.error('Error fetching Profit Plus inventory:', error);
      res.status(500).json({ error: 'Failed to fetch inventory from Profit Plus' });
    }
  }
}
