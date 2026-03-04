// Script para convertir un usuario en administrador
// Ejecutar con: node scripts/make-admin.mjs tu_email@gmail.com

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { modeloUsuario } from '../models/modeloUsuario.js';

dotenv.config();

const email = process.argv[2];

if (!email) {
  console.error('❌ Debes proporcionar un email');
  console.log('Uso: node scripts/make-admin.mjs tu_email@gmail.com');
  process.exit(1);
}

console.log('\n========== CONVERTIR USUARIO EN ADMIN ==========\n');

async function hacerAdmin() {
  try {
    await mongoose.connect(process.env.DATABASE);
    console.log('✅ Conectado a MongoDB');
    
    const usuario = await modeloUsuario.findOne({ 
      email: email.toLowerCase().trim() 
    });
    
    if (!usuario) {
      console.error(`❌ No se encontró usuario con email: ${email}`);
      await mongoose.disconnect();
      process.exit(1);
    }
    
    console.log(`\n📄 Usuario encontrado:`);
    console.log(`   Nombre: ${usuario.nombre} ${usuario.apellido}`);
    console.log(`   Email: ${usuario.email}`);
    console.log(`   Rol actual: ${usuario.rol}`);
    
    if (usuario.rol === 'admin') {
      console.log('\n✅ Este usuario ya es administrador');
      await mongoose.disconnect();
      process.exit(0);
    }
    
    usuario.rol = 'admin';
    await usuario.save();
    
    console.log('\n✅✅✅ ¡Usuario convertido en ADMIN exitosamente!');
    console.log('   Ahora recibirás notificaciones por email cuando haya nuevas reservas');
    
    await mongoose.disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

hacerAdmin();
