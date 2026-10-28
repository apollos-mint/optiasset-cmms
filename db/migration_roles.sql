-- ============================================================================
-- SCRIPT DE MIGRACIÓN: Control Dinámico de Roles y Permisos
-- ============================================================================

-- 1. Eliminar la restricción estática de roles en usuarios
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS chk_rol_usuario;

-- 2. Crear la tabla de roles
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    permisos JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- 3. Insertar los roles por defecto y sus mapas de permisos iniciales
INSERT INTO roles (nombre, permisos) VALUES
('Administrador', '{
    "acceder_operaciones": true,
    "acceder_catalogos": true,
    "acceder_almacen": true,
    "acceder_reportes": true,
    "acceder_usuarios": true,
    "acceder_auditoria": true
}'::jsonb),
('Mecánico', '{
    "acceder_operaciones": true,
    "acceder_catalogos": false,
    "acceder_almacen": false,
    "acceder_reportes": true,
    "acceder_usuarios": false,
    "acceder_auditoria": false
}'::jsonb),
('Chofer/Operador', '{
    "acceder_operaciones": true,
    "acceder_catalogos": false,
    "acceder_almacen": false,
    "acceder_reportes": false,
    "acceder_usuarios": false,
    "acceder_auditoria": false
}'::jsonb),
('Asistente', '{
    "acceder_operaciones": true,
    "acceder_catalogos": false,
    "acceder_almacen": true,
    "acceder_reportes": true,
    "acceder_usuarios": false,
    "acceder_auditoria": false
}'::jsonb),
('Operador Logístico', '{
    "acceder_operaciones": false,
    "acceder_catalogos": true,
    "acceder_almacen": true,
    "acceder_reportes": true,
    "acceder_usuarios": false,
    "acceder_auditoria": false
}'::jsonb)
ON CONFLICT (nombre) DO NOTHING;

-- 4. Añadir la clave foránea en la tabla usuarios para apuntar a roles(nombre)
-- Esto vincula tus usuarios actuales automáticamente con sus respectivos permisos
ALTER TABLE usuarios 
ADD CONSTRAINT fk_usuario_rol 
FOREIGN KEY (rol) REFERENCES roles(nombre) 
ON UPDATE CASCADE;
