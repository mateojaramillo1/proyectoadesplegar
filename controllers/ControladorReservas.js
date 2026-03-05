import { ServicioReserva } from "../services/ServicioReserva.js";
import { ServicioUsuario } from "../services/ServicioUsuario.js";
import { ServicioCorreo } from "../services/ServicioCorreo.js";
import { ServicioHabitacion } from "../services/ServicioHabitacion.js";
import { ServicioAuditoria } from "../services/ServicioAuditoria.js";
import { normalizarTexto, validarObjectId, validarRangoFechas } from "../utils/validaciones.js";

function validarDatosReserva(datosReserva) {
  // Validar que las fechas estén presentes
  if (!datosReserva.fechainicio || !datosReserva.fechafin) {
    return "Las fechas de ingreso y salida son obligatorias";
  }

  const rango = validarRangoFechas(datosReserva.fechainicio, datosReserva.fechafin);
  if (!rango.ok) {
    return rango.mensaje;
  }

  if (!validarObjectId(datosReserva.idHabitacion)) {
    return "La habitación seleccionada es inválida";
  }

  const ninos = Number(datosReserva.numeroniños ?? datosReserva.numeroninos ?? 0);
  const adultos = Number(datosReserva.numeroadultos ?? 0);

  if (ninos > 0 && adultos === 0) {
    return "No pueden ingresar niños solos, se requiere un adulto";
  }

  if (adultos <= 0) {
    return "Debe existir al menos un adulto en la reserva";
  }

  return null;
}

export class ControladorReservas {
  constructor() {}

  async registrandoReservas(peticion, respuesta) {
    let objetoServicioReserva = new ServicioReserva();
    try {
      const auditoria = new ServicioAuditoria();
      // require authenticated user to create reservation so it is linked to their account
      if (!peticion.usuario || !peticion.usuario.id) {
        return respuesta.status(401).json({ mensaje: 'Debe iniciar sesión para crear una reserva' });
      }

      let datosReserva = peticion.body || {};
      datosReserva.telefono = normalizarTexto(datosReserva.telefono, 30);
      datosReserva.numeroninos = Number(datosReserva.numeroninos ?? datosReserva.numeroniños ?? 0);
      datosReserva.numeroniños = datosReserva.numeroninos;
      datosReserva.numeroadultos = Number(datosReserva.numeroadultos ?? 0);
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
      await auditoria.registrar(peticion, {
        evento: 'reserva.creada',
        entidad: 'reserva',
        entidadId: reservaCreada._id?.toString(),
        detalle: `Reserva creada para habitacion ${datosReserva.idHabitacion}`
      });
      
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
      
      // Enviar correos (esperamos para que funcione en Vercel serverless)
      if (datosUsuario.correo) {
        try {
          await servicioCorreo.enviarCorreoReserva(
            datosUsuario,
            datosParaCorreo,
            correosAdmin
          );
          console.log('✅ Correos enviados exitosamente');
        } catch (err) {
          console.error('❌ Error al enviar correos:', err.message);
        }
      }
      
      return respuesta.status(200).json({
        mensaje: "Reserva creada exitosamente. Su reserva está pendiente de aprobación hasta que se verifique el pago.",
        reserva: reservaCreada
      });

    } catch (error) {
      return respuesta.status(400).json({
        mensaje: "fallamos en la operacion " + error,
      });
    }
  }

  async buscandoReserva(peticion, respuesta) {
    let objetoServicioReserva = new ServicioReserva();
    try {
      let idReserva = peticion.params.idreserva;
      if (!validarObjectId(idReserva)) {
        return respuesta.status(400).json({ mensaje: 'Id de reserva invalido' });
      }
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
      const auditoria = new ServicioAuditoria();
      let idReserva = peticion.params.idreserva;
      if (!validarObjectId(idReserva)) {
        return respuesta.status(400).json({ mensaje: 'Id de reserva invalido' });
      }
      let datosReserva = peticion.body;
      await objetoServicioReserva.editar(idReserva, datosReserva);
      await auditoria.registrar(peticion, {
        evento: 'reserva.editada',
        entidad: 'reserva',
        entidadId: idReserva,
        detalle: 'Reserva editada por administrador'
      });
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
      const auditoria = new ServicioAuditoria();
      let idReserva = peticion.params.idreserva;
      if (!validarObjectId(idReserva)) {
        return respuesta.status(400).json({ mensaje: 'Id de reserva invalido' });
      }
      await objetoServicioReserva.eliminar(idReserva)
      await auditoria.registrar(peticion, {
        evento: 'reserva.eliminada',
        entidad: 'reserva',
        entidadId: idReserva,
        detalle: 'Reserva eliminada por administrador'
      });
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
      const auditoria = new ServicioAuditoria();
      // Solo admin puede cambiar estado (ya validado por middleware, pero doble check)
      if (!peticion.usuario || peticion.usuario.rol !== 'admin') {
        return respuesta.status(403).json({ mensaje: 'No autorizado' });
      }
      let idReserva = peticion.params.idreserva;
      if (!validarObjectId(idReserva)) {
        return respuesta.status(400).json({ mensaje: 'Id de reserva invalido' });
      }
      let { estado } = peticion.body;
      if (!['pendiente', 'aprobada', 'rechazada'].includes(estado)) {
        return respuesta.status(400).json({ mensaje: 'Estado inválido' });
      }
      
      // Obtener la reserva antes de actualizar
      const reserva = await objetoServicioReserva.buscarPorId(idReserva);
      
      // Si se aprueba, marcar pago como verificado
      const datosActualizar = { estado };
      if (estado === 'aprobada') {
        datosActualizar.pagoVerificado = true;
      }
      
      await objetoServicioReserva.editar(idReserva, datosActualizar);
      await auditoria.registrar(peticion, {
        evento: 'reserva.estado.cambiado',
        entidad: 'reserva',
        entidadId: idReserva,
        detalle: `Nuevo estado: ${estado}`
      });
      
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
      const auditoria = new ServicioAuditoria();
      if (!peticion.usuario || peticion.usuario.rol !== 'admin') {
        return respuesta.status(403).json({ mensaje: 'No autorizado' });
      }
      let idReserva = peticion.params.idreserva;
      if (!validarObjectId(idReserva)) {
        return respuesta.status(400).json({ mensaje: 'Id de reserva invalido' });
      }
      let { pagoVerificado } = peticion.body;
      await objetoServicioReserva.editar(idReserva, { pagoVerificado: !!pagoVerificado });
      await auditoria.registrar(peticion, {
        evento: 'reserva.pago.verificado',
        entidad: 'reserva',
        entidadId: idReserva,
        detalle: `pagoVerificado=${!!pagoVerificado}`
      });
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

  async dashboardAdmin(peticion, respuesta) {
    const objetoServicioReserva = new ServicioReserva();
    const servicioHabitacion = new ServicioHabitacion();

    try {
      if (!peticion.usuario || peticion.usuario.rol !== 'admin') {
        return respuesta.status(403).json({ mensaje: 'No autorizado' });
      }

      const desde = peticion.query.desde ? String(peticion.query.desde) : undefined;
      const hasta = peticion.query.hasta ? String(peticion.query.hasta) : undefined;
      const habitaciones = await servicioHabitacion.buscarTodas();

      const dashboard = await objetoServicioReserva.obtenerDashboardAdmin({
        desde,
        hasta,
        totalHabitaciones: habitaciones.length
      });

      return respuesta.status(200).json({
        mensaje: 'Dashboard cargado',
        ...dashboard
      });
    } catch (error) {
      return respuesta.status(400).json({ mensaje: 'Error obteniendo dashboard: ' + error.message });
    }
  }

  async disponibilidadMensualAdmin(peticion, respuesta) {
    const objetoServicioReserva = new ServicioReserva();

    try {
      if (!peticion.usuario || peticion.usuario.rol !== 'admin') {
        return respuesta.status(403).json({ mensaje: 'No autorizado' });
      }

      const idHabitacion = String(peticion.query.idHabitacion || '');
      const anio = Number(peticion.query.anio);
      const mes = Number(peticion.query.mes);

      if (!idHabitacion || !validarObjectId(idHabitacion)) {
        return respuesta.status(400).json({ mensaje: 'idHabitacion invalido' });
      }

      if (!anio || !mes || mes < 1 || mes > 12) {
        return respuesta.status(400).json({ mensaje: 'Debe enviar anio y mes validos' });
      }

      const disponibilidad = await objetoServicioReserva.obtenerDisponibilidadMensual(idHabitacion, anio, mes);
      return respuesta.status(200).json({
        mensaje: 'Disponibilidad mensual cargada',
        ...disponibilidad
      });
    } catch (error) {
      return respuesta.status(400).json({ mensaje: 'Error obteniendo disponibilidad mensual: ' + error.message });
    }
  }

  async exportarReservasAdmin(peticion, respuesta) {
    const objetoServicioReserva = new ServicioReserva();

    try {
      if (!peticion.usuario || peticion.usuario.rol !== 'admin') {
        return respuesta.status(403).json({ mensaje: 'No autorizado' });
      }

      const estado = peticion.query.estado ? String(peticion.query.estado) : 'todos';
      const pago = peticion.query.pago ? String(peticion.query.pago) : 'todos';
      const desde = peticion.query.desde ? String(peticion.query.desde) : undefined;
      const hasta = peticion.query.hasta ? String(peticion.query.hasta) : undefined;

      const csv = await objetoServicioReserva.exportarReservasCSV({ estado, pago, desde, hasta });
      const nombreArchivo = `reservas-${new Date().toISOString().slice(0, 10)}.csv`;

      respuesta.setHeader('Content-Type', 'text/csv; charset=utf-8');
      respuesta.setHeader('Content-Disposition', `attachment; filename=${nombreArchivo}`);
      return respuesta.status(200).send(csv);
    } catch (error) {
      return respuesta.status(400).json({ mensaje: 'Error exportando reservas: ' + error.message });
    }
  }
}
