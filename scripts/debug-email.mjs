// Script de debugging completo para correos
// Ejecutar con: node scripts/debug-email.mjs

import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import mongoose from 'mongoose';
import { modeloUsuario } from '../models/modeloUsuario.js';

dotenv.config();

console.log('\n========== DEBUGGING COMPLETO DE CORREOS ==========\n');

// 1. Verificar credenciales
console.log('1️⃣ CREDENCIALES:');
const emailUser = process.env.EMAIL_USER;
const emailPassword = process.env.EMAIL_PASSWORD;

if (!emailUser || emailUser === 'tu_correo@gmail.com') {
  console.error('❌ EMAIL_USER no configurado o por defecto');
  process.exit(1);
}
if (!emailPassword || emailPassword === 'tu_contraseña_app') {
  console.error('❌ EMAIL_PASSWORD no configurado o por defecto');
  process.exit(1);
}

console.log('✅ Credenciales encontradas');
console.log(`   Usuario: ${emailUser}`);

// 2. Probar conexión SMTP
console.log('\n2️⃣ CONECTANDO A GMAIL:');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailUser,
    pass: emailPassword
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Error conectando a Gmail:', error.message);
    console.log('\n💡 Soluciones:');
    console.log('   1. Verifica el usuario de Gmail sea correcto');
    console.log('   2. Verifica la contraseña de aplicación (no tu contraseña de Gmail)');
    console.log('   3. Genera nueva contraseña en: https://myaccount.google.com/apppasswords');
    console.log('   4. Asegúrate de tener verificación de 2 factores habilitada');
    process.exit(1);
  } else {
    console.log('✅ Gmail conectado correctamente');
  }
});

// 3. Verificar administradores en BD
console.log('\n3️⃣ VERIFICANDO ADMINISTRADORES EN BD:');
async function verificarAdmins() {
  try {
    await mongoose.connect(process.env.DATABASE);
    console.log('✅ Conectado a MongoDB');
    
    const admins = await modeloUsuario.find({ rol: 'admin' });
    
    if (admins.length === 0) {
      console.error('❌ No hay administradores registrados en la BD');
      console.log('\n   💡 Solución: Crea al menos un usuario con rol "admin"');
    } else {
      console.log(`✅ Encontrados ${admins.length} administrador(es):`);
      admins.forEach((admin, i) => {
        console.log(`   ${i + 1}. ${admin.nombre} - ${admin.email}`);
      });
    }
    
    // 4. Verificar usuarios normales
    console.log('\n4️⃣ USUARIOS REGISTRADOS:');
    const usuarios = await modeloUsuario.find({ rol: 'user' });
    
    if (usuarios.length === 0) {
      console.error('❌ No hay usuarios normales registrados');
      console.log('\n   💡 Solución: Crea una cuenta de usuario para hacer una prueba');
    } else {
      console.log(`✅ Encontrados ${usuarios.length} usuario(s):`);
      usuarios.forEach((user, i) => {
        const email = user.email || 'SIN EMAIL';
        console.log(`   ${i + 1}. ${user.nombre} - ${email}`);
      });
    }
    
    console.log('\n5️⃣ CHECKLIST ANTES DE HACER RESERVA:');
    console.log(`   ${admins.length > 0 ? '✅' : '❌'} Hay administradores registrados`);
    console.log(`   ${usuarios.length > 0 ? '✅' : '❌'} Hay usuarios registrados`);
    console.log(`   ✅ Credenciales de Gmail configuradas`);
    console.log(`   ✅ Conexión a Gmail exitosa`);
    
    if (admins.length > 0 && usuarios.length > 0) {
      console.log('\n✨ ¡Todo está listo! Ya puedes hacer una reserva y deberías recibir correos');
    } else {
      console.log('\n⚠️ Faltan algunos pasos antes de poder recibir correos');
    }
    
    await mongoose.disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message);
    console.log('\n💡 Soluciones:');
    console.log('   1. Verifica que MongoDB esté activo');
    console.log('   2. Verifica la URL de conexión en .env');
    console.log('   3. Si usas MongoDB Atlas, verifica tu IP esté en whitelist');
    process.exit(1);
  }
}

verificarAdmins();
