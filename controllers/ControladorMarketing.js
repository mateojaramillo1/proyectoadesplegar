import { ServicioMarketing } from '../services/ServicioMarketing.js';
import { ServicioAuditoria } from '../services/ServicioAuditoria.js';

const servicioMarketing = new ServicioMarketing();

export class ControladorMarketing {
  /**
   * GET /admin/marketing/estadisticas
   * Obtiene estadísticas de todos los segmentos de clientes
   */
  static async obtenerEstadisticas(peticion, respuesta) {
    try {
      const estadisticas = await servicioMarketing.obtenerEstadisticasSegmentos();

      return respuesta.status(200).json({
        exito: true,
        estadisticas
      });
    } catch (error) {
      console.error('Error obteniendo estadísticas de marketing:', error);
      return respuesta.status(500).json({
        exito: false,
        mensaje: 'Error obteniendo estadísticas de marketing',
        error: error.message
      });
    }
  }

  /**
   * GET /admin/marketing/segmento/:segmento
   * Obtiene clientes de un segmento específico
   * Segmentos: 'oro', 'platino', 'plata', 'bronce', 'inactivos', 'nuevos', 'todos'
   */
  static async obtenerClientesSegmento(peticion, respuesta) {
    try {
      const { segmento } = peticion.params;

      const segmentosValidos = ['oro', 'platino', 'plata', 'bronce', 'inactivos', 'nuevos', 'todos'];
      
      if (!segmentosValidos.includes(segmento)) {
        return respuesta.status(400).json({
          exito: false,
          mensaje: `Segmento inválido. Opciones: ${segmentosValidos.join(', ')}`
        });
      }

      const clientes = await servicioMarketing.obtenerClientesPorSegmento(segmento);

      return respuesta.status(200).json({
        exito: true,
        segmento,
        total: clientes.length,
        clientes
      });
    } catch (error) {
      console.error('Error obteniendo clientes por segmento:', error);
      return respuesta.status(500).json({
        exito: false,
        mensaje: 'Error obteniendo clientes del segmento',
        error: error.message
      });
    }
  }

  /**
   * POST /admin/marketing/enviar-campania
   * Envía campaña de marketing a un segmento
   * Body: { segmento, asunto, tipoCampania, opciones }
   */
  static async enviarCampania(peticion, respuesta) {
    try {
      const { segmento, asunto, tipoCampania, opciones } = peticion.body;

      // Validaciones
      if (!segmento || !asunto || !tipoCampania) {
        return respuesta.status(400).json({
          exito: false,
          mensaje: 'Faltan datos: segmento, asunto y tipoCampania son requeridos'
        });
      }

      const segmentosValidos = ['oro', 'platino', 'plata', 'bronce', 'inactivos', 'nuevos', 'todos'];
      if (!segmentosValidos.includes(segmento)) {
        return respuesta.status(400).json({
          exito: false,
          mensaje: `Segmento inválido. Opciones: ${segmentosValidos.join(', ')}`
        });
      }

      const tiposValidos = ['descuento', 'reactivacion', 'agradecimiento', 'personalizado'];
      if (!tiposValidos.includes(tipoCampania)) {
        return respuesta.status(400).json({
          exito: false,
          mensaje: `Tipo de campaña inválido. Opciones: ${tiposValidos.join(', ')}`
        });
      }

      // Enviar campaña
      const resultado = await servicioMarketing.enviarCampania(
        segmento,
        asunto,
        tipoCampania,
        opciones || {}
      );

      // Registrar auditoría
      await ServicioAuditoria.registrar({
        accion: 'ENVIO_CAMPANIA_MARKETING',
        usuario: peticion.usuario?._id,
        detalles: {
          segmento,
          asunto,
          tipoCampania,
          enviados: resultado.enviados,
          fallos: resultado.fallos
        },
        ip: peticion.ip
      });

      return respuesta.status(200).json({
        exito: true,
        mensaje: `Campaña enviada exitosamente`,
        resultado
      });
    } catch (error) {
      console.error('Error enviando campaña:', error);
      return respuesta.status(500).json({
        exito: false,
        mensaje: 'Error enviando campaña de marketing',
        error: error.message
      });
    }
  }

  /**
   * POST /admin/marketing/vista-previa
   * Genera vista previa de un correo de marketing sin enviarlo
   * Body: { segmento, tipoCampania, opciones }
   */
  static async vistaPrevia(peticion, respuesta) {
    try {
      const { segmento, tipoCampania, opciones } = peticion.body;

      // Obtener un cliente de ejemplo del segmento
      const clientes = await servicioMarketing.obtenerClientesPorSegmento(segmento || 'oro');
      
      if (clientes.length === 0) {
        return respuesta.status(404).json({
          exito: false,
          mensaje: 'No hay clientes en este segmento para generar vista previa'
        });
      }

      const clienteEjemplo = clientes[0];

      // Generar HTML según tipo de campaña
      let htmlPreview = '';
      switch (tipoCampania) {
        case 'descuento':
          htmlPreview = servicioMarketing._generarHtmlDescuento(clienteEjemplo, opciones?.descuento || 15);
          break;
        case 'reactivacion':
          htmlPreview = servicioMarketing._generarHtmlReactivacion(clienteEjemplo, opciones?.descuento || 20);
          break;
        case 'agradecimiento':
          htmlPreview = servicioMarketing._generarHtmlAgradecimiento(clienteEjemplo);
          break;
        case 'personalizado':
          htmlPreview = servicioMarketing._generarHtmlPersonalizado(clienteEjemplo, opciones?.mensajePersonalizado);
          break;
        default:
          htmlPreview = servicioMarketing._generarHtmlGenerico(clienteEjemplo);
      }

      return respuesta.status(200).json({
        exito: true,
        htmlPreview,
        clienteEjemplo: {
          nombre: clienteEjemplo.nombre,
          nivel: clienteEjemplo.nivel,
          totalReservas: clienteEjemplo.totalReservas
        }
      });
    } catch (error) {
      console.error('Error generando vista previa:', error);
      return respuesta.status(500).json({
        exito: false,
        mensaje: 'Error generando vista previa',
        error: error.message
      });
    }
  }
}
