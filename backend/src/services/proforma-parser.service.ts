import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

export interface ProformaParseResult {
  nombre_proveedor: string;
  direccion_proveedor?: string;
  telefono_proveedor?: string;
  email_proveedor?: string;
  consignee?: string;
  proforma_numero?: string;
  fecha_proforma?: string;
  pais_origen: string;
  pais_destino: string;
  puerto_embarque?: string;
  puerto_destino?: string;
  incoterm: string;
  condiciones_pago: string;
  banco_info?: string;
  fcl_contenedores?: string;
  total_paletas: number;
  total_cajas: number;
  total_mt2: number;
  peso_neto_kg: number;
  peso_bruto_kg: number;
  fob_total_usd: number;
  flete_total_usd: number;
  seguro_total_usd: number;
  costo_aterrizado_unitario: number;
  precio_unitario: number;
  cantidad_ofertada: number;
  lead_time_dias: number;
  garantia_meses: number;
  especificaciones_tecnicas: string;
  puntos_fuertes: string;
  riesgos_advertencias: string;
  flete_estimado_total: number;
  aranceles_estimados_total: number;
  productos_detalle: Array<{
    id: string;
    item_numero: number;
    descripcion: string;
    calidad: string;
    paletas?: number;
    cajas_totales: number;
    mt2_totales: number;
    precio_mt2: number;
    monto_total_usd: number;
    mt2_caja?: number;
    kg_caja?: number;
    piezas_caja?: number;
    espesor_mm?: number;
    medida_formato?: string;
  }>;
  lineas_calidad: Array<{
    calidad: string;
    precio_mt2: number;
    mt2_total: number;
    cajas_total: number;
    monto_total: number;
    items_count: number;
  }>;
}

export class ProformaParserService {
  private static scriptPath = path.resolve(__dirname, '../scripts/parse_proforma.py');

  public static async parse(fileBuffer?: Buffer, fileName?: string, rawText?: string, contextText: string = ''): Promise<ProformaParseResult> {
    let tempFilePath: string | null = null;

    try {
      let targetInput = '';

      if (fileBuffer && fileName) {
        const ext = path.extname(fileName) || '.pdf';
        tempFilePath = path.join(os.tmpdir(), `proforma_${Date.now()}_${Math.random().toString(36).substring(7)}${ext}`);
        fs.writeFileSync(tempFilePath, fileBuffer);
        targetInput = tempFilePath;
      } else if (rawText) {
        targetInput = rawText;
      } else {
        throw new Error('Debe proporcionar un archivo (PDF/Excel) o el texto de la proforma.');
      }

      const scriptOutput = await this.runPythonParser(targetInput, contextText);
      return scriptOutput;
    } finally {
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
        } catch (e) {
          console.warn('No se pudo borrar archivo temporal:', tempFilePath);
        }
      }
    }
  }

  private static runPythonParser(inputPathOrText: string, contextText: string): Promise<ProformaParseResult> {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python3', [
        this.scriptPath,
        inputPathOrText,
        contextText || ''
      ]);

      let stdoutData = '';
      let stderrData = '';

      pythonProcess.stdout.on('data', (data) => {
        stdoutData += data.toString('utf-8');
      });

      pythonProcess.stderr.on('data', (data) => {
        stderrData += data.toString('utf-8');
      });

      pythonProcess.on('close', (code) => {
        const startTag = '__JSON_START__';
        const endTag = '__JSON_END__';

        const sIdx = stdoutData.indexOf(startTag);
        const eIdx = stdoutData.indexOf(endTag);

        if (sIdx !== -1 && eIdx !== -1) {
          const jsonContent = stdoutData.substring(sIdx + startTag.length, eIdx).trim();
          try {
            const parsed = JSON.parse(jsonContent);
            if (parsed.error) {
              return reject(new Error(parsed.error));
            }
            return resolve(parsed as ProformaParseResult);
          } catch (err: any) {
            return reject(new Error(`Error al decodificar respuesta del extractor: ${err.message}`));
          }
        }

        if (code !== 0) {
          return reject(new Error(`El motor de extracción finalizó con código ${code}: ${stderrData || stdoutData}`));
        }

        try {
          const parsed = JSON.parse(stdoutData.trim());
          resolve(parsed as ProformaParseResult);
        } catch (e) {
          reject(new Error(`No se pudo obtener formato JSON estructurado: ${stdoutData || stderrData}`));
        }
      });

      pythonProcess.on('error', (err) => {
        reject(new Error(`Fallo al invocar el script de extracción Python: ${err.message}`));
      });
    });
  }
}
