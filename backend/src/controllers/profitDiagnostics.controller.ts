import { Request, Response } from 'express';
import { getProfitDb } from '../config/profitDb';
import sql from 'mssql';

export class ProfitDiagnosticsController {
  // GET /api/profit-diagnostics/dropdowns
  static async getDropdowns(req: Request, res: Response) {
    try {
      const pool = await getProfitDb();
      
      const vehiclesResult = await pool.request().query(`
        SELECT RTRIM(co_cli) AS co_cli, RTRIM(cli_des) AS cli_des 
        FROM saCliente 
        ORDER BY cli_des ASC
      `);

      // Fetch users from actual transaction tables (TRA_A12 native tables), 
      // since MasterProfitPro cross-DB access may not be always available.
      // Try MpUsuario first (full name), fall back to distinct co_us_in from transactions.
      let usersResult: any = { recordset: [] };
      try {
        usersResult = await pool.request().query(`
          SELECT RTRIM(Cod_Usuario) AS Cod_Usuario, RTRIM(Desc_Usuario) AS Desc_Usuario 
          FROM MasterProfitPro.dbo.MpUsuario 
          ORDER BY Desc_Usuario ASC
        `);
      } catch (mpErr) {
        console.warn('[Profit] MasterProfitPro no disponible, obteniendo usuarios desde TRA_A12...', mpErr);
        // Build user list from distinct co_us_in values in the transaction tables
        usersResult = await pool.request().query(`
          SELECT DISTINCT RTRIM(co_us_in) AS Cod_Usuario, RTRIM(co_us_in) AS Desc_Usuario
          FROM (
            SELECT co_us_in FROM saNotaRecepcionCompra WHERE co_us_in IS NOT NULL AND RTRIM(co_us_in) != ''
            UNION
            SELECT co_us_in FROM saNotaEntregaVenta WHERE co_us_in IS NOT NULL AND RTRIM(co_us_in) != ''
            UNION
            SELECT co_us_in FROM saFacturaCompra WHERE co_us_in IS NOT NULL AND RTRIM(co_us_in) != ''
            UNION
            SELECT co_us_in FROM saAjuste WHERE co_us_in IS NOT NULL AND RTRIM(co_us_in) != ''
            UNION
            SELECT co_us_in FROM saArticulo WHERE co_us_in IS NOT NULL AND RTRIM(co_us_in) != ''
          ) AS AllUsers
          ORDER BY Cod_Usuario ASC
        `);
      }

      res.json({
        vehicles: vehiclesResult.recordset,
        users: usersResult.recordset
      });
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      res.status(500).json({ error: 'Failed to fetch dropdown filter options' });
    }
  }

  // GET /api/profit-diagnostics/delivery-notes
  static async getDeliveryNotes(req: Request, res: Response) {
    try {
      const { usuarios, vehiculos, fecha_inicio, fecha_fin, doc_num } = req.query;
      const pool = await getProfitDb();
      const request = pool.request();

      let queryConditions = ' WHERE 1=1';

      if (fecha_inicio) {
        request.input('fecha_inicio', sql.VarChar, `${fecha_inicio} 00:00:00`);
        queryConditions += ' AND n.fec_emis >= @fecha_inicio';
      }

      if (fecha_fin) {
        request.input('fecha_fin', sql.VarChar, `${fecha_fin} 23:59:59`);
        queryConditions += ' AND n.fec_emis <= @fecha_fin';
      }

      if (usuarios) {
        const userList = (usuarios as string).split(',');
        const userConds = [];
        for (let i = 0; i < userList.length; i++) {
          const paramName = `user_${i}`;
          request.input(paramName, sql.VarChar, userList[i].trim());
          userConds.push(`@${paramName}`);
        }
        if (userConds.length > 0) {
          queryConditions += ` AND n.co_us_in IN (${userConds.join(', ')})`;
        }
      }

      if (vehiculos) {
        const vehicleList = (vehiculos as string).split(',');
        const vehicleConds = [];
        for (let i = 0; i < vehicleList.length; i++) {
          const paramName = `vehicle_${i}`;
          request.input(paramName, sql.VarChar, vehicleList[i].trim());
          vehicleConds.push(`@${paramName}`);
        }
        if (vehicleConds.length > 0) {
          queryConditions += ` AND n.co_cli IN (${vehicleConds.join(', ')})`;
        }
      }

      if (doc_num) {
        request.input('doc_num', sql.VarChar, `%${(doc_num as string).trim()}%`);
        queryConditions += ' AND n.doc_num LIKE @doc_num';
      }

      const sqlQuery = `
        SELECT 
          RTRIM(n.doc_num) AS doc_num,
          n.fec_emis,
          n.fec_reg,
          n.tasa,
          RTRIM(n.co_mone) AS co_mone,
          n.total_bruto,
          n.total_neto,
          RTRIM(n.co_cli) AS co_cli,
          RTRIM(c.cli_des) AS cli_des,
          RTRIM(n.descrip) AS descrip,
          RTRIM(n.co_us_in) AS co_us_in,
          COALESCE(RTRIM(u.Desc_Usuario), RTRIM(n.co_us_in)) AS us_nom
        FROM saNotaEntregaVenta n
        LEFT JOIN saCliente c ON n.co_cli = c.co_cli
        LEFT JOIN MasterProfitPro.dbo.MpUsuario u ON RTRIM(n.co_us_in) = RTRIM(u.Cod_Usuario)
        ${queryConditions}
        ORDER BY n.fec_emis DESC
      `;

      const result = await request.query(sqlQuery);
      res.json(result.recordset);
    } catch (error) {
      console.error('Error fetching Profit delivery notes:', error);
      res.status(500).json({ error: 'Failed to fetch Profit delivery notes' });
    }
  }

  // GET /api/profit-diagnostics/reception-notes
  static async getReceptionNotes(req: Request, res: Response) {
    try {
      const { usuarios, fecha_inicio, fecha_fin, doc_num } = req.query;
      const pool = await getProfitDb();
      const request = pool.request();

      let queryConditions = ' WHERE 1=1';

      if (fecha_inicio) {
        request.input('fecha_inicio', sql.VarChar, `${fecha_inicio} 00:00:00`);
        queryConditions += ' AND n.fec_emis >= @fecha_inicio';
      }

      if (fecha_fin) {
        request.input('fecha_fin', sql.VarChar, `${fecha_fin} 23:59:59`);
        queryConditions += ' AND n.fec_emis <= @fecha_fin';
      }

      if (usuarios) {
        const userList = (usuarios as string).split(',');
        const userConds = [];
        for (let i = 0; i < userList.length; i++) {
          const paramName = `user_${i}`;
          request.input(paramName, sql.VarChar, userList[i].trim());
          userConds.push(`@${paramName}`);
        }
        if (userConds.length > 0) {
          queryConditions += ` AND n.co_us_in IN (${userConds.join(', ')})`;
        }
      }

      if (doc_num) {
        request.input('doc_num', sql.VarChar, `%${(doc_num as string).trim()}%`);
        queryConditions += ' AND n.doc_num LIKE @doc_num';
      }

      const sqlQuery = `
        SELECT 
          RTRIM(n.doc_num) AS doc_num,
          n.fec_emis,
          n.fec_reg,
          n.tasa,
          RTRIM(n.co_mone) AS co_mone,
          n.total_bruto,
          n.total_neto,
          RTRIM(n.co_prov) AS co_prov,
          RTRIM(p.prov_des) AS prov_des,
          RTRIM(n.descrip) AS descrip,
          RTRIM(n.co_us_in) AS co_us_in,
          COALESCE(RTRIM(u.Desc_Usuario), RTRIM(n.co_us_in)) AS us_nom
        FROM saNotaRecepcionCompra n
        LEFT JOIN saProveedor p ON n.co_prov = p.co_prov
        LEFT JOIN MasterProfitPro.dbo.MpUsuario u ON RTRIM(n.co_us_in) = RTRIM(u.Cod_Usuario)
        ${queryConditions}
        ORDER BY n.fec_emis DESC
      `;

      const result = await request.query(sqlQuery);
      res.json(result.recordset);
    } catch (error) {
      console.error('Error fetching Profit reception notes:', error);
      res.status(500).json({ error: 'Failed to fetch Profit reception notes' });
    }
  }

  // GET /api/profit-diagnostics/activity
  static async getActivity(req: Request, res: Response) {
    try {
      const { usuario, fecha_inicio, fecha_fin, tipo_documento } = req.query;
      const pool = await getProfitDb();
      const request = pool.request();

      let queryConditions = ' WHERE 1=1';

      if (usuario) {
        const userList = (usuario as string).split(',');
        const userConds = [];
        for (let i = 0; i < userList.length; i++) {
          const paramName = `act_user_${i}`;
          request.input(paramName, sql.VarChar, userList[i].trim());
          userConds.push(`@${paramName}`);
        }
        if (userConds.length > 0) {
          queryConditions += ` AND Usuario IN (${userConds.join(', ')})`;
        }
      }

      if (fecha_inicio) {
        request.input('fecha_inicio', sql.VarChar, `${fecha_inicio} 00:00:00`);
        queryConditions += ' AND Fecha >= @fecha_inicio';
      }

      if (fecha_fin) {
        request.input('fecha_fin', sql.VarChar, `${fecha_fin} 23:59:59`);
        queryConditions += ' AND Fecha <= @fecha_fin';
      }

      if (tipo_documento) {
        request.input('tipo_documento', sql.VarChar, tipo_documento);
        if (tipo_documento === 'Recepción de Compra') {
          queryConditions += " AND (Documento_Tipo = 'Nota de Recepción' OR Accion = 'Recepción de Compra')";
        } else if (tipo_documento === 'Compra Registrada') {
          queryConditions += " AND Documento_Tipo = 'Factura de Compra'";
        } else if (tipo_documento === 'Ajuste de Inventario') {
          queryConditions += " AND Documento_Tipo = 'Ajuste'";
        } else if (tipo_documento === 'Catálogo') {
          queryConditions += " AND Documento_Tipo = 'Catálogo'";
        }
      }

      const sqlQuery = `
        SELECT * FROM (
          -- Creación de Artículo
          SELECT 
            'Creación de Artículo' AS Accion, 
            RTRIM(co_us_in) AS Usuario, 
            fe_us_in AS Fecha, 
            RTRIM(co_art) AS Documento_Nro,
            'Catálogo' AS Documento_Tipo,
            RTRIM(art_des) AS Detalle 
          FROM saArticulo
          
          UNION ALL
          
          -- Modificación de Artículo (Solo reales, > 5 segundos diff)
          SELECT 
            'Modificación de Artículo' AS Accion, 
            RTRIM(co_us_mo) AS Usuario, 
            fe_us_mo AS Fecha, 
            RTRIM(co_art) AS Documento_Nro,
            'Catálogo' AS Documento_Tipo,
            RTRIM(art_des) AS Detalle 
          FROM saArticulo 
          WHERE co_us_mo IS NOT NULL AND DATEDIFF(second, fe_us_in, fe_us_mo) > 5
          
          UNION ALL
          
          -- Compra Registrada
          SELECT 
            'Compra Registrada' AS Accion, 
            RTRIM(co_us_in) AS Usuario, 
            fe_us_in AS Fecha, 
            RTRIM(doc_num) AS Documento_Nro,
            'Factura de Compra' AS Documento_Tipo,
            RTRIM(descrip) AS Detalle 
          FROM saFacturaCompra
          
          UNION ALL
          
          -- Ajuste de Inventario
          SELECT 
            'Ajuste de Inventario' AS Accion, 
            RTRIM(co_us_in) AS Usuario, 
            fe_us_in AS Fecha, 
            RTRIM(ajue_num) AS Documento_Nro,
            'Ajuste' AS Documento_Tipo,
            RTRIM(motivo) AS Detalle 
          FROM saAjuste
          
          UNION ALL
          
          -- Nota de Recepción
          SELECT 
            'Recepción de Compra' AS Accion, 
            RTRIM(co_us_in) AS Usuario, 
            fe_us_in AS Fecha, 
            RTRIM(doc_num) AS Documento_Nro,
            'Nota de Recepción' AS Documento_Tipo,
            RTRIM(descrip) AS Detalle 
          FROM saNotaRecepcionCompra
        ) AS Audits 
        ${queryConditions}
        ORDER BY Fecha DESC
      `;

      const result = await request.query(sqlQuery);
      res.json(result.recordset);
    } catch (error) {
      console.error('Error fetching Profit activity log:', error);
      res.status(500).json({ error: 'Failed to fetch Profit activity log' });
    }
  }

  // GET /api/profit-diagnostics/document/:type/:id
  static async getDocumentDetails(req: Request, res: Response) {
    try {
      const { type, id } = req.params;
      const pool = await getProfitDb();
      const request = pool.request();
      request.input('id', sql.VarChar, id);

      let headerQuery = '';
      let rowsQuery = '';

      if (type === 'Factura de Compra') {
        headerQuery = `
          SELECT 
            RTRIM(f.doc_num) AS doc_num,
            f.fec_emis,
            f.fec_reg,
            f.tasa,
            RTRIM(f.co_mone) AS co_mone,
            f.total_bruto,
            f.total_neto,
            RTRIM(f.co_prov) AS co_prov,
            RTRIM(p.prov_des) AS prov_des,
            RTRIM(f.descrip) AS descrip
          FROM saFacturaCompra f
          LEFT JOIN saProveedor p ON f.co_prov = p.co_prov
          WHERE f.doc_num = @id
        `;

        rowsQuery = `
          SELECT 
            r.reng_num,
            RTRIM(r.co_art) AS co_art,
            RTRIM(a.art_des) AS des_art,
            r.total_art,
            r.cost_unit,
            r.cost_unit_om,
            r.reng_neto
          FROM saFacturaCompraReng r
          LEFT JOIN saArticulo a ON r.co_art = a.co_art
          WHERE r.doc_num = @id
          ORDER BY r.reng_num ASC
        `;
      } else if (type === 'Nota de Recepción' || type === 'Recepcion de Compra') {
        headerQuery = `
          SELECT 
            RTRIM(n.doc_num) AS doc_num,
            n.fec_emis,
            n.fec_reg,
            n.tasa,
            RTRIM(n.co_mone) AS co_mone,
            n.total_bruto,
            n.total_neto,
            RTRIM(n.co_prov) AS co_prov,
            RTRIM(p.prov_des) AS prov_des,
            RTRIM(n.descrip) AS descrip
          FROM saNotaRecepcionCompra n
          LEFT JOIN saProveedor p ON n.co_prov = p.co_prov
          WHERE n.doc_num = @id
        `;

        rowsQuery = `
          SELECT 
            r.reng_num,
            RTRIM(r.co_art) AS co_art,
            RTRIM(a.art_des) AS des_art,
            r.total_art,
            r.cost_unit,
            r.cost_unit_om,
            r.reng_neto
          FROM saNotaRecepcionCompraReng r
          LEFT JOIN saArticulo a ON r.co_art = a.co_art
          WHERE r.doc_num = @id
          ORDER BY r.reng_num ASC
        `;
      } else if (type === 'Nota de Entrega' || type === 'Entrega Registrada') {
        headerQuery = `
          SELECT 
            RTRIM(n.doc_num) AS doc_num,
            n.fec_emis,
            n.fec_reg,
            n.tasa,
            RTRIM(n.co_mone) AS co_mone,
            n.total_bruto,
            n.total_neto,
            RTRIM(n.co_cli) AS co_prov,
            RTRIM(c.cli_des) AS prov_des,
            RTRIM(n.descrip) AS descrip
          FROM saNotaEntregaVenta n
          LEFT JOIN saCliente c ON n.co_cli = c.co_cli
          WHERE n.doc_num = @id
        `;

        rowsQuery = `
          SELECT 
            r.reng_num,
            RTRIM(r.co_art) AS co_art,
            RTRIM(a.art_des) AS des_art,
            r.total_art,
            r.prec_vta AS cost_unit,
            r.prec_vta_om AS cost_unit_om,
            r.reng_neto
          FROM saNotaEntregaVentaReng r
          LEFT JOIN saArticulo a ON r.co_art = a.co_art
          WHERE r.doc_num = @id
          ORDER BY r.reng_num ASC
        `;
      } else if (type === 'Ajuste' || type === 'Ajuste de Inventario') {
        headerQuery = `
          SELECT 
            RTRIM(a.ajue_num) AS doc_num,
            a.fecha AS fec_emis,
            a.fecha AS fec_reg,
            a.tasa,
            RTRIM(a.co_mone) AS co_mone,
            0 AS total_bruto,
            0 AS total_neto,
            'N/A' AS co_prov,
            'N/A' AS prov_des,
            RTRIM(a.motivo) AS descrip
          FROM saAjuste a
          WHERE a.ajue_num = @id
        `;

        rowsQuery = `
          SELECT 
            r.reng_num,
            RTRIM(r.co_art) AS co_art,
            RTRIM(art.art_des) AS des_art,
            r.total_art,
            r.cost_unit,
            r.cost_unit AS cost_unit_om,
            (r.total_art * r.cost_unit) AS reng_neto
          FROM saAjusteReng r
          LEFT JOIN saArticulo art ON r.co_art = art.co_art
          WHERE r.ajue_num = @id
          ORDER BY r.reng_num ASC
        `;
      } else if (type === 'Catálogo' || type === 'Creación de Artículo' || type === 'Modificación de Artículo' || type === 'Creacion de Articulo' || type === 'Modificacion de Articulo') {
        headerQuery = `
          SELECT 
            RTRIM(a.co_art) AS doc_num,
            a.fe_us_in AS fec_emis,
            a.fe_us_mo AS fec_reg,
            1 AS tasa,
            'US$' AS co_mone,
            0 AS total_bruto,
            0 AS total_neto,
            RTRIM(a.co_prov) AS co_prov,
            RTRIM(p.prov_des) AS prov_des,
            RTRIM(a.art_des) AS descrip
          FROM saArticulo a
          LEFT JOIN saProveedor p ON a.co_prov = p.co_prov
          WHERE a.co_art = @id
        `;

        rowsQuery = `
          SELECT 
            1 AS reng_num,
            RTRIM(a.co_art) AS co_art,
            RTRIM(a.art_des) AS des_art,
            ISNULL((SELECT SUM(stock) FROM saStockAlmacen s WHERE s.co_art = a.co_art), 0) AS total_art,
            ISNULL((SELECT TOP 1 c.costo FROM saCostoHistoricoEntrada c WHERE c.cod_articulo_rowguid = a.rowguid ORDER BY c.fecha_emision DESC), 0) AS cost_unit,
            ISNULL((SELECT TOP 1 c.costo FROM saCostoHistoricoEntrada c WHERE c.cod_articulo_rowguid = a.rowguid ORDER BY c.fecha_emision DESC), 0) AS cost_unit_om,
            0 AS reng_neto
          FROM saArticulo a
          WHERE a.co_art = @id
        `;
      } else {
        return res.status(400).json({ error: 'Unsupported document type' });
      }

      const headerResult = await request.query(headerQuery);
      if (headerResult.recordset.length === 0) {
        return res.status(404).json({ error: 'Document not found' });
      }

      const rowsResult = await request.query(rowsQuery);

      res.json({
        header: headerResult.recordset[0],
        rows: rowsResult.recordset
      });
    } catch (error) {
      console.error('Error fetching document details:', error);
      res.status(500).json({ error: 'Failed to fetch document details' });
    }
  }

  // GET /api/profit-diagnostics/purchases-analysis
  static async getPurchasesAnalysis(req: Request, res: Response) {
    try {
      const pool = await getProfitDb();
      const result = await pool.request().query(`
        SELECT 
          RTRIM(a.co_art) AS id,
          RTRIM(a.art_des) AS descripcion,
          ISNULL((SELECT SUM(stock) FROM saStockAlmacen s WHERE s.co_art = a.co_art), 0) AS stock_actual,
          (
            SELECT TOP 1 f.fec_emis 
            FROM saFacturaCompraReng r 
            JOIN saFacturaCompra f ON r.doc_num = f.doc_num 
            WHERE r.co_art = a.co_art 
            ORDER BY f.fec_emis DESC
          ) AS ultima_compra_fecha,
          ISNULL((
            SELECT TOP 1 r.costo_unit 
            FROM saFacturaCompraReng r 
            JOIN saFacturaCompra f ON r.doc_num = f.doc_num 
            WHERE r.co_art = a.co_art 
            ORDER BY f.fec_emis DESC
          ), 0) AS ultima_compra_costo,
          ISNULL((
            SELECT TOP 1 r.total_art 
            FROM saFacturaCompraReng r 
            JOIN saFacturaCompra f ON r.doc_num = f.doc_num 
            WHERE r.co_art = a.co_art 
            ORDER BY f.fec_emis DESC
          ), 0) AS ultima_compra_cantidad,
          (
            SELECT TOP 1 RTRIM(f.co_mone) 
            FROM saFacturaCompraReng r 
            JOIN saFacturaCompra f ON r.doc_num = f.doc_num 
            WHERE r.co_art = a.co_art 
            ORDER BY f.fec_emis DESC
          ) AS ultima_compra_moneda
        FROM saArticulo a
        WHERE a.tipo != 'S'
        ORDER BY a.art_des ASC
      `);
      res.json(result.recordset);
    } catch (error) {
      console.error('Error fetching purchases analysis:', error);
      res.status(500).json({ error: 'Failed to fetch purchases analysis' });
    }
  }

  // GET /api/profit-diagnostics/currencies-summary
  static async getCurrenciesSummary(req: Request, res: Response) {
    try {
      const pool = await getProfitDb();
      const result = await pool.request().query(`
        SELECT 
          RTRIM(f.co_mone) AS moneda,
          COUNT(*) AS total_facturas,
          SUM(f.total_neto) AS monto_total
        FROM saFacturaCompra f
        GROUP BY f.co_mone
      `);
      res.json(result.recordset);
    } catch (error) {
      console.error('Error fetching currency summary:', error);
      res.status(500).json({ error: 'Failed to fetch currency summary' });
    }
  }
}
