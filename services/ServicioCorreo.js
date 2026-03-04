import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export class ServicioCorreo {
  constructor() {
    // Validar que existan las variables de entorno
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;

    if (!emailUser || emailUser === 'tu_correo@gmail.com') {
      console.warn('⚠️ ADVERTENCIA: EMAIL_USER no está configurado correctamente en .env');
    }
    if (!emailPassword || emailPassword === 'tu_contraseña_app') {
      console.warn('⚠️ ADVERTENCIA: EMAIL_PASSWORD no está configurado correctamente en .env');
    }

    // Configurar el transporte de nodemailer
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPassword
      }
    });

    // Verificar la conexión con Gmail
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('❌ Error en la configuración de correo:', error.message);
      } else if (success) {
        console.log('✅ Servidor de correo configurado correctamente');
      }
    });
  }

  async enviarCorreoReserva(datosUsuario, datosReserva, correosAdmin = []) {
    try {
      const { nombre, apellido, correo, telefono } = datosUsuario;
      const { idReserva, habitacion, fechainicio, fechafin, noches, precioTotal, metodoPago } = datosReserva;

      if (!correo) {
        console.error('❌ No hay correo de usuario');
        return false;
      }

      // Formatear fechas
      const fechaInicio = new Date(fechainicio).toLocaleDateString('es-CO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const fechaFin = new Date(fechafin).toLocaleDateString('es-CO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Correo al usuario
      const asuntoUsuario = `¡Reserva creada exitosamente! - Paradisus Cancún`;
      
      const htmlUsuario = `
        <!DOCTYPE html>
        <html dir="ltr" lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f4f7ff; }
            .header { background: linear-gradient(135deg, #1124b3, #2942d1); color: white; padding: 20px; border-radius: 12px 12px 0 0; text-align: center; }
            .content { background: white; padding: 30px; border-radius: 0 0 12px 12px; }
            .titulo { color: #1124b3; margin-bottom: 20px; }
            .seccion { margin: 20px 0; padding: 15px; background: #f9f9f9; border-left: 4px solid #1124b3; border-radius: 8px; }
            .dato-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
            .dato-label { font-weight: bold; color: #555; }
            .dato-valor { color: #1124b3; font-weight: bold; }
            .total { background: linear-gradient(135deg, #4caf50, #66bb6a); color: white; padding: 15px; border-radius: 8px; text-align: center; font-size: 18px; margin: 20px 0; }
            .nota { background: #e3f2fd; border: 1px solid #90caf9; color: #1565c0; padding: 12px; border-radius: 8px; font-size: 14px; margin: 15px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #eee; }
            .boton { display: inline-block; background: linear-gradient(135deg, #1124b3, #2942d1); color: white; text-decoration: none; padding: 12px 25px; border-radius: 25px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>¡Reserva Exitosa!</h1>
              <p>Paradisus Cancún</p>
            </div>
            <div class="content">
              <h2 class="titulo">Hola ${nombre} ${apellido},</h2>
              <p>Tu reserva ha sido registrada exitosamente. Aquí están los detalles:</p>

              <div class="seccion">
                <h3 style="color: #1124b3; margin-top: 0;">📅 Fechas de estadía</h3>
                <div class="dato-item">
                  <span class="dato-label">Llegada:</span>
                  <span class="dato-valor">${fechaInicio}</span>
                </div>
                <div class="dato-item">
                  <span class="dato-label">Salida:</span>
                  <span class="dato-valor">${fechaFin}</span>
                </div>
                <div class="dato-item">
                  <span class="dato-label">Noches:</span>
                  <span class="dato-valor">${noches}</span>
                </div>
              </div>

              <div class="seccion">
                <h3 style="color: #1124b3; margin-top: 0;">🏨 Información de la reserva</h3>
                <div class="dato-item">
                  <span class="dato-label">ID Reserva:</span>
                  <span class="dato-valor">${idReserva}</span>
                </div>
                <div class="dato-item">
                  <span class="dato-label">Habitación:</span>
                  <span class="dato-valor">${habitacion}</span>
                </div>
                <div class="dato-item">
                  <span class="dato-label">Método de pago:</span>
                  <span class="dato-valor">${metodoPago === 'efectivo' ? 'Efectivo (al llegar)' : 'Transferencia bancaria'}</span>
                </div>
                <div class="dato-item">
                  <span class="dato-label">Estado:</span>
                  <span class="dato-valor" style="color: #ff9800;">⏳ PENDIENTE</span>
                </div>
              </div>

              <div class="total">
                Total a pagar: $${precioTotal.toLocaleString('es-CO')} COP
              </div>

              ${metodoPago === 'transferencia' ? `
                <div class="nota">
                  <strong>⚠️ Próximo paso:</strong> Realiza la transferencia bancaria y envía el comprobante a admin@hotelparadisus.com para agilizar la aprobación de tu reserva.
                </div>
              ` : `
                <div class="nota">
                  <strong>💡 Próximo paso:</strong> El pago será realizado en efectivo al momento de tu llegada. Tu reserva estará pendiente de aprobación hasta entonces.
                </div>
              `}

              <div class="nota">
                <strong>📌 Estado de tu reserva:</strong> Puedes consultar el estado en cualquier momento iniciando sesión en nuestro portal y visitando la sección "Mis Reservas".
              </div>

              <p style="text-align: center;">
                <a href="https://www.hotelparadisuscancun.com/mis-reservas" class="boton">Ver mis reservas</a>
              </p>
            </div>
            <div class="footer">
              <p>Si tienes preguntas, contáctanos: admin@hotelparadisus.com | Teléfono: +57 300 000 0000</p>
              <p>© 2026 Paradisus Cancún. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await this.transporter.sendMail({
        from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_USER}>`,
        to: correo,
        subject: asuntoUsuario,
        html: htmlUsuario
      });

      console.log(`✅ Correo enviado al usuario: ${correo}`);

      // Correo al admin
      const asuntoAdmin = `[NUEVA RESERVA] ${nombre} ${apellido} - Paradisus Cancún`;
      
      const htmlAdmin = `
        <!DOCTYPE html>
        <html dir="ltr" lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f4f7ff; }
            .header { background: linear-gradient(135deg, #ff9800, #ffa726); color: white; padding: 20px; border-radius: 12px 12px 0 0; text-align: center; }
            .content { background: white; padding: 30px; border-radius: 0 0 12px 12px; }
            .titulo { color: #ff9800; margin-bottom: 20px; }
            .seccion { margin: 20px 0; padding: 15px; background: #f9f9f9; border-left: 4px solid #ff9800; border-radius: 8px; }
            .dato-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
            .dato-label { font-weight: bold; color: #555; }
            .dato-valor { color: #ff9800; font-weight: bold; }
            .total { background: linear-gradient(135deg, #ff9800, #ffa726); color: white; padding: 15px; border-radius: 8px; text-align: center; font-size: 18px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #eee; }
            .boton { display: inline-block; background: linear-gradient(135deg, #ff9800, #ffa726); color: white; text-decoration: none; padding: 12px 25px; border-radius: 25px; margin: 15px 0; }
            .estado-pendiente { background: #fff3e0; color: #e65100; padding: 8px 12px; border-radius: 6px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Nueva Solicitud de Reserva</h1>
              <p>Por favor, revisa los detalles y aprueba o rechaza</p>
            </div>
            <div class="content">
              <h2 class="titulo">Nueva Reserva Pendiente de Aprobación</h2>

              <div class="seccion">
                <h3 style="color: #ff9800; margin-top: 0;">👤 Información del huésped</h3>
                <div class="dato-item">
                  <span class="dato-label">Nombre:</span>
                  <span class="dato-valor">${nombre} ${apellido}</span>
                </div>
                <div class="dato-item">
                  <span class="dato-label">Correo:</span>
                  <span class="dato-valor">${correo}</span>
                </div>
                <div class="dato-item">
                  <span class="dato-label">Teléfono:</span>
                  <span class="dato-valor">${telefono}</span>
                </div>
              </div>

              <div class="seccion">
                <h3 style="color: #ff9800; margin-top: 0;">📅 Detalles de la reserva</h3>
                <div class="dato-item">
                  <span class="dato-label">ID Reserva:</span>
                  <span class="dato-valor">${idReserva}</span>
                </div>
                <div class="dato-item">
                  <span class="dato-label">Habitación:</span>
                  <span class="dato-valor">${habitacion}</span>
                </div>
                <div class="dato-item">
                  <span class="dato-label">Llegada:</span>
                  <span class="dato-valor">${fechaInicio}</span>
                </div>
                <div class="dato-item">
                  <span class="dato-label">Salida:</span>
                  <span class="dato-valor">${fechaFin}</span>
                </div>
                <div class="dato-item">
                  <span class="dato-label">Noches:</span>
                  <span class="dato-valor">${noches}</span>
                </div>
                <div class="dato-item">
                  <span class="dato-label">Método de pago:</span>
                  <span class="dato-valor">${metodoPago === 'efectivo' ? 'Efectivo (al llegar)' : 'Transferencia bancaria'}</span>
                </div>
                <div class="dato-item">
                  <span class="dato-label">Estado:</span>
                  <span><span class="estado-pendiente">⏳ PENDIENTE</span></span>
                </div>
              </div>

              <div class="total">
                Monto de la reserva: $${precioTotal.toLocaleString('es-CO')} COP
              </div>

              <p style="text-align: center;">
                <a href="https://www.hotelparadisuscancun.com/admin/reservas" class="boton">Revisar en el panel de admin</a>
              </p>

              <p><strong>⏰ Acción requerida:</strong> Por favor, revisa esta solicitud en el panel de administración y aprueba o rechaza según corresponda. Si es pago por transferencia, verifica el comprobante antes de aprobar.</p>
            </div>
            <div class="footer">
              <p>© 2026 Paradisus Cancún. Sistema de gestión de reservas.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Enviar a todos los admins registrados
      if (correosAdmin && correosAdmin.length > 0) {
        for (const correoAdmin of correosAdmin) {
          try {
            await this.transporter.sendMail({
              from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_USER}>`,
              to: correoAdmin,
              subject: asuntoAdmin,
              html: htmlAdmin
            });
            console.log(`✅ Correo enviado al admin: ${correoAdmin}`);
          } catch (errorAdmin) {
            console.error(`❌ Error enviando correo al admin ${correoAdmin}:`, errorAdmin.message);
          }
        }
      } else {
        console.warn('⚠️ No hay administradores registrados');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error enviando correos:', error.message);
      return false;
    }
  }

  async enviarCorreoAprobacion(datosUsuario, datosReserva) {
    try {
      const { nombre, apellido, correo } = datosUsuario;
      const { idReserva, habitacion, fechainicio, fechafin } = datosReserva;

      const fechaInicio = new Date(fechainicio).toLocaleDateString('es-CO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const fechaFin = new Date(fechafin).toLocaleDateString('es-CO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const asunto = `¡Tu reserva ha sido aprobada! - Paradisus Cancún`;
      
      const html = `
        <!DOCTYPE html>
        <html dir="ltr" lang="es">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f4f7ff; }
            .header { background: linear-gradient(135deg, #4caf50, #66bb6a); color: white; padding: 20px; border-radius: 12px 12px 0 0; text-align: center; }
            .content { background: white; padding: 30px; border-radius: 0 0 12px 12px; }
            .titulo { color: #2e7d32; margin-bottom: 20px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ ¡Tu reserva ha sido aprobada!</h1>
            </div>
            <div class="content">
              <h2 class="titulo">¡Excelente, ${nombre}!</h2>
              <p>Tu reserva ha sido aprobada y confirmada. Te esperamos en Paradisus Cancún.</p>
              <p><strong>ID Reserva:</strong> ${idReserva}</p>
              <p><strong>Habitación:</strong> ${habitacion}</p>
              <p><strong>Fechas:</strong> ${fechaInicio} al ${fechaFin}</p>
            </div>
            <div class="footer">
              <p>© 2026 Paradisus Cancún</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await this.transporter.sendMail({
        from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_USER}>`,
        to: correo,
        subject: asunto,
        html: html
      });

      console.log(`✅ Correo de aprobación enviado a: ${correo}`);
      return true;
    } catch (error) {
      console.error('❌ Error enviando correo de aprobación:', error);
      return false;
    }
  }
}
