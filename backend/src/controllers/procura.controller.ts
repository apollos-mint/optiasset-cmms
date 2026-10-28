import { Response } from 'express';
import { AuthenticatedRequest, writeAuditLog } from '../middlewares/audit.middleware';
import { ProformaParserService } from '../services/proforma-parser.service';

export class ProcuraController {
  public static async parseProforma(req: AuthenticatedRequest, res: Response) {
    try {
      const file = req.file;
      const text = req.body.text as string | undefined;
      const context = (req.body.context as string | undefined) || '';

      if (!file && (!text || !text.trim())) {
        return res.status(400).json({
          error: 'Debe adjuntar un archivo (PDF/Excel) o proporcionar el texto de la cotización/proforma.'
        });
      }

      const result = await ProformaParserService.parse(
        file?.buffer,
        file?.originalname,
        text,
        context
      );

      // Auditoría forense si el usuario está autenticado
      if (req.user) {
        await writeAuditLog({
          userId: req.user.id,
          accion: 'INTERPRETAR_PROFORMA',
          tablaAfectada: 'procura_evaluaciones',
          registroId: 'proforma',
          valoresNuevos: {
            archivo: file?.originalname || 'texto_directo',
            proveedor: result.nombre_proveedor,
            items_extraidos: result.productos_detalle?.length || 0,
            fob_total_usd: result.fob_total_usd
          }
        });
      }

      return res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('Error en ProcuraController.parseProforma:', error);
      return res.status(500).json({
        error: error.message || 'Error interno al procesar e interpretar la proforma.'
      });
    }
  }
}
