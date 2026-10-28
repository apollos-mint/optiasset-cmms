import fs from 'fs';
import path from 'path';
import { db } from './config/db';

async function run() {
  console.log('Iniciando migración de base de datos...');
  
  // Buscar el archivo SQL en varias ubicaciones posibles
  const pathsToTry = [
    path.join(__dirname, '../../db/migration_roles.sql'),
    path.join(__dirname, '../db/migration_roles.sql'),
    path.join(process.cwd(), 'db/migration_roles.sql'),
    path.join(process.cwd(), '../db/migration_roles.sql'),
  ];
  
  let sqlPath = '';
  for (const p of pathsToTry) {
    if (fs.existsSync(p)) {
      sqlPath = p;
      break;
    }
  }
  
  if (!sqlPath) {
    console.error('Error: No se pudo encontrar el archivo migration_roles.sql');
    console.error('Rutas intentadas:', pathsToTry);
    process.exit(1);
  }
  
  console.log(`Archivo de migración encontrado en: ${sqlPath}`);
  
  try {
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Aplicando esquema base de roles...');
    await db.query(sqlContent);

    console.log('Aplicando extensiones de la tabla de usuarios (permisos y contraseña plana)...');
    await db.query(`
      -- 1. Agregar columna permisos a usuarios si no existe
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS permisos JSONB NOT NULL DEFAULT '{}'::jsonb;

      -- 2. Agregar columna contrasena_plana a usuarios si no existe
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS contrasena_plana VARCHAR(255) NULL;

      -- 3. Actualizar contraseñas planas por defecto para los usuarios iniciales (admin123)
      UPDATE usuarios SET contrasena_plana = 'admin123' WHERE contrasena_plana IS NULL;

      -- 4. Copiar permisos por defecto desde la tabla roles a la tabla usuarios para aquellos que estén vacíos
      UPDATE usuarios u 
      SET permisos = r.permisos 
      FROM roles r 
      WHERE u.rol = r.nombre AND (u.permisos = '{}'::jsonb OR u.permisos IS NULL);
    `);
    
    console.log('===========================================================');
    console.log('✅ ¡MIGRACIÓN COMPLETADA CON ÉXITO!');
    console.log('La tabla "roles" y las extensiones de "usuarios" han sido aplicadas.');
    console.log('===========================================================');
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error ejecutando la migración:', error);
    process.exit(1);
  }
}

run();
