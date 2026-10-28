-- ============================================================================
-- SQL SCHEMA: Sistema de Gestión de Activos y Mantenimiento Empresarial
-- Motor: PostgreSQL 13+
-- ============================================================================

-- Habilitar extensión para generación de UUID si no está habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 0. TABLA: roles
-- ==========================================
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    permisos JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- ==========================================
-- 1. TABLA: usuarios
-- ==========================================
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(150) NOT NULL,
    nombre_usuario VARCHAR(50) NOT NULL UNIQUE,
    contrasena_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL REFERENCES roles(nombre) ON UPDATE CASCADE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    foto_perfil TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 2. TABLA: activos
-- ==========================================
CREATE TABLE activos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_activo VARCHAR(50) NOT NULL,
    fecha_compra DATE NOT NULL,
    datos_especificos JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Destino para la Campaña de Despeje de Almacén (Módulo 4)
    destino_almacen VARCHAR(50) NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_tipo_activo CHECK (tipo_activo IN (
        'Vehículo', 
        'Maquinaria', 
        'Edificio', 
        'Stock Almacén'
    )),
    
    CONSTRAINT chk_destino_almacen CHECK (destino_almacen IN (
        'Para Venta', 
        'Para Reciclaje', 
        'Para Mantenimiento', 
        'Para Eliminación'
    ))
);

-- Índices GIN para consultas eficientes sobre JSONB
CREATE INDEX idx_activos_datos_especificos ON activos USING gin (datos_especificos);
CREATE INDEX idx_activos_tipo ON activos (tipo_activo);

-- ==========================================
-- 3. TABLA: catalogo_repuestos
-- ==========================================
CREATE TABLE catalogo_repuestos (
    id SERIAL PRIMARY KEY,
    descripcion VARCHAR(255) NOT NULL UNIQUE,
    unidad_medida VARCHAR(50) NOT NULL,
    precio_referencia DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    
    CONSTRAINT chk_unidad_medida CHECK (unidad_medida IN (
        'Unidades', 
        'Litros', 
        'Galones', 
        'Kits'
    )),
    
    CONSTRAINT chk_precio_referencia_positivo CHECK (precio_referencia >= 0)
);

-- ==========================================
-- 4. TABLA: checklists
-- ==========================================
CREATE TABLE checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activo_id UUID NOT NULL REFERENCES activos(id) ON DELETE RESTRICT,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT, -- Inspector (Firma)
    fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    kilometraje_registro DECIMAL(12, 2) NULL,
    horometro_registro DECIMAL(12, 2) NULL,
    observaciones TEXT NULL,
    respuestas_detalle JSONB NOT NULL DEFAULT '{}'::jsonb, -- Preguntas dinámicas: niveles, fugas, luces
    
    CONSTRAINT chk_kilometraje_positivo CHECK (kilometraje_registro >= 0),
    CONSTRAINT chk_horometro_positivo CHECK (horometro_registro >= 0)
);

CREATE INDEX idx_checklists_activo ON checklists (activo_id);
CREATE INDEX idx_checklists_fecha ON checklists (fecha DESC);

-- ==========================================
-- 5. TABLA: ordenes_servicio
-- ==========================================
CREATE TABLE ordenes_servicio (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activo_id UUID NOT NULL REFERENCES activos(id) ON DELETE RESTRICT,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT, -- Mecánico responsable (Firma)
    fecha_inicio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_fin TIMESTAMP WITH TIME ZONE NULL,
    diagnostico TEXT NOT NULL,
    reparacion_ejecutada TEXT NULL,
    tasa_hora_taller DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    horas_taller DECIMAL(6, 2) NOT NULL DEFAULT 0.00,
    total_facturado DECIMAL(12, 2) NOT NULL DEFAULT 0.00, -- Calculado automáticamente
    kilometraje_registro DECIMAL(12, 2) NULL,
    horometro_registro DECIMAL(12, 2) NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'Abierta', -- Soporte para flujo multifase (Abierta, En Proceso, Completada, Cancelada)
    
    CONSTRAINT chk_estado_orden CHECK (estado IN (
        'Abierta', 
        'En Proceso', 
        'Completada', 
        'Cancelada'
    )),
    CONSTRAINT chk_tasa_hora_positivo CHECK (tasa_hora_taller >= 0),
    CONSTRAINT chk_horas_taller_positivo CHECK (horas_taller >= 0),
    CONSTRAINT chk_total_facturado_positivo CHECK (total_facturado >= 0),
    CONSTRAINT chk_fecha_fin_valida CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio)
);

CREATE INDEX idx_ordenes_activo ON ordenes_servicio (activo_id);
CREATE INDEX idx_ordenes_usuario ON ordenes_servicio (usuario_id);
CREATE INDEX idx_ordenes_fecha ON ordenes_servicio (fecha_inicio DESC);

-- ==========================================
-- 6. TABLA: insumos_orden
-- ==========================================
CREATE TABLE insumos_orden (
    id SERIAL PRIMARY KEY,
    orden_id UUID NOT NULL REFERENCES ordenes_servicio(id) ON DELETE CASCADE,
    repuesto_id INT NOT NULL REFERENCES catalogo_repuestos(id) ON DELETE RESTRICT,
    cantidad_usada DECIMAL(10, 2) NOT NULL,
    costo_unitario_historico DECIMAL(12, 2) NOT NULL, -- Congela el costo exacto al momento de la reparación
    
    CONSTRAINT chk_cantidad_positiva CHECK (cantidad_usada > 0),
    CONSTRAINT chk_costo_historico_positivo CHECK (costo_unitario_historico >= 0)
);

CREATE INDEX idx_insumos_orden ON insumos_orden (orden_id);

-- ==========================================
-- 7. TABLA: logs_auditoria (Inmutable)
-- ==========================================
CREATE TABLE logs_auditoria (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID NULL REFERENCES usuarios(id) ON DELETE SET NULL, -- Quién realizó la acción
    accion VARCHAR(255) NOT NULL, -- Ej: 'LOGIN', 'CREAR_ACTIVO', 'MODIFICAR_ORDEN', etc.
    tabla_afectada VARCHAR(100) NOT NULL,
    registro_id VARCHAR(100) NOT NULL, -- ID del registro afectado (UUID o ID numérico)
    valores_anteriores JSONB NULL,
    valores_nuevos JSONB NULL,
    fecha_accion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_logs_usuario ON logs_auditoria (usuario_id);
CREATE INDEX idx_logs_fecha ON logs_auditoria (fecha_accion DESC);

-- ==========================================
-- 8. VISTA DE RESUMEN DE COSTOS DE ORDEN
-- ==========================================
CREATE OR REPLACE VIEW vista_costos_orden AS
SELECT 
    o.id AS orden_id,
    o.tasa_hora_taller,
    o.horas_taller,
    (o.tasa_hora_taller * o.horas_taller) AS costo_mano_obra,
    COALESCE(SUM(i.cantidad_usada * i.costo_unitario_historico), 0.00) AS costo_insumos,
    (o.tasa_hora_taller * o.horas_taller) + COALESCE(SUM(i.cantidad_usada * i.costo_unitario_historico), 0.00) AS total_calculado
FROM ordenes_servicio o
LEFT JOIN insumos_orden i ON o.id = i.orden_id
GROUP BY o.id, o.tasa_hora_taller, o.horas_taller;

-- ==========================================
-- 9. DATOS DE INICIALIZACIÓN (SEMILLAS)
-- ==========================================

-- Insertar roles por defecto
INSERT INTO roles (nombre, permisos) VALUES
('Administrador', '{"acceder_operaciones": true, "acceder_catalogos": true, "acceder_almacen": true, "acceder_reportes": true, "acceder_usuarios": true, "acceder_auditoria": true, "borrar_checklists": true, "firmar_checklists": true, "acceder_checklists": true, "acceder_ordenes": true, "acceder_profit_diagnostics": true, "modificar_profit_diagnostics": true}'),
('Mecánico', '{"acceder_operaciones": true, "acceder_catalogos": false, "acceder_almacen": false, "acceder_reportes": true, "acceder_usuarios": false, "acceder_auditoria": false, "borrar_checklists": false, "firmar_checklists": true, "acceder_checklists": true, "acceder_ordenes": true, "acceder_profit_diagnostics": false, "modificar_profit_diagnostics": false}'),
('Chofer/Operador', '{"acceder_operaciones": true, "acceder_catalogos": false, "acceder_almacen": false, "acceder_reportes": false, "acceder_usuarios": false, "acceder_auditoria": false, "borrar_checklists": false, "firmar_checklists": false, "acceder_checklists": true, "acceder_ordenes": false, "acceder_profit_diagnostics": false, "modificar_profit_diagnostics": false}'),
('Asistente', '{"acceder_operaciones": true, "acceder_catalogos": false, "acceder_almacen": true, "acceder_reportes": true, "acceder_usuarios": false, "acceder_auditoria": false, "borrar_checklists": false, "firmar_checklists": false, "acceder_checklists": true, "acceder_ordenes": false, "acceder_profit_diagnostics": false, "modificar_profit_diagnostics": false}'),
('Operador Logístico', '{"acceder_operaciones": false, "acceder_catalogos": true, "acceder_almacen": true, "acceder_reportes": true, "acceder_usuarios": false, "acceder_auditoria": false, "borrar_checklists": false, "firmar_checklists": false, "acceder_checklists": false, "acceder_ordenes": false, "acceder_profit_diagnostics": false, "modificar_profit_diagnostics": false}');

-- Contraseña en texto plano: admin123 (Hash generado con bcrypt, rounds = 10)
-- $2b$10$tZptpZ79mZ5B.QzR.G4x.uN6.3N7u3VvHhA73fP6u2H1qR4zS9v5e
INSERT INTO usuarios (nombre, nombre_usuario, contrasena_hash, rol, activo) VALUES
('Administrador Principal', 'admin', '$2b$10$tZptpZ79mZ5B.QzR.G4x.uN6.3N7u3VvHhA73fP6u2H1qR4zS9v5e', 'Administrador', TRUE),
('Mecánico Líder', 'mecanico1', '$2b$10$tZptpZ79mZ5B.QzR.G4x.uN6.3N7u3VvHhA73fP6u2H1qR4zS9v5e', 'Mecánico', TRUE),
('Chofer Express', 'chofer1', '$2b$10$tZptpZ79mZ5B.QzR.G4x.uN6.3N7u3VvHhA73fP6u2H1qR4zS9v5e', 'Chofer/Operador', TRUE);

-- Insertar Repuestos de prueba
INSERT INTO catalogo_repuestos (descripcion, unidad_medida, precio_referencia) VALUES
('Aceite de Motor 15W40', 'Galones', 24.50),
('Filtro de Aceite PH8A', 'Unidades', 12.00),
('Batería 12V 800 CCA', 'Unidades', 110.00),
('Refrigerante de Motor R-12', 'Litros', 8.50),
('Kit de Empacaduras Tapa Válvulas', 'Kits', 45.00);

-- Insertar Activos de prueba (Tipos: Vehículo, Maquinaria, Stock Almacén)
INSERT INTO activos (tipo_activo, fecha_compra, datos_especificos) VALUES
('Vehículo', '2024-01-15', '{"placa": "ABC-123", "marca": "Toyota", "modelo": "Hilux", "anio": 2023, "color": "Blanco", "kilometraje_inicial": 1000}'),
('Vehículo', '2024-03-20', '{"placa": "XYZ-987", "marca": "Chevrolet", "modelo": "FVR", "anio": 2022, "color": "Rojo", "kilometraje_inicial": 25000}'),
('Maquinaria', '2023-06-10', '{"numero_serie": "CAT-992G-9843", "marca": "Caterpillar", "modelo": "992G Cargador", "horometro_inicial": 150}'),
('Stock Almacén', '2025-11-05', '{"nombre_item": "Bomba Hidráulica de Engranajes", "ubicacion_fisica": "Pasillo A - Estante 4", "marca": "Rexroth", "serial": "BHE-84930"}'),
('Stock Almacén', '2025-12-10', '{"nombre_item": "Tanque de Combustible Auxiliar 500L", "ubicacion_fisica": "Patio Exterior 2", "marca": "InoxMetal", "serial": "TCA-500L"}');
