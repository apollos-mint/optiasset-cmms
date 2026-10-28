DO $$
DECLARE
    v_vehiculo_id UUID;
    v_mecanico_id UUID;
    v_chofer_id UUID;
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'checklists' AND column_name = 'id' AND data_type = 'uuid'
    ) THEN
        -- 1. Vaciar las tablas para limpiar UUIDs
        TRUNCATE TABLE insumos_orden CASCADE;
        TRUNCATE TABLE ordenes_servicio CASCADE;
        TRUNCATE TABLE checklists CASCADE;
        TRUNCATE TABLE logs_auditoria CASCADE;

        -- 1b. Quitar vistas dependientes
        DROP VIEW IF EXISTS vista_costos_orden CASCADE;

        -- 2. Quitar constraint
        ALTER TABLE insumos_orden DROP CONSTRAINT IF EXISTS insumos_orden_orden_id_fkey;

        -- 3. Cambiar tipos de columna
        ALTER TABLE checklists ALTER COLUMN id DROP DEFAULT;
        ALTER TABLE checklists ALTER COLUMN id TYPE VARCHAR(100);

        ALTER TABLE ordenes_servicio ALTER COLUMN id DROP DEFAULT;
        ALTER TABLE ordenes_servicio ALTER COLUMN id TYPE VARCHAR(100);

        ALTER TABLE insumos_orden ALTER COLUMN orden_id TYPE VARCHAR(100);

        -- 4. Crear secuencias
        CREATE SEQUENCE IF NOT EXISTS checklist_id_seq START WITH 1;
        CREATE SEQUENCE IF NOT EXISTS order_id_seq START WITH 1;

        -- 5. Poner defaults
        ALTER TABLE checklists ALTER COLUMN id SET DEFAULT ('CHKLST-' || lpad(nextval('checklist_id_seq')::text, 8, '0'));
        ALTER TABLE ordenes_servicio ALTER COLUMN id SET DEFAULT ('RPRTSRVC-' || lpad(nextval('order_id_seq')::text, 8, '0'));

        -- 6. Volver a poner constraint
        ALTER TABLE insumos_orden ADD CONSTRAINT insumos_orden_orden_id_fkey FOREIGN KEY (orden_id) REFERENCES ordenes_servicio(id) ON DELETE CASCADE;

        -- 6b. Volver a crear vista
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


        -- 7. Insertar semillas iniciales con los nuevos formatos simples
        SELECT id INTO v_vehiculo_id FROM activos WHERE datos_especificos->>'placa' = 'ABC-123' LIMIT 1;
        SELECT id INTO v_mecanico_id FROM usuarios WHERE nombre_usuario = 'mecanico1' LIMIT 1;
        SELECT id INTO v_chofer_id FROM usuarios WHERE nombre_usuario = 'chofer1' LIMIT 1;

        IF v_vehiculo_id IS NOT NULL AND v_chofer_id IS NOT NULL THEN
            -- Checklist 1
            INSERT INTO checklists (id, activo_id, usuario_id, kilometraje_registro, observaciones, respuestas_detalle)
            VALUES (
              'CHKLST-00000001', 
              v_vehiculo_id, 
              v_chofer_id, 
              55500.00, 
              'Revisión preventiva antes de ruta larga', 
              '{"niveles": {"aceite_motor": "Medio", "limpia_parabrisas": "Full", "refrigerante": "Full", "nivel_combustible": "Medio", "cantidad_combustible": "50"}, "fugas": {"aceite": "No", "combustible": "No", "refrigerante": "No", "otro": "No"}, "luces": {"freno": "Bueno", "bajas_carretera": "Malo", "altas_carretera": "Malo", "bombillos_quemados": "Bueno", "micas_rotas": "Malo", "faros_rotos": "Bueno", "luces_cruce": "Bueno"}}'::jsonb
            );
            
            -- Checklist 2
            INSERT INTO checklists (id, activo_id, usuario_id, kilometraje_registro, observaciones, respuestas_detalle)
            VALUES (
              'CHKLST-00000002', 
              v_vehiculo_id, 
              v_chofer_id, 
              55800.00, 
              'Control de rutina fin de semana', 
              '{"niveles": {"aceite_motor": "Full", "limpia_parabrisas": "Full", "refrigerante": "Full", "nivel_combustible": "Full", "cantidad_combustible": "80"}, "fugas": {"aceite": "No", "combustible": "No", "refrigerante": "No", "otro": "No"}, "luces": {"freno": "Bueno", "bajas_carretera": "Bueno", "altas_carretera": "Bueno", "bombillos_quemados": "Bueno", "micas_rotas": "Bueno", "faros_rotos": "Bueno", "luces_cruce": "Bueno"}}'::jsonb
            );
        END IF;

        IF v_vehiculo_id IS NOT NULL AND v_mecanico_id IS NOT NULL THEN
            INSERT INTO ordenes_servicio (id, activo_id, usuario_id, diagnostico, tasa_hora_taller, horas_taller, total_facturado, estado, kilometraje_registro)
            VALUES (
              'RPRTSRVC-00000001', 
              v_vehiculo_id, 
              v_mecanico_id, 
              'Reemplazo de bombillo quemado y corrección de mica rota', 
              30.00, 
              2.00, 
              60.00, 
              'Abierta', 
              55600.00
            );
        END IF;
    END IF;
END $$;
