// Script para enviar un correo de prueba directo
// Ejecutar con: node scripts/send-test-email.mjs

import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const emailUser = process.env.EMAIL_USER;
const emailPassword = process.env.EMAIL_PASSWORD;

console.log('\n========== ENVIANDO CORREO DE PRUEBA ==========\n');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailUser,
    pass: emailPassword
  }
});

// Enviar correo de prueba
const mailOptions = {
  from: `Paradisus Cancún <${emailUser}>`,
  to: 'teojaramillosuarez@gmail.com',  // Cambia esto por tu email
  subject: '✅ Correo de prueba - Paradisus Cancún',
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial; background: #f4f7ff; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 12px; }
        .header { background: linear-gradient(135deg, #1124b3, #2942d1); color: white; padding: 20px; border-radius: 12px; text-align: center; }
        .content { padding: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>¡Correo de Prueba!</h1>
        </div>
        <div class="content">
          <p>Si ves este correo, ¡la configuración está funcionando correctamente!</p>
          <p><strong>Configuración de Gmail:</strong></p>
          <ul>
            <li>De: ${emailUser}</li>
            <li>Para: teojaramillosuarez@gmail.com</li>
            <li>Hora: ${new Date().toLocaleString()}</li>
          </ul>
          <p>Ahora puedes hacer una reserva y deberías recibir los correos automáticamente.</p>
        </div>
      </div>
    </body>
    </html>
  `
};

console.log(`📧 Intentando enviar correo de prueba...`);
console.log(`   De: ${emailUser}`);
console.log(`   Para: teojaramillosuarez@gmail.com`);

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('\n❌ Error enviando correo:');
    console.error(error.message);
    
    console.log('\n💡 Soluciones posibles:');
    console.log('1. Verifica que la contraseña de aplicación sea correcta');
    console.log('2. Genera una nueva en: https://myaccount.google.com/apppasswords');
    console.log('3. Revisa que tengas verificación de 2 factores habilitada');
    console.log('4. Intenta cambiar el email de destino (a veces Gmail lo bloquea)');
    console.log('5. Espera un minuto y vuelve a intentar');
    
  } else {
    console.log('\n✅ ¡Correo enviado exitosamente!');
    console.log(`   ID: ${info.messageId}`);
    console.log('\n💡 Si no llega en 1-2 minutos:');
    console.log('   - Revisa la carpeta de SPAM');
    console.log('   - Revisa la carpeta de Promociones');
    console.log('   - Si sigue sin llegar, hay un problema con las credenciales');
  }
  
  process.exit(0);
});
