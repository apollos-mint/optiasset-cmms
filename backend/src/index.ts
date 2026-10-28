import app from './app';
import { db } from './config/db';
import { ExchangeRateService } from './services/exchangeRate.service';

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  console.log('Verificando y actualizando esquema de base de datos...');
  try {
    // 1. Asegurar tabla roles
    await db.query(`
      CREATE TABLE IF NOT EXISTS roles (
          id SERIAL PRIMARY KEY,
          nombre VARCHAR(50) UNIQUE NOT NULL,
          permisos JSONB NOT NULL DEFAULT '{}'::jsonb
      );
    `);

    // 2. Insertar roles iniciales si no existen
    await db.query(`
      INSERT INTO roles (nombre, permisos) VALUES
      ('Administrador', '{"acceder_operaciones": true, "acceder_catalogos": true, "acceder_almacen": true, "acceder_reportes": true, "acceder_usuarios": true, "acceder_auditoria": true, "borrar_checklists": true, "firmar_checklists": true, "ver_procura": true, "editar_procura": true, "emitir_sello_ceo": true}'),
      ('Presidente', '{"ver_inicio": true, "editar_inicio": true, "ver_operaciones": true, "editar_operaciones": true, "ver_procura": true, "editar_procura": true, "emitir_sello_ceo": true, "ver_catalogos": true, "editar_catalogos": true, "ver_almacen": true, "editar_almacen": true, "ver_reportes": true, "editar_reportes": true, "ver_usuarios": true, "editar_usuarios": true, "ver_auditoria": true, "editar_auditoria": true, "acceder_operaciones": true, "acceder_catalogos": true, "acceder_almacen": true, "acceder_reportes": true, "acceder_usuarios": true, "acceder_auditoria": true}'),
      ('Gerente de Compras', '{"ver_inicio": true, "editar_inicio": true, "ver_operaciones": true, "editar_operaciones": false, "ver_procura": true, "editar_procura": true, "emitir_sello_ceo": false, "ver_catalogos": true, "editar_catalogos": true, "ver_almacen": false, "editar_almacen": false, "ver_reportes": true, "editar_reportes": true, "ver_usuarios": false, "editar_usuarios": false, "ver_auditoria": false, "editar_auditoria": false, "acceder_operaciones": true, "acceder_catalogos": true, "acceder_reportes": true}'),
      ('Mecánico', '{"acceder_operaciones": true, "acceder_catalogos": false, "acceder_almacen": false, "acceder_reportes": true, "acceder_usuarios": false, "acceder_auditoria": false, "borrar_checklists": false, "firmar_checklists": true}'),
      ('Chofer/Operador', '{"acceder_operaciones": true, "acceder_catalogos": false, "acceder_almacen": false, "acceder_reportes": false, "acceder_usuarios": false, "acceder_auditoria": false, "borrar_checklists": false, "firmar_checklists": false}'),
      ('Asistente', '{"acceder_operaciones": true, "acceder_catalogos": false, "acceder_almacen": true, "acceder_reportes": true, "acceder_usuarios": false, "acceder_auditoria": false, "borrar_checklists": false, "firmar_checklists": true}'),
      ('Operador Logístico', '{"acceder_operaciones": false, "acceder_catalogos": true, "acceder_almacen": true, "acceder_reportes": true, "acceder_usuarios": false, "acceder_auditoria": false, "borrar_checklists": false, "firmar_checklists": false}')
      ON CONFLICT (nombre) DO NOTHING;
    `);

    // 3. Quitar constraint viejo si existe
    await db.query(`
      ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS chk_rol_usuario;
    `);

    // 4. Asegurar columnas permisos y contrasena_plana en la tabla usuarios
    await db.query(`
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS permisos JSONB NOT NULL DEFAULT '{}'::jsonb;
    `);
    await db.query(`
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS contrasena_plana VARCHAR(255) NULL;
    `);
    await db.query(`
      ALTER TABLE ordenes_servicio ADD COLUMN IF NOT EXISTS firma_creador JSONB DEFAULT NULL;
    `);
    await db.query(`
      ALTER TABLE ordenes_servicio ADD COLUMN IF NOT EXISTS firma_auditoria JSONB DEFAULT NULL;
    `);
    await db.query(`
      ALTER TABLE catalogo_repuestos ADD COLUMN IF NOT EXISTS stock_actual NUMERIC(10,2) NOT NULL DEFAULT 0.00;
    `);
    await db.query(`
      ALTER TABLE catalogo_repuestos ADD COLUMN IF NOT EXISTS proveedor VARCHAR(255) NOT NULL DEFAULT '';
    `);

    // Crear tabla de Solicitudes de Mantenimiento (SDM)
    await db.query(`
      CREATE SEQUENCE IF NOT EXISTS sdm_id_seq START WITH 1;
      CREATE TABLE IF NOT EXISTS solicitudes_mantenimiento (
          id VARCHAR(100) PRIMARY KEY DEFAULT ('SDM-' || lpad(nextval('sdm_id_seq')::text, 8, '0')),
          checklist_id VARCHAR(100) REFERENCES checklists(id) ON DELETE SET NULL,
          activo_id UUID REFERENCES activos(id) ON DELETE RESTRICT,
          usuario_id UUID REFERENCES usuarios(id) ON DELETE RESTRICT,
          fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          detalles_fallas TEXT NOT NULL,
          estado VARCHAR(50) NOT NULL DEFAULT 'Pendiente',
          auditor_sugerido VARCHAR(150) NULL
      );
    `);

    // Sincronizar secuencia de SDM con los IDs máximos existentes
    await db.query(`
      SELECT setval('sdm_id_seq', COALESCE((SELECT MAX(CAST(substring(id from '\\d+') as integer)) FROM solicitudes_mantenimiento), 1));
    `);

    // Agregar columnas de relación a Profit y Solicitud en Órdenes de Servicio
    await db.query(`
      ALTER TABLE ordenes_servicio ADD COLUMN IF NOT EXISTS solicitud_id VARCHAR(100) REFERENCES solicitudes_mantenimiento(id) ON DELETE SET NULL;
    `);
    await db.query(`
      ALTER TABLE ordenes_servicio ADD COLUMN IF NOT EXISTS profit_doc_num VARCHAR(50) NULL;
    `);

    // Agregar columna profit_co_art a catalogo_repuestos
    await db.query(`
      ALTER TABLE catalogo_repuestos ADD COLUMN IF NOT EXISTS profit_co_art VARCHAR(50) NULL;
    `);

    // Semillar códigos de Profit en el catálogo de repuestos
    await db.query(`
      UPDATE catalogo_repuestos SET profit_co_art = 'CONSLUBRACEI00000001' WHERE descripcion = 'Aceite de Motor 15W40' AND profit_co_art IS NULL;
      UPDATE catalogo_repuestos SET profit_co_art = '0000000000000000056' WHERE descripcion = 'Filtro de Aceite PH8A' AND profit_co_art IS NULL;
      UPDATE catalogo_repuestos SET profit_co_art = 'AUTBA00001' WHERE descripcion = 'Batería 12V 800 CCA' AND profit_co_art IS NULL;
      UPDATE catalogo_repuestos SET profit_co_art = 'CONSREFRACEI0001' WHERE descripcion = 'Refrigerante de Motor R-12' AND profit_co_art IS NULL;
    `);

    // 5. Rellenar valores por defecto para usuarios existentes y asegurar permisos
    await db.query(`
      UPDATE usuarios SET contrasena_plana = 'admin123' WHERE contrasena_plana IS NULL;
    `);
    // 5b. Migración: añadir acceder_checklists y acceder_ordenes a todos los roles existentes
    // Copia el valor actual de acceder_operaciones para no romper ningún acceso existente
    await db.query(`
      UPDATE roles
      SET permisos = jsonb_set(
        jsonb_set(permisos, '{acceder_checklists}',
          COALESCE(permisos->'acceder_checklists', permisos->'acceder_operaciones', 'false'::jsonb), true),
        '{acceder_ordenes}',
          COALESCE(permisos->'acceder_ordenes', permisos->'acceder_operaciones', 'false'::jsonb), true)
      WHERE permisos->>'acceder_checklists' IS NULL OR permisos->>'acceder_ordenes' IS NULL;
    `);

    // Migración: añadir acceder_solicitudes a todos los roles
    await db.query(`
      UPDATE roles
      SET permisos = jsonb_set(permisos, '{acceder_solicitudes}',
        COALESCE(permisos->'acceder_solicitudes', 'true'::jsonb), true)
      WHERE permisos->>'acceder_solicitudes' IS NULL;
    `);

    // Migración ODS: Cambiar formato de RPRTSRVC- a ODS-
    await db.query(`
      ALTER TABLE ordenes_servicio ALTER COLUMN id DROP DEFAULT;
      ALTER TABLE ordenes_servicio ALTER COLUMN id SET DEFAULT ('ODS-' || lpad(nextval('order_id_seq')::text, 8, '0'));
    `);
    
    // Asegurar foreign keys con ON UPDATE CASCADE para soportar renombrado
    await db.query(`
      ALTER TABLE insumos_orden DROP CONSTRAINT IF EXISTS insumos_orden_orden_id_fkey;
      ALTER TABLE insumos_orden ADD CONSTRAINT insumos_orden_orden_id_fkey FOREIGN KEY (orden_id) REFERENCES ordenes_servicio(id) ON DELETE CASCADE ON UPDATE CASCADE;
    `);
    await db.query(`
      ALTER TABLE ordenes_servicio DROP CONSTRAINT IF EXISTS ordenes_servicio_solicitud_id_fkey;
      ALTER TABLE ordenes_servicio ADD CONSTRAINT ordenes_servicio_solicitud_id_fkey FOREIGN KEY (solicitud_id) REFERENCES solicitudes_mantenimiento(id) ON DELETE SET NULL ON UPDATE CASCADE;
    `);

    // Renombrar IDs existentes de RPRTSRVC- a ODS-
    await db.query(`
      UPDATE ordenes_servicio SET id = REPLACE(id, 'RPRTSRVC-', 'ODS-') WHERE id LIKE 'RPRTSRVC-%';
    `);

    // 6. MÓDULO PROJECT MANAGEMENT, TICKETS CORPORATIVOS, NOTIFICACIONES Y RENDIMIENTO
    await db.query(`
      CREATE SEQUENCE IF NOT EXISTS ticket_corp_seq START WITH 1;
      CREATE TABLE IF NOT EXISTS tickets_corporativos (
          id VARCHAR(50) PRIMARY KEY DEFAULT ('TCK-' || lpad(nextval('ticket_corp_seq')::text, 6, '0')),
          titulo VARCHAR(255) NOT NULL,
          descripcion TEXT NOT NULL,
          departamento VARCHAR(100) NOT NULL,
          prioridad VARCHAR(20) NOT NULL DEFAULT 'Media',
          deadline TIMESTAMP WITH TIME ZONE NOT NULL,
          creador_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
          asignado_a_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
          stakeholders JSONB NOT NULL DEFAULT '[]'::jsonb,
          necesita_de TEXT NULL,
          estado VARCHAR(30) NOT NULL DEFAULT 'Pendiente',
          primera_lectura_at TIMESTAMP WITH TIME ZONE NULL,
          completado_at TIMESTAMP WITH TIME ZONE NULL,
          minutos_para_abrir INT NULL,
          minutos_para_completar INT NULL,
          cumplio_deadline BOOLEAN NULL,
          fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS ticket_comentarios (
          id SERIAL PRIMARY KEY,
          ticket_id VARCHAR(50) NOT NULL REFERENCES tickets_corporativos(id) ON DELETE CASCADE,
          usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
          mensaje TEXT NOT NULL,
          fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS notificaciones_usuario (
          id SERIAL PRIMARY KEY,
          usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
          ticket_id VARCHAR(50) REFERENCES tickets_corporativos(id) ON DELETE CASCADE,
          remitente_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
          tipo VARCHAR(50) NOT NULL,
          titulo VARCHAR(255) NOT NULL,
          mensaje TEXT NOT NULL,
          leido BOOLEAN NOT NULL DEFAULT FALSE,
          fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          fecha_lectura TIMESTAMP WITH TIME ZONE NULL
      );

      CREATE TABLE IF NOT EXISTS warnings_empleados (
          id SERIAL PRIMARY KEY,
          empleado_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
          emisor_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
          ticket_id VARCHAR(50) REFERENCES tickets_corporativos(id) ON DELETE SET NULL,
          tipo VARCHAR(50) NOT NULL,
          motivo TEXT NOT NULL,
          acciones_requeridas TEXT NULL,
          fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Migración permisos: añadir acceder_pm_tickets a todos los roles
    await db.query(`
      UPDATE roles
      SET permisos = jsonb_set(permisos, '{acceder_pm_tickets}', 'true'::jsonb, true)
      WHERE permisos->>'acceder_pm_tickets' IS NULL;
    `);

    // Sincronizar permisos de usuarios sólo si están vacíos
    await db.query(`
      UPDATE usuarios u 
      SET permisos = r.permisos 
      FROM roles r 
      WHERE u.rol = r.nombre AND (u.permisos = '{}'::jsonb OR u.permisos IS NULL);
    `);

    // 7. ARQUITECTURA SOFT DELETE (Opción A): Soporte de borrado lógico y auditoría
    await db.query(`
      ALTER TABLE activos ADD COLUMN IF NOT EXISTS eliminado_en TIMESTAMP WITH TIME ZONE NULL;
      ALTER TABLE activos ADD COLUMN IF NOT EXISTS eliminado_por UUID REFERENCES usuarios(id) NULL;

      ALTER TABLE checklists ADD COLUMN IF NOT EXISTS eliminado_en TIMESTAMP WITH TIME ZONE NULL;
      ALTER TABLE checklists ADD COLUMN IF NOT EXISTS eliminado_por UUID REFERENCES usuarios(id) NULL;

      ALTER TABLE ordenes_servicio ADD COLUMN IF NOT EXISTS eliminado_en TIMESTAMP WITH TIME ZONE NULL;
      ALTER TABLE ordenes_servicio ADD COLUMN IF NOT EXISTS eliminado_por UUID REFERENCES usuarios(id) NULL;

      ALTER TABLE solicitudes_mantenimiento ADD COLUMN IF NOT EXISTS eliminado_en TIMESTAMP WITH TIME ZONE NULL;
      ALTER TABLE solicitudes_mantenimiento ADD COLUMN IF NOT EXISTS eliminado_por UUID REFERENCES usuarios(id) NULL;

      ALTER TABLE tickets_corporativos ADD COLUMN IF NOT EXISTS eliminado_en TIMESTAMP WITH TIME ZONE NULL;
      ALTER TABLE tickets_corporativos ADD COLUMN IF NOT EXISTS eliminado_por UUID REFERENCES usuarios(id) NULL;
      ALTER TABLE tickets_corporativos ADD COLUMN IF NOT EXISTS asignados JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE tickets_corporativos ALTER COLUMN departamento TYPE TEXT;

      ALTER TABLE catalogo_repuestos ADD COLUMN IF NOT EXISTS eliminado_en TIMESTAMP WITH TIME ZONE NULL;
      ALTER TABLE catalogo_repuestos ADD COLUMN IF NOT EXISTS eliminado_por UUID REFERENCES usuarios(id) NULL;

      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS departamento VARCHAR(100) NULL;
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cargo VARCHAR(100) NULL;
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cumpleanos VARCHAR(100) NULL;

      -- Departamentos corporativos con privilegios de módulo
      CREATE TABLE IF NOT EXISTS departamentos (
          id SERIAL PRIMARY KEY,
          nombre VARCHAR(100) UNIQUE NOT NULL,
          descripcion TEXT NULL,
          permisos JSONB NOT NULL DEFAULT '{}'::jsonb,
          creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      INSERT INTO departamentos (nombre, descripcion, permisos) VALUES
      ('Presidencia y Dirección', 'Alta dirección corporativa y aprobación de inversiones estratégicas', '{"ver_inicio": true, "editar_inicio": true, "ver_operaciones": true, "editar_operaciones": true, "ver_procura": true, "editar_procura": true, "emitir_sello_ceo": true, "ver_catalogos": true, "editar_catalogos": true, "ver_almacen": true, "editar_almacen": true, "ver_reportes": true, "editar_reportes": true, "ver_usuarios": true, "editar_usuarios": true, "ver_auditoria": true, "editar_auditoria": true}'),
      ('Operaciones y Mantenimiento', 'Gestión de flota, talleres, órdenes de trabajo y mecánicos', '{"ver_inicio": true, "editar_inicio": false, "ver_operaciones": true, "editar_operaciones": true, "ver_procura": false, "editar_procura": false, "ver_catalogos": true, "editar_catalogos": false, "ver_almacen": true, "editar_almacen": false, "ver_reportes": true, "editar_reportes": false, "ver_usuarios": false, "editar_usuarios": false, "ver_auditoria": false, "editar_auditoria": false}'),
      ('Procura e Importaciones', 'Expedientes de compra internacional, matriz comparativa y cotizaciones', '{"ver_inicio": true, "editar_inicio": true, "ver_operaciones": false, "editar_operaciones": false, "ver_procura": true, "editar_procura": true, "emitir_sello_ceo": false, "ver_catalogos": true, "editar_catalogos": true, "ver_almacen": false, "editar_almacen": false, "ver_reportes": true, "editar_reportes": true, "ver_usuarios": false, "editar_usuarios": false, "ver_auditoria": false, "editar_auditoria": false}'),
      ('Administración y Finanzas', 'Control presupuestario, auditoría de gastos y gestión de recursos humanos', '{"ver_inicio": true, "editar_inicio": true, "ver_operaciones": true, "editar_operaciones": false, "ver_procura": true, "editar_procura": false, "ver_catalogos": true, "editar_catalogos": true, "ver_almacen": true, "editar_almacen": true, "ver_reportes": true, "editar_reportes": true, "ver_usuarios": true, "editar_usuarios": true, "ver_auditoria": true, "editar_auditoria": true}'),
      ('Almacén y Repuestos', 'Custodia de insumos, clasificación de piezas y despacho de inventario', '{"ver_inicio": false, "editar_inicio": false, "ver_operaciones": false, "editar_operaciones": false, "ver_procura": false, "editar_procura": false, "ver_catalogos": true, "editar_catalogos": true, "ver_almacen": true, "editar_almacen": true, "ver_reportes": true, "editar_reportes": false, "ver_usuarios": false, "editar_usuarios": false, "ver_auditoria": false, "editar_auditoria": false}')
      ON CONFLICT (nombre) DO NOTHING;

      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS departamento_id INTEGER REFERENCES departamentos(id) ON DELETE SET NULL;

      -- Sincronizar usuarios existentes que ya tengan el texto de departamento
      UPDATE usuarios u 
      SET departamento_id = d.id 
      FROM departamentos d 
      WHERE u.departamento_id IS NULL AND u.departamento IS NOT NULL AND LOWER(TRIM(u.departamento)) = LOWER(TRIM(d.nombre));
    `);

    // Inicializar sincronización automática de tasa cambiaria (BCV / DolarApi)
    await ExchangeRateService.initialize();

    console.log('✅ Esquema de base de datos verificado y actualizado con éxito.');
  } catch (err) {
    console.error('❌ Error al verificar/actualizar esquema de base de datos:', err);
  }

  app.listen(PORT, () => {
    console.log(`===========================================================`);
    console.log(`🚀 SERVIDOR ACTIVO DE GESTIÓN DE ACTIVOS Y MANTENIMIENTO    `);
    console.log(`   Puerto: ${PORT}                                         `);
    console.log(`   Modo: ${process.env.NODE_ENV || 'development'}           `);
    console.log(`===========================================================`);
  });
}

bootstrap();
