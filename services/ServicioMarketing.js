import { modeloReserva } from "../models/modeloReserva.js";
import { modeloUsuario } from '../models/modeloUsuario.js';
import { ServicioCorreo } from './ServicioCorreo.js';

export class ServicioMarketing {
  constructor() {
    this.servicioCorreo = new ServicioCorreo();
  }

  /**
   * Identifica clientes por segmento de fidelidad
   * @param {string} segmento - 'oro', 'platino', 'plata', 'bronce', 'todos'
   * @returns {Array} Lista de clientes con sus datos
   */
  async obtenerClientesPorSegmento(segmento) {
    try {
      // Obtener todos los usuarios clientes con sus reservas
      const usuarios = await modeloUsuario.find({ rol: 'cliente' }).lean();

      const clientesConDatos = await Promise.all(
        usuarios.map(async (usuario) => {
          const reservas = await modeloReserva.find({
            idusuario: usuario._id,
            estado: { $in: ['aprobada', 'finalizada'] }
          }).lean();

          const totalReservas = reservas.length;
          const gastoTotal = reservas.reduce((sum, r) => sum + (r.preciototal || 0), 0);
          const ultimaReserva = reservas.length > 0
            ? new Date(Math.max(...reservas.map(r => new Date(r.fechafin))))
            : null;

          // Calcular días desde última reserva
          const diasDesdeUltima = ultimaReserva
            ? Math.floor((Date.now() - ultimaReserva.getTime()) / (1000 * 60 * 60 * 24))
            : 999;

          // Determinar nivel de fidelidad
          let nivel = 'bronce';
          if (totalReservas >= 10) nivel = 'platino';
          else if (totalReservas >= 6) nivel = 'oro';
          else if (totalReservas >= 3) nivel = 'plata';

          return {
            _id: usuario._id,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            correo: usuario.correo,
            telefono: usuario.telefono,
            totalReservas,
            gastoTotal,
            ultimaReserva,
            diasDesdeUltima,
            nivel
          };
        })
      );

      // Filtrar por segmento solicitado
      if (segmento === 'todos') {
        return clientesConDatos;
      } else if (segmento === 'inactivos') {
        // Clientes que no han reservado en más de 180 días (6 meses)
        return clientesConDatos.filter(c => c.diasDesdeUltima > 180);
      } else if (segmento === 'nuevos') {
        // Clientes con 1-2 reservas
        return clientesConDatos.filter(c => c.totalReservas >= 1 && c.totalReservas <= 2);
      } else {
        // Filtrar por nivel específico: oro, platino, plata, bronce
        return clientesConDatos.filter(c => c.nivel === segmento);
      }
    } catch (error) {
      console.error('Error obteniendo clientes por segmento:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de todos los segmentos
   */
  async obtenerEstadisticasSegmentos() {
    try {
      const todosClientes = await this.obtenerClientesPorSegmento('todos');

      const platino = todosClientes.filter(c => c.nivel === 'platino');
      const oro = todosClientes.filter(c => c.nivel === 'oro');
      const plata = todosClientes.filter(c => c.nivel === 'plata');
      const bronce = todosClientes.filter(c => c.nivel === 'bronce');
      const inactivos = todosClientes.filter(c => c.diasDesdeUltima > 180);
      const nuevos = todosClientes.filter(c => c.totalReservas >= 1 && c.totalReservas <= 2);

      return {
        total: todosClientes.length,
        platino: platino.length,
        oro: oro.length,
        plata: plata.length,
        bronce: bronce.length,
        inactivos: inactivos.length,
        nuevos: nuevos.length
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas de segmentos:', error);
      throw error;
    }
  }

  /**
   * Envía campaña de marketing a un segmento específico
   * @param {string} segmento - 'oro', 'platino', 'inactivos', etc.
   * @param {string} asunto - Asunto del correo
   * @param {string} tipoCampania - 'descuento', 'reactivacion', 'agradecimiento', 'personalizado'
   * @param {object} opciones - { descuento, mensajePersonalizado }
   */
  async enviarCampania(segmento, asunto, tipoCampania, opciones = {}) {
    try {
      const clientes = await this.obtenerClientesPorSegmento(segmento);

      if (clientes.length === 0) {
        return {
          exito: true,
          enviados: 0,
          fallos: 0,
          mensaje: 'No hay clientes en este segmento'
        };
      }

      let enviados = 0;
      let fallos = 0;

      for (const cliente of clientes) {
        try {
          let htmlCorreo;

          switch (tipoCampania) {
            case 'descuento':
              htmlCorreo = this._generarHtmlDescuento(cliente, opciones.descuento || 15);
              break;
            case 'reactivacion':
              htmlCorreo = this._generarHtmlReactivacion(cliente, opciones.descuento || 20);
              break;
            case 'agradecimiento':
              htmlCorreo = this._generarHtmlAgradecimiento(cliente);
              break;
            case 'personalizado':
              htmlCorreo = this._generarHtmlPersonalizado(cliente, opciones.mensajePersonalizado);
              break;
            default:
              htmlCorreo = this._generarHtmlGenerico(cliente);
          }

          const resultado = await this.servicioCorreo.enviarCorreoMarketing(
            cliente.correo,
            asunto,
            htmlCorreo
          );

          if (resultado) {
            enviados++;
          } else {
            fallos++;
          }

          // Pequeño delay para no sobrecargar el servidor de correo
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (errorCliente) {
          console.error(`Error enviando correo a ${cliente.correo}:`, errorCliente);
          fallos++;
        }
      }

      return {
        exito: true,
        enviados,
        fallos,
        total: clientes.length
      };

    } catch (error) {
      console.error('Error enviando campaña:', error);
      throw error;
    }
  }

  // Plantillas HTML para diferentes tipos de campañas

  _generarHtmlDescuento(cliente, porcentajeDescuento) {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: #f4f7ff; }
          .header { background: linear-gradient(135deg, #1124b3, #2942d1); color: white; padding: 30px; text-align: center; }
          .content { background: white; padding: 30px; }
          .badge { display: inline-block; background: linear-gradient(135deg, #ffd700, #ffed4e); color: #1124b3; padding: 15px 30px; border-radius: 50px; font-size: 24px; font-weight: bold; margin: 20px 0; }
          .descuento { background: linear-gradient(135deg, #ff6b6b, #ee5a52); color: white; padding: 25px; border-radius: 15px; text-align: center; margin: 25px 0; }
          .descuento-numero { font-size: 48px; font-weight: bold; margin: 10px 0; }
          .boton { display: inline-block; background: linear-gradient(135deg, #4caf50, #66bb6a); color: white; text-decoration: none; padding: 15px 40px; border-radius: 30px; font-size: 18px; margin: 20px 0; }
          .footer { background: #f9f9f9; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 ¡Oferta Exclusiva para Ti!</h1>
            <p>Paradisus Cancún</p>
          </div>
          <div class="content">
            <h2>Hola ${cliente.nombre} ${cliente.apellido},</h2>
            <p>Como cliente <strong>${this._getNombreNivel(cliente.nivel)}</strong>, queremos agradecerte tu lealtad con una oferta especial:</p>
            
            <div class="descuento">
              <div>🏖️ DESCUENTO EXCLUSIVO 🏖️</div>
              <div class="descuento-numero">${porcentajeDescuento}% OFF</div>
              <div>En tu próxima reserva</div>
            </div>

            <p style="text-align: center;">
              <a href="https://paradisuscancun.com/reservar" class="boton">Reservar Ahora</a>
            </p>

            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              ⏰ Esta oferta es válida por 30 días. No dejes pasar esta oportunidad de volver al paraíso.
            </p>

            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              📊 Tus estadísticas:<br>
              • Has realizado ${cliente.totalReservas} reserva(s)<br>
              • Gasto total: $${cliente.gastoTotal.toLocaleString('es-CO')}<br>
              • Nivel de fidelidad: ${this._getNombreNivel(cliente.nivel)}
            </p>
          </div>
          <div class="footer">
            <p>© 2026 Paradisus Cancún. Todos los derechos reservados.</p>
            <p>Este es un correo automático, por favor no respondas.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  _generarHtmlReactivacion(cliente, porcentajeDescuento) {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: #f4f7ff; }
          .header { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 30px; text-align: center; }
          .content { background: white; padding: 30px; }
          .nostalgia { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .descuento { background: linear-gradient(135deg, #f093fb, #f5576c); color: white; padding: 25px; border-radius: 15px; text-align: center; margin: 25px 0; }
          .descuento-numero { font-size: 48px; font-weight: bold; margin: 10px 0; }
          .boton { display: inline-block; background: linear-gradient(135deg, #4caf50, #66bb6a); color: white; text-decoration: none; padding: 15px 40px; border-radius: 30px; font-size: 18px; margin: 20px 0; }
          .footer { background: #f9f9f9; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💙 Te extrañamos en Paradisus</h1>
            <p>¡Vuelve a vivir la experiencia!</p>
          </div>
          <div class="content">
            <h2>Hola ${cliente.nombre},</h2>
            <p>Han pasado ${cliente.diasDesdeUltima} días desde tu última visita a Paradisus Cancún y te extrañamos mucho.</p>
            
            <div class="nostalgia">
              <p><strong>🌴 ¿Recuerdas...?</strong></p>
              <p>El sonido de las olas, las puestas de sol inolvidables, la tranquilidad de nuestras playas... Todo eso te está esperando.</p>
            </div>

            <p>Para que vuelvas pronto, tenemos una oferta especial de reactivación:</p>

            <div class="descuento">
              <div>🎁 OFERTA DE REACTIVACIÓN 🎁</div>
              <div class="descuento-numero">${porcentajeDescuento}% OFF</div>
              <div>Solo para ti</div>
            </div>

            <p style="text-align: center;">
              <a href="https://paradisuscancun.com/reservar" class="boton">Volver al Paraíso</a>
            </p>

            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              ⏰ Esta oferta especial es válida por 30 días.<br>
              📞 Si necesitas ayuda para reservar, llámanos al +52 998 123 4567
            </p>
          </div>
          <div class="footer">
            <p>© 2026 Paradisus Cancún. Todos los derechos reservados.</p>
            <p>Este es un correo automático, por favor no respondas.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  _generarHtmlAgradecimiento(cliente) {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: #f4f7ff; }
          .header { background: linear-gradient(135deg, #f093fb, #f5576c); color: white; padding: 30px; text-align: center; }
          .content { background: white; padding: 30px; }
          .agradecimiento { background: linear-gradient(135deg, #ffecd2, #fcb69f); padding: 25px; border-radius: 15px; text-align: center; margin: 25px 0; }
          .stats { display: flex; justify-content: space-around; margin: 25px 0; }
          .stat { text-align: center; }
          .stat-numero { font-size: 36px; font-weight: bold; color: #1124b3; }
          .stat-label { color: #666; font-size: 14px; }
          .footer { background: #f9f9f9; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❤️ ¡Gracias por tu Lealtad!</h1>
            <p>Paradisus Cancún</p>
          </div>
          <div class="content">
            <h2>Querido ${cliente.nombre} ${cliente.apellido},</h2>
            <p>Queremos tomarnos un momento para agradecerte por elegir Paradisus Cancún como tu destino de descanso.</p>
            
            <div class="agradecimiento">
              <h3 style="margin-top: 0;">🏆 Cliente ${this._getNombreNivel(cliente.nivel).toUpperCase()}</h3>
              <p style="font-size: 18px;">Tu preferencia nos llena de orgullo</p>
            </div>

            <div class="stats">
              <div class="stat">
                <div class="stat-numero">${cliente.totalReservas}</div>
                <div class="stat-label">Reservas</div>
              </div>
              <div class="stat">
                <div class="stat-numero">$${Math.floor(cliente.gastoTotal / 1000)}K</div>
                <div class="stat-label">Invertido</div>
              </div>
              <div class="stat">
                <div class="stat-numero">${this._getEmoji(cliente.nivel)}</div>
                <div class="stat-label">Nivel</div>
              </div>
            </div>

            <p>Gracias a clientes como tú, Paradisus Cancún sigue siendo el destino preferido para quienes buscan una experiencia inolvidable.</p>

            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              💙 Seguimos trabajando para ofrecerte el mejor servicio y las mejores instalaciones.<br>
              📧 Si tienes sugerencias, escribenos a feedback@paradisuscancun.com
            </p>
          </div>
          <div class="footer">
            <p>© 2026 Paradisus Cancún. Todos los derechos reservados.</p>
            <p>Este es un correo automático, por favor no respondas.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  _generarHtmlPersonalizado(cliente, mensajePersonalizado) {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: #f4f7ff; }
          .header { background: linear-gradient(135deg, #1124b3, #2942d1); color: white; padding: 30px; text-align: center; }
          .content { background: white; padding: 30px; }
          .mensaje { background: #f9f9f9; border-left: 4px solid #1124b3; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { background: #f9f9f9; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📩 Mensaje de Paradisus Cancún</h1>
          </div>
          <div class="content">
            <h2>Hola ${cliente.nombre} ${cliente.apellido},</h2>
            
            <div class="mensaje">
              ${mensajePersonalizado || '<p>Tenemos noticias importantes para ti...</p>'}
            </div>

            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              📞 Para más información, contáctanos al +52 998 123 4567<br>
              📧 O escríbenos a info@paradisuscancun.com
            </p>
          </div>
          <div class="footer">
            <p>© 2026 Paradisus Cancún. Todos los derechos reservados.</p>
            <p>Este es un correo automático, por favor no respondas.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  _generarHtmlGenerico(cliente) {
    return this._generarHtmlDescuento(cliente, 10);
  }

  _getNombreNivel(nivel) {
    const nombres = {
      platino: 'Platino',
      oro: 'Oro',
      plata: 'Plata',
      bronce: 'Bronce'
    };
    return nombres[nivel] || 'Cliente';
  }

  _getEmoji(nivel) {
    const emojis = {
      platino: '💎',
      oro: '🏆',
      plata: '⭐',
      bronce: '🥉'
    };
    return emojis[nivel] || '👤';
  }
}
