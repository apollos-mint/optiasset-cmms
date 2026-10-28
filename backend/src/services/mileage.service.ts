import { db } from '../config/db';

interface MaxReadings {
  tipo_activo: string;
  max_kilometraje: number;
  max_horometro: number;
}

/**
 * Service to handle mileage/hourmeter tracking and validation.
 */
export class MileageService {
  /**
   * Retrieves the current maximum mileage and hourmeter recorded for an asset.
   */
  static async getCurrentMaxReadings(activoId: string): Promise<MaxReadings> {
    const queryText = `
      SELECT 
        a.tipo_activo,
        GREATEST(
          COALESCE(MAX(c.kilometraje_registro), 0),
          COALESCE(MAX(o.kilometraje_registro), 0),
          COALESCE((a.datos_especificos->>'kilometraje_inicial')::numeric, 0)
        ) AS max_kilometraje,
        GREATEST(
          COALESCE(MAX(c.horometro_registro), 0),
          COALESCE(MAX(o.horometro_registro), 0),
          COALESCE((a.datos_especificos->>'horometro_inicial')::numeric, 0)
        ) AS max_horometro
      FROM activos a
      LEFT JOIN checklists c ON c.activo_id = a.id
      LEFT JOIN ordenes_servicio o ON o.activo_id = a.id
      WHERE a.id = $1
      GROUP BY a.id, a.tipo_activo;
    `;

    const result = await db.query(queryText, [activoId]);

    if (result.rows.length === 0) {
      throw new Error(`El activo con ID ${activoId} no existe.`);
    }

    const row = result.rows[0];
    return {
      tipo_activo: row.tipo_activo,
      max_kilometraje: parseFloat(row.max_kilometraje) || 0,
      max_horometro: parseFloat(row.max_horometro) || 0,
    };
  }

  /**
   * Validates if the new mileage/hourmeter is strictly greater than the recorded maximum.
   * Throws an explicit error message if the check fails.
   */
  static async validateIncrement(params: {
    activoId: string;
    kilometraje?: number;
    horometro?: number;
  }): Promise<void> {
    const { activoId, kilometraje, horometro } = params;
    
    const readings = await this.getCurrentMaxReadings(activoId);

    // Validación para Vehículos
    if (readings.tipo_activo === 'Vehículo' && kilometraje !== undefined) {
      if (kilometraje <= readings.max_kilometraje) {
        throw new Error(
          `Validación fallida: El kilometraje ingresado (${kilometraje} km) debe ser estrictamente MAYOR al kilometraje actual registrado (${readings.max_kilometraje} km) para este vehículo.`
        );
      }
    }

    // Validación para Maquinaria
    if (readings.tipo_activo === 'Maquinaria' && horometro !== undefined) {
      if (horometro <= readings.max_horometro) {
        throw new Error(
          `Validación fallida: Las horas del horómetro ingresadas (${horometro} hrs) deben ser estrictamente MAYORES al horómetro actual registrado (${readings.max_horometro} hrs) para esta maquinaria.`
        );
      }
    }
  }
}
