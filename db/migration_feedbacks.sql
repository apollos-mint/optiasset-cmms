-- ============================================================================
-- SQL SCHEMA: Tabla de Feedbacks y Sugerencias de Stakeholders
-- ============================================================================

CREATE TABLE IF NOT EXISTS stakeholder_feedbacks (
    id SERIAL PRIMARY KEY,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    nombre_usuario VARCHAR(150),
    rol_usuario VARCHAR(50),
    departamento VARCHAR(100),
    modulo_actual VARCHAR(100) NOT NULL DEFAULT 'general',
    url_path VARCHAR(255),
    dispositivo VARCHAR(255),
    problema_obstaculo TEXT NOT NULL,
    solucion_propuesta TEXT,
    impacto VARCHAR(50) NOT NULL DEFAULT 'molestia',
    estado VARCHAR(50) NOT NULL DEFAULT 'pendiente',
    notas_admin TEXT,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_feedbacks_creado_en ON stakeholder_feedbacks(creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_feedbacks_estado ON stakeholder_feedbacks(estado);
