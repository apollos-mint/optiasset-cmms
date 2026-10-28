import { getProfitDb } from './config/profitDb';
import sql from 'mssql';

async function run() {
  try {
    const pool = await getProfitDb();
    await pool.request().query("USE [TRA_A12]");
    
    console.log('--------------------------------------------------');
    console.log("Searching for document '0000002057' in saNotaRecepcionCompra after restoration:");
    const res = await pool.request().query("SELECT doc_num, co_prov, fec_emis, total_neto, descrip FROM saNotaRecepcionCompra WHERE doc_num = '0000002057'");
    console.log('Results:', res.recordset);

    console.log('--------------------------------------------------');
    console.log("Searching for rows in saNotaRecepcionCompraReng for '0000002057':");
    const resReng = await pool.request().query("SELECT reng_num, co_art, total_art, cost_unit, cost_unit_om FROM saNotaRecepcionCompraReng WHERE doc_num = '0000002057'");
    console.log('Rows:', resReng.recordset);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}

run();
