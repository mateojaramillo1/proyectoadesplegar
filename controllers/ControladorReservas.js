import { ServicioReserva } from "../services/ServicioReserva.js";
import { ServicioUsuario } from "../services/ServicioUsuario.js";
import { ServicioCorreo } from "../services/ServicioCorreo.js";
import { ServicioHabitacion } from "../services/ServicioHabitacion.js";

function validarDatosReserva(datosReserva) {
  // Validar que las fechas estén presentes
  if (!datosReserva.fechainicio || !datosReserva.fechafin) {
    return "Las fechas de ingreso y salida son obligatorias";
  }

  // Convertir a Date para comparación correcta
  const fechaInicio = new Date(datosReserva.fechainicio);
  const fechaFin = new Date(datosReserva.fechafin);

  // Validar que sean fechas válidas
  if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
    return "Las fechas deben estar en formato válido (YYYY-MM-DD)";
  }

  // Validar que la fecha de ingreso no sea mayor que la de salida
  if (fechaInicio >= fechaFin) {
    return "La fecha de ingreso debe ser menor a la fecha de salida";
  }

  if (datosReserva.numeroniños > 0 && datosReserva.numeroadultos === 0) {
    return "No pueden ingresar niños solos, se requiere un adulto";
  }

  return null;
}

export class ControladorReservas {
  constructor() {}

  async registrandoReservas(peticion, respuesta) {
    let objetoServicioReserva = new ServicioReserva();
    try {
      // require authenticated user to create reservation so it is linked to their account
      if (!peticion.usuario || !peticion.usuario.id) {
        return respuesta.status(401).json({ mensaje: 'Debe iniciar sesión para crear una reserva' });
      }

      let datosReserva = peticion.body || {};
      // link reservation to user
      datosReserva.usuario = peticion.usuario.id;

      // override name/contact with user info (if available) to ensure reservation is under their name
      const servicioUsuario = new ServicioUsuario();
      const usuario = await servicioUsuario.buscarPorId(peticion.usuario.id);
      if (usuario) {
        datosReserva.nombre = usuario.nombre;
        datosReserva.apellido = usuario.apellido;
        if (!datosReserva.telefono) datosReserva.telefono = usuario.telefono || '';
      }

      const errorValidacion = validarDatosReserva(datosReserva);
      if (errorValidacion) {
        return respuesta.status(400).json({ mensaje: errorValidacion });
      }

      // Verificar disponibilidad de la habitación para las fechas solicitadas
      const disponibilidad = await objetoServicioReserva.verificarDisponibilidad(
        datosReserva.idHabitacion,
        datosReserva.fechainicio,
        datosReserva.fechafin
      );

      if (!disponibilidad.disponible) {
        return respuesta.status(409).json({
          mensaje: 'La habitación no está disponible para las fechas seleccionadas. Ya existe una reserva pendiente o aprobada para esas fechas.',
          conflicto: true,
          fechasOcupadas: disponibilidad.reservasConflicto.map(r => ({
            fechainicio: r.fechainicio,
            fechafin: r.fechafin
          }))
        });
      }

      // Nueva reserva siempre empieza como pendiente
      datosReserva.estado = 'pendiente';
      datosReserva.pagoVerificado = false;

      // Guardar y devolver la reserva creada
      const reservaCreada = await objetoServicioReserva.registrar(datosReserva);
      
      // Enviar correos al usuario y al admin
      const servicioCorreo = new ServicioCorreo();
      const servicioHabitacion = new ServicioHabitacion();
      
      // Obtener datos de la habitación
      const habitacion = await servicioHabitacion.buscarPorId(datosReserva.idHabitacion);
      const nombreHabitacion = habitacion?.nombre || 'Habitación';
      
      // Preparar datos para los correos
      const datosParaCorreo = {
        idReserva: reservaCreada._id,
        habitacion: nombreHabitacion,
        fechainicio: datosReserva.fechainicio,
        fechafin: datosReserva.fechafin,
        noches: datosReserva.noches || 1,
        precioTotal: datosReserva.precioTotal || 0,
        metodoPago: datosReserva.metodoPago
      };
      
      const datosUsuario = {
        nombre: datosReserva.nombre,
        apellido: datosReserva.apellido,
        correo: usuario?.email || '',
        telefono: datosReserva.telefono
      };
      
      // Validar que el usuario tenga correo
      if (!datosUsuario.correo) {
        console.warn('⚠️ El usuario no tiene correo registrado, no se puede enviar confirmación');
      }
      
      // Obtener correos de todos los administradores registrados en el sistema
      const servicioUsuarioCorreo = new ServicioUsuario();
      const admins = await servicioUsuarioCorreo.obtenerTodosLosAdmins();
      const correosAdmin = admins.map(admin => admin.email).filter(email => email);
      
      console.log('═══════════════════════════════════════════════════');
      console.log('📧 INTENTO DE ENVÍO DE CORREOS');
      console.log('Usuario destino:', datosUsuario.correo);
      console.log('Nombre usuario:', datosUsuario.nombre, datosUsuario.apellido);
      console.log('Admins encontrados:', correosAdmin.length);
      console.log('Correos admins:', correosAdmin);
      console.log('EMAIL_USER configurado:', process.env.EMAIL_USER ? 'SÍ' : 'NO');
      console.log('EMAIL_PASSWORD configurado:', process.env.EMAIL_PASSWORD ? 'SÍ' : 'NO');
      console.log('═══════════════════════════════════════════════════');
      
      // En Vercel (serverless) es importante esperar esta promesa antes de responder
      // para evitar que la función termine y cancele el envío de correo.
      let correosEnviados = false;
      if (datosUsuario.correo) {
        try {
          correosEnviados = await servicioCorreo.enviarCorreoReserva(
            datosUsuario,
            datosParaCorreo,
            correosAdmin
          );

          if (correosEnviados) {
            console.log('✅✅✅ CORREOS ENVIADOS EXITOSAMENTE ✅✅✅');
          } else {
            console.warn('⚠️⚠️⚠️ PROBLEMA ENVIANDO CORREOS ⚠️⚠️⚠️');
          }
        } catch (err) {
          console.error('❌❌❌ ERROR AL ENVIAR CORREOS ❌❌❌');
          console.error('Mensaje:', err.message);
          console.error('Stack:', err.stack);
        }
      } else {
        console.error('❌ No se puede enviar correo: usuario sin email');
      }
      
      return respuesta.status(200).json({
        mensaje: "Reserva creada exitosamente. Su reserva está pendiente de aprobación hasta que se verifique el pago.",
        reserva: reservaCreada
      });

    } catch (error) {
      return respuesta.status(400).json({
        mensje: "fallamos en la operacion " + error,
      });
    }
  }

  async buscandoReserva(peticion, respuesta) {
    let objetoServicioReserva = new ServicioReserva();
    try {
      let idReserva = peticion.params.idreserva;
      respuesta.status(200).json({
        mensaje: "exito buscando la reserva",
        reserva: await objetoServicioReserva.buscarPorId(idReserva),
      });
    } catch (error) {
      respuesta.status(400).json({
        mensje: "fallamos en la operacion " + error,
      });
    }
  }

  async buscandoReservas(peticion, respuesta) {
    let objetoServicioReserva = new ServicioReserva();
    try {
      respuesta.status(200).json({
        mensaje: "exito buscando reservas",
        reservas: await objetoServicioReserva.buscarTodas(),
      });
    } catch (error) {
      respuesta.status(400).json({
        mensje: "fallamos en la operacion " + error,
      });
    }
  }

  async editandoReserva(peticion, respuesta) {
    let objetoServicioReserva = new ServicioReserva();
    try {
      let idReserva = peticion.params.idreserva;
      let datosReserva = peticion.body;
      await objetoServicioReserva.editar(idReserva, datosReserva);
      respuesta.status(200).json({
        mensaje: "exito editando reserva",
      });
    } catch (error) {
      respuesta.status(400).json({
        mensje: "fallamos en la operacion " + error,
      });
    }
  }

  async eliminandoReserva(peticion, respuesta) {
    let objetoServicioReserva = new ServicioReserva()

    try {
      let idReserva = peticion.params.idreserva;
      await objetoServicioReserva.eliminar(idReserva)
      respuesta.status(200).json({
        mensaje: "exito eliminando reserva",
      });
    } catch (error) {
      respuesta.status(400).json({
        mensje: "fallamos en la operacion " + error,
      });
    }
  }

  // Cambiar estado de reserva (solo admin)
  async cambiarEstadoReserva(peticion, respuesta) {
    let objetoServicioReserva = new ServicioReserva();
    try {
      // Solo admin puede cambiar estado (ya validado por middleware, pero doble check)
      if (!peticion.usuario || peticion.usuario.rol !== 'admin') {
        return respuesta.status(403).json({ mensaje: 'No autorizado' });
      }
      let idReserva = peticion.params.idreserva;
      let { estado } = peticion.body;
      if (!['pendiente', 'aprobada', 'rechazada'].includes(estado)) {
        return respuesta.status(400).json({ mensaje: 'Estado inválido' });
      }
      
      // Obtener la reserva antes de actualizar
      const reserva = await objetoServicioReserva.buscarPorId(idReserva);
      
      await objetoServicioReserva.editar(idReserva, { estado });
      
      // Si se aprueba, enviar correo al usuario
      if (estado === 'aprobada' && reserva && reserva.usuario) {
        const servicioCorreo = new ServicioCorreo();
        const servicioUsuario = new ServicioUsuario();
        const servicioHabitacion = new ServicioHabitacion();
        
        try {
          const usuario = await servicioUsuario.buscarPorId(reserva.usuario);
          const habitacion = await servicioHabitacion.buscarPorId(reserva.idHabitacion);
          
          if (usuario && usuario.email) {
            const datosParaCorreo = {
              idReserva: reserva._id,
              habitacion: habitacion?.nombre || 'Habitación',
              fechainicio: reserva.fechainicio,
              fechafin: reserva.fechafin
            };
            
            const datosUsuario = {
              nombre: usuario.nombre,
              apellido: usuario.apellido,
              correo: usuario.email
            };
            
            await servicioCorreo.enviarCorreoAprobacion(datosUsuario, datosParaCorreo);
          }
        } catch (errorCorreo) {
          console.error('Error al enviar correo de aprobación:', errorCorreo);
        }
      }
      
      respuesta.status(200).json({ mensaje: 'Estado actualizado' });
    } catch (error) {
      respuesta.status(400).json({ mensje: 'fallamos en la operacion ' + error });
    }
  }

  // Verificar pago de reserva (solo admin)
  async verificarPago(peticion, respuesta) {
    let objetoServicioReserva = new ServicioReserva();
    try {
      if (!peticion.usuario || peticion.usuario.rol !== 'admin') {
        return respuesta.status(403).json({ mensaje: 'No autorizado' });
      }
      let idReserva = peticion.params.idreserva;
      let { pagoVerificado } = peticion.body;
      await objetoServicioReserva.editar(idReserva, { pagoVerificado: !!pagoVerificado });
      respuesta.status(200).json({ mensaje: 'Pago actualizado' });
    } catch (error) {
      respuesta.status(400).json({ mensaje: 'fallamos en la operacion ' + error });
    }
  }

  // Obtener reservas del usuario actual
  async misReservas(peticion, respuesta) {
    let objetoServicioReserva = new ServicioReserva();
    try {
      if (!peticion.usuario || !peticion.usuario.id) {
        return respuesta.status(401).json({ mensaje: 'Debe iniciar sesión para ver sus reservas' });
      }
      const reservas = await objetoServicioReserva.buscarPorUsuario(peticion.usuario.id);
      respuesta.status(200).json({
        mensaje: 'Reservas encontradas',
        reservas: reservas
      });
    } catch (error) {
      respuesta.status(400).json({ mensaje: 'Error obteniendo reservas: ' + error });
    }
  }

  // Verificar disponibilidad de habitación
  async verificarDisponibilidad(peticion, respuesta) {
    let objetoServicioReserva = new ServicioReserva();
    try {
      const { idHabitacion, fechainicio, fechafin } = peticion.body;
      
      if (!idHabitacion || !fechainicio || !fechafin) {
        return respuesta.status(400).json({ 
          mensaje: 'Se requiere idHabitacion, fechainicio y fechafin' 
        });
      }

      const disponibilidad = await objetoServicioReserva.verificarDisponibilidad(
        idHabitacion,
        fechainicio,
        fechafin
      );

      respuesta.status(200).json({
        disponible: disponibilidad.disponible,
        mensaje: disponibilidad.disponible 
          ? 'La habitación está disponible para las fechas seleccionadas'
          : 'La habitación no está disponible para las fechas seleccionadas',
        fechasOcupadas: disponibilidad.disponible ? [] : disponibilidad.reservasConflicto.map(r => ({
          fechainicio: r.fechainicio,
          fechafin: r.fechafin
        }))
      });
    } catch (error) {
      respuesta.status(400).json({ mensaje: 'Error verificando disponibilidad: ' + error });
    }
  }
}
