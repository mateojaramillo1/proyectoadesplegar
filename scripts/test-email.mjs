// Script de prueba para verificar la configuración de correos
// Ejecutar con: node scripts/test-email.mjs

import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

// Cargar variables de entorno
dotenv.config();

console.log('\n========== PRUEBA DE CONFIGURACIÓN DE CORREOS ==========\n');

// Verificar variables de entorno
console.log('1️⃣ Verificando variables de entorno:');
const emailUser = process.env.EMAIL_USER;
const emailPassword = process.env.EMAIL_PASSWORD;
const emailFromName = process.env.EMAIL_FROM_NAME;

if (!emailUser) {
  console.error('❌ EMAIL_USER no está configurado');
} else {
  console.log(`✅ EMAIL_USER: ${emailUser}`);
}

if (!emailPassword) {
  console.error('❌ EMAIL_PASSWORD no está configurado');
} else {
  console.log(`✅ EMAIL_PASSWORD: ${emailPassword.substring(0, 5)}...***`);
}

if (!emailFromName) {
  console.error('❌ EMAIL_FROM_NAME no está configurado');
} else {
  console.log(`✅ EMAIL_FROM_NAME: ${emailFromName}`);
}

console.log('\n2️⃣ Configurando nodemailer...');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailUser,
    pass: emailPassword
  }
});

console.log('\n3️⃣ Probando conexión con Gmail...');

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Error en la conexión:', error.message);
    console.log('\n⚠️ Posibles soluciones:');
    console.log('1. Verifica que EMAIL_USER sea tu dirección de Gmail correcta');
    console.log('2. Verifica que EMAIL_PASSWORD sea la contraseña de aplicación (no tu contraseña de Gmail)');
    console.log('3. Genera una nueva contraseña en: https://myaccount.google.com/apppasswords');
    console.log('4. Ten verificación de dos factores habilitada en tu cuenta de Google');
    process.exit(1);
  } else if (success) {
    console.log('✅ Conexión establecida correctamente');
    console.log('\n✨ ¡Configuración de correos lista para usar!');
    console.log('\nAhora, cuando un usuario haga una reserva:');
    console.log('- Se le enviará un correo de confirmación');
    console.log('- Se enviará a todos los administradores registrados');
    process.exit(0);
  }
});
