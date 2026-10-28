import { getProfitDb } from '../config/profitDb';
import sql from 'mssql';

export class ProfitSyncService {
  static async syncOrderToProfit(order: any, insumos: any[]): Promise<string> {
    const pool = await getProfitDb();
    
    // Generate a unique doc_num like 'ENT-00000001' or similar
    const numericPart = order.id.replace(/\D/g, '').substring(0, 10) || Math.floor(Math.random() * 1000000).toString();
    const docNum = `ENT-${numericPart.padStart(8, '0')}`.substring(0, 20);

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const requestHeader = new sql.Request(transaction);
      
      const formatSqlDate = (date: Date) => {
        const pad = (num: number) => num.toString().padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
      };

      const getArticleUnitCode = (coArt: string): string => {
        const cleanArt = coArt.trim();
        if (cleanArt === '0000000000000000056' || cleanArt === 'CONSREFRACEI0001' || cleanArt === 'MAOBME1EESTO00000001') {
          return '01';
        }
        return '03';
      };

      const fecEmis = new Date(order.fecha_fin || new Date());
      const dateStr = formatSqlDate(fecEmis);
      const descrip = `Reparación Activo: ${order.placa || order.activo_id} - ${order.diagnostico.substring(0, 50)}`.substring(0, 60);
      
      // Calculate totals
      let totalBruto = 0;
      insumos.forEach(i => {
        totalBruto += (parseFloat(i.cantidad_usada) || 0) * (parseFloat(i.costo_unitario_historico) || 0);
      });
      // Add labor cost
      const laborCost = (parseFloat(order.horas_taller) || 0) * (parseFloat(order.tasa_hora_taller) || 0);
      totalBruto += laborCost;
      
      const totalNeto = totalBruto; // Simplified (no tax)
      
      // Default values for saNotaEntregaVenta
      const coCli = 'SEMA00001'; // Default client (SEMA00001)
      const coTran = 'B-016'; // Default transporter
      const coVen = 'C-01'; // Default seller
      const coMone = 'US$';
      const coUsIn = order.firma_auditoria?.nombre_usuario || 'admin';
      
      // INSERT saNotaEntregaVenta
      await requestHeader.query(`
        INSERT INTO saNotaEntregaVenta (
          doc_num, co_cli, co_tran, co_ven, co_mone, fec_emis, fec_venc, fec_reg, tasa, saldo,
          total_bruto, total_neto, monto_desc_glob, monto_reca, otros1, otros2, otros3,
          monto_imp, monto_imp2, monto_imp3, anulado, ven_ter, contrib, impresa, co_us_in, fe_us_in, co_us_mo, fe_us_mo,
          rowguid, descrip
        ) VALUES (
          '${docNum}', '${coCli}', '${coTran}', '${coVen}', '${coMone}', 
          '${dateStr}', '${dateStr}', '${dateStr}', 
          1, 0, ${totalBruto}, ${totalNeto}, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, '${coUsIn}', GETDATE(), '${coUsIn}', GETDATE(),
          NEWID(), '${descrip}'
        )
      `);
      
      // INSERT saNotaEntregaVentaReng for each insumo
      for (let i = 0; i < insumos.length; i++) {
        const insumo = insumos[i];
        const rengNum = i + 1;
        const coArt = insumo.profit_co_art || 'CONSLUBRACEI00000001'; // Fallback to Aceite Motor 15W40 if none mapped
        const qty = parseFloat(insumo.cantidad_usada) || 1;
        const costUnit = parseFloat(insumo.costo_unitario_historico) || 0;
        const rengNeto = qty * costUnit;
        const uniCode = getArticleUnitCode(coArt);
        
        const requestReng = new sql.Request(transaction);
        await requestReng.query(`
          INSERT INTO saNotaEntregaVentaReng (
            reng_num, doc_num, co_art, co_alma, total_art, stotal_art, co_uni, prec_vta, prec_vta_om,
            monto_desc, tipo_imp, porc_imp, porc_imp2, porc_imp3, monto_imp, monto_imp2, monto_imp3,
            reng_neto, pendiente, pendiente2, total_dev, monto_dev, otros, lote_asignado,
            monto_desc_glob, monto_reca_glob, otros1_glob, otros2_glob, otros3_glob,
            monto_imp_afec_glob, monto_imp2_afec_glob, monto_imp3_afec_glob,
            co_us_in, fe_us_in, co_us_mo, fe_us_mo, rowguid
          ) VALUES (
            ${rengNum}, '${docNum}', '${coArt}', 'DEPOP1', ${qty}, ${qty}, '${uniCode}', ${costUnit}, ${costUnit},
            0, '1', 0, 0, 0, 0, 0, 0,
            ${rengNeto}, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0,
            0, 0, 0,
            '${coUsIn}', GETDATE(), '${coUsIn}', GETDATE(), NEWID()
          )
        `);
      }
      
      // Add labor as a line item if laborCost > 0
      if (laborCost > 0) {
        const rengNum = insumos.length + 1;
        const coArt = 'MAOBME1EESTO00000001'; // Labor / Mano de obra
        const uniCode = getArticleUnitCode(coArt);
        const requestLabor = new sql.Request(transaction);
        await requestLabor.query(`
          INSERT INTO saNotaEntregaVentaReng (
            reng_num, doc_num, co_art, co_alma, total_art, stotal_art, co_uni, prec_vta, prec_vta_om,
            monto_desc, tipo_imp, porc_imp, porc_imp2, porc_imp3, monto_imp, monto_imp2, monto_imp3,
            reng_neto, pendiente, pendiente2, total_dev, monto_dev, otros, lote_asignado,
            monto_desc_glob, monto_reca_glob, otros1_glob, otros2_glob, otros3_glob,
            monto_imp_afec_glob, monto_imp2_afec_glob, monto_imp3_afec_glob,
            co_us_in, fe_us_in, co_us_mo, fe_us_mo, rowguid
          ) VALUES (
            ${rengNum}, '${docNum}', '${coArt}', 'DEPOP1', 1, 1, '${uniCode}', ${laborCost}, ${laborCost},
            0, '1', 0, 0, 0, 0, 0, 0,
            ${laborCost}, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0,
            0, 0, 0,
            '${coUsIn}', GETDATE(), '${coUsIn}', GETDATE(), NEWID()
          )
        `);
      }

      await transaction.commit();
      console.log(`[Profit Sync] Created Delivery Note saNotaEntregaVenta: ${docNum}`);
      return docNum;
    } catch (err) {
      await transaction.rollback();
      console.error('[Profit Sync] Failed to create delivery note transaction:', err);
      throw err;
    }
  }
}
