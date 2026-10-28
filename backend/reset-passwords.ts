import { db } from './src/config/db';
import bcrypt from 'bcryptjs';

async function resetPasswords() {
  try {
    const localHash = await bcrypt.hash('admin123', 10);
    console.log(`[Bcrypt] Hash local generado para "admin123": ${localHash}`);
    
    // Actualizar todos los usuarios en la DB con el hash local
    await db.query('UPDATE usuarios SET contrasena_hash = $1', [localHash]);
    
    console.log('===========================================================');
    console.log('✅ ¡Contraseñas de usuarios actualizadas con éxito a "admin123"!');
    console.log('===========================================================');
    process.exit(0);
  } catch (error) {
    console.error('Error al actualizar las contraseñas:', error);
    process.exit(1);
  }
}

resetPasswords();
